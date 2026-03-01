const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function check() {
    console.log("Checking session votes...")
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .in('content', ['#VOTE_REVEAL#', '#SYNTHESIS_IN_PROGRESS#'])

    console.log("Current special messages:", data)
}

check()
