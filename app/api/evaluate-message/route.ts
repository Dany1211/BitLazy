import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { createServerClientInstance } from '@/utils/supabase'
import { shouldSageIntervene, AIScore } from '@/lib/metricsEngine'

// Initialize Groq Client
const ai = new OpenAI({
    baseURL: 'https://api.groq.com/openai/v1',
    apiKey: process.env.GROQ_API_KEY,
})

// Sage's Immutable ID
const SAGE_ID = '00000000-0000-4000-8000-000000000000'

export async function POST(req: NextRequest) {
    console.log('\n🔵 [AI EVALUATOR] Received request to evaluate message (DeepSeek)...')
    try {
        const { messageId, isEdit } = await req.json()
        if (!messageId) return NextResponse.json({ error: 'Message ID required' }, { status: 400 })

        const supabase = await createServerClientInstance()

        // 1. Fetch the target message and its session context
        const { data: targetMessage } = await supabase
            .from('messages')
            .select('*, profiles(name), sessions(category, title)')
            .eq('id', messageId)
            .single()

        if (!targetMessage) return NextResponse.json({ error: 'Message not found' }, { status: 404 })

        // Ignore if Sage wrote it
        if (targetMessage.is_ai || targetMessage.user_id === SAGE_ID) return NextResponse.json({ ignored: true })

        // Fetch the last 15 messages in this session for context
        const { data: contextMessages } = await supabase
            .from('messages')
            .select('content, type, profiles(name)')
            .eq('session_id', targetMessage.session_id)
            .order('created_at', { ascending: false })
            .limit(15)

        const sessionHistory = (contextMessages || [])
            .reverse()
            .map(m => `[${m.type.toUpperCase()}] ${(m.profiles as unknown as { name: string })?.name || 'User'}: ${m.content}`)
            .join('\n')

        const sessionCategory = (targetMessage?.sessions as Record<string, unknown>)?.category || 'General';
        const sessionTitle = (targetMessage?.sessions as Record<string, unknown>)?.title || 'Discussion';

        // 2. Call DeepSeek via OpenRouter (Strict JSON)
        const systemInstruction = `
You are a brilliant, warm, and highly empathetic cognitive coach monitoring a team's collaboration session.
The current session category is: "${sessionCategory}".
The topic is: "${sessionTitle}".

CATEGORY-SPECIFIC GRADING RUBRICS:
- If Category is "Debate": Be incredibly rigorous. Punish logical fallacies, demand hard empirical data over personal opinions, and dock points for echo chambers.
- If Category is "Learning": Be exceptionally encouraging. Reward curiosity, foundational questions, and clearly articulated explanations even if they aren't groundbreaking.
- If Category is "DSA": Look for code efficiency, algorithmic time complexity discussion (Big-O), and architectural tradeoffs.
- If Category is "General": Reward creativity, outside-the-box thinking, and lateral problem solving.

Your goal is to evaluate the FINAL user message and the overall session, but you MUST speak to the users like a friendly, encouraging mentor. Use their names, be conversational, and make your analytical feedback incredibly easy to understand.
Make sure your grading heavily reflects the requirements of the "${sessionCategory}" category!

You MUST respond strictly with a valid JSON object matching this exact structure, with no markdown formatting or extra text:
{
  "semantic_depth": (1-5 integer representing cognitive depth according to the exact ${sessionCategory} rubric),
  "logical_gap": (boolean, true if there is a glaring logical fallacy or assumption given the ${sessionCategory} rules),
  "justification_type": (string, 1-3 conversational words: e.g., "Personal Experience", "Solid Data", "Curious Question", "Algorithm Tradeoff"),
  "explanation": (string, 1-2 friendly sentences explaining the score, speaking directly to the user by name if possible, e.g., "Great point Dany, but in a Debate, you need to back that up with some data!"),
  "global_grade": (0-100 integer evaluating overall logic, rigor, and healthy collaboration of the session based on the ${sessionCategory} standards),
  "live_advice": (string, a single, punchy, and highly encouraging piece of advice tailored to help them excel in this ${sessionCategory} session.),
  "user_grades": { "[User Name]": (0-100 integer representing their individual contribution health) } // CRITICAL: ONLY include names that actually appear in the session history. Do NOT invent names.
}
`

        const evalPrompt = `
Session History:
${sessionHistory}
---
Target Message to Evaluate:
[${targetMessage.type.toUpperCase()}] ${(targetMessage.profiles as unknown as { name: string })?.name || 'User'}: ${targetMessage.content}
`

        const response = await ai.chat.completions.create({
            model: 'llama-3.3-70b-versatile',
            messages: [
                { role: 'system', content: systemInstruction },
                { role: 'user', content: evalPrompt }
            ],
            response_format: { type: 'json_object' },
            temperature: 0.2,
            max_tokens: 800,
        })

        const evaluationText = response.choices[0]?.message?.content
        if (!evaluationText) throw new Error('No text returned from DeepSeek')

        const scoreData = JSON.parse(evaluationText)

        const richEvaluationPayload = {
            global_grade: scoreData.global_grade,
            live_advice: scoreData.live_advice,
            user_grades: scoreData.user_grades
        }

        // 3. Delete existing score if this is an edit
        if (isEdit) {
            const { error: deleteError } = await supabase
                .from('ai_scores')
                .delete()
                .eq('message_id', messageId)

            if (deleteError) console.error('Failed to delete old score on edit:', deleteError)
        }

        // 4. Insert Score into Database
        const { data: insertedScore, error: scoreError } = await supabase
            .from('ai_scores')
            .insert({
                message_id: messageId,
                semantic_depth: scoreData.semantic_depth,
                logical_gap: scoreData.logical_gap,
                justification_type: scoreData.justification_type,
                explanation: scoreData.explanation,
                rich_evaluation: richEvaluationPayload
            })
            .select()
            .single()

        if (scoreError) console.error('Failed to insert AI score:', scoreError)

        // 4. Run Deterministic Engine to Check Intervention
        // We need all messages and scores for the session to run the engine
        const { data: allMessages } = await supabase
            .from('messages')
            .select('*, profiles(name)')
            .eq('session_id', targetMessage.session_id)
            .order('created_at', { ascending: true })

        // Get all scores linked to these messages
        const messageIds = (allMessages || []).map(m => m.id)
        const { data: allScores } = await supabase
            .from('ai_scores')
            .select('*')
            .in('message_id', messageIds)
            .order('created_at', { ascending: false })

        // Get the latest global grade for Sage intervention
        const latestGlobalGrade = allScores && allScores.length > 0
            ? (allScores[0] as AIScore).rich_evaluation?.global_grade || 50
            : 50

        const interventionTrigger = shouldSageIntervene(
            allMessages || [],
            (insertedScore as AIScore),
            latestGlobalGrade
        )

        console.log(`🧠 [SAGE ENGINE] Checked Intervention:`, interventionTrigger)

        // 5. If Trigerred, generate Sage's response
        if (interventionTrigger.intervene && allMessages && allMessages.length > 0) {
            console.log(`🗣️ [SAGE] Wakeup Triggered! Reason: ${interventionTrigger.reason}`)
            const { data: sessionInfo } = await supabase
                .from('sessions')
                .select('problem_statement')
                .eq('id', targetMessage.session_id)
                .single()

            // Format full history for Sage
            const fullHistory = allMessages
                .map(m => `[${m.type.toUpperCase()}] ${(m.profiles as unknown as { name: string })?.name || 'User'}: ${m.content}`)
                .join('\n')

            const systemInstruction = `
You are Sage, a brilliant, intellectually humble, and highly encouraging AI coach sitting in on a team's collaborative session.
The participants are trying to master this topic: "${sessionInfo?.problem_statement || 'Unknown'}"

RULES:
1. THE SOCRATIC RULE: You must NEVER provide the final answer, solve the problem, or give away the solution. If a user asks for a question, provide ONLY a question related to the topic. Let them struggle and learn.
2. Keep your response strictly under 3 conversational sentences.
3. Speak to the team warmly and use their names if possible.
4. If you were triggered to intervene because of a logic gap or assumption, gently challenge them using the Socratic method.
5. Do NOT use markdown bolding or lists. Write in warm, clean, plain text.
---
SESSION HISTORY SO FAR:
${fullHistory}
`

            const sageResponse = await ai.chat.completions.create({
                model: 'llama-3.1-8b-instant', // Fast smaller model for quick Sage responses
                messages: [{ role: 'system', content: systemInstruction }],
                temperature: 0.7, // Need creativity here
                max_tokens: 300,
            })

            // Insert Sage's response
            const sageText = sageResponse.choices[0]?.message?.content
            if (sageText) {
                const generatedSageId = crypto.randomUUID()
                const { error: sageError } = await supabase.from('messages').insert({
                    id: generatedSageId,
                    session_id: targetMessage.session_id,
                    user_id: null,
                    content: sageText.trim(),
                    type: 'question', // Sage almost always asks questions
                    is_ai: true // Using the user's schema flag
                })
                if (sageError) {
                    console.error('❌ Failed to insert Sage message:', sageError)
                } else {
                    console.log(`✅ Sage message inserted successfully with ID: ${generatedSageId}`)
                }
            }
        }

        return NextResponse.json({ success: true, score: insertedScore, intervened: interventionTrigger.intervene })

    } catch (error) {
        console.error('AI Evaluation Error:', error)
        return NextResponse.json({ error: 'Failed to evaluate message' }, { status: 500 })
    }
}
