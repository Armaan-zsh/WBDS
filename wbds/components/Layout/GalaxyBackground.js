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

        // --- GALAXY CONFIGURATION ---
        const STAR_COUNT = 3000;    // Number of stars/dust particles
        const CORE_X_DIST = 0.33;   // How wide the core is
        const CORE_Y_DIST = 0.33;   // How tall the core is
        const OUTER_DIST = 2.0;       // Max distance of stars
        const SPIRAL_ARMS = 2;        // 2 distinct arms for that "barred spiral" look
        const ARM_SPREAD = 0.5;       // How messy the arms are
        const ROTATION_SPEED = 0.0003;
        const TILT_ANGLE = 60 * (Math.PI / 180); // 60 degree tilt on X axis

        class Star {
            constructor() {
                this.reset();
            }

            reset() {
                // Polar coordinates for a spiral
                // We skew probability to be denser at the center using Math.pow(Math.random(), n)
                this.r = Math.random();

                // Spiral Math
                // angle = a + b * r
                const angleOffset = Math.random() * Math.PI * 2; // initial noise
                const armOffset = (Math.floor(Math.random() * SPIRAL_ARMS) * 2 * Math.PI) / SPIRAL_ARMS;

                // The main spiral curve: theta increases with radius
                this.theta = armOffset + (this.r * 5) + (Math.random() - 0.5) * ARM_SPREAD;

                // 3D Position (x, y, z)
                // We keep 'z' flat mostly, but with some thickness
                this.x = this.r * Math.cos(this.theta) * (width * 0.5);
                this.y = this.r * Math.sin(this.theta) * (width * 0.5);
                this.z = (Math.random() - 0.5) * (width * 0.1); // Galaxy thickness

                this.speed = 0.0005 + (1 - this.r) * 0.001; // Inner stars move faster? Actually physics says otherwise but this looks better

                // Visuals
                this.size = Math.random() * 2;

                // Color Logic: Core = Yellow/White, Outer = Blue/Purple
                const isCore = this.r < 0.2;
                if (isCore) {
                    this.rBase = 255;
                    this.gBase = 220 + Math.random() * 30; // Gold
                    this.bBase = 200 + Math.random() * 50;
                    this.alpha = 0.8;
                } else {
                    this.rBase = 100 + Math.random() * 50;
                    this.gBase = 150 + Math.random() * 100;
                    this.bBase = 255;
                    this.alpha = 0.3 + Math.random() * 0.3;
                }
            }

            update(rotation) {
                // Rotate coordinate in 2D plane first
                const cosR = Math.cos(rotation);
                const sinR = Math.sin(rotation);

                let px = this.x * cosR - this.y * sinR;
                let py = this.x * sinR + this.y * cosR;
                let pz = this.z;

                // Apply Tilt (Rotate around X axis)
                // y' = y*cos(tilt) - z*sin(tilt)
                // z' = y*sin(tilt) + z*cos(tilt)
                const cosT = Math.cos(TILT_ANGLE);
                const sinT = Math.sin(TILT_ANGLE);

                let yRot = py * cosT - pz * sinT;
                let zRot = py * sinT + pz * cosT;

                // Project 3D to 2D
                // scale = focalLength / (z + cameraDist)
                const fov = 800;
                const scale = fov / (fov + zRot);

                this.screenX = width / 2 + px * scale;
                this.screenY = height / 2 + yRot * scale;
                this.screenSize = this.size * scale;
                this.opacity = this.alpha * scale; // Fade distant stars
            }

            draw() {
                if (this.screenSize <= 0) return;

                ctx.beginPath();
                ctx.arc(this.screenX, this.screenY, this.screenSize, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${this.rBase}, ${this.gBase}, ${this.bBase}, ${this.opacity})`;
                ctx.fill();
            }
        }

        const stars = Array.from({ length: STAR_COUNT }, () => new Star());

        // --- ANIMATION LOOP ---
        let rotation = 0;
        let frameId;

        function animate() {
            // "Lighter" blend mode creates the glowing nebula effect when particles overlap
            // But we need to clear the screen with a solid color first
            ctx.globalCompositeOperation = 'source-over';
            ctx.fillStyle = '#050508'; // Deep, deep blue/black
            ctx.fillRect(0, 0, width, height);

            ctx.globalCompositeOperation = 'lighter'; // Additive blending for glow

            rotation += ROTATION_SPEED;

            stars.forEach(star => {
                star.update(rotation);
                star.draw();
            });

            // Draw a fake "Core" glow
            // const gradient = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 100);
            // gradient.addColorStop(0, 'rgba(255, 240, 200, 0.2)');
            // gradient.addColorStop(1, 'transparent');
            // ctx.fillStyle = gradient;
            // ctx.fillRect(0, 0, width, height);

            frameId = requestAnimationFrame(animate);
        }

        animate();

        const handleResize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
        };

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            cancelAnimationFrame(frameId);
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
                background: '#050508'
            }}
        />
    );
}
