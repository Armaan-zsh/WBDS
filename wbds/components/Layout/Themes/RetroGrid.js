import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// --- SUN SHADER ---
const SunVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// --- SUN SHADER (Orange/Red/Yellow Gradient) ---
const SunFragmentShader = `
varying vec2 vUv;
uniform float uTime;

void main() {
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vUv, center);
  
  // Basic Circle
  float alpha = smoothstep(0.5, 0.48, dist);
  
  // Gradient (Deep Red -> Orange -> Yellow)
  vec3 colorBottom = vec3(0.6, 0.0, 0.2); // Deep Red/Purple bottom
  vec3 colorMid = vec3(1.0, 0.3, 0.0);    // Orange
  vec3 colorTop = vec3(1.0, 0.9, 0.1);    // Bright Yellow
  
  vec3 color = mix(colorBottom, colorMid, vUv.y * 2.0);
  if (vUv.y > 0.5) {
      color = mix(colorMid, colorTop, (vUv.y - 0.5) * 2.0);
  }
  
  // Scanlines (The "Blind" effect)
  float scanline = sin(vUv.y * 60.0 - uTime * 0.2); 
  // Cutout scanlines
  if (vUv.y < 0.6) {
      float cut = smoothstep(0.2, 0.0, scanline);
      alpha *= cut;
  }

  // Glow
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  color += vec3(1.0, 0.4, 0.0) * glow * 0.6; // Orange glow

  gl_FragColor = vec4(color, alpha);
}
`;

// --- GRID SHADER ---
const GridVertexShader = `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

// --- GRID SHADER (Darker, thinner lines) ---
const GridFragmentShader = `
varying vec2 vUv;
uniform float uTime;

void main() {
  // Moving Grid Logic
  vec2 uv = vUv;
  uv.y += uTime * 0.2; // Move forward
  
  // Zoom coordinate space
  uv *= 20.0;
  
  // Grid Lines (Thinner, sharper)
  float gridX = step(0.98, fract(uv.x));
  float gridY = step(0.98, fract(uv.y));
  float grid = max(gridX, gridY);
  
  // Fade into distance
  float fade = 1.0 - smoothstep(0.0, 1.0, vUv.y); 
  
  // Neon Color (Magenta/Purple mix)
  vec3 neonColor = vec3(0.8, 0.0, 1.0); 
  vec3 color = neonColor * grid * fade * 1.5; 
  
  // Base floor color (Much darker, almost black)
  vec3 baseColor = vec3(0.02, 0.0, 0.05);
  
  gl_FragColor = vec4(baseColor + color, 1.0);
}
`;

export default function RetroGrid() {
    const sunRef = useRef();
    const gridRef = useRef();

    useFrame((state) => {
        if (sunRef.current) {
            sunRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
        }
        if (gridRef.current) {
            gridRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
        }
    });

    return (
        <group>
            {/* BACKGROUND COLOR */}
            <color attach="background" args={['#05000a']} />

            {/* DISTANCE FOG */}
            <fog attach="fog" args={['#05000a', 10, 50]} />

            {/* THE SUN 80s */}
            <mesh ref={sunRef} position={[0, 8, -40]}>
                <planeGeometry args={[22, 22]} />
                <shaderMaterial
                    vertexShader={SunVertexShader}
                    fragmentShader={SunFragmentShader}
                    uniforms={{ uTime: { value: 0 } }}
                    transparent={true}
                />
            </mesh>

            {/* THE INFINITE GRID FLOOR */}
            <mesh ref={gridRef} position={[0, -4, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[100, 100]} />
                <shaderMaterial
                    vertexShader={GridVertexShader}
                    fragmentShader={GridFragmentShader}
                    uniforms={{ uTime: { value: 0 } }}
                    transparent={true}
                />
            </mesh>

            {/* Horizon Glow Sprite (Fake Volumetrics) */}
            <sprite position={[0, 0, -45]} scale={[100, 20, 1]}>
                <spriteMaterial
                    color="#5500aa"
                    transparent={true}
                    opacity={0.3}
                    blending={THREE.AdditiveBlending}
                />
            </sprite>

            <ambientLight intensity={0.2} />
        </group>
    );
}
