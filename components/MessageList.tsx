'use client'

import { Message } from '@/hooks/useRealtimeMessages'
import { AIScore } from '@/lib/metricsEngine'
import { useEffect, useRef, useState } from 'react'
import { ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { DotLottiePlayer } from '@dotlottie/react-player'

interface TypingUser {
    id: string
    name: string
}

const badgeColors: Record<Message['type'], string> = {
    claim: 'bg-white text-slate-700 border-slate-200 hover:border-indigo-300 shadow-sm',
    evidence: 'bg-[#F2FCE2] text-emerald-800 border-[#E2F0CB] hover:border-emerald-300 shadow-sm', // Soft Mint
    counterargument: 'bg-[#FFDFD3] text-rose-800 border-[#FFCAB0] hover:border-rose-300 shadow-sm', // Pastel Peach
    question: 'bg-[#FEF1D0] text-amber-800 border-[#FDE5A6] hover:border-amber-400 shadow-sm', // Banana Yellow
    synthesis: 'bg-[#E0BBE4] text-purple-900 border-[#D291E4] shadow-md border-l-4 border-l-purple-500', // Lavender
    vote_answer: 'bg-emerald-100 text-emerald-800 border-emerald-300 shadow-sm', // specialized vote message
}

export default function MessageList({
    messages,
    scores,
    isLoading,
    typingUsers = [],
    isGenerating = false
}: {
    messages: Message[],
    scores: AIScore[],
    isLoading: boolean,
    typingUsers?: TypingUser[],
    isGenerating?: boolean
}) {
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

    const typingUsersToDisplay = typingUsers.length > 0 ? typingUsers : (isGenerating ? [] : []) // No-op placeholder

    // DEBUG: Also show current user typing if they are alone (for verification)
    // Actually, let's keep it strictly WhatsApp style but add a log to MessageList
    console.log('[MessageList] Rendered with typingUsers:', typingUsers.length, 'isGenerating:', isGenerating)

    return (
        <div className="flex-1 overflow-y-auto px-4 md:px-12 py-10 space-y-8 scroll-smooth custom-scrollbar relative z-10 w-full max-w-4xl mx-auto">
            {messages.map((message, idx) => {
                const profile = message.profiles
                const score = scores?.find(s => s.message_id === message.id)
                const isSage = message.is_ai || profile?.name === 'Sage'

                // If it's a vote message, render it differently
                // Hide system markers
                if (message.type === 'system' || message.content === '#SYNTHESIS_IN_PROGRESS#' || message.content === '#VOTE_REVEAL#' || message.type === 'vote_answer') {
                    if (message.content === '#SYNTHESIS_IN_PROGRESS#') return null;
                    if (message.type === 'vote_answer' || message.content === '#VOTE_REVEAL#') {
                        return (
                            <div key={message.id} className="flex justify-center my-4">
                                <div className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-4 py-2 rounded-full text-xs font-bold shadow-sm animate-[fadeIn_0.5s_ease-out] flex items-center gap-2">
                                    <span className="bg-emerald-200 text-emerald-800 w-5 h-5 rounded-full flex items-center justify-center text-[10px] uppercase">
                                        {(profile?.name || 'U').charAt(0)}
                                    </span>
                                    {profile?.name || 'User'} voted to reveal the answer.
                                </div>
                            </div>
                        )
                    }
                    return null;
                }

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
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-full border shadow-sm backdrop-blur-sm ${['claim', 'concept', 'algorithm', 'idea'].includes(message.type) ? 'bg-indigo-100 text-indigo-700 border-indigo-200' :
                                        ['evidence', 'analogy', 'optimization', 'feedback'].includes(message.type) ? 'bg-emerald-100 text-emerald-700 border-emerald-200' :
                                            ['counter', 'edge_case', 'blocker'].includes(message.type) ? 'bg-rose-100 text-rose-700 border-rose-200' :
                                                ['concession', 'question', 'complexity'].includes(message.type) ? 'bg-amber-100 text-amber-700 border-amber-200' :
                                                    ['synthesis', 'summary'].includes(message.type) ? 'bg-purple-100 text-purple-700 border-purple-200' :
                                                        ['example', 'action_item'].includes(message.type) ? 'bg-blue-100 text-blue-700 border-blue-200' :
                                                            message.type === 'code_block' ? 'bg-slate-200 text-slate-700 border-slate-300' :
                                                                'bg-white/50 text-black/60 border-black/5'
                                        }`}>
                                        {message.type.replace('_', ' ')}
                                    </span>
                                </div>
                            )}

                            {isSage ? (
                                <div className="text-left w-full text-[15px] leading-relaxed">
                                    <ReactMarkdown
                                        remarkPlugins={[remarkGfm]}
                                        /* eslint-disable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
                                        components={{
                                            h1: ({ node, ...props }: any) => <h1 className="text-2xl font-black mt-6 mb-4 text-[#0F172A] flex items-center gap-2" {...props} />,
                                            h2: ({ node, ...props }: any) => <h2 className="text-xl font-bold mt-5 mb-3 text-slate-800" {...props} />,
                                            h3: ({ node, ...props }: any) => <h3 className="text-lg font-bold mt-4 mb-2 text-indigo-900" {...props} />,
                                            p: ({ node, ...props }: any) => <p className="mb-4 text-slate-700 last:mb-0" {...props} />,
                                            ul: ({ node, ...props }: any) => <ul className="list-disc pl-6 mb-4 space-y-2 text-slate-700 marker:text-indigo-400" {...props} />,
                                            ol: ({ node, ...props }: any) => <ol className="list-decimal pl-6 mb-4 space-y-2 text-slate-700 marker:text-emerald-500 font-medium" {...props} />,
                                            li: ({ node, ...props }: any) => <li className="" {...props} />,
                                            strong: ({ node, ...props }: any) => <strong className="font-black text-slate-900 bg-emerald-500/10 px-1 rounded" {...props} />,
                                            em: ({ node, ...props }: any) => <em className="italic text-slate-600" {...props} />,
                                            blockquote: ({ node, ...props }: any) => (
                                                <blockquote className="border-l-4 border-indigo-400 pl-4 py-3 pr-4 my-6 bg-gradient-to-r from-indigo-50/80 to-transparent rounded-r-xl italic text-slate-700 shadow-sm" {...props} />
                                            ),
                                            table: ({ node, ...props }: any) => (
                                                <div className="overflow-hidden rounded-xl border border-slate-200 shadow-sm my-6">
                                                    <table className="min-w-full divide-y divide-slate-200" {...props} />
                                                </div>
                                            ),
                                            th: ({ node, ...props }: any) => <th className="px-4 py-3 bg-slate-50 text-left text-xs font-black text-slate-500 uppercase tracking-widest border-b border-slate-200" {...props} />,
                                            td: ({ node, ...props }: any) => <td className="px-4 py-3 text-sm text-slate-700 border-b border-slate-100 last:border-0" {...props} />,
                                            pre: ({ node, ...props }: any) => (
                                                <div className="bg-[#0F172A] rounded-xl p-4 my-4 overflow-x-auto shadow-inner w-full max-w-full">
                                                    <pre className="text-emerald-400 text-[13px] font-mono block whitespace-pre" {...props} />
                                                </div>
                                            ),
                                            code: ({ node, className, children, ...props }: any) => {
                                                const match = /language-(\w+)/.exec(className || '');
                                                const isBlock = match || String(children).includes('\n');
                                                if (isBlock) {
                                                    return <code className={className} {...props}>{children}</code>;
                                                }
                                                return <code className="bg-slate-100 text-pink-600 px-1.5 py-0.5 rounded-md text-[13px] font-mono font-bold" {...props}>{children}</code>;
                                            }
                                        }}
                                    /* eslint-enable @typescript-eslint/no-unused-vars, @typescript-eslint/no-explicit-any */
                                    >
                                        {message.content}
                                    </ReactMarkdown>
                                </div>
                            ) : (
                                <p className="whitespace-pre-wrap leading-relaxed text-slate-800 text-[15px]">
                                    {message.content}
                                </p>
                            )}

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
            {/* Thinking Indicator (Sage) */}
            {isGenerating && (
                <div className="flex flex-col items-center my-8 animate-[fadeIn_0.5s_ease-out]">
                    <div className="flex items-center gap-2 mb-2 pl-1 justify-center">
                        <span className="font-black text-xs text-purple-500 uppercase tracking-[0.2em]">
                            ✨ Sage is thinking...
                        </span>
                    </div>
                    <div className="relative w-[200px] h-[200px] flex items-center justify-center">
                        <DotLottiePlayer
                            src="/animation/Meditating-Giraffe.lottie"
                            autoplay
                            loop
                            style={{ width: '180px', height: '180px' }}
                        />
                    </div>
                </div>
            )}

            {/* Typing Indicator (Users) */}
            {typingUsers.length > 0 && (
                <div className="flex items-start gap-2 mb-4 animate-[fadeIn_0.3s_ease-out] ml-4">
                    <div className="flex flex-col gap-1">
                        <div className="bg-slate-100/80 backdrop-blur-sm border border-slate-200 px-4 py-2.5 rounded-2xl flex items-center gap-3">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce"></span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest leading-none">
                                {typingUsers.length === 1
                                    ? `${typingUsers[0].name} is typing...`
                                    : typingUsers.length === 2
                                        ? `${typingUsers[0].name} and ${typingUsers[1].name} are typing...`
                                        : `${typingUsers.length} people are typing...`
                                }
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <div ref={endOfMessagesRef} className="h-4" />
        </div>
    )
}
