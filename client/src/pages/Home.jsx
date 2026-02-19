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
      alert("Please fill all fields to continue.");
    }
  };

  const styles = {
    container: {
      height: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      backgroundColor: "#0f172a", // Deep Slate Blue
      fontFamily: "'Inter', sans-serif",
    },
    card: {
      width: "100%",
      maxWidth: "400px",
      padding: "40px",
      backgroundColor: "#1e293b",
      borderRadius: "12px",
      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
    },
    header: {
      color: "#f8fafc",
      fontSize: "24px",
      fontWeight: "600",
      marginBottom: "8px",
      textAlign: "center"
    },
    subText: {
      color: "#94a3b8",
      fontSize: "14px",
      textAlign: "center",
      marginBottom: "32px"
    },
    label: {
      display: "block",
      color: "#cbd5e1",
      fontSize: "13px",
      marginBottom: "6px",
      fontWeight: "500"
    },
    input: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#0f172a",
      border: "1px solid #334155",
      borderRadius: "6px",
      color: "#f8fafc",
      marginBottom: "20px",
      fontSize: "14px",
      outline: "none"
    },
    button: {
      width: "100%",
      padding: "12px",
      backgroundColor: "#3b82f6", // Vibrant Blue
      color: "white",
      border: "none",
      borderRadius: "6px",
      fontWeight: "600",
      cursor: "pointer",
      marginTop: "10px",
      transition: "background 0.2s"
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.header}>Watch Together</h2>
        <p style={styles.subText}>Simple, real-time video sharing.</p>
        
        <label style={styles.label}>Display Name</label>
        <input style={styles.input} type="text" onChange={(e)=>setUsername(e.target.value)} placeholder="e.g. Aasif" />
        
        <label style={styles.label}>Room ID</label>
        <input style={styles.input} type="text" onChange={(e)=>setRoom(e.target.value)} placeholder="e.g. movie-night" />
        
        <label style={styles.label}>Video URL</label>
        <input style={styles.input} type="text" onChange={(e)=>setVideoUrl(e.target.value)} placeholder="YouTube or Drive link" />
        
        <button style={styles.button} onClick={joinRoom}>Start Streaming</button>
      </div>
    </div>
  );
};

export default Home;