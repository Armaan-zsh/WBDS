import { createClient } from '@supabase/supabase-js';

let adminInstance = null;

export const getSupabaseAdmin = () => {
    if (adminInstance) return adminInstance;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

    if (!url || !key) {
        console.error("Supabase Admin: Environment variables missing during lazy init.");
        return null;
    }

    adminInstance = createClient(url, key, {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
    return adminInstance;
};

// Keep for backward compatibility
export const supabaseAdmin = getSupabaseAdmin();
