
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

try {
    // Manually parse .env.local
    const envPath = path.resolve(__dirname, '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envConfig = {};

    envContent.split('\n').forEach(line => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            envConfig[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
        }
    });

    const supabase = createClient(envConfig.NEXT_PUBLIC_SUPABASE_URL, envConfig.SUPABASE_SERVICE_ROLE_KEY);

    async function findLetter() {
        // Find letters with "hello" content
        const { data, error } = await supabase
            .from('letters')
            .select('*')
            .ilike('content', '%hello%')
            .order('created_at', { ascending: false });

        if (error) {
            console.error("Error:", error);
            return;
        }

        if (data.length === 0) {
            console.log("No letters found with content 'hello'.");
        } else {
            console.log(`Found ${data.length} letters:`);
            data.forEach(l => {
                console.log(`ID: ${l.id} | Content: "${l.content}" | Created: ${l.created_at}`);
            });
        }
    }

    findLetter();

} catch (e) {
    console.error("Script error:", e);
}
