import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import SessionView from '@/components/SessionView'

export default async function SessionPage({
    params,
    searchParams
}: {
    params: Promise<{ id: string }>,
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
    const { id } = await params
    const resolvedSearchParams = await searchParams
    const inviteCode = resolvedSearchParams?.invite as string | undefined

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
                    <Link href="/home" className="inline-block bg-[#0F172A] hover:bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        )
    }

    // Fetch only the profiles of actual participants (people who sent messages) + current user
    const { data: messages } = await supabase
        .from('messages')
        .select('user_id')
        .eq('session_id', id)

    // Get unique user IDs, defaulting to include the current user (if they already participated)
    const participantIds = messages
        ? Array.from(new Set(messages.map(m => m.user_id).filter(Boolean)))
        : []

    // Auth Check for Private Sessions
    if (session.visibility === 'private') {
        const isParticipant = participantIds.includes(user.id)
        const isInvited = inviteCode === session.invite_code
        // Allow the session creator if possible
        const isCreator = session.created_by === user.id

        // Explicit addition: if the user CREATED the session, they might not be in the participant list yet
        // For now, if they're not a participant, don't have the link, and aren't the creator, block them.
        if (!isParticipant && !isInvited && !isCreator) {
            return (
                <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4">
                    <div className="bg-white p-12 rounded-[2.5rem] shadow-xl shadow-slate-200/50 text-center max-w-md w-full border border-slate-100">
                        <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                            </svg>
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Private Session</h2>
                        <p className="text-slate-500 font-medium mb-8">You need an invite link to access this collaborative space.</p>
                        <Link href="/home" className="inline-block bg-[#0F172A] hover:bg-slate-800 text-white px-8 py-3 rounded-xl font-bold transition-all shadow-lg active:scale-95">
                            Return to Dashboard
                        </Link>
                    </div>
                </div>
            )
        }
    }

    // Since they passed authorization, guarantee the current user is added to participant list 
    // so their avatar shows up in the Room Header
    if (!participantIds.includes(user.id)) participantIds.push(user.id)

    const { data: allProfiles } = await supabase
        .from('profiles')
        .select('*')
        .in('id', participantIds)

    const currentUserProfile = allProfiles?.find(p => p.id === user.id)
    const userInitials = currentUserProfile?.name?.charAt(0) || user.email?.charAt(0) || '?'

    return (
        <SessionView
            session={session}
            allProfiles={allProfiles}
            user={{ id: user.id }}
            currentUserProfile={currentUserProfile}
            userInitials={userInitials}
            sessionId={id}
        />
    )
}
