const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const env = fs.readFileSync('.env.local', 'utf-8');
const urlMatch = env.match(/NEXT_PUBLIC_SUPABASE_URL="(.*?)"/);
const keyMatch = env.match(/NEXT_PUBLIC_SUPABASE_ANON_KEY="(.*?)"/);

const supabase = createClient(urlMatch[1], keyMatch[1]);

async function main() {
    console.log("Fetching latest message from Supabase...");
    const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false }).limit(1);
    if (error) {
        console.error("Supabase Error:", error);
        return;
    }
    console.log("Latest Message Data:", data);

    if (data && data.length > 0) {
        const id = data[0].id;
        console.log(`\nTriggering AI Evaluation for Message ID: \${id}`);
        try {
            const res = await fetch('http://localhost:3000/api/evaluate-message', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messageId: id })
            });
            const text = await res.text();
            console.log("API Response Status:", res.status);
            console.log("API Response Body:", text);
        } catch (e) {
            console.error("Fetch Error:", e);
        }
    }
}

main();
