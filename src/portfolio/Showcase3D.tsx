import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { PerformanceMonitor, RoundedBox, useTexture } from '@react-three/drei';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Screen {
  id: string;
  img: string;
  href: string;
}

const W = 3.2;
const H = 2;

/* Performance notes: no MeshReflectorMaterial (renders the scene twice + blur passes) and no
   post-processing (several full-screen passes). Reflections are mirrored copies of the screens
   fading into the floor; glow is a soft radial sprite with additive blending. */

function useLayout() {
  const { size } = useThree();
  const narrow = size.width / size.height < 0.9;
  return narrow
    ? {
        narrow,
        cam: new THREE.Vector3(0, 2.2, 12.5),
        scale: 0.74,
        slots: [
          { p: [-1.05, 5.2, -1.4], r: 0.4 },
          { p: [0, 5.45, 0], r: 0 },
          { p: [1.05, 5.2, -1.4], r: -0.4 },
        ],
      }
    : {
        narrow,
        cam: new THREE.Vector3(0, 1.5, 9.4),
        scale: 1,
        slots: [
          { p: [-3.7, 2.55, -0.9], r: 0.48 },
          { p: [0, 2.8, -1.7], r: 0 },
          { p: [3.7, 2.55, -0.9], r: -0.48 },
        ],
      };
}

function makeGlow() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,120,40,1)');
  grd.addColorStop(0.45, 'rgba(255,107,26,0.45)');
  grd.addColorStop(1, 'rgba(255,107,26,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 128, 128);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeFade() {
  const c = document.createElement('canvas');
  c.width = 4;
  c.height = 128;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 0, 128);
  grd.addColorStop(0, 'rgba(255,255,255,0.32)');
  grd.addColorStop(0.55, 'rgba(255,255,255,0.05)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 4, 128);
  return new THREE.CanvasTexture(c);
}

function Panel({ s, slot, index, onOpen, hovered, setHovered, base, glowTex, fadeTex }: { s: Screen; slot: { p: number[]; r: number }; index: number; base: number; onOpen: (h: string) => void; hovered: string | null; setHovered: (v: string | null) => void; glowTex: THREE.Texture; fadeTex: THREE.Texture }) {
  const tex = useTexture(s.img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const g = useRef<THREE.Group>(null);
  const mirror = useRef<THREE.Group>(null);
  const glow = useRef<THREE.MeshBasicMaterial>(null);
  const on = hovered === s.id;
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    const el = g.current;
    if (!el) return;
    const intro = Math.min(1, Math.max(0, (t - 0.25 - index * 0.18) / 1.3));
    const e = 1 - Math.pow(1 - intro, 3);
    el.position.set(slot.p[0], slot.p[1] + Math.sin(t * 0.7 + index * 1.7) * 0.06 - (1 - e) * 1.6, slot.p[2] - (1 - e) * 2);
    el.rotation.y = slot.r + Math.sin(t * 0.35 + index) * 0.025;
    const k = (on ? 1.07 : 1) * base;
    el.scale.setScalar(THREE.MathUtils.damp(el.scale.x, k * e + 0.0001, 6, dt));
    // mirrored copy sits under the floor (y = 0): local offset = -2 * worldY / scale
    if (mirror.current) mirror.current.position.y = (-2 * el.position.y) / el.scale.y;
    if (glow.current) glow.current.opacity = THREE.MathUtils.damp(glow.current.opacity, on ? 1 : 0.6, 6, dt);
  });
  return (
    <group
      ref={g}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(s.id);
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        setHovered(null);
        document.body.style.cursor = '';
      }}
      onClick={(e) => {
        e.stopPropagation();
        onOpen(s.href);
      }}
    >
      <mesh position={[0, 0, -0.12]}>
        <planeGeometry args={[W * 1.45, H * 1.75]} />
        <meshBasicMaterial ref={glow} map={glowTex} transparent opacity={0.6} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} />
      </mesh>
      <RoundedBox args={[W + 0.12, H + 0.12, 0.08]} radius={0.04} smoothness={2} position={[0, 0, -0.045]}>
        <meshStandardMaterial color="#8d8882" metalness={0.55} roughness={0.32} />
      </RoundedBox>
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {/* cheap reflection */}
      <group ref={mirror} scale={[1, -1, 1]}>
        <mesh>
          <planeGeometry args={[W, H]} />
          <meshBasicMaterial map={tex} alphaMap={fadeTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </group>
  );
}

