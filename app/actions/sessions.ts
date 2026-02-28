'use server';

import { createServerClientInstance } from '@/utils/supabase';
import { revalidatePath } from 'next/cache';

export async function createSession(formData: FormData) {
    const supabase = await createServerClientInstance();
    const title = formData.get('title') as string;
    const problem_statement = formData.get('problem_statement') as string;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Unauthorized");

    const { error } = await supabase
        .from('sessions')
        .insert([{ title, problem_statement, user_id: user.id }]);

    if (!error) revalidatePath('/profile');
}
