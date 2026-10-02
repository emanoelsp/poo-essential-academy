'use client'

import { useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Html, OrbitControls, PerspectiveCamera, Sparkles } from '@react-three/drei'
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

const STONE = '#75503a'
const STONE_LIGHT = '#ad7950'

function RuinBlock({ position, scale, rotation = 0 }: { position: [number, number, number]; scale: [number, number, number]; rotation?: number }) {
  return <mesh castShadow receiveShadow position={position} rotation={[0, rotation, 0]} scale={scale}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color={STONE} roughness={0.88} metalness={0.04} /></mesh>
}

function WallTile({ row, col, rowIndex, colIndex }: { row: number; col: number; rowIndex: number; colIndex: number }) {
  const variant = (rowIndex * 7 + colIndex * 3) % 3
  return <group position={[col, 0, row]}>
    <RuinBlock position={[0, 0.35, 0]} scale={[0.95, 0.7, 0.95]} rotation={variant * 0.035} />
    <RuinBlock position={[-0.2 + variant * 0.18, 0.95, 0.08]} scale={[0.58, 0.55, 0.78]} rotation={-0.06 + variant * 0.04} />
    {variant !== 1 && <RuinBlock position={[0.28, 1.35, -0.12]} scale={[0.42, 0.34, 0.6]} rotation={0.1} />}
    <mesh position={[0, 0.05, 0]} receiveShadow><boxGeometry args={[1.02, 0.12, 1.02]} /><meshStandardMaterial color="#633e31" roughness={1} /></mesh>
  </group>
}

function SandFloor({ row, col, cell }: { row: number; col: number; cell: CellKind }) {
  const seed = Math.sin(row * 17.3 + col * 4.9) * 43758.5453
  const height = 0.13 + (seed - Math.floor(seed)) * 0.1
  const color = cell === 'portal' ? '#55306d' : cell === 'interface' ? '#392b61' : '#a86639'
  return <mesh receiveShadow position={[col, -0.14 + height / 2, row]}><boxGeometry args={[0.96, height, 0.96]} /><meshStandardMaterial color={color} roughness={0.96} metalness={0.02} /></mesh>
}

function Dune({ row, col, scale }: { row: number; col: number; scale: number }) {
  return <mesh receiveShadow position={[col, -0.06, row]} scale={[scale, 0.3, scale * 0.75]}><sphereGeometry args={[1, 18, 8]} /><meshStandardMaterial color="#d6a05b" roughness={1} /></mesh>
}

function Chest({ row, col }: { row: number; col: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state) => { if (ref.current) ref.current.position.y = 0.22 + Math.sin(state.clock.elapsedTime * 2.1 + row) * 0.04 })
  return <group ref={ref} position={[col, 0.2, row]}>
    <mesh castShadow><boxGeometry args={[0.66, 0.42, 0.5]} /><meshStandardMaterial color="#5b321e" roughness={0.58} metalness={0.18} /></mesh>
    <mesh castShadow position={[0, 0.29, -0.03]} rotation={[-0.16, 0, 0]}><boxGeometry args={[0.68, 0.14, 0.52]} /><meshStandardMaterial color="#8b4e2a" roughness={0.48} metalness={0.2} /></mesh>
    <mesh position={[0, 0.1, 0.27]}><boxGeometry args={[0.11, 0.2, 0.035]} /><meshStandardMaterial color="#f5c451" emissive="#d97706" emissiveIntensity={2.2} metalness={0.7} /></mesh>
    <mesh position={[0, 0.35, 0.05]}><boxGeometry args={[0.42, 0.025, 0.025]} /><meshStandardMaterial color="#e3a642" metalness={0.8} /></mesh>
    <pointLight color="#f59e0b" intensity={0.7} distance={2.5} position={[0, 0.45, 0]} />
  </group>
}

