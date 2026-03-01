export type MessageType = 'claim' | 'evidence' | 'counterargument' | 'question' | 'synthesis'

export interface Message {
    id: string
    session_id: string
    user_id: string
    content: string
    type: MessageType
    created_at: string
}

export interface Profile {
    id: string
    name?: string | null
    avatar_url?: string | null
}

export interface SessionAnalyticsData {
    totalContributions: number
    contributionBreakdown: {
        claim: number
        evidence: number
        question: number
        counterargument: number
        synthesis: number
    }
    participants: {
        userId: string
        name: string
        contributionCount: number
        percentage: number
        isDominant: boolean
    }[]
    averageContributionLength: number
    reasoningBalanceScore: number
    insights: string[]
}

export function calculateBreakdown(messages: Message[]) {
    const breakdown = {
        claim: 0,
        evidence: 0,
        question: 0,
        counterargument: 0,
        synthesis: 0,
    }

    messages.forEach((m) => {
        if (m.type in breakdown) {
            breakdown[m.type as keyof typeof breakdown]++
        }
    })

    return breakdown
}

export function calculateParticipants(messages: Message[], profiles: Profile[]) {
    const userMap: Record<string, { name: string; count: number }> = {}
    const total = messages.length

    messages.forEach((m) => {
        if (!userMap[m.user_id]) {
            const profile = profiles.find((p) => p.id === m.user_id)
            userMap[m.user_id] = {
                name: profile?.name || 'Anonymous',
                count: 0,
            }
        }
        userMap[m.user_id].count++
    })

    return Object.entries(userMap).map(([userId, stats]) => {
        const percentage = total > 0 ? (stats.count / total) * 100 : 0
        return {
            userId,
            name: stats.name,
            contributionCount: stats.count,
            percentage: Math.round(percentage),
            isDominant: percentage > 40,
        }
    }).sort((a, b) => b.contributionCount - a.contributionCount)
}

export function calculateAverageLength(messages: Message[]) {
    if (messages.length === 0) return 0
    const totalLength = messages.reduce((acc, m) => acc + (m.content?.length || 0), 0)
    return Math.round(totalLength / messages.length)
}

export function calculateReasoningBalanceScore(breakdown: SessionAnalyticsData['contributionBreakdown']) {
    let score = 100
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0)

    // Penalize missing types
    Object.values(breakdown).forEach((count) => {
        if (count === 0) score -= 15
    })

    // Extra penalty for no counterarguments
    if (breakdown.counterargument === 0) {
        score -= 30
    }

    // Distribution skew penalty
    if (total > 0) {
        const maxTypeCount = Math.max(...Object.values(breakdown))
        if ((maxTypeCount / total) > 0.5) {
            score -= 20
        }
    }

    return Math.max(0, score)
}

export function generateInsights(
    breakdown: SessionAnalyticsData['contributionBreakdown'],
    participants: SessionAnalyticsData['participants']
) {
    const insights: string[] = []

    if (breakdown.counterargument === 0) {
        insights.push('No counterarguments present. Discussion may lack critical evaluation.')
    }

    const dominantUser = participants.find(p => p.percentage > 40)
    if (dominantUser) {
        insights.push(`One participant (${dominantUser.name}) dominates the discussion.`)
    }

    if (breakdown.evidence < breakdown.claim) {
        insights.push('Evidence usage is lower than claims.')
    }

    return insights.slice(0, 3)
}
