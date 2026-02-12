import { NextResponse } from 'next/server';
import { getSupabaseAdmin } from '../../../lib/supabase-admin';
import { hashIp } from '../../../lib/edge-crypto';

import { headers } from 'next/headers';
import { maskPrivateInfo } from '../../../utils/privacyShield';
import { moderateContent, sanitizeContent } from '../../../utils/contentFilters';
import { analyzeWithAI } from '../../../utils/aiModeration';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// 1. Technical Fortress: Zod Schema
const LetterSchema = z.object({
    content: z.string().min(1, "Content is required").max(7777, "Content too long"),
    theme: z.string().default('void'),
    font: z.string().optional().default('sans'),
    unlockAt: z.string().optional().nullable(),
    tags: z.array(z.string()).max(5, "Max 5 tags allowed").default([]),
    recipient_type: z.enum(['specific', 'universe', 'self', 'unknown']).default('unknown'),
    forced: z.boolean().optional(),
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
    const supabaseAdmin = getSupabaseAdmin();
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

        // 1. Get Identifiers (IP & Fingerprint)
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';
        const fingerprint = headersList.get('x-fingerprint') || 'unknown';

        // 2. CHECK TRUST & REPUTATION (Bans/Shadow Bans)
        const { data: reputation } = await supabaseAdmin
            .from('ip_reputation')
            .select('*')
            .or(`ip.eq.${ip},browser_fingerprint.eq.${fingerprint}`)
            .single();

        const isBanned = reputation?.is_banned || false;

        // [SHADOW BAN LOGIC]
        // If they are banned, we still "proceed" to save it as shadow-banned
        // to keep them in the dark (Bluffing).
        let isShadowBanned = isBanned;

        // CONTENT MODERATION CHECK (8 layers)
        const moderation = moderateContent(content);
        if (moderation.blocked) {
            // If they are shadow-banned, we don't even give them moderation errors
            if (isShadowBanned) {
                // Proceed to save but hide
            } else {
                return NextResponse.json({
                    error: 'Content not allowed',
                    message: moderation.blockMessage,
                    reason: moderation.blockReason
                }, { status: 400 });
            }
        }

        // Sanitize HTML/JS if detected
        let processedContent = content;
        if (moderation.warnings.includes('html_stripped')) {
            processedContent = sanitizeContent(content);
        }

        // AI MODERATION (after regex passes)
        const aiResult = await analyzeWithAI(processedContent);
        if (!aiResult.skip) {
            if (aiResult.flagged || aiResult.maxScore > 0.85) {
                if (isShadowBanned) {
                    // Silently accept
                } else {
                    return NextResponse.json({
                        error: 'Content not allowed',
                        message: "The void senses something off. Try rephrasing.",
                        reason: 'ai_flagged'
                    }, { status: 400 });
                }
            }
        }

        // Purpose Check
        const isLetter = isLikelyLetter(processedContent);
        const isCrisis = hasCrisisKeywords(processedContent);

        // SERVER-SIDE PRIVACY ENFORCEMENT
        const safeContent = maskPrivateInfo(processedContent);

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

            if (currentCount >= 15) { // Relaxed for trusted users?
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
        // [SECURITY] Hash the IP for permanent anonymity before storage
        const hashedIp = await hashIp(ip, process.env.ADMIN_SECRET || 'void-salt');

        const { data: letter, error: insertError } = await supabaseAdmin
            .from('letters')
            .insert([
                {
                    content: safeContent,
                    ip_address: hashedIp,
                    theme,
                    location_lat: lat,
                    location_lng: lng,
                    unlock_at: unlockAt,
                    tags,
                    recipient_type,
                    is_purpose_match: isLetter,
                    has_crisis_flag: isCrisis,
                    ai_toxicity_score: aiResult.skip ? null : aiResult.maxScore,
                    needs_review: (aiResult.needsReview || isShadowBanned),
                    is_shadow_banned: isShadowBanned, // [NEW] The Silent Flag
                }
            ])
            .select()
            .single();

        if (insertError) throw insertError;

        // 5. Update Reputation (Increment post count)
        if (ip && fingerprint !== 'unknown') {
            await supabaseAdmin.from('ip_reputation').upsert({
                ip,
                browser_fingerprint: fingerprint,
                total_posts: (reputation?.total_posts || 0) + 1,
                last_action: new Date().toISOString()
            }, { onConflict: 'ip' });
        }

        // 6. SUCCESS BLUFFING
        // Return success even if shadow-banned
        return NextResponse.json({
            success: true,
            letter,
            guidance_needed: isShadowBanned ? false : !isLetter,
            crisis_detected: isShadowBanned ? false : isCrisis
        });

    } catch (error) {
        console.error('API Error:', error.message);
        return NextResponse.json(
            { error: 'Failed to process letter' },
            { status: 500 }
        );
    }
}
