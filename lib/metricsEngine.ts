import { Message } from '@/hooks/useRealtimeMessages'

export interface RichEvaluation {
    global_grade: number
    live_advice: string
    user_grades: Record<string, number>
}

// Define the shape of AI scores
export interface AIScore {
    id: string
    message_id: string
    semantic_depth: number // 1 to 5
    logical_gap: boolean
    justification_type: string
    explanation: string
    rich_evaluation: RichEvaluation | null
    created_at: string
}

// -------------------------------------------------------------
// Old math metrics removed. We now derive global status from the 
// latest rich_evaluation payload injected by the AI evaluator.
// -------------------------------------------------------------

// -------------------------------------------------------------
// Intervention Logic (Deterministic thresholds for AI companion)
// -------------------------------------------------------------

export function shouldSageIntervene(
    messages: Message[],
    latestScore: AIScore,
    latestGlobalGrade: number
): { intervene: boolean, reason?: string } {

    // Don't spam: Check if Sage just spoke recently (within last 3 messages)
    const recentMessages = messages.slice(-3)
    if (recentMessages.some(m => m.is_ai || m.profiles?.name === 'Sage')) {
        return { intervene: false }
    }

    // 1. Explicit mention "@Sage"
    const latestMsg = messages[messages.length - 1]
    if (latestMsg?.content.toLowerCase().includes('@sage')) {
        return { intervene: true, reason: 'explicit_ping' }
    }

    // 2. Low Cognitive Health Crisis powered by AI grade
    // If the session has > 4 messages and AI grades the logic poorly, intervene
    if (messages.length > 4 && latestGlobalGrade < 60) {
        return { intervene: true, reason: 'low_cognitive_health_ai_grade' }
    }

    // 3. Logical Gap detected in the immediate message score
    if (latestScore?.logical_gap && !latestMsg?.is_ai && latestMsg?.profiles?.name !== 'Sage') {
        // 30% random chance to point it out so Sage isn't annoying
        if (Math.random() < 0.3) {
            return { intervene: true, reason: 'logical_gap_detected' }
        }
    }

    // 4. Echo chamber Check (simplified based on claims)
    const recentClaims = messages.slice(-6).filter(m => m.type === 'claim' || m.type === 'evidence')
    const recentCounters = messages.slice(-6).filter(m => m.type === 'counterargument')
    if (messages.length > 5 && recentClaims.length >= 4 && recentCounters.length === 0) {
        return { intervene: true, reason: 'echo_chamber' }
    }

    return { intervene: false }
}
