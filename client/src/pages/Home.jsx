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

const isValidYouTubeUrl = (url) => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?.*v=[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]{11}/,
    /^(https?:\/\/)?m\.youtube\.com\/watch\?.*v=[\w-]{11}/,
  ];
  return patterns.some((pattern) => pattern.test(url.trim()));
};

// --- Content Data (English + Hinglish) ---
const content = {
  en: {
    sectionTitle: "How to Use",
    sectionSubtitle: "Everything you need to know to get started",
    features: [
      { icon: "🎬", title: "Synchronized Playback", desc: "Watch YouTube videos together in perfect sync. When anyone plays, pauses, or seeks — everyone follows in real time." },
      { icon: "💬", title: "Live Chat", desc: "Chat with your friends while watching. Share reactions, comments, and moments — all in real-time alongside the video." },
      { icon: "🔗", title: "Easy Room Sharing", desc: "Create a room with a unique ID and share it with anyone. They just enter the same Room ID to join your watch party instantly." }
    ],
    stepsTitle: "Getting Started",
    steps: [
      { num: "01", title: "Pick a Username", desc: "Enter any display name you want your friends to see in the chat." },
      { num: "02", title: "Create or Join a Room", desc: "Type a Room ID — any word or number. Share this ID with friends so they can join the same room." },
      { num: "03", title: "Paste a YouTube Link", desc: "Copy a YouTube video URL and paste it in the Video Link field. Only valid YouTube links are accepted." },
      { num: "04", title: "Start Watching!", desc: "Click 'Initialize System' and you're in! Play/pause syncs automatically across all viewers." }
    ],
    toggleLabel: "Translate to Hinglish"
  },
  hi: {
    sectionTitle: "Kaise Use Karein",
    sectionSubtitle: "Shuru karne ke liye aapko jo bhi jaanna zaruri hai",
    features: [
      { icon: "🎬", title: "Synchronized Playback", desc: "YouTube videos saath mein sync mein dekho. Jab koi bhi play, pause ya seek kare — sabko real time mein same change dikhta hai." },
      { icon: "💬", title: "Live Chat", desc: "Video dekhte waqt apne doston ke saath chat karo. Reactions, comments aur moments — sab kuch real-time mein share karo." },
      { icon: "🔗", title: "Aasan Room Sharing", desc: "Ek unique ID ke saath room banao aur kisi ko bhi share karo. Unhe bas same Room ID daalna hoga aur wo turant join kar lenge." }
    ],
    stepsTitle: "Shuru Kaise Karein",
    steps: [
      { num: "01", title: "Username Daalo", desc: "Koi bhi display name daalo jo tumhare dost chat mein dekhein." },
      { num: "02", title: "Room Banao ya Join Karo", desc: "Koi bhi Room ID likho — koi word ya number. Ye ID apne friends ke saath share karo taaki wo same room join kar sakein." },
      { num: "03", title: "YouTube Link Paste Karo", desc: "YouTube video ka URL copy karo aur Video Link field mein paste karo. Sirf valid YouTube links accept hoti hain." },
      { num: "04", title: "Dekhna Shuru Karo!", desc: "'Initialize System' pe click karo aur bas! Play/pause automatically sabke liye sync hota hai." }
    ],
    toggleLabel: "Translate to English"
  }
};

const glassCard = {
  background: "rgba(255, 255, 255, 0.02)",
  backdropFilter: "blur(25px)",
  WebkitBackdropFilter: "blur(25px)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
};

