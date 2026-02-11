import { createClient } from '@supabase/supabase-js';

let supabaseInstance = null;

export const getSupabase = () => {
    if (supabaseInstance) return supabaseInstance;

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

    if (!url || !key) {
        console.warn("Supabase: Environment variables missing during lazy init.");
        return null;
    }

    supabaseInstance = createClient(url, key);
    return supabaseInstance;
};

// Log a warning if variables are missing at the top level (for debugging)
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    console.warn("Supabase: URL missing at top-level scope.");
}

// Keep the old export for backward compatibility but use the getter internally where possible
export const supabase = getSupabase();
