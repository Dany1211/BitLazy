'use client'

import { SessionAnalyticsData } from '@/lib/analytics'

interface SessionAnalyticsProps {
    data: SessionAnalyticsData
}

export default function SessionAnalytics({ data }: SessionAnalyticsProps) {
    const getBalanceStatus = (score: number) => {
        if (score >= 80) return 'Balanced discussion'
        if (score >= 60) return 'Steady reasoning'
        return 'Needs diversity'
    }

    return (
        <div className="flex-1 bg-white overflow-y-auto custom-scrollbar p-8 space-y-12">
            {/* Section 1: Overview Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <MetricCard
                    label="Total Contributions"
                    value={data.totalContributions}
                />
                <MetricCard
                    label="Active Participants"
                    value={data.participants.length}
                />
                <MetricCard
                    label="Avg Contribution Length"
                    value={data.averageContributionLength}
                    suffix=" chars"
                />
                <MetricCard
                    label="Reasoning Balance Score"
                    value={data.reasoningBalanceScore}
                    subtitle={getBalanceStatus(data.reasoningBalanceScore)}
                />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                {/* Section 2: Contribution Breakdown */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                        Contribution Breakdown
                    </h3>
                    <div className="space-y-4">
                        {Object.entries(data.contributionBreakdown).map(([type, count]) => {
                            const percentage = data.totalContributions > 0 ? (count / data.totalContributions) * 100 : 0
                            return (
                                <div key={type} className="space-y-2">
                                    <div className="flex justify-between text-xs font-medium">
                                        <span className="capitalize text-neutral-600">{type}</span>
                                        <span className="text-neutral-900">{count}</span>
                                    </div>
                                    <div className="w-full bg-neutral-100 rounded-full h-2">
                                        <div
                                            style={{ width: `${percentage}%` }}
                                            className="h-2 bg-neutral-900 rounded-full transition-all duration-500"
                                        />
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                {/* Section 3: Participation Distribution */}
                <div className="space-y-6">
                    <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                        Participation Distribution
                    </h3>
                    <div className="space-y-4">
                        {data.participants.map((p) => (
                            <div key={p.userId} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs font-medium text-neutral-900">{p.name}</span>
                                        {p.isDominant && (
                                            <span className="text-[10px] bg-neutral-100 text-neutral-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-tight">
                                                High Dominance
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-xs text-neutral-500 font-medium">
                                        {p.contributionCount} ({p.percentage}%)
                                    </span>
                                </div>
                                <div className="w-full bg-neutral-100 rounded-full h-2">
                                    <div
                                        style={{ width: `${p.percentage}%` }}
                                        className="h-2 bg-neutral-900 rounded-full transition-all duration-500"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Section 4: Insights */}
            <div className="space-y-6 max-w-2xl">
                <h3 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                    Reasoning Insights
                </h3>
                <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6">
                    <ul className="space-y-4">
                        {data.insights.map((insight, i) => (
                            <li key={i} className="flex gap-4 text-sm text-neutral-600 leading-relaxed">
                                <div className="w-1 h-1 bg-neutral-400 rounded-full mt-2 shrink-0" />
                                {insight}
                            </li>
                        ))}
                        {data.insights.length === 0 && (
                            <li className="text-sm text-neutral-400 italic">No significant insights detected yet.</li>
                        )}
                    </ul>
                </div>
            </div>

            {/* Lifetime Profile — Coming Soon */}
            <div className="pt-8 border-t border-neutral-100">
                <div className="bg-white border border-neutral-200 border-dashed rounded-2xl p-8 opacity-70 group hover:opacity-100 transition-opacity">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <h4 className="text-lg font-bold text-neutral-900 uppercase tracking-tight">
                                Lifetime Profile
                            </h4>
                            <p className="text-sm text-neutral-500 font-medium">
                                Track your reasoning growth and collaboration evolution across sessions.
                            </p>
                        </div>
                        <div>
                            <span className="inline-block bg-neutral-100 text-neutral-500 text-[10px] font-black px-4 py-2 rounded-lg uppercase tracking-widest border border-neutral-200">
                                Coming Soon
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ label, value, suffix = '', subtitle }: { label: string; value: string | number; suffix?: string; subtitle?: string }) {
    return (
        <div className="bg-white border border-neutral-200 p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow">
            <p className="text-[10px] font-black text-neutral-400 uppercase tracking-[0.2em] mb-4">
                {label}
            </p>
            <div className="flex flex-col">
                <span className="text-3xl font-semibold text-neutral-900 tracking-tighter">
                    {value}{suffix}
                </span>
                {subtitle && (
                    <span className="text-xs font-bold text-neutral-500 mt-1 uppercase tracking-tight">
                        {subtitle}
                    </span>
                )}
            </div>
        </div>
    )
}
