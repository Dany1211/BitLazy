'use client'

import { Message } from '@/hooks/useRealtimeMessages'
import { useEffect, useRef } from 'react'

const badgeColors: Record<Message['type'], string> = {
    claim: 'bg-blue-100 text-blue-800 border-blue-200',
    evidence: 'bg-green-100 text-green-800 border-green-200',
    counterargument: 'bg-red-100 text-red-800 border-red-200',
    question: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    synthesis: 'bg-purple-100 text-purple-800 border-purple-200',
}

export default function MessageList({ messages, isLoading }: { messages: Message[], isLoading: boolean }) {
    const endOfMessagesRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (isLoading) {
        return (
            <div className="flex-1 flex justify-center items-center h-full">
                <p className="text-slate-500">Loading discussion...</p>
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex justify-center items-center h-full">
                <p className="text-slate-500 text-center">No messages yet. Start the discussion!</p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
            {messages.map((message) => {
                const profile = message.profiles
                const colorClass = badgeColors[message.type] || 'bg-gray-100 text-gray-800 border-gray-200'

                return (
                    <div key={message.id} className="flex flex-col gap-2">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-sm text-slate-800">
                                {profile?.name || 'Unknown User'}
                            </span>
                            <span className="text-xs text-slate-400">
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <div className={`p-4 rounded-xl shadow-sm border ${colorClass} bg-opacity-50 inline-block w-fit max-w-[85%]`}>
                            <div className="mb-2">
                                <span className={`text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white bg-opacity-60 border ${colorClass}`}>
                                    {message.type}
                                </span>
                            </div>
                            <p className="text-slate-900 whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                )
            })}
            <div ref={endOfMessagesRef} />
        </div>
    )
}
