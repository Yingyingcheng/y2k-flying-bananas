"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function RetroHero() {
  const group = useRef<THREE.Group>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (group.current) {
      // 1. Classic N64 "Character Select" spin
      group.current.rotation.y = t * 0.8;
      // 2. Floating hover effect
      group.current.position.y = Math.sin(t * 2) * 0.2;
    }
  });

  return (
    <group ref={group}>
      {/* HEAD */}
      <mesh position={[0, 1.2, 0]}>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial color="#ffdbac" flatShading />
      </mesh>

      {/* HAT */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[0.7, 0.2, 0.7]} />
        <meshStandardMaterial color="#ff0000" flatShading />
      </mesh>

      {/* BODY (Overalls) */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.8, 1, 0.6]} />
        <meshStandardMaterial color="#0000ff" flatShading />
      </mesh>

      {/* ARMS */}
      <mesh position={[0.6, 0.7, 0]}>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color="#ff0000" flatShading />
      </mesh>
      <mesh position={[-0.6, 0.7, 0]}>
        <boxGeometry args={[0.3, 0.6, 0.3]} />
        <meshStandardMaterial color="#ff0000" flatShading />
      </mesh>

      {/* FEET / SHOES */}
      <mesh position={[0.25, -0.2, 0.1]}>
        <boxGeometry args={[0.4, 0.3, 0.5]} />
        <meshStandardMaterial color="#4b3621" flatShading />
      </mesh>
      <mesh position={[-0.25, -0.2, 0.1]}>
        <boxGeometry args={[0.4, 0.3, 0.5]} />
        <meshStandardMaterial color="#4b3621" flatShading />
      </mesh>
    </group>
  );
}

export default function BananaScene({ currentTheme }: { currentTheme: any }) {
  return (
    <div
      className="h-full w-full"
      style={{ backgroundColor: currentTheme.bgBanana }}
    >
      <Canvas camera={{ position: [0, 1, 5] }}>
        <ambientLight intensity={0.6} />
        <pointLight position={[10, 10, 10]} intensity={1.5} />

        {/* The Hero */}
        <RetroHero />

        {/* N64 Floor Grid */}
        <gridHelper
          args={[20, 20, "#ffffff", "#bcdfe3"]}
          position={[0, -0.5, 0]}
        />
      </Canvas>
    </div>
  );
}