function Trails() {
  const tubes = useMemo(() => {
    const curves = [
      [[-9, 0.2, -4], [-4, 0.9, -3.2], [0, 0.4, -3.6], [4, 1.4, -3], [9, 2.6, -4.5]],
      [[-9, 3.6, -5], [-3, 3.1, -3.8], [1, 3.6, -4.2], [5, 2.5, -3.4], [9, 3.2, -5]],
      [[-9, 1.6, -6], [-2, 2.3, -5], [3, 0.8, -5.4], [9, 1.8, -6]],
    ].map((pts) => new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))));
    const r = [0.025, 0.018, 0.03];
    return curves.map((c, k) => ({ core: new THREE.TubeGeometry(c, 90, r[k] * 1.3, 6, false) }));
  }, []);
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (g.current) g.current.position.x = Math.sin(st.clock.elapsedTime * 0.15) * 0.6;
  });
  return (
    <group ref={g}>
      {tubes.map((t, k) => (
        <group key={k}>
          <mesh geometry={t.core}>
            <meshBasicMaterial color={k === 1 ? '#ffd9b8' : '#ff8a3d'} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Rig({ cam, narrow }: { cam: THREE.Vector3; narrow: boolean }) {
  const { camera, pointer } = useThree();
  const target = useMemo(() => new THREE.Vector3(0, narrow ? 2.45 : 1.15, -1), [narrow]);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    const intro = reduced ? 1 : Math.min(1, t / 2.2);
    const e = 1 - Math.pow(1 - intro, 3);
    const z = cam.z + (1 - e) * 4;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, cam.x + pointer.x * 0.9, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, cam.y + pointer.y * 0.35, 3, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 4, dt);
    camera.lookAt(target);
  });
  return null;
}

function Scene({ screens, onOpen }: { screens: Screen[]; onOpen: (h: string) => void }) {
  const { cam, slots, scale, narrow } = useLayout();
  const [hovered, setHovered] = useState<string | null>(null);
  const glowTex = useMemo(makeGlow, []);
  const fadeTex = useMemo(makeFade, []);
  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <fog attach="fog" args={['#0a0908', 9, 22]} />
      <ambientLight intensity={0.35} />
      <pointLight position={[0, 4, 2]} intensity={18} color="#ffb27a" distance={14} />
      <pointLight position={[-6, 1.5, 2]} intensity={14} color="#ff7a2a" distance={14} />
      <pointLight position={[6, 2, 1]} intensity={10} color="#ffd2ad" distance={14} />
      <Suspense fallback={null}>
        {screens.map((s, i) => (
          <Panel key={s.id} s={s} slot={slots[i]} index={i} base={scale} onOpen={onOpen} hovered={hovered} setHovered={setHovered} glowTex={glowTex} fadeTex={fadeTex} />
        ))}
      </Suspense>
      <Trails />
      {/* dark glossy floor, semi-transparent so the mirrored screens show through */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
        <planeGeometry args={[60, 40]} />
        <meshStandardMaterial color="#0c0a09" metalness={0.6} roughness={0.5} transparent opacity={0.82} />
      </mesh>
      <Rig cam={cam} narrow={narrow} />
    </>
  );
}

export default function Showcase3D({ screens, onOpen, active = true }: { screens: Screen[]; onOpen: (h: string) => void; active?: boolean }) {
  const [dpr, setDpr] = useState(() => Math.min(window.devicePixelRatio || 1, 1.25));
  return (
    <Canvas
      frameloop={active ? 'always' : 'never'}
      dpr={dpr}
      camera={{ position: [0, 1.75, 12], fov: 42, near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: 'high-performance', stencil: false, depth: true }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      onPointerMissed={() => (document.body.style.cursor = '')}
    >
      <PerformanceMonitor onDecline={() => setDpr((d) => Math.max(0.6, d - 0.25))} flipflops={4} />
      <Scene screens={screens} onOpen={onOpen} />
    </Canvas>
  );
}
