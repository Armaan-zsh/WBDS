import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';


export async function POST(req) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    try {
        const { action, letterId, ip, fingerprint, adminSecret } = await req.json();
        const PRIVATE_SECRET = process.env.ADMIN_SECRET;

        // DOUBLE-LOCK: Verify secret on server
        if (!PRIVATE_SECRET || adminSecret !== PRIVATE_SECRET) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (action === 'burn' && letterId) {
            const { error } = await supabaseAdmin
                .from('letters')
                .delete()
                .eq('id', letterId);

            if (error) throw error;
            return NextResponse.json({ success: true, message: 'Letter burned.' });
        }

        if (action === 'shadow_ban' && (ip || fingerprint)) {
            // 1. Mark as shadow-banned in reputation table
            const { error: repError } = await supabaseAdmin
                .from('ip_reputation')
                .upsert({
                    ip: ip || 'unknown',
                    browser_fingerprint: fingerprint || 'unknown',
                    is_banned: true,
                    last_action: new Date().toISOString()
                }, { onConflict: 'ip' });

            if (repError) throw repError;

            // 2. Mark existing letter as shadow-banned
            if (letterId) {
                await supabaseAdmin
                    .from('letters')
                    .update({ is_shadow_banned: true })
                    .eq('id', letterId);
            }

            return NextResponse.json({ success: true, message: 'User shadow-banned.' });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (e) {
        console.error('Admin Action Error:', e);
        return NextResponse.json({ error: 'Process failed' }, { status: 500 });
    }
}
