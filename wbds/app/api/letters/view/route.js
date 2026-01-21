import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function POST(req) {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    try {
        const body = await req.json();
        const { letter_id } = body;

        if (!letter_id) {
            return NextResponse.json({ error: 'Letter ID required' }, { status: 400 });
        }

        // Increment the view count using RPC to be atomic (safer)
        // OR standard update if we don't have an RPC function set up.
        // For simplicity without custom SQL functions, we fetch and update, 
        // OR we use the increment trick if Supabase supports it easily via JS client (requires RPC usually for pure atomic).

        // Actually, Supabase JS client doesn't have a direct .increment() without RPC.
        // But we can do: update letters set views = views + 1 where id = ...

        // However, standard UPDATE in Supabase-js:
        // .update({ views: count + 1 })
        // This is not atomic.

        // BETTER APPROACH: RPC
        // But I cannot ask user to create RPCs easily.

        // So I will use the "Fetch, then Update" method. 
        // It has a race condition but for "View Counts" it is acceptable (approximate consistency).

        const { data: letter, error: fetchError } = await supabaseAdmin
            .from('letters')
            .select('views')
            .eq('id', letter_id)
            .single();

        if (fetchError || !letter) {
            return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
        }

        const newCount = (letter.views || 0) + 1;

        const { error: updateError } = await supabaseAdmin
            .from('letters')
            .update({ views: newCount })
            .eq('id', letter_id);

        if (updateError) {
            throw updateError;
        }

        return NextResponse.json({ success: true, views: newCount });

    } catch (error) {
        console.error('Witness API Error:', error);
        return NextResponse.json({ error: 'Failed to witness' }, { status: 500 });
    }
}
