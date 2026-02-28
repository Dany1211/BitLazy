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
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                        {/* Header Area */}
                        <div className="bg-indigo-600 h-32 relative"></div>

                        <div className="px-6 sm:px-10 pb-10">
                            {/* Profile Avatar & Info Header */}
                            <div className="relative -mt-16 sm:-mt-20 flex flex-col sm:flex-row sm:items-end sm:justify-between mb-8">
                                <div className="flex items-end gap-5">
                                    <div className="h-32 w-32 rounded-full border-4 border-white bg-white overflow-hidden shadow-sm flex items-center justify-center bg-indigo-100">
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
                                    <div className="mb-2">
                                        <h1 className="text-2xl font-bold text-slate-900 truncate">
                                            {profile?.name || 'Anonymous User'}
                                        </h1>
                                        <p className="text-sm font-medium text-slate-500">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                                {/* Badge based on role */}
                                <div className="mt-4 sm:mt-0 sm:mb-2">
                                    <span className="inline-flex items-center rounded-md bg-green-50 px-3 py-1 text-sm font-medium text-green-700 ring-1 ring-inset ring-green-600/20 capitalize shadow-sm">
                                        {profile?.role || 'User'}
                                    </span>
                                </div>
                            </div>

                            <div className="mt-8 border-t border-slate-100 pt-8">
                                <h3 className="text-lg font-semibold text-slate-900 mb-6">Profile Details</h3>

                                {profile ? (
                                    <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                                        <div className="sm:col-span-1 rounded-lg bg-slate-50 p-4 border border-slate-100">
                                            <dt className="text-sm font-medium text-slate-500">Full Name</dt>
                                            <dd className="mt-1 text-sm text-slate-900 font-medium">{profile.name}</dd>
                                        </div>

                                        <div className="sm:col-span-1 rounded-lg bg-slate-50 p-4 border border-slate-100">
                                            <dt className="text-sm font-medium text-slate-500">Account ID</dt>
                                            <dd className="mt-1 text-sm text-slate-900 truncate font-mono">{user.id}</dd>
                                        </div>

                                        <div className="sm:col-span-1 rounded-lg bg-slate-50 p-4 border border-slate-100">
                                            <dt className="text-sm font-medium text-slate-500">Role</dt>
                                            <dd className="mt-1 text-sm text-slate-900 font-medium capitalize">{profile.role}</dd>
                                        </div>

                                        <div className="sm:col-span-1 rounded-lg bg-slate-50 p-4 border border-slate-100">
                                            <dt className="text-sm font-medium text-slate-500">Member Since</dt>
                                            <dd className="mt-1 text-sm text-slate-900 font-medium">
                                                {new Date(profile.created_at || user.created_at).toLocaleDateString(undefined, {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric'
                                                })}
                                            </dd>
                                        </div>
                                    </dl>
                                ) : (
                                    <div className="rounded-lg bg-amber-50 p-4 border border-amber-200">
                                        <div className="flex">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <div className="ml-3">
                                                <h3 className="text-sm font-medium text-amber-800">Profile data missing</h3>
                                                <div className="mt-2 text-sm text-amber-700">
                                                    <p>
                                                        We couldn&apos;t find your extended profile information. The database trigger might not have executed properly during sign up.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
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
