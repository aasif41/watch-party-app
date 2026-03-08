import React, { useState, useRef, useMemo, useEffect, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

// --- Inject CSS keyframes for glitch background ---
const glitchCSS = `
@keyframes scanline {
  0% { transform: translateY(-100%); }
  100% { transform: translateY(100vh); }
}
@keyframes gridPulse {
  0%, 100% { opacity: 0.04; }
  50% { opacity: 0.08; }
}
@keyframes glitchFlicker {
  0%, 92%, 94%, 96%, 100% { opacity: 0; }
  93% { opacity: 0.15; transform: translate(-2px, 1px); }
  95% { opacity: 0.1; transform: translate(2px, -1px); }
}
@keyframes noiseMove {
  0% { background-position: 0 0; }
  100% { background-position: 100px 100px; }
}
@keyframes gradientShift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}
`;

// Inject CSS once
if (typeof document !== "undefined" && !document.getElementById("glitch-css")) {
  const style = document.createElement("style");
  style.id = "glitch-css";
  style.textContent = glitchCSS;
  document.head.appendChild(style);
}

// --- Subtle Floating Particles ---
const Particles = ({ count = 80 }) => {
  const meshRef = useRef();
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 50;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 30;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15;
    }
    return pos;
  }, [count]);

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = state.clock.getElapsedTime() * 0.008;
      meshRef.current.rotation.x = Math.sin(state.clock.getElapsedTime() * 0.003) * 0.1;
    }
  });

  return (
    <points ref={meshRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial size={0.04} color="#818cf8" transparent opacity={0.35} sizeAttenuation />
    </points>
  );
};

// --- Floating Background Orbs ---
// Softly glowing transparent spheres drifting slowly in the background
const BackgroundOrbs = () => {
  const groupRef = useRef();
  const orbCount = 6;

  const orbData = useMemo(() => {
    return Array.from({ length: orbCount }, (_, i) => ({
      x: (Math.random() - 0.5) * 24,
      y: (Math.random() - 0.5) * 12,
      z: -3 - Math.random() * 8,
      scale: 0.3 + Math.random() * 0.6,
      speed: 0.1 + Math.random() * 0.15,
      phase: Math.random() * Math.PI * 2,
    }));
  }, []);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    groupRef.current.children.forEach((mesh, i) => {
      const d = orbData[i];
      mesh.position.x = d.x + Math.sin(time * d.speed + d.phase) * 2;
      mesh.position.y = d.y + Math.cos(time * d.speed * 0.7 + d.phase) * 1.5;
      mesh.position.z = d.z + Math.sin(time * 0.1 + d.phase) * 0.5;

      // Soft pulsing opacity
      const pulse = 0.06 + Math.sin(time * 0.4 + d.phase) * 0.03;
      if (mesh.material) {
        mesh.material.opacity = pulse;
        // Subtle color shift
        const hue = (0.7 + Math.sin(time * 0.15 + i * 0.5) * 0.08) % 1;
        mesh.material.emissive.setHSL(hue, 0.6, 0.3);
      }
    });
  });

  return (
    <group ref={groupRef}>
      {orbData.map((d, i) => (
        <mesh key={i} position={[d.x, d.y, d.z]} scale={d.scale}>
          <sphereGeometry args={[1.5, 16, 16]} />
          <meshStandardMaterial
            color="#6366f1"
            emissive="#7c3aed"
            emissiveIntensity={1.5}
            transparent={true}
            opacity={0.06}
            side={THREE.FrontSide}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
};

// --- Moving Neon Glow Light ---
const GlowLight = () => {
  const lightRef = useRef();

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (lightRef.current) {
      const count = 30;
      const spacing = 0.75;
      const spotIndex = (Math.sin(time * 0.2) * 0.5 + 0.5) * count;
      const x = (spotIndex - count / 2) * spacing;
      const y = Math.sin(time * 0.5 + spotIndex * 0.25) * 1.3;
      lightRef.current.position.set(x, y, 2);

      const colorWave = time * 0.35 + spotIndex * 0.1;
      const hue = (0.73 + Math.sin(colorWave) * 0.08) % 1;
      lightRef.current.color.setHSL(hue, 0.8, 0.6);
    }
  });

  return (
    <pointLight
      ref={lightRef}
      intensity={8}
      distance={12}
      color="#7c3aed"
    />
  );
};

// --- AIAF-Style Wave Discs ---
const WaveDiscs = () => {
  const groupRef = useRef();
  const count = 30;
  const spacing = 0.75;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (!groupRef.current) return;

    const spotCenter = (Math.sin(time * 0.2) * 0.5 + 0.5) * count;

    groupRef.current.children.forEach((mesh, i) => {
      const offset = i * 0.22;

      mesh.position.y = Math.sin(time * 0.5 + offset) * 1.3;

      const colorWave = time * 0.35 + i * 0.1;
      const hue = (0.73 + Math.sin(colorWave) * 0.08 + Math.cos(colorWave * 0.6) * 0.04) % 1;

      const distFromSpot = Math.abs(i - spotCenter);
      const glow = Math.max(0, 1 - distFromSpot * 0.12);

      const lightness = 0.3 + glow * 0.4;
      const saturation = 0.55 - glow * 0.3;

      if (mesh.material) {
        mesh.material.color.setHSL(hue, saturation, lightness);
        mesh.material.emissive.setHSL(hue, saturation * 0.65, lightness * 0.35);
        mesh.material.emissiveIntensity = 0.4 + glow * 2.5;
      }
    });
  });

  const getDiscPosition = (i) => {
    const x = (i - count / 2) * spacing;
    const t = (i - count / 2) / (count / 2);
    const z = t * t * 4;
    return [x, 0, z];
  };

  return (
    <group ref={groupRef} position={[0, -0.3, 0]}>
      {[...Array(count)].map((_, i) => {
        const pos = getDiscPosition(i);
        return (
          <mesh
            key={i}
            position={pos}
            rotation={[0, 0, Math.PI / 2]}
          >
            <cylinderGeometry args={[2.2, 2.2, 0.04, 64]} />
            <meshStandardMaterial
              color="#7c3aed"
              emissive="#4f46e5"
              emissiveIntensity={0.5}
              transparent={true}
              opacity={0.88}
              side={THREE.DoubleSide}
              roughness={0.25}
              metalness={0.8}
              toneMapped={false}
            />
          </mesh>
        );
      })}
    </group>
  );
};

