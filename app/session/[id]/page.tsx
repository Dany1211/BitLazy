import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SessionChat from '@/components/SessionChat'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createServerClientInstance()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const { data: session } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single()

    if (!session) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-2xl shadow-sm text-center max-w-md w-full">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Session Not Found</h2>
                    <p className="text-slate-600 mb-6">This collaborative session does not exist or was deleted.</p>
                    <Link href="/profile" className="text-indigo-600 hover:text-indigo-800 font-medium">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-white flex flex-col font-sans">
            {/* Dynamic Session Navbar */}
            <nav className="bg-white border-b border-slate-200 shadow-sm shrink-0">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center gap-4">
                            <Link href="/profile" className="text-sm font-medium text-slate-500 hover:text-slate-900 transition-colors">
                                ← Dashboard
                            </Link>
                            <div className="h-6 w-px bg-slate-300"></div>
                            <h1 className="text-lg font-bold text-slate-900 truncate max-w-md">
                                {session.title}
                            </h1>
                        </div>
                    </div>
                </div>
            </nav>

            <main className="flex-1 flex flex-col max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
                {/* Session Problem Statement */}
                <div className="bg-indigo-50 border border-indigo-100 p-6 rounded-2xl shrink-0">
                    <h2 className="text-sm font-bold uppercase tracking-widest text-indigo-500 mb-2">Problem Statement</h2>
                    <p className="text-slate-800 text-lg leading-relaxed whitespace-pre-wrap font-medium">
                        {session.problem_statement}
                    </p>
                </div>

                {/* Realtime Chat Application injected here */}
                <SessionChat sessionId={id} userId={user.id} />
            </main>
        </div>
    )
}
