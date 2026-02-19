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

  const styles = {
    page: {
      backgroundColor: "#020617",
      minHeight: "100vh",
      color: "#f8fafc",
      display: "flex",
      flexDirection: "column"
    },
    nav: {
      padding: "16px 40px",
      borderBottom: "1px solid #1e293b",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center"
    },
    main: {
      display: "flex",
      flex: 1,
      padding: "24px",
      gap: "24px"
    },
    videoArea: {
      flex: 1,
      display: "flex",
      flexDirection: "column",
      gap: "16px"
    },
    chatArea: {
      width: "360px",
      backgroundColor: "#0f172a",
      borderRadius: "12px",
      border: "1px solid #1e293b",
      overflow: "hidden"
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.nav}>
        <div style={{fontWeight: "700", fontSize: "18px", letterSpacing: "1px"}}>WATCHPARTY</div>
        <div style={{fontSize: "14px", color: "#94a3b8"}}>Room: <span style={{color: "#3b82f6"}}>{roomId}</span></div>
      </div>

      <div style={styles.main} className="stream-layout">
        <div style={styles.videoArea}>
          <div style={{ borderRadius: "12px", overflow: "hidden", border: "1px solid #334155" }}>
            <VideoPlayer 
              url={videoUrl} 
              playing={playing} 
              onPlay={() => handleSyncAction(true)} 
              onPause={() => handleSyncAction(false)}
              playerRef={playerRef}
            />
          </div>
          <div style={{fontSize: "13px", color: "#64748b"}}>Active as: <b>{username}</b></div>
        </div>

        <div style={styles.chatArea}>
          <ChatBox socket={socket} room={roomId} username={username} />
        </div>
      </div>

      <style>{`
        @media (max-width: 900px) {
          .stream-layout { flex-direction: column; }
          div[style*="width: 360px"] { width: 100% !important; height: 400px; }
        }
      `}</style>
    </div>
  );
};

export default StreamRoom;