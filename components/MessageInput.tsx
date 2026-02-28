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
        <div className="bg-white border-t border-slate-200 p-4 shrink-0">
            <div className="max-w-4xl mx-auto flex flex-col gap-3">
                <select
                    value={type}
                    onChange={(e) => setType(e.target.value as MessageType)}
                    className="w-48 appearance-none bg-slate-50 border border-slate-300 text-slate-700 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 font-medium"
                >
                    <option value="claim">Claim</option>
                    <option value="evidence">Evidence</option>
                    <option value="counterargument">Counterargument</option>
                    <option value="question">Question</option>
                    <option value="synthesis">Synthesis</option>
                </select>

                <div className="flex gap-2">
                    <textarea
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Type your reasoning... (Press Enter to send, Shift+Enter for new line)"
                        className="w-full resize-none border border-slate-300 rounded-lg p-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        rows={2}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!content.trim() || isSending}
                        className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                    >
                        {isSending ? 'Sending...' : 'Send'}
                    </button>
                </div>
            </div>
        </div>
    )
}
