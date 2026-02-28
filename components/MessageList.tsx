'use client'

import { Message } from '@/hooks/useRealtimeMessages'
import { useEffect, useRef } from 'react'

const badgeColors: Record<Message['type'], string> = {
    claim: 'bg-[#F1F5F9] text-slate-900 border-slate-200', // Slate 100
    evidence: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    counterargument: 'bg-rose-50 text-rose-800 border-rose-100',
    question: 'bg-amber-50 text-amber-800 border-amber-100',
    synthesis: 'bg-emerald-50 text-emerald-900 border-emerald-200 border-l-4 border-l-emerald-500',
}

export default function MessageList({ messages, isLoading }: { messages: Message[], isLoading: boolean }) {
    const endOfMessagesRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center gap-4">
                <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Syncing discussion...</p>
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center p-12 text-center">
                <div className="w-16 h-16 bg-slate-50 rounded-3xl flex items-center justify-center text-2xl mb-4">💬</div>
                <p className="text-sm font-bold text-slate-900 mb-1">Begin Reasoning</p>
                <p className="text-xs text-slate-400 font-medium max-w-[200px] leading-relaxed">Type below to start the collaborative process.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto px-8 py-10 space-y-8 scroll-smooth">
            {messages.map((message) => {
                const profile = message.profiles
                const colorClass = badgeColors[message.type] || 'bg-slate-50 text-slate-600 border-slate-100'

                return (
                    <div key={message.id} className="group animate-in fade-in slide-in-from-bottom-2 duration-300">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="w-6 h-6 rounded bg-[#0F172A] flex items-center justify-center text-[8px] font-black text-emerald-400 uppercase">
                                {(profile?.name || 'U').charAt(0)}
                            </div>
                            <span className="font-bold text-xs text-slate-900 uppercase tracking-tight">
                                {profile?.name || 'Unknown User'}
                            </span>
                            <span className="text-[10px] font-bold text-slate-300">
                                {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>

                        <div className={`p-4 rounded-2xl border ${colorClass} shadow-sm inline-block min-w-[120px] max-w-[90%] transition-all`}>
                            <div className="mb-2 flex items-center justify-between">
                                <span className={`text-[9px] font-black uppercase tracking-[0.15em] px-2 py-0.5 rounded-md bg-white/40 border border-black/5`}>
                                    {message.type}
                                </span>
                            </div>
                            <p className="text-sm text-slate-800 font-medium leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        </div>
                    </div>
                )
            })}
            <div ref={endOfMessagesRef} />
        </div>
    )
}
