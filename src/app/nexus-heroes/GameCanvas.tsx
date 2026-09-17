'use client'

import React, { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'
import type { Grid, HeroClass, EnemyState } from './types'

// Camera offset relative to the hero (isometric-ish, ~45deg above)
const CAM_OFFSET = { x: 8, y: 10, z: 8 }

// Convert grid coordinates -> 3D world position.
// x = col, z = row (y up)
function gridToWorld(row: number, col: number): [number, number] {
  return [col, row]
}

// ─── Hero (Guerreiro / Mago) ────────────────────────────────────────────────

interface HeroMeshProps {
  heroClass: HeroClass
  row: number
  col: number
}

function HeroMesh({ heroClass, row, col }: HeroMeshProps) {
  const groupRef = useRef<THREE.Group>(null)
  const [x, z] = gridToWorld(row, col)

  useFrame((state) => {
    if (!groupRef.current) return
    // Smoothly move toward the target cell
    const t = groupRef.current.position
    t.x = THREE.MathUtils.lerp(t.x, x, 0.15)
    t.z = THREE.MathUtils.lerp(t.z, z, 0.15)
    // Gentle bob
    const bob = Math.sin(state.clock.elapsedTime * 2) * 0.05
    t.y = 0.5 + bob
  })

  const bodyColor = heroClass === 'guerreiro' ? '#c0a060' : '#4040a0'

  return (
    <group ref={groupRef} position={[x, 0.5, z]}>
      {/* Body */}
      <mesh castShadow position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.3, 0.35, 0.8, 16]} />
        <meshStandardMaterial color={bodyColor} />
      </mesh>
      {/* Head */}
      <mesh castShadow position={[0, 0.95, 0]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#f0c88a" />
      </mesh>

      {heroClass === 'guerreiro' ? (
        // Sword in right hand
        <mesh castShadow position={[0.4, 0.5, 0]} rotation={[0, 0, -Math.PI / 5]}>
          <boxGeometry args={[0.05, 0.6, 0.05]} />
          <meshStandardMaterial color="#aaaacc" metalness={0.7} roughness={0.3} />
        </mesh>
      ) : (
        <>
          {/* Wizard hat */}
          <mesh castShadow position={[0, 1.35, 0]}>
            <coneGeometry args={[0.28, 0.5, 16]} />
            <meshStandardMaterial color="#2020a0" />
          </mesh>
          {/* Staff */}
          <mesh castShadow position={[0.4, 0.55, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.9, 8]} />
            <meshStandardMaterial color="#806000" />
          </mesh>
          {/* Glowing orb on staff */}
          <mesh position={[0.4, 1.05, 0]}>
            <sphereGeometry args={[0.1, 12, 12]} />
            <meshStandardMaterial
              color="#7dd3fc"
              emissive="#38bdf8"
              emissiveIntensity={1.5}
            />
          </mesh>
        </>
      )}
    </group>
  )
}

// ─── Enemy ───────────────────────────────────────────────────────────────────

function EnemyMesh({ enemy }: { enemy: EnemyState }) {
  const groupRef = useRef<THREE.Group>(null)
  const [x, z] = gridToWorld(enemy.row, enemy.col)

  useFrame((_, delta) => {
    if (!groupRef.current) return
    groupRef.current.rotation.y += delta * 0.8
  })

  if (!enemy.alive) return null

  return (
    <group ref={groupRef} position={[x, 0.5, z]}>
      <mesh castShadow position={[0, 0.375, 0]}>
        <cylinderGeometry args={[0.28, 0.32, 0.75, 16]} />
        <meshStandardMaterial color="#8b0000" />
      </mesh>
      <mesh castShadow position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.22, 16, 16]} />
        <meshStandardMaterial color="#5a0000" />
      </mesh>
      {/* Eyes */}
      <mesh position={[0.09, 0.92, 0.18]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ffee55" emissive="#ffcc00" emissiveIntensity={2} />
      </mesh>
      <mesh position={[-0.09, 0.92, 0.18]}>
        <sphereGeometry args={[0.035, 8, 8]} />
        <meshStandardMaterial color="#ffee55" emissive="#ffcc00" emissiveIntensity={2} />
      </mesh>
    </group>
  )
}

// ─── Items ──────────────────────────────────────────────────────────────────

function Chest({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0.5, z]}>
      <mesh castShadow position={[0, 0.05, 0]}>
        <boxGeometry args={[0.6, 0.45, 0.5]} />
        <meshStandardMaterial color="#b45309" />
      </mesh>
      <mesh castShadow position={[0, 0.32, 0]}>
        <boxGeometry args={[0.6, 0.15, 0.5]} />
        <meshStandardMaterial color="#92400e" />
      </mesh>
    </group>
  )
}

function ManaCrystal({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 1.2
    ref.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 2) * 0.08
  })
  return (
    <mesh ref={ref} position={[x, 0.55, z]}>
      <octahedronGeometry args={[0.3, 0]} />
      <meshStandardMaterial
        color="#3b82f6"
        emissive="#1d4ed8"
        emissiveIntensity={0.8}
      />
    </mesh>
  )
}

function LifeOrb({ x, z }: { x: number; z: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * 2.5) * 0.08
  })
  return (
    <mesh ref={ref} position={[x, 0.55, z]}>
      <sphereGeometry args={[0.28, 16, 16]} />
      <meshStandardMaterial
        color="#22c55e"
        emissive="#15803d"
        emissiveIntensity={0.8}
      />
    </mesh>
  )
}

