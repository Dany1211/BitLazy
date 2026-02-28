'use client'

import { useMemo } from 'react'
import { AIScore } from '@/lib/metricsEngine'
import { Message } from '@/hooks/useRealtimeMessages'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

interface MetricsDashboardProps {
    messages: Message[]
    scores: AIScore[]
}

export default function MetricsDashboard({ messages, scores }: MetricsDashboardProps) {

    // Extract a Set of actually participating names to filter out AI hallucinations
    const validNames = useMemo(() => {
        if (!messages) return new Set<string>()
        return new Set(messages.map(m => (m.profiles as { name?: string })?.name).filter(Boolean) as string[])
    }, [messages])


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

    // Generate Chart Data from historical scores
    const chartData = useMemo(() => {
        if (!scores) return []
        const history = scores
            .filter(s => s.rich_evaluation)
            .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()) // Chronological order

        return history.map((s, index) => ({
            name: `Msg ${index + 1}`,
            grade: s.rich_evaluation?.global_grade || 50
        }))
    }, [scores])

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
        <div className="bg-white/80 backdrop-blur-md border-l border-slate-200/50 p-5 shrink-0 w-80 min-w-[300px] flex flex-col overflow-y-auto h-full space-y-6 custom-scrollbar relative z-20">

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <h3 className="text-[10px] font-black text-slate-700 uppercase tracking-widest">
                        AI Insights
                    </h3>
                </div>
            </div>

            {/* Circular Core Score */}
            <div className={`p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center relative overflow-hidden transition-all duration-700 shadow-sm hover:shadow-lg ${getGradeColor(global_grade)}`}>
                <div className="absolute inset-0 bg-white/40 backdrop-blur-sm -z-10"></div>
                <span className="text-[9px] font-black uppercase tracking-wider mb-2 z-10 text-center px-4 leading-tight">Logic Grade</span>
                <div className="text-5xl font-black tracking-tighter z-10 drop-shadow-sm flex items-start">
                    {global_grade}
                </div>
            </div>

            {/* AI Session Trajectory Graph */}
            {chartData.length > 1 && (
                <div className="bg-white p-3 rounded-[1.5rem] border border-slate-100 shadow-sm">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block pl-1">Logic Trajectory</span>
                    <div className="h-20 w-full -ml-3">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorGrade" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <XAxis dataKey="name" hide />
                                <YAxis domain={[0, 100]} hide />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', fontSize: '10px', fontWeight: 'bold' }}
                                    itemStyle={{ color: '#6366f1' }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="grade"
                                    stroke="#6366f1"
                                    strokeWidth={2}
                                    fillOpacity={1}
                                    fill="url(#colorGrade)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* Live Actionable Advice Tracker */}
            <div>
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 block pl-1">Live Strategy</span>
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-4 rounded-[1.5rem] relative overflow-hidden group shadow-md shadow-indigo-500/20">
                    <div className="absolute top-[-20%] right-[-10%] w-16 h-16 bg-white/20 rounded-full blur-[20px]"></div>
                    <p className="text-[13px] font-semibold text-white leading-snug tracking-wide">
                        &quot;{live_advice}&quot;
                    </p>
                </div>
            </div>

            {/* Participant Leaderboard */}
            <div className="bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm">
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block pl-1">Participant Logic</span>
                <div className="space-y-2">
                    {Object.entries(user_grades)
                        .filter(([name]) => validNames.has(name))
                        .sort(([, a], [, b]) => (b as number) - (a as number)) // Type assertion handled
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([name, gradeStr]) => {
                            const grade = Number(gradeStr);
                            return (
                                <div key={name} className="flex items-center justify-between group">
                                    <div className="flex items-center gap-2">
                                        <div className="w-6 h-6 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-black uppercase border border-slate-200">
                                            {name.charAt(0)}
                                        </div>
                                        <span className="text-[11px] font-bold text-slate-700 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{name}</span>
                                    </div>
                                    <div className={`text-[10px] font-black w-6 h-6 flex items-center justify-center rounded-full shadow-sm transition-transform group-hover:scale-110 ${grade >= 80 ? 'bg-emerald-100 text-emerald-600 border border-emerald-200' :
                                        grade >= 60 ? 'bg-amber-100 text-amber-600 border border-amber-200' :
                                            'bg-rose-100 text-rose-600 border border-rose-200'
                                        }`}>
                                        {grade}
                                    </div>
                                </div>
                            )
                        })}
                    {Object.keys(user_grades).length === 0 && (
                        <div className="text-[10px] text-slate-400 italic text-center py-2">Waiting...</div>
                    )}
                </div>
            </div>
        </div>
    )
}
