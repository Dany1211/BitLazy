import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
const supabase = createClient(supabaseUrl, supabaseKey)

async function check() {
    const { data, error } = await supabase.from('messages').insert({
        id: crypto.randomUUID(),
        session_id: '00000000-0000-0000-0000-000000000000', // invalid UUID but works for type checking
        user_id: '00000000-0000-0000-0000-000000000000',
        content: 'test',
        type: 'vote_answer'
    })
    console.log("INSERT RESPONSE:", { data, error })
}
check()
