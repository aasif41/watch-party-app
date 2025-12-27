import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Home = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const navigate = useNavigate();

  const joinRoom = () => {
    if (username !== "" && room !== "" && videoUrl !== "") {
      // Username, Room ID aur Video URL ko StreamRoom page par bhejna
      navigate("/stream", { state: { username, room, videoUrl } });
    } else {
      alert("Please fill all fields!");
    }
  };

  return (
    <div className="home-container" style={{ padding: "60px 7%", textAlign: "center" }}>
      <div className="card" style={{ maxWidth: "500px", margin: "0 auto", padding: "40px", background: "#f8f9fa", borderRadius: "15px", boxShadow: "0 4px 15px rgba(0,0,0,0.1)" }}>
        <h2 style={{ color: "#004e92", marginBottom: "20px" }}>Create / Join Watch Party</h2>
        <input 
          type="text" placeholder="Enter Your Name" 
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ccc", outline: "none" }}
        />
        <input 
          type="text" placeholder="Enter Room ID" 
          onChange={(e) => setRoom(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "15px", borderRadius: "8px", border: "1px solid #ccc", outline: "none" }}
        />
        <input 
          type="text" placeholder="Paste YouTube or Drive Link" 
          onChange={(e) => setVideoUrl(e.target.value)}
          style={{ width: "100%", padding: "12px", marginBottom: "20px", borderRadius: "8px", border: "1px solid #ccc", outline: "none" }}
        />
        <button 
          onClick={joinRoom}
          style={{ width: "100%", padding: "15px", background: "#004e92", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold", fontSize: "1rem" }}
        >
          START STREAMING
        </button>
      </div>
    </div>
  );
};

export default Home;