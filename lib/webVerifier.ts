import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY as string,
});

export interface FactCheckResult {
    is_factual: boolean;
    summary: string;
    citation: string | null;
}

export async function verifyClaimWithWebSearch(claimText: string): Promise<FactCheckResult> {
    try {
        console.log(`\n🔍 [WEB VERIFIER] Searching live web for claim: "${claimText}"...`);

        const prompt = `
You are an elite, impartial fact-checker. A user has made the following claim or provided the following evidence in a serious discussion:

"${claimText}"

Your job is to search the live web to verify if this is factually true, false, or misleading.

Respond strictly with a JSON object containing:
1. "is_factual": a boolean (true if the core claim is broadly supported by reliable sources, false if it is debunked or highly misleading).
2. "summary": a punchy 1-2 sentence summary of what the actual facts are according to your search.
3. "citation": a single, direct URL to the most authoritative source you found.

JSON Response only:
`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleSearch: {} }],
                responseMimeType: 'application/json',
                temperature: 0.1,
            }
        });

        const text = response.text || '';
        const data = JSON.parse(text) as FactCheckResult;

        console.log('✅ [WEB VERIFIER] Search complete:', data);
        return data;

    } catch (error) {
        console.error('❌ [WEB VERIFIER ERROR]', error);

        // Fallback gracefully if search fails
        return {
            is_factual: true,
            summary: "Web search verification failed. Proceeding with caution.",
            citation: null
        };
    }
}
