'use client'

import { useState } from 'react'

export interface SessionSummary {
    key_claims: string[]
    supporting_evidence: string[]
    unresolved_disagreements: string[]
    open_questions: string[]
}

export default function SessionSynthesis({ sessionId }: { sessionId: string }) {
    const [summary, setSummary] = useState<SessionSummary | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleGenerate = async () => {
        setIsLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/session-summary', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId })
            })
            const data = await res.json()
            if (res.ok) {
                setSummary(data.summary)
            } else {
                setError(data.error || 'Failed to generate synthesis.')
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <aside className="w-80 bg-slate-50 border-l border-slate-200 hidden xl:flex flex-col shrink-0">
            <div className="p-6 border-b border-slate-200 bg-white flex justify-between items-center">
                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Synthesis & Notes</h3>
                {!summary && !isLoading && (
                    <button
                        onClick={handleGenerate}
                        className="text-[10px] bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-bold uppercase tracking-widest px-3 py-1.5 rounded transition-all"
                    >
                        Generate
                    </button>
                )}
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {isLoading ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center h-full gap-4">
                        <div className="w-6 h-6 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Synthesizing Session...</p>
                    </div>
                ) : error ? (
                    <div className="p-8 flex flex-col items-center justify-center text-center h-full gap-2">
                        <p className="text-xs font-bold text-red-500 uppercase">{error}</p>
                        <button onClick={handleGenerate} className="text-[10px] underline text-slate-500">Try Again</button>
                    </div>
                ) : summary ? (
                    <div className="p-6 space-y-6 animate-in fade-in duration-500">
                        <section>
                            <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>Key Claims</h4>
                            <ul className="space-y-2">
                                {summary.key_claims.map((c, i) => (
                                    <li key={i} className="text-xs text-slate-700 leading-relaxed font-medium pl-3 border-l-2 border-blue-100">{c}</li>
                                ))}
                            </ul>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-green-500"></div>Strongest Evidence</h4>
                            <ul className="space-y-2">
                                {summary.supporting_evidence.map((c, i) => (
                                    <li key={i} className="text-xs text-slate-700 leading-relaxed font-medium pl-3 border-l-2 border-green-100">{c}</li>
                                ))}
                            </ul>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-rose-500"></div>Unresolved Debates</h4>
                            <ul className="space-y-2">
                                {summary.unresolved_disagreements.map((c, i) => (
                                    <li key={i} className="text-xs text-slate-700 leading-relaxed font-medium pl-3 border-l-2 border-rose-100">{c}</li>
                                ))}
                            </ul>
                        </section>
                        <section>
                            <h4 className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-3 flex items-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-amber-500"></div>Open Questions</h4>
                            <ul className="space-y-2">
                                {summary.open_questions.map((c, i) => (
                                    <li key={i} className="text-xs text-slate-700 leading-relaxed font-medium pl-3 border-l-2 border-amber-100">{c}</li>
                                ))}
                            </ul>
                        </section>
                        <div className="pt-4 border-t border-slate-200">
                            <button
                                onClick={handleGenerate}
                                className="w-full text-[10px] bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold uppercase tracking-widest px-3 py-2 rounded transition-all"
                            >
                                Regenerate Synthesis
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full p-6 flex flex-col items-center justify-center text-center">
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-slate-200 flex items-center justify-center mb-4 text-xl">📝</div>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No notes compiled yet</p>
                        <p className="mt-2 text-[11px] text-slate-400 max-w-[160px] leading-relaxed">System-generated synthesis will appear here when you generate it.</p>
                    </div>
                )}
            </div>
        </aside>
    )
}
