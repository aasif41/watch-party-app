import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import VideoPlayer from "../components/VideoPlayer";
import ChatBox from "../components/ChatBox";
import { motion } from "framer-motion";

const StreamRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const playerRef = useRef(null);

  const [username] = useState(localStorage.getItem("wp_username") || "Watcher");
  const [videoUrl] = useState(localStorage.getItem("wp_videoUrl") || "");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    if (!videoUrl) { navigate("/"); return; }
    socket.emit("join_room", roomId);
    socket.on("video_state_update", (data) => {
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      if (Math.abs(currentTime - data.seekTime) > 2) {
        playerRef.current?.seekTo(data.seekTime);
      }
      setPlaying(data.playing);
    });
    return () => socket.off("video_state_update");
  }, [socket, roomId, videoUrl, navigate]);

  const handleSyncAction = (isPlaying) => {
    setPlaying(isPlaying);
    socket.emit("video_state_change", { 
      room: roomId, 
      playing: isPlaying, 
      seekTime: playerRef.current.getCurrentTime() 
    });
  };

  return (
    <div style={{
      backgroundColor: "#000000",
      minHeight: "100vh",
      color: "#f8fafc",
      display: "flex",
      flexDirection: "column",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Background Ambience (Subtle dark glow) */}
      <div style={{
        position: "absolute",
        top: "-10%",
        left: "-10%",
        width: "60vw",
        height: "60vw",
        background: "radial-gradient(circle, rgba(124, 58, 237, 0.03) 0%, transparent 50%)",
        filter: "blur(100px)",
        pointerEvents: "none",
        zIndex: 0
      }} />
      <div style={{
        position: "absolute",
        bottom: "-10%",
        right: "-10%",
        width: "60vw",
        height: "60vw",
        background: "radial-gradient(circle, rgba(59, 130, 246, 0.03) 0%, transparent 50%)",
        filter: "blur(100px)",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Navigation Bar */}
      <motion.nav 
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          padding: "20px 40px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.05)",
          zIndex: 10
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "900", letterSpacing: "1px" }}>
            WATCH<span style={{ color: "#3b82f6" }}>PARTY</span>
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{
            background: "rgba(255, 255, 255, 0.05)",
            padding: "8px 16px",
            borderRadius: "12px",
            fontSize: "14px",
            color: "#94a3b8",
            border: "1px solid rgba(255,255,255,0.05)"
          }}>
            Room ID: <strong style={{ color: "#fff", marginLeft: "4px" }}>{roomId}</strong>
          </div>
          <button 
            onClick={() => navigate("/")}
            style={{
              background: "transparent",
              border: "none",
              color: "#ef4444",
              fontWeight: "600",
              cursor: "pointer",
              padding: "8px 16px",
              borderRadius: "10px",
              transition: "background 0.2s"
            }}
            onMouseOver={(e) => e.target.style.background = "rgba(239, 68, 68, 0.1)"}
            onMouseOut={(e) => e.target.style.background = "transparent"}
          >
            Leave
          </button>
        </div>
      </motion.nav>

      {/* Main Content Area */}
      <div 
        className="stream-layout"
        style={{
          display: "flex",
          flex: 1,
          padding: "30px 40px",
          gap: "30px",
          maxWidth: "1800px",
          margin: "0 auto",
          width: "100%",
          boxSizing: "border-box",
          zIndex: 10
        }}
      >
        {/* Video Column */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            minWidth: 0 // Prevents flex shrink issues
          }}
        >
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <h2 style={{ margin: 0, fontSize: "20px", fontWeight: "600", color: "#f8fafc" }}>
              Now Playing
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#ef4444", animation: "pulse 2s infinite" }} />
              <span style={{ fontSize: "14px", color: "#94a3b8", fontWeight: "500" }}>Live Sync Active</span>
            </div>
          </div>

          <VideoPlayer 
            url={videoUrl} 
            playing={playing} 
            onPlay={() => handleSyncAction(true)} 
            onPause={() => handleSyncAction(false)}
            playerRef={playerRef}
          />
          
          <div style={{
            background: "rgba(255, 255, 255, 0.02)",
            border: "1px solid rgba(255, 255, 255, 0.05)",
            padding: "16px 20px",
            borderRadius: "16px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            <div style={{
              width: "40px", height: "40px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #7c3aed, #3b82f6)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold", fontSize: "16px"
            }}>
              {username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: "13px", color: "#94a3b8" }}>Joined as</div>
              <div style={{ fontSize: "16px", fontWeight: "600", color: "#f8fafc" }}>{username}</div>
            </div>
          </div>
        </motion.div>

        {/* Chat Column */}
        <motion.div 
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="chat-container"
          style={{
            width: "400px",
            display: "flex",
            flexDirection: "column",
            flexShrink: 0
          }}
        >
          <ChatBox socket={socket} room={roomId} username={username} />
        </motion.div>
      </div>

      <style>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
        }
        
        * {
          box-sizing: border-box;
        }

        /* Responsive Layout */
        @media (max-width: 1024px) {
          .stream-layout { 
            flex-direction: column !important; 
            padding: 20px !important;
            gap: 20px !important;
          }
          .chat-container { 
            width: 100% !important; 
            height: 500px !important; 
          }
        }
        
        @media (max-width: 600px) {
          nav { padding: 16px 20px !important; }
          .stream-layout { padding: 16px !important; }
          .chat-container { height: 400px !important; }
        }
      `}</style>
    </div>
  );
};

export default StreamRoom;