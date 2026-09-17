'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera, Html } from '@react-three/drei'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import * as THREE from 'three'
import type { Grid, HeroClass, EnemyState, DmgEvent } from './types'

const CAM_OFFSET = { x: 8, y: 10, z: 8 }

function gridToWorld(row: number, col: number): [number, number] {
  return [col, row]
}

// ─── Knight ───────────────────────────────────────────────────────────────────

function KnightMesh({ flashRef }: { flashRef: React.RefObject<THREE.Mesh | null> }) {
  const STEEL = { color: '#8899bb', metalness: 0.85, roughness: 0.15 } as const
  const DARK  = { color: '#445566', metalness: 0.8,  roughness: 0.2  } as const
  const GOLD  = { color: '#c8960c', metalness: 0.7,  roughness: 0.3  } as const
  return (
    <group>
      <mesh castShadow position={[-0.14, -0.1, 0]}><cylinderGeometry args={[0.12, 0.12, 0.38, 8]} /><meshStandardMaterial {...DARK} /></mesh>
      <mesh castShadow position={[0.14, -0.1, 0]}><cylinderGeometry args={[0.12, 0.12, 0.38, 8]} /><meshStandardMaterial {...DARK} /></mesh>
      <mesh castShadow position={[0, 0.42, 0]}><boxGeometry args={[0.58, 0.7, 0.42]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh position={[0, 0.48, 0.22]}><boxGeometry args={[0.18, 0.22, 0.03]} /><meshStandardMaterial {...GOLD} /></mesh>
      <mesh castShadow position={[-0.38, 0.65, 0]} rotation={[0, 0, 0.3]}><sphereGeometry args={[0.19, 12, 12]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh castShadow position={[0.38, 0.65, 0]} rotation={[0, 0, -0.3]}><sphereGeometry args={[0.19, 12, 12]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh castShadow position={[0, 1.03, 0]}><sphereGeometry args={[0.26, 16, 16]} /><meshStandardMaterial {...STEEL} /></mesh>
      <mesh position={[0, 1.0, 0.22]}><boxGeometry args={[0.36, 0.1, 0.04]} /><meshStandardMaterial color="#111827" metalness={0.5} roughness={0.5} /></mesh>
      <mesh castShadow position={[0, 1.38, 0]}><cylinderGeometry args={[0.05, 0.03, 0.32, 8]} /><meshStandardMaterial color="#cc2222" roughness={0.8} /></mesh>
      <mesh castShadow position={[-0.52, 0.38, 0.12]} rotation={[0.1, -0.25, 0]}><boxGeometry args={[0.09, 0.58, 0.42]} /><meshStandardMaterial color="#c8960c" metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[-0.47, 0.38, 0.14]}><boxGeometry args={[0.02, 0.38, 0.07]} /><meshStandardMaterial color="#e8b020" metalness={0.6} /></mesh>
      <mesh position={[-0.47, 0.38, 0.14]}><boxGeometry args={[0.02, 0.07, 0.28]} /><meshStandardMaterial color="#e8b020" metalness={0.6} /></mesh>
      <mesh castShadow position={[0.54, 0.72, 0]} rotation={[0, 0, -0.25]}><boxGeometry args={[0.07, 0.76, 0.07]} /><meshStandardMaterial color="#ddeeff" metalness={0.95} roughness={0.05} /></mesh>
      <mesh position={[0.54, 0.48, 0]}><boxGeometry args={[0.28, 0.06, 0.07]} /><meshStandardMaterial {...GOLD} /></mesh>
      {/* Hit flash overlay */}
      <mesh ref={flashRef}>
        <sphereGeometry args={[0.95, 12, 12]} />
        <meshBasicMaterial color="#ff2222" transparent opacity={0} side={THREE.FrontSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Mage ─────────────────────────────────────────────────────────────────────

function MageMesh({ flashRef }: { flashRef: React.RefObject<THREE.Mesh | null> }) {
  const ROBE  = { color: '#2d1b69', roughness: 0.9 } as const
  const ROBE2 = { color: '#4c1d95', roughness: 0.8 } as const
  const HAT   = { color: '#1e0b5e', roughness: 0.9 } as const
  return (
    <group>
      <mesh castShadow position={[0, 0.18, 0]}><cylinderGeometry args={[0.44, 0.48, 0.5, 12]} /><meshStandardMaterial {...ROBE} /></mesh>
      <mesh castShadow position={[0, 0.55, 0]}><cylinderGeometry args={[0.32, 0.44, 0.42, 12]} /><meshStandardMaterial {...ROBE} /></mesh>
      <mesh position={[0, 0.38, 0.33]}><boxGeometry args={[0.1, 0.55, 0.02]} /><meshStandardMaterial color="#7c3aed" emissive="#6d28d9" emissiveIntensity={1.2} /></mesh>
      <mesh castShadow position={[-0.42, 0.55, 0]} rotation={[0, 0, 0.45]}><cylinderGeometry args={[0.1, 0.1, 0.38, 8]} /><meshStandardMaterial {...ROBE2} /></mesh>
      <mesh castShadow position={[0.42, 0.55, 0]} rotation={[0, 0, -0.45]}><cylinderGeometry args={[0.1, 0.1, 0.38, 8]} /><meshStandardMaterial {...ROBE2} /></mesh>
      <mesh castShadow position={[0, 1.02, 0]}><sphereGeometry args={[0.24, 16, 16]} /><meshStandardMaterial color="#f0c88a" roughness={0.8} /></mesh>
      <mesh castShadow position={[0, 0.85, 0.18]}><sphereGeometry args={[0.12, 8, 8]} /><meshStandardMaterial color="#eeeeee" roughness={1} /></mesh>
      <mesh castShadow position={[0, 1.24, 0]}><cylinderGeometry args={[0.4, 0.4, 0.06, 12]} /><meshStandardMaterial {...HAT} /></mesh>
      <mesh castShadow position={[0, 1.68, 0]}><coneGeometry args={[0.28, 0.9, 12]} /><meshStandardMaterial {...HAT} /></mesh>
      {([[0.18, 1.65, 0.2], [-0.14, 1.82, 0.12], [0.08, 2.0, -0.1]] as [number,number,number][]).map(([px, py, pz], i) => (
        <mesh key={i} position={[px, py, pz]}>
          <sphereGeometry args={[0.05, 6, 6]} />
          <meshStandardMaterial color="#fde68a" emissive="#fbbf24" emissiveIntensity={3} />
        </mesh>
      ))}
      <mesh castShadow position={[0.44, 0.5, 0]} rotation={[0.08, 0, 0.12]}><cylinderGeometry args={[0.05, 0.05, 1.15, 8]} /><meshStandardMaterial color="#5c3d00" roughness={0.85} /></mesh>
      <mesh position={[0.5, 1.18, 0.07]}><sphereGeometry args={[0.18, 16, 16]} /><meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={3.5} /></mesh>
      <pointLight position={[0.5, 1.18, 0.07]} color="#a78bfa" intensity={0.6} distance={4} />
      {/* Hit flash overlay */}
      <mesh ref={flashRef}>
        <sphereGeometry args={[0.95, 12, 12]} />
        <meshBasicMaterial color="#ff2222" transparent opacity={0} side={THREE.FrontSide} depthWrite={false} />
      </mesh>
    </group>
  )
}

// ─── Hero wrapper ─────────────────────────────────────────────────────────────

function HeroMesh({
  heroClass,
  row,
  col,
  heroHitAt,
}: {
  heroClass: HeroClass
  row: number
  col: number
  heroHitAt: number
}) {
  const groupRef  = useRef<THREE.Group>(null)
  const flashRef  = useRef<THREE.Mesh>(null)
  const [x, z]   = gridToWorld(row, col)

  // Torch light ref for smooth follow
  const lightRef = useRef<THREE.PointLight>(null)

  useFrame((state) => {
    if (!groupRef.current) return
    const t = groupRef.current.position
    t.x = THREE.MathUtils.lerp(t.x, x, 0.15)
    t.z = THREE.MathUtils.lerp(t.z, z, 0.15)
    t.y = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.05
  })

  // Hit flash effect
  useEffect(() => {
    if (!heroHitAt || !flashRef.current) return
    const mat = flashRef.current.material as THREE.MeshBasicMaterial
    mat.opacity = 0.55
    const t1 = setTimeout(() => { if (flashRef.current) (flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0.3 }, 80)
    const t2 = setTimeout(() => { if (flashRef.current) (flashRef.current.material as THREE.MeshBasicMaterial).opacity = 0 }, 240)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [heroHitAt])

  return (
    <group ref={groupRef} position={[x, 0.5, z]}>
      {heroClass === 'guerreiro'
        ? <KnightMesh flashRef={flashRef} />
        : <MageMesh flashRef={flashRef} />}
      {/* Torch light following hero */}
      <pointLight
        ref={lightRef}
        color="#ff9944"
        intensity={1.5}
        distance={7}
        position={[0, 1.2, 0]}
      />
    </group>
  )
}

// ─── Enemy ────────────────────────────────────────────────────────────────────

function GoblinMesh() {
  return (
    <>
      <mesh castShadow position={[-0.1, -0.06, 0]}><cylinderGeometry args={[0.09, 0.09, 0.28, 8]} /><meshStandardMaterial color="#4a6b00" /></mesh>
      <mesh castShadow position={[0.1, -0.06, 0]}><cylinderGeometry args={[0.09, 0.09, 0.28, 8]} /><meshStandardMaterial color="#4a6b00" /></mesh>
      <mesh castShadow position={[0, 0.32, 0]}><boxGeometry args={[0.44, 0.52, 0.34]} /><meshStandardMaterial color="#5a8000" roughness={0.8} /></mesh>
      <mesh castShadow position={[0, 0.78, 0]}><sphereGeometry args={[0.2, 14, 14]} /><meshStandardMaterial color="#3d6600" roughness={0.7} /></mesh>
      <mesh castShadow position={[-0.22, 0.8, 0]} rotation={[0, 0, 0.5]}><coneGeometry args={[0.08, 0.28, 6]} /><meshStandardMaterial color="#3d6600" /></mesh>
      <mesh castShadow position={[0.22, 0.8, 0]} rotation={[0, 0, -0.5]}><coneGeometry args={[0.08, 0.28, 6]} /><meshStandardMaterial color="#3d6600" /></mesh>
      <mesh position={[0.07, 0.8, 0.18]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={4} /></mesh>
      <mesh position={[-0.07, 0.8, 0.18]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#ff4444" emissive="#ff0000" emissiveIntensity={4} /></mesh>
      <pointLight position={[0, 0.8, 0.2]} color="#ff2200" intensity={0.35} distance={1.8} />
    </>
  )
}

function GolemMesh() {
  return (
    <>
      <mesh castShadow position={[-0.2, -0.08, 0]}><cylinderGeometry args={[0.18, 0.18, 0.42, 8]} /><meshStandardMaterial color="#2a2a2a" roughness={0.9} /></mesh>
      <mesh castShadow position={[0.2, -0.08, 0]}><cylinderGeometry args={[0.18, 0.18, 0.42, 8]} /><meshStandardMaterial color="#2a2a2a" roughness={0.9} /></mesh>
      <mesh castShadow position={[0, 0.52, 0]}><boxGeometry args={[0.85, 0.82, 0.65]} /><meshStandardMaterial color="#1c1c1c" roughness={0.95} /></mesh>
      <mesh position={[0, 0.52, 0.33]}><boxGeometry args={[0.6, 0.55, 0.02]} /><meshStandardMaterial color="#3a0000" emissive="#6b0000" emissiveIntensity={0.8} /></mesh>
      <mesh castShadow position={[0, 1.12, 0]}><sphereGeometry args={[0.32, 14, 14]} /><meshStandardMaterial color="#1a1a1a" roughness={0.95} /></mesh>
      <mesh castShadow position={[-0.24, 1.36, 0]} rotation={[0, 0, -0.7]}><coneGeometry args={[0.09, 0.46, 7]} /><meshStandardMaterial color="#111111" /></mesh>
      <mesh castShadow position={[0.24, 1.36, 0]} rotation={[0, 0, 0.7]}><coneGeometry args={[0.09, 0.46, 7]} /><meshStandardMaterial color="#111111" /></mesh>
      <mesh position={[0.1, 1.14, 0.28]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={5} /></mesh>
      <mesh position={[-0.1, 1.14, 0.28]}><sphereGeometry args={[0.07, 8, 8]} /><meshStandardMaterial color="#ff6600" emissive="#ff4400" emissiveIntensity={5} /></mesh>
      <pointLight position={[0, 1.1, 0.3]} color="#ff4400" intensity={0.7} distance={3} />
    </>
  )
}

function EnemyMesh({ enemy }: { enemy: EnemyState }) {
  const bodyRef = useRef<THREE.Group>(null)
  const [x, z]  = gridToWorld(enemy.row, enemy.col)
  const speed   = enemy.tier === 1 ? 1.2 : 0.5
  const scale   = enemy.tier === 2 ? 1.35 : 1.0
  const hpBarY  = enemy.tier === 2 ? 2.3 : 1.6
  const pct     = Math.max(0, enemy.hp / enemy.maxHp)
  const barColor = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444'

  useFrame((_, delta) => {
    if (!bodyRef.current) return
    bodyRef.current.rotation.y += delta * speed
  })

  if (!enemy.alive) return null

  return (
    <group position={[x, 0.5, z]}>
      {/* Rotating body */}
      <group ref={bodyRef} scale={[scale, scale, scale]}>
        {enemy.tier === 1 ? <GoblinMesh /> : <GolemMesh />}
      </group>

      {/* Billboard HP bar */}
      <Html distanceFactor={10} position={[0, hpBarY, 0]} center>
        <div style={{
          width: 56,
          height: 7,
          background: 'rgba(0,0,0,0.7)',
          borderRadius: 4,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.15)',
          pointerEvents: 'none',
        }}>
          <div style={{
            width: `${pct * 100}%`,
            height: '100%',
            background: barColor,
            borderRadius: 4,
            transition: 'width 0.15s ease, background 0.3s',
          }} />
        </div>
      </Html>
    </group>
  )
}

// ─── Floating damage numbers ──────────────────────────────────────────────────

function FloatingNumber({ event, onDone }: { event: DmgEvent; onDone: () => void }) {
  const groupRef = useRef<THREE.Group>(null)
  const spanRef  = useRef<HTMLSpanElement>(null)
  const born     = useRef(performance.now())
  const finished = useRef(false)
  const [x, z]   = gridToWorld(event.row, event.col)

  useFrame(() => {
    if (finished.current || !groupRef.current) return
    const t = Math.min((performance.now() - born.current) / 1300, 1)
    groupRef.current.position.y = 1.2 + t * 1.8
    if (spanRef.current) spanRef.current.style.opacity = String(Math.max(0, 1 - t * 1.4))
    if (t >= 1) {
      finished.current = true
      onDone()
    }
  })

  const color  = event.positive ? '#4ade80' : '#f87171'
  const prefix = event.positive ? '+' : '-'

  return (
    <group ref={groupRef} position={[x, 0.8, z]}>
      <Html distanceFactor={8} center>
        <span
          ref={spanRef}
          style={{
            color,
            fontWeight: 900,
            fontSize: 22,
            textShadow: '0 1px 4px #000, 0 0 10px rgba(0,0,0,0.9)',
            pointerEvents: 'none',
            userSelect: 'none',
            display: 'block',
            whiteSpace: 'nowrap',
            fontFamily: 'monospace',
          }}
        >
          {prefix}{event.amount}
        </span>
      </Html>
    </group>
  )
}

// ─── Items ────────────────────────────────────────────────────────────────────

function Chest({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.5, z]}>
      <mesh castShadow position={[0, 0.06, 0]}><boxGeometry args={[0.7, 0.52, 0.58]} /><meshStandardMaterial color="#92400e" roughness={0.7} /></mesh>
      <mesh castShadow position={[0, 0.38, 0]}><boxGeometry args={[0.7, 0.17, 0.58]} /><meshStandardMaterial color="#78350f" roughness={0.7} /></mesh>
      <mesh position={[0, 0.22, 0.3]}><boxGeometry args={[0.74, 0.06, 0.02]} /><meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.5} metalness={0.8} /></mesh>
      <mesh position={[0, 0.06, 0.3]}><boxGeometry args={[0.06, 0.52, 0.02]} /><meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={1.5} metalness={0.8} /></mesh>
      <mesh position={[0, 0.26, 0.31]}><boxGeometry args={[0.14, 0.14, 0.03]} /><meshStandardMaterial color="#fbbf24" emissive="#f59e0b" emissiveIntensity={2} metalness={0.9} /></mesh>
      <pointLight position={[0, 0.3, 0.5]} color="#f59e0b" intensity={0.5} distance={2.5} />
    </group>
  )
}

function ManaCrystal({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 1.5
    ref.current.position.y = 0.6 + Math.sin(state.clock.elapsedTime * 2.2) * 0.12
  })
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} position={[0, 0.6, 0]}>
        <octahedronGeometry args={[0.42, 0]} />
        <meshStandardMaterial color="#60a5fa" emissive="#3b82f6" emissiveIntensity={2.5} transparent opacity={0.92} />
      </mesh>
      <pointLight color="#3b82f6" intensity={1.2} distance={3.5} position={[0, 0.7, 0]} />
    </group>
  )
}

function LifeOrb({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = 0.62 + Math.sin(state.clock.elapsedTime * 2.8) * 0.12
  })
  return (
    <group position={[x, 0, z]}>
      <mesh ref={ref} position={[0, 0.62, 0]}>
        <sphereGeometry args={[0.38, 20, 20]} />
        <meshStandardMaterial color="#4ade80" emissive="#22c55e" emissiveIntensity={2.5} transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0.62, 0]}><sphereGeometry args={[0.2, 12, 12]} /><meshStandardMaterial color="#bbf7d0" emissive="#86efac" emissiveIntensity={3} /></mesh>
      <pointLight color="#22c55e" intensity={1.2} distance={3.5} position={[0, 0.7, 0]} />
    </group>
  )
}

