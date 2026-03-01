'use client'

import MessageList from '@/components/MessageList'
import MessageInput from '@/components/MessageInput'
import MetricsDashboard from '@/components/MetricsDashboard'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'
import { usePresence } from '@/hooks/usePresence'
import { supabase } from '@/lib/supabaseClient'
import { useState, useEffect, useRef } from 'react'

interface Profile {
    id: string
    name: string | null
    avatar_url: string | null
}

export default function SessionChat({
    sessionId,
    userId,
    participants = [],
}: {
    sessionId: string
    userId: string
    participants?: Profile[]
}) {
    const { messages, scores, isLoading } = useRealtimeMessages(sessionId)
    const { onlineUsers } = usePresence(sessionId, userId)
    const [isVoting, setIsVoting] = useState(false)
    const revealTriggeredRef = useRef(false)

    // Calculate voting status
    // 1. How many distinct people have voted so far?
    const voteMessages = messages.filter(m => m.type === 'vote_answer' || m.content === '#VOTE_REVEAL#')
    const uniqueVoters = new Set(voteMessages.map(m => m.user_id))
    const currentVotes = uniqueVoters.size

    // 2. Has the current user voted?
    const hasVoted = uniqueVoters.has(userId)

    // 3. How many people are active right now?
    const activeCount = onlineUsers.size

    // 4. Threshold: 2/3 of active participants (rounded up)
    const requiredVotes = Math.max(1, Math.ceil(activeCount * (2 / 3)))

    // 5. Are we revealing?
    const answerRevealed = currentVotes >= requiredVotes && requiredVotes > 0

    // Race-condition safe reveal trigger
    useEffect(() => {
        if (!revealTriggeredRef.current && answerRevealed) {
            revealTriggeredRef.current = true
            fetch('/api/reveal-answer', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            }).catch(err => console.error("Failed to trigger answer reveal:", err))
        }
    }, [answerRevealed, sessionId])

    // Reset the trigger when the votes are successfully cleared by the backend
    useEffect(() => {
        if (currentVotes === 0) {
            revealTriggeredRef.current = false
        }
    }, [currentVotes])

    const handleVote = async () => {
        if (hasVoted || isVoting || answerRevealed) return
        setIsVoting(true)
        const generatedId = crypto.randomUUID()

        const { error } = await supabase.from('messages').insert({
            id: generatedId,
            session_id: sessionId,
            user_id: userId,
            content: '#VOTE_REVEAL#',
            type: 'question', // Use existing ENUM to avoid database schema rejection
        })

        if (error) {
            console.error("VOTE INSERT ERROR:", error)
            alert("Failed to vote. Please try again.")
        }

        // Wait for the UI to catch up with realtime before releasing loading state
        setTimeout(() => setIsVoting(false), 500)
    }

    return (
        <div className="flex flex-row flex-1 h-full min-h-0 relative overflow-hidden">
            <div className="flex flex-col flex-1 bg-white relative min-w-0 h-full">
                <MessageList messages={messages} scores={scores} isLoading={isLoading} />

                {/* Voting Bar */}
                <div className="px-5 pb-2">
                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-100/50 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-[0_4_20px_rgba(16,185,129,0.05)]">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shadow-inner">
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path></svg>
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-emerald-900 tracking-tight">Need the Answer?</h3>
                                <p className="text-xs text-emerald-700/80 font-medium">Vote to reveal Sage&apos;s step-by-step master solution map.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 w-full sm:w-auto">
                            <div className="flex flex-col items-end flex-1 sm:flex-none">
                                <span className="text-xs font-bold text-emerald-600">
                                    {currentVotes} / {requiredVotes} Votes
                                </span>
                                <div className="w-full sm:w-24 h-1.5 bg-emerald-200/50 rounded-full mt-1 overflow-hidden">
                                    <div
                                        className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                                        style={{ width: `${Math.min(100, (currentVotes / requiredVotes) * 100)}%` }}
                                    />
                                </div>
                            </div>
                            <button
                                onClick={handleVote}
                                disabled={hasVoted || answerRevealed || isVoting}
                                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-200 text-white text-xs font-bold uppercase tracking-widest rounded-xl transition-all shadow-md hover:shadow-lg disabled:shadow-none whitespace-nowrap active:scale-95 flex items-center gap-2"
                            >
                                {isVoting ? 'Voting...' : (hasVoted ? 'Voted' : 'Vote to Show')}
                            </button>
                        </div>
                    </div>
                </div>

                <MessageInput sessionId={sessionId} userId={userId} participants={participants} />
            </div>
            {/* Permanent Insights Section on large screens */}
            <div className="hidden lg:block w-80 shrink-0 border-l border-slate-100 h-full overflow-hidden">
                <MetricsDashboard messages={messages} scores={scores} />
            </div>
        </div>
    )
}
