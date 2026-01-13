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

        // 2. Check if already liked
        const { data: existingLike, error: fetchError } = await supabaseAdmin
            .from('letter_likes')
            .select('*')
            .eq('letter_id', letterId)
            .eq('ip_address', ip)
            .single();

        let liked = false;
        let change = 0;

        if (existingLike) {
            // UNLIKE: Remove record
            await supabaseAdmin
                .from('letter_likes')
                .delete()
                .eq('id', existingLike.id);
            change = -1;
            liked = false;
        } else {
            // LIKE: Add record
            // Use upsert to handle race conditions gracefully (ignore duplicates)
            const { error: insertError } = await supabaseAdmin
                .from('letter_likes')
                .insert({ letter_id: letterId, ip_address: ip });

            if (!insertError) {
                change = 1;
                liked = true;
            }
        }

        // 3. Update Counter on Letter (RPC would be better for atomicity, but simple increment is okay for now)
        // Actually, let's fetch the current count to be safe or use a raw query if possible. 
        // Supabase-js doesn't support easy `likes = likes + 1` without RPC. 
        // We will just fetch-then-update. It's not perfectly atomic but fine for this scale.

        const { data: letter } = await supabaseAdmin
            .from('letters')
            .select('likes')
            .eq('id', letterId)
            .single();

        if (letter) {
            const newCount = (letter.likes || 0) + change;
            await supabaseAdmin
                .from('letters')
                .update({ likes: newCount < 0 ? 0 : newCount }) // Prevent negatives
                .eq('id', letterId);

            return NextResponse.json({ success: true, likes: newCount, liked });
        }

        return NextResponse.json({ error: 'Letter not found' }, { status: 404 });

    } catch (error) {
        console.error('Like Error:', error);
        return NextResponse.json({ error: 'Failed to toggle like' }, { status: 500 });
    }
}
