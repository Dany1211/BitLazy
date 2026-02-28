import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'

export default async function ProfilePage() {
    const supabase = await createServerClientInstance()

    // Ensure user is authenticated
    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch the public profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    // Fetch created sessions
    const { data: sessions } = await supabase
        .from('sessions')
        .select('*')
        .order('created_at', { ascending: false })

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Navigation */}
            <nav className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between h-16">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                                <span className="text-white font-bold text-lg leading-none">B</span>
                            </div>
                            <Link href="/" className="text-xl font-bold text-slate-900 tracking-tight">
                                Bitlazy
                            </Link>
                        </div>
                        <div className="flex items-center">
                            <Link
                                href="/"
                                className="text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors mr-4"
                            >
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="flex-1 py-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column: Profile Card */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                                <div className="bg-indigo-600 h-32 relative"></div>

                                <div className="px-6 pb-10">
                                    <div className="relative -mt-16 flex flex-col items-center mb-6">
                                        <div className="h-32 w-32 rounded-full border-4 border-white bg-indigo-100 overflow-hidden shadow-sm flex items-center justify-center">
                                            {profile?.avatar_url ? (
                                                <img
                                                    src={profile.avatar_url}
                                                    alt="Avatar"
                                                    className="h-full w-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-4xl font-semibold text-indigo-400">
                                                    {profile?.name?.charAt(0)?.toUpperCase() || user.email?.charAt(0)?.toUpperCase()}
                                                </span>
                                            )}
                                        </div>
                                        <h1 className="text-2xl font-bold text-slate-900 truncate mt-4">
                                            {profile?.name || 'Anonymous User'}
                                        </h1>
                                        <p className="text-sm font-medium text-slate-500">
                                            {user.email}
                                        </p>
                                        <span className="mt-3 inline-flex items-center rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20 capitalize shadow-sm">
                                            {profile?.role || 'User'}
                                        </span>
                                    </div>

                                    <div className="border-t border-slate-100 pt-6">
                                        <h3 className="text-sm font-semibold text-slate-900 mb-4 uppercase tracking-wider">Account Details</h3>
                                        <dl className="space-y-4">
                                            <div>
                                                <dt className="text-xs font-medium text-slate-500">Member Since</dt>
                                                <dd className="mt-1 text-sm text-slate-900 font-medium">
                                                    {new Date(profile?.created_at || user.created_at).toLocaleDateString()}
                                                </dd>
                                            </div>
                                            <div>
                                                <dt className="text-xs font-medium text-slate-500">Account ID</dt>
                                                <dd className="mt-1 text-xs text-slate-900 font-mono truncate">{user.id}</dd>
                                            </div>
                                        </dl>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: Sessions list and creation */}
                        <div className="lg:col-span-2 space-y-8">

                            {/* Create Session Form */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Start New Collaborative Session</h3>
                                <form className="space-y-4">
                                    <div>
                                        <label htmlFor="title" className="block text-sm font-medium text-slate-700">
                                            Session Title
                                        </label>
                                        <input
                                            type="text"
                                            name="title"
                                            id="title"
                                            required
                                            placeholder="e.g., Analyzing the impact of AI on education"
                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border"
                                        />
                                    </div>
                                    <div>
                                        <label htmlFor="problem_statement" className="block text-sm font-medium text-slate-700">
                                            Problem Statement
                                        </label>
                                        <textarea
                                            name="problem_statement"
                                            id="problem_statement"
                                            rows={3}
                                            required
                                            placeholder="Describe the main problem we are trying to solve..."
                                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm px-4 py-2 border resize-none"
                                        />
                                    </div>
                                    <div className="pt-2">
                                        <button
                                            formAction={async (formData) => {
                                                'use server';
                                                const { createSession } = await import('@/app/actions/sessions');
                                                await createSession(formData);
                                            }}
                                            className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
                                        >
                                            Create Session
                                        </button>
                                    </div>
                                </form>
                            </div>

                            {/* List Valid Sessions */}
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                                <h3 className="text-lg font-bold text-slate-900 mb-4">Active Sessions</h3>
                                {sessions && sessions.length > 0 ? (
                                    <div className="grid gap-4 sm:grid-cols-2">
                                        {sessions.map((session) => (
                                            <Link
                                                key={session.id}
                                                href={`/session/${session.id}`}
                                                className="block group p-4 border border-slate-200 rounded-xl hover:border-indigo-500 hover:shadow-md transition-all bg-slate-50 hover:bg-white"
                                            >
                                                <h4 className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors mb-1 truncate">
                                                    {session.title}
                                                </h4>
                                                <p className="text-sm text-slate-500 line-clamp-2 mb-3">
                                                    {session.problem_statement}
                                                </p>
                                                <div className="flex items-center text-xs text-slate-400">
                                                    <span>Created {new Date(session.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </Link>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                                        <p className="text-slate-500">No active collaborative sessions yet.</p>
                                    </div>
                                )}
                            </div>

                        </div>
                    </div>

                </div>
            </main>
        </div>
    )
}
