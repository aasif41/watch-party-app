import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

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
    wrapper: {
      height: "100vh",
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#050505",
      position: "relative",
      overflow: "hidden",
      fontFamily: "'Inter', sans-serif",
    },
    // Background Animation Layers
    bgLayer: {
      position: "absolute",
      width: "100%",
      height: "100%",
      background: "radial-gradient(circle at 50% 50%, #1a1a2e 0%, #050505 100%)",
      zIndex: 1,
    },
    animatedWave: {
      position: "absolute",
      width: "200%",
      height: "200%",
      top: "-50%",
      left: "-50%",
      background: "radial-gradient(circle at center, rgba(0, 114, 255, 0.15) 0%, transparent 50%), radial-gradient(circle at 30% 20%, rgba(245, 124, 0, 0.1) 0%, transparent 40%)",
      animation: "rotateWave 20s linear infinite",
      zIndex: 2,
    },
    card: {
      position: "relative",
      zIndex: 10,
      background: "rgba(255, 255, 255, 0.03)",
      backdropFilter: "blur(25px)",
      WebkitBackdropFilter: "blur(25px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "32px",
      padding: "60px 40px",
      width: "100%",
      maxWidth: "480px",
      textAlign: "center",
      boxShadow: "0 25px 50px rgba(0,0,0,0.5)",
    },
    input: {
      width: "100%",
      padding: "16px",
      marginBottom: "18px",
      background: "rgba(255, 255, 255, 0.05)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "14px",
      color: "#fff",
      fontSize: "1rem",
      outline: "none",
      transition: "0.3s ease",
    },
    button: {
      width: "100%",
      padding: "18px",
      marginTop: "15px",
      background: "linear-gradient(90deg, #004e92, #00d2ff)",
      border: "none",
      borderRadius: "14px",
      color: "#fff",
      fontWeight: "700",
      fontSize: "1.1rem",
      cursor: "pointer",
      boxShadow: "0 10px 30px rgba(0, 78, 146, 0.4)",
      transition: "transform 0.2s, boxShadow 0.2s",
    }
  };

  return (
    <div style={styles.wrapper}>
      {/* Dynamic Background Elements */}
      <div style={styles.bgLayer}></div>
      <div style={styles.animatedWave}></div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes rotateWave {
          0% { transform: rotate(0deg) scale(1); }
          50% { transform: rotate(180deg) scale(1.2); }
          100% { transform: rotate(360deg) scale(1); }
        }
        
        input:focus {
          border-color: #00d2ff !important;
          background: rgba(255, 255, 255, 0.1) !important;
          box-shadow: 0 0 15px rgba(0, 210, 255, 0.2);
        }

        button:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 40px rgba(0, 78, 146, 0.6);
        }

        button:active {
          transform: translateY(0);
        }

        .glow-text {
          background: linear-gradient(to right, #fff, #00d2ff);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 0 0 30px rgba(0, 210, 255, 0.3);
        }
      `}</style>

      <div style={styles.card}>
        <h1 className="glow-text" style={{ fontSize: "2.8rem", margin: "0 0 10px 0", fontWeight: "900" }}>
          WATCHPARTY
        </h1>
        <p style={{ color: "rgba(255,255,255,0.5)", marginBottom: "40px", fontSize: "0.95rem", letterSpacing: "1px" }}>
          ADVANCED INFRASTRUCTURE FOR STREAMING
        </p>

        <input 
          style={styles.input} 
          placeholder="Display Name" 
          onChange={(e) => setUsername(e.target.value)} 
        />
        <input 
          style={styles.input} 
          placeholder="Room Identifier" 
          onChange={(e) => setRoom(e.target.value)} 
        />
        <input 
          style={styles.input} 
          placeholder="Media Source URL" 
          onChange={(e) => setVideoUrl(e.target.value)} 
        />

        <button style={styles.button} onClick={joinRoom}>
          INITIALIZE STREAM
        </button>
      </div>
    </div>
  );
};

export default Home;