function Trap({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh receiveShadow position={[0, 0.09, 0]}><boxGeometry args={[0.95, 0.18, 0.95]} /><meshStandardMaterial color="#dc2626" emissive="#991b1b" emissiveIntensity={0.8} /></mesh>
      <mesh castShadow position={[0, 0.42, 0]}><coneGeometry args={[0.13, 0.52, 8]} /><meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1.2} /></mesh>
      {([[-0.28, 0.28, -0.28],[-0.28, 0.28, 0.28],[0.28, 0.28, -0.28],[0.28, 0.28, 0.28]] as [number,number,number][]).map(([px, py, pz], i) => (
        <mesh key={i} castShadow position={[px, py, pz]}><coneGeometry args={[0.07, 0.32, 6]} /><meshStandardMaterial color="#ef4444" emissive="#dc2626" emissiveIntensity={1} /></mesh>
      ))}
      <pointLight color="#dc2626" intensity={0.8} distance={2.5} position={[0, 0.5, 0]} />
    </group>
  )
}

function Portal({ x, z }: { x: number; z: number }) {
  const outerRef = useRef<THREE.Mesh>(null)
  const innerRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const particleGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const count = 60
    const positions = new Float32Array(count * 3)
    const pseudo = (n: number) => { const s = Math.sin(n * 127.1) * 43758.5453; return s - Math.floor(s) }
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = 0.45 + pseudo(i) * 0.35
      positions[i * 3]     = Math.cos(angle) * r
      positions[i * 3 + 1] = (pseudo(i + 100) - 0.5) * 1.2
      positions[i * 3 + 2] = Math.sin(angle) * r
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

  useFrame((state, delta) => {
    if (outerRef.current)    outerRef.current.rotation.z += delta * 1.4
    if (innerRef.current)    innerRef.current.rotation.z -= delta * 2.2
    if (particlesRef.current) particlesRef.current.rotation.y += delta * 0.5
    const pulse = 0.9 + Math.sin(state.clock.elapsedTime * 3) * 0.1
    if (outerRef.current) outerRef.current.scale.setScalar(pulse)
  })

  return (
    <group position={[x, 0.8, z]}>
      <mesh ref={outerRef}><torusGeometry args={[0.65, 0.1, 16, 48]} /><meshStandardMaterial color="#22d3ee" emissive="#06b6d4" emissiveIntensity={3} /></mesh>
      <mesh ref={innerRef}><torusGeometry args={[0.4, 0.06, 12, 32]} /><meshStandardMaterial color="#a5f3fc" emissive="#67e8f9" emissiveIntensity={4} /></mesh>
      <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.55, 32]} />
        <meshStandardMaterial color="#0e7490" emissive="#0891b2" emissiveIntensity={1.5} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <points ref={particlesRef} geometry={particleGeom}><pointsMaterial color="#67e8f9" size={0.08} sizeAttenuation transparent opacity={0.95} /></points>
      <pointLight color="#22d3ee" intensity={2.5} distance={6} />
    </group>
  )
}

