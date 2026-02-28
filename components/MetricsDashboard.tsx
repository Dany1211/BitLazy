'use client'

import { useMemo } from 'react'
import { AIScore } from '@/lib/metricsEngine'
import { Message } from '@/hooks/useRealtimeMessages'

interface MetricsDashboardProps {
    messages: Message[]
    scores: AIScore[]
}

export default function MetricsDashboard({ scores }: MetricsDashboardProps) {

    // Get the latest rich evaluation payload
    const latestEval = useMemo(() => {
        if (!scores || scores.length === 0) return null
        // Find the most recent score that has a rich_evaluation attached
        const richScores = scores.filter(s => s.rich_evaluation)
        if (richScores.length === 0) return null

        // Sort by newest
        const sorted = [...richScores].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        return sorted[0].rich_evaluation
    }, [scores])

    // Grade to Color Map
    const getGradeColor = (grade: number) => {
        if (grade >= 90) return 'text-emerald-500 border-emerald-200 bg-emerald-50/50 shadow-emerald-500/20'
        if (grade >= 75) return 'text-blue-500 border-blue-200 bg-blue-50/50 shadow-blue-500/20'
        if (grade >= 60) return 'text-amber-500 border-amber-200 bg-amber-50/50 shadow-amber-500/20'
        return 'text-rose-500 border-rose-200 bg-rose-50/50 shadow-rose-500/20'
    }

    if (!latestEval) {
        return (
            <div className="bg-slate-50 border-l border-slate-200 p-6 shrink-0 w-80 hidden 2xl:flex flex-col items-center justify-center h-full">
                <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest text-center">Awaiting AI Evaluation...</p>
                <p className="text-[10px] text-slate-400 text-center mt-2 px-4">Start contributing to the session to generate the AI Logic Grade.</p>
            </div>
        )
    }

    const { global_grade, live_advice, user_grades } = latestEval

    return (
        <div className="bg-slate-50 border-l border-slate-200 text-left p-6 shrink-0 w-80 hidden 2xl:flex flex-col overflow-y-auto h-full space-y-8">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                AI Live Evaluation
            </h3>

            {/* Circular Core Score */}
            <div className={`p-8 rounded-3xl border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 shadow-[0_0_40px_rgba(0,0,0,0)] hover:shadow-xl ${getGradeColor(global_grade)}`}>
                <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent"></div>
                <span className="text-[10px] font-black uppercase tracking-widest mb-2 z-10 opacity-70">Session Logic Grade</span>
                <div className="text-6xl font-black tracking-tighter z-10 drop-shadow-sm flex items-start">
                    {global_grade}
                </div>
            </div>

            {/* Live Actionable Advice Tracker */}
            <div>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest bg-slate-100 px-3 py-1 rounded-full mb-3 inline-block">Live Advice</span>
                <div className="bg-[#0F172A] p-4 rounded-2xl relative overflow-hidden group">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500"></div>
                    <p className="text-sm font-medium text-slate-200 leading-snug">
                        &quot;{live_advice}&quot;
                    </p>
                </div>
            </div>

            {/* Participant Leaderboard */}
            <div className="flex-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 block border-b border-slate-200 pb-2">Participant Grades</span>
                <div className="space-y-3">
                    {Object.entries(user_grades).map(([name, grade]) => (
                        <div key={name} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-xl">
                            <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-black uppercase">
                                    {name.charAt(0)}
                                </div>
                                <span className="text-xs font-bold text-slate-700">{name}</span>
                            </div>
                            <div className={`text-xs font-black w-8 h-8 flex items-center justify-center rounded-lg ${grade >= 80 ? 'bg-emerald-100 text-emerald-600' :
                                grade >= 60 ? 'bg-amber-100 text-amber-600' :
                                    'bg-rose-100 text-rose-600'
                                }`}>
                                {grade}
                            </div>
                        </div>
                    ))}
                    {Object.keys(user_grades).length === 0 && (
                        <div className="text-xs text-slate-400 italic text-center py-4">No ranked contributors yet</div>
                    )}
                </div>
            </div>
        </div>
    )
}