function Crystal({ row, col }: { row: number; col: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((state, delta) => { if (ref.current) { ref.current.rotation.y += delta * 1.25; ref.current.position.y = 0.14 + Math.sin(state.clock.elapsedTime * 2.2 + col) * 0.08 } })
  return <group ref={ref} position={[col, 0.14, row]}>
    <mesh castShadow><coneGeometry args={[0.32, 0.86, 6]} /><meshStandardMaterial color="#67e8f9" emissive="#0891b2" emissiveIntensity={2.8} transparent opacity={0.91} roughness={0.18} metalness={0.25} /></mesh>
    <mesh position={[0.22, 0.1, 0.05]} rotation={[0.2, 0.3, -0.2]}><coneGeometry args={[0.13, 0.44, 5]} /><meshStandardMaterial color="#a5f3fc" emissive="#06b6d4" emissiveIntensity={2.2} transparent opacity={0.85} /></mesh>
    <pointLight color="#22d3ee" intensity={1.3} distance={3.2} position={[0, 0.5, 0]} />
  </group>
}

function Trap({ row, col }: { row: number; col: number }) {
  return <group position={[col, 0.03, row]}>
    <mesh rotation={[0, Math.PI / 4, 0]} receiveShadow><cylinderGeometry args={[0.42, 0.48, 0.08, 8]} /><meshStandardMaterial color="#3f2524" roughness={0.9} /></mesh>
    {[-0.22, 0.22].flatMap((x) => [-0.22, 0.22].map((z) => <mesh key={`${x}-${z}`} castShadow position={[x, 0.28, z]}><coneGeometry args={[0.07, 0.45, 6]} /><meshStandardMaterial color="#d4d4d8" metalness={0.8} roughness={0.22} /></mesh>))}
    <pointLight color="#ef4444" intensity={0.55} distance={2.3} position={[0, 0.4, 0]} />
  </group>
}

function InterfaceGate({ row, col }: { row: number; col: number }) {
  const ref = useRef<THREE.Group>(null)
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * 0.7 })
  return <group ref={ref} position={[col, 0.65, row]}>
    <mesh castShadow><torusGeometry args={[0.46, 0.07, 12, 32]} /><meshStandardMaterial color="#c4b5fd" emissive="#7c3aed" emissiveIntensity={2.4} metalness={0.55} /></mesh>
    <mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.27, 0.035, 10, 24]} /><meshStandardMaterial color="#f5d0fe" emissive="#c026d3" emissiveIntensity={2.7} /></mesh>
    <pointLight color="#8b5cf6" intensity={1.1} distance={3} position={[0, 0.2, 0]} />
  </group>
}

function Portal({ row, col }: { row: number; col: number }) {
  const outer = useRef<THREE.Group>(null)
  const inner = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => { if (outer.current) outer.current.rotation.y += delta * 0.55; if (inner.current) inner.current.rotation.z -= delta * 1.25 })
  return <group position={[col, 0.2, row]}>
    <group ref={outer}><mesh rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.7, 0.1, 14, 40]} /><meshStandardMaterial color="#f0abfc" emissive="#c026d3" emissiveIntensity={3} metalness={0.45} /></mesh><mesh position={[-0.72, 0.7, 0]}><boxGeometry args={[0.18, 1.4, 0.3]} /><meshStandardMaterial color={STONE_LIGHT} roughness={0.85} /></mesh><mesh position={[0.72, 0.7, 0]}><boxGeometry args={[0.18, 1.4, 0.3]} /><meshStandardMaterial color={STONE_LIGHT} roughness={0.85} /></mesh></group>
    <mesh ref={inner} rotation={[Math.PI / 2, 0, 0]}><torusGeometry args={[0.39, 0.045, 12, 32]} /><meshStandardMaterial color="#67e8f9" emissive="#06b6d4" emissiveIntensity={4} /></mesh>
    <pointLight color="#d946ef" intensity={2.2} distance={4.5} position={[0, 0.65, 0]} />
  </group>
}

