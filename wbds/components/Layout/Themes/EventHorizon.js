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

// 2D Noise
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
}

void main() {
    vec2 p = vUv - 0.5;
    float r = length(p);
    float angle = atan(p.y, p.x);

    // Subtle spiral gas texture
    float n = noise(vec2(angle * 3.0 - uTime * 0.1, r * 10.0));
    float n2 = noise(vec2(angle * 5.0 + uTime * 0.05, r * 20.0));
    float gas = (n * 0.6 + n2 * 0.4);

    // Accretion Disk
    float diskWidth = 0.15;
    float diskPos = 0.32;
    float disk = smoothstep(diskWidth, 0.0, abs(r - diskPos + gas * 0.02));
    
    // Core Black Hole (Perfect Void)
    float eventHorizon = smoothstep(0.18, 0.175, r);
    
    // Minimal Premium Palette (Teal -> Deep Blue -> Gold)
    vec3 teal = vec3(0.0, 0.6, 0.7);
    vec3 deepBlue = vec3(0.05, 0.1, 0.3);
    vec3 gold = vec3(0.9, 0.7, 0.3);
    
    vec3 color = mix(deepBlue, teal, disk * 0.7);
    color = mix(color, gold, pow(disk, 5.0) * gas * 1.5); // Subtle hot spots
    
    // Atmospheric Glow
    float glow = 0.03 / max(0.01, abs(r - 0.18));
    color += teal * glow * 0.4;
    color += gold * pow(glow, 2.0) * disk * 0.2;

    // Cutout center for the Singularity
    if (r < 0.175) {
        color = vec3(0.0); 
    }

    // Edge fade for integration
    float edgeFade = smoothstep(0.5, 0.3, r);
    color *= edgeFade;

    gl_FragColor = vec4(color, 1.0);
}
`;

export default function EventHorizon() {
    const meshRef = useRef();

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
            // Subtle slow tilt
            meshRef.current.rotation.z = Math.sin(state.clock.getElapsedTime() * 0.1) * 0.1;
        }
    });

    return (
        <mesh ref={meshRef} scale={[1, 1, 1]}>
            <planeGeometry args={[12, 12]} />
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
