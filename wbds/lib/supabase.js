import { createClient } from '@supabase/supabase-js';

// These are baked in at build time
const buildUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const buildKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Build-safe initialization: only create client if URL and Key exist
// We export a getter to allow for potential runtime injection if needed
export const supabase = (buildUrl && buildKey)
    ? createClient(buildUrl, buildKey)
    : null;

if (!supabase) {
    console.warn("Supabase: Client initialized as null. Check build-time environment variables.");
}
