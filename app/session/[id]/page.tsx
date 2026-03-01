import { createServerClientInstance } from '@/utils/supabase'
import { redirect } from 'next/navigation'
import SessionChat from '@/components/SessionChat'
import SessionSynthesis from '@/components/SessionSynthesis'

export default async function SessionPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createServerClientInstance()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    return (
        <>
            {/* Center Pane: Chat Application */}
            <main className="flex-1 flex flex-col relative bg-white z-10 shadow-xl">
                <SessionChat sessionId={id} userId={user.id} />
            </main>
        </>
    )
}
