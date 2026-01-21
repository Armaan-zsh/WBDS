import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { headers } from 'next/headers';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { letter_id } = body;

        if (!letter_id) {
            return NextResponse.json({ error: 'Letter ID missing' }, { status: 400 });
        }

        // 1. Get IP
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        // 2. Hash IP with Salt
        const salt = process.env.ENGAGEMENT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'wbds_void_salt';
        const hashedIp = crypto
            .createHmac('sha256', salt)
            .update(ip)
            .digest('hex');

        // 3. Try to Insert Like
        const { error: insertError } = await supabaseAdmin
            .from('engagement_log')
            .insert([{
                letter_id: letter_id,
                hashed_ip: hashedIp,
                type: 'like'
            }]);

        if (!insertError) {
            // Success: Liked
            return NextResponse.json({ success: true, liked: true });
        }

        // 4. If already liked, then Un-like (Toggle)
        if (insertError.code === '23505') {
            const { error: deleteError } = await supabaseAdmin
                .from('engagement_log')
                .delete()
                .match({
                    letter_id: letter_id,
                    hashed_ip: hashedIp,
                    type: 'like'
                });

            if (deleteError) throw deleteError;
            return NextResponse.json({ success: true, liked: false });
        }

        throw insertError;

    } catch (error) {
        console.error('Like Error:', error);
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}
