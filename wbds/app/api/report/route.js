import { getSupabaseAdmin } from '../../../lib/supabase-admin';
import { NextResponse } from 'next/server';


export async function POST(req) {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server misconfigured' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { type, description, steps, email, name, userAgent, screenSize, currentUrl } = body;

        // Basic validation
        if (!description || !type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Insert into Supabase
        const { data, error } = await supabase
            .from('feedback')
            .insert([
                {
                    type,
                    description,
                    steps_to_reproduce: steps,
                    email,
                    name,
                    user_agent: userAgent,
                    screen_size: screenSize,
                    current_url: currentUrl,
                    status: 'open'
                }
            ])
            .select();

        if (error) {
            console.error('Supabase Feedback Error:', error);
            return NextResponse.json({ error: 'Failed to save report' }, { status: 500 });
        }

        return NextResponse.json({ success: true, data }, { status: 200 });

    } catch (err) {
        console.error('Feedback API Error:', err);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