// ─── World — desert ruins ─────────────────────────────────────────────────────

function prand(x: number, z: number, seed: number): number {
  const n = Math.sin(x * 127.1 + z * 311.7 + seed * 74.3) * 43758.5453
  return n - Math.floor(n)
}

const STONE_COLORS = ['#9e7c5a', '#7d5e3a', '#b8956a', '#8c7355', '#a08060'] as const

function Rock({ x, z }: { x: number; z: number }) {
  const t   = prand(x, z, 1)
  const rot = prand(x, z, 2) * Math.PI * 2
  const ci  = Math.floor(prand(x, z, 3) * STONE_COLORS.length)
  const c   = STONE_COLORS[ci]
  const h   = 0.8 + prand(x, z, 4) * 1.2
  const sx  = 0.72 + prand(x, z, 5) * 0.38
  const sz  = 0.72 + prand(x, z, 6) * 0.38

  if (t < 0.35) {
    return (
      <group position={[x, h * 0.5, z]} rotation={[0, rot, 0]}>
        <mesh castShadow receiveShadow><boxGeometry args={[sx, h, sz]} /><meshStandardMaterial color={c} roughness={0.95} /></mesh>
        <mesh castShadow position={[sx * 0.08, h * 0.38, 0]}><boxGeometry args={[sx * 0.7, h * 0.28, sz * 0.75]} /><meshStandardMaterial color={STONE_COLORS[(ci + 1) % STONE_COLORS.length]} roughness={1} /></mesh>
      </group>
    )
  } else if (t < 0.6) {
    const h2 = 0.45 + prand(x, z, 8) * 0.75
    const c2 = STONE_COLORS[Math.floor(prand(x, z, 7) * STONE_COLORS.length)]
    return (
      <group position={[x, 0, z]} rotation={[0, rot, 0]}>
        <mesh castShadow receiveShadow position={[-0.18, h * 0.5, 0]}><boxGeometry args={[sx * 0.68, h, sz * 0.68]} /><meshStandardMaterial color={c} roughness={0.95} /></mesh>
        <mesh castShadow receiveShadow position={[0.22, h2 * 0.5, 0.1]}><boxGeometry args={[sx * 0.5, h2, sz * 0.5]} /><meshStandardMaterial color={c2} roughness={0.9} /></mesh>
      </group>
    )
  } else if (t < 0.8) {
    const colH = 0.85 + prand(x, z, 9) * 0.9
    return (
      <group position={[x, 0, z]} rotation={[0, rot, 0]}>
        <mesh castShadow receiveShadow position={[0, 0.1, 0]}><boxGeometry args={[0.82, 0.2, 0.82]} /><meshStandardMaterial color={c} roughness={0.9} /></mesh>
        <mesh castShadow receiveShadow position={[0, colH * 0.5 + 0.2, 0]}><cylinderGeometry args={[0.26, 0.3, colH, 10]} /><meshStandardMaterial color={c} roughness={0.85} /></mesh>
        <mesh castShadow position={[0.14, colH + 0.25, 0]} rotation={[0.38, 0.2, 0.18]}><boxGeometry args={[0.48, 0.18, 0.42]} /><meshStandardMaterial color={STONE_COLORS[(ci + 2) % STONE_COLORS.length]} roughness={1} /></mesh>
      </group>
    )
  } else {
    const piles: [number,number,number,number,number,number,number][] = [
      [0, 0.2, 0, 0.58, 0.38, 0.58, rot],
      [-0.2, 0.13, 0.2, 0.34, 0.26, 0.34, rot + 0.9],
      [0.22, 0.11, -0.18, 0.3, 0.22, 0.3, rot + 1.6],
      [-0.1, 0.08, -0.24, 0.26, 0.16, 0.26, rot - 0.7],
    ]
    return (
      <group position={[x, 0, z]}>
        {piles.map(([px, py, pz, bx, by, bz, br], i) => (
          <mesh key={i} castShadow receiveShadow position={[px, py, pz]} rotation={[0, br, 0]}>
            <boxGeometry args={[bx, by, bz]} />
            <meshStandardMaterial color={STONE_COLORS[(ci + i) % STONE_COLORS.length]} roughness={0.95} />
          </mesh>
        ))}
      </group>
    )
  }
}

