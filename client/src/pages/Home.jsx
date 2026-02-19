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

  return (
    <div className="home-wrapper">
      <style>{`
        .home-wrapper {
          height: 100vh;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #020205; /* Deep black background */
          position: relative;
          overflow: hidden;
          font-family: 'Inter', sans-serif;
        }

        /* Video jaisa Glowing Wave Animation */
        .wave-container {
          position: absolute;
          width: 100%;
          height: 100%;
          z-index: 1;
          filter: blur(40px);
          opacity: 0.6;
        }

        .wave {
          position: absolute;
          width: 150%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(147, 51, 234, 0.3) 0%, transparent 70%);
          animation: flow 15s infinite ease-in-out;
        }

        .wave:nth-child(2) {
          background: radial-gradient(circle at center, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
          animation-delay: -5s;
          animation-duration: 20s;
        }

        @keyframes flow {
          0%, 100% { transform: translate(-20%, -20%) scale(1); }
          33% { transform: translate(10%, 10%) scale(1.2); }
          66% { transform: translate(-10%, 20%) scale(0.8); }
        }

        .login-card {
          position: relative;
          z-index: 10;
          background: rgba(255, 255, 255, 0.02);
          backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 24px;
          padding: 50px 40px;
          width: 100%;
          maxWidth: 450px;
          text-align: center;
          box-shadow: 0 0 50px rgba(0, 0, 0, 0.5);
        }

        .title {
          font-size: 2.5rem;
          font-weight: 800;
          background: linear-gradient(180deg, #fff 0%, #94a3b8 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          margin-bottom: 8px;
        }

        .subtitle {
          color: rgba(255, 255, 255, 0.5);
          font-size: 0.85rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          margin-bottom: 40px;
        }

        input {
          width: 100%;
          padding: 14px;
          margin-bottom: 15px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          color: white;
          outline: none;
          transition: 0.3s;
        }

        input:focus {
          border-color: rgba(59, 130, 246, 0.5);
          background: rgba(255, 255, 255, 0.08);
        }

        .start-btn {
          width: 100%;
          padding: 16px;
          background: #fff;
          color: #000;
          border: none;
          border-radius: 12px;
          font-weight: 700;
          cursor: pointer;
          transition: 0.3s;
          margin-top: 10px;
        }

        .start-btn:hover {
          transform: scale(1.02);
          box-shadow: 0 0 20px rgba(255, 255, 255, 0.4);
        }
      `}</style>

      {/* Background Waves */}
      <div className="wave-container">
        <div className="wave"></div>
        <div className="wave"></div>
      </div>

      <div className="login-card">
        <h1 className="title">WATCHPARTY</h1>
        <p className="subtitle">Advanced Infrastructure for Streaming</p>

        <input 
          type="text" 
          placeholder="User Identifier" 
          onChange={(e) => setUsername(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Access Room ID" 
          onChange={(e) => setRoom(e.target.value)} 
        />
        <input 
          type="text" 
          placeholder="Video Source URL" 
          onChange={(e) => setVideoUrl(e.target.value)} 
        />

        <button className="start-btn" onClick={joinRoom}>
          INITIALIZE SYSTEM
        </button>
      </div>
    </div>
  );
};

export default Home;