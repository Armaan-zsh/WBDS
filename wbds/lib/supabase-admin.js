import { createClient } from '@supabase/supabase-js';

// Try both public and private names (Cloudflare sometimes treats them differently during build)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.warn(`Supabase Admin Error: ${!supabaseUrl ? '[URL MISSING]' : ''} ${!supabaseServiceKey ? '[SERVICE KEY MISSING]' : ''}`);
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
