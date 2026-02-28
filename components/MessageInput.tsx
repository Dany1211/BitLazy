'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { MessageType } from '@/hooks/useRealtimeMessages'

export default function MessageInput({ sessionId, userId }: { sessionId: string, userId: string }) {
    const [content, setContent] = useState('')
    const [type, setType] = useState<MessageType>('claim')
    const [isSending, setIsSending] = useState(false)

    const handleSend = async () => {
        const trimmed = content.trim()
        if (!trimmed) return
        if (!type) return

        setIsSending(true)

        const { error } = await supabase.from('messages').insert({
            session_id: sessionId,
            user_id: userId,
            content: trimmed,
            type,
        })

        if (!error) {
            setContent('')
        } else {
            console.error('Error sending message:', error)
        }

        setIsSending(false)
    }

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="px-8 pb-8 pt-2">
            <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-3 shadow-2xl shadow-slate-200/50 flex flex-col gap-3 group focus-within:border-emerald-200 focus-within:bg-white transition-all">
                <div className="flex items-center gap-2 px-2 overflow-x-auto no-scrollbar">
                    {(['claim', 'evidence', 'counterargument', 'question', 'synthesis'] as MessageType[]).map((t) => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap border-2 ${type === t
                                    ? 'bg-[#0F172A] text-emerald-400 border-[#0F172A]'
                                    : 'bg-white text-slate-400 border-transparent hover:border-slate-200'
                                }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Contribute to reasoning..."
                        className="flex-1 bg-transparent resize-none px-4 py-3 text-sm font-medium text-[#0F172A] placeholder-slate-300 focus:outline-none"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!content.trim() || isSending}
                        className="w-12 h-12 bg-[#0F172A] hover:bg-emerald-600 text-emerald-400 rounded-2xl flex items-center justify-center transition-all disabled:opacity-30 disabled:grayscale active:scale-95 shrink-0 shadow-lg shadow-slate-200"
                    >
                        {isSending ? (
                            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
