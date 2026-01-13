import createGlobe from 'cobe';
import { useEffect, useRef, useState } from 'react';

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

        // --- INTERACTIVITY STATE ---
        const mouse = { x: -1000, y: -1000, vx: 0, vy: 0 };
        let lastMouse = { x: -1000, y: -1000 };

        const handleMouseMove = (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
            // Calculate Velocity for Fluid effect
            mouse.vx = (e.clientX - lastMouse.x) * 0.1;
            mouse.vy = (e.clientY - lastMouse.y) * 0.1;
            lastMouse.x = e.clientX;
            lastMouse.y = e.clientY;
        };
        window.addEventListener('mousemove', handleMouseMove);

        const getTheme = () => document.documentElement.getAttribute('data-theme') || 'void';

        const createParticles = (theme) => {
            particles = [];

            if (theme.includes('paper') || theme === 'rose') {
                // TYPE: FLUID DUST (Paper)
                const isRose = theme === 'rose';
                const count = 600;
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 2.5,
                        baseSize: Math.random() * 2.5,
                        vx: (Math.random() - 0.5) * 0.2, // Natural drift
                        vy: (Math.random() - 0.5) * 0.2,
                        friction: 0.96, // For easing momentum
                        color: isRose ? `rgba(100, 50, 50,` : `rgba(80, 60, 50,`,
                        type: 'paper_dust'
                    });
                }
            } else if (theme === 'forest' || theme === 'nord') {
                // TYPE: AVOIDING POLLEN (Forest)
                const isNord = theme === 'nord';
                const count = 500;
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 3,
                        baseSize: Math.random() * 3,
                        vx: Math.random() * 0.5 + 0.2, // Wind
                        vy: (Math.random() - 0.5) * 0.2,
                        phase: Math.random() * Math.PI * 2,
                        color: isNord ? [136, 192, 208] : [255, 255, 150],
                        type: 'forest_pollen'
                    });
                }
            } else if (theme === 'cyberpunk' || theme === 'terminal') {
                // TYPE: DIGITAL RAIN (Matrix)
                const count = 800;
                const isTerminal = theme === 'terminal';
                for (let i = 0; i < count; i++) {
                    particles.push({
                        x: Math.floor(Math.random() * width / 15) * 15,
                        y: Math.random() * height,
                        size: Math.random() * 2 + 1,
                        speed: Math.random() * 8 + 4,
                        color: isTerminal ? [48, 209, 88] : [252, 238, 12],
                        type: 'digital_rain'
                    });
                }
            } else {
                // TYPE: INTERACTIVE SPACE (Void, Dracula, etc)
                // "Expand and Contract" - "Flow"
                const STAR_COUNT = 1500;
                for (let i = 0; i < STAR_COUNT; i++) {
                    particles.push({
                        x: Math.random() * width,
                        y: Math.random() * height,
                        size: Math.random() * 2,
                        baseSize: Math.random() * 2,
                        // Slow Cosmic Drift
                        vx: (Math.random() - 0.5) * 0.1,
                        vy: (Math.random() - 0.5) * 0.1,
                        opacity: Math.random(),
                        baseOpacity: Math.random(),
                        type: 'space_star'
                    });
                }
            }
        };

        let currentTheme = getTheme();
        createParticles(currentTheme);

        const render = () => {
            const theme = getTheme();
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

            // --- SHOOTING STARS (Void Only) ---
            if (!theme.includes('paper') && theme !== 'forest' && theme !== 'nord' && !theme.includes('cyberpunk') && !theme.includes('terminal')) {
                if (Math.random() < 0.02) {
                    const startX = Math.random() * width + 200;
                    const startY = Math.random() * (height * 0.5) - 200;
                    particles.push({
                        x: startX, y: startY,
                        len: Math.random() * 80 + 50,
                        speed: Math.random() * 15 + 10, size: Math.random() * 2 + 1,
                        vx: -1, vy: 1, life: 1.0, type: 'shooting_star'
                    });
                }
            }

            // MAIN LOOP
            particles.forEach((p, index) => {

                // --- INTERACTIVE PHYSICS ---
                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const interactionRadius = 250;

                if (p.type === 'paper_dust') {
                    // FLUID MOTION: Cursor Drag
                    // If mouse is moving near particle, impart velocity
                    if (dist < interactionRadius && (Math.abs(mouse.vx) > 0.1 || Math.abs(mouse.vy) > 0.1)) {
                        const force = (interactionRadius - dist) / interactionRadius;
                        p.vx += mouse.vx * force * 0.05;
                        p.vy += mouse.vy * force * 0.05;
                    }
                    // Apply Velocity
                    p.x += p.vx;
                    p.y += p.vy;
                    // Friction (slow down to natural drift)
                    p.vx *= p.friction;
                    p.vy *= p.friction;
                    // Natural Drift Base
                    p.x += Math.sin(time + p.y * 0.01) * 0.2;

                } else if (p.type === 'forest_pollen') {
                    // REPULSION: Parting the Mist
                    if (dist < interactionRadius) {
                        const force = (interactionRadius - dist) / interactionRadius;
                        // Push away from cursor
                        p.x -= (dx / dist) * force * 2;
                        p.y -= (dy / dist) * force * 2;
                    }
                    // Normal Wind
                    p.x += p.vx;
                    p.y += p.vy + Math.sin(time * 2 + p.phase) * 0.5;

                } else if (p.type === 'space_star') {
                    // LENS EFFECT: Expand & Flow
                    // "Expand and Contract"

                    let sizeMultiplier = 1;
                    if (dist < interactionRadius) {
                        const force = (interactionRadius - dist) / interactionRadius; // 0 to 1

                        // 1. ATTRACTION (Flow)
                        // Gently pull towards cursor center
                        p.x += (dx / dist) * force * 1.5;
                        p.y += (dy / dist) * force * 1.5;

                        // 2. EXPANSION (Size Zoom)
                        // Star grows as it gets closer to cursor
                        sizeMultiplier = 1 + (force * 2); // Up to 3x size
                    }

                    p.x += p.vx;
                    p.y += p.vy;
                    p.renderSize = p.baseSize * sizeMultiplier; // Store for draw

                } else if (p.type === 'digital_rain') {
                    p.y += p.speed;
                } else if (p.type === 'shooting_star') {
                    p.x += p.vx * p.speed;
                    p.y += p.vy * p.speed;
                    p.life -= 0.02;
                }


                // --- WRAP / KILL ---
                if (p.type === 'shooting_star') {
                    if (p.life <= 0 || p.x < -200 || p.y > height + 200) {
                        particles.splice(index, 1);
                        return;
                    }
                } else {
                    // Infinite Wrap
                    if (p.x > width) p.x = 0;
                    if (p.x < 0) p.x = width;
                    if (p.y > height) p.y = 0;
                    if (p.y < 0) p.y = height;
                }

                // --- DRAW ---
                ctx.beginPath();

                if (p.type === 'paper_dust') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color + p.opacity + ')';
                    ctx.fill();
                } else if (p.type === 'forest_pollen') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    const pulse = 0.5 + Math.sin(time * 5 + p.phase) * 0.5;
                    const c = p.color;
                    ctx.fillStyle = `rgba(${c[0]}, ${c[1]}, ${c[2]}, ${pulse})`;
                    ctx.fill();
                } else if (p.type === 'space_star') {
                    // Render using the calculated Lens Size
                    ctx.arc(p.x, p.y, p.renderSize || p.size, 0, Math.PI * 2);

                    // Extra Sparkle near cursor
                    let opacity = p.opacity;
                    if (p.renderSize > p.baseSize * 1.5) {
                        opacity = Math.min(1, opacity + 0.3); // Brighten
                        ctx.shadowBlur = 10;
                        ctx.shadowColor = 'white';
                    } else {
                        ctx.shadowBlur = 0;
                    }

                    ctx.fillStyle = `rgba(200, 220, 255, ${opacity})`;
                    ctx.fill();
                    ctx.shadowBlur = 0; // Reset
                } else if (p.type === 'digital_rain') {
                    ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.5)`;
                    ctx.fillRect(p.x, p.y, 2, p.size * 5);
                } else if (p.type === 'shooting_star') {
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

        const observer = new MutationObserver(() => { });
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
                position: 'fixed', mode: 'flat', top: 0, left: 0, width: '100%', height: '100%', zIndex: -1, pointerEvents: 'none'
            }}
        />
    );
}
