'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, PerspectiveCamera } from '@react-three/drei'
import * as THREE from 'three'

type CellKind = 'empty' | 'wall' | 'chest' | 'crystal' | 'trap' | 'interface' | 'portal' | 'start'

interface EvolutionHero {
  name: string
  kind: string
  row: number
  col: number
}

interface EvolutionEnemy {
  id: number
  kind: string
  name: string
  hp: number
  maxHp: number
  row: number
  col: number
  alive: boolean
}

interface Props {
  map: string[]
  cells: Record<string, CellKind>
  hero: EvolutionHero
  enemies: EvolutionEnemy[]
}

function worldPosition(row: number, col: number): [number, number, number] {
  return [col, 0, row]
}

function FloorTile({ row, col, cell }: { row: number; col: number; cell: CellKind }) {
  const color = cell === 'portal' ? '#32145d'
    : cell === 'interface' ? '#24134b'
      : cell === 'crystal' ? '#092d49'
        : cell === 'trap' ? '#421525'
          : cell === 'chest' ? '#3e2814'
            : '#111827'
  return (
    <mesh receiveShadow position={[col, -0.12, row]}>
      <boxGeometry args={[0.96, 0.18, 0.96]} />
      <meshStandardMaterial color={color} roughness={0.82} metalness={0.12} />
    </mesh>
  )
}

function WallTile({ row, col }: { row: number; col: number }) {
  return (
    <group position={[col, 0.65, row]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.96, 1.45, 0.96]} />
        <meshStandardMaterial color="#1e293b" roughness={0.72} metalness={0.3} />
      </mesh>
      <mesh position={[0, 0.32, 0.49]}>
        <boxGeometry args={[0.64, 0.04, 0.02]} />
        <meshStandardMaterial color="#334155" emissive="#172554" emissiveIntensity={0.6} />
      </mesh>
    </group>
  )
}

function Chest({ row, col }: { row: number; col: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => {
    if (ref.current) ref.current.position.y = 0.25 + Math.sin(state.clock.elapsedTime * 2.2 + row) * 0.04
  })
  return (
    <group ref={ref} position={[col, 0.25, row]}>
      <mesh castShadow><boxGeometry args={[0.5, 0.35, 0.42]} /><meshStandardMaterial color="#a16207" metalness={0.45} roughness={0.45} /></mesh>
      <mesh position={[0, 0.23, 0]}><boxGeometry args={[0.5, 0.12, 0.42]} /><meshStandardMaterial color="#ca8a04" metalness={0.5} roughness={0.4} /></mesh>
      <mesh position={[0, 0.08, 0.22]}><boxGeometry args={[0.09, 0.16, 0.035]} /><meshStandardMaterial color="#fde68a" emissive="#f59e0b" emissiveIntensity={2} /></mesh>
      <pointLight color="#f59e0b" intensity={0.55} distance={2.2} position={[0, 0.4, 0]} />
    </group>
  )
}

function Crystal({ row, col }: { row: number; col: number }) {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((state, delta) => {
    if (!ref.current) return
    ref.current.rotation.y += delta * 1.8
    ref.current.position.y = 0.52 + Math.sin(state.clock.elapsedTime * 2.3 + col) * 0.1
  })
  return (
    <group position={[col, 0, row]}>
      <mesh ref={ref} castShadow position={[0, 0.52, 0]}><octahedronGeometry args={[0.3, 0]} /><meshStandardMaterial color="#38bdf8" emissive="#0284c7" emissiveIntensity={2.4} transparent opacity={0.94} /></mesh>
      <pointLight color="#38bdf8" intensity={0.9} distance={2.4} position={[0, 0.55, 0]} />
    </group>
  )
}

function Trap({ row, col }: { row: number; col: number }) {
  return <group position={[col, 0.08, row]}><mesh rotation={[0, Math.PI / 4, 0]}><coneGeometry args={[0.25, 0.24, 4]} /><meshStandardMaterial color="#ef4444" emissive="#991b1b" emissiveIntensity={1.5} /></mesh><pointLight color="#ef4444" intensity={0.45} distance={1.8} /></group>
}

function InterfaceGate({ row, col }: { row: number; col: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.8 })
  return <group ref={ref} position={[col, 0.5, row]}><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.32, 0.055, 10, 24]} /><meshStandardMaterial color="#a78bfa" emissive="#7c3aed" emissiveIntensity={2.2} /></mesh><pointLight color="#8b5cf6" intensity={0.7} distance={2.2} /></group>
}

function Portal({ row, col }: { row: number; col: number }) {
  const outer = useRef<THREE.Mesh>(null)
  const inner = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (outer.current) outer.current.rotation.y += delta * 0.9
    if (inner.current) inner.current.rotation.y -= delta * 1.4
  })
  return <group position={[col, 0.22, row]}><mesh ref={outer} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.43, 0.08, 12, 32]} /><meshStandardMaterial color="#e879f9" emissive="#c026d3" emissiveIntensity={2.5} /></mesh><mesh ref={inner} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.27, 0.035, 10, 24]} /><meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={3} /></mesh><pointLight color="#d946ef" intensity={1.4} distance={3.4} position={[0, 0.4, 0]} /></group>
}

