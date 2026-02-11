import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../../lib/supabase-admin';

export const runtime = 'edge';
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

        // Server-Side Masking for Time Capsules
        const now = new Date();
        const maskedData = data.map(letter => {
            if (letter.unlock_at && new Date(letter.unlock_at) > now) {
                return {
                    ...letter,
                    content: "🔒 This letter is lost in time.", // Masked
                    is_locked: true // Flag for UI
                };
            }
            return letter;
        });

        return NextResponse.json(maskedData);
    } catch (error) {
        console.error('Best Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to fetch top letters' }, { status: 500 });
    }
}

// DELETE endpoint to clear all letters from BEST section (letters with likes > 0)
export async function DELETE() {
    if (!supabaseAdmin) {
        return NextResponse.json({ error: 'Server Config Error' }, { status: 500 });
    }

    try {
        // Delete all letters that have likes (these appear in BEST section)
        const { data, error } = await supabaseAdmin
            .from('letters')
            .delete()
            .gt('likes', 0)
            .select();

        if (error) throw error;

        return NextResponse.json({
            success: true,
            deleted: data?.length || 0,
            message: `Deleted ${data?.length || 0} letter(s) from BEST section`
        });
    } catch (error) {
        console.error('Delete BEST Error:', error);
        return NextResponse.json({ error: 'Failed to delete letters' }, { status: 500 });
    }
}
