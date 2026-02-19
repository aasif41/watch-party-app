import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import VideoPlayer from "../components/VideoPlayer";
import ChatBox from "../components/ChatBox";

const StreamRoom = () => {
  const { roomId } = useParams(); // URL se Room ID lene ke liye (Refresh fix)
  const navigate = useNavigate();
  const socket = useSocket();
  const playerRef = useRef(null);

  // LocalStorage se data recover karna taaki refresh par link na toote
  const [username] = useState(localStorage.getItem("wp_username") || "Guest");
  const [videoUrl] = useState(localStorage.getItem("wp_videoUrl") || "");
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    // Agar video URL nahi hai toh wapas home page par bhej do
    if (!videoUrl) {
      navigate("/");
      return;
    }

    socket.emit("join_room", roomId);

    // Sync logic: Lag kam karne ke liye 2 second ka gap check
    socket.on("video_state_update", (data) => {
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      if (Math.abs(currentTime - data.seekTime) > 2) {
        playerRef.current?.seekTo(data.seekTime);
      }
      setPlaying(data.playing);
    });

    return () => socket.off("video_state_update");
  }, [socket, roomId, videoUrl, navigate]);

  // Play/Pause sync function
  const handleSyncAction = (isPlaying) => {
    setPlaying(isPlaying);
    socket.emit("video_state_change", { 
      room: roomId, 
      playing: isPlaying, 
      seekTime: playerRef.current.getCurrentTime() 
    });
  };

  // --- Internal CSS Objects for UI ---
  const styles = {
    container: {
      display: "flex",
      flexWrap: "wrap",
      padding: "30px",
      gap: "25px",
      justifyContent: "center",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
      minHeight: "92vh",
      fontFamily: "'Poppins', sans-serif"
    },
    videoSection: {
      flex: "2",
      minWidth: "350px",
      maxWidth: "900px",
      display: "flex",
      flexDirection: "column",
      gap: "15px"
    },
    glassHeader: {
      background: "rgba(255, 255, 255, 0.8)",
      backdropFilter: "blur(10px)",
      padding: "20px",
      borderRadius: "15px",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      boxShadow: "0 8px 32px 0 rgba(31, 38, 135, 0.1)",
      border: "1px solid rgba(255, 255, 255, 0.18)"
    },
    badge: {
      background: "#004e92",
      color: "white",
      padding: "5px 12px",
      borderRadius: "20px",
      fontSize: "0.8rem",
      fontWeight: "bold"
    },
    chatSection: {
      flex: "1",
      minWidth: "320px",
      maxWidth: "420px"
    }
  };

  return (
    <div style={styles.container}>
      {/* Video Section */}
      <div style={styles.videoSection}>
        <div style={styles.glassHeader}>
          <div>
            <h3 style={{ margin: 0, color: "#333" }}>🎥 Watching Now</h3>
            <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>
              Room ID: <span style={{ fontWeight: "bold", color: "#004e92" }}>{roomId}</span>
            </p>
          </div>
          <div style={styles.badge}>Live Sync Active</div>
        </div>

        {/* Video Player wrapper for UI enhancement */}
        <div style={{ 
          borderRadius: "15px", 
          overflow: "hidden", 
          boxShadow: "0 20px 50px rgba(0,0,0,0.2)",
          border: "5px solid white" 
        }}>
          <VideoPlayer 
            url={videoUrl} 
            playing={playing} 
            onPlay={() => handleSyncAction(true)} 
            onPause={() => handleSyncAction(false)}
            playerRef={playerRef}
          />
        </div>
        
        <div style={{ textAlign: "right", color: "#555", fontSize: "0.9rem" }}>
          Streaming as: <b>{username}</b>
        </div>
      </div>

      {/* Chat Section */}
      <div style={styles.chatSection}>
        <ChatBox socket={socket} room={roomId} username={username} />
      </div>
    </div>
  );
};

export default StreamRoom;