const Home = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGlow, setShowGlow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const joinRoom = () => {
    if (username && room && videoUrl) {
      localStorage.setItem("wp_username", username);
      localStorage.setItem("wp_videoUrl", videoUrl);
      navigate(`/stream/${room}`);
    } else {
      alert("Fields cannot be empty!");
    }
  };

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      backgroundColor: "#0a0a1a",
      position: "fixed",
      top: 0,
      left: 0,
      overflow: "hidden",
      zIndex: 1
    }}
      onMouseMove={(e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        setShowGlow(true);
      }}
      onMouseLeave={() => setShowGlow(false)}
    >
      {/* === MOUSE HOVER GLOW === */}
      {showGlow && !isMobile && (
        <div style={{
          position: "absolute",
          left: mousePos.x - 150,
          top: mousePos.y - 150,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(${120 + Math.sin(mousePos.x * 0.005) * 60}, ${80 + Math.cos(mousePos.y * 0.005) * 80}, ${200 + Math.sin((mousePos.x + mousePos.y) * 0.003) * 55}, 0.12) 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 1,
          transition: "left 0.08s ease-out, top 0.08s ease-out",
          filter: "blur(30px)",
          mixBlendMode: "screen"
        }} />
      )}

      {/* === GLITCH BACKGROUND LAYERS === */}

      {/* Layer 1: Subtle animated gradient */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        background: "radial-gradient(ellipse at 30% 50%, rgba(124,58,237,0.08) 0%, transparent 50%), radial-gradient(ellipse at 70% 50%, rgba(59,130,246,0.06) 0%, transparent 50%)",
        backgroundSize: "200% 200%",
        animation: "gradientShift 12s ease-in-out infinite",
        pointerEvents: "none"
      }} />

      {/* Layer 2: Horizontal scan lines */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(124,58,237,0.03) 2px, rgba(124,58,237,0.03) 4px)",
        pointerEvents: "none"
      }} />

      {/* Layer 3: Moving scan beam */}
      <div style={{
        position: "absolute",
        left: 0,
        width: "100%",
        height: "6px",
        zIndex: 1,
        background: "linear-gradient(180deg, transparent, rgba(124,58,237,0.12), transparent)",
        animation: "scanline 6s linear infinite",
        pointerEvents: "none"
      }} />

      {/* Layer 4: Grid pattern */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        backgroundImage: `linear-gradient(rgba(124,58,237,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(124,58,237,0.04) 1px, transparent 1px)`,
        backgroundSize: isMobile ? "30px 30px" : "50px 50px",
        animation: "gridPulse 4s ease-in-out infinite",
        pointerEvents: "none"
      }} />

      {/* Layer 5: Occasional glitch flicker */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        background: "linear-gradient(90deg, transparent 0%, rgba(124,58,237,0.1) 15%, transparent 30%)",
        animation: "glitchFlicker 3s ease-in-out infinite",
        pointerEvents: "none"
      }} />

      {/* 3D CANVAS */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        pointerEvents: "none"
      }}>
        <Canvas
          camera={{ position: [0, 0.5, isMobile ? 18 : 14], fov: isMobile ? 60 : 55 }}
          dpr={[1, isMobile ? 1.5 : 2]}
          gl={{ antialias: true, alpha: false }}
          style={{ width: "100%", height: "100%" }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.1;
          }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.12} />
            <directionalLight position={[6, 8, 8]} intensity={2.2} color="#ede9fe" />
            <pointLight position={[-10, 0, 5]} intensity={1.8} color="#7c3aed" distance={35} />
            <pointLight position={[0, -3, -8]} intensity={1.0} color="#3b82f6" distance={25} />
            <spotLight
              position={[0, 5, 12]}
              angle={0.7}
              penumbra={0.8}
              intensity={2.5}
              color="#ffffff"
              distance={25}
            />

            <Float speed={0.8} rotationIntensity={0.02} floatIntensity={0.04}>
              <WaveDiscs />
            </Float>

            <GlowLight />
            <BackgroundOrbs />
            <Particles />
          </Suspense>
        </Canvas>
      </div>

      {/* UI OVERLAY — FULLY RESPONSIVE */}
      <div style={{
        position: "relative",
        zIndex: 10,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: isMobile ? "20px" : "0",
        pointerEvents: "auto"
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1 }}
          style={{
            background: "rgba(255, 255, 255, 0.02)",
            backdropFilter: "blur(25px)",
            WebkitBackdropFilter: "blur(25px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            borderRadius: isMobile ? "20px" : "32px",
            padding: isMobile ? "30px 24px" : "50px",
            width: "90%",
            maxWidth: isMobile ? "340px" : "450px",
            textAlign: "center",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}
        >
          <h1 style={{
            color: "#fff",
            fontSize: isMobile ? "1.8rem" : "2.8rem",
            fontWeight: "900",
            margin: 0
          }}>
            WATCH<span style={{ color: "#3b82f6" }}>PARTY</span>
          </h1>
          <p style={{
            color: "rgba(255,255,255,0.4)",
            fontSize: isMobile ? "0.6rem" : "0.8rem",
            letterSpacing: isMobile ? "2px" : "3px",
            marginBottom: isMobile ? "20px" : "30px"
          }}>
            ADVANCED AI INFRASTRUCTURE
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "10px" : "15px" }}>
            <input
              style={{
                ...inputStyle,
                padding: isMobile ? "12px" : "16px",
                borderRadius: isMobile ? "10px" : "14px",
                fontSize: isMobile ? "14px" : "16px"
              }}
              placeholder="Username"
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              style={{
                ...inputStyle,
                padding: isMobile ? "12px" : "16px",
                borderRadius: isMobile ? "10px" : "14px",
                fontSize: isMobile ? "14px" : "16px"
              }}
              placeholder="Room ID"
              onChange={(e) => setRoom(e.target.value)}
            />
            <input
              style={{
                ...inputStyle,
                padding: isMobile ? "12px" : "16px",
                borderRadius: isMobile ? "10px" : "14px",
                fontSize: isMobile ? "14px" : "16px"
              }}
              placeholder="Video Link"
              onChange={(e) => setVideoUrl(e.target.value)}
            />
            <motion.button
              whileHover={{ scale: 1.05, background: "#fff", color: "#000" }}
              whileTap={{ scale: 0.95 }}
              style={{
                ...buttonStyle,
                padding: isMobile ? "14px" : "18px",
                borderRadius: isMobile ? "10px" : "14px",
                fontSize: isMobile ? "13px" : "16px"
              }}
              onClick={joinRoom}
            >
              INITIALIZE SYSTEM
            </motion.button>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: "16px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "14px",
  color: "#fff",
  outline: "none"
};

const buttonStyle = {
  padding: "18px",
  background: "transparent",
  color: "#fff",
  border: "1px solid #fff",
  borderRadius: "14px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "10px"
};

export default Home;