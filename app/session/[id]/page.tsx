import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SessionChat from '@/components/SessionChat'
import SessionSynthesis from '@/components/SessionSynthesis'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createServerClientInstance()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()

    if (!session) {
        return (
            <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-4">
                <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 text-center max-w-md w-full border border-slate-100">
                    <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-3xl">🧩</div>
                    <h2 className="text-2xl font-black text-slate-900 mb-2">Session Not Found</h2>
                    <p className="text-slate-500 font-medium mb-8">This collaborative space does not exist or has been archived.</p>
                    <Link href="/profile" className="inline-block bg-[#0F172A] hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    // Fetch All Profiles to simulate participants
    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .limit(10)

    const currentUserProfile = allProfiles?.find(p => p.id === user.id)
    const userInitials = currentUserProfile?.name?.charAt(0) || user.email?.charAt(0) || '?'

    return (
        <div className="h-screen bg-[#F8FAFC] flex flex-col font-sans antialiased overflow-hidden">
            {/* Top Navigation */}
            <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-30">
                <div className="flex items-center gap-4">
                    <Link href="/profile" className="p-2 hover:bg-slate-100 rounded-lg transition-colors group">
                        <svg className="w-5 h-5 text-slate-400 group-hover:text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </Link>
                    <div className="flex items-center gap-3">
                        <div className="w-7 h-7 bg-[#0F172A] rounded flex items-center justify-center">
                            <span className="text-emerald-400 font-bold text-sm">B</span>
                        </div>
                        <h1 className="text-sm font-black text-[#0F172A] truncate max-w-[120px] sm:max-w-md tracking-tight uppercase">
                            {session.title}
                        </h1>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    {/* Collaborators Avatars */}
                    <div className="hidden sm:flex items-center gap-2">
                        <div className="flex -space-x-2">
                            {allProfiles?.slice(0, 3).map((p) => (
                                <div key={p.id} title={p.name || 'User'} className="w-8 h-8 rounded-full border-2 border-white bg-slate-100 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase overflow-hidden ring-1 ring-slate-100">
                                    {p.avatar_url ? (
                                        <img src={p.avatar_url} alt={p.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <span>{p.name?.charAt(0) || 'U'}</span>
                                    )}
                                </div>
                            ))}
                            {allProfiles && allProfiles.length > 3 && (
                                <div className="w-8 h-8 rounded-full border-2 border-white bg-[#0F172A] flex items-center justify-center text-[10px] font-black text-emerald-400 shadow-sm ring-1 ring-slate-100">
                                    +{allProfiles.length - 3}
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="h-8 w-px bg-slate-200 hidden sm:block"></div>

                    {/* Current User */}
                    <div className="flex items-center gap-3">
                        <div className="hidden md:block text-right">
                            <p className="text-[10px] font-black text-[#0F172A] uppercase leading-none">{currentUserProfile?.name || 'Explorer'}</p>
                            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">Active Now</p>
                        </div>
                        <div className="w-10 h-10 rounded-xl bg-[#0F172A] p-0.5 border border-slate-200 shadow-sm relative group cursor-pointer">
                            <div className="w-full h-full bg-slate-900 rounded-[9px] flex items-center justify-center text-emerald-400 font-black text-sm uppercase overflow-hidden">
                                {currentUserProfile?.avatar_url ? (
                                    <img src={currentUserProfile.avatar_url} className="w-full h-full object-cover" />
                                ) : userInitials}
                            </div>
                        </div>
                    </div>
                </div>
            </nav>

            <div className="flex-1 flex overflow-hidden">
                {/* Left Pane: Session Context */}
                <aside className="w-80 bg-[#0F172A] text-white flex flex-col shrink-0 z-20 shadow-2xl">
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
                            <label className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] block mb-4">Core Participants</label>
                            <div className="space-y-2">
                                {allProfiles?.map((p) => (
                                    <div key={p.id} className="flex items-center gap-3 group cursor-pointer hover:bg-white/5 p-2 rounded-xl transition-all border border-transparent hover:border-white/10">
                                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-black text-[10px] uppercase overflow-hidden">
                                            {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : (p.name?.charAt(0) || 'U')}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-slate-300 group-hover:text-white transition-colors">{p.name || 'Anonymous Collaborator'}</span>
                                            <span className="text-[9px] font-bold text-slate-500 uppercase tracking-tight">{p.id === user.id ? 'You' : (p.role || 'Contributor')}</span>
                                        </div>
                                        {p.id === user.id && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>}
                                    </div>
                                ))}
                            </div>
                        </section>
                    </div>
                </aside>

                {/* Center Pane: Chat Application */}
                <main className="flex-1 flex flex-col relative bg-white z-10 shadow-xl">
                    <SessionChat sessionId={id} userId={user.id} />
                </main>

                {/* Right Pane: Session Synthesis */}
                <SessionSynthesis sessionId={id} />
            </div>
        </div>
    )
}

