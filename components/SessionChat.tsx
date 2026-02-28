'use client'

import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import MetricsDashboard from '@/components/MetricsDashboard'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

interface Profile {
    id: string
    name: string | null
    avatar_url: string | null
}

export default function SessionChat({
    sessionId,
    userId,
    participants = [],
}: {
    sessionId: string
    userId: string
    participants?: Profile[]
}) {
    const { messages, scores, isLoading } = useRealtimeMessages(sessionId)

    return (
        <div className="flex flex-row flex-1 h-full min-h-0 relative overflow-hidden">
            <div className="flex flex-col flex-1 bg-white relative min-w-0 h-full">
                <MessageList messages={messages} scores={scores} isLoading={isLoading} />
                <MessageInput sessionId={sessionId} userId={userId} participants={participants} />
            </div>
            {/* Permanent Insights Section on large screens */}
            <div className="hidden lg:block w-80 shrink-0 border-l border-slate-100 h-full overflow-hidden">
                <MetricsDashboard messages={messages} scores={scores} />
            </div>
        </div>
    )
}