function World({ grid }: { grid: Grid }) {
  const floorGeom = useMemo(() => new THREE.BoxGeometry(1, 0.14, 1), [])
  const { floors, walls } = useMemo(() => {
    const sandShades = ['#c49a6c', '#bf9465', '#c8a070', '#ba9060']
    const floorTiles: Array<[number, number, string]> = []
    const wallTiles:  Array<[number, number]> = []
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const [x, z] = gridToWorld(r, c)
        if (grid[r][c] === 'W') wallTiles.push([x, z])
        else floorTiles.push([x, z, sandShades[Math.floor(prand(x, z, 20) * sandShades.length)]])
      }
    }
    return { floors: floorTiles, walls: wallTiles }
  }, [grid])

  return (
    <group>
      {floors.map(([x, z, color], i) => (
        <mesh key={`f-${i}`} geometry={floorGeom} position={[x, 0.07, z]} receiveShadow>
          <meshStandardMaterial color={color} roughness={0.92} />
        </mesh>
      ))}
      {walls.map(([x, z], i) => <Rock key={`w-${i}`} x={x} z={z} />)}
    </group>
  )
}

function Items({ grid }: { grid: Grid }) {
  const items = useMemo(() => {
    const out: React.ReactNode[] = []
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const [x, z] = gridToWorld(r, c)
        const key = `${r}-${c}`
        switch (grid[r][c]) {
          case 'C': out.push(<Chest key={key} x={x} z={z} />); break
          case 'M': out.push(<ManaCrystal key={key} x={x} z={z} />); break
          case 'H': out.push(<LifeOrb key={key} x={x} z={z} />); break
          case 'T': out.push(<Trap key={key} x={x} z={z} />); break
          case 'P': out.push(<Portal key={key} x={x} z={z} />); break
        }
      }
    }
    return out
  }, [grid])
  return <>{items}</>
}

