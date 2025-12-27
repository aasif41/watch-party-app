import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import VideoPlayer from "../components/VideoPlayer";
import ChatBox from "../components/ChatBox";

const StreamRoom = () => {
  const location = useLocation();
  const socket = useSocket();
  const { username, room, videoUrl } = location.state || {};
  
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null);

  useEffect(() => {
    if (room) {
      socket.emit("join_room", room);
    }

    // Doosre users ke sync actions ko receive karna
    socket.on("video_state_update", (data) => {
      setPlaying(data.playing);
      // Agar seek time bheja gaya hai toh video ko wahan tak le jana
      if (data.seekTime !== undefined) {
        playerRef.current.seekTo(data.seekTime);
      }
    });

    return () => socket.off("video_state_update");
  }, [socket, room]);

  const handlePlay = () => {
    setPlaying(true);
    socket.emit("video_state_change", { 
      room, 
      playing: true, 
      seekTime: playerRef.current.getCurrentTime() 
    });
  };

  const handlePause = () => {
    setPlaying(false);
    socket.emit("video_state_change", { 
      room, 
      playing: false, 
      seekTime: playerRef.current.getCurrentTime() 
    });
  };

  return (
    <div className="stream-container" style={{ display: "flex", flexWrap: "wrap", padding: "20px", gap: "20px", justifyContent: "center" }}>
      {/* Video Section */}
      <div style={{ flex: "2", minWidth: "350px", maxWidth: "850px" }}>
        <div style={{ marginBottom: "15px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Room: <span style={{color: "#004e92"}}>{room}</span></h3>
          <p style={{ margin: 0, fontSize: "0.9rem", color: "#666" }}>User: <b>{username}</b></p>
        </div>
        <VideoPlayer 
          url={videoUrl} 
          playing={playing} 
          onPlay={handlePlay} 
          onPause={handlePause}
          playerRef={playerRef}
        />
      </div>

      {/* Chat Section */}
      <div style={{ flex: "1", minWidth: "300px", maxWidth: "400px" }}>
        <ChatBox socket={socket} room={room} username={username} />
      </div>
    </div>
  );
};

export default StreamRoom;