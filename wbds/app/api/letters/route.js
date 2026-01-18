import { NextResponse } from 'next/server';
import { supabaseAdmin } from '../../../lib/supabase-admin';
import { headers } from 'next/headers';
import { maskPrivateInfo } from '../../../utils/privacyShield';

export const dynamic = 'force-dynamic'; // No caching

export async function POST(req) {
    if (!supabaseAdmin) {
        return NextResponse.json(
            { error: 'Server misconfigured: Missing Service Role Key' },
            { status: 500 }
        );
    }

    try {
        const body = await req.json();
        const { content, theme, font, unlockAt } = body;

        if (!content || !content.trim()) {
            return NextResponse.json({ error: 'Content required' }, { status: 400 });
        }

        // SERVER-SIDE PRIVACY ENFORCEMENT
        // Even if client-side check is bypassed, we redact known PII here.
        const safeContent = maskPrivateInfo(content);

        // 1. Get IP
        const headersList = headers();
        const forwardedFor = headersList.get('x-forwarded-for');
        const ip = forwardedFor ? forwardedFor.split(',')[0] : '127.0.0.1';

        // 2. Check Limit (Skip for Localhost)
        let isDev = ip === '127.0.0.1' || ip === '::1';

        // Only enforce limit in production or non-local
        if (!isDev) {
            const { data: limitData, error: limitError } = await supabaseAdmin
                .from('rate_limits')
                .select('*')
                .eq('ip', ip)
                .single();

            let currentCount = 0;
            let lastReset = new Date(0); // Epoch

            if (limitData) {
                currentCount = limitData.count;
                lastReset = new Date(limitData.last_reset);
            }

            // Check if 24 hours passed
            const now = new Date();
            const oneDay = 24 * 60 * 60 * 1000;

            if ((now - lastReset) > oneDay) {
                // New Day, Reset
                currentCount = 0;
                // Upsert will handle updating timestamp
            }

            if (currentCount >= 3) {
                return NextResponse.json(
                    { error: 'Daily limit reached (3 letters/day). Come back tomorrow.' },
                    { status: 429 }
                );
            }

            // 3. Increment Limit
            const { error: upsertError } = await supabaseAdmin
                .from('rate_limits')
                .upsert({
                    ip,
                    count: currentCount + 1,
                    last_reset: currentCount === 0 ? new Date().toISOString() : lastReset.toISOString()
                });

            if (upsertError) {
                console.error('Rate limit error:', upsertError);
            }
        }

        // 3. Get Location (IP Geolocation)
        let lat = null;
        let lng = null;

        try {
            // Skips localhost
            if (ip && ip !== '127.0.0.1' && ip !== '::1') {
                const geoPromise = fetch(`http://ip-api.com/json/${ip}`);
                const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Geo Timeout')), 1000));

                const geoRes = await Promise.race([geoPromise, timeoutPromise]);
                const geoData = await geoRes.json();

                if (geoData.status === 'success') {
                    lat = geoData.lat;
                    lng = geoData.lon;
                }
            } else {
                // Dev mode: Random location so you can see the globe work!
                lat = (Math.random() * 160) - 80; // -80 to 80
                lng = (Math.random() * 360) - 180; // -180 to 180
            }
        } catch (e) {
            // Geo failed, silently continue
            console.warn('Geo Lookup Failed (Continuing without location):', e.message);
        }

        // 4. Insert Letter
        const { data: letter, error: insertError } = await supabaseAdmin
            .from('letters')
            .insert([
                {
                    content: safeContent, // Use filtered content
                    ip_address: ip,
                    theme: body.theme || 'void',
                    location_lat: lat,
                    location_lng: lng,
                    unlock_at: body.unlockAt || null // Handle Time Capsule
                }
            ])
            .select() // Return the inserted data
            .single();

        if (insertError) {
            throw insertError;
        }

        return NextResponse.json({ success: true, letter });

    } catch (error) {
        console.error('API Error:', error.message, error.details || '');
        return NextResponse.json(
            { error: error.message || 'Failed to send letter' },
            { status: 500 }
        );
    }
}
