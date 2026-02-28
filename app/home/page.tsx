import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSession, joinSession } from '@/app/actions/sessions'
import { logout } from '@/app/actions/auth'

export default async function HomePage() {
    const supabase = await createServerClientInstance()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch sessions user can access
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
            id: 'learning',
            label: 'Learning Space',
            tag: 'Study',
            description: 'Structured sessions for digging into concepts, papers, or topics as a group. Evidence-backed discussion.',
            color: '#6366F1',
            lightBg: '#EEF2FF',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
            ),
            placeholder: 'e.g. Distributed Systems — CAP Theorem Deep Dive',
            statementPlaceholder: 'What concept or paper are we breaking down today?',
        },
        {
            id: 'gd',
            label: 'Group Discussion',
            tag: 'Debate',
            description: 'Open-ended collaborative reasoning rooms. Post claims, counter-arguments, and let AI score the logic.',
            color: '#7C3AED',
            lightBg: '#F5F3FF',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z" />
                </svg>
            ),
            placeholder: 'e.g. Remote Work vs Office — Which drives higher output?',
            statementPlaceholder: 'What is the central question or motion being debated?',
        },
        {
            id: 'sandbox',
            label: 'Sandbox',
            tag: 'Explore',
            description: 'Freeform workspace for brainstorming, ideation, or early-stage thinking without fixed structure.',
            color: '#0891B2',
            lightBg: '#ECFEFF',
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
            ),
            placeholder: 'e.g. New product brainstorm — Q3 roadmap ideas',
            statementPlaceholder: 'What are we exploring or ideating on today?',
        },
    ]

    return (
        <div className="min-h-screen bg-[#FAFAFA] text-[#0D0D0D]" style={{ fontFamily: "'Inter', -apple-system, sans-serif" }}>
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap');
                .btn-dark { background: #0D0D0D; color: white; transition: all 0.18s ease; }
                .btn-dark:hover { background: #4F46E5; transform: translateY(-1px); }
                .space-card { transition: all 0.2s ease; }
                .space-card:hover { transform: translateY(-2px); box-shadow: 0 16px 40px rgba(0,0,0,0.07); }
                .session-card:hover { border-color: #c7d2fe; box-shadow: 0 4px 20px rgba(79,70,229,0.07); }
                input:focus, textarea:focus, select:focus { outline: none; border-color: #4F46E5; box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
                .modal-trigger:checked ~ .modal-overlay { display: flex; }
            `}</style>

            {/* Nav */}
            <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-100">
                <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                            <span className="text-white font-black text-sm leading-none">B</span>
                        </div>
                        <Link href="/" className="text-[15px] font-black tracking-tight text-[#0D0D0D] hover:text-indigo-600 transition-colors">Bitlazy</Link>
                        <span className="text-gray-200 mx-1">/</span>
                        <span className="text-sm font-semibold text-gray-400">Home</span>
                    </div>

                    <div className="flex items-center gap-3">
                        <Link href="/profile" className="flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-gray-900 px-3 py-2 hover:bg-gray-50 rounded-lg transition-all">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                            Profile
                        </Link>
                        <form action={logout}>
                            <button className="text-sm font-medium text-gray-400 hover:text-red-500 px-3 py-2 rounded-lg hover:bg-red-50 transition-all">Logout</button>
                        </form>
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-black text-xs uppercase" style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                            {userInitials}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">

                {/* Greeting */}
                <div className="mb-10">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-500 mb-1">Welcome back</p>
                    <h1 className="text-3xl font-black tracking-tight text-[#0D0D0D]">
                        {profile?.name || 'Explorer'} <span className="text-gray-300">—</span> what are we building today?
                    </h1>
                </div>

                {/* Quick actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-14">
                    {/* Create Room */}
                    <div className="bg-[#0D0D0D] rounded-2xl p-7 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 w-40 h-40 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/4 pointer-events-none" style={{ background: 'rgba(79,70,229,0.2)' }}></div>
                        <div className="relative z-10">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: 'rgba(79,70,229,0.3)', color: '#818CF8' }}>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-black text-white mb-1.5">Create New Room</h2>
                            <p className="text-sm text-gray-400 font-medium leading-relaxed mb-6">Start a reasoning session, debate, or study group from scratch.</p>
                            <form action={createSession} className="space-y-3">
                                <input
                                    name="title"
                                    required
                                    placeholder="Session title..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                                />
                                <textarea
                                    name="problem_statement"
                                    required
                                    rows={2}
                                    placeholder="Problem statement or goal..."
                                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-gray-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none resize-none"
                                />
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-2 flex-1">
                                        <label className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/8 has-[:checked]:border-indigo-500 transition-all">
                                            <input type="radio" name="visibility" value="public" defaultChecked className="w-3 h-3 accent-indigo-500" />
                                            <span className="text-xs font-semibold text-gray-400">Public</span>
                                        </label>
                                        <label className="flex items-center gap-2 flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2 cursor-pointer hover:bg-white/8 has-[:checked]:border-indigo-500 transition-all">
                                            <input type="radio" name="visibility" value="private" className="w-3 h-3 accent-indigo-500" />
                                            <span className="text-xs font-semibold text-gray-400">Private</span>
                                        </label>
                                    </div>
                                    <button className="shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-bold text-[#0D0D0D] transition-all hover:opacity-90" style={{ background: '#818CF8' }}>
                                        Create
                                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    {/* Join Room */}
                    <div className="bg-white border border-gray-100 rounded-2xl p-7 relative overflow-hidden">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.75">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <h2 className="text-lg font-black text-[#0D0D0D] mb-1.5">Join Existing Group</h2>
                        <p className="text-sm text-gray-500 font-medium leading-relaxed mb-6">Have an invite code? Paste it below to jump straight into a live session.</p>
                        <form action={joinSession} className="space-y-3">
                            <input
                                name="invite_code"
                                required
                                placeholder="Paste invite code here..."
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-3.5 py-2.5 text-sm text-[#0D0D0D] placeholder-gray-400 transition-all outline-none"
                            />
                            <button className="btn-dark w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold">
                                Join Room
                                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                            </button>
                        </form>

                        {/* Divider */}
                        <div className="mt-6 pt-6 border-t border-gray-100">
                            <p className="text-xs font-bold uppercase tracking-widest text-gray-300 mb-3">Recent Sessions</p>
                            <div className="space-y-2">
                                {(sessions || []).slice(0, 3).map((s: { id: string; title: string; visibility: string }) => (
                                    <Link key={s.id} href={`/session/${s.id}`} className="session-card flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-gray-100 transition-all group">
                                        <span className="text-sm font-semibold text-gray-700 group-hover:text-indigo-600 transition-colors truncate mr-3">{s.title}</span>
                                        <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={s.visibility === 'private' ? { background: '#FFF1F2', color: '#E11D48' } : { background: '#EEF2FF', color: '#4F46E5' }}>
                                            {s.visibility}
                                        </span>
                                    </Link>
                                ))}
                                {!sessions?.length && (
                                    <p className="text-xs text-gray-400 font-medium">No sessions yet. Create your first one →</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Spaces */}
                <div className="mb-6">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] mb-1.5" style={{ color: '#4F46E5' }}>Workspaces</p>
                    <h2 className="text-2xl font-black tracking-tight text-[#0D0D0D]">Choose your space</h2>
                    <p className="text-sm text-gray-500 font-medium mt-1">Each space is designed for a different kind of collaborative thinking.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-14">
                    {spaces.map((space) => (
                        <div key={space.id} className="space-card bg-white border border-gray-100 rounded-2xl overflow-hidden">
                            {/* Card header */}
                            <div className="px-6 pt-6 pb-5">
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: space.lightBg, color: space.color }}>
                                        {space.icon}
                                    </div>
                                    <span className="text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border" style={{ background: space.lightBg, color: space.color, borderColor: space.lightBg }}>
                                        {space.tag}
                                    </span>
                                </div>
                                <h3 className="text-base font-black text-[#0D0D0D] mb-1.5">{space.label}</h3>
                                <p className="text-xs text-gray-500 leading-relaxed font-medium">{space.description}</p>
                            </div>

                            {/* Create form inside space */}
                            <div className="px-6 pb-6 border-t border-gray-50 pt-5">
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400 mb-3">Start a new {space.tag.toLowerCase()} session</p>
                                <form action={createSession} className="space-y-2.5">
                                    <input
                                        name="title"
                                        required
                                        placeholder={space.placeholder}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 text-xs text-[#0D0D0D] placeholder-gray-400 transition-all outline-none"
                                    />
                                    <textarea
                                        name="problem_statement"
                                        required
                                        rows={2}
                                        placeholder={space.statementPlaceholder}
                                        className="w-full bg-gray-50 border border-gray-100 rounded-lg px-3 py-2.5 text-xs text-[#0D0D0D] placeholder-gray-400 transition-all outline-none resize-none"
                                    />
                                    <input type="hidden" name="visibility" value="public" />
                                    <button
                                        className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90"
                                        style={{ background: space.color }}
                                    >
                                        Launch {space.tag} Session
                                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5"><path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
                                    </button>
                                </form>
                            </div>
                        </div>
                    ))}
                </div>

                {/* All sessions */}
                <div>
                    <div className="flex items-center justify-between mb-5">
                        <div>
                            <p className="text-xs font-bold uppercase tracking-[0.18em] text-gray-400 mb-1">History</p>
                            <h2 className="text-xl font-black tracking-tight text-[#0D0D0D]">All Sessions</h2>
                        </div>
                        <span className="text-xs font-bold text-gray-400 bg-gray-100 px-2.5 py-1 rounded-full">{sessions?.length || 0} total</span>
                    </div>

                    {sessions && sessions.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {sessions.map((session: { id: string; title: string; problem_statement: string; visibility: string; created_at: string }) => (
                                <Link
                                    key={session.id}
                                    href={`/session/${session.id}`}
                                    className="session-card group bg-white border border-gray-100 p-5 rounded-xl transition-all flex flex-col justify-between min-h-[140px]"
                                >
                                    <div>
                                        <h4 className="font-black text-[#0D0D0D] group-hover:text-indigo-600 transition-colors text-sm line-clamp-1 mb-2">{session.title}</h4>
                                        <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed font-medium">{session.problem_statement}</p>
                                    </div>
                                    <div className="mt-4 flex items-center justify-between border-t border-gray-50 pt-3">
                                        <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full" style={session.visibility === 'private' ? { background: '#FFF1F2', color: '#E11D48' } : { background: '#EEF2FF', color: '#4F46E5' }}>
                                            {session.visibility}
                                        </span>
                                        <span className="text-[10px] font-semibold text-gray-400">
                                            {new Date(session.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="py-16 text-center border-2 border-dashed border-gray-100 rounded-2xl bg-white">
                            <p className="text-sm font-bold text-gray-300 uppercase tracking-widest">No sessions yet</p>
                            <p className="text-xs text-gray-300 mt-1">Create your first room above to get started</p>
                        </div>
                    )}
                </div>
            </main>

            {/* Footer */}
            <footer className="mt-16 py-6 px-6 border-t border-gray-100">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-medium">© 2026 Bitlazy</span>
                    <Link href="/" className="text-xs font-semibold text-gray-400 hover:text-indigo-600 transition-colors">Back to landing</Link>
                </div>
            </footer>
        </div>
    )
}
