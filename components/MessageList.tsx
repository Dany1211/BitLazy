'use client'

import { Message } from '@/hooks/useRealtimeMessages'
import { AIScore } from '@/lib/metricsEngine'
import { useEffect, useRef } from 'react'

const badgeColors: Record<Message['type'], string> = {
    claim: 'bg-[#F1F5F9] text-slate-900 border-slate-200', // Slate 100
    evidence: 'bg-emerald-50 text-emerald-800 border-emerald-100',
    counterargument: 'bg-rose-50 text-rose-800 border-rose-100',
    question: 'bg-amber-50 text-amber-800 border-amber-100',
    synthesis: 'bg-emerald-50 text-emerald-900 border-emerald-200 border-l-4 border-l-emerald-500',
}

export default function MessageList({ messages, scores, isLoading }: { messages: Message[], scores: AIScore[], isLoading: boolean }) {
    const endOfMessagesRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, scores])

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
                const score = scores?.find(s => s.message_id === message.id)
                const isSage = message.is_ai || profile?.name === 'Sage'

                // Sages gets a completely different style card with a softer padding
                const sageCardClass = "bg-[#fdfaff] border-[#e9d5ff] shadow-[0_0_15px_rgba(168,85,247,0.1)] relative"
                // User gets normal color badge classes
                const colorClass = badgeColors[message.type] || 'bg-slate-50 text-slate-600 border-slate-100'

                const cardContainerClass = isSage
                    ? `p-5 rounded-2xl shadow-sm border inline-block w-fit max-w-[85%] ${sageCardClass} mx-auto block my-4`
                    : `p-4 rounded-xl shadow-sm border bg-white inline-block w-fit max-w-[85%] relative`

                return (
                    <div key={message.id} className={`flex flex-col gap-1.5 ${isSage ? 'items-center my-6' : 'items-start'}`}>
                        <div className={`flex items-center gap-3 mb-2 ${isSage ? 'justify-center' : ''}`}>
                            {!isSage && (
                                <div className="w-6 h-6 rounded bg-[#0F172A] flex items-center justify-center text-[8px] font-black text-emerald-400 uppercase">
                                    {(profile?.name || 'U').charAt(0)}
                                </div>
                            )}
                            <span className={`font-bold text-xs ${isSage ? 'text-purple-600 uppercase tracking-widest' : 'text-slate-900 uppercase tracking-tight'}`}>
                                {isSage ? '✨ SAGE (AI Facilitator)' : (profile?.name || 'Unknown User')}
                            </span>
                            {!isSage && (
                                <span className="text-[10px] font-bold text-slate-300">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        <div className={cardContainerClass}>
                            {!isSage && (
                                <div className="mb-3 flex justify-between items-start gap-4">
                                    <span className={`text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded border ${colorClass}`}>
                                        {message.type}
                                    </span>
                                </div>
                            )}

                            <p className={`whitespace-pre-wrap leading-relaxed ${isSage ? 'text-purple-950 font-medium px-4 text-center' : 'text-slate-800'}`}>
                                {message.content}
                            </p>

                            {/* Cognitive Score Tooltip Injection */}
                            {score && !isSage && (
                                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap gap-2 items-center">
                                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mr-1">AI Eval:</span>
                                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded px-2 py-1 group relative cursor-help">
                                        <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">Depth</span>
                                        <div className="flex gap-0.5">
                                            {[1, 2, 3, 4, 5].map(d => (
                                                <div key={d} className={`w-1.5 h-1.5 rounded-full ${d <= score.semantic_depth ? 'bg-indigo-500' : 'bg-slate-200'}`} />
                                            ))}
                                        </div>
                                    </div>

                                    {score.logical_gap && (
                                        <span className="text-[10px] bg-amber-50 text-amber-600 border border-amber-200 font-bold uppercase tracking-wider px-2 py-1 rounded">
                                            Logical Gap Flagged
                                        </span>
                                    )}

                                    <span className="text-[10px] bg-slate-50 border border-slate-200 text-slate-500 font-bold uppercase tracking-wider px-2 py-1 rounded">
                                        {score.justification_type}
                                    </span>

                                    <p className="w-full text-[11px] text-slate-500 mt-1 italic pl-1 leading-snug">
                                        {score.explanation}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
            <div ref={endOfMessagesRef} />
        </div>
    )
}
