'use client'

import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import MetricsDashboard from '@/components/MetricsDashboard'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

export default function SessionChat({ sessionId, userId }: { sessionId: string, userId: string }) {
    const { messages, scores, isLoading } = useRealtimeMessages(sessionId)

    return (
        <div className="flex flex-row flex-1 h-full min-h-0 relative">
            <div className="flex flex-col flex-1 bg-white relative min-w-0 h-full">
                <MessageList messages={messages} scores={scores} isLoading={isLoading} />
                <MessageInput sessionId={sessionId} userId={userId} />
            </div>
            {/* The Metrics Dashboard only shows on large screens */}
            <MetricsDashboard messages={messages} scores={scores} />
        </div>
    )
}
