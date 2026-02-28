import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SessionView from '@/components/SessionView'

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
        <SessionView
            session={session}
            allProfiles={allProfiles}
            user={user}
            currentUserProfile={currentUserProfile}
            userInitials={userInitials}
            sessionId={id}
        />
    )
}

