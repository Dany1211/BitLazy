import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClientInstance } from '@/utils/supabase'

// Initialize Groq Client
const ai = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: NextRequest) {
    try {
        const { sessionId } = await req.json()
        if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

        const supabase = await createServerClientInstance()

        // 1. Fetch Session Info
        const { data: sessionInfo } = await supabase
            .from('sessions')
            .select('title, problem_statement')
            .eq('id', sessionId)
            .single()

        // 2. Fetch all messages
        const { data: messages } = await supabase
            .from('messages')
            .select('content, type, profiles(name)')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })

        if (!messages || messages.length === 0) {
            return NextResponse.json({ error: 'Not enough messages to generate a summary.' }, { status: 400 })
        }

        const transcript = messages
            .map(m => `[${m.type.toUpperCase()}] ${(m.profiles as unknown as { name: string })?.name || 'User'}: ${m.content}`)
            .join('\n')

        const systemInstruction = `
You are a warm, insightful, and highly conversational AI mentor. A team has just finished a collaborative brainstorming session.
Their goal was to solve: "${sessionInfo?.problem_statement}"

Review the transcript and extract a beautiful, easy-to-understand summary of what the team accomplished. Keep your language highly personalized, friendly, and deeply analytical without sounding like a robot. 
You MUST respond strictly with a valid JSON object matching this exact structure, with no markdown formatting or extra text:

{
  "key_claims": ["claim 1", "claim 2", ...], // The absolute best "aha!" moments and core ideas the team came up with. Keep the sentences conversational.
  "supporting_evidence": ["evidence 1", ...], // The strongest real-world examples or logic they used to back those ideas up.
  "unresolved_disagreements": ["point 1", ...], // Where the team got stuck or couldn't quite agree, explained empathetically.
  "open_questions": ["question 1", ...] // The most exciting questions the team should tackle next to keep the momentum going!
}
`

        const prompt = `
TRANSCRIPT:
${transcript}
`

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: prompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.1,
            max_tokens: 1500,
        })

        const resultText = response.choices[0]?.message?.content
        if (!resultText) throw new Error('Failed to generate summary via DeepSeek')

        return NextResponse.json({ summary: JSON.parse(resultText) })

    } catch (error) {
        console.error('Session Summary Error:', error)
        return NextResponse.json({ error: 'Failed to generate session summary' }, { status: 500 })
    }
}
