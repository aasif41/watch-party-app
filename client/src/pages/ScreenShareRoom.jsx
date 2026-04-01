import React, { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSocket } from "../hooks/useSocket";
import ChatBox from "../components/ChatBox";
import VideoChat from "../components/VideoChat";
import { motion, AnimatePresence } from "framer-motion";

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const ScreenShareRoom = () => {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const socket = useSocket();

  const [username] = useState(localStorage.getItem("wp_username") || "Watcher");
  const [isMobile, setIsMobile] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [remoteStream, setRemoteStream] = useState(null);
  const [isPresenter, setIsPresenter] = useState(false);
  const [shareError, setShareError] = useState("");
  const [showVideoChat, setShowVideoChat] = useState(false);
  const [showChat, setShowChat] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState("connecting");

  const localStreamRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const viewerPcRef = useRef(null);

  // Mobile check + landscape lock hint
  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);

    // Request landscape lock on mobile if API is available
    const lockOrientation = async () => {
      try {
        if (screen.orientation && screen.orientation.lock) {
          await screen.orientation.lock("landscape");
        }
      } catch (e) {
        // Orientation lock not supported or not in fullscreen
      }
    };
    if (window.innerWidth < 768) lockOrientation();

    return () => {
      window.removeEventListener("resize", check);
      // Unlock orientation when leaving
      try {
        if (screen.orientation && screen.orientation.unlock) {
          screen.orientation.unlock();
        }
      } catch (e) {}
    };
  }, []);

  // Join room
  useEffect(() => {
    socket.emit("join_room", { roomId, roomType: "screenshare" });

    const handleRoomState = (state) => {
      setConnectionStatus("connected");
      if (state.isScreenSharing && state.presenterId !== socket.id) {
        socket.emit("request_screen_share", { room: roomId });
      }
    };
    const handleConnect = () => {
      socket.emit("join_room", { roomId, roomType: "screenshare" });
      setConnectionStatus("connected");
    };
    const handleDisconnect = () => setConnectionStatus("disconnected");

    socket.on("room_state", handleRoomState);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    if (socket.connected) setConnectionStatus("connected");

    return () => {
      socket.off("room_state", handleRoomState);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      stopSharing();
    };
  }, [socket, roomId]);

  // Presenter: handle new viewers
  useEffect(() => {
    const handleViewerJoined = async ({ viewerId }) => {
      if (!localStreamRef.current) return;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(viewerId, pc);
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("screen_ice_candidate", { to: viewerId, candidate: event.candidate, room: roomId });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("screen_share_offer", { to: viewerId, offer: pc.localDescription, room: roomId });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIce = async ({ from, candidate }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on("viewer_joined", handleViewerJoined);
    socket.on("screen_share_answer", handleAnswer);
    socket.on("screen_ice_candidate", handleIce);
    return () => {
      socket.off("viewer_joined", handleViewerJoined);
      socket.off("screen_share_answer", handleAnswer);
      socket.off("screen_ice_candidate", handleIce);
    };
  }, [socket, roomId]);

  // Viewer: receive stream
  useEffect(() => {
    const handleShareStarted = ({ presenterId }) => {
      if (presenterId !== socket.id) {
        setIsSharing(true);
        setIsPresenter(false);
        socket.emit("request_screen_share", { room: roomId });
      }
    };
    const handleShareStopped = () => {
      setIsSharing(false); setIsPresenter(false); setRemoteStream(null);
      if (viewerPcRef.current) { viewerPcRef.current.close(); viewerPcRef.current = null; }
    };
    const handleOffer = async ({ from, offer }) => {
      if (viewerPcRef.current) viewerPcRef.current.close();
      const pc = new RTCPeerConnection(ICE_SERVERS);
      viewerPcRef.current = pc;
      pc.ontrack = (event) => setRemoteStream(event.streams[0]);
      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("screen_ice_candidate", { to: from, candidate: event.candidate, room: roomId });
      };
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("screen_share_answer", { to: from, answer: pc.localDescription, room: roomId });
    };
    const handleIce = async ({ from, candidate }) => {
      if (viewerPcRef.current && candidate) await viewerPcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    };

    socket.on("screen_share_started", handleShareStarted);
    socket.on("screen_share_stopped", handleShareStopped);
    socket.on("screen_share_offer", handleOffer);
    socket.on("screen_ice_candidate", handleIce);
    return () => {
      socket.off("screen_share_started", handleShareStarted);
      socket.off("screen_share_stopped", handleShareStopped);
      socket.off("screen_share_offer", handleOffer);
      socket.off("screen_ice_candidate", handleIce);
    };
  }, [socket, roomId]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) remoteVideoRef.current.srcObject = remoteStream;
  }, [remoteStream]);

  const startSharing = async () => {
    try {
      setShareError("");
      // Optimize constraints for lag-free/buffer-free performance (720p 30fps is optimal for zero-lag WebRTC)
      let stream;
      try {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: {
            cursor: "always",
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 24, max: 30 }
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            sampleRate: 44100
          },
        });
      } catch (e) {
        // Fallback for mobile browsers (like iOS Safari) that don't support getDisplayMedia
        // Fallback to back camera so mobile users can still "share" what they are looking at
        console.warn("getDisplayMedia failed, falling back to camera:", e);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 }, frameRate: { ideal: 24, max: 30 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
      }

      // Optimize RTCRtpSender to prefer low latency and zero buffering
      stream.getVideoTracks().forEach(track => {
        if (track.contentHint !== undefined) {
          track.contentHint = "detail"; // Biases the encoder for screen sharing to maintain detail without lag
        }
      });

      localStreamRef.current = stream;
      setIsSharing(true);
      setIsPresenter(true);
      socket.emit("start_screen_share", { room: roomId });
      
      stream.getVideoTracks()[0].onended = () => stopSharing();
    } catch (err) {
      if (err.name === "NotAllowedError") setShareError("Screen sharing was cancelled.");
      else setShareError("Failed to start screen sharing: " + err.message);
    }
  };

  const stopSharing = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    if (isPresenter) socket.emit("stop_screen_share", { room: roomId });
    setIsSharing(false);
    setIsPresenter(false);
  }, [isPresenter, socket, roomId]);

  const hasStream = isPresenter ? !!localStreamRef.current && isSharing : !!remoteStream;

  return (
    <div className="screen-room-root">
      {/* Top Bar */}
      <motion.header
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="screen-room-header"
      >
        <div className="header-left">
          <span className="brand">Watch<span className="brand-accent">Party</span></span>
          <span className="room-badge">{roomId}</span>
          <span className={`status-dot ${connectionStatus}`} />
        </div>

        <div className="header-actions">
          {/* Action buttons */}
          {!isSharing ? (
            <motion.button whileTap={{ scale: 0.95 }} className="btn-share" onClick={startSharing}>
              Share Screen
            </motion.button>
          ) : isPresenter ? (
            <motion.button whileTap={{ scale: 0.95 }} className="btn-stop" onClick={stopSharing}>
              Stop Sharing
            </motion.button>
          ) : null}

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

          <button className="btn-leave" onClick={() => { stopSharing(); navigate("/"); }}>
            Leave
          </button>
        </div>
      </motion.header>

      {/* Main Layout */}
      <div className="screen-room-body">
        {/* Main Video Area */}
        <div className="main-content">
          {/* Video Area */}
          <div className="video-wrapper">
            {isPresenter && localStreamRef.current && (
              <video
                ref={(el) => { if (el && localStreamRef.current) el.srcObject = localStreamRef.current; }}
                autoPlay muted
                className="main-video"
              />
            )}
            {!isPresenter && remoteStream && (
              <video ref={remoteVideoRef} autoPlay playsInline className="main-video" />
            )}
            {!hasStream && (
              <div className="empty-state">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5">
                  <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <p className="empty-title">No active screen share</p>
                <p className="empty-sub">Click "Share Screen" to start presenting</p>
              </div>
            )}
            {/* Live indicator */}
            {isSharing && (
              <div className="live-badge">
                <span className="live-dot" />
                LIVE
              </div>
            )}
          </div>

          {/* Error */}
          <AnimatePresence>
            {shareError && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="error-bar"
              >
                {shareError}
              </motion.div>
            )}
          </AnimatePresence>

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

        {/* Chat Panel */}
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

        .screen-room-root {
          background: #0c0c0c;
          min-height: 100vh;
          height: 100vh;
          display: flex;
          flex-direction: column;
          color: #e2e8f0;
          font-family: -apple-system, BlinkMacSystemFont, 'Inter', 'Segoe UI', sans-serif;
          overflow: hidden;
        }

        /* ===== HEADER ===== */
        .screen-room-header {
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
        .status-dot {
          width: 7px; height: 7px; border-radius: 50%;
        }
        .status-dot.connected { background: #22c55e; box-shadow: 0 0 6px #22c55e; }
        .status-dot.connecting { background: #eab308; }
        .status-dot.disconnected { background: #ef4444; }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .btn-share {
          background: #fff;
          color: #000;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
          letter-spacing: 0.2px;
        }
        .btn-share:hover { opacity: 0.85; }
        .btn-stop {
          background: #ef4444;
          color: #fff;
          border: none;
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 0.78rem;
          font-weight: 600;
          cursor: pointer;
          transition: opacity 0.15s;
        }
        .btn-stop:hover { opacity: 0.85; }
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

        /* ===== BODY ===== */
        .screen-room-body {
          flex: 1;
          display: flex;
          gap: 0;
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

        /* ===== VIDEO ===== */
        .video-wrapper {
          flex: 1;
          min-height: 300px;
          background: #111;
          border-radius: 12px;
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid rgba(255,255,255,0.04);
        }
        .main-video {
          width: 100%;
          height: 100%;
          object-fit: contain;
          background: #000;
        }
        .empty-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
          text-align: center;
          padding: 40px;
        }
        .empty-title {
          color: rgba(255,255,255,0.3);
          font-size: 0.9rem;
          font-weight: 500;
        }
        .empty-sub {
          color: rgba(255,255,255,0.15);
          font-size: 0.78rem;
        }
        .live-badge {
          position: absolute;
          top: 12px;
          left: 12px;
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(0,0,0,0.7);
          backdrop-filter: blur(8px);
          padding: 4px 10px;
          border-radius: 6px;
          font-size: 0.65rem;
          font-weight: 700;
          color: #ef4444;
          letter-spacing: 1px;
        }
        .live-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #ef4444;
          animation: livePulse 1.5s infinite;
        }
        @keyframes livePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .error-bar {
          background: rgba(239,68,68,0.08);
          border: 1px solid rgba(239,68,68,0.15);
          color: #fca5a5;
          padding: 10px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
        }

        /* ===== CHAT PANEL ===== */
        .chat-panel {
          border-left: 1px solid rgba(255,255,255,0.05);
          overflow: hidden;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          min-height: 0;
        }

        /* ===== RESPONSIVE ===== */
        @media (max-width: 1024px) {
          .screen-room-body {
            flex-direction: column;
          }
          .chat-panel {
            border-left: none;
            border-top: 1px solid rgba(255,255,255,0.05);
            width: 100% !important;
            height: 350px !important;
          }
          .video-wrapper {
            min-height: 200px;
          }
        }

        @media (max-width: 600px) {
          .screen-room-header {
            padding: 0 12px;
            height: 46px;
            min-height: 46px;
          }
          .brand { font-size: 0.85rem; }
          .room-badge { display: none; }
          .btn-share, .btn-stop { padding: 5px 12px; font-size: 0.72rem; }
          .btn-leave { padding: 5px 10px; font-size: 0.7rem; }
          .btn-icon { width: 32px; height: 32px; }
          .main-content { padding: 8px; gap: 8px; }
          .chat-panel { height: 300px !important; }
        }

        /* Landscape mobile optimization */
        @media (max-height: 500px) and (orientation: landscape) {
          .screen-room-header { height: 40px; min-height: 40px; }
          .screen-room-body { flex-direction: row; }
          .chat-panel {
            border-left: 1px solid rgba(255,255,255,0.05);
            border-top: none;
            width: 320px !important;
            height: auto !important;
          }
          .main-content { padding: 6px; gap: 6px; }
          .video-wrapper { min-height: 0; }
        }
      `}</style>
    </div>
  );
};

export default ScreenShareRoom;
