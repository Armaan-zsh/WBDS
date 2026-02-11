import { NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req) {
    try {
        const { password } = await req.json();
        const ADMIN_SECRET = process.env.ADMIN_SECRET;

        if (!ADMIN_SECRET) {
            console.error('ADMIN_SECRET not set in environment');
            return NextResponse.json({ error: 'Auth system misconfigured' }, { status: 500 });
        }

        if (password === ADMIN_SECRET) {
            // In a real production app, we would return a JWT here.
            // For now, we return a success flag and rely on the server-side 
            // password check for actual moderating actions (Double-Lock).
            return NextResponse.json({ success: true });
        }

        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    } catch (e) {
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }
}
