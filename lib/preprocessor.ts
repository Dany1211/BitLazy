/**
 * lib/preprocessor.ts
 * ─────────────────────────────────────────────────────────────
 * Pre-processes raw user messages BEFORE sending to the LLM.
 * Removes noise so the thin context packet stays tiny.
 * Pure backend logic — zero AI involved.
 */

// ── Filler phrase patterns ───────────────────────────────────
const FILLER_PATTERNS: RegExp[] = [
    // Greetings / openers
    /^(hi+|hey+|hello+|yo+|sup|hiya|howdy)[,!.\s]*/i,
    /^(okay|ok|k|yep|yeah|yup|sure|right|alright|gotcha)[,!.\s]*/i,
    /^(bro|dude|man|guys?|folks?)[,!.\s]*/i,
    /^(lol|lmao|haha|hehe|xd)[,!.\s]*/i,
    /^(hmm+|uhh?|umm?|err+|ugh)[,!.\s]*/i,
    /^(so+,?|well,?|like,?|basically,?|honestly,?)[,!.\s]*/i,

    // Inline hedges / filler
    /\b(I think maybe|I feel like|sort of|kind of|kinda|sorta)\b/gi,
    /\bi guess\b/gi,
    /\byou know\b/gi,
    /\bto be honest\b/gi,
    /\bif you ask me\b/gi,
    /\bjust saying\b/gi,
    /\blike i said\b/gi,
    /\btbh\b/gi,
    /\bimo\b/gi,
    /\bimho\b/gi,
    /\bngl\b/gi,
];

// ── Emoji regex (covers most Unicode emoji ranges) ───────────
const EMOJI_RE =
    /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FA9F}\u{FE00}-\u{FE0F}\u{1F000}-\u{1F02F}]+/gu;

// ── Sentence-level de-duplication ────────────────────────────
function deduplicateSentences(text: string): string {
    const sentences = text.match(/[^.!?]+[.!?]*/g) ?? [text];
    const seen = new Set<string>();
    const unique: string[] = [];
    for (const s of sentences) {
        const key = s.trim().toLowerCase().replace(/\s+/g, " ");
        if (key.length < 3) continue;
        if (!seen.has(key)) {
            seen.add(key);
            unique.push(s.trim());
        }
    }
    return unique.join(" ");
}

// ── Long-sentence compressor ──────────────────────────────────
// Truncates sentences over 40 words to 30 words (keeps meaning).
function compressLongSentences(text: string): string {
    return text
        .split(/(?<=[.!?])\s+/)
        .map((s) => {
            const words = s.trim().split(/\s+/);
            if (words.length > 40) return words.slice(0, 30).join(" ") + "…";
            return s;
        })
        .join(" ");
}

// ── Main export ───────────────────────────────────────────────
export function preprocessMessage(raw: string): string {
    let text = raw.trim();

    // 1. Remove emojis
    text = text.replace(EMOJI_RE, "").trim();

    // 2. Strip filler patterns (multipass, first remove leading patterns)
    for (const re of FILLER_PATTERNS) {
        text = text.replace(re, " ");
    }

    // 3. Collapse multiple spaces / newlines
    text = text.replace(/\s{2,}/g, " ").trim();

    // 4. Deduplicate sentences
    text = deduplicateSentences(text);

    // 5. Compress very long sentences
    text = compressLongSentences(text);

    // 6. Final trim
    text = text.trim();

    return text.length >= 3 ? text : raw.trim(); // fallback to raw if too stripped
}

/**
 * Returns true if the message is spam / low quality and should
 * be skipped without AI processing.
 */
export function isLowQuality(cleaned: string): boolean {
    if (cleaned.length < 8) return true;                      // too short
    if (/^(.)\1{4,}$/.test(cleaned)) return true;             // "aaaaa"
    if (/^[^a-zA-Z0-9]+$/.test(cleaned)) return true;        // only symbols
    const wordCount = cleaned.trim().split(/\s+/).length;
    if (wordCount < 2) return true;                           // single word
    return false;
}
