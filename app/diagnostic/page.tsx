import { createServerClientInstance } from '@/utils/supabase'

export default async function DiagnosticPage() {
    const supabase = await createServerClientInstance()
    const { data: profiles } = await supabase.from('profiles').select('*')
    const { data: messages } = await supabase.from('messages').select('*, profiles(*)').limit(50)

    return (
        <pre className="p-10">
            {JSON.stringify({ profiles, messages }, null, 2)}
        </pre>
    )
}
