import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { MeshReflectorMaterial, RoundedBox } from '@react-three/drei';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';

export type Texture = 'matte' | 'satin' | 'gloss';
export type Light = 'none' | 'float' | 'lines' | 'spots';
export interface RoomProps {
  active?: boolean;
  texture: Texture;
  color: string;
  light: Light;
}

const W = 7;
const D = 6;
const H = 3;

function CameraRig() {
  const { camera, pointer, invalidate, gl } = useThree();
  useEffect(() => {
    const el = gl.domElement;
    const on = () => invalidate();
    el.addEventListener('pointermove', on);
    window.addEventListener('resize', on);
    return () => {
      el.removeEventListener('pointermove', on);
      window.removeEventListener('resize', on);
    };
  }, [gl, invalidate]);
  const target = useMemo(() => new THREE.Vector3(0, 1.75, -1.6), []);
  const reduced = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  useFrame((state, dt) => {
    const x = reduced ? 0 : pointer.x * 0.9;
    const y = 1.25 + (reduced ? 0 : pointer.y * 0.25);
    const k = Math.min(1, Math.max(dt, 1 / 60) * 3);
    camera.position.x += (x - camera.position.x) * k;
    camera.position.y += (y - camera.position.y) * k;
    camera.lookAt(target);
    if (Math.abs(x - camera.position.x) + Math.abs(y - camera.position.y) > 0.002) state.invalidate();
  });
  return null;
}

function Ceiling({ texture, color, light }: RoomProps) {
  const isDark = color === '#2b2c2f';
  return (
    <group>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, H, 0]}>
        <planeGeometry args={[W, D]} />
        {texture === 'gloss' ? (
          <MeshReflectorMaterial
            color={color}
            mirror={isDark ? 0.85 : 0.7}
            resolution={typeof window !== 'undefined' && window.innerWidth < 760 ? 256 : 512}
            blur={[0, 0]}
            mixBlur={0}
            mixStrength={isDark ? 3.2 : 1.6}
            roughness={0.12}
            metalness={0.15}
            depthScale={0}
          />
        ) : (
          <meshStandardMaterial color={color} roughness={texture === 'matte' ? 0.96 : 0.42} metalness={texture === 'satin' ? 0.12 : 0} />
        )}
      </mesh>

      {light === 'float' && (
        <group position={[0, H - 0.015, 0]}>
          {[
            [0, -D / 2 + 0.03, W - 0.1, 0.04],
            [0, D / 2 - 0.03, W - 0.1, 0.04],
          ].map(([x, z, w, d], k) => (
            <mesh key={'h' + k} position={[x, 0, z]}>
              <boxGeometry args={[w, 0.02, d]} />
              <meshBasicMaterial color="#fff3df" toneMapped={false} />
            </mesh>
          ))}
          {[-W / 2 + 0.03, W / 2 - 0.03].map((x, k) => (
            <mesh key={'v' + k} position={[x, 0, 0]}>
              <boxGeometry args={[0.04, 0.02, D - 0.1]} />
              <meshBasicMaterial color="#fff3df" toneMapped={false} />
            </mesh>
          ))}
          {[
            [-W / 2 + 0.4, -0.2, 0],
            [W / 2 - 0.4, -0.2, 0],
            [0, -0.2, -D / 2 + 0.4],
          ].map((p, k) => (
            <pointLight key={k} position={p as [number, number, number]} intensity={2.2} distance={4} color="#ffe2b8" />
          ))}
        </group>
      )}

      {light === 'lines' && (
        <group position={[0, H - 0.012, 0]}>
          {[
            { p: [-1.2, 0, 0], s: [0.05, 0.02, D - 0.6], r: 0 },
            { p: [1.2, 0, 0], s: [0.05, 0.02, D - 0.6], r: 0 },
            { p: [0, 0, -0.6], s: [W - 0.6, 0.02, 0.05], r: 0 },
            { p: [0.2, 0, 1.3], s: [3.2, 0.02, 0.05], r: 0.55 },
          ].map((l, k) => (
            <mesh key={k} position={l.p as [number, number, number]} rotation={[0, l.r, 0]}>
              <boxGeometry args={l.s as [number, number, number]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
          ))}
          <pointLight position={[-1.2, -0.3, 0]} intensity={3} distance={5} color="#f4f7ff" />
          <pointLight position={[1.2, -0.3, 0]} intensity={3} distance={5} color="#f4f7ff" />
        </group>
      )}

      {light === 'spots' && (
        <group position={[0, H - 0.01, 0]}>
          {[-2, 0, 2].flatMap((x) => [-1.5, 1].map((z) => [x, z])).map(([x, z], k) => (
            <group key={k} position={[x, 0, z]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <circleGeometry args={[0.07, 24]} />
                <meshBasicMaterial color="#fff6e8" toneMapped={false} side={THREE.DoubleSide} />
              </mesh>
            </group>
          ))}
          <pointLight position={[-1.5, -0.4, -0.2]} intensity={4} distance={5} color="#ffe9c9" />
          <pointLight position={[1.5, -0.4, -0.2]} intensity={4} distance={5} color="#ffe9c9" />
        </group>
      )}
    </group>
  );
}