function Trap({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh receiveShadow position={[0, 0.08, 0]}>
        <boxGeometry args={[1, 0.15, 1]} />
        <meshStandardMaterial color="#dc2626" />
      </mesh>
      <mesh castShadow position={[0, 0.35, 0]}>
        <coneGeometry args={[0.12, 0.35, 8]} />
        <meshStandardMaterial color="#dc2626" emissive="#7f1d1d" emissiveIntensity={0.4} />
      </mesh>
    </group>
  )
}

function Portal({ x, z }: { x: number; z: number }) {
  const torusRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  const particleGeom = useMemo(() => {
    const g = new THREE.BufferGeometry()
    const count = 40
    const positions = new Float32Array(count * 3)
    // Deterministic pseudo-random so the geometry is stable across renders.
    const pseudo = (n: number) => {
      const s = Math.sin(n * 127.1) * 43758.5453
      return s - Math.floor(s)
    }
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const r = 0.3 + pseudo(i) * 0.25
      positions[i * 3] = Math.cos(angle) * r
      positions[i * 3 + 1] = (pseudo(i + 100) - 0.5) * 0.9
      positions[i * 3 + 2] = Math.sin(angle) * r
    }
    g.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    return g
  }, [])

  useFrame((_, delta) => {
    if (torusRef.current) torusRef.current.rotation.z += delta * 1.5
    if (particlesRef.current) particlesRef.current.rotation.y += delta * 0.6
  })

  return (
    <group position={[x, 0.65, z]}>
      <mesh ref={torusRef}>
        <torusGeometry args={[0.45, 0.08, 16, 32]} />
        <meshStandardMaterial
          color="#22d3ee"
          emissive="#06b6d4"
          emissiveIntensity={1.2}
        />
      </mesh>
      <points ref={particlesRef} geometry={particleGeom}>
        <pointsMaterial color="#67e8f9" size={0.06} sizeAttenuation transparent opacity={0.9} />
      </points>
    </group>
  )
}

// ─── World (floors + walls) ───────────────────────────────────────────────────

function World({ grid }: { grid: Grid }) {
  const floorMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#1e293b' }),
    []
  )
  const wallMat = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#374151' }),
    []
  )
  const floorGeom = useMemo(() => new THREE.BoxGeometry(1, 0.15, 1), [])
  const wallGeom = useMemo(() => new THREE.BoxGeometry(1, 1.5, 1), [])

  const { floors, walls } = useMemo(() => {
    const floorTiles: Array<[number, number]> = []
    const wallTiles: Array<[number, number]> = []
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const [x, z] = gridToWorld(r, c)
        if (grid[r][c] === 'W') {
          wallTiles.push([x, z])
        } else {
          floorTiles.push([x, z])
        }
      }
    }
    return { floors: floorTiles, walls: wallTiles }
  }, [grid])

  return (
    <group>
      {floors.map(([x, z], i) => (
        <mesh
          key={`f-${i}`}
          geometry={floorGeom}
          material={floorMat}
          position={[x, 0.075, z]}
          receiveShadow
        />
      ))}
      {walls.map(([x, z], i) => (
        <mesh
          key={`w-${i}`}
          geometry={wallGeom}
          material={wallMat}
          position={[x, 0.75, z]}
          castShadow
          receiveShadow
        />
      ))}
    </group>
  )
}

// ─── Items renderer from grid ─────────────────────────────────────────────────

function Items({ grid }: { grid: Grid }) {
  const items = useMemo(() => {
    const out: React.ReactNode[] = []
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        const cell = grid[r][c]
        const [x, z] = gridToWorld(r, c)
        const key = `${r}-${c}`
        switch (cell) {
          case 'C':
            out.push(<Chest key={key} x={x} z={z} />)
            break
          case 'M':
            out.push(<ManaCrystal key={key} x={x} z={z} />)
            break
          case 'H':
            out.push(<LifeOrb key={key} x={x} z={z} />)
            break
          case 'T':
            out.push(<Trap key={key} x={x} z={z} />)
            break
          case 'P':
            out.push(<Portal key={key} x={x} z={z} />)
            break
          default:
            break
        }
      }
    }
    return out
  }, [grid])

  return <>{items}</>
}

// ─── Camera rig that follows the hero ─────────────────────────────────────────

function CameraRig({ heroRow, heroCol }: { heroRow: number; heroCol: number }) {
  const camRef = useRef<THREE.PerspectiveCamera>(null)
  const target = useMemo(() => new THREE.Vector3(), [])
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
    <PerspectiveCamera
      ref={camRef}
      makeDefault
      fov={50}
      position={[CAM_OFFSET.x, CAM_OFFSET.y, CAM_OFFSET.z]}
    />
  )
}

// ─── Main exported Canvas ─────────────────────────────────────────────────────

export interface GameCanvasProps {
  grid: Grid
  heroClass: HeroClass
  heroRow: number
  heroCol: number
  enemies: EnemyState[]
}

export default function GameCanvas({
  grid,
  heroClass,
  heroRow,
  heroCol,
  enemies,
}: GameCanvasProps) {
  return (
    <Canvas
      shadows
      gl={{ antialias: true }}
      className="h-full w-full"
      dpr={[1, 2]}
    >
      <color attach="background" args={['#0b1120']} />
      <fog attach="fog" args={['#0b1120', 18, 40]} />

      <CameraRig heroRow={heroRow} heroCol={heroCol} />

      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 18, 8]}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
      />

      <World grid={grid} />
      <Items grid={grid} />
      {enemies.map((e) => (
        <EnemyMesh key={e.id} enemy={e} />
      ))}
      <HeroMesh heroClass={heroClass} row={heroRow} col={heroCol} />
    </Canvas>
  )
}
