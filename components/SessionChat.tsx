'use client'

import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

export default function SessionChat({ sessionId, userId }: { sessionId: string, userId: string }) {
    const { messages, isLoading } = useRealtimeMessages(sessionId)

    return (
        <div className="flex flex-col h-[calc(100vh-14rem)] bg-slate-50 border border-slate-200 rounded-2xl shadow-sm overflow-hidden mt-6">
            <MessageList messages={messages} isLoading={isLoading} />
            <MessageInput sessionId={sessionId} userId={userId} />
        </div>
    )
}
