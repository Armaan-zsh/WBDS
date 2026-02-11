import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function GET() {
    try {
        const envs = {
            URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'PRESENT' : 'MISSING',
            ANON: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'PRESENT' : 'MISSING',
            SERVICE: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'PRESENT' : 'MISSING',
            ADMIN_SECRET: process.env.NEXT_PUBLIC_ADMIN_SECRET ? 'PRESENT' : 'MISSING',
            NODE: process.env.NODE_VERSION || 'NOT_SET',
            RUNTIME: 'edge',
            TIMESTAMP: new Date().toISOString()
        };

        return NextResponse.json(envs);
    } catch (err) {
        return NextResponse.json({
            error: true,
            message: err.message,
            stack: err.stack,
            context: "Diagnostic route failed"
        }, { status: 200 }); // Return 200 so we can see the error JSON
    }
}
