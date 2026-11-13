import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment, Lightformer, MeshReflectorMaterial, RoundedBox, useTexture } from '@react-three/drei';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Suspense, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

export interface Screen {
  id: string;
  img: string;
  href: string;
}

const W = 3.2;
const H = 2;
const ORANGE = new THREE.Color('#ff6b1a');

function useLayout() {
  const { size } = useThree();
  const narrow = size.width / size.height < 0.9;
  return narrow
    ? {
        cam: new THREE.Vector3(0, 2.2, 12.5),
        scale: 0.74,
        slots: [
          { p: [-1.05, 5.2, -1.4], r: 0.4 },
          { p: [0, 5.45, 0], r: 0 },
          { p: [1.05, 5.2, -1.4], r: -0.4 },
        ],
      }
    : {
        cam: new THREE.Vector3(0, 1.5, 9.4),
        scale: 1,
        slots: [
          { p: [-3.7, 2.55, -0.9], r: 0.48 },
          { p: [0, 2.8, -1.7], r: 0 },
          { p: [3.7, 2.55, -0.9], r: -0.48 },
        ],
      };
}

function Panel({ s, slot, index, onOpen, hovered, setHovered, base = 1 }: { s: Screen; slot: { p: number[]; r: number }; index: number; base?: number; onOpen: (h: string) => void; hovered: string | null; setHovered: (v: string | null) => void }) {
  const tex = useTexture(s.img);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  const g = useRef<THREE.Group>(null);
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
    if (glow.current) glow.current.opacity = THREE.MathUtils.damp(glow.current.opacity, on ? 0.95 : 0.45, 6, dt);
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
      {/* glow behind */}
      <mesh position={[0, 0, -0.09]}>
        <planeGeometry args={[W + 0.16, H + 0.16]} />
        <meshBasicMaterial ref={glow} color={ORANGE} toneMapped={false} transparent opacity={0.45} />
      </mesh>
      {/* chrome frame */}
      <RoundedBox args={[W + 0.12, H + 0.12, 0.08]} radius={0.04} smoothness={4} position={[0, 0, -0.045]}>
        <meshStandardMaterial color="#9a958f" metalness={1} roughness={0.22} />
      </RoundedBox>
      {/* screen */}
      <mesh>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

function Trails() {
  const tubes = useMemo(() => {
    const mk = (pts: number[][], r: number) => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), 160, r, 10, false);
    return [
      mk([[-9, 0.2, -4], [-4, 0.9, -3.2], [0, 0.4, -3.6], [4, 1.4, -3], [9, 2.6, -4.5]], 0.025),
      mk([[-9, 3.6, -5], [-3, 3.1, -3.8], [1, 3.6, -4.2], [5, 2.5, -3.4], [9, 3.2, -5]], 0.018),
      mk([[-9, 1.6, -6], [-2, 2.3, -5], [3, 0.8, -5.4], [9, 1.8, -6]], 0.03),
    ];
  }, []);
  const g = useRef<THREE.Group>(null);
  useFrame((st) => {
    if (g.current) g.current.position.x = Math.sin(st.clock.elapsedTime * 0.15) * 0.6;
  });
  return (
    <group ref={g}>
      {tubes.map((geo, k) => (
        <mesh key={k} geometry={geo}>
          <meshBasicMaterial color={k === 1 ? '#ffd0a6' : '#ff6b1a'} toneMapped={false} />
        </mesh>
      ))}
    </group>
  );
}

function Rig({ cam }: { cam: THREE.Vector3 }) {
  const { camera, pointer } = useThree();
  const { size } = useThree();
  const narrow = size.width / size.height < 0.9;
  const target = useMemo(() => new THREE.Vector3(0, narrow ? 2.45 : 1.15, -1), [narrow]);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useFrame((st, dt) => {
    const t = st.clock.elapsedTime;
    const intro = reduced ? 1 : Math.min(1, t / 2.2);
    const e = 1 - Math.pow(1 - intro, 3);
    const z = cam.z + (1 - e) * 4;
    const x = cam.x + pointer.x * 0.9;
    const y = cam.y + pointer.y * 0.35;
    camera.position.x = THREE.MathUtils.damp(camera.position.x, x, 3, dt);
    camera.position.y = THREE.MathUtils.damp(camera.position.y, y, 3, dt);
    camera.position.z = THREE.MathUtils.damp(camera.position.z, z, 4, dt);
    camera.lookAt(target);
  });
  return null;
}

function Scene({ screens, onOpen }: { screens: Screen[]; onOpen: (h: string) => void }) {
  const { cam, slots, scale } = useLayout();
  const [hovered, setHovered] = useState<string | null>(null);
  return (
    <>
      <color attach="background" args={['#0a0908']} />
      <fog attach="fog" args={['#0a0908', 9, 22]} />
      <ambientLight intensity={0.25} />
      <pointLight position={[0, 4, 2]} intensity={18} color="#ffb27a" distance={14} />
      <pointLight position={[-6, 1, -2]} intensity={10} color="#ff6b1a" distance={12} />
      <pointLight position={[6, 1, -2]} intensity={10} color="#ff6b1a" distance={12} />
      <Environment resolution={256} frames={1}>
        <Lightformer form="rect" intensity={3} color="#ffffff" position={[0, 5, -6]} scale={[12, 2, 1]} />
        <Lightformer form="rect" intensity={6} color="#ff7a2a" position={[-6, 1, 2]} rotation-y={Math.PI / 2} scale={[8, 1, 1]} />
        <Lightformer form="rect" intensity={4} color="#ffd2ad" position={[6, 2, 1]} rotation-y={-Math.PI / 2} scale={[8, 1.5, 1]} />
      </Environment>
      <Suspense fallback={null}>
        {screens.map((s, i) => (
          <Panel key={s.id} s={s} slot={slots[i]} index={i} base={scale} onOpen={onOpen} hovered={hovered} setHovered={setHovered} />
        ))}
      </Suspense>
      <Trails />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[60, 40]} />
        <MeshReflectorMaterial resolution={1024} mirror={0.75} blur={[400, 120]} mixBlur={1.4} mixStrength={2.4} depthScale={1.1} minDepthThreshold={0.4} maxDepthThreshold={1.3} color="#0d0b0a" metalness={0.6} roughness={0.85} />
      </mesh>
      <Rig cam={cam} />
      <EffectComposer multisampling={0}>
        <Bloom mipmapBlur luminanceThreshold={0.85} luminanceSmoothing={0.2} intensity={1.1} />
        <Vignette eskil={false} offset={0.2} darkness={0.75} />
      </EffectComposer>
    </>
  );
}

export default function Showcase3D({ screens, onOpen }: { screens: Screen[]; onOpen: (h: string) => void }) {
  return (
    <Canvas
      dpr={[1, 1.6]}
      camera={{ position: [0, 1.75, 12], fov: 42, near: 0.1, far: 60 }}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.1;
      }}
      onPointerMissed={() => (document.body.style.cursor = '')}
    >
      <Scene screens={screens} onOpen={onOpen} />
    </Canvas>
  );
}
