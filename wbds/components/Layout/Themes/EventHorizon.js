import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VertexShader = `
varying vec2 vUv;
varying vec3 vViewPosition;

void main() {
  vUv = uv;
  vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
  vViewPosition = -mvPosition.xyz;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FragmentShader = `
varying vec2 vUv;
uniform float uTime;

void main() {
    // Center coords
    vec2 p = vUv - 0.5;
    float r = length(p);
    float angle = atan(p.y, p.x);

    // Accretion Disk
    float spiral = sin(angle * 10.0 + uTime * 2.0 + 10.0 * r);
    float disk = smoothstep(0.4, 0.0, abs(r - 0.35 + spiral * 0.02));
    
    // Core Black Hole
    float eventHorizon = smoothstep(0.15, 0.14, r);
    float darkness = 1.0 - eventHorizon;
    
    // Colors
    vec3 color = mix(vec3(0.0), vec3(0.5, 0.3, 0.8), disk); // Violet disk
    color += vec3(0.8, 0.6, 1.0) * pow(disk, 3.0); // Bright highlights
    
    // Lensing / Glow
    float glow = 0.05 / abs(r - 0.15);
    color += vec3(0.2, 0.4, 1.0) * glow * 0.5;

    // Cutout center
    if (r < 0.14) {
        color = vec3(0.0); 
    }

    gl_FragColor = vec4(color, 1.0);
}
`;

export default function EventHorizon() {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <mesh ref={meshRef} scale={[1, 1, 1]}>
            <planeGeometry args={[10, 10]} />
            <shaderMaterial
                transparent={true}
                vertexShader={VertexShader}
                fragmentShader={FragmentShader}
                uniforms={{
                    uTime: { value: 0 }
                }}
                side={THREE.DoubleSide}
            />
        </mesh>
    );
}
