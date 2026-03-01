import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClientInstance } from '@/utils/supabase'

const ai = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
})

export async function POST(req: NextRequest) {
    console.log('\n🌟 [REVEAL ANSWER] Consensus reached. Generating master solution...')
    try {
        const { sessionId } = await req.json()
        if (!sessionId) return NextResponse.json({ error: 'Session ID required' }, { status: 400 })

        const supabase = await createServerClientInstance()

        // 1. Fetch Session Context
        const { data: sessionInfo } = await supabase
            .from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single()

        if (!sessionInfo) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

        // 2. Fetch Session History
        const { data: allMessages } = await supabase
            .from('messages')
            .select('*, profiles(name)')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: true })

        // Check for idempotency ONLY IF there are no new votes 
        // We allow multiple reveals if the team voted again later for a new topic
        const hasActiveVotes = (allMessages || []).some(m => m.content === '#VOTE_REVEAL#')
        const alreadyRevealed = (allMessages || []).some(m => m.is_ai && m.type === 'synthesis')

        if (alreadyRevealed && !hasActiveVotes) {
            return NextResponse.json({ success: true, message: 'Already revealed recently' })
        }

        const fullHistory = (allMessages || [])
            .filter(m => !m.is_ai && m.type !== 'vote_answer' && m.content !== '#VOTE_REVEAL#')
            .map(m => `[${m.type.toUpperCase()}] ${(m.profiles as unknown as { name: string })?.name || 'User'}: ${m.content}`)
            .join('\n')

        // 3. Prompt Sage to generate the beautiful master answer
        const systemInstruction = `
You are Sage, a brilliant and highly visual AI coach. The team has been working on understanding: "${sessionInfo.title} - ${sessionInfo.problem_statement}".
They have officially voted to reveal the final, master answer.

Your goal is to provide a STUNNING, Highly Structured, Step-by-Step explanation of the topic or problem they were discussing.
You MUST format this beautifully using Markdown. 

CRITICAL FORMATTING RULES:
1. Use engaging Emojis 🚀✨🧠 to break up text and add visual flair.
2. Use hierarchical headers (###) to separate distinct parts of the explanation.
3. Use heavily bolded text (**important concept**) for key terms.
4. Use Blockquotes (> Note:) for important callouts or tips.
5. Use Markdown Tables to compare concepts if applicable.
6. Use bullet points and numbered lists to make the answer highly readable.
7. Celebrate their effort and walk them through the exact solution or core concepts cleanly and elegantly.
8. Do NOT hold back anymore. Give them the absolute best, most comprehensive, and most beautiful illustrative answer possible.
`

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: `Here is the transcript of their struggle so far:\n${fullHistory}\n\nPlease generate the highly illustrative, beautiful master solution now.` }
            ],
            temperature: 0.5,
            max_tokens: 3000,
        })

        const masterAnswer = response.choices[0]?.message?.content
        if (!masterAnswer) throw new Error('No text returned from AI')

        // 4. Insert the final answer into the chat
        const generatedSageId = crypto.randomUUID()
        const { error: insertError } = await supabase.from('messages').insert({
            id: generatedSageId,
            session_id: sessionId,
            user_id: null,
            content: masterAnswer.trim(),
            type: 'synthesis', // Use synthesis format for the master answer
            is_ai: true
        })

        if (insertError) {
            console.error('Failed to insert the master answer:', insertError)
            return NextResponse.json({ error: 'Failed to save answer' }, { status: 500 })
        }

        // 5. CLEAR ALL VOTES so the session is ready for exactly what they asked: "reset the voting after every time answer is revealed"
        const { error: deleteError } = await supabase
            .from('messages')
            .delete()
            .eq('session_id', sessionId)
            .eq('content', '#VOTE_REVEAL#')

        if (deleteError) {
            console.error('Failed to clear votes after reveal:', deleteError)
            // Non-fatal, we still return success for the generated answer.
        }

        return NextResponse.json({ success: true, messageId: generatedSageId })

    } catch (error) {
        console.error('Reveal Answer Error:', error)
        return NextResponse.json({ error: 'Failed to generate answer' }, { status: 500 })
    }
}
