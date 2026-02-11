import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../../lib/supabase-admin';

export const dynamic = 'force-dynamic';

export async function GET() {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    try {
        // Fetch 1 random unlocked letter from the database
        // PostgreSQL ORDER BY random() is efficient for small-medium tables
        const { data, error } = await supabaseAdmin
            .from('letters')
            .select('*')
            .is('unlock_at', null) // Only public unlocked letters
            .limit(1)
            .order('id', { ascending: false }) // Fallback in case random fails for some reason
        // Supabase doesn't natively support .order('random()') via JS client easily 
        // without a custom RPC or using the .rpc() method.

        // Let's use an RPC for true randomness if possible, 
        // but for now, we'll try to fetch a randomized selection.

        // BETTER: Use RPC to get a random letter
        const { data: randomLetter, error: rpcError } = await supabaseAdmin
            .rpc('get_random_letter');

        if (rpcError) {
            console.error('RPC Error (Random):', rpcError);
            // Fallback: Just get the latest if RPC isn't set up yet
            const { data: fallback, error: fallbackError } = await supabaseAdmin
                .from('letters')
                .select('*')
                .limit(1)
                .order('created_at', { ascending: false });

            if (fallbackError) throw fallbackError;
            return NextResponse.json({ letter: fallback[0] });
        }

        return NextResponse.json({ letter: randomLetter[0] });

    } catch (error) {
        console.error('Bottle Error:', error);
        return NextResponse.json({ error: 'The bottle was lost at sea.' }, { status: 500 });
    }
}
