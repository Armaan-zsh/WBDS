import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';
import { z } from 'zod';

// TODO: Replace with proper Supabase Auth check
const ADMIN_SECRET = process.env.ADMIN_SECRET;

const ActionSchema = z.object({
    action: z.enum(['delete_letter', 'ban_ip', 'unban_ip', 'dismiss', 'resolve']),
    letter_id: z.string().uuid().optional(),
    report_id: z.string().uuid().optional(),
    target_ip: z.string().optional(),
    ban_duration_hours: z.number().optional(),
    notes: z.string().max(500).optional()
});

export async function POST(req) {
    try {
        // Auth check
        const authHeader = req.headers.get('authorization');
        if (authHeader !== `Bearer ${ADMIN_SECRET}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const json = await req.json();
        const result = ActionSchema.safeParse(json);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const { action, letter_id, report_id, target_ip, ban_duration_hours, notes } = result.data;

        // Execute action
        switch (action) {
            case 'delete_letter':
                await supabaseAdmin
                    .from('letters')
                    .update({ is_deleted: true })
                    .eq('id', letter_id);
                break;

            case 'ban_ip':
                const bannedUntil = ban_duration_hours
                    ? new Date(Date.now() + ban_duration_hours * 60 * 60 * 1000)
                    : null; // Permanent

                await supabaseAdmin
                    .from('ip_reputation')
                    .upsert({
                        ip: target_ip,
                        is_banned: true,
                        banned_until: bannedUntil,
                        trust_score: 0
                    });
                break;

            case 'unban_ip':
                await supabaseAdmin
                    .from('ip_reputation')
                    .update({ is_banned: false, banned_until: null })
                    .eq('ip', target_ip);
                break;

            case 'dismiss':
            case 'resolve':
                await supabaseAdmin
                    .from('letter_reports')
                    .update({
                        status: action === 'dismiss' ? 'dismissed' : 'resolved',
                        reviewed_at: new Date().toISOString(),
                        action_taken: action
                    })
                    .eq('id', report_id);
                break;
        }

        // Log action
        await supabaseAdmin
            .from('admin_actions')
            .insert({
                admin_id: 'system', // Replace with actual admin ID from auth
                action_type: action,
                target_letter_id: letter_id,
                target_report_id: report_id,
                target_ip,
                notes
            });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error('Admin Action Error:', error.message);
        return NextResponse.json({ error: 'Action failed' }, { status: 500 });
    }
}