// ─── Camera rig ───────────────────────────────────────────────────────────────

function CameraRig({ heroRow, heroCol }: { heroRow: number; heroCol: number }) {
  const camRef     = useRef<THREE.PerspectiveCamera>(null)
  const target     = useMemo(() => new THREE.Vector3(), [])
  const lookTarget = useMemo(() => new THREE.Vector3(), [])
  const smoothLook = useRef(new THREE.Vector3())

  useFrame(() => {
    if (!camRef.current) return
    const [hx, hz] = gridToWorld(heroRow, heroCol)
    target.set(hx + CAM_OFFSET.x, CAM_OFFSET.y, hz + CAM_OFFSET.z)
    camRef.current.position.lerp(target, 0.08)
    lookTarget.set(hx, 0.5, hz)
    smoothLook.current.lerp(lookTarget, 0.08)
    camRef.current.lookAt(smoothLook.current)
  })

  return (
    <PerspectiveCamera ref={camRef} makeDefault fov={50} position={[CAM_OFFSET.x, CAM_OFFSET.y, CAM_OFFSET.z]} />
  )
}

// ─── Canvas export ────────────────────────────────────────────────────────────

export interface GameCanvasProps {
  grid: Grid
  heroClass: HeroClass
  heroRow: number
  heroCol: number
  enemies: EnemyState[]
  heroHitAt: number
  dmgEvents: DmgEvent[]
  onDmgEventDone: (id: number) => void
}

