import createGlobe from 'cobe';
import { useEffect, useRef } from 'react';

export default function RealtimeGlobe({ letters }) {
    const canvasRef = useRef();

    useEffect(() => {
        let phi = 0;
        let width = 0;

        const onResize = () => canvasRef.current && (width = canvasRef.current.offsetWidth);
        window.addEventListener('resize', onResize);
        onResize();

        if (!canvasRef.current) return;

        // Convert letters to markers
        // We only show letters that have location data
        const markers = letters
            .filter(l => l.location_lat && l.location_lng)
            .map(l => ({
                location: [l.location_lat, l.location_lng],
                size: 0.2
            }));

        const globe = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 0,
            theta: 0.25,
            dark: 1,
            diffuse: 0, // No light diffusion
            mapSamples: 16000,
            mapBrightness: 0, // HIDE THE EARTH (Invisible Map)
            baseColor: [0, 0, 0], // Pure black (transparent-ish)
            markerColor: [0.6, 0.9, 1], // Cyan/White Starlight
            glowColor: [0.1, 0.1, 0.2], // Deep Space Blue Glow
            opacity: 0.8,
            markers: markers,
            onRender: (state) => {
                // Auto-spin (Slow and majestic)
                state.phi = phi;
                phi += 0.001;
                state.width = width * 2;
                state.height = width * 2;

                // Twinkling markers (Star effect)
                const time = Date.now() / 1000;
                state.markers = markers.map((m, i) => ({
                    location: m.location,
                    size: m.size * (0.8 + Math.sin(time * 2 + i) * 0.4) // Random twinkling based on index
                }));
            }
        });

        // Fade in effect
        setTimeout(() => canvasRef.current.style.opacity = '1', 100);

        return () => {
            globe.destroy();
            window.removeEventListener('resize', onResize);
        };
    }, [letters]); // Re-create globe when markers change (could be optimized but fine for now)

    return (
        <div style={{
            width: '100%',
            maxWidth: '600px',
            aspectRatio: '1',
            margin: '0 auto',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <canvas
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    contain: 'layout paint size',
                    opacity: 0,
                    transition: 'opacity 1s ease',
                }}
            />
            {letters.length === 0 && (
                <div style={{
                    position: 'absolute',
                    color: 'var(--text-secondary)',
                    opacity: 0.5,
                    fontSize: '14px',
                }}>
                    Scanning for signals...
                </div>
            )}
        </div>
    );
}
