'use client';

import { useEffect, useRef } from 'react';

export default function TurnstileWidget({ onVerify }) {
    const containerRef = useRef(null);
    const widgetId = useRef(null);

    useEffect(() => {
        // Wait for script to load
        const interval = setInterval(() => {
            if (window.turnstile) {
                clearInterval(interval);
                renderWidget();
            }
        }, 100);

        return () => clearInterval(interval);
    }, []);

    const renderWidget = () => {
        if (widgetId.current) return; // Already rendered

        // CLOUDFLARE TESTING KEY (Always Passes)
        // User should replace this in production
        const TEST_SITE_KEY = '1x00000000000000000000AA';

        try {
            widgetId.current = window.turnstile.render(containerRef.current, {
                sitekey: TEST_SITE_KEY,
                callback: function (token) {
                    console.log('Turnstile Verified');
                    onVerify(token);
                },
                'error-callback': function () {
                    console.error('Turnstile Error');
                },
                theme: 'dark', // Fits void aesthetic
                appearance: 'interaction-only' // Less intrusive
            });
        } catch (e) {
            console.error("Turnstile Render Error", e);
        }
    };

    return (
        <div className="turnstile-wrapper">
            <style jsx>{`
                .turnstile-wrapper {
                    margin-top: 15px;
                    margin-bottom: 5px;
                    display: flex;
                    justify-content: flex-end;
                    min-height: 65px; /* Reserve space */
                }
            `}</style>
            <div ref={containerRef}></div>
        </div>
    );
}
