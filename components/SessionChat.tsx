'use client'

import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

export default function SessionChat({ sessionId, userId }: { sessionId: string, userId: string }) {
    const { messages, isLoading } = useRealtimeMessages(sessionId)

    return (
        <div className="flex flex-col h-full bg-white relative">
            <MessageList messages={messages} isLoading={isLoading} />
            <MessageInput sessionId={sessionId} userId={userId} />
        </div>
    )
}
