import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSession, joinSession } from '@/app/actions/sessions'
import { logout } from '@/app/actions/auth'

// Helper function to map category to specific UI styles for the history section
const getCategoryStyles = (category: string) => {
    switch (category?.toLowerCase()) {
        case 'general':
            return { label: 'Sandbox', bg: 'bg-cyan-500/10', text: 'text-cyan-500', border: 'border-cyan-500/20' };
        case 'learning':
            return { label: 'Learning Space', bg: 'bg-indigo-500/10', text: 'text-indigo-500', border: 'border-indigo-500/20' };
        case 'debate':
            return { label: 'Group Discussion', bg: 'bg-violet-500/10', text: 'text-violet-500', border: 'border-violet-500/20' };
        case 'dsa':
            return { label: 'DSA Logic', bg: 'bg-orange-500/10', text: 'text-orange-500', border: 'border-orange-500/20' };
        default:
            return { label: 'Session', bg: 'bg-slate-500/10', text: 'text-slate-500', border: 'border-slate-500/20' };
    }
};

export default async function HomePage() {
    const supabase = await createServerClientInstance()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: userMessages } = await supabase
        .from('messages')
        .select('session_id')
        .eq('user_id', user.id)

    const userSessionIds = userMessages
        ? Array.from(new Set(userMessages.map((m: { session_id: string }) => m.session_id)))
        : []

    const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .or(`visibility.eq.public,created_by.eq.${user.id},id.in.(${userSessionIds.length > 0 ? userSessionIds.join(',') : '00000000-0000-0000-0000-000000000000'})`)
        .order('created_at', { ascending: false })

    const userInitials = profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase() || '?'

    const spaces = [
        {
            id: 'sandbox',
            label: 'Sandbox',
            tag: 'Explore',
            category: 'General',
            description: 'Freeform workspace for brainstorming, ideation, or early-stage thinking.',
            color: '#0891B2',
            lightBg: '#ECFEFF',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            placeholder: 'e.g. New product brainstorm',
            statementPlaceholder: 'What are we ideating on?',
        },
        {
            id: 'learning',
            label: 'Learning Space',
            tag: 'Study',
            category: 'Learning',
            description: 'Structured sessions for digging into concepts or papers. Evidence-backed discussion.',
            color: '#6366F1',
            lightBg: '#EEF2FF',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            placeholder: 'e.g. Distributed Systems — CAP Theorem',
            statementPlaceholder: 'What concept are we breaking down?',
        },
        {
            id: 'gd',
            label: 'Group Discussion',
            tag: 'Debate',
            category: 'Debate',
            description: 'Collaborative reasoning rooms. Post claims, counter-arguments, and let AI score logic.',
            color: '#7C3AED',
            lightBg: '#F5F3FF',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
            ),
            placeholder: 'e.g. Remote Work vs Office output',
            statementPlaceholder: 'What is the central question?',
        },
        {
            id: 'dsa',
            label: 'DSA Logic',
            tag: 'Code',
            category: 'DSA',
            description: 'Deep-dive into Data Structures and Algorithms. Peer review your logic and optimization.',
            color: '#EA580C',
            lightBg: '#FFF7ED',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5" />
                </svg>
            ),
            placeholder: 'e.g. Inverting a Binary Tree — Optimization',
            statementPlaceholder: 'Which algorithm or problem are we solving?',
        },
    ]

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#0D0D0D]" style={{ fontFamily: "'Inter', sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
                .btn-dark { background: #0D0D0D; color: white; transition: all 0.18s ease; }
                .btn-dark:hover { background: #4F46E5; transform: translateY(-1px); }
                .space-card { transition: all 0.2s ease; border: 1px solid #f3f4f6; height: 100%; }
                .space-card:hover { transform: translateY(-2px); box-shadow: 0 12px 30px rgba(0,0,0,0.04); border-color: #e5e7eb; }
                input:focus, textarea:focus { outline: none; border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.08); }
            `}</style>

            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                            <span className="text-white font-black text-sm leading-none">B</span>
                        </div>
                        <Link href="/" className="text-[15px] font-black tracking-tight text-[#0D0D0D]">Bitlazy</Link>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/profile" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 rounded-lg transition-all">
                            Profile
                        </Link>
                        <form action={logout}>
                            <button className="text-sm font-medium text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg transition-all">Logout</button>
                        </form>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-16 items-start">
                    <div className="lg:col-span-2">
                        <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500 mb-1">Welcome back</p>
                        <h1 className="text-4xl font-black tracking-tight text-[#0D0D0D] mb-4">
                            {profile?.name || 'Explorer'} <span className="text-gray-300">—</span> what are we building today?
                        </h1>
                        <p className="text-gray-500 font-medium max-w-xl">
                            Select a dedicated workspace below to start a new structured reasoning session or join an existing group with an invite code.
                        </p>
                    </div>

                    <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </div>
                            <h2 className="text-base font-bold text-[#0D0D0D]">Join Room</h2>
                        </div>
                        <form action={joinSession} className="space-y-3">
                            <input
                                name="invite_code"
                                required
                                placeholder="Enter invite code..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2 text-sm text-[#0D0D0D] transition-all outline-none"
                            />
                            <button className="btn-dark w-full flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-bold">
                                Join
                            </button>
                        </form>
                    </div>
                </div>

                <div className="mb-8">
                    <h2 className="text-2xl font-black tracking-tight text-[#0D0D0D]">Workspaces</h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">Each space is designed for a different kind of collaborative thinking.</p>
                </div>

                {/* Workspace Cards with Visibility Toggle */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
                    {spaces.map((space) => (
                        <div key={space.id} className="space-card bg-white rounded-2xl flex flex-col">
                            <div className="p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: space.lightBg, color: space.color }}>
                                        {space.icon}
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md" style={{ background: space.lightBg, color: space.color }}>
                                        {space.tag}
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-[#0D0D0D] mb-2">{space.label}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium mb-6 flex-grow">{space.description}</p>
                                
                                <form action={createSession} className="space-y-3 mt-auto">
                                    <input
                                        name="title"
                                        required
                                        placeholder={space.placeholder}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs transition-all outline-none"
                                    />
                                    <textarea
                                        name="problem_statement"
                                        required
                                        rows={2}
                                        placeholder={space.statementPlaceholder}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2 text-xs transition-all outline-none resize-none"
                                    />
                                    
                                    {/* Visibility Toggle within Workspace card */}
                                    <div className="flex gap-2 pt-1">
                                        <label className="flex items-center gap-1.5 flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-100 has-[:checked]:border-indigo-500 transition-all">
                                            <input type="radio" name="visibility" value="public" defaultChecked className="w-3 h-3 accent-indigo-500" />
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Public</span>
                                        </label>
                                        <label className="flex items-center gap-1.5 flex-1 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 cursor-pointer hover:bg-gray-100 has-[:checked]:border-indigo-500 transition-all">
                                            <input type="radio" name="visibility" value="private" className="w-3 h-3 accent-indigo-500" />
                                            <span className="text-[9px] font-bold text-gray-500 uppercase tracking-tighter">Private</span>
                                        </label>
                                    </div>

                                    <input type="hidden" name="category" value={space.category} />
                                    <button
                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 mt-2"
                                        style={{ background: space.color }}
                                    >
                                        Launch {space.tag}
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>

                {/* History Section with Category Badges */}
                <div className="border-t border-gray-100 pt-16">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black tracking-tight text-[#0D0D0D]">History</h2>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">{sessions?.length || 0} Total Sessions</span>
                    </div>

                    <div className="space-y-4">
                        {sessions && sessions.length > 0 ? (
                            sessions.map((session) => {
                                const cat = getCategoryStyles(session.category);
                                
                                return (
                                    <Link
                                        key={session.id}
                                        href={`/session/${session.id}`}
                                        className="group flex flex-col md:flex-row md:items-center justify-between p-6 bg-white border border-gray-100 rounded-2xl hover:border-indigo-200 transition-all shadow-sm hover:shadow-md"
                                    >
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-3">
                                                {/* Category Badge */}
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border ${cat.bg} ${cat.text} ${cat.border}`}>
                                                    {cat.label}
                                                </span>
                                                <h3 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                    {session.title}
                                                </h3>
                                            </div>
                                            <p className="text-xs text-slate-500 line-clamp-1 font-medium">{session.problem_statement}</p>
                                        </div>

                                        <div className="flex items-center gap-8 mt-4 md:mt-0">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-1.5 h-1.5 rounded-full ${session.visibility === 'private' ? 'bg-rose-400' : 'bg-emerald-400'}`} />
                                                <span className="text-[10px] font-bold uppercase tracking-tighter text-slate-400">
                                                    {session.visibility}
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-bold text-slate-300 font-mono">
                                                {new Date(session.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </Link>
                                );
                            })
                        ) : (
                            <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-3xl bg-gray-50/50">
                                <p className="text-sm font-medium text-gray-400 uppercase tracking-widest">No active history detected</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            <footer className="py-10 border-t border-gray-100 text-center">
                <span className="text-xs text-gray-300 font-medium">© 2026 Bitlazy — Deep Intelligence</span>
            </footer>
        </div>
    )
}