function Sword() {
  return <group position={[0.48, 0.25, 0.05]} rotation={[0.12, 0, -0.42]}><mesh castShadow><boxGeometry args={[0.07, 0.92, 0.1]} /><meshStandardMaterial color="#e2e8f0" metalness={0.92} roughness={0.12} /></mesh><mesh position={[0, -0.35, 0]}><boxGeometry args={[0.3, 0.07, 0.12]} /><meshStandardMaterial color="#eab308" metalness={0.7} /></mesh><mesh position={[0, -0.53, 0]}><cylinderGeometry args={[0.05, 0.05, 0.27, 8]} /><meshStandardMaterial color="#451a03" roughness={0.85} /></mesh></group>
}

function Staff() {
  return <group position={[0.44, 0.35, 0.02]} rotation={[0.05, 0, -0.12]}><mesh castShadow><cylinderGeometry args={[0.045, 0.055, 1.25, 8]} /><meshStandardMaterial color="#713f12" roughness={0.8} /></mesh><mesh position={[0, 0.67, 0]}><octahedronGeometry args={[0.17, 0]} /><meshStandardMaterial color="#c4b5fd" emissive="#8b5cf6" emissiveIntensity={3} /></mesh></group>
}

function Bow() {
  return <group position={[0.45, 0.4, 0.05]} rotation={[0, 0, -0.15]}><mesh rotation={[0, 0, Math.PI / 2]}><torusGeometry args={[0.33, 0.025, 8, 16, Math.PI]} /><meshStandardMaterial color="#b45309" roughness={0.7} /></mesh><mesh position={[0, 0, 0.04]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.012, 0.012, 0.74, 6]} /><meshStandardMaterial color="#fef3c7" /></mesh></group>
}

function HeroAvatar({ hero }: { hero: EvolutionHero }) {
  const ref = useRef<THREE.Group>(null)
  const isMage = hero.kind === 'mago'
  const isSentinel = hero.kind === 'sentinela'
  const accent = isMage ? '#7c3aed' : isSentinel ? '#059669' : '#b45309'
  useFrame((state) => { if (ref.current) ref.current.position.y = 0.12 + Math.sin(state.clock.elapsedTime * 2.4) * 0.045 })
  return <group ref={ref} position={[hero.col, 0.12, hero.row]}>
    <mesh castShadow position={[0, 0.54, 0]}><cylinderGeometry args={[isMage ? 0.36 : 0.31, 0.42, 0.7, 10]} /><meshStandardMaterial color={isMage ? '#30206d' : isSentinel ? '#14532d' : '#334155'} roughness={0.7} metalness={0.28} /></mesh>
    <mesh castShadow position={[0, 0.9, 0]}><sphereGeometry args={[0.22, 16, 16]} /><meshStandardMaterial color="#d6a878" roughness={0.85} /></mesh>
    {isMage ? <><mesh position={[0, 1.1, 0]} rotation={[0, 0, Math.PI / 2]}><cylinderGeometry args={[0.34, 0.34, 0.07, 12]} /><meshStandardMaterial color="#1e1b4b" roughness={0.9} /></mesh><mesh position={[0, 1.47, 0]}><coneGeometry args={[0.27, 0.72, 12]} /><meshStandardMaterial color="#1e1b4b" roughness={0.9} /></mesh></> : <mesh position={[0, 1.08, 0]}><boxGeometry args={[0.5, 0.15, 0.48]} /><meshStandardMaterial color={isSentinel ? '#064e3b' : '#475569'} metalness={0.6} roughness={0.4} /></mesh>}
    <mesh position={[0, 0.88, 0.2]}><boxGeometry args={[0.26, 0.05, 0.025]} /><meshStandardMaterial color="#111827" /></mesh>
    <mesh castShadow position={[-0.36, 0.6, 0]} rotation={[0, 0, 0.3]}><sphereGeometry args={[0.13, 10, 10]} /><meshStandardMaterial color={accent} metalness={0.5} /></mesh>
    {isMage ? <Staff /> : isSentinel ? <Bow /> : <Sword />}
    <mesh position={[0, 0.38, 0.4]}><boxGeometry args={[0.1, 0.35, 0.04]} /><meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.5} /></mesh>
    <pointLight color={accent} intensity={1.2} distance={3.2} position={[0, 1, 0]} />
  </group>
}

