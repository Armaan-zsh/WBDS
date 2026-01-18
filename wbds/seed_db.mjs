
import fs from 'fs';
import path from 'path';

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

const { supabaseAdmin } = await import('./lib/supabase-admin.js');

async function seed() {
    console.log('Seeding 3 test letters...');
    const letters = [
        { content: 'First Node', theme: 'void' },
        { content: 'Second Node', theme: 'paper' },
        { content: 'Third Node', theme: 'hack' }
    ];

    for (const l of letters) {
        await supabaseAdmin.from('letters').insert({
            content: l.content,
            theme: l.theme,
            ip_address: '127.0.0.1'
        });
    }
    console.log('Seeded.');
}

seed();
