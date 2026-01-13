import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    try {
        const { data, error } = await supabaseAdmin
            .from('letters')
            .select('*')
            .order('likes', { ascending: false })
            .limit(50);

        if (error) throw error;

        return NextResponse.json(data);
    } catch (error) {
        console.error('Best Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to fetch top letters' }, { status: 500 });
    }
}
