/**
 * app/api/moderate/route.ts
 * ─────────────────────────────────────────────────────────────
 * Main AI Moderation Pipeline
 *
 * Processing order per message:
 *   1.  Preprocess  → strip noise (lib/preprocessor)
 *   2.  Quality check → skip spam/low-quality completely
 *   3.  Load session state (lib/sessionState)
 *   4.  Backend scoring: reasoning score, novelty, duplicate (lib/scoring)
 *   5.  Duplicate / non-novel short-circuit → no AI call
 *   6.  Build thin context packet (lib/contextPacket) ← < 600 tokens
 *   7.  Call Groq with task-specific minimal prompt (lib/groq)
 *   8.  Insert AI response into messages_test
 *   9.  Update session state (ingest + auto-summarize every 8 msgs)
 *   10. Return
 *
 * The LLM ONLY receives the thin context packet.
 * It NEVER sees: full history, full graph, raw user messages.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

import { preprocessMessage, isLowQuality } from "@/lib/preprocessor";
import {
    computeReasoningScore, isDuplicate, isNovel,
    computeSessionMetrics
} from "@/lib/scoring";
import {
    getSessionState, saveSessionState, ingestMessage,
    buildBackendSummary, shouldSummarize
} from "@/lib/sessionState";
import { buildContextPacket, renderPacketToPrompt } from "@/lib/contextPacket";
import { callGroqTask } from "@/lib/groq";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ROOM_ID = "default-room"; // single room for now; expand later if needed

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { content, parent_id, username = "User", column_type: userType = "claim", room_id = "default-room" } = body;

        if (!content || typeof content !== "string") {
            return NextResponse.json({ error: "content is required" }, { status: 400 });
        }

        // ── Step 1: Preprocess ───────────────────────────────────
        const cleaned = preprocessMessage(content);

        // ── Step 2: Quality gate ─────────────────────────────────
        if (isLowQuality(cleaned)) {
            return NextResponse.json(
                { skipped: true, reason: "low_quality" },
                { status: 200 }
            );
        }

        // ── Step 3: Load session state ───────────────────────────
        const sessionState = await getSessionState(room_id);

        // ── Step 4: Backend scoring ──────────────────────────────
        // Gather existing message contents from the rolling window
        const existingContents = sessionState.last_messages.map((m) => m.content);

        const duplicate = isDuplicate(cleaned, existingContents);
        const novel = isNovel(cleaned, existingContents);

        // We'll compute the reasoning score AFTER we know the type,
        // so use a provisional placeholder type "claim" for now.
        const provisionalScore = computeReasoningScore(cleaned, "claim");

        // ── Step 5: Duplicate / non-novel short-circuit ──────────
        if (duplicate) {
            return NextResponse.json(
                { skipped: true, reason: "duplicate" },
                { status: 200 }
            );
        }

        // ── Step 6: Build thin context packet ────────────────────
        const sessionMetrics = computeSessionMetrics(
            sessionState.graph,
            sessionState.scores,
            sessionState.participation,
            sessionState.message_count
        );

        // Choose task: if recent history has counterarguments, check contradiction
        const hasRecentCounter = sessionState.last_messages
            .slice(-3)
            .some((m) => m.type === "counterargument");

        const task = hasRecentCounter ? "detect_contradiction" : "classify_and_feedback";

        const packet = buildContextPacket(sessionState, sessionMetrics, cleaned, task);
        const prompt = renderPacketToPrompt(packet);

        // ── Step 7: Groq AI call ─────────────────────────────────
        const aiResult = await callGroqTask(task, prompt);

        // Recompute reasoning score using the AI-determined type
        const finalScore = computeReasoningScore(cleaned, aiResult.type);
        const noveltyNote = novel ? "" : " [Similar idea already raised]";

        // ── Step 8: Insert AI response into Supabase ─────────────
        // IMPORTANT: AI response is ALWAYS column_type "question" — it always
        // asks a Socratic question. Using aiResult.type here was the bug that
        // scattered AI nodes into random columns (claim, evidence, etc.).
        const aiContent = [
            aiResult.short_feedback + noveltyNote,
            `👉 ${aiResult.guiding_question}`,
            ...(aiResult.contradicts
                ? [`⚠️ Contradiction: ${aiResult.contradiction_reason ?? ""}`]
                : []),
        ]
            .filter(Boolean)
            .join("\n\n");

        const { error: insertError } = await supabase.from("messages_test").insert({
            username: "AI-Moderator",
            content: aiContent,
            column_type: "question",   // ← always "question"; AI asks, never asserts
            x_pos: Math.random() * 400 + 100,
            y_pos: Math.random() * 400 + 180,
            parent_id,
            room_id,
        });

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            return NextResponse.json({ error: "Failed to save AI response" }, { status: 500 });
        }

        // ── Step 9: Update session state ─────────────────────────
        // Ingest user message
        let updatedState = ingestMessage(
            sessionState,
            {
                username,
                content: cleaned,
                type: aiResult.type,
                timestamp: new Date().toISOString(),
            },
            finalScore
        );

        // Ingest AI response
        updatedState = ingestMessage(
            updatedState,
            {
                username: "AI-Moderator",
                content: aiContent,
                type: aiResult.type,
                timestamp: new Date().toISOString(),
            },
            0  // AI response not scored
        );

        // Auto-summarize every 8 messages (pure backend)
        if (shouldSummarize(updatedState)) {
            updatedState.summary = buildBackendSummary(updatedState);
        }

        await saveSessionState({ ...updatedState, room_id });

        // ── Step 10: Return ──────────────────────────────────────
        return NextResponse.json({
            type: aiResult.type,
            short_feedback: aiResult.short_feedback,
            guiding_question: aiResult.guiding_question,
            contradicts: aiResult.contradicts ?? false,
            reasoning_score: finalScore,
            novel,
            discussion_stage: sessionMetrics.discussion_stage,
        });

    } catch (err) {
        console.error("Moderate API error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
