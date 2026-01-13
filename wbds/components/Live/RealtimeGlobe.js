import createGlobe from 'cobe';
import { useEffect, useRef, useState } from 'react';

export default function RealtimeGlobe({ letters }) {
    const canvasRef = useRef();
    const globeRef = useRef(null);
    const [isLightMode, setIsLightMode] = useState(false);
    const [blendMode, setBlendMode] = useState('screen');

    // 1. Detect Theme Mode (Light vs Dark) to force re-render
    useEffect(() => {
        const checkTheme = () => {
            const theme = document.documentElement.getAttribute('data-theme') || 'void';
            const light = ['paper', 'coffee-paper'].includes(theme);
            setIsLightMode(light);
            setBlendMode(light ? 'multiply' : 'screen');
        };

        checkTheme();

        const observer = new MutationObserver(checkTheme);
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // 2. Initialize Globe (Re-runs when isLightMode changes)
    useEffect(() => {
        let width = 0;
        let phi = 0;

        const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);
        window.addEventListener('resize', onResize);
        onResize();

        if (!canvasRef.current) return;

        // Config based on current mode
        const theme = document.documentElement.getAttribute('data-theme') || 'void';
        const config = isLightMode ? {
            baseColor: [1, 1, 1],
            glowColor: [1, 1, 1], // Pure White Glow (Transparent in Multiply)
            markerColor: [0.2, 0.2, 0.2],
            dark: 0 // <--- CRITICAL: Use Light Mode Shader
        } : {
            baseColor: [0, 0, 0],
            glowColor: [0, 0, 0],
            markerColor: theme === 'forest' ? [0.8, 1, 0.4] :
                theme === 'nord' ? [136 / 255, 192 / 255, 208 / 255] :
                    [0.6, 0.9, 1],
            dark: 1 // Dark Mode Shader
        };

        const markers = letters
            .filter(l => l.location_lat && l.location_lng)
            .map(l => ({
                location: [l.location_lat, l.location_lng],
                size: 0.15
            }));

        // Destroy previous instance if exists (Clean Switch)
        if (globeRef.current) {
            globeRef.current.destroy();
        }

        globeRef.current = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 0,
            theta: 0.25,
            dark: config.dark, // Use specific shader mode
            diffuse: 1.2,
            mapSamples: 16000,
            mapBrightness: 6,
            baseColor: config.baseColor,
            markerColor: config.markerColor,
            glowColor: config.glowColor,
            opacity: 1,
            markers: markers,
            onRender: (state) => {
                state.phi = phi;
                phi += 0.001;
                state.width = width * 2;
                state.height = width * 2;

                // We don't dynamically update colors here because we force re-creation on theme change
                // This ensures the shader 'dark' mode stays synced with colors.

                const time = Date.now() / 1000;
                state.markers = markers.map((m, i) => ({
                    location: m.location,
                    size: m.size * (0.8 + Math.sin(time * 2 + i) * 0.4)
                }));
            }
        });

        setTimeout(() => {
            if (canvasRef.current) canvasRef.current.style.opacity = '1';
        }, 100);

        return () => {
            if (globeRef.current) globeRef.current.destroy();
            window.removeEventListener('resize', onResize);
        };
    }, [letters, isLightMode]); // <--- Re-run when Mode changes

    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            aspectRatio: '1',
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            pointerEvents: 'none'
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    contain: 'layout paint size',
                    opacity: 0,
                    transition: 'opacity 1s ease',
                    mixBlendMode: blendMode
                }}
            />
        </div>
    );
}
