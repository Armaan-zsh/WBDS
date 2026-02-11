import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

import { headers } from 'next/headers';
import { z } from 'zod';

const ReportSchema = z.object({
    letter_id: z.string().uuid(),
    reason: z.enum(['spam', 'harassment', 'self_harm', 'illegal', 'other']),
    description: z.string().max(500).optional()
});

export async function POST(req) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }
    try {
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        const json = await req.json();
        const result = ReportSchema.safeParse(json);

        if (!result.success) {
            return NextResponse.json({ error: 'Invalid report' }, { status: 400 });
        }

        const { letter_id, reason, description } = result.data;

        // Rate limit: 3 reports per IP per day
        const { count } = await supabaseAdmin
            .from('letter_reports')
            .select('*', { count: 'exact', head: true })
            .eq('reporter_ip', ip)
            .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

        if (count >= 3) {
            return NextResponse.json({ error: 'Report limit reached' }, { status: 429 });
        }

        // Get letter's toxicity score for auto-prioritization
        const { data: letter } = await supabaseAdmin
            .from('letters')
            .select('ai_toxicity_score')
            .eq('id', letter_id)
            .single();

        // Insert report
        const { data, error } = await supabaseAdmin
            .from('letter_reports')
            .insert({
                letter_id,
                reporter_ip: ip,
                reason,
                description,
                toxicity_score: letter?.ai_toxicity_score
            })
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ success: true, report_id: data.id });

    } catch (error) {
        console.error('Report Error:', error.message);
        return NextResponse.json({ error: 'Failed to submit report' }, { status: 500 });
    }
}
