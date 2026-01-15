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

const SunFragmentShader = `
varying vec2 vUv;
uniform float uTime;

void main() {
  vec2 center = vec2(0.5, 0.5);
  float dist = distance(vUv, center);
  
  // Basic Circle
  float alpha = smoothstep(0.5, 0.48, dist);
  
  // Gradient (Yellow to Pink)
  vec3 colorTop = vec3(1.0, 0.9, 0.0); // Yellow
  vec3 colorBottom = vec3(1.0, 0.0, 0.5); // Pink
  vec3 color = mix(colorBottom, colorTop, vUv.y);
  
  // Scanlines (The "Blind" effect)
  float scanline = sin(vUv.y * 50.0 - uTime * 0.2); // Moving up slowly
  float strip = smoothstep(0.0, 0.2, scanline);
  
  // Cutout scanlines only in the bottom half
  if (vUv.y < 0.5) {
      alpha *= step(0.1, abs(sin(vUv.y * 40.0))); 
  }

  // Glow
  float glow = 1.0 - smoothstep(0.0, 0.5, dist);
  color += vec3(1.0, 0.2, 0.5) * glow * 0.5;

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

const GridFragmentShader = `
varying vec2 vUv;
uniform float uTime;

void main() {
  // Moving Grid Logic
  vec2 uv = vUv;
  uv.y += uTime * 0.2; // Move forward
  
  // Zoom coordinate space
  uv *= 20.0;
  
  // Grid Lines
  float gridX = step(0.98, fract(uv.x));
  float gridY = step(0.98, fract(uv.y));
  float grid = max(gridX, gridY);
  
  // Fade into distance (vUv.y goes from 0 at bottom to 1 at top aka horizon)
  // We want to fade as we approach 1 (horizon) if plane is vertical? 
  // Wait, standard plane UVs are 0..1.
  // Let's assume we map this to a floor that fades into the distance.
  
  float fade = 1.0 - smoothstep(0.0, 1.0, vUv.y); 
  
  vec3 neonColor = vec3(1.0, 0.0, 1.0); // Magenta
  vec3 color = neonColor * grid * fade * 2.0; // Boost brightness
  
  // Base floor color (Deep purple)
  vec3 baseColor = vec3(0.05, 0.0, 0.1);
  
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
            <color attach="background" args={['#090011']} />

            {/* DISTANCE FOG */}
            <fog attach="fog" args={['#090011', 10, 60]} />

            {/* THE SUN 80s */}
            <mesh ref={sunRef} position={[0, 10, -40]}>
                <planeGeometry args={[25, 25]} />
                <shaderMaterial
                    vertexShader={SunVertexShader}
                    fragmentShader={SunFragmentShader}
                    uniforms={{ uTime: { value: 0 } }}
                    transparent={true}
                />
            </mesh>

            {/* THE INFINITE GRID FLOOR */}
            <mesh ref={gridRef} position={[0, -5, -20]} rotation={[-Math.PI / 2, 0, 0]}>
                <planeGeometry args={[100, 100]} />
                <shaderMaterial
                    vertexShader={GridVertexShader}
                    fragmentShader={GridFragmentShader}
                    uniforms={{ uTime: { value: 0 } }}
                    transparent={true}
                />
            </mesh>

            {/* EXTRA GLOW LIGHT for environment */}
            <pointLight position={[0, 10, -30]} color="#ff00ff" intensity={2} distance={100} />
            <ambientLight intensity={0.2} />
        </group>
    );
}
