'use client'

import { Message } from '@/hooks/useRealtimeMessages'
import { AIScore } from '@/lib/metricsEngine'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'

const badgeColors: Record<Message['type'], string> = {
    claim: 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 shadow-sm',
    evidence: 'bg-[#F2FCE2] text-emerald-800 border-[#E2F0CB] hover:border-emerald-300 shadow-sm', // Soft Mint
    counterargument: 'bg-[#FFDFD3] text-rose-800 border-[#FFCAB0] hover:border-rose-300 shadow-sm', // Pastel Peach
    question: 'bg-[#FEF1D0] text-amber-800 border-[#FDE5A6] hover:border-amber-400 shadow-sm', // Banana Yellow
    synthesis: 'bg-[#E0BBE4] text-purple-900 border-[#D291E4] shadow-md border-l-4 border-l-purple-500', // Lavender
}

export default function MessageList({ messages, scores, isLoading }: { messages: Message[], scores: AIScore[], isLoading: boolean }) {
    const endOfMessagesRef = useRef<HTMLDivElement>(null)
    const [expandedScores, setExpandedScores] = useState<Record<string, boolean>>({})

    const toggleScore = (messageId: string) => {
        setExpandedScores(prev => ({
            ...prev,
            [messageId]: !prev[messageId]
        }))
    }

    useEffect(() => {
        endOfMessagesRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, scores])

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center gap-4">
                <div className="w-12 h-12 border-4 border-pink-400 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Building Workspace...</p>
            </div>
        )
    }

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex flex-col justify-center items-center p-12 text-center h-full relative">
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay pointer-events-none"></div>
                <div className="w-24 h-24 bg-white/60 backdrop-blur-xl rounded-full shadow-[0_0_40px_rgba(0,0,0,0.05)] border border-white flex items-center justify-center text-4xl mb-6 animate-[bounce_3s_ease-in-out_infinite]">🎨</div>
                <h2 className="text-2xl font-black text-slate-800 mb-2 tracking-tight">The Canvas is Empty</h2>
                <p className="text-sm text-slate-500 font-medium max-w-[250px] leading-relaxed">Drop your first thought below to kick off the collaboration.</p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-12 py-10 space-y-8 scroll-smooth custom-scrollbar relative z-10 w-full max-w-4xl mx-auto">
            {messages.map((message, idx) => {
                const profile = message.profiles
                const score = scores?.find(s => s.message_id === message.id)
                const isSage = message.is_ai || profile?.name === 'Sage'
                const isExpanded = expandedScores[message.id] || false

                // Sages gets a completely different style card with a magical border
                const sageCardClass = "bg-white/90 backdrop-blur-xl border border-transparent bg-clip-padding relative shadow-[0_0_30px_rgba(168,85,247,0.15)] rounded-3xl"
                const colorClass = badgeColors[message.type] || 'bg-white text-slate-700 border-slate-200'

                const cardContainerClass = isSage
                    ? `p-6 inline-block w-fit max-w-[90%] md:max-w-[75%] mx-auto block my-8 ${sageCardClass}`
                    : `p-5 rounded-2xl border inline-block w-fit md:min-w-[400px] max-w-[90%] md:max-w-[75%] relative transition-all duration-300 hover:shadow-lg ${colorClass}`

                // Alternating tilt for user messages to feel "playful"
                const tiltClass = !isSage && !isExpanded ? (idx % 2 === 0 ? 'hover:rotate-1' : 'hover:-rotate-1') : ''

                return (
                    <div key={message.id} className={`flex flex-col gap-2 ${isSage ? 'items-center my-8 animate-[fadeIn_0.5s_ease-out]' : 'items-start animate-[slideUp_0.4s_ease-out]'}`}>
                        <div className={`flex items-center gap-2 mb-1 pl-1 ${isSage ? 'justify-center' : ''}`}>
                            {!isSage && (
                                <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-black text-slate-600 uppercase border border-slate-300">
                                    {(profile?.name || 'U').charAt(0)}
                                </div>
                            )}
                            <span className={`font-black text-xs ${isSage ? 'text-purple-500 uppercase tracking-[0.2em]' : 'text-slate-700'}`}>
                                {isSage ? '✨ Sage Facilitator' : (profile?.name || 'Creator')}
                            </span>
                            {!isSage && (
                                <span className="text-[10px] font-bold text-slate-400">
                                    {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            )}
                        </div>

                        <div className={`${cardContainerClass} ${tiltClass}`}>
                            {isSage && (
                                <div className="absolute -inset-1 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 rounded-[2rem] blur opacity-20 -z-10 animate-pulse"></div>
                            )}

                            {!isSage && (
                                <div className="mb-3">
                                    <span className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full bg-white/50 border border-black/5 text-black/60 shadow-sm backdrop-blur-sm">
                                        {message.type}
                                    </span>
                                </div>
                            )}

                            <p className={`whitespace-pre-wrap leading-relaxed ${isSage ? 'text-slate-800 font-semibold px-4 text-center text-[15px]' : 'text-slate-800 text-[15px]'}`}>
                                {message.content}
                            </p>

                            {/* Playful Evaluator Tag - HIDDEN BY DEFAULT */}
                            {score && !isSage && (
                                <div className="mt-4 pt-3 border-t border-black/5">
                                    <button
                                        onClick={() => toggleScore(message.id)}
                                        className="flex items-center gap-1.5 text-[10px] uppercase font-bold text-slate-400 hover:text-indigo-500 transition-colors mx-auto"
                                    >
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                                        {isExpanded ? 'Hide AI Analysis' : 'Show AI Analysis'}
                                    </button>

                                    <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-40 opacity-100 mt-3' : 'max-h-0 opacity-0'}`}>
                                        <div className="flex flex-wrap gap-2 items-center">
                                            <div className="flex items-center gap-1.5 bg-white/80 backdrop-blur-sm shadow-sm border border-black/5 rounded-full px-3 py-1 group cursor-default">
                                                <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">Logic:</span>
                                                <div className="flex gap-1">
                                                    {[1, 2, 3, 4, 5].map(d => (
                                                        <div key={d} className={`w-2 h-2 rounded-full shadow-sm transition-all duration-500 ${d <= score.semantic_depth ? 'bg-indigo-400' : 'bg-black/10'}`} />
                                                    ))}
                                                </div>
                                            </div>

                                            {score.logical_gap && (
                                                <span className="text-[10px] bg-rose-100 text-rose-600 border border-rose-200 shadow-sm font-black uppercase tracking-widest px-3 py-1 rounded-full">
                                                    ⚠️ Gap Flagged
                                                </span>
                                            )}

                                            <span className="text-[10px] bg-white/80 backdrop-blur-sm shadow-sm border border-black/5 text-slate-500 font-bold uppercase tracking-widest px-3 py-1 rounded-full">
                                                {score.justification_type}
                                            </span>
                                        </div>
                                        {score.explanation && (
                                            <p className="mt-2 text-xs italic text-slate-500">
                                                &quot;{score.explanation}&quot;
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )
            })}
            <div ref={endOfMessagesRef} className="h-4" />
        </div>
    )
}
