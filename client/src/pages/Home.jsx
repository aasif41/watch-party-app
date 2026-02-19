import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { Float } from "@react-three/drei";
import { motion } from "framer-motion";

// --- 3D Discs Wave Component ---
// Ye component video mein dikhne wali glowing discs banata hai
const WaveDiscs = () => {
  const groupRef = useRef();
  const count = 30; // Discs ki sankhya

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      groupRef.current.children.forEach((mesh, i) => {
        // Wave motion: i * 0.2 se har disc alag samay par move karti hai
        const offset = i * 0.2;
        mesh.position.y = Math.sin(time * 2 + offset) * 0.6;
        mesh.position.z = Math.cos(time * 1.5 + offset) * 0.4;
        
        // Soft rotation effect
        mesh.rotation.x = Math.sin(time + offset) * 0.3;
      });
    }
  });

  return (
    <group ref={groupRef}>
      {[...Array(count)].map((_, i) => (
        <mesh key={i} position={[(i - count / 2) * 0.3, 0, 0]}>
          {/* Disc geometry: Cylinder ko patla karke disc banayi gayi hai */}
          <cylinderGeometry args={[1.2, 1.2, 0.04, 64]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#a855f7" : "#3b82f6"} // Purple aur Blue mix
            emissive={i % 2 === 0 ? "#7e22ce" : "#1d4ed8"}
            emissiveIntensity={4}
            transparent={true}
            opacity={0.7}
          />
        </mesh>
      ))}
    </group>
  );
};

// --- Main Home Component ---
const Home = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (username !== "" && room !== "" && videoUrl !== "") {
      // Refresh hone par data recover karne ke liye localStorage ka use
      localStorage.setItem("wp_username", username);
      localStorage.setItem("wp_videoUrl", videoUrl);
      
      // Dynamic route par navigate karna
      navigate(`/stream/${room}`);
    } else {
      alert("Please fill all fields to initialize streaming!");
    }
  };

  return (
    <div style={styles.container}>
      {/* Three.js Canvas Layer (Background) */}
      <div style={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 10], fov: 45 }}>
          <ambientLight intensity={0.4} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <pointLight position={[-10, -10, -10]} intensity={0.5} color="#3b82f6" />
          
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
            <WaveDiscs />
          </Float>
        </Canvas>
      </div>

      {/* Login Card Overlay */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: "easeOut" }}
        style={styles.contentWrapper}
      >
        <div style={styles.glassCard}>
          <h1 style={styles.title}>WATCH<span style={{color: "#3b82f6"}}>PARTY</span></h1>
          <p style={styles.tagline}>Advanced Infrastructure for AI Innovation</p>

          <div style={styles.form}>
            <input 
              style={styles.input} 
              type="text" 
              placeholder="Display Name" 
              onChange={(e) => setUsername(e.target.value)} 
            />
            <input 
              style={styles.input} 
              type="text" 
              placeholder="Room Identifier" 
              onChange={(e) => setRoom(e.target.value)} 
            />
            <input 
              style={styles.input} 
              type="text" 
              placeholder="Source Media URL" 
              onChange={(e) => setVideoUrl(e.target.value)} 
            />
            
            <motion.button 
              whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,1)", color: "#000" }}
              whileTap={{ scale: 0.97 }}
              style={styles.button}
              onClick={joinRoom}
            >
              INITIALIZE STREAM
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

// --- Custom Internal CSS ---
const styles = {
  container: {
    height: "100vh",
    width: "100%",
    backgroundColor: "#020205", // Deep dark background
    position: "relative",
    overflow: "hidden",
    fontFamily: "'Inter', sans-serif"
  },
  canvasContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    zIndex: 1
  },
  contentWrapper: {
    position: "relative",
    zIndex: 10,
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    pointerEvents: "none"
  },
  glassCard: {
    background: "rgba(255, 255, 255, 0.02)",
    backdropFilter: "blur(20px)",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    borderRadius: "28px",
    padding: "50px 40px",
    width: "100%",
    maxWidth: "440px",
    textAlign: "center",
    pointerEvents: "auto",
    boxShadow: "0 20px 60px rgba(0,0,0,0.6)"
  },
  title: {
    color: "#fff",
    fontSize: "2.6rem",
    fontWeight: "900",
    letterSpacing: "-1px",
    margin: "0 0 10px 0"
  },
  tagline: {
    color: "rgba(255,255,255,0.4)",
    fontSize: "0.75rem",
    textTransform: "uppercase",
    letterSpacing: "2.5px",
    marginBottom: "40px"
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "15px"
  },
  input: {
    padding: "16px",
    background: "rgba(255,255,255,0.04)",
    border: "1px solid rgba(255,255,255,0.1)",
    borderRadius: "12px",
    color: "#fff",
    fontSize: "14px",
    outline: "none",
    transition: "0.3s"
  },
  button: {
    padding: "18px",
    background: "transparent",
    color: "#fff",
    border: "1px solid #fff",
    borderRadius: "12px",
    fontWeight: "700",
    cursor: "pointer",
    marginTop: "10px",
    fontSize: "1rem"
  }
};

export default Home;