function Goblin({ color }: { color: string }) {
  return <group><mesh castShadow position={[0, 0.34, 0]}><cylinderGeometry args={[0.25, 0.32, 0.58, 8]} /><meshStandardMaterial color={color} roughness={0.86} /></mesh><mesh castShadow position={[0, 0.78, 0]}><sphereGeometry args={[0.24, 12, 12]} /><meshStandardMaterial color="#456e17" roughness={0.7} /></mesh><mesh castShadow position={[-0.22, 0.86, 0]} rotation={[0, 0, 0.55]}><coneGeometry args={[0.07, 0.28, 6]} /><meshStandardMaterial color="#385314" /></mesh><mesh castShadow position={[0.22, 0.86, 0]} rotation={[0, 0, -0.55]}><coneGeometry args={[0.07, 0.28, 6]} /><meshStandardMaterial color="#385314" /></mesh><mesh position={[-0.08, 0.8, 0.2]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={3} /></mesh><mesh position={[0.08, 0.8, 0.2]}><sphereGeometry args={[0.04, 8, 8]} /><meshStandardMaterial color="#fef08a" emissive="#facc15" emissiveIntensity={3} /></mesh></group>
}

function Golem() {
  return <group><mesh castShadow position={[0, 0.48, 0]}><boxGeometry args={[0.78, 0.82, 0.62]} /><meshStandardMaterial color="#57534e" roughness={0.95} /></mesh><mesh castShadow position={[0, 1.05, 0]}><dodecahedronGeometry args={[0.34, 0]} /><meshStandardMaterial color="#44403c" roughness={0.92} /></mesh><mesh position={[-0.11, 1.08, 0.28]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={4} /></mesh><mesh position={[0.11, 1.08, 0.28]}><sphereGeometry args={[0.06, 8, 8]} /><meshStandardMaterial color="#fb923c" emissive="#ea580c" emissiveIntensity={4} /></mesh><mesh castShadow position={[-0.47, 0.35, 0]}><boxGeometry args={[0.2, 0.65, 0.25]} /><meshStandardMaterial color="#78716c" /></mesh><mesh castShadow position={[0.47, 0.35, 0]}><boxGeometry args={[0.2, 0.65, 0.25]} /><meshStandardMaterial color="#78716c" /></mesh></group>
}

function ShadowCreature() {
  return <group><mesh castShadow><coneGeometry args={[0.4, 1.2, 8]} /><meshStandardMaterial color="#312e81" emissive="#4c1d95" emissiveIntensity={1.5} transparent opacity={0.78} /></mesh><mesh position={[-0.12, 0.5, 0.31]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#f0abfc" emissive="#e879f9" emissiveIntensity={4} /></mesh><mesh position={[0.12, 0.5, 0.31]}><sphereGeometry args={[0.055, 8, 8]} /><meshStandardMaterial color="#f0abfc" emissive="#e879f9" emissiveIntensity={4} /></mesh></group>
}

function EnemyAvatar({ enemy }: { enemy: EvolutionEnemy }) {
  const ref = useRef<THREE.Group>(null)
  const pct = Math.max(0, enemy.hp / enemy.maxHp)
  useFrame((_, delta) => { if (ref.current) ref.current.rotation.y += delta * (enemy.kind === 'golem' ? 0.18 : 0.45) })
  return <group position={[enemy.col, 0.05, enemy.row]}>
    <group ref={ref}>{enemy.kind === 'goblin' ? <Goblin color="#65932b" /> : enemy.kind === 'golem' ? <Golem /> : <ShadowCreature />}</group>
    <Html distanceFactor={10} position={[0, 1.75, 0]} center><div style={{ width: 70, pointerEvents: 'none', textAlign: 'center', fontFamily: 'monospace' }}><div style={{ fontSize: 9, color: '#f8fafc', textShadow: '0 1px 3px #000', whiteSpace: 'nowrap' }}>{enemy.name}</div><div style={{ height: 6, background: '#111827', borderRadius: 5, overflow: 'hidden', border: '1px solid #475569' }}><div style={{ width: `${pct * 100}%`, height: '100%', background: pct > 0.5 ? '#22c55e' : '#ef4444' }} /></div></div></Html>
  </group>
}

function Ruins({ map }: { map: string[] }) {
  const dunes = useMemo(() => [[2, 2, 1.35], [3, 12, 1.1], [7, 2, 1.2], [10, 12, 1.45], [11, 5, 0.9]] as const, [])
  return <>
    <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[6.5, -0.28, 6]}><planeGeometry args={[40, 34]} /><meshStandardMaterial color="#8d5a38" roughness={1} /></mesh>
    {dunes.map(([row, col, scale]) => <Dune key={`${row}-${col}`} row={row} col={col} scale={scale} />)}
    {map.flatMap((line, row) => line.split('').map((symbol, col) => symbol === '#' ? <WallTile key={`${row}-${col}`} row={row} col={col} rowIndex={row} colIndex={col} /> : null))}
    <group position={[1.2, 0.55, 10.5]} rotation={[0, 0.18, 0]}><RuinBlock position={[-0.55, 0, 0]} scale={[0.24, 1.7, 0.34]} /><RuinBlock position={[0.55, 0, 0]} scale={[0.24, 1.45, 0.34]} /><RuinBlock position={[0, 0.72, 0]} scale={[1.05, 0.25, 0.34]} /></group>
    <group position={[12.8, 0.55, 3.6]} rotation={[0, -0.22, 0]}><RuinBlock position={[-0.55, 0, 0]} scale={[0.24, 1.55, 0.34]} /><RuinBlock position={[0.55, 0, 0]} scale={[0.24, 1.25, 0.34]} /><RuinBlock position={[0, 0.62, 0]} scale={[1.05, 0.22, 0.34]} /></group>
  </>
}

function Scene({ map, cells, hero, enemies }: Props) {
  const tiles = useMemo(() => map.flatMap((line, row) => line.split('').map((symbol, col) => ({ row, col, symbol, cell: cells[`${row},${col}`] }))), [cells, map])
  return <>
    <color attach="background" args={['#9d5f3c']} />
    <fog attach="fog" args={['#9d5f3c', 14, 31]} />
    <ambientLight intensity={0.72} color="#ffd7a3" />
    <directionalLight castShadow position={[-8, 13, -6]} intensity={3.2} color="#ffd08a" shadow-mapSize={[2048, 2048]} shadow-camera-left={-15} shadow-camera-right={15} shadow-camera-top={15} shadow-camera-bottom={-15} />
    <pointLight position={[7, 4, 7]} intensity={2.4} distance={18} color="#ef8f3d" />
    <Sparkles count={90} scale={[20, 3, 18]} size={2.2} speed={0.22} color="#f6c987" opacity={0.24} />
    <Ruins map={map} />
    {tiles.map(({ row, col, symbol, cell }) => symbol === '#' ? null : <group key={`${row}-${col}`}><SandFloor row={row} col={col} cell={cell} />{cell === 'chest' && <Chest row={row} col={col} />}{cell === 'crystal' && <Crystal row={row} col={col} />}{cell === 'trap' && <Trap row={row} col={col} />}{cell === 'interface' && <InterfaceGate row={row} col={col} />}{cell === 'portal' && <Portal row={row} col={col} />}</group>)}
    {enemies.filter((enemy) => enemy.alive).map((enemy) => <EnemyAvatar key={enemy.id} enemy={enemy} />)}
    <HeroAvatar hero={hero} />
    <OrbitControls enablePan={false} minDistance={8} maxDistance={23} maxPolarAngle={Math.PI / 2.35} target={[6.5, 0, 6]} />
  </>
}

export default function EvolutionCanvas(props: Props) {
  return <Canvas shadows dpr={[1, 1.8]} gl={{ antialias: true }} style={{ background: '#8d5a38' }}><PerspectiveCamera makeDefault position={[7.5, 14.5, 15.5]} fov={42} near={0.1} far={70} /><Scene {...props} /></Canvas>
}
