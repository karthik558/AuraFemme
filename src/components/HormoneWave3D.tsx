import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, MeshDistortMaterial, Sphere, Float, Html } from '@react-three/drei'
import * as THREE from 'three'

interface HormoneWaveProps {
  day: number
  mode: 'cycle' | 'pregnancy' | 'postpartum'
  cycleLength?: number
  ovulationDay?: number
  className?: string
  style?: React.CSSProperties
}

const labelStyle = {
  background: 'rgba(0, 0, 0, 0.4)',
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  border: '1px solid rgba(255, 255, 255, 0.15)',
  borderRadius: '12px',
  padding: '0.5rem 0.75rem',
  color: '#fff',
  fontSize: '0.75rem',
  fontWeight: 600,
  textAlign: 'center' as const,
  pointerEvents: 'none' as const,
  whiteSpace: 'nowrap' as const,
  boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
  transform: 'translate3d(0, -40px, 0)'
}

function HormoneOrbs({ day, mode, cycleLength = 28, ovulationDay = 14 }: HormoneWaveProps) {
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

  // Dynamic scaling logic based on actual cycle length
  // Estrogen peaks before ovulation
  const estScale = mode === 'pregnancy' ? 1.5 : 0.8 + Math.max(0, Math.sin((day / ovulationDay) * Math.PI)) * 0.4
  // Progesterone peaks in luteal phase
  const progScale = mode === 'pregnancy' ? 1.8 : day > ovulationDay ? 0.7 + Math.sin(((day - ovulationDay) / (cycleLength - ovulationDay)) * Math.PI) * 0.5 : 0.7
  // LH spikes at ovulation
  const lhScale = mode === 'pregnancy' ? 0.5 : 0.5 + Math.exp(-Math.pow((day - ovulationDay) / 1.5, 2)) * 0.8
  // FSH minor bump early and at ovulation
  const fshScale = mode === 'pregnancy' ? 0.4 : 0.6 + Math.exp(-Math.pow((day - ovulationDay) / 2, 2)) * 0.3

  return (
    <group>
      {/* Intense studio lighting for vibrant glass effect */}
      <ambientLight intensity={1.5} />
      <directionalLight position={[10, 20, 10]} intensity={3} color="#ffffff" />
      <directionalLight position={[-10, -10, -5]} intensity={1} color="#38bdf8" />
      <pointLight position={[0, 0, 5]} intensity={2} color="#fbbf24" />

      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        {/* Estrogen - Cyan/Blue */}
        <Sphere ref={estRef} args={[1, 64, 64]} position={[-1.2, 0, 0]} scale={estScale}>
          <MeshDistortMaterial color="#0ea5e9" attach="material" distort={0.5} speed={2.5} roughness={0.1} metalness={0.9} opacity={0.85} transparent />
          <Html center zIndexRange={[100, 0]}>
            <div style={labelStyle}>
              <div style={{ color: '#bae6fd', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estrogen</div>
              <div style={{ fontSize: '1.1rem' }}>{Math.round((estScale / 1.5) * 100)}%</div>
            </div>
          </Html>
        </Sphere>
      </Float>

      <Float speed={2.5} rotationIntensity={0.6} floatIntensity={1.2}>
        {/* Progesterone - Purple */}
        <Sphere ref={progRef} args={[1, 64, 64]} position={[1.2, 0, 0]} scale={progScale}>
          <MeshDistortMaterial color="#c026d3" attach="material" distort={0.6} speed={2} roughness={0.05} metalness={0.7} opacity={0.85} transparent />
          <Html center zIndexRange={[100, 0]}>
            <div style={labelStyle}>
              <div style={{ color: '#f5d0fe', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Progesterone</div>
              <div style={{ fontSize: '1.1rem' }}>{Math.round((progScale / 1.8) * 100)}%</div>
            </div>
          </Html>
        </Sphere>
      </Float>

      <Float speed={3} rotationIntensity={1} floatIntensity={1.5}>
        {/* LH - Amber/Gold */}
        <Sphere ref={lhRef} args={[0.6, 32, 32]} position={[0, 1.2, 0.5]} scale={lhScale}>
          <MeshDistortMaterial color="#f59e0b" attach="material" distort={0.7} speed={3.5} roughness={0.2} metalness={1} opacity={0.95} transparent emissive="#b45309" emissiveIntensity={0.5} />
          <Html center zIndexRange={[100, 0]}>
            <div style={labelStyle}>
              <div style={{ color: '#fde68a', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>LH Spike</div>
              <div style={{ fontSize: '1.1rem' }}>{Math.round((lhScale / 1.3) * 100)}%</div>
            </div>
          </Html>
        </Sphere>
      </Float>

      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.8}>
        {/* FSH - Rose/Red */}
        <Sphere ref={fshRef} args={[0.5, 32, 32]} position={[0, -1.2, -0.5]} scale={fshScale}>
          <MeshDistortMaterial color="#e11d48" attach="material" distort={0.4} speed={1.5} roughness={0.3} metalness={0.4} opacity={0.8} transparent />
          <Html center zIndexRange={[100, 0]}>
            <div style={labelStyle}>
              <div style={{ color: '#fecdd3', fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>FSH Level</div>
              <div style={{ fontSize: '1.1rem' }}>{Math.round((fshScale / 0.9) * 100)}%</div>
            </div>
          </Html>
        </Sphere>
      </Float>
    </group>
  )
}

export default function HormoneWave3D({ day, mode, cycleLength, ovulationDay, className, style }: HormoneWaveProps) {
  return (
    <div className={className} style={{ width: '100%', height: '300px', overflow: 'hidden', background: 'transparent', ...style }}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
        <HormoneOrbs day={day} mode={mode} cycleLength={cycleLength} ovulationDay={ovulationDay} />
        <OrbitControls enableZoom={false} autoRotate autoRotateSpeed={1.5} />
      </Canvas>
    </div>
  )
}
