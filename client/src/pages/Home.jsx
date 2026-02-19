import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (username !== "" && room !== "" && videoUrl !== "") {
      // Refresh hone par data recover karne ke liye LocalStorage ka use
      localStorage.setItem("wp_username", username);
      localStorage.setItem("wp_videoUrl", videoUrl);
      
      // Dynamic URL par navigate karna
      navigate(`/stream/${room}`);
    } else {
      alert("Please fill all fields!");
    }
  };

  // UI Styles
  const containerStyle = {
    padding: "60px 7%",
    textAlign: "center",
    background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    minHeight: "100vh"
  };

  const cardStyle = {
    maxWidth: "500px",
    margin: "0 auto",
    padding: "40px",
    background: "rgba(255, 255, 255, 0.9)",
    borderRadius: "15px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
    backdropFilter: "blur(10px)"
  };

  const inputStyle = {
    width: "100%",
    padding: "12px",
    marginBottom: "15px",
    borderRadius: "8px",
    border: "1px solid #ccc",
    outline: "none",
    fontSize: "1rem"
  };

  const buttonStyle = {
    width: "100%",
    padding: "15px",
    background: "#004e92",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "1.1rem",
    transition: "0.3s"
  };

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ color: "#004e92", marginBottom: "25px" }}>Start Your Watch Party</h2>
        <input 
          type="text" placeholder="Enter Your Name" 
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={inputStyle}
        />
        <input 
          type="text" placeholder="Enter Room ID" 
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          style={inputStyle}
        />
        <input 
          type="text" placeholder="Paste YouTube or Drive Link" 
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          style={inputStyle}
        />
        <button 
          onClick={joinRoom}
          style={buttonStyle}
          onMouseOver={(e) => e.target.style.background = "#003366"}
          onMouseOut={(e) => e.target.style.background = "#004e92"}
        >
          START STREAMING
        </button>
      </div>
    </div>
  );
};

export default Home;