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

// --- GRID SHADER (Cruising Speed) ---
const GridFragmentShader = `
varying vec2 vUv;
uniform float uTime;

void main() {
  vec2 uv = vUv;
  // Cruising speed (reduced from 0.5)
  uv.y += uTime * 0.15; 
  
  // Grid Lines
  float gridX = step(0.98, fract(uv.x * 20.0));
  float gridY = step(0.98, fract(uv.y * 20.0));
  float grid = max(gridX, gridY);
  
  float fade = 1.0 - smoothstep(0.0, 1.0, vUv.y); 
  
  vec3 neonColor = vec3(0.8, 0.0, 1.0); 
  vec3 color = neonColor * grid * fade * 1.5; 
  vec3 baseColor = vec3(0.02, 0.0, 0.05);
  
  gl_FragColor = vec4(baseColor + color, 1.0);
}
`;

export default function RetroGrid() {
    const sunRef = useRef();
    const gridRef = useRef();
    const cityRef = useRef();

    // Stable Uniforms
    const sunUniforms = useRef({ uTime: { value: 0 } }).current;
    const gridUniforms = useRef({ uTime: { value: 0 } }).current;

    useFrame((state) => {
        const time = state.clock.getElapsedTime();
        if (sunRef.current) sunRef.current.material.uniforms.uTime.value = time;
        if (gridRef.current) gridRef.current.material.uniforms.uTime.value = time;
        // City doesn't need time unless we scroll sideways, but good to have
        // if (cityRef.current) cityRef.current.material.uniforms.uTime.value = time;
    });

    return (
        <group>
            {/* BACKGROUND */}
            <color attach="background" args={['#05000a']} />
            <fog attach="fog" args={['#05000a', 15, 60]} />

            {/* SUN */}
            <mesh ref={sunRef} position={[0, 8, -45]}>
                <planeGeometry args={[22, 22]} />
                <shaderMaterial
                    vertexShader={SunVertexShader}
                    fragmentShader={SunFragmentShader}
                    uniforms={sunUniforms}
                    transparent={true}
                />
            </mesh>

            {/* CITY SKYLINE (Between Sun and Grid) */}
            <mesh ref={cityRef} position={[0, 0, -42]}>
                <planeGeometry args={[60, 12]} />
                <shaderMaterial
                    vertexShader={CityVertexShader}
                    fragmentShader={CityFragmentShader}
                    uniforms={{ uTime: { value: 0 } }}
                    transparent={true}
                />
            </mesh>

            {/* GRID FLOOR */}
            <mesh ref={gridRef} position={[0, -4, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[100, 100]} />
                <shaderMaterial
                    vertexShader={GridVertexShader}
                    fragmentShader={GridFragmentShader}
                    uniforms={gridUniforms}
                    transparent={true}
                />
            </mesh>

            <ambientLight intensity={0.2} />
        </group>
    );
}
