import createGlobe from 'cobe';
import { useEffect, useRef, useState } from 'react';

// NOTE: This file handles the BACKGROUND PARTICLES. 
// The Globe is in RealtimeGlobe.js. Assumed user context kept separate.
// Wait, I am editing GalaxyBackground.js but I pasted RealtimeGlobe imports above?
// Correcting imports for GalaxyBackground.

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
                // PHYSICS: SUSPENDED DUST (Brownian Motion)
                // Particles float aimlessly in all directions, like dust in a sunbeam.
                const isRose = theme === 'rose';
                const count = 500;

                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 2.5,
                        // Random slow movement in ANY direction
                        vx: (Math.random() - 0.5) * 0.3,
                        vy: (Math.random() - 0.5) * 0.3,
                        opacity: Math.random() * 0.3 + 0.1,
                        color: isRose ? `rgba(100, 50, 50,` : `rgba(80, 60, 50,`,
                        type: 'dust_suspended'
                    });
                }
            } else if (theme === 'forest' || theme === 'nord') {
                // PHYSICS: WIND BREEZE (Horizontal Flow)
                // Particles drift horizontally with turbulence, like pollen in wind.
                const isNord = theme === 'nord';
                const count = 400;

                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 3,
                        // Generalized Wind Direction (Right to Left or Left to Right)
                        vx: Math.random() * 0.5 + 0.2, // Drifting Right
                        vy: (Math.random() - 0.5) * 0.2, // Slight vertical jitter
                        phase: Math.random() * Math.PI * 2,
                        color: isNord ? [136, 192, 208] : [255, 255, 150],
                        type: 'pollen_breeze'
                    });
                }
            } else if (theme === 'cyberpunk' || theme === 'terminal') {
                // PHYSICS: DIGITAL RAIN (Vertical High Speed)
                // Matrix style fall.
                const count = 800;
                const isTerminal = theme === 'terminal';
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.floor(Math.random() * width / 15) * 15, // Grid aligned
                        y: Math.random() * height,
                        size: Math.random() * 2 + 1,
                        speed: Math.random() * 8 + 4, // Fast Fall
                        color: isTerminal ? [48, 209, 88] : [252, 238, 12],
                        type: 'digital_rain'
                    });
                }
            } else {
                // PHYSICS: COSMIC DRIFT (Deep Space)
                // Stars floating in 3D-ish space, not falling. + Shooting Stars.
                const STAR_COUNT = 1000;
                for (let i = 0; i < STAR_COUNT; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 2,
                        // Slow Drift in random directions
                        vx: (Math.random() - 0.5) * 0.2,
                        vy: (Math.random() - 0.5) * 0.2,
                        opacity: Math.random(),
                        type: 'space_drift'
                    });
                }

                // GALAXY SPIRAL (Retained as visual anchor)
                for (let i = 0; i < 400; i++) {
                    const r = Math.random();
                    const theta = (Math.random() * Math.PI * 2);
                    particles.push({
                        r: r, theta: theta,
                        x: 0, y: 0, z: (Math.random() - 0.5) * 200,
                        size: Math.random() * 2,
                        type: 'galaxy'
                    });
                }
            }
        };

        let currentTheme = getTheme();
        createParticles(currentTheme);

        // --- RENDER LOOP ---
        const render = () => {
            const theme = getTheme();

            // Re-check theme
            if (theme !== currentTheme) {
                currentTheme = theme;
                createParticles(theme);
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

            // --- SPAWN TRAIL (Interactive) ---
            if (mouse.x > 0) {
                if (Math.random() > 0.8) {
                    particles.push({
                        x: mouse.x,
                        y: mouse.y,
                        size: Math.random() * 3,
                        vx: (Math.random() - 0.5),
                        vy: (Math.random() - 0.5),
                        life: 1.0,
                        color: theme.includes('paper') ? '0,0,0' : '255, 255, 255',
                        type: 'trail'
                    });
                }
            }

            // --- SPAWN SHOOTING STARS (Void Only) ---
            // Only spawn in Space themes
            if (!theme.includes('paper') && theme !== 'forest' && theme !== 'nord' && !theme.includes('cyberpunk') && !theme.includes('terminal')) {
                if (Math.random() < 0.02) {
                    const startX = Math.random() * width + 200;
                    const startY = Math.random() * (height * 0.5) - 200;
                    particles.push({
                        x: startX,
                        y: startY,
                        len: Math.random() * 80 + 50,
                        speed: Math.random() * 15 + 10,
                        size: Math.random() * 2 + 1,
                        vx: -1,
                        vy: 1,
                        life: 1.0,
                        type: 'shooting_star'
                    });
                }
            }

            // MAIN LOOP
            particles.forEach((p, index) => {
                // 1. Move & Physics Per Type
                if (p.type === 'dust_suspended') {
                    // Brownian Motion
                    p.x += p.vx + Math.sin(time + p.y) * 0.1;
                    p.y += p.vy + Math.cos(time + p.x) * 0.1;
                } else if (p.type === 'pollen_breeze') {
                    // Wind + Sine Wave
                    p.x += p.vx;
                    p.y += p.vy + Math.sin(time * 2 + p.phase) * 0.5;
                } else if (p.type === 'digital_rain') {
                    // Vertical Fall
                    p.y += p.speed;
                } else if (p.type === 'space_drift') {
                    // Slow random drift
                    p.x += p.vx;
                    p.y += p.vy;
                } else if (p.type === 'trail') {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.05;
                } else if (p.type === 'shooting_star') {
                    p.x += p.vx * p.speed;
                    p.y += p.vy * p.speed;
                    p.life -= 0.02;
                } else if (p.type === 'galaxy') {
                    const rot = time * 0.1;
                    p.x = Math.cos(p.theta + rot) * (p.r * width / 2) + width / 2;
                    p.y = Math.sin(p.theta + rot) * (p.r * width / 2) + height / 2;
                }

                // 2. Wrap / Kill
                if (p.type === 'trail' || p.type === 'shooting_star') {
                    if (p.life <= 0 || p.x < -200 || p.y > height + 200) {
                        particles.splice(index, 1);
                        return;
                    }
                } else if (p.type !== 'galaxy') {
                    // Screen Wrap for infinite particles
                    if (p.x > width) p.x = 0;
                    if (p.x < 0) p.x = width;
                    if (p.y > height) p.y = 0;
                    if (p.y < 0) p.y = height;
                }

                // 3. Draw
                ctx.beginPath();

                if (p.type === 'dust_suspended') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color + p.opacity + ')';
                    ctx.fill();
                } else if (p.type === 'pollen_breeze') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    const pulse = 0.5 + Math.sin(time * 5 + p.phase) * 0.5;
                    const c = p.color;
                    ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${pulse})`;
                    ctx.fill();
                } else if (p.type === 'digital_rain') {
                    ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.5)`;
                    ctx.fillRect(p.x, p.y, 2, p.size * 5);
                } else if (p.type === 'space_drift') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(200, 220, 255, ${p.opacity})`;
                    ctx.fill();
                } else if (p.type === 'trail') {
                    ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
                    if (theme.includes('paper')) {
                        ctx.fillStyle = `rgba(0,0,0, ${p.life * 0.5})`;
                    } else {
                        ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
                    }
                    ctx.fill();
                } else if (p.type === 'shooting_star') {
                    // Gradient Tail
                    const tailX = p.x - (p.vx * p.len);
                    const tailY = p.y - (p.vy * p.len);

                    const grad = ctx.createLinearGradient(p.x, p.y, tailX, tailY);
                    grad.addColorStop(0, `rgba(255, 255, 255, ${p.life})`);
                    grad.addColorStop(1, `rgba(255, 255, 255, 0)`);

                    ctx.strokeStyle = grad;
                    ctx.lineWidth = p.size;
                    ctx.lineCap = 'round';
                    ctx.moveTo(p.x, p.y);
                    ctx.lineTo(tailX, tailY);
                    ctx.stroke();

                    // Glow Head
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.size * 1.5, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, 255, 255, ${p.life})`;
                    ctx.fill();
                } else if (p.type === 'galaxy') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(150, 150, 255, 0.5)`;
                    ctx.fill();
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

        const observer = new MutationObserver((mutations) => {
            // Loop handles theme change
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
