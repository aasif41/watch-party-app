import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import VideoPlayer from "../components/VideoPlayer";
import ChatBox from "../components/ChatBox";

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
      if (Math.abs(currentTime - data.seekTime) > 2.5) {
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

  const styles = {
    main: {
      background: "#0a0a0c",
      minHeight: "100vh",
      padding: "20px",
      color: "#fff",
      fontFamily: "'Inter', sans-serif"
    },
    header: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "0 20px 20px 20px",
      borderBottom: "1px solid #222"
    },
    contentLayout: {
      display: "grid",
      gridTemplateColumns: "1fr 350px",
      gap: "20px",
      marginTop: "20px",
      height: "calc(100vh - 120px)"
    },
    videoContainer: {
      background: "#000",
      borderRadius: "16px",
      overflow: "hidden",
      boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
      position: "relative"
    }
  };

  return (
    <div style={styles.main}>
      <div style={styles.header}>
        <div>
          <h2 style={{ margin: 0, color: "#ff8a00" }}>{roomId}</h2>
          <span style={{ fontSize: "0.8rem", color: "#666" }}>Room Active</span>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0 }}>Watching as <b>{username}</b></p>
        </div>
      </div>

      <div style={styles.contentLayout} className="content-grid">
        <div style={styles.videoContainer}>
          <VideoPlayer 
            url={videoUrl} 
            playing={playing} 
            onPlay={() => handleSyncAction(true)} 
            onPause={() => handleSyncAction(false)}
            playerRef={playerRef}
          />
        </div>

        <div style={{ background: "#161618", borderRadius: "16px", overflow: "hidden" }}>
          <ChatBox socket={socket} room={roomId} username={username} />
        </div>
      </div>

      <style>{`
        @media (max-width: 1000px) {
          .content-grid { grid-template-columns: 1fr !important; height: auto !important; }
        }
      `}</style>
    </div>
  );
};

export default StreamRoom;