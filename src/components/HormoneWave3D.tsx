import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshDistortMaterial, Sphere, Float } from '@react-three/drei'
import * as THREE from 'three'

interface HormoneWaveProps {
  day: number
  mode: 'cycle' | 'pregnancy' | 'postpartum'
}

function HormoneOrbs({ day, mode }: HormoneWaveProps) {
  const estRef = useRef<THREE.Mesh>(null)
  const progRef = useRef<THREE.Mesh>(null)
  const lhRef = useRef<THREE.Mesh>(null)
  const fshRef = useRef<THREE.Mesh>(null)

  useFrame((state) => {
    const t = state.clock.getElapsedTime()
    // Simulate flow based on day
    if (estRef.current) estRef.current.rotation.x = t * 0.2
    if (progRef.current) progRef.current.rotation.y = t * 0.3
    if (lhRef.current) lhRef.current.rotation.z = t * 0.4
    if (fshRef.current) fshRef.current.rotation.x = t * 0.1
  })

  // Basic scaling logic based on cycle day (out of 28)
  const phase = (day % 28) / 28
  
  // Estrogen peaks before ovulation (around day 12-14)
  const estScale = mode === 'pregnancy' ? 1.5 : 0.8 + Math.sin(phase * Math.PI) * 0.4
  // Progesterone peaks in luteal phase (around day 21)
  const progScale = mode === 'pregnancy' ? 1.8 : 0.7 + Math.max(0, Math.sin((phase - 0.5) * Math.PI * 2)) * 0.5
  // LH spikes at ovulation
  const lhScale = mode === 'pregnancy' ? 0.5 : 0.5 + Math.exp(-Math.pow((day - 14) / 1.5, 2)) * 0.8
  // FSH minor bump early and at ovulation
  const fshScale = mode === 'pregnancy' ? 0.4 : 0.6 + Math.exp(-Math.pow((day - 14) / 2, 2)) * 0.3

  return (
    <group>
      {/* Ambient and directional lights for the glass reflection */}
      <ambientLight intensity={0.8} />
      <directionalLight position={[10, 10, 5]} intensity={2} />
      <directionalLight position={[-10, -10, -5]} intensity={0.5} />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        {/* Estrogen - Cyan/Blue */}
        <Sphere ref={estRef} args={[1, 64, 64]} position={[-1.2, 0, 0]} scale={estScale}>
          <MeshDistortMaterial color="#06b6d4" attach="material" distort={0.4} speed={2} roughness={0.2} metalness={0.8} opacity={0.8} transparent />
        </Sphere>
      </Float>

      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2}>
        {/* Progesterone - Purple */}
        <Sphere ref={progRef} args={[1, 64, 64]} position={[1.2, 0, 0]} scale={progScale}>
          <MeshDistortMaterial color="#d946ef" attach="material" distort={0.5} speed={1.5} roughness={0.1} metalness={0.5} opacity={0.8} transparent />
        </Sphere>
      </Float>

      <Float speed={3} rotationIntensity={1} floatIntensity={1.5}>
        {/* LH - Amber/Gold */}
        <Sphere ref={lhRef} args={[0.6, 32, 32]} position={[0, 1.2, 0.5]} scale={lhScale}>
          <MeshDistortMaterial color="#f59e0b" attach="material" distort={0.6} speed={3} roughness={0.3} metalness={1} opacity={0.9} transparent />
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.8}>
        {/* FSH - Rose/Red */}
        <Sphere ref={fshRef} args={[0.5, 32, 32]} position={[0, -1.2, -0.5]} scale={fshScale}>
          <MeshDistortMaterial color="#f43f5e" attach="material" distort={0.3} speed={1} roughness={0.4} metalness={0.2} opacity={0.7} transparent />
        </Sphere>
      </Float>
    </group>
  )
}

export default function HormoneWave3D({ day, mode }: HormoneWaveProps) {
  return (
    <div style={{ width: '100%', height: '300px', borderRadius: '1.5rem', overflow: 'hidden', background: 'radial-gradient(circle at center, rgba(0,0,0,0.05), transparent)' }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <HormoneOrbs day={day} mode={mode} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1} />
      </Canvas>
    </div>
  )
}
