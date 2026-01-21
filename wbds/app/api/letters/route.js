import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { headers } from 'next/headers';
import { maskPrivateInfo } from '../../../utils/privacyShield';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 1. Technical Fortress: Zod Schema
const LetterSchema = z.object({
    content: z.string().min(1, "Content is required").max(7777, "Content too long"),
    theme: z.string().default('void'),
    font: z.string().optional(),
    unlockAt: z.string().optional().nullable(),
    tags: z.array(z.string()).max(5, "Max 5 tags allowed").default([]),
    recipient_type: z.enum(['specific', 'universe', 'self', 'unknown']).default('unknown'),
}).strict();

// 2. Purpose Protection: Letter-ness Check
const isLikelyLetter = (text) => {
    const hasAddress = /dear|hi|hello|to my|to the person|if you're reading this/i.test(text);
    const hasClosure = /love|sorry|miss you|sincerely|yours|thank you|goodbye/i.test(text);
    const wordCount = text.trim().split(/\s+/).length;

    // If it's very short, we don't strictly require address/closure
    if (wordCount < 10) return true;

    return hasAddress || hasClosure;
};

// 3. Crisis Detection
const hasCrisisKeywords = (text) => {
    const keywords = /\b(suicide|kill myself|end it all|can't go on|want to die|self harm)\b/i;
    return keywords.test(text);
};

export async function POST(req) {
    if (!supabaseAdmin) {
        return NextResponse.json(
            { error: 'Server misconfigured: Missing Service Role Key' },
            { status: 500 }
        );
    }

    try {
        const json = await req.json();

        // Validate with Zod
        const result = LetterSchema.safeParse(json);
        if (!result.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: result.error.format()
            }, { status: 400 });
        }

        const { content, theme, unlockAt, tags, recipient_type } = result.data;

        // Purpose Check
        const isLetter = isLikelyLetter(content);
        const isCrisis = hasCrisisKeywords(content);

        // SERVER-SIDE PRIVACY ENFORCEMENT
        const safeContent = maskPrivateInfo(content);

        // 1. Get IP
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        // 2. Rate Limiting (Simple hashed check)
        let isDev = ip === '127.0.0.1' || ip === '::1';
        if (!isDev) {
            const { data: limitData } = await supabaseAdmin
                .from('rate_limits')
                .select('*')
                .eq('ip', ip)
                .single();

            let currentCount = limitData ? limitData.count : 0;
            let lastReset = limitData ? new Date(limitData.last_reset) : new Date(0);
            const now = new Date();

            if ((now - lastReset) > (24 * 60 * 60 * 1000)) {
                currentCount = 0;
            }

            if (currentCount >= 7) { // Increased for "Archive Growth" phase
                return NextResponse.json(
                    { error: 'Daily limit reached. The void needs rest.' },
                    { status: 429 }
                );
            }

            await supabaseAdmin.from('rate_limits').upsert({
                ip,
                count: currentCount + 1,
                last_reset: currentCount === 0 ? now.toISOString() : lastReset.toISOString()
            });
        }

        // 3. Location
        let lat = null, lng = null;
        if (ip && !isDev) {
            try {
                const geoRes = await fetch(`http://ip-api.com/json/${ip}`, { signal: AbortSignal.timeout(1000) });
                const geoData = await geoRes.json();
                if (geoData.status === 'success') {
                    lat = geoData.lat;
                    lng = geoData.lon;
                }
            } catch (e) {
                console.warn('Geo Lookup Failed');
            }
        } else {
            lat = (Math.random() * 160) - 80;
            lng = (Math.random() * 360) - 180;
        }

        // 4. Insert Letter
        const { data: letter, error: insertError } = await supabaseAdmin
            .from('letters')
            .insert([
                {
                    content: safeContent,
                    ip_address: ip,
                    theme,
                    location_lat: lat,
                    location_lng: lng,
                    unlock_at: unlockAt,
                    tags,
                    recipient_type, // [NEW]
                    is_purpose_match: isLetter, // [NEW] Track but don't block yet
                    has_crisis_flag: isCrisis // [NEW] Track for UI response
                }
            ])
            .select()
            .single();

        if (insertError) throw insertError;

        return NextResponse.json({
            success: true,
            letter,
            guidance_needed: !isLetter,
            crisis_detected: isCrisis
        });

    } catch (error) {
        console.error('API Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to process letter' },
            { status: 500 }
        );
    }
}
