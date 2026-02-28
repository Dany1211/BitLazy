/**
 * lib/contextPacket.ts
 * ─────────────────────────────────────────────────────────────
 * Thin Context Packet Builder.
 * Constructs the MINIMAL payload sent to the LLM — this is the
 * sole gateway between the backend engine and Groq.
 *
 * Total budget: 300–600 tokens per call.
 *   Summary:      ~50  tokens
 *   Metrics:      ~70  tokens
 *   Last messages:~150 tokens (2–5 msgs, 20–30 words each)
 *   New message:  ~80  tokens
 *   Task:         ~10  tokens
 *   ─────────────────────────────
 *   Total:       ~360  tokens  ✓
 *
 * The LLM never sees: full conversation, full graph, raw history.
 */

import type { SessionState, SlimMessage } from "./sessionState";
import type { SessionMetrics } from "./scoring";

export type AITask =
    | "classify_and_feedback"   // standard moderation
    | "detect_contradiction"    // check if new msg contradicts recent ones
    | "generate_question";      // generate a Socratic question only

// ── Packet shape ─────────────────────────────────────────────
export interface ContextPacket {
    task: AITask;
    session_summary: string;   // ≤ 2 sentences
    metrics: Record<string, number | string>;  // ≤ 10 key-value pairs
    recent_messages: { role: string; text: string }[];  // 2–5 messages max
    new_message: string;     // only the latest message, preprocessed
}

// ── Builder ───────────────────────────────────────────────────
export function buildContextPacket(
    state: SessionState,
    metrics: SessionMetrics,
    newMessage: string,
    task: AITask
): ContextPacket {
    // Take only last 2–5 messages, trim each to ≤ 30 words
    const recentRaw = state.last_messages.slice(-5);
    const recent_messages = recentRaw.map((m: SlimMessage) => ({
        role: m.username === "AI-Moderator" ? "assistant" : "user",
        text: trimToWords(m.content, 30),
    }));

    // Compact metrics (10 key-values max)
    const compactMetrics: Record<string, number | string> = {
        claims: metrics.num_claims,
        evidence: metrics.num_evidence,
        counters: metrics.num_counterarguments,
        questions: metrics.num_questions,
        synthesis: metrics.num_synthesis,
        avg_score: metrics.avg_reasoning_score,
        participation: metrics.participation_imbalance,
        unresolved: metrics.unresolved_conflicts,
        total_msgs: metrics.total_contributions,
        stage: metrics.discussion_stage,
    };

    // Summary: prefer stored summary, else fallback placeholder
    const session_summary = state.summary
        ? trimToWords(state.summary, 40)
        : `Discussion: "${state.topic}". ${metrics.total_contributions} messages exchanged.`;

    return {
        task,
        session_summary,
        metrics: compactMetrics,
        recent_messages,
        new_message: trimToWords(newMessage, 80),
    };
}

// ── Render packet → prompt string ─────────────────────────────
// Converts the packet to the actual text injected into the LLM call.
export function renderPacketToPrompt(packet: ContextPacket): string {
    const metricsLine = Object.entries(packet.metrics)
        .map(([k, v]) => `${k}=${v}`)
        .join(", ");

    const historyLines = packet.recent_messages
        .map((m) => `[${m.role}]: ${m.text}`)
        .join("\n");

    const lines: string[] = [
        `CTX: ${packet.session_summary}`,
        `METRICS: ${metricsLine}`,
    ];

    if (historyLines) {
        lines.push(`HISTORY:\n${historyLines}`);
    }

    lines.push(`NEW: ${packet.new_message}`);
    lines.push(`TASK: ${packet.task}`);

    return lines.join("\n");
}

// ── Helper ────────────────────────────────────────────────────
function trimToWords(text: string, maxWords: number): string {
    const words = text.trim().split(/\s+/);
    if (words.length <= maxWords) return text.trim();
    return words.slice(0, maxWords).join(" ") + "…";
}
