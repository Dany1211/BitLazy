'use server';

import { createServerClientInstance } from '@/utils/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSession(formData: FormData) {
    const supabase = await createServerClientInstance();
    const title = formData.get('title') as string;
    const problem_statement = formData.get('problem_statement') as string;
    const visibility = (formData.get('visibility') as string) || 'public';
    const category = (formData.get('category') as string) || 'General';

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: session, error } = await supabase
        .from('sessions')
        .insert([{ title, problem_statement, visibility, category, created_by: user.id }])
        .select('id')
        .single();

    if (error || !session) {
        console.error('Failed to create session:', error);
        throw new Error('Failed to create session');
    }

    // Auto-join the creator to the session by inserting a system message
    const { error: msgError } = await supabase.from('messages').insert({
        id: crypto.randomUUID(),
        session_id: session.id,
        user_id: user.id,
        content: 'Created the session',
        type: 'system',
        is_ai: false
    });

    if (msgError) {
        console.error("Failed to insert initial system message:", msgError);
    }

    revalidatePath('/profile');
    redirect(`/session/${session.id}`);
}

export async function joinSession(formData: FormData) {
    const invite_code = formData.get('invite_code') as string;
    if (!invite_code) throw new Error("Invite code required");

    const supabase = await createServerClientInstance();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: session, error } = await supabase
        .from('sessions')
        .select('id')
        .eq('invite_code', invite_code.trim())
        .single();

    if (error || !session) {
        console.error('Failed to join session:', error);
        throw new Error('Invalid invite code');
    }

    revalidatePath('/profile');
    redirect(`/session/${session.id}?invite=${invite_code.trim()}`);
}
