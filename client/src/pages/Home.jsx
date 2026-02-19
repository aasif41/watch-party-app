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
      alert("All fields are required! 🚀");
    }
  };

  const styles = {
    wrapper: {
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(-45deg, #0f0c29, #302b63, #24243e)",
      backgroundSize: "400% 400%",
      animation: "gradientBG 15s ease infinite",
    },
    card: {
      background: "rgba(255, 255, 255, 0.05)",
      backdropFilter: "blur(20px)",
      border: "1px solid rgba(255, 255, 255, 0.1)",
      borderRadius: "24px",
      padding: "50px",
      width: "100%",
      maxWidth: "450px",
      textAlign: "center",
      boxShadow: "0 25px 50px rgba(0,0,0,0.3)",
    },
    title: {
      color: "#fff",
      fontSize: "2.5rem",
      fontWeight: "800",
      marginBottom: "10px",
      letterSpacing: "-1px"
    },
    subtitle: {
      color: "#aaa",
      marginBottom: "30px",
      fontSize: "1rem"
    },
    input: {
      width: "100%",
      padding: "15px",
      marginBottom: "15px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: "12px",
      color: "#fff",
      fontSize: "1rem",
      outline: "none",
      transition: "0.3s"
    },
    button: {
      width: "100%",
      padding: "16px",
      marginTop: "10px",
      background: "linear-gradient(90deg, #ff8a00, #e52e71)",
      border: "none",
      borderRadius: "12px",
      color: "white",
      fontWeight: "bold",
      fontSize: "1.1rem",
      cursor: "pointer",
      boxShadow: "0 10px 20px rgba(229, 46, 113, 0.3)",
      transition: "0.3s"
    }
  };

  return (
    <div style={styles.wrapper}>
      <style>{`
        @keyframes gradientBG {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        input:focus { border-color: #ff8a00 !important; background: rgba(255,255,255,0.12) !important; }
        button:hover { transform: translateY(-3px); box-shadow: 0 15px 25px rgba(229, 46, 113, 0.4); }
      `}</style>
      <div style={styles.card}>
        <h1 style={styles.title}>WATCH<span style={{color: "#ff8a00"}}>PARTY</span></h1>
        <p style={styles.subtitle}>Watch together, even when apart.</p>
        <input style={styles.input} placeholder="Your Display Name" onChange={(e)=>setUsername(e.target.value)} />
        <input style={styles.input} placeholder="Room ID (e.g. weekend-vibes)" onChange={(e)=>setRoom(e.target.value)} />
        <input style={styles.input} placeholder="YouTube / Drive URL" onChange={(e)=>setVideoUrl(e.target.value)} />
        <button style={styles.button} onClick={joinRoom}>Join the Room</button>
      </div>
    </div>
  );
};

export default Home;