function Furniture() {
  return (
    <group>
      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -0.6]}>
        <planeGeometry args={[3.4, 2.4]} />
        <meshStandardMaterial color="#cfc6b8" roughness={1} />
      </mesh>
      {/* sofa */}
      <group position={[0, 0, -2.3]}>
        <RoundedBox args={[2.8, 0.45, 0.95]} radius={0.08} position={[0, 0.32, 0]}>
          <meshStandardMaterial color="#5d6670" roughness={0.9} />
        </RoundedBox>
        <RoundedBox args={[2.8, 0.55, 0.22]} radius={0.08} position={[0, 0.78, -0.38]}>
          <meshStandardMaterial color="#5d6670" roughness={0.9} />
        </RoundedBox>
        {[-1.32, 1.32].map((x) => (
          <RoundedBox key={x} args={[0.2, 0.5, 0.95]} radius={0.06} position={[x, 0.55, 0]}>
            <meshStandardMaterial color="#56606a" roughness={0.9} />
          </RoundedBox>
        ))}
        {[-0.7, 0.75].map((x, k) => (
          <RoundedBox key={x} args={[0.45, 0.4, 0.14]} radius={0.06} position={[x, 0.75, -0.2]} rotation={[-0.2, 0, k ? 0.08 : -0.08]}>
            <meshStandardMaterial color={k ? '#c98a4b' : '#e3ddd3'} roughness={0.95} />
          </RoundedBox>
        ))}
      </group>
      {/* coffee table */}
      <mesh position={[0, 0.38, -0.7]}>
        <cylinderGeometry args={[0.55, 0.55, 0.04, 48]} />
        <meshStandardMaterial color="#f3f1ec" roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.18, -0.7]}>
        <cylinderGeometry args={[0.06, 0.06, 0.36, 16]} />
        <meshStandardMaterial color="#2a2a2a" roughness={0.4} />
      </mesh>
      {/* tv cabinet on right wall */}
      <group position={[W / 2 - 0.25, 0, -0.2]}>
        <mesh position={[0, 0.28, 0]}>
          <boxGeometry args={[0.45, 0.5, 2.6]} />
          <meshStandardMaterial color="#ece8e1" roughness={0.6} />
        </mesh>
        <mesh position={[0.18, 1.35, 0]}>
          <boxGeometry args={[0.04, 0.8, 1.4]} />
          <meshStandardMaterial color="#111214" roughness={0.25} metalness={0.3} />
        </mesh>
      </group>
      {/* plant */}
      <group position={[-W / 2 + 0.6, 0, -D / 2 + 0.6]}>
        <mesh position={[0, 0.25, 0]}>
          <cylinderGeometry args={[0.22, 0.17, 0.5, 24]} />
          <meshStandardMaterial color="#d9d3c9" roughness={0.8} />
        </mesh>
        {[
          [0, 0.95, 0, 0.42],
          [0.15, 1.3, 0.05, 0.3],
          [-0.12, 1.2, -0.08, 0.28],
        ].map(([x, y, z, r], k) => (
          <mesh key={k} position={[x, y, z]}>
            <icosahedronGeometry args={[r, 1]} />
            <meshStandardMaterial color="#4f6b45" roughness={0.9} flatShading />
          </mesh>
        ))}
      </group>
      {/* floor lamp */}
      <group position={[1.9, 0, -2.4]}>
        <mesh position={[0, 0.8, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 1.6, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 1.62, 0]}>
          <cylinderGeometry args={[0.16, 0.24, 0.3, 24, 1, true]} />
          <meshStandardMaterial color="#f1e7d6" emissive="#ffd9a3" emissiveIntensity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </group>
    </group>
  );
}

function Room(props: RoomProps) {
  const dim = props.light === 'none' ? 1 : 0.62;
  const ref = useRef<THREE.AmbientLight>(null);
  useFrame((st, dt) => {
    if (!ref.current) return;
    const gap = 0.55 * dim - ref.current.intensity;
    ref.current.intensity += gap * Math.min(1, Math.max(dt, 1 / 60) * 4);
    if (Math.abs(gap) > 0.002) st.invalidate();
  });
  return (
    <>
      <color attach="background" args={['#e9e6e0']} />
      <ambientLight ref={ref} intensity={0.55} />
      <hemisphereLight args={['#ffffff', '#b7a994', 0.55 * dim]} />
      {/* window light */}
      <directionalLight position={[-6, 3, 1]} intensity={1.6 * dim} color="#fff7ec" />
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#b98d63" roughness={0.55} />
      </mesh>
      {/* walls */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial color="#efebe5" roughness={0.95} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color="#e8e3dc" roughness={0.95} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial color="#e8e3dc" roughness={0.95} />
      </mesh>
      {/* window on left wall */}
      <mesh position={[-W / 2 + 0.01, 1.55, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[2.6, 1.9]} />
        <meshBasicMaterial color="#f7fbff" toneMapped={false} />
      </mesh>
      <mesh position={[-W / 2 + 0.02, 1.55, -0.4]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.04, 1.9]} />
        <meshStandardMaterial color="#d8d3cb" />
      </mesh>
      {/* skirting */}
      <mesh position={[0, 0.04, -D / 2 + 0.01]}>
        <boxGeometry args={[W, 0.08, 0.02]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
      <Furniture />
      <Ceiling {...props} />
      <CameraRig />
    </>
  );
}

export default function Room3D(props: RoomProps) {
  return (
    <Canvas
      frameloop={props.active === false ? 'never' : 'demand'}
      dpr={typeof window !== 'undefined' && window.innerWidth < 760 ? [1, 1.25] : [1, 1.75]}
      camera={{ position: [0, 1.25, 4.3], fov: 62, near: 0.05, far: 40 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.05;
      }}
    >
      <Room {...props} />
    </Canvas>
  );
}
