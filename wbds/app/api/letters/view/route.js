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
            return NextResponse.json({ error: 'Letter ID is required' }, { status: 400 });
        }

        // 1. Get Client IP
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        // 2. Hash IP with Salt for Anonymity + Uniqueness
        const salt = process.env.ENGAGEMENT_SALT || process.env.SUPABASE_SERVICE_ROLE_KEY || 'wbds_void_salt';
        const hashedIp = crypto
            .createHmac('sha256', salt)
            .update(ip)
            .digest('hex');

        // 3. Log Engagement (Type: view)
        // PostgreSQL Trigger (which user will add) handles the increment on 'letters' table
        const { error } = await supabaseAdmin
            .from('engagement_log')
            .insert([{
                letter_id: letter_id,
                hashed_ip: hashedIp,
                type: 'view'
            }]);

        if (error) {
            // If it's a unique constraint violation (23505), it means they already witnessed it
            if (error.code === '23505') {
                return NextResponse.json({ success: true, message: 'Already witnessed' });
            }
            throw error;
        }

        return NextResponse.json({ success: true, message: 'Witnessed' });

    } catch (error) {
        console.error('Witness API Error:', error);
        return NextResponse.json({ error: 'Failed to witness', details: error.message }, { status: 500 });
    }
}
