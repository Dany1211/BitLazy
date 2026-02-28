import { NextRequest, NextResponse } from 'next/server'
import { GoogleGenAI, Type, Schema } from '@google/genai'
import { createServerClientInstance } from '@/utils/supabase'
import { shouldSageIntervene, AIScore } from '@/lib/metricsEngine'

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY })

// Define the exact JSON schema we want Gemini to return
const evaluationSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        semantic_depth: {
            type: Type.INTEGER,
            description: 'Score from 1 to 5 evaluating the cognitive depth and reasoning quality of the message.',
        },
        logical_gap: {
            type: Type.BOOLEAN,
            description: 'True if there is a glaring logical fallacy, lack of evidence, or massive assumption.',
        },
        justification_type: {
            type: Type.STRING,
            description: 'A 1-3 word categorization of how they justified their point (e.g., Empirical, Anecdotal, Theoretical, Assertion).',
        },
        explanation: {
            type: Type.STRING,
            description: 'A one sentence explanation of the score.',
        },
        // NEW HYBRID FIELDS
        global_grade: {
            type: Type.INTEGER,
            description: 'A grade from 0 to 100 representing the overall logic, rigor, and healthy collaboration of the entire session history so far.',
        },
        live_advice: {
            type: Type.STRING,
            description: 'A single, punchy, actionable piece of advice for the participants right now (e.g., "The team is making huge assumptions about X" or "Dany needs to provide evidence").',
        },
        user_grades: {
            type: Type.OBJECT,
            description: 'A dictionary mapping each active participants name to their individual logic grade from 0 to 100.',
        }
    },
    required: ['semantic_depth', 'logical_gap', 'justification_type', 'explanation', 'global_grade', 'live_advice', 'user_grades'],
}

// Sage's Immutable ID
const SAGE_ID = '00000000-0000-4000-8000-000000000000'

export async function POST(req: NextRequest) {
    console.log('\n🔵 [AI EVALUATOR] Received request to evaluate message...')
    try {
        const { messageId } = await req.json()
        console.log(`🔵 [AI EVALUATOR] Processing messageId: ${messageId}`)
        if (!messageId) return NextResponse.json({ error: 'Message ID required' }, { status: 400 })

        const supabase = await createServerClientInstance()

        // 1. Fetch the target message and its session context
        const { data: targetMessage } = await supabase
            .from('messages')
            .select('*, profiles(name)')
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

        // 2. Call Gemini for Micro-Evaluation (Structured Output)
        const evalPrompt = `
      You are an expert cognitive evaluator monitoring an active collaboration session.
      Evaluate the FINAL message in this session history, but also evaluate the overall health of the debate.
      
      Session History:
      ${sessionHistory}
      ---
      Target Message to Evaluate:
      [${targetMessage.type.toUpperCase()}] ${(targetMessage.profiles as unknown as { name: string })?.name || 'User'}: ${targetMessage.content}
    `

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: evalPrompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: evaluationSchema,
                temperature: 0.2, // Be deterministic
            },
        })

        const evaluationText = response.text
        if (!evaluationText) throw new Error('No text returned from Gemini')

        const scoreData = JSON.parse(evaluationText)

        const richEvaluationPayload = {
            global_grade: scoreData.global_grade,
            live_advice: scoreData.live_advice,
            user_grades: scoreData.user_grades
        }

        // 3. Insert Score into Database
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
        You are Sage, an intellectually humble, Socratic facilitator in a structured collaboration app.
        The participants are trying to solve this problem: "${sessionInfo?.problem_statement || 'Unknown'}"
        
        RULES:
        1. Never provide the final answer or solve the problem.
        2. Keep your response strictly under 3 sentences.
        3. Be brief, suddenly introduce unexpected challenges, question underlying assumptions, and force the users to defend their logic.
        4. Do NOT use markdown bolding or lists. Write in clean plain text.
        5. You were triggered to intervene because of: ${interventionTrigger.reason}. Use this context to form your challenging question.
        ---
        SESSION HISTORY SO FAR:
        ${fullHistory}
      `

            const sageResponse = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: systemInstruction,
                config: {
                    temperature: 0.7, // Need creativity here
                }
            })

            // Insert Sage's response
            const sageText = sageResponse.text
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
