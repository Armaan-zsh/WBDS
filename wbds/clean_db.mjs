
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

async function clean() {
    console.log('Fetching all IDs...');
    // 1. Fetch ALL IDs
    const { data: letters, error: fetchError } = await supabaseAdmin
        .from('letters')
        .select('id');

    if (fetchError) {
        console.error('Fetch Error:', fetchError);
        return;
    }

    if (!letters || letters.length === 0) {
        console.log('Database is already empty.');
        return;
    }

    console.log(`Found ${letters.length} letters. Deleting...`);

    const ids = letters.map(l => l.id);

    // 2. Delete by ID list
    const { error: deleteError } = await supabaseAdmin
        .from('letters')
        .delete()
        .in('id', ids);

    if (deleteError) {
        console.error('Delete Error:', deleteError);
    } else {
        console.log('Successfully deleted all letters.');
    }
}

clean();
