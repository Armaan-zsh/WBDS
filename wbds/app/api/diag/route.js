import { getSupabase } from '../../../lib/supabase';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';

export const runtime = 'edge';

export async function GET() {
    // Ultra-resilient check for environment variables and the suspected typo
    const data = {
        status: "alive",
        envs: {
            URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? "FOUND" : "NOT_FOUND",
            ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "FOUND" : "NOT_FOUND",
            SERVICE_ROLE: process.env.SUPABASE_SERVICE_ROLE_KEY ? "FOUND" : "NOT_FOUND",
            TYPO_CHECK: process.env.SUPABASE_SERVICF_ROLE_KEY ? "FOUND_TYPO_SERVICF" : "OK",
            NODE: process.env.NODE_VERSION || "NOT_SET"
        },
        initialization: {
            client: !!getSupabase(),
            admin: !!getSupabaseAdmin()
        },
        time: new Date().toISOString()
    };

    return new Response(JSON.stringify(data), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
    });
}
