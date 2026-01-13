import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { letterId } = body;

        if (!letterId) return NextResponse.json({ error: 'Letter ID missing' }, { status: 400 });

        // 1. Get IP
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        // 2. Call Atomic RPC Function
        const { data, error } = await supabaseAdmin
            .rpc('toggle_like', {
                target_letter_id: letterId,
                user_ip: ip
            });

        if (error) {
            console.error('RPC Error:', error);
            throw error;
        }

        // RPC returns { "liked": boolean, "likes": int }
        return NextResponse.json({
            success: true,
            likes: data.likes,
            liked: data.liked
        });

    } catch (error) {
        console.error('Like Error:', error);
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}
