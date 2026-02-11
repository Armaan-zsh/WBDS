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

    try {
        supabaseInstance = createClient(url, key);
        return supabaseInstance;
    } catch (e) {
        console.error("Supabase: Failed to create client", e);
        return null;
    }
};
