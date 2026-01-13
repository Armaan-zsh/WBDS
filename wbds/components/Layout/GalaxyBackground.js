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

            // === PAPER / ROSE - Dust ===
            if (theme.includes('paper') || theme === 'rose') {
                const isRose = theme === 'rose';
                for (let i = 0; i < 600; i++) {
                    particles.push({
                        x: Math.random() * width, y: Math.random() * height,
                        size: Math.random() * 2.5, vx: (Math.random() - 0.5) * 0.2, vy: (Math.random() - 0.5) * 0.2,
                        friction: 0.96, color: isRose ? `rgba(100, 50, 50,` : `rgba(80, 60, 50,`,
                        opacity: Math.random() * 0.5 + 0.2, type: 'paper_dust'
                    });
                }
            }
            // === FOREST / NORD - Pollen ===
            else if (theme === 'forest' || theme === 'nord') {
                const isNord = theme === 'nord';
                for (let i = 0; i < 500; i++) {
                    particles.push({
                        x: Math.random() * width, y: Math.random() * height,
                        size: Math.random() * 3, vx: Math.random() * 0.5 + 0.2, vy: (Math.random() - 0.5) * 0.2,
                        phase: Math.random() * Math.PI * 2, color: isNord ? [136, 192, 208] : [255, 255, 150],
                        type: 'forest_pollen'
                    });
                }
            }
            // === CYBERPUNK / TERMINAL - Matrix Rain ===
            else if (theme === 'cyberpunk' || theme === 'terminal') {
                const isTerminal = theme === 'terminal';
                for (let i = 0; i < 800; i++) {
                    particles.push({
                        x: Math.floor(Math.random() * width / 15) * 15, y: Math.random() * height,
                        size: Math.random() * 2 + 1, speed: Math.random() * 8 + 4,
                        color: isTerminal ? [48, 209, 88] : [252, 238, 12], type: 'digital_rain'
                    });
                }
            }
            // === VOID - Black Hole (Orbiting Stars) ===
            else if (theme === 'void') {
                for (let i = 0; i < 1200; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * Math.max(width, height);
                    particles.push({
                        x: width / 2 + Math.cos(angle) * radius, y: height / 2 + Math.sin(angle) * radius,
                        angle: angle, radius: radius, orbitSpeed: 0.0005 + Math.random() * 0.001,
                        size: Math.random() * 2 + 0.5, opacity: Math.random(), type: 'black_hole'
                    });
                }
            }
            // === MIDNIGHT - Aurora Borealis ===
            else if (theme === 'midnight') {
                for (let i = 0; i < 300; i++) {
                    particles.push({
                        x: Math.random() * width, y: height * 0.2 + Math.random() * height * 0.4,
                        width: Math.random() * 100 + 50, height: Math.random() * 200 + 100,
                        phase: Math.random() * Math.PI * 2, speed: Math.random() * 0.02,
                        hue: 180 + Math.random() * 60, type: 'aurora'
                    });
                }
            }
            // === SYNTHWAVE - Retro Grid ===
            else if (theme === 'synthwave') {
                // Horizontal lines
                for (let i = 0; i < 30; i++) {
                    particles.push({ y: height * 0.5 + i * 20, type: 'grid_line_h' });
                }
                // Vertical lines
                for (let i = 0; i < 40; i++) {
                    particles.push({ x: i * (width / 40), type: 'grid_line_v' });
                }
                // Sun
                particles.push({ type: 'synthwave_sun' });
            }
            // === RED DRAGON - Fire ===
            else if (theme === 'red-dragon') {
                for (let i = 0; i < 800; i++) {
                    particles.push({
                        x: Math.random() * width, y: height + Math.random() * 100,
                        size: Math.random() * 4 + 2, speed: Math.random() * 3 + 1,
                        life: 1, hue: Math.random() * 40, type: 'fire'
                    });
                }
            }
            // === COFFEE - Steam ===
            else if (theme === 'coffee') {
                for (let i = 0; i < 400; i++) {
                    particles.push({
                        x: Math.random() * width, y: height + Math.random() * 50,
                        size: Math.random() * 20 + 10, speed: Math.random() * 0.5 + 0.2,
                        opacity: Math.random() * 0.3, wobble: Math.random() * Math.PI * 2, type: 'steam'
                    });
                }
            }
            // === DRACULA - Blood Mist ===
            else if (theme === 'dracula') {
                for (let i = 0; i < 600; i++) {
                    particles.push({
                        x: Math.random() * width, y: Math.random() * height,
                        size: Math.random() * 30 + 10, vx: (Math.random() - 0.5) * 0.3, vy: (Math.random() - 0.5) * 0.3,
                        opacity: Math.random() * 0.15, type: 'blood_mist'
                    });
                }
            }
            // === 8008 - Neon Bubbles ===
            else if (theme === '8008') {
                for (let i = 0; i < 100; i++) {
                    particles.push({
                        x: Math.random() * width, y: Math.random() * height,
                        size: Math.random() * 30 + 10, vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.5 - 0.2,
                        hue: Math.random() > 0.5 ? 330 : 180, opacity: 0.4, type: 'neon_bubble'
                    });
                }
            }
            // === CARBON - Ember Sparks ===
            else if (theme === 'carbon') {
                for (let i = 0; i < 500; i++) {
                    particles.push({
                        x: Math.random() * width, y: Math.random() * height,
                        size: Math.random() * 3 + 1, vx: (Math.random() - 0.5) * 0.5, vy: -Math.random() * 0.8,
                        life: Math.random(), type: 'ember'
                    });
                }
            }
            // === SERIKA - Gold Dust ===
            else if (theme === 'serika') {
                for (let i = 0; i < 800; i++) {
                    particles.push({
                        x: Math.random() * width, y: Math.random() * height,
                        size: Math.random() * 2 + 0.5, vx: (Math.random() - 0.5) * 0.2, vy: Math.random() * 0.3,
                        shimmer: Math.random() * Math.PI * 2, type: 'gold_dust'
                    });
                }
            }
            // === SOLARIZED - Solar Flares ===
            else if (theme === 'solarized') {
                for (let i = 0; i < 600; i++) {
                    const angle = Math.random() * Math.PI * 2;
                    const dist = Math.random() * 300 + 100;
                    particles.push({
                        x: width / 2 + Math.cos(angle) * dist, y: height / 2 + Math.sin(angle) * dist,
                        angle: angle, dist: dist, speed: Math.random() * 0.02,
                        size: Math.random() * 3 + 1, type: 'solar_flare'
                    });
                }
                particles.push({ type: 'sun_core' });
            }
            // === DEFAULT FALLBACK - Stars ===
            else {
                for (let i = 0; i < 1200; i++) {
                    particles.push({
                        x: Math.random() * width, y: Math.random() * height,
                        size: Math.random() * 2, baseSize: Math.random() * 2,
                        vx: (Math.random() - 0.5) * 0.1, vy: (Math.random() - 0.5) * 0.1,
                        opacity: Math.random(), type: 'space_star'
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

                const dx = mouse.x - p.x;
                const dy = mouse.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const interactionRadius = 250;

                // === PHYSICS PER TYPE ===

                if (p.type === 'paper_dust') {
                    if (dist < interactionRadius && (Math.abs(mouse.vx) > 0.1 || Math.abs(mouse.vy) > 0.1)) {
                        const force = (interactionRadius - dist) / interactionRadius;
                        p.vx += mouse.vx * force * 0.05; p.vy += mouse.vy * force * 0.05;
                    }
                    p.x += p.vx; p.y += p.vy;
                    p.vx *= p.friction; p.vy *= p.friction;
                    p.x += Math.sin(time + p.y * 0.01) * 0.2;
                }
                else if (p.type === 'forest_pollen') {
                    if (dist < interactionRadius) {
                        const force = (interactionRadius - dist) / interactionRadius;
                        p.x -= (dx / dist) * force * 2; p.y -= (dy / dist) * force * 2;
                    }
                    p.x += p.vx; p.y += p.vy + Math.sin(time * 2 + p.phase) * 0.5;
                }
                else if (p.type === 'digital_rain') {
                    p.y += p.speed;
                    if (p.y > height) p.y = -10;
                }
                else if (p.type === 'black_hole') {
                    // Orbit around center, get pulled towards cursor
                    p.angle += p.orbitSpeed * (1 + (dist < 300 ? (300 - dist) / 100 : 0));
                    const centerX = width / 2 + (dist < 400 ? dx * 0.1 : 0);
                    const centerY = height / 2 + (dist < 400 ? dy * 0.1 : 0);
                    p.x = centerX + Math.cos(p.angle) * p.radius;
                    p.y = centerY + Math.sin(p.angle) * p.radius;
                }
                else if (p.type === 'aurora') {
                    p.phase += p.speed;
                    p.x += Math.sin(time * 0.5 + p.phase) * 0.5;
                }
                else if (p.type === 'fire') {
                    p.y -= p.speed;
                    p.x += Math.sin(time * 10 + p.y * 0.1) * 2;
                    p.life -= 0.01;
                    if (p.life <= 0 || p.y < 0) { p.y = height + 20; p.life = 1; p.x = Math.random() * width; }
                }
                else if (p.type === 'steam') {
                    p.y -= p.speed;
                    p.x += Math.sin(time + p.wobble) * 0.5;
                    p.opacity -= 0.001;
                    if (p.y < height * 0.3 || p.opacity <= 0) { p.y = height + 20; p.opacity = 0.3; }
                }
                else if (p.type === 'blood_mist') {
                    p.x += p.vx + Math.sin(time + p.y * 0.01) * 0.3;
                    p.y += p.vy;
                    if (dist < interactionRadius) {
                        p.x += (dx / dist) * 0.5; p.y += (dy / dist) * 0.5; // Swirl towards
                    }
                }
                else if (p.type === 'neon_bubble') {
                    p.x += p.vx; p.y += p.vy;
                    if (dist < p.size + 50) { p.y = height + 50; p.x = Math.random() * width; } // Pop!
                }
                else if (p.type === 'ember') {
                    p.x += p.vx; p.y += p.vy;
                    p.life -= 0.005;
                    if (dist < interactionRadius) { p.vx += (Math.random() - 0.5) * 0.5; p.vy -= 0.5; }
                    if (p.life <= 0 || p.y < 0) { p.y = height; p.life = 1; p.x = Math.random() * width; }
                }
                else if (p.type === 'gold_dust') {
                    p.x += p.vx; p.y += p.vy;
                    p.shimmer += 0.1;
                    if (dist < interactionRadius) { p.x += dx * 0.01; p.y += dy * 0.01; } // Trail cursor
                }
                else if (p.type === 'solar_flare') {
                    p.angle += p.speed;
                    p.x = width / 2 + Math.cos(p.angle) * p.dist;
                    p.y = height / 2 + Math.sin(p.angle) * p.dist;
                }
                else if (p.type === 'space_star') {
                    let sizeMultiplier = 1;
                    if (dist < interactionRadius) {
                        const force = (interactionRadius - dist) / interactionRadius;
                        p.x += (dx / dist) * force * 1.5; p.y += (dy / dist) * force * 1.5;
                        sizeMultiplier = 1 + (force * 2);
                    }
                    p.x += p.vx; p.y += p.vy;
                    p.renderSize = p.baseSize * sizeMultiplier;
                }
                else if (p.type === 'shooting_star') {
                    p.x += p.vx * p.speed; p.y += p.vy * p.speed; p.life -= 0.02;
                }

                // === WRAP / KILL ===
                if (p.type === 'shooting_star') {
                    if (p.life <= 0 || p.x < -200 || p.y > height + 200) { particles.splice(index, 1); return; }
                } else if (!['fire', 'steam', 'ember', 'aurora', 'grid_line_h', 'grid_line_v', 'synthwave_sun', 'sun_core'].includes(p.type)) {
                    if (p.x > width) p.x = 0; if (p.x < 0) p.x = width;
                    if (p.y > height) p.y = 0; if (p.y < 0) p.y = height;
                }

                // === DRAW ===
                ctx.beginPath();

                if (p.type === 'paper_dust') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = p.color + p.opacity + ')'; ctx.fill();
                }
                else if (p.type === 'forest_pollen') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    const pulse = 0.5 + Math.sin(time * 5 + p.phase) * 0.5;
                    ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, ${pulse})`; ctx.fill();
                }
                else if (p.type === 'digital_rain') {
                    ctx.fillStyle = `rgba(${p.color[0]}, ${p.color[1]}, ${p.color[2]}, 0.5)`;
                    ctx.fillRect(p.x, p.y, 2, p.size * 5);
                }
                else if (p.type === 'black_hole') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(200, 220, 255, ${p.opacity})`; ctx.fill();
                }
                else if (p.type === 'aurora') {
                    const grad = ctx.createLinearGradient(p.x, p.y, p.x, p.y + p.height);
                    grad.addColorStop(0, `hsla(${p.hue}, 80%, 60%, 0)`);
                    grad.addColorStop(0.5, `hsla(${p.hue}, 80%, 60%, 0.15)`);
                    grad.addColorStop(1, `hsla(${p.hue}, 80%, 60%, 0)`);
                    ctx.fillStyle = grad;
                    ctx.fillRect(p.x, p.y, p.width, p.height);
                }
                else if (p.type === 'grid_line_h') {
                    ctx.strokeStyle = 'rgba(255, 113, 206, 0.3)';
                    ctx.moveTo(0, p.y); ctx.lineTo(width, p.y); ctx.stroke();
                }
                else if (p.type === 'grid_line_v') {
                    ctx.strokeStyle = 'rgba(1, 205, 254, 0.2)';
                    ctx.moveTo(p.x, height * 0.5); ctx.lineTo(width / 2 + (p.x - width / 2) * 5, height); ctx.stroke();
                }
                else if (p.type === 'synthwave_sun') {
                    const sunGrad = ctx.createRadialGradient(width / 2, height * 0.5, 0, width / 2, height * 0.5, 150);
                    sunGrad.addColorStop(0, '#ff71ce'); sunGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = sunGrad; ctx.arc(width / 2, height * 0.5, 150, 0, Math.PI * 2); ctx.fill();
                }
                else if (p.type === 'fire') {
                    const fireGrad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size);
                    fireGrad.addColorStop(0, `hsla(${p.hue}, 100%, 60%, ${p.life})`);
                    fireGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = fireGrad; ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                }
                else if (p.type === 'steam') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(200, 180, 160, ${p.opacity})`; ctx.fill();
                }
                else if (p.type === 'blood_mist') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(150, 40, 60, ${p.opacity})`; ctx.fill();
                }
                else if (p.type === 'neon_bubble') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.strokeStyle = `hsla(${p.hue}, 100%, 70%, ${p.opacity})`; ctx.lineWidth = 2; ctx.stroke();
                }
                else if (p.type === 'ember') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(255, ${100 + p.life * 100}, 50, ${p.life})`; ctx.fill();
                }
                else if (p.type === 'gold_dust') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    const shimmer = 0.3 + Math.sin(p.shimmer) * 0.3;
                    ctx.fillStyle = `rgba(226, 183, 20, ${shimmer})`; ctx.fill();
                }
                else if (p.type === 'solar_flare') {
                    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(181, 137, 0, 0.6)`; ctx.fill();
                }
                else if (p.type === 'sun_core') {
                    const coreGrad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, 100);
                    coreGrad.addColorStop(0, '#b58900'); coreGrad.addColorStop(1, 'transparent');
                    ctx.fillStyle = coreGrad; ctx.arc(width / 2, height / 2, 100, 0, Math.PI * 2); ctx.fill();
                }
                else if (p.type === 'space_star') {
                    ctx.arc(p.x, p.y, p.renderSize || p.size, 0, Math.PI * 2);
                    let opacity = p.opacity;
                    if (p.renderSize > p.baseSize * 1.5) { opacity = Math.min(1, opacity + 0.3); ctx.shadowBlur = 10; ctx.shadowColor = 'white'; }
                    else { ctx.shadowBlur = 0; }
                    ctx.fillStyle = `rgba(200, 220, 255, ${opacity})`; ctx.fill(); ctx.shadowBlur = 0;
                }
                else if (p.type === 'shooting_star') {
                    const tailX = p.x - (p.vx * p.len); const tailY = p.y - (p.vy * p.len);
                    const grad = ctx.createLinearGradient(p.x, p.y, tailX, tailY);
                    grad.addColorStop(0, `rgba(255, 255, 255, ${p.life})`); grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
                    ctx.strokeStyle = grad; ctx.lineWidth = p.size; ctx.lineCap = 'round';
                    ctx.moveTo(p.x, p.y); ctx.lineTo(tailX, tailY); ctx.stroke();
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
