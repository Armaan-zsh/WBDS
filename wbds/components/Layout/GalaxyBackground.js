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
                // DUST / INK MOTES
                const isRose = theme === 'rose';
                const count = 400;

                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 2,
                        vx: (Math.random() - 0.5) * 0.5,
                        vy: Math.random() * 0.5 + 0.2,
                        opacity: Math.random() * 0.3 + 0.1,
                        color: isRose ? `rgba(100, 50, 50,` : `rgba(80, 60, 50,`,
                        type: 'dust'
                    });
                }
            } else if (theme === 'forest' || theme === 'nord') {
                // FALLING POLLEN
                const isNord = theme === 'nord';
                const count = 300;

                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 3,
                        vx: (Math.random() - 0.5) * 1,
                        vy: Math.random() * 1 + 0.5,
                        phase: Math.random() * Math.PI * 2,
                        color: isNord ? [136, 192, 208] : [255, 255, 150],
                        type: 'pollen'
                    });
                }
            } else if (theme === 'cyberpunk' || theme === 'terminal') {
                // DIGITAL RAIN
                const count = 600;
                const isTerminal = theme === 'terminal';
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.floor(Math.random() * width / 15) * 15,
                        y: Math.random() * height,
                        size: Math.random() * 2 + 1,
                        speed: Math.random() * 10 + 5,
                        color: isTerminal ? [48, 209, 88] : [252, 238, 12],
                        type: 'digital_rain'
                    });
                }
            } else {
                // SPACE THEMES (Void, Midnight, Solarized)
                // 1. STARFALL (Vertical Snow)
                const STAR_COUNT = 800;
                for (let i = 0; i < STAR_COUNT; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 2,
                        vy: Math.random() * 3 + 0.5,
                        opacity: Math.random(),
                        type: 'starfall'
                    });
                }

                // 2. GALAXY CORE (3D Depth)
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

            // --- SPAWN TRAIL ---
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
            if (!theme.includes('paper') && theme !== 'forest' && theme !== 'nord' && !theme.includes('cyberpunk') && !theme.includes('terminal')) {
                // Random chance (approx every 1.5 seconds)
                if (Math.random() < 0.015) {
                    // Start from top or right side
                    const startX = Math.random() * width + 200; // Offset for angle
                    const startY = Math.random() * (height * 0.5) - 200;

                    particles.push({
                        x: startX,
                        y: startY,
                        len: Math.random() * 80 + 50, // Long tail
                        speed: Math.random() * 15 + 10, // Very Fast
                        size: Math.random() * 2 + 1,
                        vx: -1, // Moving Left
                        vy: 1,  // Moving Down
                        life: 1.0,
                        type: 'shooting_star'
                    });
                }
            }

            // MAIN LOOP
            particles.forEach((p, index) => {
                // 1. Move
                if (p.type === 'dust') {
                    p.y += p.vy;
                    p.x += Math.sin(time + p.y * 0.01) * 0.5;
                } else if (p.type === 'pollen') {
                    p.y += p.vy;
                    p.x += Math.cos(time * 2 + p.y * 0.01);
                } else if (p.type === 'digital_rain') {
                    p.y += p.speed;
                } else if (p.type === 'starfall') {
                    p.y += p.vy;
                } else if (p.type === 'trail') {
                    p.x += p.vx;
                    p.y += p.vy;
                    p.life -= 0.05;
                } else if (p.type === 'shooting_star') {
                    p.x += p.vx * p.speed;
                    p.y += p.vy * p.speed;
                    p.life -= 0.02; // Fast decay
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
                    if (p.y > height) {
                        p.y = -10;
                        p.x = Math.random() * width;
                    }
                }

                // 3. Draw
                ctx.beginPath();

                if (p.type === 'dust') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color + p.opacity + ')';
                    ctx.fill();
                } else if (p.type === 'pollen') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    const pulse = 0.5 + Math.sin(time * 5 + p.phase) * 0.5;
                    const c = p.color;
                    ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${pulse})`;
                    ctx.fill();
                } else if (p.type === 'digital_rain') {
                    ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.5)`;
                    ctx.fillRect(p.x, p.y, 2, p.size * 5);
                } else if (p.type === 'starfall') {
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
                    const tailX = p.x - (p.vx * p.len); // Opposite direction
                    const tailY = p.y - (p.vy * p.len);

                    const grad = ctx.createLinearGradient(p.x, p.y, tailX, tailY);
                    grad.addColorStop(0, `rgba(255, 255, 255, ${p.life})`); // Head
                    grad.addColorStop(1, `rgba(255, 255, 255, 0)`); // Tail

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
            // Theme update handled in render loop
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
