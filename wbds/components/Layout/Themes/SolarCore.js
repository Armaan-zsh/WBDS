import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const VertexShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;

void main() {
  vUv = uv;
  vPosition = position;
  vec3 pos = position;
  
  // Simple vertex displacement for pulsing
  // float pulse = sin(uTime * 0.5) * 0.02;
  // pos = pos + normal * pulse;
  
  gl_Position = projectionMatrix * modelViewMatrix * vec4(pos, 1.0);
}
`;

const FragmentShader = `
varying vec2 vUv;
varying vec3 vPosition;
uniform float uTime;

// Simplex Noise (Standard implementation)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x*34.0)+1.0)*x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2  C = vec2(1.0/6.0, 1.0/3.0) ;
  const vec4  D = vec4(0.0, 0.5, 1.0, 2.0);

  // First corner
  vec3 i  = floor(v + dot(v, C.yyy) );
  vec3 x0 = v - i + dot(i, C.xxx) ;

  // Other corners
  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min( g.xyz, l.zxy );
  vec3 i2 = max( g.xyz, l.zxy );

  //   x0 = x0 - 0.0 + 0.0 * C.xxx;
  //   x1 = x0 - i1  + 1.0 * C.xxx;
  //   x2 = x0 - i2  + 2.0 * C.xxx;
  //   x3 = x0 - 1.0 + 3.0 * C.xxx;
  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy; // 2.0*C.x = 1/3 = C.y
  vec3 x3 = x0 - D.yyy;      // -1.0+3.0*C.x = -0.5 = -D.y

  // Permutations
  i = mod289(i); 
  vec4 p = permute( permute( permute( 
             i.z + vec4(0.0, i1.z, i2.z, 1.0 ))
           + i.y + vec4(0.0, i1.y, i2.y, 1.0 )) 
           + i.x + vec4(0.0, i1.x, i2.x, 1.0 ));

  // Gradients: 7x7 points over a square, mapped onto an octahedron.
  // The ring size 17*17 = 289 is close to a multiple of 49 (49*6 = 294)
  float n_ = 0.142857142857; // 1.0/7.0
  vec3  ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);  //  mod(p,7*7)

  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_ );    // mod(j,N)

  vec4 x = x_ *ns.x + ns.yyyy;
  vec4 y = y_ *ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4( x.xy, y.xy );
  vec4 b1 = vec4( x.zw, y.zw );

  //vec4 s0 = vec4(lessThan(b0,0.0))*2.0 - 1.0;
  //vec4 s1 = vec4(lessThan(b1,0.0))*2.0 - 1.0;
  vec4 s0 = floor(b0)*2.0 + 1.0;
  vec4 s1 = floor(b1)*2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw*sh.xxyy ;
  vec4 a1 = b1.xzyw + s1.xzyw*sh.zzww ;

  vec3 p0 = vec3(a0.xy,h.x);
  vec3 p1 = vec3(a0.zw,h.y);
  vec3 p2 = vec3(a1.xy,h.z);
  vec3 p3 = vec3(a1.zw,h.w);

  //Normalise gradients
  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;

  // Mix final noise value
  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1), 
                                dot(p2,x2), dot(p3,x3) ) );
}

void main() {
  // Base noise for texture
  float noiseVal = snoise(vPosition * 1.5 + uTime * 0.2);
  float noiseVal2 = snoise(vPosition * 3.0 - uTime * 0.3);
  
  float combined = (noiseVal + noiseVal2) * 0.5;

  // Color Mapping
  vec3 darkColor = vec3(0.7, 0.2, 0.0); // Dark Red
  vec3 brightColor = vec3(1.0, 0.8, 0.3); // Bright Orange/Yellow
  vec3 coreColor = vec3(1.0, 1.0, 0.8); // Almost White
  
  vec3 color = mix(darkColor, brightColor, combined + 0.5);
  // Add extra brightness at peaks
  color = mix(color, coreColor, smoothstep(0.6, 1.0, combined));

  // Edge glow (Fresnel-ish)
  vec3 viewDir = normalize(cameraPosition - vPosition);
  float fresnel = dot(normalize(vPosition), viewDir);
  fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
  
  gl_FragColor = vec4(color + (vec3(0.5, 0.2, 0.0) * fresnel * 2.0), 1.0);
}
`;

// Generate Glow Texture programmatically
function getGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128; // Low res is fine for blur
    canvas.height = 128;
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    gradient.addColorStop(0, 'rgba(255, 200, 100, 1)');
    gradient.addColorStop(0.4, 'rgba(181, 137, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    return new THREE.CanvasTexture(canvas);
}

export default function SolarCore() {
    const meshRef = useRef();
    // Memoize texture so we don't recreate it every frame
    const glowTexture = useRef();
    if (!glowTexture.current && typeof document !== 'undefined') {
        glowTexture.current = getGlowTexture();
    }

    useFrame((state) => {
        if (meshRef.current) {
            meshRef.current.material.uniforms.uTime.value = state.clock.getElapsedTime();
            meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.05;
        }
    });

    return (
        <>
            <mesh ref={meshRef} position={[0, 0, -2]}>
                <sphereGeometry args={[2.5, 64, 64]} />
                <shaderMaterial
                    vertexShader={VertexShader}
                    fragmentShader={FragmentShader}
                    uniforms={{
                        uTime: { value: 0 }
                    }}
                />
            </mesh>

            {/* Glow Halo */}
            <sprite scale={[9, 9, 1]} position={[0, 0, -2.1]}>
                {glowTexture.current && (
                    <spriteMaterial
                        map={glowTexture.current}
                        transparent={true}
                        opacity={0.6}
                        blending={THREE.AdditiveBlending}
                    />
                )}
            </sprite>
        </>
    );
}
