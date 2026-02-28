'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'

interface Session {
    id: string
    title: string
    problem_statement: string
    visibility: string
    created_at: string
}

export default function SessionsGrid({ sessions }: { sessions: Session[] }) {
    const [query, setQuery] = useState('')

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase()
        if (!q) return sessions
        return sessions.filter(
            s =>
                s.title.toLowerCase().includes(q) ||
                s.problem_statement?.toLowerCase().includes(q)
        )
    }, [query, sessions])

    return (
        <div>
            {/* Header + Search */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
                <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-1">History</p>
                    <h2 className="text-xl font-black tracking-tight text-[#0D0D0D]">All Sessions</h2>
                </div>
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="relative">
                        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                        <input
                            type="text"
                            value={query}
                            onChange={e => setQuery(e.target.value)}
                            placeholder="Search sessions..."
                            className="pl-9 pr-4 py-2 text-sm bg-white border border-gray-200 rounded-xl text-[#0D0D0D] placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10 transition-all w-56"
                        />
                        {query && (
                            <button
                                onClick={() => setQuery('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 hover:text-gray-600 transition-colors"
                            >
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        )}
                    </div>

                    {/* Count badge */}
                    <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full whitespace-nowrap">
                        {filtered.length} / {sessions.length}
                    </span>
                </div>
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtered.map(session => (
                        <Link
                            key={session.id}
                            href={`/session/${session.id}`}
                            className="group bg-white border border-gray-100 p-5 rounded-xl transition-all flex flex-col justify-between min-h-[140px] hover:border-indigo-200 hover:shadow-md hover:shadow-indigo-500/5"
                        >
                            <div>
                                {/* Highlight matching text in title */}
                                <h4 className="font-black text-[#0D0D0D] group-hover:text-indigo-600 transition-colors text-sm line-clamp-1 mb-2">
                                    {highlightMatch(session.title, query)}
                                </h4>
                                <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-medium">
                                    {highlightMatch(session.problem_statement || '', query)}
                                </p>
                            </div>
                            <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                                <span
                                    className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                                    style={
                                        session.visibility === 'private'
                                            ? { background: '#FFF1F2', color: '#E11D48' }
                                            : { background: '#EEF2FF', color: '#4F46E5' }
                                    }
                                >
                                    {session.visibility}
                                </span>
                                <span className="text-[10px] font-semibold text-gray-400">
                                    {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : query ? (
                <div className="py-14 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-white">
                    <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center mx-auto mb-3">
                        <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No results for &ldquo;{query}&rdquo;</p>
                    <button onClick={() => setQuery('')} className="mt-2 text-xs text-indigo-400 hover:text-indigo-600 font-semibold transition-colors">
                        Clear search
                    </button>
                </div>
            ) : (
                <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-white">
                    <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No sessions yet</p>
                    <p className="text-xs text-gray-300 mt-1">Create your first room above to get started</p>
                </div>
            )}
        </div>
    )
}

// Wrap matched substring in a highlighted span
function highlightMatch(text: string, query: string) {
    if (!query.trim()) return text
    const idx = text.toLowerCase().indexOf(query.toLowerCase())
    if (idx === -1) return text
    return (
        <>
            {text.slice(0, idx)}
            <mark className="bg-indigo-100 text-indigo-700 rounded-sm px-0.5 not-italic font-semibold">
                {text.slice(idx, idx + query.length)}
            </mark>
            {text.slice(idx + query.length)}
        </>
    )
}
