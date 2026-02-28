'use server';

import { createServerClientInstance } from '@/utils/supabase';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createSession(formData: FormData) {
    const supabase = await createServerClientInstance();
    const title = formData.get('title') as string;
    const problem_statement = formData.get('problem_statement') as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { data: session, error } = await supabase
        .from('sessions')
        .insert([{ title, problem_statement }])
        .select('id')
        .single();

    if (error || !session) {
        console.error('Failed to create session:', error);
        throw new Error('Failed to create session');
    }

    revalidatePath('/profile');
    redirect(`/session/${session.id}`);
}
