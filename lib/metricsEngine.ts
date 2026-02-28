import { Message } from '@/hooks/useRealtimeMessages'

// Define the shape of AI scores
export interface AIScore {
    id: string
    message_id: string
    semantic_depth: number // 1 to 5
    logical_gap: boolean
    justification_type: string
    explanation: string
    created_at: string
}

export interface SessionMetrics {
    participationFairness: number // 0 to 1
    counterargumentRatio: number // 0 to 1
    questionDensity: number // 0 to 1
    diversityIndex: number // 0 to 1
    depthTrend: number // -1 to 1 (negative is decreasing, positive is increasing)
    cognitiveHealth: number // 0 to 100 (composite)
}

export function computeSessionMetrics(messages: Message[], scores: AIScore[]): SessionMetrics {
    // 1. Base check
    if (messages.length === 0) {
        return {
            participationFairness: 0,
            counterargumentRatio: 0,
            questionDensity: 0,
            diversityIndex: 0,
            depthTrend: 0,
            cognitiveHealth: 0
        }
    }

    // 2. Participation Fairness Index
    // Gini coefficient basically, or variance of message counts per user
    const userCounts: Record<string, number> = {}
    messages.forEach(m => {
        // Ignore AI companion "Sage" mapping
        if (!m.is_ai && m.profiles?.name !== 'Sage') {
            userCounts[m.user_id] = (userCounts[m.user_id] || 0) + 1
        }
    })

    const activeUsers = Object.values(userCounts)
    let fairness = 0
    if (activeUsers.length > 1) {
        const total = activeUsers.reduce((a, b) => a + b, 0)
        const expected = total / activeUsers.length
        const variance = activeUsers.reduce((sum, count) => sum + Math.pow(count - expected, 2), 0) / activeUsers.length
        // Normalize fairness (1 is perfect equality, 0 is one person dominating)
        fairness = Math.max(0, 1 - (Math.sqrt(variance) / expected))
    } else if (activeUsers.length === 1) {
        fairness = 1 // One person talking to themselves is fair to themselves, but we'll cap it in cognitive health
    }

    // 3. Ratios (Counterarguments and Questions)
    const totalUserMessages = messages.filter(m => !m.is_ai && m.profiles?.name !== 'Sage').length || 1
    const counterargs = messages.filter(m => m.type === 'counterargument').length
    const questions = messages.filter(m => m.type === 'question').length

    const counterargumentRatio = Math.min(1, counterargs / totalUserMessages)
    const questionDensity = Math.min(1, questions / totalUserMessages)

    // 4. Diversity Index (Shannon entropy approximation for message types)
    const typeCounts: Record<string, number> = {}
    messages.forEach(m => {
        typeCounts[m.type] = (typeCounts[m.type] || 0) + 1
    })

    let diversityIndex = 0
    const types = Object.values(typeCounts)
    if (messages.length > 0) {
        let entropy = 0
        types.forEach(count => {
            const p = count / messages.length
            entropy -= p * Math.log2(p)
        })
        // Max entropy for 5 types is log2(5) ~ 2.32
        diversityIndex = Math.min(1, entropy / 2.32)
    }

    // 5. Depth Trend
    // We use the last 5 messages vs the 5 before that for trend analysis
    let depthTrend = 0
    if (scores.length >= 2) {
        const sortedScores = [...scores].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

        // Group into halves (recent vs older) to see direction of semantic depth
        const cutoff = Math.floor(sortedScores.length / 2)
        const older = sortedScores.slice(0, cutoff)
        const newer = sortedScores.slice(cutoff)

        const avgOlder = older.reduce((sum, s) => sum + s.semantic_depth, 0) / older.length
        const avgNewer = newer.reduce((sum, s) => sum + s.semantic_depth, 0) / (newer.length || 1)

        // Normalize between -1 and 1 (max difference is 4: 5 to 1 or 1 to 5)
        // Positive means getting deeper, negative means getting shallower
        depthTrend = (avgNewer - avgOlder) / 4
    } else if (scores.length === 1) {
        // Single score sets a slight positive or negative trend based on absolute value (3 is neutral)
        depthTrend = (scores[0].semantic_depth - 3) / 2
    }

    // 6. Cognitive Health Index
    // A weighted composite of the above metrics. 100 perfectly healthy collaborative session.
    // Ideal ratios: High participation fairness, ~20% counterarguments, ~15% questions, high diversity, positive depth trend
    const weights = {
        fairness: 25,
        counterargs: 20, // max points around 0.20 ratio
        questions: 15,   // max points around 0.15 density
        diversity: 20,
        depth: 20
    }

    let health = 0

    health += fairness * weights.fairness

    // Reward counterarguments peaking at 0.25
    const caScore = counterargumentRatio > 0.25 ? 1 : (counterargumentRatio / 0.25)
    health += caScore * weights.counterargs

    // Reward questions peaking at 0.2
    const qScore = questionDensity > 0.2 ? 1 : (questionDensity / 0.2)
    health += qScore * weights.questions

    health += diversityIndex * weights.diversity

    // Absolute depth and trend matter. 
    // We'll give baseline points for current average depth, plus trend points
    const avgDepth = scores.length > 0
        ? scores.reduce((sum, s) => sum + s.semantic_depth, 0) / scores.length
        : 3 // assumed neutral

    // Depth points (out of 20): 10 for absolute depth, 10 for trend
    const absoluteDepthScore = (avgDepth / 5) * 10
    const trendScore = ((depthTrend + 1) / 2) * 10 // scale -1..1 to 0..1

    health += absoluteDepthScore + trendScore

    return {
        participationFairness: parseFloat(fairness.toFixed(2)),
        counterargumentRatio: parseFloat(counterargumentRatio.toFixed(2)),
        questionDensity: parseFloat(questionDensity.toFixed(2)),
        diversityIndex: parseFloat(diversityIndex.toFixed(2)),
        depthTrend: parseFloat(depthTrend.toFixed(2)),
        cognitiveHealth: Math.min(100, Math.round(health))
    }
}

// -------------------------------------------------------------
// Intervention Logic (Deterministic thresholds for AI companion)
// -------------------------------------------------------------

export function shouldSageIntervene(
    messages: Message[],
    latestScore: AIScore,
    metrics: SessionMetrics
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

    // 2. Low Cognitive Health Crisis
    // If the session has > 4 messages and health drops low, intervene
    if (messages.length > 4 && metrics.cognitiveHealth < 40) {
        return { intervene: true, reason: 'low_cognitive_health' }
    }

    // 3. Echo chamber (No counterarguments after 6 claims/evidences)
    if (messages.length > 5 && metrics.counterargumentRatio === 0) {
        return { intervene: true, reason: 'echo_chamber' }
    }

    // 4. Logical Gap detected in the immediate message score
    if (latestScore?.logical_gap && !latestMsg?.is_ai && latestMsg?.profiles?.name !== 'Sage') {
        // 30% random chance to point it out so Sage isn't annoying
        if (Math.random() < 0.3) {
            return { intervene: true, reason: 'logical_gap_detected' }
        }
    }

    // 5. Synthesis Prompt
    // If we have a long session > 10 messages but 0 synthesis
    const syntheses = messages.filter(m => m.type === 'synthesis').length
    if (messages.length > 10 && syntheses === 0) {
        // 20% random chance on new message to ask for synthesis
        if (Math.random() < 0.2) {
            return { intervene: true, reason: 'synthesis_needed' }
        }
    }

    return { intervene: false }
}
