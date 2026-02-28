'use client'

import { useMemo } from 'react'
import { computeSessionMetrics, AIScore } from '@/lib/metricsEngine'
import { Message } from '@/hooks/useRealtimeMessages'

interface MetricsDashboardProps {
    messages: Message[]
    scores: AIScore[]
}

const ProgressBar = ({ value, color, label }: { value: number, color: string, label: string }) => (
    <div className="mb-4">
        <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 uppercase tracking-wider">
            <span>{label}</span>
            <span>{Math.round(value * 100)}%</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div className={`h-2 rounded-full ${color} transition-all duration-500 ease-out`} style={{ width: `${Math.max(0, Math.min(100, value * 100))}%` }}></div>
        </div>
    </div>
)

export default function MetricsDashboard({ messages, scores }: MetricsDashboardProps) {
    const metrics = useMemo(() => computeSessionMetrics(messages, scores), [messages, scores])

    return (
        <div className="bg-slate-50 border-l border-slate-200 text-left p-6 shrink-0 w-80 hidden 2xl:block overflow-y-auto h-full">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path></svg>
                Cognitive Metrics
            </h3>

            {/* Main Health Score */}
            <div className="bg-slate-50 border border-slate-100 p-5 rounded-2xl mb-8 flex flex-col items-center justify-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 group-hover:opacity-100 opacity-50 transition-opacity"></div>
                <span className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-1 z-10">Health Index</span>
                <div className="text-5xl font-black text-slate-800 z-10">
                    {metrics.cognitiveHealth}<span className="text-xl text-slate-400">/100</span>
                </div>
                <p className="text-xs text-slate-500 mt-2 text-center z-10">
                    Composite score based on depth, diversity, and balance.
                </p>
            </div>

            <div className="space-y-6">
                <div>
                    <ProgressBar value={metrics.participationFairness} color="bg-blue-500" label="Participation Fairness" />
                    <p className="text-[10px] text-slate-500 -mt-2 leading-relaxed">Measures equality of speaking time. Drops if one user dominates.</p>
                </div>

                <div>
                    <ProgressBar value={metrics.diversityIndex} color="bg-purple-500" label="Reasoning Diversity" />
                    <p className="text-[10px] text-slate-500 -mt-2 leading-relaxed">Measures the variety of message types used (claims vs evidence vs synthesis).</p>
                </div>

                <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 uppercase tracking-wider">
                        <span>Counterargument Ratio</span>
                        <span className={metrics.counterargumentRatio === 0 ? 'text-red-500' : ''}>{Math.round(metrics.counterargumentRatio * 100)}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden mb-1">
                        <div className={`h-2 rounded-full ${metrics.counterargumentRatio === 0 ? 'bg-red-400' : 'bg-rose-500'} transition-all`} style={{ width: `${metrics.counterargumentRatio * 100}%` }}></div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Target: ~20-25%. Too low risks an echo chamber.</p>
                </div>

                <div>
                    <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 uppercase tracking-wider">
                        <span>Depth Trend</span>
                        <span className={metrics.depthTrend > 0 ? 'text-emerald-500' : metrics.depthTrend < 0 ? 'text-red-500' : 'text-slate-500'}>
                            {metrics.depthTrend > 0 ? '+' : ''}{(metrics.depthTrend * 100).toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden relative mb-1 flex">
                        <div className="w-1/2 flex justify-end">
                            <div className="h-2 bg-red-400 rounded-l-full" style={{ width: `${Math.min(100, Math.max(0, -metrics.depthTrend * 100))}%` }}></div>
                        </div>
                        <div className="w-1/2 flex justify-start">
                            <div className="h-2 bg-emerald-400 rounded-r-full" style={{ width: `${Math.min(100, Math.max(0, metrics.depthTrend * 100))}%` }}></div>
                        </div>
                        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-slate-300"></div>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">Momentum of semantic depth over the last few messages.</p>
                </div>
            </div>
        </div>
    )
}