const Home = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGlow, setShowGlow] = useState(false);
  const [isHinglish, setIsHinglish] = useState(false);
  const helpRef = useRef(null);
  const navigate = useNavigate();

  const t = isHinglish ? content.hi : content.en;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const handleVideoUrlChange = (e) => {
    const val = e.target.value;
    setVideoUrl(val);
    if (val && !isValidYouTubeUrl(val)) {
      setLinkError("Please enter a valid YouTube video link");
    } else {
      setLinkError("");
    }
  };

  const joinRoom = () => {
    if (!username || !room || !videoUrl) {
      alert("Fields cannot be empty!");
      return;
    }
    if (!isValidYouTubeUrl(videoUrl)) {
      setLinkError("Please enter a valid YouTube video link");
      return;
    }
    localStorage.setItem("wp_username", username);
    localStorage.setItem("wp_videoUrl", videoUrl);
    navigate(`/stream/${room}`);
  };

  const scrollToHelp = () => {
    helpRef.current?.scrollIntoView({ behavior: "smooth" });
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

      {/* NAVBAR OVERLAY */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 20,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: isMobile ? "14px 20px" : "18px 40px",
          background: "rgba(0, 0, 0, 0.35)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          pointerEvents: "auto"
        }}
      >
        <h2 style={{
          margin: 0,
          fontSize: isMobile ? "1.1rem" : "1.4rem",
          fontWeight: "900",
          color: "#fff",
          letterSpacing: "1px"
        }}>
          WATCH<span style={{ color: "#3b82f6" }}>PARTY</span>
        </h2>
        <div style={{
          fontSize: isMobile ? "0.65rem" : "0.7rem",
          color: "rgba(255,255,255,0.35)",
          letterSpacing: "2px",
          fontWeight: "500"
        }}>
          SYNC · WATCH · CHAT
        </div>
      </motion.nav>

      {/* UI OVERLAY — SCROLLABLE CONTENT OVER FIXED BG */}
      <div style={{
        position: "relative",
        zIndex: 10,
        height: "100%",
        overflowY: "auto",
        overflowX: "hidden",
        pointerEvents: "auto"
      }}>
        {/* === FIRST SCREEN: Login Card centered === */}
        <div style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: isMobile ? "80px 20px 30px" : "0 20px"
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            style={{
              ...glassCard,
              borderRadius: isMobile ? "20px" : "32px",
              padding: isMobile ? "28px 22px" : "50px",
              width: "90%",
              maxWidth: isMobile ? "340px" : "450px",
              textAlign: "center"
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
              marginBottom: isMobile ? "18px" : "30px"
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
              <div>
                <input
                  style={{
                    ...inputStyle,
                    padding: isMobile ? "12px" : "16px",
                    borderRadius: isMobile ? "10px" : "14px",
                    fontSize: isMobile ? "14px" : "16px",
                    width: "100%",
                    border: linkError ? "1px solid rgba(239, 68, 68, 0.6)" : "1px solid rgba(255, 255, 255, 0.1)"
                  }}
                  placeholder="YouTube Video Link"
                  onChange={handleVideoUrlChange}
                />
                {linkError && (
                  <p style={{
                    color: "#ef4444",
                    fontSize: "0.75rem",
                    margin: "6px 0 0 4px",
                    textAlign: "left"
                  }}>
                    ⚠ {linkError}
                  </p>
                )}
              </div>
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

          {/* Scroll Down Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            onClick={scrollToHelp}
            style={{
              marginTop: isMobile ? "25px" : "35px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer"
            }}
          >
            <span style={{
              fontSize: isMobile ? "0.65rem" : "0.75rem",
              color: "rgba(255,255,255,0.4)",
              letterSpacing: "2px",
              fontWeight: "500",
              textTransform: "uppercase"
            }}>
              Scroll down for help
            </span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: "22px",
                height: "36px",
                borderRadius: "11px",
                border: "2px solid rgba(255,255,255,0.2)",
                display: "flex",
                justifyContent: "center",
                paddingTop: "7px"
              }}
            >
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3], y: [0, 10, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: "3px",
                  height: "7px",
                  borderRadius: "2px",
                  background: "rgba(255,255,255,0.5)"
                }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* === SECOND SCREEN: How to Use Section === */}
        <div ref={helpRef} style={{
          padding: isMobile ? "50px 20px 60px" : "80px 40px 100px",
          maxWidth: "1000px",
          margin: "0 auto",
          display: "flex",
          flexDirection: "column",
          alignItems: "center"
        }}>

          {/* Language Toggle */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsHinglish(!isHinglish)}
            style={{
              ...glassCard,
              borderRadius: "12px",
              padding: isMobile ? "8px 16px" : "10px 22px",
              color: "#a5b4fc",
              fontSize: isMobile ? "0.7rem" : "0.8rem",
              fontWeight: "600",
              cursor: "pointer",
              letterSpacing: "1px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: isMobile ? "30px" : "45px",
              transition: "all 0.3s ease"
            }}
          >
            🌐 {t.toggleLabel}
          </motion.button>

          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: isMobile ? "30px" : "50px" }}
          >
            <h2 style={{
              fontSize: isMobile ? "1.8rem" : "2.6rem",
              fontWeight: "900",
              color: "#fff",
              margin: "0 0 10px 0"
            }}>
              {t.sectionTitle.split(" ").map((word, i, arr) => (
                <span key={i}>
                  {i > 0 && " "}
                  {i === arr.length - 1
                    ? <span style={{ color: "#3b82f6" }}>{word}</span>
                    : word}
                </span>
              ))}
            </h2>
            <p style={{
              color: "rgba(255,255,255,0.35)",
              fontSize: isMobile ? "0.8rem" : "1rem",
              maxWidth: "450px",
              margin: "0 auto",
              lineHeight: "1.6"
            }}>
              {t.sectionSubtitle}
            </p>
          </motion.div>

          {/* Feature Cards — Same glass style as login */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? "14px" : "20px",
            width: "100%",
            marginBottom: isMobile ? "40px" : "60px"
          }}>
            {t.features.map((f, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                whileHover={{ y: -4, transition: { duration: 0.2 } }}
                style={{
                  ...glassCard,
                  borderRadius: isMobile ? "18px" : "24px",
                  padding: isMobile ? "24px 20px" : "32px 28px",
                  cursor: "default"
                }}
              >
                <div style={{ fontSize: "2rem", marginBottom: "14px" }}>
                  {f.icon}
                </div>
                <h3 style={{
                  color: "#f1f5f9",
                  fontSize: isMobile ? "1rem" : "1.1rem",
                  fontWeight: "700",
                  margin: "0 0 8px 0"
                }}>
                  {f.title}
                </h3>
                <p style={{
                  color: "rgba(255,255,255,0.4)",
                  fontSize: isMobile ? "0.8rem" : "0.88rem",
                  lineHeight: "1.6",
                  margin: 0
                }}>
                  {f.desc}
                </p>
              </motion.div>
            ))}
          </div>

          {/* Steps Title */}
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.5 }}
            style={{
              fontSize: isMobile ? "1.4rem" : "1.8rem",
              fontWeight: "800",
              color: "#fff",
              textAlign: "center",
              marginBottom: isMobile ? "24px" : "35px"
            }}
          >
            {t.stepsTitle}
          </motion.h3>

          {/* Steps — Same glass style */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: isMobile ? "12px" : "18px",
            width: "100%"
          }}>
            {t.steps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: idx % 2 === 0 ? -15 : 15 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: false, amount: 0.1 }}
                transition={{ duration: 0.4, delay: idx * 0.1 }}
                style={{
                  ...glassCard,
                  borderRadius: isMobile ? "14px" : "18px",
                  padding: isMobile ? "18px 16px" : "22px 24px",
                  display: "flex",
                  gap: isMobile ? "12px" : "16px",
                  alignItems: "flex-start"
                }}
              >
                <div style={{
                  minWidth: isMobile ? "36px" : "44px",
                  height: isMobile ? "36px" : "44px",
                  borderRadius: "12px",
                  background: "linear-gradient(135deg, rgba(124,58,237,0.25), rgba(59,130,246,0.25))",
                  border: "1px solid rgba(124,58,237,0.25)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: isMobile ? "0.8rem" : "0.95rem",
                  fontWeight: "800",
                  color: "#a5b4fc"
                }}>
                  {step.num}
                </div>
                <div>
                  <h4 style={{
                    color: "#e2e8f0",
                    fontSize: isMobile ? "0.9rem" : "1rem",
                    fontWeight: "700",
                    margin: "0 0 5px 0"
                  }}>
                    {step.title}
                  </h4>
                  <p style={{
                    color: "rgba(255,255,255,0.38)",
                    fontSize: isMobile ? "0.78rem" : "0.85rem",
                    lineHeight: "1.55",
                    margin: 0
                  }}>
                    {step.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footer */}
          <div style={{
            marginTop: isMobile ? "45px" : "65px",
            textAlign: "center",
            paddingTop: "25px",
            borderTop: "1px solid rgba(255,255,255,0.05)",
            width: "100%"
          }}>
            <p style={{
              color: "rgba(255,255,255,0.18)",
              fontSize: "0.7rem",
              letterSpacing: "2px"
            }}>
              WATCHPARTY — Watch Together, Anywhere
            </p>
          </div>
        </div>
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