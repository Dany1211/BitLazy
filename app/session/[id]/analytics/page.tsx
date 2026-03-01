import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import SessionAnalytics from '@/components/analytics/SessionAnalytics'
import {
    calculateBreakdown,
    calculateParticipants,
    calculateAverageLength,
    calculateReasoningBalanceScore,
    generateInsights,
    SessionAnalyticsData
} from '@/lib/analytics'

export default async function AnalyticsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createServerClientInstance()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    // Fetch messages for analytics
    const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true })

    if (messagesError) {
        return <div className="p-8 text-neutral-500">Error loading contributions.</div>
    }

    // Fetch all profiles to map names (assuming a reasonable number of participants)
    const { data: profiles } = await supabase
        .from('profiles')
        .select('id, name, avatar_url')

    // Aggregate Analytics
    const breakdown = calculateBreakdown(messages as any[] || [])
    const participants = calculateParticipants(messages as any[] || [], profiles as any[] || [])
    const avgLength = calculateAverageLength(messages || [])
    const balanceScore = calculateReasoningBalanceScore(breakdown)
    const insights = generateInsights(breakdown, participants)

    const analyticsData: SessionAnalyticsData = {
        totalContributions: messages?.length || 0,
        contributionBreakdown: breakdown,
        participants,
        averageContributionLength: avgLength,
        reasoningBalanceScore: balanceScore,
        insights,
    }

    return (
        <main className="flex-1 flex flex-col relative bg-white z-10 shadow-xl overflow-hidden">
            <div className="flex-1 flex flex-col overflow-hidden">
                <div className="h-12 border-b border-neutral-100 flex items-center px-8 shrink-0 bg-neutral-50/50">
                    <h2 className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em]">Session Analytics Dashboard</h2>
                </div>
                <SessionAnalytics data={analyticsData} />
            </div>
        </main>
    )
}
