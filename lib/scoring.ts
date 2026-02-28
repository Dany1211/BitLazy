/**
 * lib/scoring.ts
 * ─────────────────────────────────────────────────────────────
 * Backend-only scoring engine.
 * ALL formulas run here — the LLM never computes these.
 */

// ── Vocabulary sets ──────────────────────────────────────────
const EVIDENCE_MARKERS = [
    "because", "since", "according to", "study", "data", "evidence",
    "shows", "demonstrates", "proves", "found that", "research",
    "statistics", "percentage", "report", "cited", "source",
];

const LOGIC_CONNECTORS = [
    "therefore", "however", "thus", "consequently", "although",
    "nevertheless", "furthermore", "in contrast", "on the other hand",
    "despite", "as a result", "given that", "it follows that",
];

const HEDGE_WORDS = [
    "maybe", "perhaps", "possibly", "might", "could be", "i think",
    "i feel", "seems", "appears", "probably",
];

// ── Reasoning score (0–10) ────────────────────────────────────
// Formula components:
//   base 4 pts — has substantive content (> 10 words)
//   +2 pts     — has evidence markers
//   +2 pts     — has logic connectors
//   -1 pt      — dominated by hedge words (> 2 hedges)
//   ±          — length penalty/bonus
export function computeReasoningScore(content: string, type: string): number {
    const lower = content.toLowerCase();
    const words = lower.split(/\s+/);
    const wordCount = words.length;

    let score = 0;

    // Base: substantive length
    if (wordCount >= 10) score += 2;
    if (wordCount >= 20) score += 1;
    if (wordCount > 80) score -= 1; // overly verbose

    // Evidence presence
    const evidenceHits = EVIDENCE_MARKERS.filter((m) => lower.includes(m)).length;
    score += Math.min(evidenceHits, 2);

    // Logical structure
    const logicHits = LOGIC_CONNECTORS.filter((m) => lower.includes(m)).length;
    score += Math.min(logicHits * 1.5, 2);

    // Hedge penalty
    const hedgeHits = HEDGE_WORDS.filter((m) => lower.includes(m)).length;
    if (hedgeHits > 2) score -= 1;

    // Type-specific bonus
    if (type === "synthesis") score += 1.5;   // synthesis is hard
    if (type === "evidence") score += 0.5;    // evidence is valuable

    return Math.max(0, Math.min(10, Math.round(score * 10) / 10));
}

// ── Novelty detection (simple keyword-diff approach) ──────────
// Returns false if > 60% of the top keywords overlap with existing messages.
export function isNovel(
    content: string,
    existingContents: string[]
): boolean {
    if (existingContents.length === 0) return true;

    const keywords = (text: string) =>
        new Set(
            text
                .toLowerCase()
                .replace(/[^a-z0-9\s]/g, "")
                .split(/\s+/)
                .filter((w) => w.length > 4) // only meaningful words
        );

    const newKw = keywords(content);
    if (newKw.size === 0) return true;

    // Check against last 5 messages only
    const recentMessages = existingContents.slice(-5);
    for (const existing of recentMessages) {
        const exKw = keywords(existing);
        const overlap = [...newKw].filter((k) => exKw.has(k)).length;
        const ratio = overlap / newKw.size;
        if (ratio > 0.65) return false; // too similar
    }

    return true;
}

// ── Duplicate detection (hash-based) ─────────────────────────
// Returns true if this message is likely an exact or near-exact duplicate.
function simpleHash(text: string): string {
    // Normalize: lowercase, strip punctuation, sort words
    const words = text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .sort();
    return words.join("|");
}

export function isDuplicate(
    content: string,
    existingContents: string[]
): boolean {
    const hash = simpleHash(content);
    return existingContents.slice(-10).some((e) => simpleHash(e) === hash);
}

// ── Participation imbalance (0 = balanced, 1 = one person dominates) ─
export function computeParticipationImbalance(
    participation: Record<string, number>
): number {
    const values = Object.values(participation);
    if (values.length < 2) return 0;
    const total = values.reduce((a, b) => a + b, 0);
    const max = Math.max(...values);
    return total === 0 ? 0 : parseFloat(((max / total) - 1 / values.length).toFixed(2));
}

// ── Discussion stage ──────────────────────────────────────────
export type DiscussionStage = "opening" | "developing" | "maturing" | "closing";

export function computeDiscussionStage(
    messageCount: number,
    claimCount: number,
    counterCount: number
): DiscussionStage {
    if (messageCount <= 4) return "opening";
    if (messageCount <= 12 && counterCount < 2) return "developing";
    if (counterCount >= 2 || claimCount >= 4) return "maturing";
    return "closing";
}

// ── Aggregate session metrics ─────────────────────────────────
export interface SessionMetrics {
    avg_reasoning_score: number;
    num_claims: number;
    num_evidence: number;
    num_counterarguments: number;
    num_questions: number;
    num_synthesis: number;
    participation_imbalance: number;
    unresolved_conflicts: number;    // counterargs with no following synthesis
    total_contributions: number;
    discussion_stage: DiscussionStage;
}

export function computeSessionMetrics(
    graph: Record<string, number>,
    scores: { depth_avg?: number; logic_issues?: number },
    participation: Record<string, number>,
    messageCount: number
): SessionMetrics {
    const claims = graph.claims ?? 0;
    const evidence = graph.evidence ?? 0;
    const counters = graph.counterarguments ?? 0;
    const questions = graph.questions ?? 0;
    const synthesis = graph.synthesis ?? 0;

    return {
        avg_reasoning_score: scores.depth_avg ?? 0,
        num_claims: claims,
        num_evidence: evidence,
        num_counterarguments: counters,
        num_questions: questions,
        num_synthesis: synthesis,
        participation_imbalance: computeParticipationImbalance(participation),
        unresolved_conflicts: Math.max(0, counters - synthesis),
        total_contributions: messageCount,
        discussion_stage: computeDiscussionStage(messageCount, claims, counters),
    };
}