function HeroAvatar({ hero }: { hero: EvolutionHero }) {
  const ref = useRef<THREE.Group>(null)
  const color = hero.kind === 'guerreiro' ? '#f59e0b' : hero.kind === 'mago' ? '#8b5cf6' : '#10b981'
  useFrame((state) => {
    if (!ref.current) return
    ref.current.position.y = 0.45 + Math.sin(state.clock.elapsedTime * 2.4) * 0.05
  })
  return <group ref={ref} position={[hero.col, 0.45, hero.row]}><mesh castShadow><cylinderGeometry args={[0.27, 0.35, 0.58, 8]} /><meshStandardMaterial color={color} metalness={0.35} roughness={0.45} /></mesh><mesh castShadow position={[0, 0.48, 0]}><sphereGeometry args={[0.2, 12, 12]} /><meshStandardMaterial color="#fde68a" roughness={0.8} /></mesh><mesh position={[0, 0.51, 0.18]}><boxGeometry args={[0.2, 0.04, 0.03]} /><meshStandardMaterial color="#111827" /></mesh><mesh position={[0, 0.15, 0.28]}><boxGeometry args={[0.08, 0.28, 0.04]} /><meshStandardMaterial color="#f8fafc" emissive={color} emissiveIntensity={1.2} /></mesh><pointLight color={color} intensity={1.1} distance={3.2} position={[0, 0.7, 0]} /></group>
}

function EnemyAvatar({ enemy }: { enemy: EvolutionEnemy }) {
  const ref = useRef<THREE.Group>(null)
  const color = enemy.kind === 'goblin' ? '#84cc16' : enemy.kind === 'golem' ? '#64748b' : '#c026d3'
  const scale = enemy.kind === 'golem' ? 1.25 : 0.9
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * (enemy.kind === 'golem' ? 0.25 : 0.7) })
  const pct = Math.max(0, enemy.hp / enemy.maxHp)
  return <group position={[enemy.col, 0.35, enemy.row]} scale={scale}><group ref={ref}><mesh castShadow><boxGeometry args={[0.5, 0.64, 0.5]} /><meshStandardMaterial color={color} roughness={0.7} metalness={0.25} /></mesh><mesh castShadow position={[0, 0.48, 0]}><sphereGeometry args={[0.24, 10, 10]} /><meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.45} /></mesh><mesh position={[0.08, 0.51, 0.21]}><sphereGeometry args={[0.035, 8, 8]} /><meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={3} /></mesh></group><mesh position={[0, 0.95, 0]}><boxGeometry args={[0.62, 0.045, 0.04]} /><meshStandardMaterial color="#111827" /></mesh><mesh position={[-0.31 + pct * 0.31, 0.95, 0.025]}><boxGeometry args={[0.62 * pct, 0.035, 0.02]} /><meshStandardMaterial color={pct > 0.5 ? '#22c55e' : '#ef4444'} /></mesh></group>
}

function Scene({ map, cells, hero, enemies }: Props) {
  const floor = useMemo(() => map.flatMap((line, row) => line.split('').map((symbol, col) => ({ row, col, symbol, cell: cells[`${row},${col}`] }))), [cells, map])
  return <>
    <color attach="background" args={['#070b16']} />
    <fog attach="fog" args={['#070b16', 11, 27]} />
    <ambientLight intensity={0.7} color="#94a3b8" />
    <directionalLight castShadow position={[4, 12, 5]} intensity={2.4} color="#dbeafe" shadow-mapSize={[2048, 2048]} />
    <pointLight position={[7, 3, 7]} intensity={1.8} distance={15} color="#7c3aed" />
    <group>
      {floor.map(({ row, col, symbol, cell }) => symbol === '#' ? <WallTile key={`${row}-${col}`} row={row} col={col} /> : <group key={`${row}-${col}`}><FloorTile row={row} col={col} cell={cell} />{cell === 'chest' && <Chest row={row} col={col} />}{cell === 'crystal' && <Crystal row={row} col={col} />}{cell === 'trap' && <Trap row={row} col={col} />}{cell === 'interface' && <InterfaceGate row={row} col={col} />}{cell === 'portal' && <Portal row={row} col={col} />}</group>)}
    </group>
    {enemies.filter((enemy) => enemy.alive).map((enemy) => <EnemyAvatar key={enemy.id} enemy={enemy} />)}
    <HeroAvatar hero={hero} />
    <OrbitControls enablePan={false} minDistance={9} maxDistance={23} maxPolarAngle={Math.PI / 2.35} target={[6.5, 0, 6]} />
  </>
}

export default function EvolutionCanvas(props: Props) {
  return <Canvas shadows dpr={[1, 1.8]} gl={{ antialias: true }}><PerspectiveCamera makeDefault position={[8.8, 13, 14.5]} fov={43} near={0.1} far={60} /><Scene {...props} /></Canvas>
}
