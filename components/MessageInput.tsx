'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { MessageType } from '@/hooks/useRealtimeMessages'
import { getTypeConfig } from '@/utils/messageTypes'

interface Participant {
    id: string
    name: string | null
    avatar_url: string | null
}

interface Props {
    sessionId: string
    userId: string
    participants?: Participant[]
    category?: string
}

export default function MessageInput({ sessionId, userId, participants = [], category = 'General' }: Props) {
    const [content, setContent] = useState('')
    const [isSending, setIsSending] = useState(false)

    // @mention state
    const [mentionQuery, setMentionQuery] = useState<string | null>(null)  // null = not in mention mode
    const [mentionIndex, setMentionIndex] = useState(0)
    const [mentionStart, setMentionStart] = useState(0)  // caret position where @ was typed
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Include Sage (AI) as a synthetic always-present mentionable participant
    const SAGE: Participant = { id: '__sage__', name: 'Sage', avatar_url: null }
    const allMentionable = [SAGE, ...participants]

    // Filtered participants matching the @query
    const mentionMatches = mentionQuery !== null
        ? allMentionable.filter(p =>
            p.id !== userId &&
            (p.name || '').toLowerCase().startsWith(mentionQuery.toLowerCase())
        )
        : []

    // Auto-grow textarea
    const adjustHeight = () => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }

    // Parse textarea content for @mention trigger
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value
        const caret = e.target.selectionStart ?? val.length
        setContent(val)
        adjustHeight()

        // Find the most recent '@' before the caret
        const textBeforeCaret = val.slice(0, caret)
        const atIndex = textBeforeCaret.lastIndexOf('@')

        if (atIndex !== -1) {
            const textAfterAt = textBeforeCaret.slice(atIndex + 1)
            // Only trigger if no space after @ (still typing the name)
            if (!textAfterAt.includes(' ') && !textAfterAt.includes('\n')) {
                setMentionQuery(textAfterAt)
                setMentionStart(atIndex)
                setMentionIndex(0)
                return
            }
        }
        setMentionQuery(null)
    }

    // Pick a participant from the dropdown
    const selectMention = useCallback((participant: Participant) => {
        const name = participant.name || 'User'
        // Replace from the @ position up to the current caret
        const before = content.slice(0, mentionStart)
        const after = content.slice(mentionStart + 1 + (mentionQuery?.length ?? 0))
        const newContent = `${before}@${name} ${after}`
        setContent(newContent)
        setMentionQuery(null)
        // Restore focus and move caret after inserted mention
        requestAnimationFrame(() => {
            const el = textareaRef.current
            if (!el) return
            el.focus()
            const pos = before.length + name.length + 2  // +2 for "@" and " "
            el.setSelectionRange(pos, pos)
            adjustHeight()
        })
    }, [content, mentionStart, mentionQuery])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Mention navigation
        if (mentionQuery !== null && mentionMatches.length > 0) {
            if (e.key === 'ArrowDown') {
                e.preventDefault()
                setMentionIndex(i => (i + 1) % mentionMatches.length)
                return
            }
            if (e.key === 'ArrowUp') {
                e.preventDefault()
                setMentionIndex(i => (i - 1 + mentionMatches.length) % mentionMatches.length)
                return
            }
            if (e.key === 'Enter') {
                e.preventDefault()
                selectMention(mentionMatches[mentionIndex])
                return
            }
            if (e.key === 'Escape') {
                setMentionQuery(null)
                return
            }
        }

        // Normal send: Enter without Shift
        if (e.key === 'Enter' && !e.shiftKey && mentionQuery === null) {
            e.preventDefault()
            handleSend()
        }
    }

    const handleSend = async () => {
        const trimmed = content.trim()
        if (!trimmed || isSending) return
        setIsSending(true)
        const generatedId = crypto.randomUUID()
        const { error } = await supabase.from('messages').insert({
            id: generatedId,
            session_id: sessionId,
            user_id: userId,
            content: trimmed,
            type,
        })
        if (!error) {
            setContent('')
            if (textareaRef.current) {
                textareaRef.current.style.height = 'auto'
            }
            fetch('/api/evaluate-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId: generatedId })
            }).catch(() => { })
        }
        setIsSending(false)
    }

    // Close dropdown on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setMentionQuery(null)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const typeConfig = getTypeConfig(category)
    const [type, setType] = useState<MessageType>(Object.keys(typeConfig)[0])

    return (
        <div className="px-5 pb-6 pt-2 relative">
            {/* @mention dropdown — rendered above the input */}
            {mentionQuery !== null && mentionMatches.length > 0 && (
                <div
                    ref={dropdownRef}
                    className="absolute bottom-full mb-2 left-5 right-5 bg-white border border-slate-200 rounded-2xl shadow-xl shadow-slate-200/60 overflow-hidden z-50"
                >
                    <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2">
                        <svg className="w-3.5 h-3.5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                        </svg>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                            Mention — <kbd className="font-mono">↑↓</kbd> select · <kbd className="font-mono">↵</kbd> confirm · <kbd className="font-mono">Esc</kbd> dismiss
                        </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto py-1">
                        {mentionMatches.map((p, i) => {
                            const isSage = p.id === '__sage__'
                            return (
                                <button
                                    key={p.id}
                                    onMouseDown={e => { e.preventDefault(); selectMention(p) }}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${i === mentionIndex ? 'bg-slate-50' : 'hover:bg-slate-50'}`}
                                >
                                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-black text-[11px] uppercase overflow-hidden shrink-0 ${isSage
                                        ? 'bg-indigo-100 text-indigo-600'
                                        : i === mentionIndex ? 'bg-[#0F172A] text-white' : 'bg-slate-200 text-slate-500'
                                        }`}>
                                        {isSage ? '✦' : (
                                            p.avatar_url
                                                ? <img src={p.avatar_url} className="w-full h-full object-cover" alt={p.name || ''} />
                                                : (p.name?.charAt(0) || '?')
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-[#0F172A] truncate">{p.name || 'Anonymous'}</p>
                                        <p className={`text-[9px] font-bold uppercase tracking-widest ${isSage ? 'text-indigo-500' : 'text-emerald-500'} ${i === mentionIndex ? '' : 'opacity-0'}`}>
                                            {isSage ? 'AI Assistant' : 'Participant'}
                                        </p>
                                    </div>
                                    {i === mentionIndex && (
                                        <svg className="w-4 h-4 text-slate-300 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                                        </svg>
                                    )}
                                </button>
                            )
                        })}
                    </div>
                </div>
            )}

            {/* Input card */}
            <div className="bg-slate-50 border border-slate-200 rounded-[1.5rem] shadow-lg shadow-slate-100 flex flex-col gap-0 focus-within:border-emerald-300 focus-within:bg-white focus-within:shadow-emerald-100/50 transition-all">
                {/* Type selector */}
                <div className="flex items-center gap-1.5 px-4 pt-3 pb-2 overflow-x-auto no-scrollbar">
                    {(Object.entries(typeConfig) as [MessageType, typeof typeConfig[MessageType]][]).map(([t, cfg]) => (
                        <button
                            key={t}
                            onClick={() => setType(t)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all whitespace-nowrap border ${type === t
                                ? `${cfg.color} text-white border-transparent shadow-sm`
                                : 'bg-white text-slate-400 border-slate-200 hover:border-slate-300 hover:text-slate-600'
                                }`}
                        >
                            <div className={`w-1.5 h-1.5 rounded-full ${type === t ? 'bg-white/60' : cfg.dot}`} />
                            {cfg.label}
                        </button>
                    ))}
                </div>

                {/* Textarea + send */}
                <div className="flex items-end gap-3 px-4 pb-3">
                    <textarea
                        ref={textareaRef}
                        value={content}
                        onChange={handleChange}
                        onKeyDown={handleKeyDown}
                        placeholder="Contribute to reasoning… type @ to mention"
                        className="flex-1 bg-transparent resize-none py-2 text-sm font-medium text-[#0F172A] placeholder-slate-300 focus:outline-none min-h-[36px] max-h-[120px] leading-relaxed"
                        rows={1}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!content.trim() || isSending}
                        className="w-11 h-11 bg-[#0F172A] hover:bg-emerald-600 text-emerald-400 rounded-xl flex items-center justify-center transition-all disabled:opacity-25 disabled:pointer-events-none active:scale-95 shrink-0 shadow-md"
                    >
                        {isSending ? (
                            <div className="w-4 h-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
