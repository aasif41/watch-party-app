import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import VideoPlayer from "../components/VideoPlayer";
import ChatBox from "../components/ChatBox";
import VideoChat from "../components/VideoChat";
import { motion, AnimatePresence } from "framer-motion";

const StreamRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();
  const playerRef = useRef(null);

  const [username] = useState(localStorage.getItem("wp_username") || "Watcher");
  const [videoUrl] = useState(localStorage.getItem("wp_videoUrl") || "");
  const [playing, setPlaying] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [serverVideoUrl, setServerVideoUrl] = useState(videoUrl);
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [showChat, setShowChat] = useState(true);

  const isHandlingSync = useRef(false);
  const lastSyncSent = useRef(0);
  const isBuffering = useRef(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);

    // Landscape lock on mobile
    const lockOrientation = async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape");
        }
      } catch (e) {}
    };
    if (window.innerWidth < 768) lockOrientation();

    return () => {
      window.removeEventListener("resize", check);
      try { if (screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    };
  }, []);

  useEffect(() => {
    if (!videoUrl && !serverVideoUrl) { navigate("/"); return; }

    const joinRoom = () => socket.emit("join_room", { roomId, videoUrl });
    joinRoom();

    const handleRoomState = (state) => {
      if (state.videoUrl && state.videoUrl !== serverVideoUrl) setServerVideoUrl(state.videoUrl);
      isHandlingSync.current = true;
      setPlaying(state.playing);
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      if (playerRef.current && Math.abs(currentTime - state.seekTime) > 1.5) {
        playerRef.current.seekTo(state.seekTime);
      }
      setTimeout(() => { isHandlingSync.current = false; }, 2000);
    };

    const handleVideoStateUpdate = (data) => {
      isHandlingSync.current = true;
      const currentTime = playerRef.current?.getCurrentTime() || 0;
      if (Math.abs(currentTime - data.seekTime) > 1.5) playerRef.current?.seekTo(data.seekTime);
      setPlaying(data.playing);
      setTimeout(() => { isHandlingSync.current = false; }, 2000);
    };

    const handleVideoSeek = (data) => {
      isHandlingSync.current = true;
      playerRef.current?.seekTo(data.seekTime);
      setPlaying(data.playing);
      setTimeout(() => { isHandlingSync.current = false; }, 2000);
    };

    socket.on("room_state", handleRoomState);
    socket.on("video_state_update", handleVideoStateUpdate);
    socket.on("video_seek", handleVideoSeek);
    socket.on("connect", joinRoom);

    return () => {
      socket.off("connect", joinRoom);
      socket.off("room_state", handleRoomState);
      socket.off("video_state_update", handleVideoStateUpdate);
      socket.off("video_seek", handleVideoSeek);
    };
  }, [socket, roomId, videoUrl, navigate]);

  const handleProgress = (state) => {
    if (!playing || isBuffering.current || isHandlingSync.current) return;
    const now = Date.now();
    if (now - lastSyncSent.current > 2000) {
      socket.emit("sync_time", { room: roomId, time: state.playedSeconds, playing: true });
      lastSyncSent.current = now;
    }
  };

  const handleSyncAction = (isPlaying) => {
    if (playing === isPlaying) return;
    setPlaying(isPlaying);
    socket.emit("video_state_change", {
      room: roomId, playing: isPlaying,
      seekTime: playerRef.current?.getCurrentTime() || 0
    });
  };

  const handleSeek = (seconds) => {
    if (isHandlingSync.current) return;
    socket.emit("video_seek", { room: roomId, seekTime: seconds, playing });
  };

  const handleBuffer = () => { isBuffering.current = true; };
  const handleBufferEnd = () => { isBuffering.current = false; };

  return (
    <div className="stream-room-root">
      {/* Header */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="stream-room-header"
      >
        <div className="header-left">
          <span className="brand">Watch<span className="brand-accent">Party</span></span>
          <span className="room-badge">{roomId}</span>
          <div className="sync-indicator">
            <span className="sync-dot" />
            <span className="sync-text">Synced</span>
          </div>
        </div>
        <div className="header-actions">
          <button
            className={`btn-icon ${showVideoChat ? "active" : ""}`}
            onClick={() => setShowVideoChat(!showVideoChat)}
            title="Video Chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="23 7 16 12 23 17 23 7" />
              <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
            </svg>
          </button>
          <button
            className={`btn-icon ${showChat ? "active" : ""}`}
            onClick={() => setShowChat(!showChat)}
            title="Chat"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
          </button>
          <button className="btn-leave" onClick={() => navigate("/")}>Leave</button>
        </div>
      </motion.header>

      {/* Body */}
      <div className="stream-room-body">
        <div className="main-content">
          <VideoPlayer
            url={serverVideoUrl || videoUrl}
            playing={playing}
            onPlay={() => handleSyncAction(true)}
            onPause={() => handleSyncAction(false)}
            onProgress={handleProgress}
            onSeek={handleSeek}
            onBuffer={handleBuffer}
            onBufferEnd={handleBufferEnd}
            playerRef={playerRef}
          />

          {/* Video Chat */}
          <AnimatePresence>
            {showVideoChat && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                style={{ overflow: "hidden" }}
              >
                <VideoChat socket={socket} roomId={roomId} username={username} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Chat */}
        <AnimatePresence>
          {showChat && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: isMobile ? "100%" : "380px", opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="chat-panel"
            >
              <ChatBox socket={socket} room={roomId} username={username} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        * { box-sizing: border-box; margin: 0; padding: 0; }

        .stream-room-root {
          background: #0c0c0c;
          height: 100vh;
          display: flex;
          flex-direction: column;
          color: #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        .stream-room-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 20px;
          height: 52px;
          min-height: 52px;
          background: rgba(12,12,12,0.95);
          border-bottom: 1px solid rgba(255,255,255,0.06);
          z-index: 50;
          backdrop-filter: blur(12px);
        }
        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .brand {
          font-size: 1rem;
          font-weight: 700;
          letter-spacing: -0.3px;
          color: #f1f5f9;
        }
        .brand-accent { color: #3b82f6; }
        .room-badge {
          font-size: 0.7rem;
          font-weight: 600;
          color: #64748b;
          background: rgba(255,255,255,0.05);
          padding: 3px 10px;
          border-radius: 6px;
          letter-spacing: 0.5px;
          border: 1px solid rgba(255,255,255,0.05);
        }
        .sync-indicator {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .sync-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ef4444;
          animation: syncPulse 2s infinite;
        }
        .sync-text {
          font-size: 0.68rem;
          color: #64748b;
          font-weight: 500;
        }
        @keyframes syncPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(239,68,68,0.4); }
          50% { opacity: 0.7; box-shadow: 0 0 0 4px rgba(239,68,68,0); }
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-icon {
          width: 36px; height: 36px;
          border-radius: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
        }
        .btn-icon:hover { background: rgba(255,255,255,0.08); color: #f1f5f9; }
        .btn-icon.active { background: rgba(59,130,246,0.15); color: #3b82f6; border-color: rgba(59,130,246,0.3); }
        .btn-leave {
          background: transparent;
          border: 1px solid rgba(239,68,68,0.25);
          color: #f87171;
          padding: 6px 14px;
          border-radius: 8px;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s;
        }
        .btn-leave:hover { background: rgba(239,68,68,0.1); }

        .stream-room-body {
          flex: 1;
          display: flex;
          overflow: hidden;
          min-height: 0;
        }
        .main-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 12px;
          min-width: 0;
          overflow-y: auto;
        }

        .chat-panel {
          border-left: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        @media (max-width: 1024px) {
          .stream-room-body { flex-direction: column; }
          .chat-panel {
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.05);
            width: 100% !important;
            height: 350px !important;
          }
        }
        @media (max-width: 600px) {
          .stream-room-header { padding: 0 12px; height: 46px; min-height: 46px; }
          .brand { font-size: 0.85rem; }
          .room-badge { display: none; }
          .sync-text { display: none; }
          .btn-leave { padding: 5px 10px; font-size: 0.7rem; }
          .btn-icon { width: 32px; height: 32px; }
          .main-content { padding: 8px; gap: 8px; }
          .chat-panel { height: 300px !important; }
        }
        @media (max-height: 500px) and (orientation: landscape) {
          .stream-room-header { height: 40px; min-height: 40px; }
          .stream-room-body { flex-direction: row; }
          .chat-panel {
            border-left: 1px solid rgba(255,255,255,0.05);
            border-top: none;
            width: 320px !important;
            height: auto !important;
          }
          .main-content { padding: 6px; gap: 6px; }
        }
      `}</style>
    </div>
  );
};

export default StreamRoom;