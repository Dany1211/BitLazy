import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { createSession } from '@/app/actions/sessions'

export default async function ProfilePage() {
    const supabase = await createServerClientInstance()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })

    const userInitials = profile?.name?.charAt(0) || user.email?.charAt(0) || '?'

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased">
            {/* Minimal Top Border Accent */}
            <div className="h-1.5 w-full bg-emerald-500" />

            {/* Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#0F172A] rounded flex items-center justify-center">
                            <span className="text-emerald-400 font-bold text-lg leading-none">B</span>
                        </div>
                        <Link href="/" className="text-xl font-bold tracking-tight text-[#0F172A]">
                            Bitlazy
                        </Link>
                    </div>
                    <Link href="/" className="text-sm font-medium text-slate-500 hover:text-emerald-600 transition-colors px-4 py-2 hover:bg-emerald-50 rounded-lg">
                        Return Home
                    </Link>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
                <div className="flex flex-col lg:flex-row gap-16">

                    {/* Profile Sidebar (Fixed Width on Desktop) */}
                    <aside className="w-full lg:w-80 shrink-0">
                        <div className="sticky top-24 space-y-8">
                            {/* Profile Identity */}
                            <div className="flex flex-col items-center lg:items-start text-center lg:text-left">
                                <div className="h-32 w-32 rounded-2xl bg-white shadow-sm overflow-hidden border border-slate-200 p-1.5">
                                    {profile?.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Avatar" className="h-full w-full object-cover rounded-xl" />
                                    ) : (
                                        <div className="h-full w-full bg-[#0F172A] flex items-center justify-center rounded-xl">
                                            <span className="text-3xl font-bold text-emerald-400 uppercase">{userInitials}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="mt-6">
                                    <h1 className="text-2xl font-bold text-slate-900 leading-tight">
                                        {profile?.name || 'Explorer'}
                                    </h1>
                                    <p className="text-slate-500 text-sm font-medium truncate max-w-[200px]">{user.email}</p>
                                    <span className="mt-3 inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-[11px] font-bold uppercase tracking-wider rounded-md">
                                        {profile?.role || 'Contributor'}
                                    </span>
                                </div>
                            </div>

                            {/* Info Block */}
                            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-xs font-bold text-slate-400 uppercase">Member Since</span>
                                    <span className="text-sm font-semibold text-slate-700">
                                        {new Date(profile?.created_at || user.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short' })}
                                    </span>
                                </div>
                                <div className="pt-4 border-t border-slate-100">
                                    <label className="text-xs font-bold text-slate-400 uppercase block mb-2">Internal UID</label>
                                    <code className="text-[10px] text-slate-400 bg-slate-50 p-2 block rounded break-all border border-slate-100">
                                        {user.id}
                                    </code>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Content Area */}
                    <div className="flex-1 space-y-12">

                        {/* Section: Create */}
                        <section className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                                <h3 className="text-lg font-bold text-slate-800">New Collaborative Session</h3>
                            </div>
                            <form action={createSession} className="p-8 space-y-6">
                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Session Title</label>
                                        <input
                                            name="title"
                                            required
                                            placeholder="e.g. Architecture Review"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-xs font-bold text-slate-500 uppercase ml-1">Problem Statement</label>
                                        <textarea
                                            name="problem_statement"
                                            rows={4}
                                            required
                                            placeholder="What specific outcome are we looking for?"
                                            className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-sm focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 transition-all outline-none resize-none"
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button className="bg-[#0F172A] hover:bg-emerald-600 text-white px-8 py-3 rounded-lg font-bold text-sm transition-all shadow-lg shadow-slate-200 hover:shadow-emerald-200 active:scale-95">
                                        Initialize Session
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* Section: Sessions List */}
                        <section className="space-y-6">
                            <div className="flex items-center justify-between px-2">
                                <h3 className="text-lg font-bold text-slate-800">Project History</h3>
                                <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">{sessions?.length || 0} Total</span>
                            </div>

                            {sessions && sessions.length > 0 ? (
                                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
                                    {sessions.map((session) => (
                                        <Link
                                            key={session.id}
                                            href={`/session/${session.id}`}
                                            className="group bg-white border border-slate-200 p-6 rounded-xl hover:border-emerald-300 transition-all hover:shadow-md flex flex-col justify-between min-h-[160px]"
                                        >
                                            <div>
                                                <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-1">
                                                    {session.title}
                                                </h4>
                                                <p className="mt-2 text-sm text-slate-500 line-clamp-2 leading-relaxed">
                                                    {session.problem_statement}
                                                </p>
                                            </div>
                                            <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                                                    ID: {session.id.slice(0, 8)}
                                                </span>
                                                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">
                                                    {new Date(session.created_at).toLocaleDateString()}
                                                </span>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-20 text-center border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/50">
                                    <p className="text-slate-400 text-sm font-medium uppercase tracking-widest">No active history found</p>
                                </div>
                            )}
                        </section>
                    </div>

                </div>
            </main>
        </div>
    )
}
