/**
 * lib/sessionState.ts
 * ─────────────────────────────────────────────────────────────
 * Session State Manager.
 * ONE JSON object per room in Supabase — replaces full history.
 * Updated continuously without ever storing the full conversation.
 */

import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ── Types ────────────────────────────────────────────────────

export interface SlimMessage {
    username: string;
    content: string;   // already preprocessed, trimmed
    type: string;
    timestamp: string;
}

export interface SessionState {
    room_id: string;
    topic: string;
    summary: string;
    graph: {
        claims: number;
        evidence: number;
        counterarguments: number;
        questions: number;
        synthesis: number;
    };
    scores: {
        depth_avg: number;
        logic_issues: number;
        score_history: number[];
    };
    participation: Record<string, number>;
    message_count: number;
    last_messages: SlimMessage[];  // rolling window of last 8 messages
}

const DEFAULT_STATE = (room_id: string): SessionState => ({
    room_id,
    topic: "Untitled Discussion",
    summary: "",
    graph: { claims: 0, evidence: 0, counterarguments: 0, questions: 0, synthesis: 0 },
    scores: { depth_avg: 0, logic_issues: 0, score_history: [] },
    participation: {},
    message_count: 0,
    last_messages: [],
});

// ── Fetch or create session state ─────────────────────────────
export async function getSessionState(room_id: string): Promise<SessionState> {
    const { data, error } = await supabase
        .from("session_state")
        .select("*")
        .eq("room_id", room_id)
        .single();

    if (error || !data) {
        return DEFAULT_STATE(room_id);
    }

    return {
        room_id: data.room_id,
        topic: data.topic ?? "Untitled Discussion",
        summary: data.summary ?? "",
        graph: data.graph ?? DEFAULT_STATE("").graph,
        scores: data.scores ?? DEFAULT_STATE("").scores,
        participation: data.participation ?? {},
        message_count: data.message_count ?? 0,
        last_messages: data.last_messages ?? [],
    };
}

// ── Persist session state ─────────────────────────────────────
export async function saveSessionState(state: SessionState): Promise<void> {
    await supabase.from("session_state").upsert(
        {
            room_id: state.room_id,
            topic: state.topic,
            summary: state.summary,
            graph: state.graph,
            scores: state.scores,
            participation: state.participation,
            message_count: state.message_count,
            last_messages: state.last_messages,
            updated_at: new Date().toISOString(),
        },
        { onConflict: "room_id" }
    );
}

// ── Ingest one new message into the session state ─────────────
// Called by the API route for EVERY message (user + AI).
export function ingestMessage(
    state: SessionState,
    msg: SlimMessage,
    reasoningScore: number
): SessionState {
    const s = structuredClone(state);

    // Update graph counters
    const typeKey = msg.type as keyof typeof s.graph;
    if (typeKey in s.graph) {
        (s.graph as any)[typeKey] = ((s.graph as any)[typeKey] ?? 0) + 1;
    }

    // Update participation (skip AI-Moderator)
    if (msg.username !== "AI-Moderator") {
        s.participation[msg.username] = (s.participation[msg.username] ?? 0) + 1;
    }

    // Update message count
    s.message_count += 1;

    // Rolling last_messages window (keep 8)
    s.last_messages = [...s.last_messages, msg].slice(-8);

    // Update running average reasoning score
    s.scores.score_history = [...(s.scores.score_history ?? []), reasoningScore].slice(-20);
    const hist = s.scores.score_history;
    s.scores.depth_avg = parseFloat(
        (hist.reduce((a, b) => a + b, 0) / hist.length).toFixed(2)
    );

    // Auto-detect topic from first claim/question
    if (s.topic === "Untitled Discussion" && (msg.type === "claim" || msg.type === "question")) {
        const words = msg.content.split(/\s+/).slice(0, 7).join(" ");
        s.topic = words.endsWith("?") ? words : words + "…";
    }

    return s;
}

// ── Backend summarizer ────────────────────────────────────────
// Triggered every 8 messages. Pure backend — no LLM.
// Produces a compact 1–2 sentence factual summary.
export function buildBackendSummary(state: SessionState): string {
    const { graph, participation, message_count, topic, scores } = state;
    const participants = Object.keys(participation);
    const topParticipant = participants.sort(
        (a, b) => (participation[b] ?? 0) - (participation[a] ?? 0)
    )[0];

    const parts: string[] = [];

    parts.push(`Topic: "${topic}".`);

    if (graph.claims > 0)
        parts.push(`${graph.claims} claim(s) made.`);
    if (graph.evidence > 0)
        parts.push(`${graph.evidence} evidence point(s) provided.`);
    if (graph.counterarguments > 0)
        parts.push(`${graph.counterarguments} counterargument(s) raised.`);
    if (graph.questions > 0)
        parts.push(`${graph.questions} open question(s) outstanding.`);
    if (graph.synthesis > 0)
        parts.push(`${graph.synthesis} synthesis node(s) connecting ideas.`);

    if (topParticipant)
        parts.push(`Most active: ${topParticipant} (${participation[topParticipant]} msgs).`);

    parts.push(`Avg reasoning depth: ${scores.depth_avg}/10.`);
    parts.push(`Total messages: ${message_count}.`);

    return parts.join(" ");
}

// ── Should auto-summarize? ────────────────────────────────────
// True every 8 messages to trigger a summary refresh.
export function shouldSummarize(state: SessionState): boolean {
    return state.message_count > 0 && state.message_count % 8 === 0;
}
