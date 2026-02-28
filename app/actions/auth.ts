'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createServerClientInstance } from '@/utils/supabase'

export async function login(formData: FormData) {
    const supabase = await createServerClientInstance()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?message=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}

export async function signup(formData: FormData) {
    const supabase = await createServerClientInstance()

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    const name = formData.get('name') as string

    const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            emailRedirectTo: `${origin}/auth/callback`,
            data: {
                name,
            },
        },
    })

    if (error) {
        redirect('/login?message=Could not authenticate user')
    }

    revalidatePath('/', 'layout')
    redirect('/login?message=Check email to continue sign in process')
}

export async function logout() {
    const supabase = await createServerClientInstance()

    const { error } = await supabase.auth.signOut()

    if (error) {
        redirect('/login?message=Could not log out user')
    }

    revalidatePath('/', 'layout')
    redirect('/login')
}
