'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClientInstance } from '@/utils/supabase'

export async function createSession(formData: FormData) {
    const supabase = await createServerClientInstance()

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    const title = formData.get('title') as string
    const problemStatement = formData.get('problem_statement') as string

    if (!title || !problemStatement) {
        return { error: 'Title and problem statement are required' }
    }

    const { data: session, error } = await supabase
        .from('sessions')
        .insert({
            title,
            problem_statement: problemStatement,
        })
        .select('id')
        .single()

    if (error || !session) {
        console.error('Failed to create session:', error)
        return { error: 'Failed to create session' }
    }

    revalidatePath('/profile')
    redirect(`/session/${session.id}`)
}
