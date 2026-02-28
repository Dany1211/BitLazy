const { Client } = require("pg");

async function main() {
    // Try both connection string formats
    const connectionStrings = [
        "postgresql://postgres.cqlmrixzlckvqwwxmqtt:AumMule%402005@aws-0-ap-south-1.pooler.supabase.com:6543/postgres",
        "postgresql://postgres.cqlmrixzlckvqwwxmqtt:AumMule%402005@aws-0-ap-south-1.pooler.supabase.com:5432/postgres",
    ];

    for (const connStr of connectionStrings) {
        console.log("Trying:", connStr.split("@")[1]);
        const client = new Client({
            connectionString: connStr,
            ssl: { rejectUnauthorized: false },
            connectionTimeoutMillis: 10000,
        });

        try {
            await client.connect();
            console.log("✅ Connected!");

            await client.query(`
        CREATE TABLE IF NOT EXISTS messages (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          username TEXT NOT NULL,
          content TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT now()
        );
      `);
            console.log("✅ messages table created");

            await client.query(`ALTER TABLE messages ENABLE ROW LEVEL SECURITY;`);
            console.log("✅ RLS enabled");

            try {
                await client.query(`
          CREATE POLICY "Anyone can read messages"
          ON messages FOR SELECT USING (true);
        `);
                console.log("✅ SELECT policy created");
            } catch (e) {
                console.log("SELECT policy already exists");
            }

            try {
                await client.query(`
          CREATE POLICY "Anyone can insert messages"
          ON messages FOR INSERT WITH CHECK (true);
        `);
                console.log("✅ INSERT policy created");
            } catch (e) {
                console.log("INSERT policy already exists");
            }

            try {
                await client.query(
                    `ALTER PUBLICATION supabase_realtime ADD TABLE messages;`
                );
                console.log("✅ Realtime enabled");
            } catch (e) {
                console.log("Realtime already enabled");
            }

            await client.end();
            console.log("\n🎉 Database setup complete!");
            return;
        } catch (e) {
            console.log("❌ Failed:", e.message);
            try {
                await client.end();
            } catch { }
        }
    }

    console.log("\n⚠️ Could not connect to database.");
    console.log(
        "Please run the SQL from supabase/setup.sql in your Supabase SQL Editor:"
    );
    console.log(
        "https://supabase.com/dashboard/project/cqlmrixzlckvqwwxmqtt/sql/new"
    );
}

main().catch(console.error);
