/**
 * lib/groq.ts
 * ─────────────────────────────────────────────────────────────
 * Task-specific Groq API caller with strict minimal prompt templates.
 *
 * STRICT RULES enforced in every template:
 *   ✗  Do NOT share any facts, data, or domain knowledge
 *   ✗  Do NOT give solutions, explanations, or answers
 *   ✗  Do NOT teach or inform — you are NOT a tutor
 *   ✓  Only challenge the LOGIC or STRUCTURE of the argument
 *   ✓  Only ask ONE question that forces the user to justify themselves
 */

import Groq from "groq-sdk";
import type { AITask } from "./contextPacket";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── Types ─────────────────────────────────────────────────────
export interface ModeratorResponse {
    type: "claim" | "evidence" | "counterargument" | "question" | "synthesis";
    short_feedback: string;
    guiding_question: string;
    contradicts?: boolean;
    contradiction_reason?: string;
}

// ── Task-specific prompt templates ────────────────────────────
//
// HARD CONSTRAINTS baked into every template:
//   - max_tokens: 160 (prevents verbose hallucination)
//   - temperature: 0.1  (very deterministic)
//   - JSON only — no free text possible
//   - "short_feedback" must flag a LOGICAL GAP, never provide info
//   - "guiding_question" must be a question forcing the USER to justify

const TEMPLATES: Record<AITask, string> = {
    classify_and_feedback:
        `You are a logic referee. Your ONLY job: classify the argument type and expose ONE logical gap.
DO NOT share facts, domain knowledge, solutions, or information of any kind. Never answer the topic.
Output JSON: {"type":"claim|evidence|counterargument|question|synthesis","short_feedback":"<flag the gap, max 12 words, no facts>","guiding_question":"<one question forcing them to justify, max 12 words>"}`,

    detect_contradiction:
        `You are a logic referee checking for contradictions in reasoning structure only.
DO NOT share facts or domain knowledge. Only flag logical or structural conflicts.
Output JSON: {"contradicts":true|false,"reason":"<structural conflict, max 12 words>","type":"claim","short_feedback":"<flag the gap, max 12 words>","guiding_question":"<one justification question, max 12 words>"}`,

    generate_question:
        `You are a Socratic referee. Generate ONE question that exposes a gap in the user's reasoning.
DO NOT provide information, hints, or domain knowledge. Do not answer the topic.
Output JSON: {"type":"question","short_feedback":"Reasoning gap detected.","guiding_question":"<one sharp question, max 12 words>"}`,
};

// ── Main dispatcher ───────────────────────────────────────────
export async function callGroqTask(
    task: AITask,
    userPrompt: string
): Promise<ModeratorResponse> {
    const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        temperature: 0.1,   // near-deterministic → less hallucination
        max_tokens: 160,   // hard ceiling — prevents verbose responses
        response_format: { type: "json_object" },
        messages: [
            { role: "system", content: TEMPLATES[task] },
            { role: "user", content: userPrompt },
        ],
    });

    const raw = completion.choices[0]?.message?.content ?? "{}";

    try {
        const parsed: any = JSON.parse(raw);

        // Validate and hard-cap lengths (prevent the AI from sneaking in long text)
        const feedback = truncate(parsed.short_feedback || "Identify your reasoning basis.", 80);
        const question = truncate(parsed.guiding_question || "What evidence supports this?", 80);

        return {
            type: normalizeType(parsed.type),
            short_feedback: feedback,
            guiding_question: question,
            contradicts: parsed.contradicts,
            contradiction_reason: truncate(parsed.reason ?? "", 80),
        };
    } catch {
        return {
            type: "question",
            short_feedback: "Reasoning basis unclear.",
            guiding_question: "What evidence supports this claim?",
        };
    }
}

// ── Helpers ───────────────────────────────────────────────────

const VALID_TYPES = new Set(["claim", "evidence", "counterargument", "question", "synthesis"]);

function normalizeType(raw: string): ModeratorResponse["type"] {
    const t = (raw ?? "").toLowerCase().trim();
    return VALID_TYPES.has(t) ? (t as ModeratorResponse["type"]) : "question";
}

function truncate(text: string, maxChars: number): string {
    if (!text) return "";
    const t = text.trim();
    return t.length <= maxChars ? t : t.slice(0, maxChars).trimEnd() + "…";
}

// ── Legacy shim ───────────────────────────────────────────────
export async function moderateMessage(content: string): Promise<ModeratorResponse> {
    return callGroqTask("classify_and_feedback", `NEW: ${content}\nTASK: classify_and_feedback`);
}
