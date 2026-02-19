import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";
import * as THREE from "three";

// 3D Discs Wave Component
const WaveDiscs = () => {
  const groupRef = useRef();
  const count = 25; // Kitni discs chahiye

  // Har frame par discs ki position aur rotation update karna (Wave Effect)
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    groupRef.current.children.forEach((mesh, i) => {
      // Wave motion logic
      const offset = i * 0.15;
      mesh.position.y = Math.sin(time * 2 + offset) * 0.5;
      mesh.position.z = Math.cos(time * 1.5 + offset) * 0.3;
      
      // Rotation effect
      mesh.rotation.x = Math.sin(time + offset) * 0.2;
      mesh.rotation.y = time * 0.5;
    });
  });

  return (
    <group ref={groupRef}>
      {[...Array(count)].map((_, i) => (
        <mesh key={i} position={[(i - count / 2) * 0.35, 0, 0]}>
          {/* Disc Shape */}
          <cylinderGeometry args={[1, 1, 0.05, 64]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#8b5cf6" : "#3b82f6"} // Purple aur Blue mix
            emissive={i % 2 === 0 ? "#7c3aed" : "#2563eb"}
            emissiveIntensity={2}
            transparent={true}
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
};

const Home = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (username && room && videoUrl) {
      localStorage.setItem("wp_username", username);
      localStorage.setItem("wp_videoUrl", videoUrl);
      navigate(`/stream/${room}`);
    } else {
      alert("Fields cannot be empty! 🚀");
    }
  };

  return (
    <div style={styles.container}>
      {/* Three.js Background Layer */}
      <div style={styles.canvasWrapper}>
        <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
          <ambientLight intensity={0.2} />
          <pointLight position={[10, 10, 10]} intensity={1.5} color="#fff" />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
          
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <WaveDiscs />
          </Float>
        </Canvas>
      </div>

      {/* Modern UI Overlay */}
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        className="ui-content"
        style={styles.uiOverlay}
      >
        <div style={styles.glassCard}>
          <h1 style={styles.title}>WATCH<span style={{color: "#3b82f6"}}>PARTY</span></h1>
          <p style={styles.tagline}>Advanced Infrastructure for Streaming</p>
          
          <div style={styles.inputGroup}>
            <input 
              style={styles.input} 
              placeholder="Display Name" 
              onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
              style={styles.input} 
              placeholder="Room ID" 
              onChange={(e) => setRoom(e.target.value)} 
            />
            <input 
              style={styles.input} 
              placeholder="Paste Video URL" 
              onChange={(e) => setVideoUrl(e.target.value)} 
            />
          </div>

          <motion.button 
            whileHover={{ scale: 1.02, backgroundColor: "#fff", color: "#000" }}
            whileTap={{ scale: 0.98 }}
            style={styles.button}
            onClick={joinRoom}
          >
            INITIALIZE SESSION
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

// --- Professional Styling ---
const styles = {
  container: {
    height: "100vh",
    width: "100%",
    backgroundColor: "#050505", // Black background like the video
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif"
  },
  canvasWrapper: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1
  },
  uiOverlay: {
    position: "relative",
    zIndex: 10,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none" // Canvas click allow karne ke liye
  },
  glassCard: {
    background: "rgba(255, 255, 255, 0.01)",
    backdropFilter: "blur(15px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "32px",
    padding: "60px 50px",
    width: "100%",
    maxWidth: "460px",
    textAlign: "center",
    pointerEvents: "auto", // Elements click karne ke liye
    boxShadow: "0 20px 60px rgba(0,0,0,0.5)"
  },
  title: {
    color: "#fff",
    fontSize: "2.8rem",
    fontWeight: "900",
    letterSpacing: "-1px",
    marginBottom: "5px"
  },
  tagline: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.8rem",
    textTransform: "uppercase",
    letterSpacing: "3px",
    marginBottom: "40px"
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "15px",
    marginBottom: "30px"
  },
  input: {
    padding: "16px",
    background: "rgba(255,255,255,0.03)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "14px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "0.3s"
  },
  button: {
    width: "100%",
    padding: "18px",
    background: "transparent",
    color: "#fff",
    border: "1px solid #fff",
    borderRadius: "14px",
    fontWeight: "700",
    cursor: "pointer",
    transition: "0.3s"
  }
};

export default Home;