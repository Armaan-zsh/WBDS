import createGlobe from 'cobe';
import { useEffect, useRef, useState } from 'react';

export default function RealtimeGlobe({ letters }) {
    const canvasRef = useRef();
    const globeRef = useRef(null);
    // Track current config logic
    const [blendMode, setBlendMode] = useState('screen');

    useEffect(() => {
        let width = 0;
        let phi = 0;

        const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);
        window.addEventListener('resize', onResize);
        onResize();

        if (!canvasRef.current) return;

        const getGlobeConfig = () => {
            const theme = document.documentElement.getAttribute('data-theme') || 'void';
            // STRICT CLASSIFICATION: Only "Paper" themes use Subtractive Blending (Ink)
            const isLight = ['paper', 'coffee-paper'].includes(theme);

            if (isLight) {
                return {
                    baseColor: [1, 1, 1], // White for Multiply
                    glowColor: [1, 1, 1], // White Glow (Transparent in Multiply)
                    markerColor: [0.2, 0.2, 0.2], // Dark Ink
                    blendMode: 'multiply'
                };
            } else {
                return {
                    baseColor: [0, 0, 0], // Black for Additive Transparency
                    glowColor: [0, 0, 0], // Black Glow (Invisible in Additive)
                    markerColor: theme === 'forest' ? [0.8, 1, 0.4] :
                        theme === 'nord' ? [136 / 255, 192 / 255, 208 / 255] : // Nord Cyan
                            [0.6, 0.9, 1],
                    blendMode: 'plus-lighter'
                };
            }
        };

        const markers = letters
            .filter(l => l.location_lat && l.location_lng)
            .map(l => ({
                location: [l.location_lat, l.location_lng],
                size: 0.15
            }));

        let config = getGlobeConfig();
        setBlendMode(config.blendMode);

        globeRef.current = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 0,
            theta: 0.25,
            dark: 1,
            diffuse: 0,
            mapSamples: 16000,
            mapBrightness: 0,
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

                // Dynamic Updates
                state.baseColor = config.baseColor;
                state.markerColor = config.markerColor;
                state.glowColor = config.glowColor;

                const time = Date.now() / 1000;
                state.markers = markers.map((m, i) => ({
                    location: m.location,
                    size: m.size * (0.8 + Math.sin(time * 2 + i) * 0.4)
                }));
            }
        });

        // Observer for Theme Changes
        const observer = new MutationObserver(() => {
            config = getGlobeConfig();
            setBlendMode(config.blendMode);
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        setTimeout(() => {
            if (canvasRef.current) canvasRef.current.style.opacity = '1';
        }, 100);

        return () => {
            if (globeRef.current) globeRef.current.destroy();
            window.removeEventListener('resize', onResize);
            observer.disconnect();
        };
    }, [letters]);

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
