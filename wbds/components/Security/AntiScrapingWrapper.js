'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { enableAntiScraping, disableAntiScraping } from '../../utils/antiScraping';

export default function AntiScrapingWrapper({ children }) {
    const pathname = usePathname();

    useEffect(() => {
        // Exempt the legal page from anti-scraping
        if (pathname === '/legal') {
            disableAntiScraping();
            return;
        }

        // Enable anti-scraping protection on mount for all other pages
        const cleanup = enableAntiScraping();

        return () => {
            if (cleanup) cleanup();
        };
    }, [pathname]);

    return <>{children}</>;
}
