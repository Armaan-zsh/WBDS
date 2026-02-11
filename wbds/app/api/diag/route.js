import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    const envs = {
        URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
        ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
        SERVICE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING',
        ADMIN_SECRET: process.env.NEXT_PUBLIC_ADMIN_SECRET ? 'PRESENT' : 'MISSING',
        NODE: process.env.NODE_VERSION || 'NOT_SET',
        RUNTIME: 'edge'
    };

    return NextResponse.json(envs);
}
