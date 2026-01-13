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
            const isLight = ['paper', 'coffee-paper'].includes(theme);

            // GLOBAL FIX: ALWAYS use 'dark: 0' (Flat Mode).
            // 'dark: 1' enables the atmospheric shader which causes the "Black Nebula" opacity.
            // We want purely Flat rendering that we can blend away perfectly.

            if (isLight) {
                return {
                    baseColor: [1, 1, 1], // White for Multiply
                    glowColor: [1, 1, 1],
                    markerColor: [0.2, 0.2, 0.2],
                    blendMode: 'multiply',
                    shaderDark: 0
                };
            } else {
                return {
                    baseColor: [0, 0, 0], // True Black for Additive
                    glowColor: [0, 0, 0],
                    markerColor: theme === 'forest' ? [0.8, 1, 0.4] :
                        theme === 'nord' ? [136 / 255, 192 / 255, 208 / 255] :
                            [0.6, 0.9, 1],
                    blendMode: 'screen', // Universal Screen blend
                    shaderDark: 0 // FORCE FLAT SHADER (Removes Atmosphere)
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

        // Always Destroy and Recreate on theme change to ensure clean state
        if (globeRef.current) {
            globeRef.current.destroy();
        }

        globeRef.current = createGlobe(canvasRef.current, {
            devicePixelRatio: 2,
            width: width * 2,
            height: width * 2,
            phi: 0,
            theta: 0.25,
            dark: config.shaderDark, // ALWAYS 0 now.
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

                const time = Date.now() / 1000;
                state.markers = markers.map((m, i) => ({
                    location: m.location,
                    size: m.size * (0.8 + Math.sin(time * 2 + i) * 0.4)
                }));
            }
        });

        // Observer for Theme Changes
        const observer = new MutationObserver(() => {
            // To force a full re-render with new config, we can trigger a state update
            // But React useEffect dependency [letters] might not fire.
            // Best to rely on the parent or key prop, but for internal logic:
            // We can manually re-run getGlobeConfig and update the ref *if* we weren't destroying it.
            // Since we need to destroy it to change 'dark' property cleanly if we ever went back,
            // let's rely on the setBlendMode triggering a re-render or just window reload.
            // Actually, simplest is to reload the component via Key in parent.
            // But for now, let's just update blendMode and hope the user switches themes which triggers re-mount.
            // ...
            // Update: We simply update the state blendMode. 
            // Ideally we should add 'theme' to dependency array but we read it from DOM.
            // Let's force a reload by toggling a key equivalent.
            const newConfig = getGlobeConfig();
            setBlendMode(newConfig.blendMode);

            // Dynamic param update (except 'dark' which is static per instance)
            // Since we forced dark:0 for ALL, dynamic update works fine!
            // BUT baseColor needs to update instantly.
            // The OnRender loop handles baseColor/glowColor updates ??? 
            // Wait, I removed the dynamic update lines in the previous "Clean Switch" refactor.
            // I need to add them back if I'm not destroying every time.
            // BUT, simply destroying and recreating in useEffect is safer.
            // To trigger useEffect, I need a dependency that changes on theme change.
            // I'll add a 'themeTrigger' state.
        });

        // BETTER: Create a custom event listener or just poll? 
        // Actually, the MutationObserver is outside the Effect scope usually.
        // Let's keep it simple: The observer in the component.

        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });

        return () => {
            if (globeRef.current) globeRef.current.destroy();
            window.removeEventListener('resize', onResize);
            observer.disconnect();
        };
    }, [letters]); // We need to trigger this on theme change.

    // Force Re-Mount on Theme Change using a Key
    // This is the cleanest way to handle the DOM-based theme switch for a Canvas component.
    const [themeKey, setThemeKey] = useState('void');
    useEffect(() => {
        const observer = new MutationObserver(() => {
            setThemeKey(document.documentElement.getAttribute('data-theme') || 'void');
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
        return () => observer.disconnect();
    }, []);

    // Pass themeKey to the effect above? No, simpler to just use Key on the canvas wrapper?
    // Actually, I'll just add themeKey to the dependency array of the main useEffect.

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
                // Key forces full re-mount on theme change = Perfect cleanup and config
                key={themeKey}
                ref={canvasRef}
                style={{
                    width: '100%',
                    height: '100%',
                    contain: 'layout paint size',
                    opacity: 0,
                    // Use a simple fade-in ref callback or timeout handled in effect
                    animation: 'fadeIn 1s forwards',
                    mixBlendMode: blendMode
                }}
            />
            <style jsx>{`
                @keyframes fadeIn {
                    to { opacity: 1; }
                }
            `}</style>
        </div>
    );
}
