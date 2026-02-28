import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type, Schema } from '@google/genai'
import { createServerClientInstance } from '@/utils/supabase'

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

const summarySchema: Schema = {
    type: Type.OBJECT,
    properties: {
        key_claims: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The absolute most important foundational claims made during the session.',
        },
        supporting_evidence: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The strongest evidence provided to back up those claims.',
        },
        unresolved_disagreements: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Major points of contention or counterarguments that were not definitively settled.',
        },
        open_questions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'The best remaining questions that require further research to solve the problem.',
        }
    },
    required: ['key_claims', 'supporting_evidence', 'unresolved_disagreements', 'open_questions']
}

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

        const prompt = `
      You are an expert cognitive synthesizer. A team has just finished a structured collaboration session.
      Their goal was to solve: "${sessionInfo?.problem_statement}"
      
      Review the transcript and extract a highly rigorous knowledge construction summary.
      
      TRANSCRIPT:
      ${transcript}
    `

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: summarySchema,
                temperature: 0.1,
            },
        })

        const resultText = response.text
        if (!resultText) throw new Error('Failed to generate summary')

        return NextResponse.json({ summary: JSON.parse(resultText) })

    } catch (error) {
        console.error('Session Summary Error:', error)
        return NextResponse.json({ error: 'Failed to generate session summary' }, { status: 500 })
    }
}
