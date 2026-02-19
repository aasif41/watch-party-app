import React, { useState, useRef, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Sphere, MeshDistortMaterial } from "@react-three/drei";
import { motion } from "framer-motion";

// Background 3D Wave Component
const AnimatedBackground = () => {
  const meshRef = useRef();

  useFrame((state) => {
    const { clock } = state;
    if (meshRef.current) {
      // Rotation and movement for the 3D shape
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.2;
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.3;
    }
  });

  return (
    <mesh ref={meshRef} scale={1.5}>
      <Sphere args={[1, 100, 100]}>
        <MeshDistortMaterial
          color="#3b82f6"
          attach="material"
          distort={0.5} // Ye wave jaisa distortion create karega
          speed={2} // Animation speed
          roughness={0}
          emissive="#1d4ed8"
          emissiveIntensity={0.5}
        />
      </Sphere>
    </mesh>
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
      alert("Please fill all details! 🚀");
    }
  };

  const styles = {
    container: {
      position: "relative",
      height: "100vh",
      width: "100%",
      backgroundColor: "#020617",
      overflow: "hidden",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    canvasContainer: {
      position: "absolute",
      top: 0,
      left: 0,
      width: "100%",
      height: "100%",
      zIndex: 1,
    },
    content: {
      position: "relative",
      zIndex: 10,
      width: "100%",
      maxWidth: "420px",
      padding: "20px",
    }
  };

  return (
    <div style={styles.container}>
      {/* Three.js Background */}
      <div style={styles.canvasContainer}>
        <Canvas camera={{ position: [0, 0, 4] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} intensity={1} />
          <spotLight position={[-10, 10, 10]} angle={0.15} penumbra={1} />
          <AnimatedBackground />
        </Canvas>
      </div>

      {/* Login Card with Framer Motion */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={styles.content}
      >
        <div style={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: "24px",
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
        }}>
          <h1 style={{ color: "#fff", fontSize: "2rem", fontWeight: "800", marginBottom: "5px" }}>
            WATCHPARTY
          </h1>
          <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.8rem", letterSpacing: "2px", marginBottom: "30px" }}>
            SYSTEM INITIALIZATION
          </p>

          <input 
            type="text" 
            placeholder="Username" 
            onChange={(e) => setUsername(e.target.value)}
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="Room ID" 
            onChange={(e) => setRoom(e.target.value)}
            style={inputStyle} 
          />
          <input 
            type="text" 
            placeholder="Video Link" 
            onChange={(e) => setVideoUrl(e.target.value)}
            style={inputStyle} 
          />

          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={joinRoom}
            style={buttonStyle}
          >
            START STREAMING
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "14px",
  marginBottom: "15px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "12px",
  color: "#fff",
  outline: "none"
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  background: "#fff",
  color: "#000",
  border: "none",
  borderRadius: "12px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "10px"
};

export default Home;