
import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// --- CUSTOM SHADER MATERIAL ---
// Creates a sci-fi hologram effect with fresnel rim lighting and scanlines
const HologramMaterial = {
  uniforms: {
    uTime: { value: 0 },
    uColor: { value: new THREE.Color('#001e36') }, // Dark base blue
    uGlowColor: { value: new THREE.Color('#00d2ff') }, // Neon Blue
    uActive: { value: 0.0 }, // 0 = inactive, 1 = active body part
  },
  vertexShader: `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vNormal = normalize(normalMatrix * normal);
      vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform vec3 uColor;
    uniform vec3 uGlowColor;
    uniform float uActive;
    
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
      vec3 normal = normalize(vNormal);
      vec3 viewDir = normalize(-vPosition);
      
      // Fresnel Effect (Edge Glow)
      float fresnel = dot(viewDir, normal);
      fresnel = clamp(1.0 - fresnel, 0.0, 1.0);
      fresnel = pow(fresnel, 2.0);

      // Moving Scanline
      float scan = sin(vPosition.y * 20.0 - uTime * 3.0);
      scan = smoothstep(0.9, 1.0, scan) * 0.5;

      // Active Pulse
      float pulse = sin(uTime * 4.0) * 0.5 + 0.5;
      float activeIntensity = uActive * (0.5 + 0.5 * pulse);

      // Base Color Mixing
      vec3 base = mix(uColor, uGlowColor, fresnel * 0.5);
      
      // If active, override with bright neon
      if (uActive > 0.5) {
         base = mix(base, uGlowColor, 0.6 + 0.4 * pulse);
         fresnel *= 2.0;
      }

      // Final Alpha
      float alpha = (fresnel * 0.8) + scan + (activeIntensity * 0.5) + 0.1;
      
      gl_FragColor = vec4(base + scan * uGlowColor, alpha);
    }
  `,
  transparent: true,
  side: THREE.DoubleSide,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
};

// Procedural Body Part Component
const BodyPart = ({ geometry, position, scale, rotation, activeTarget, partName }: any) => {
    const meshRef = useRef<THREE.Mesh>(null);
    
    // Determine active state
    const isActive = useMemo(() => {
        const target = activeTarget.toLowerCase();
        const name = partName.toLowerCase();
        
        if (target === 'cardio') return 1.0;
        if (target === 'chest' && (name === 'chest' || name === 'torso')) return 1.0;
        if (target === 'back' && (name === 'chest' || name === 'torso')) return 1.0;
        if (target === 'core' && name === 'hips') return 1.0;
        if (target === 'arms' && name.includes('arm')) return 1.0;
        if (target === 'shoulders' && name.includes('shoulder')) return 1.0;
        if (target === 'legs' && name.includes('leg')) return 1.0;
        
        return 0.0;
    }, [activeTarget, partName]);

    // Create unique material instance to handle uniforms per mesh
    const material = useMemo(() => {
        return new THREE.ShaderMaterial({
            ...HologramMaterial,
            uniforms: {
                ...HologramMaterial.uniforms,
                uTime: { value: 0 },
                uActive: { value: isActive },
                uColor: { value: new THREE.Color('#001e36') },
                uGlowColor: { value: new THREE.Color('#00d2ff') }
            }
        });
    }, [isActive]);

    // Animate uniforms
    useFrame((state) => {
        if (material.uniforms) {
            material.uniforms.uTime.value = state.clock.elapsedTime;
        }
    });

    return (
        <mesh 
            ref={meshRef}
            geometry={geometry}
            material={material}
            position={position}
            scale={scale}
            rotation={rotation}
        />
    );
};

const ProceduralModel = ({ activeTarget }: { activeTarget: string }) => {
    const groupRef = useRef<THREE.Group>(null);
    
    // Reuse Geometries for performance
    const headGeo = useMemo(() => new THREE.SphereGeometry(0.5, 16, 16), []);
    const torsoGeo = useMemo(() => new THREE.CylinderGeometry(0.6, 0.4, 1.5, 8), []);
    const hipsGeo = useMemo(() => new THREE.CylinderGeometry(0.4, 0.45, 0.6, 8), []);
    const limbGeo = useMemo(() => new THREE.CapsuleGeometry(0.15, 1.2, 4, 8), []);
    const jointGeo = useMemo(() => new THREE.SphereGeometry(0.25, 8, 8), []);

    useFrame(() => {
        if (groupRef.current) {
            // Idle rotation
            groupRef.current.rotation.y += 0.005;
        }
    });

    return (
        <group ref={groupRef} position={[0, -1, 0]}>
            {/* HEAD */}
            <BodyPart partName="head" geometry={headGeo} position={[0, 2.8, 0]} activeTarget={activeTarget} />
            
            {/* TORSO */}
            <BodyPart partName="chest" geometry={torsoGeo} position={[0, 1.6, 0]} activeTarget={activeTarget} />
            
            {/* HIPS/CORE */}
            <BodyPart partName="core" geometry={hipsGeo} position={[0, 0.5, 0]} activeTarget={activeTarget} />

            {/* SHOULDERS */}
            <BodyPart partName="shoulder_left" geometry={jointGeo} position={[-0.7, 2.1, 0]} activeTarget={activeTarget} />
            <BodyPart partName="shoulder_right" geometry={jointGeo} position={[0.7, 2.1, 0]} activeTarget={activeTarget} />

            {/* ARMS */}
            <BodyPart partName="arm_left" geometry={limbGeo} position={[-0.8, 1.3, 0]} activeTarget={activeTarget} />
            <BodyPart partName="arm_right" geometry={limbGeo} position={[0.8, 1.3, 0]} activeTarget={activeTarget} />

            {/* LEGS */}
            <BodyPart partName="leg_left" geometry={limbGeo} position={[-0.3, -0.6, 0]} activeTarget={activeTarget} />
            <BodyPart partName="leg_right" geometry={limbGeo} position={[0.3, -0.6, 0]} activeTarget={activeTarget} />
        </group>
    );
};

interface ThreeHologramProps {
  activeMuscle: string;
}

const ThreeHologram: React.FC<ThreeHologramProps> = ({ activeMuscle }) => {
  return (
    <div className="w-full h-full relative">
        <Canvas camera={{ position: [0, 1, 5], fov: 45 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} color="#00d2ff" />
            <ProceduralModel activeTarget={activeMuscle} />
            <Environment preset="city" />
        </Canvas>
        
        {/* Overlay UI Grid */}
        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(0,210,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(0,210,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" />
        <div className="absolute bottom-4 right-4 text-[10px] text-system-neon font-mono tracking-widest animate-pulse">
            LIVE PREVIEW // {activeMuscle.toUpperCase()}
        </div>
    </div>
  );
};

export default ThreeHologram;
