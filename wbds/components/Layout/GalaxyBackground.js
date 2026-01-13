'use client';

import { useEffect, useRef } from 'react';

export default function GalaxyBackground() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        let width = window.innerWidth;
        let height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;

        let animationFrameId;
        let particles = [];
        let rotation = 0;

        // --- INTERACTIVITY ---
        const mouse = { x: -1000, y: -1000 };
        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        // --- PHYSICS CONFIGURATION ---
        const getTheme = () => document.documentElement.getAttribute('data-theme') || 'void';

        const createParticles = (theme) => {
            particles = [];

            if (theme.includes('paper') || theme === 'rose') {
                // INK PHYSICS (Paper, Coffee, Rose)
                const isRose = theme === 'rose';
                const count = 1500;

                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 3 + 1,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: (Math.random() - 0.5) * 0.5,
                        opacity: Math.random() * 0.15 + 0.05,
                        color: isRose ? `rgba(100, 20, 20,` : `rgba(60, 40, 30,`, // Reddish or Brown
                        type: 'ink'
                    });
                }
            } else if (theme === 'forest' || theme === 'nord') {
                // FIREFLY PHYSICS (Forest, Nord)
                const isNord = theme === 'nord';
                const count = 400;

                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 4,
                        vx: (Math.random() - 0.5) * 1,
                        vy: (Math.random() - 0.5) * 1,
                        phase: Math.random() * Math.PI * 2,
                        color: isNord ? [136, 192, 208] : [200, 255, 100],
                        type: 'firefly'
                    });
                }
            } else if (theme === 'cyberpunk' || theme === 'terminal') {
                // DIGITAL RAIN PHYSICS
                const count = 800;
                const isTerminal = theme === 'terminal';
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.floor(Math.random() * width / 20) * 20,
                        y: Math.random() * height,
                        size: Math.random() * 2 + 1,
                        speed: Math.random() * 5 + 2,
                        color: isTerminal ? [48, 209, 88] : [252, 238, 12],
                        type: 'digital'
                    });
                }
            } else {
                // GALAXY PHYSICS
                const STAR_COUNT = 3000;
                const ARM_SPREAD = 0.5;
                const SPIRAL_ARMS = 2;

                for (let i = 0; i < STAR_COUNT; i++) {
                    const r = Math.random();
                    const theta = (Math.floor(Math.random() * SPIRAL_ARMS) * 2 * Math.PI / SPIRAL_ARMS) + (r * 5) + (Math.random() - 0.5) * ARM_SPREAD;

                    particles.push({
                        r: r,
                        theta: theta,
                        x: r * Math.cos(theta) * (width * 0.5),
                        y: r * Math.sin(theta) * (width * 0.5),
                        z: (Math.random() - 0.5) * (width * 0.1),
                        size: Math.random() * 2,
                        isCore: r < 0.2,
                        type: 'galaxy'
                    });
                }
            }
        };

        // Initial Creation
        let currentTheme = getTheme();
        createParticles(currentTheme);

        // --- RENDER LOOP ---
        const render = () => {
            const theme = getTheme();

            // Check for theme switch
            if (theme !== currentTheme) {
                currentTheme = theme;
                createParticles(theme);
                rotation = 0;
            }

            // CLEAR
            if (theme.includes('paper')) {
                ctx.clearRect(0, 0, width, height);
                ctx.globalCompositeOperation = 'multiply';
            } else {
                ctx.globalCompositeOperation = 'source-over';
                ctx.fillStyle = theme === 'forest' ? '#1a2f23' : '#050508';
                ctx.fillRect(0, 0, width, height);
                ctx.globalCompositeOperation = 'lighter';
            }

            const time = Date.now() / 1000;
            rotation += 0.0003;

            // --- CURSOR EMISSION ---
            if (mouse.x > 0) {
                if (theme.includes('paper') || theme === 'rose') {
                    // Ink Trail
                    for (let i = 0; i < 2; i++) {
                        particles.push({
                            x: mouse.x + (Math.random() - 0.5) * 10,
                            y: mouse.y + (Math.random() - 0.5) * 10,
                            size: Math.random() * 4,
                            vx: (Math.random() - 0.5),
                            vy: (Math.random() - 0.5) + 0.5,
                            opacity: 0.6,
                            life: 1.0,
                            color: theme === 'rose' ? `rgba(100, 20, 20,` : `rgba(60, 40, 30,`,
                            type: 'ink_trail'
                        });
                    }
                } else if (theme === 'forest' || theme === 'nord') {
                    // Fairy Dust
                    if (Math.random() > 0.5) {
                        particles.push({
                            x: mouse.x,
                            y: mouse.y,
                            size: Math.random() * 2,
                            vx: (Math.random() - 0.5) * 2,
                            vy: (Math.random() - 0.5) * 2,
                            life: 1.0,
                            color: theme === 'nord' ? [136, 192, 208] : [255, 255, 200],
                            type: 'dust'
                        });
                    }
                } else if (theme === 'cyberpunk' || theme === 'terminal') {
                    // Glitch Trail
                    if (Math.random() > 0.5) {
                        particles.push({
                            x: mouse.x + (Math.random() - 0.5) * 50,
                            y: mouse.y,
                            size: Math.random() * 3,
                            speed: 0,
                            life: 0.5,
                            color: theme === 'terminal' ? [48, 209, 88] : [252, 238, 12],
                            type: 'glitch_trail'
                        });
                    }
                } else {
                    // Stardust
                    if (Math.random() > 0.5) {
                        particles.push({
                            x: mouse.x,
                            y: mouse.y,
                            size: Math.random() * 2,
                            life: 1.0,
                            vx: (Math.random() - 0.5) * 0.5,
                            vy: (Math.random() - 0.5) * 0.5,
                            isCore: true,
                            type: 'stardust'
                        });
                    }
                }
            }

            // FILTER
            particles = particles.filter(p => {
                if (p.life !== undefined) {
                    p.life -= 0.02;
                    return p.life > 0;
                }
                return true;
            });

            particles.forEach(p => {
                if (p.type === 'ink' || p.type === 'ink_trail') {
                    p.x += p.vx;
                    p.y += p.vy;
                    // Wrap Perm particles
                    if (!p.life) {
                        if (p.x < 0) p.x = width;
                        if (p.x > width) p.x = 0;
                        if (p.y < 0) p.y = height;
                        if (p.y > height) p.y = 0;
                    }

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    const alpha = p.life !== undefined ? p.opacity * p.life : p.opacity;
                    ctx.fillStyle = p.color + alpha + ')';
                    ctx.fill();

                } else if (p.type === 'firefly' || p.type === 'dust') {
                    // Firefly Attraction
                    if (p.type === 'firefly') {
                        const dx = mouse.x - p.x;
                        const dy = mouse.y - p.y;
                        const dist = Math.sqrt(dx * dx + dy * dy);
                        if (dist < 300) {
                            p.vx += dx * 0.0001;
                            p.vy += dy * 0.0001;
                        }
                        p.vx *= 0.99;
                        p.vy *= 0.99;
                    }

                    p.x += p.vx + Math.sin(time + (p.phase || 0)) * 0.5;
                    p.y += p.vy + Math.cos(time + (p.phase || 0)) * 0.5;

                    if (!p.life) {
                        if (p.x < 0) p.x = width;
                        if (p.x > width) p.x = 0;
                        if (p.y < 0) p.y = height;
                        if (p.y > height) p.y = 0;
                    }

                    const pulse = 0.5 + Math.sin(time * 3 + (p.phase || 0)) * 0.5;
                    const r = p.color[0];
                    const g = p.color[1];
                    const b = p.color[2];
                    const alpha = p.life !== undefined ? p.life : 0.5 * pulse;

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * (p.life ? 1 : pulse), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
                    ctx.fill();

                } else if (p.type === 'digital' || p.type === 'glitch_trail') {
                    if (p.type === 'glitch_trail') {
                        ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${p.life})`;
                        ctx.fillRect(p.x, p.y, p.size, p.size);
                    } else {
                        p.y += p.speed;
                        if (p.y > height) p.y = 0;
                        ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.5)`;
                        ctx.fillRect(p.x, p.y, 2, p.size * 5);
                    }

                } else {
                    // GALAXY / STARDUST
                    let sx, sy, scale;

                    if (p.type === 'stardust') {
                        p.x += p.vx;
                        p.y += p.vy;
                        sx = p.x;
                        sy = p.y;
                        scale = 1;
                        ctx.fillStyle = `rgba(200, 220, 255, ${p.life})`;
                    } else {
                        const cosR = Math.cos(rotation);
                        const sinR = Math.sin(rotation);
                        let px = p.x * cosR - p.y * sinR;
                        let py = p.x * sinR + p.y * cosR;
                        let pz = p.z;

                        const tilt = 60 * (Math.PI / 180);
                        let yRot = py * Math.cos(tilt) - pz * Math.sin(tilt);
                        let zRot = py * Math.sin(tilt) + pz * Math.cos(tilt);

                        scale = 800 / (800 + zRot);
                        sx = width / 2 + px * scale;
                        sy = height / 2 + yRot * scale;

                        if (scale <= 0) return;

                        if (p.isCore) {
                            ctx.fillStyle = `rgba(255, 220, 200, ${0.8 * scale})`;
                        } else {
                            ctx.fillStyle = `rgba(100, 150, 255, ${0.4 * scale})`;
                        }
                    }

                    if (scale > 0 || p.type === 'stardust') {
                        ctx.beginPath();
                        ctx.arc(sx, sy, p.size * (scale || 1), 0, Math.PI * 2);
                        ctx.fill();
                    }
                }
            });

            animationFrameId = requestAnimationFrame(render);
        };

        render();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            createParticles(currentTheme);
        };

        // Observe Data Attribute Changes on HTML
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'attributes' && mutation.attributeName === 'data-theme') {
                    // Update happens in render loop
                }
            });
        });

        observer.observe(document.documentElement, { attributes: true });
        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            window.removeEventListener('mousemove', handleMouseMove);
            cancelAnimationFrame(animationFrameId);
            observer.disconnect();
        };
    }, []);

    return (
        <canvas
            ref={canvasRef}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: -1,
                pointerEvents: 'none'
            }}
        />
    );
}
