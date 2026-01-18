'use client';

import { useEffect } from 'react';
import { enableAntiScraping, applyAntiScrapingStyles } from '../../utils/antiScraping';

export default function AntiScrapingWrapper({ children }) {
    useEffect(() => {
        // Enable anti-scraping protection on mount
        enableAntiScraping();
        applyAntiScrapingStyles();
    }, []);

    return <>{children}</>;
}
