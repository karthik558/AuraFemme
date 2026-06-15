import { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Sphere, Icosahedron, Float, MeshTransmissionMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface DataCoreProps {
  className?: string;
  style?: React.CSSProperties;
}

function CoreElements() {
  const coreRef = useRef<THREE.Mesh>(null);
  const shellRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (coreRef.current) {
      coreRef.current.rotation.y = t * 0.5;
      coreRef.current.rotation.x = t * 0.2;
    }
    if (shellRef.current) {
      shellRef.current.rotation.y = -t * 0.2;
      shellRef.current.rotation.z = t * 0.1;
    }
    if (ringRef.current) {
      ringRef.current.rotation.x = Math.PI / 2 + Math.sin(t * 0.5) * 0.2;
      ringRef.current.rotation.y = t * 0.3;
    }
  });

  return (
    <group>
      <ambientLight intensity={0.5} />
      <directionalLight position={[10, 10, 10]} intensity={2} color="#ffffff" />
      <directionalLight position={[-10, -10, -10]} intensity={1} color="#c52233" />
      <pointLight position={[0, 0, 0]} intensity={5} color="#ff3366" distance={10} />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        {/* Inner Glowing Core */}
        <Sphere ref={coreRef} args={[0.8, 32, 32]}>
          <meshStandardMaterial 
            color="#ff1a40" 
            emissive="#c52233" 
            emissiveIntensity={2} 
            roughness={0.2} 
            metalness={0.8} 
          />
        </Sphere>

        {/* Outer Glass Shell */}
        <Icosahedron ref={shellRef} args={[1.5, 1]}>
          <MeshTransmissionMaterial 
            backside
            thickness={0.5}
            roughness={0.1}
            transmission={1}
            ior={1.5}
            chromaticAberration={0.05}
            color="#ffffff"
          />
        </Icosahedron>

        {/* Orbiting Data Ring */}
        <mesh ref={ringRef}>
          <torusGeometry args={[2.2, 0.02, 16, 100]} />
          <meshStandardMaterial color="#ff4d6d" emissive="#ff4d6d" emissiveIntensity={1} />
        </mesh>

        {/* Local Data Particles */}

      </Float>
    </group>
  );
}

export default function DataCore3D({ className, style }: DataCoreProps) {
  return (
    <div className={className} style={{ width: '100%', height: '100%', minHeight: '300px', overflow: 'hidden', background: 'transparent', ...style }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <CoreElements />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={0.5} />
      </Canvas>
    </div>
  );
}
