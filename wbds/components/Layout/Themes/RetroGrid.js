import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export default function RetroGrid() {
    const gridRef = useRef();
    const planeRef = useRef();

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (gridRef.current) {
            // Move the grid texture or position to simulate continuous movement
            gridRef.current.position.z = (time * 10) % 20; // Loop every 20 units
        }
    });

    return (
        <group>
            {/* The Sun */}
            <mesh position={[0, 10, -50]}>
                <circleGeometry args={[15, 64]} />
                <meshBasicMaterial color="#ff00ff">
                </meshBasicMaterial>
            </mesh>

            {/* The Infinite Grid */}
            <gridHelper
                ref={gridRef}
                args={[400, 100, 0xff00ff, 0x00ffff]} // Size, Divisions, CenterColor, GridColor
                position={[0, -5, -50]}
                rotation={[0, 0, 0]}
            />

            {/* Fog for the Retro Fade */}
            <fog attach="fog" args={['#1a0b2e', 10, 90]} />
        </group>
    );
}

// Internal reusable sun texture generator if needed later