export default function GameCanvas({
  grid, heroClass, heroRow, heroCol, enemies, heroHitAt, dmgEvents, onDmgEventDone,
}: GameCanvasProps) {
  return (
    <Canvas shadows gl={{ antialias: true }} className="h-full w-full" dpr={[1, 2]}>
      <color attach="background" args={['#1a0e06']} />
      <fog attach="fog" args={['#1a0e06', 22, 55]} />

      <CameraRig heroRow={heroRow} heroCol={heroCol} />

      <ambientLight intensity={0.75} color="#d4c4a8" />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.6}
        color="#dce8ff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-25}
        shadow-camera-right={25}
        shadow-camera-top={25}
        shadow-camera-bottom={-25}
        shadow-camera-near={0.5}
        shadow-camera-far={70}
      />
      <directionalLight position={[-8, 5, -5]} intensity={0.4} color="#ff9944" />

      <World grid={grid} />
      <Items grid={grid} />

      {enemies.map((e) => <EnemyMesh key={e.id} enemy={e} />)}

      <HeroMesh heroClass={heroClass} row={heroRow} col={heroCol} heroHitAt={heroHitAt} />

      {dmgEvents.map((ev) => (
        <FloatingNumber key={ev.id} event={ev} onDone={() => onDmgEventDone(ev.id)} />
      ))}

      {/* Bloom — makes emissive materials glow */}
      <EffectComposer>
        <Bloom
          intensity={0.9}
          luminanceThreshold={0.55}
          luminanceSmoothing={0.3}
          mipmapBlur
        />
      </EffectComposer>
    </Canvas>
  )
}
