import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { motion } from "framer-motion";

// --- 3D Discs Wave Component ---
const WaveDiscs = () => {
  const groupRef = useRef();
  const count = 30;

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((mesh, i) => {
        const offset = i * 0.2;
        mesh.position.y = Math.sin(time * 2 + offset) * 0.7;
        mesh.position.z = Math.cos(time * 1.5 + offset) * 0.5;
        mesh.rotation.x = Math.sin(time + offset) * 0.4;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {[...Array(count)].map((_, i) => (
        <mesh key={i} position={[(i - count / 2) * 0.35, 0, 0]}>
          <cylinderGeometry args={[1.3, 1.3, 0.05, 64]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#9333ea" : "#2563eb"}
            emissive={i % 2 === 0 ? "#7e22ce" : "#1d4ed8"}
            emissiveIntensity={5}
            transparent={true}
            opacity={0.8}
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
      alert("Fields cannot be empty!");
    }
  };

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      backgroundColor: "#020205",
      position: "fixed", 
      top: 0,
      left: 0,
      overflow: "hidden",
      zIndex: 1
    }}>
      {/* 3D CANVAS LAYER - Z-Index 1 */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 2,
        pointerEvents: "none" 
      }}>
        <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <pointLight position={[-10, -10, -10]} intensity={1} color="#3b82f6" />
          <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
            <WaveDiscs />
          </Float>
        </Canvas>
      </div>

      {/* UI OVERLAY - Z-Index 10 */}
      <div style={{
        position: "relative",
        zIndex: 10,
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
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
            borderRadius: "32px",
            padding: "50px",
            width: "90%",
            maxWidth: "450px",
            textAlign: "center",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}
        >
          <h1 style={{ color: "#fff", fontSize: "2.8rem", fontWeight: "900", margin: 0 }}>
            WATCH<span style={{color: "#3b82f6"}}>PARTY</span>
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", letterSpacing: "3px", marginBottom: "30px" }}>
            ADVANCED AI INFRASTRUCTURE
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input 
              style={inputStyle} 
              placeholder="Username" 
              onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
              style={inputStyle} 
              placeholder="Room ID" 
              onChange={(e) => setRoom(e.target.value)} 
            />
            <input 
              style={inputStyle} 
              placeholder="Video Link" 
              onChange={(e) => setVideoUrl(e.target.value)} 
            />
            <motion.button 
              whileHover={{ scale: 1.05, background: "#fff", color: "#000" }}
              whileTap={{ scale: 0.95 }}
              style={buttonStyle}
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