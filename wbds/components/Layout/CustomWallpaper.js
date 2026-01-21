'use client';

import { useState, useEffect } from 'react';
import { getImage } from '../../utils/db';

export default function CustomWallpaper({ theme }) {
    const [bgDesktop, setBgDesktop] = useState(null);
    const [bgMobile, setBgMobile] = useState(null);

    useEffect(() => {
        const loadImages = async () => {
            if (theme !== 'custom') return;
            const d = await getImage('wbds_custom_bg_desktop');
            const m = await getImage('wbds_custom_bg_mobile');
            setBgDesktop(d);
            setBgMobile(m);
        };

        loadImages();

        // Listen for updates (when user uploads new image)
        const handleUpdate = () => loadImages();
        window.addEventListener('custom-bg-update', handleUpdate);
        return () => window.removeEventListener('custom-bg-update', handleUpdate);
    }, [theme]);

    if (theme !== 'custom') return null;

    return (
        <>
            <div className="custom-wallpaper-layer desktop-bg" style={{ backgroundImage: bgDesktop ? `url("${bgDesktop}")` : 'none' }}></div>
            <div className="custom-wallpaper-layer mobile-bg" style={{ backgroundImage: bgMobile ? `url("${bgMobile}")` : 'none' }}></div>

            <style jsx>{`
                .custom-wallpaper-layer {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                    z-index: -5; /* Deep background */
                    background-size: cover;
                    background-position: center;
                    background-repeat: no-repeat;
                    background-color: #000;
                    pointer-events: none;
                }

                @media (min-width: 769px) {
                    .desktop-bg { display: block; background-attachment: fixed; }
                    .mobile-bg { display: none; }
                }

                @media (max-width: 768px) {
                    .desktop-bg { display: none; }
                    .mobile-bg { display: block; background-attachment: scroll; }
                }
            `}</style>
        </>
    );
}
