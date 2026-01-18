
import fs from 'fs';
import path from 'path';

// 1. Load Env Vars
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim().replace(/"/g, '');
        }
    });
}

// 2. Import
const { supabaseAdmin } = await import('./lib/supabase-admin.js');

// 3. Inspect
async function inspect() {
    const { data, error } = await supabaseAdmin.from('letters').select('id').limit(1);
    if (error) console.error(error);
    else console.log('Sample Data:', data);
}

inspect();
