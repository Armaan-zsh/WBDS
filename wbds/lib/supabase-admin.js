import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    // This often happens during pre-rendering/build
    console.warn(`Supabase Admin: Missing ${!supabaseUrl ? 'URL' : ''} ${!supabaseServiceKey ? 'Service Key' : ''}. Connection skipped.`);
}

// Build-safe initialization: only create client if URL and Key exist
export const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    })
    : null;
