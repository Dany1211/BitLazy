'use client'

import React, { useState, useMemo } from 'react'
import Link from 'next/link'
import SessionChat from '@/components/SessionChat'
import SessionSynthesis from '@/components/SessionSynthesis'
import { useRealtimeMessages } from '@/hooks/useRealtimeMessages'

interface SessionViewProps {
    session: any
    allProfiles: any[] | null
    user: any
    currentUserProfile: any
    userInitials: string
    sessionId: string
}

export default function SessionView({
    session,
    allProfiles,
    user,
    currentUserProfile,
    userInitials,
    sessionId
}: SessionViewProps) {
    const [showSynthesis, setShowSynthesis] = useState(false)
    const [showSidebar, setShowSidebar] = useState(true)

    // Use realtime messages to derive who is actually active
    const { messages } = useRealtimeMessages(sessionId)

    // A participant is "active" if they sent a message in the last 15 minutes
    const activeIds = useMemo(() => {
        const cutoff = Date.now() - 15 * 60 * 1000
        return new Set(
            messages
                .filter(m => !m.is_ai && new Date(m.created_at).getTime() > cutoff)
                .map(m => m.user_id)
        )
    }, [messages])

    return (
        <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased overflow-hidden">
            {/* Top Navigation */}
            <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/home" className="p-2 hover:bg-slate-100 rounded-lg transition-colors group">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <button
                        onClick={() => setShowSidebar(!showSidebar)}
                        className={`p-2 rounded-lg transition-all ${showSidebar ? 'bg-slate-100 text-slate-600' : 'text-slate-400 hover:bg-slate-100'} md:hidden`}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path></svg>
                    </button>
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-[#0F172A] rounded flex items-center justify-center">
                            <span className="text-emerald-400 font-bold text-sm">B</span>
                        </div>
                        <h1 className="text-sm font-black text-[#0F172A] truncate max-w-[120px] sm:max-w-md tracking-tight uppercase">
                            {session.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6">
                    {/* Perspective Toggles */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                        <button
                            onClick={() => setShowSynthesis(!showSynthesis)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${showSynthesis ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                            <span className="hidden sm:inline">Synthesis</span>
                        </button>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    {/* Current User */}
                    <div className="flex items-center gap-3">
                        <div className="hidden lg:block text-right">
                            <p className="text-[10px] font-black text-[#0F172A] uppercase leading-none">{currentUserProfile?.name || 'Explorer'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Active Now</p>
                        </div>
                        <div className="w-9 h-9 rounded-xl bg-[#0F172A] p-0.5 border border-slate-200 shadow-sm relative group cursor-pointer transition-transform hover:scale-105">
                            <div className="w-full h-full bg-slate-900 rounded-[9px] flex items-center justify-center text-emerald-400 font-black text-xs uppercase overflow-hidden">
                                {currentUserProfile?.avatar_url ? (
                                    <img src={currentUserProfile.avatar_url} className="w-full h-full object-cover" />
                                ) : userInitials}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden relative">
                {/* Left Pane: Session Context */}
                <aside className={`${showSidebar ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 w-80 bg-[#0F172A] text-white flex flex-col shrink-0 z-20 shadow-2xl transition-transform duration-300 absolute lg:relative h-full`}>
                    <div className="p-8 space-y-8 overflow-y-auto flex-1 custom-scrollbar">
                        <section>
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-4">Mission Statement</label>
                            <p className="text-slate-300 text-sm leading-relaxed font-medium">
                                {session.problem_statement}
                            </p>
                        </section>

                        <section>
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-4">Session Specs</label>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                    <span className="text-[11px] font-bold text-slate-400">Created</span>
                                    <span className="text-[11px] font-black text-slate-200 uppercase">{new Date(session.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between items-center bg-white/5 p-3 rounded-xl border border-white/10">
                                    <span className="text-[11px] font-bold text-slate-400">Status</span>
                                    <span className="text-[11px] font-black text-emerald-400 uppercase tracking-widest">Active</span>
                                </div>
                            </div>
                        </section>

                        <section>
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-4">
                                Core Participants
                                <span className="ml-2 text-emerald-500/50 font-medium normal-case tracking-normal">
                                    ({allProfiles?.length || 0})
                                </span>
                            </label>
                            <div className="space-y-1.5">
                                {allProfiles?.map((p) => {
                                    const isYou = p.id === user.id
                                    const isActive = activeIds.has(p.id) || isYou
                                    return (
                                        <div key={p.id} className="flex items-center gap-3 group cursor-default hover:bg-white/5 px-2 py-2 rounded-xl transition-all border border-transparent hover:border-white/8">
                                            {/* Avatar with active ring */}
                                            <div className={`relative w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] uppercase overflow-hidden shrink-0 ${isActive
                                                    ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400'
                                                    : 'bg-white/5 border border-white/10 text-slate-500'
                                                }`}>
                                                {p.avatar_url
                                                    ? <img src={p.avatar_url} className="w-full h-full object-cover" alt={p.name || ''} />
                                                    : (p.name?.charAt(0) || 'U')
                                                }
                                                {/* Status dot */}
                                                <div className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-[#0F172A] ${isActive ? 'bg-emerald-500' : 'bg-slate-600'
                                                    }`} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors block truncate">
                                                    {p.name || 'Anonymous'}{isYou ? ' (you)' : ''}
                                                </span>
                                                <span className={`text-[9px] font-bold uppercase tracking-tight ${isActive ? 'text-emerald-500' : 'text-slate-600'
                                                    }`}>
                                                    {isActive ? 'Active' : 'Away'}
                                                </span>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </section>
                    </div>
                </aside>

                {/* Mobile Sidebar Overlay */}
                {(showSidebar || showSynthesis) && (
                    <div
                        className="fixed inset-0 bg-black/40 z-10 lg:hidden backdrop-blur-[2px] cursor-pointer transition-opacity"
                        onClick={() => {
                            setShowSidebar(false)
                            setShowSynthesis(false)
                        }}
                    ></div>
                )}

                {/* Center Pane: Chat Application */}
                <main className="flex-1 flex flex-col relative bg-white z-10 shadow-xl min-w-0">
                    <SessionChat sessionId={sessionId} userId={user.id} participants={allProfiles || []} />
                </main>

                {/* Right Pane: Session Synthesis */}
                {showSynthesis && (
                    <div className="fixed inset-y-0 right-0 w-[85vw] sm:w-80 lg:relative bg-white z-40 border-l border-slate-200 shadow-2xl lg:shadow-none animate-in slide-in-from-right duration-300">
                        <div className="h-full flex flex-col">
                            <div className="p-5 border-b border-slate-100 flex items-center justify-between lg:hidden bg-slate-50">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Synthesis & Notes</span>
                                <button onClick={() => setShowSynthesis(false)} className="p-2 hover:bg-slate-200 rounded-xl transition-colors">
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"></path></svg>
                                </button>
                            </div>
                            <SessionSynthesis sessionId={sessionId} />
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
