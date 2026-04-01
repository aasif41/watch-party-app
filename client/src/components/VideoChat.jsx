import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

/* ======================================================
   FILTERS — Advanced CSS-based video effects
   ====================================================== */
const FILTER_CATEGORIES = [
  {
    label: "Basic",
    filters: [
      { label: "None", value: "none", icon: "✨" },
      { label: "B&W", value: "grayscale(100%) contrast(1.1)", icon: "⚫" },
      { label: "Sepia", value: "sepia(85%) saturate(1.2)", icon: "🟤" },
      { label: "Bloom", value: "brightness(1.25) contrast(1.05) saturate(1.15)", icon: "🌟" },
    ]
  },
  {
    label: "Color",
    filters: [
      { label: "Arctic", value: "hue-rotate(180deg) saturate(0.9) brightness(1.1)", icon: "🧊" },
      { label: "Sunset", value: "hue-rotate(-25deg) saturate(1.5) brightness(1.05)", icon: "🌅" },
      { label: "Neon", value: "saturate(2.5) contrast(1.3) brightness(1.1)", icon: "💜" },
      { label: "Vintage", value: "sepia(35%) contrast(1.15) brightness(0.95) saturate(0.85)", icon: "📷" },
    ]
  },
  {
    label: "Creative",
    filters: [
      { label: "Noir", value: "grayscale(100%) contrast(1.6) brightness(0.85)", icon: "🎬" },
      { label: "Dream", value: "blur(1px) brightness(1.15) saturate(1.3)", icon: "💭" },
      { label: "Invert", value: "invert(90%) hue-rotate(180deg)", icon: "🔄" },
      { label: "Matrix", value: "hue-rotate(90deg) saturate(3) brightness(0.9)", icon: "🟢" },
    ]
  }
];

/* ======================================================
   STICKERS — Fun overlays with positioning
   ====================================================== */
const STICKER_PACKS = [
  {
    label: "Faces",
    stickers: ["😎", "🤩", "😂", "🥳", "😈", "🤯", "🥶", "🤠"]
  },
  {
    label: "Fun",
    stickers: ["👑", "🎭", "🦄", "🔥", "⚡", "🌈", "💎", "🚀"]
  },
  {
    label: "Hearts",
    stickers: ["❤️", "💜", "💙", "💚", "🧡", "💛", "🖤", "💗"]
  }
];

const ICE_SERVERS = {
  iceServers: [
    { urls: "stun:stun.l.google.com:19302" },
    { urls: "stun:stun1.l.google.com:19302" },
  ],
};

const VideoChat = ({ socket, roomId, username }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("none");
  const [activeSticker, setActiveSticker] = useState(null);
  const [stickerPos, setStickerPos] = useState({ x: 70, y: 10 });
  const [activePanel, setActivePanel] = useState(null); // 'filters' | 'stickers' | null
  const [filterCategory, setFilterCategory] = useState(0);
  const [stickerPack, setStickerPack] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);

  const enableVideoChat = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 24 } },
        audio: true,
      });
      localStreamRef.current = stream;
      setLocalStream(stream);
      setIsEnabled(true);
      socket.emit("video_chat_enabled", { room: roomId, username });
    } catch (err) {
      console.error("Camera/mic error:", err);
    }
  };

  const disableVideoChat = useCallback(() => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
      localStreamRef.current = null;
    }
    setLocalStream(null);
    setIsEnabled(false);
    peerConnectionsRef.current.forEach((pc) => pc.close());
    peerConnectionsRef.current.clear();
    setPeers([]);
    socket.emit("video_chat_disabled", { room: roomId });
  }, [socket, roomId]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsMuted(prev => !prev);
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
      setIsCamOff(prev => !prev);
    }
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Peer signaling
  useEffect(() => {
    if (!isEnabled) return;

    const handlePeerEnabled = async ({ peerId, username: peerUsername }) => {
      if (!localStreamRef.current) return;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(peerId, pc);
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));

      pc.ontrack = (event) => {
        setPeers((prev) => {
          const existing = prev.find((p) => p.peerId === peerId);
          if (existing) return prev.map((p) => p.peerId === peerId ? { ...p, stream: event.streams[0] } : p);
          return [...prev, { peerId, username: peerUsername, stream: event.streams[0] }];
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("video_chat_ice", { to: peerId, candidate: event.candidate, room: roomId });
      };

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      socket.emit("video_chat_offer", { to: peerId, offer: pc.localDescription, room: roomId });
    };

    const handleOffer = async ({ from, offer }) => {
      if (!localStreamRef.current) return;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(from, pc);
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));

      pc.ontrack = (event) => {
        setPeers((prev) => {
          const existing = prev.find((p) => p.peerId === from);
          if (existing) return prev.map((p) => p.peerId === from ? { ...p, stream: event.streams[0] } : p);
          return [...prev, { peerId: from, username: "Peer", stream: event.streams[0] }];
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("video_chat_ice", { to: from, candidate: event.candidate, room: roomId });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("video_chat_answer", { to: from, answer: pc.localDescription, room: roomId });
    };

    const handleAnswer = async ({ from, answer }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc) await pc.setRemoteDescription(new RTCSessionDescription(answer));
    };

    const handleIce = async ({ from, candidate }) => {
      const pc = peerConnectionsRef.current.get(from);
      if (pc && candidate) await pc.addIceCandidate(new RTCIceCandidate(candidate));
    };

    const handlePeerDisabled = ({ peerId }) => {
      const pc = peerConnectionsRef.current.get(peerId);
      if (pc) { pc.close(); peerConnectionsRef.current.delete(peerId); }
      setPeers((prev) => prev.filter((p) => p.peerId !== peerId));
    };

    socket.on("peer_video_chat_enabled", handlePeerEnabled);
    socket.on("video_chat_offer", handleOffer);
    socket.on("video_chat_answer", handleAnswer);
    socket.on("video_chat_ice", handleIce);
    socket.on("peer_video_chat_disabled", handlePeerDisabled);

    return () => {
      socket.off("peer_video_chat_enabled", handlePeerEnabled);
      socket.off("video_chat_offer", handleOffer);
      socket.off("video_chat_answer", handleAnswer);
      socket.off("video_chat_ice", handleIce);
      socket.off("peer_video_chat_disabled", handlePeerDisabled);
    };
  }, [isEnabled, socket, roomId]);

  useEffect(() => { return () => disableVideoChat(); }, [disableVideoChat]);

  // Not enabled state
  if (!isEnabled) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          background: "rgba(255,255,255,0.03)", borderRadius: "16px",
          border: "1px solid rgba(255,255,255,0.06)", padding: "20px",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: "16px", flexWrap: "wrap"
        }}
      >
        <div>
          <p style={{ color: "#94a3b8", fontSize: "0.85rem", margin: 0, fontWeight: "500" }}>
            Video Chat
          </p>
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "0.75rem", margin: "4px 0 0" }}>
            Camera & microphone
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={enableVideoChat}
          style={{
            background: "#fff", color: "#000", border: "none",
            padding: "10px 20px", borderRadius: "10px",
            fontWeight: "600", cursor: "pointer", fontSize: "0.8rem",
            letterSpacing: "0.5px"
          }}
        >
          Enable
        </motion.button>
      </motion.div>
    );
  }

  // Active video chat UI
  const totalParticipants = peers.length + 1;
  const gridCols = totalParticipants <= 2 ? totalParticipants : Math.min(totalParticipants, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        background: "rgba(255,255,255,0.02)", borderRadius: "16px",
        border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden"
      }}
    >
      {/* Toolbar */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 14px", borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(0,0,0,0.2)", gap: "8px", flexWrap: "wrap"
      }}>
        {/* Left: Controls */}
        <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
          <ToolBtn active={!isMuted} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>
            {isMuted ? "🔇" : "🎤"}
          </ToolBtn>
          <ToolBtn active={!isCamOff} onClick={toggleCamera} title={isCamOff ? "Camera On" : "Camera Off"}>
            {isCamOff ? "📷" : "📹"}
          </ToolBtn>
          <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.08)", margin: "0 4px" }} />
          <ToolBtn active={activePanel === "filters"} onClick={() => setActivePanel(p => p === "filters" ? null : "filters")}>
            🎨
          </ToolBtn>
          <ToolBtn active={activePanel === "stickers"} onClick={() => setActivePanel(p => p === "stickers" ? null : "stickers")}>
            😎
          </ToolBtn>
        </div>

        {/* Right: End */}
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={disableVideoChat}
          style={{
            background: "rgba(239,68,68,0.15)", color: "#f87171",
            border: "1px solid rgba(239,68,68,0.2)", padding: "5px 12px",
            borderRadius: "8px", cursor: "pointer", fontSize: "0.72rem",
            fontWeight: "600", letterSpacing: "0.3px"
          }}
        >
          End
        </motion.button>
      </div>

      {/* Filter/Sticker Panels */}
      <AnimatePresence>
        {activePanel === "filters" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ padding: "10px 14px" }}>
              {/* Category tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                {FILTER_CATEGORIES.map((cat, idx) => (
                  <button
                    key={cat.label}
                    onClick={() => setFilterCategory(idx)}
                    style={{
                      background: filterCategory === idx ? "rgba(255,255,255,0.1)" : "transparent",
                      color: filterCategory === idx ? "#fff" : "rgba(255,255,255,0.4)",
                      border: "none", padding: "4px 10px", borderRadius: "6px",
                      cursor: "pointer", fontSize: "0.7rem", fontWeight: "600",
                      transition: "all 0.15s"
                    }}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
              {/* Filter grid */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {FILTER_CATEGORIES[filterCategory].filters.map((f) => (
                  <motion.button
                    key={f.label}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setActiveFilter(f.value)}
                    style={{
                      background: activeFilter === f.value ? "#fff" : "rgba(255,255,255,0.06)",
                      color: activeFilter === f.value ? "#000" : "rgba(255,255,255,0.7)",
                      border: "none", padding: "6px 12px", borderRadius: "8px",
                      cursor: "pointer", fontSize: "0.72rem", fontWeight: "600",
                      display: "flex", alignItems: "center", gap: "4px",
                      transition: "all 0.15s"
                    }}
                  >
                    <span style={{ fontSize: "0.85rem" }}>{f.icon}</span>
                    {f.label}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activePanel === "stickers" && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{ overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
          >
            <div style={{ padding: "10px 14px" }}>
              {/* Pack tabs */}
              <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                <button
                  onClick={() => setActiveSticker(null)}
                  style={{
                    background: activeSticker === null ? "rgba(255,255,255,0.1)" : "transparent",
                    color: activeSticker === null ? "#fff" : "rgba(255,255,255,0.4)",
                    border: "none", padding: "4px 10px", borderRadius: "6px",
                    cursor: "pointer", fontSize: "0.7rem", fontWeight: "600"
                  }}
                >
                  None
                </button>
                {STICKER_PACKS.map((pack, idx) => (
                  <button
                    key={pack.label}
                    onClick={() => setStickerPack(idx)}
                    style={{
                      background: stickerPack === idx && activeSticker ? "rgba(255,255,255,0.1)" : "transparent",
                      color: stickerPack === idx && activeSticker ? "#fff" : "rgba(255,255,255,0.4)",
                      border: "none", padding: "4px 10px", borderRadius: "6px",
                      cursor: "pointer", fontSize: "0.7rem", fontWeight: "600"
                    }}
                  >
                    {pack.label}
                  </button>
                ))}
              </div>
              {/* Sticker grid */}
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                {STICKER_PACKS[stickerPack].stickers.map((s) => (
                  <motion.button
                    key={s}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setActiveSticker(s)}
                    style={{
                      background: activeSticker === s ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
                      border: activeSticker === s ? "1px solid rgba(255,255,255,0.2)" : "1px solid transparent",
                      width: "38px", height: "38px", borderRadius: "10px",
                      cursor: "pointer", fontSize: "1.2rem",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      transition: "all 0.15s"
                    }}
                  >
                    {s}
                  </motion.button>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Video Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
        gap: "2px", padding: "2px"
      }}>
        {/* Local */}
        <div style={{ position: "relative", borderRadius: "12px", overflow: "hidden", background: "#111", aspectRatio: "4/3" }}>
          <video
            ref={localVideoRef}
            autoPlay muted playsInline
            style={{
              width: "100%", height: "100%", objectFit: "cover",
              filter: activeFilter, transform: "scaleX(-1)"
            }}
          />
          {isCamOff && (
            <div style={{
              position: "absolute", inset: 0, background: "#111",
              display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <div style={{
                width: "40px", height: "40px", borderRadius: "50%",
                background: "rgba(255,255,255,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "18px", fontWeight: "700", color: "#64748b"
              }}>
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          {activeSticker && (
            <motion.div
              drag
              dragMomentum={false}
              style={{
                position: "absolute", top: `${stickerPos.y}%`, right: `${100 - stickerPos.x}%`,
                fontSize: "2rem", cursor: "grab",
                textShadow: "0 2px 12px rgba(0,0,0,0.6)",
                userSelect: "none"
              }}
              onDragEnd={(_, info) => {
                setStickerPos(prev => ({
                  x: Math.max(0, Math.min(90, prev.x + (info.offset.x / 2))),
                  y: Math.max(0, Math.min(80, prev.y + (info.offset.y / 2)))
                }));
              }}
            >
              {activeSticker}
            </motion.div>
          )}
          <div style={{
            position: "absolute", bottom: "6px", left: "6px",
            background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
            padding: "2px 8px", borderRadius: "6px",
            fontSize: "0.65rem", color: "rgba(255,255,255,0.8)",
            fontWeight: "500"
          }}>
            You
          </div>
        </div>

        {/* Remote peers */}
        {peers.map((peer) => (
          <div key={peer.peerId} style={{
            position: "relative", borderRadius: "12px", overflow: "hidden",
            background: "#111", aspectRatio: "4/3"
          }}>
            <video
              ref={(el) => { if (el && peer.stream) el.srcObject = peer.stream; }}
              autoPlay playsInline
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <div style={{
              position: "absolute", bottom: "6px", left: "6px",
              background: "rgba(0,0,0,0.65)", backdropFilter: "blur(8px)",
              padding: "2px 8px", borderRadius: "6px",
              fontSize: "0.65rem", color: "rgba(255,255,255,0.8)",
              fontWeight: "500"
            }}>
              {peer.username}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
};

/* Small toolbar button component */
const ToolBtn = ({ children, active, onClick, title }) => (
  <motion.button
    whileTap={{ scale: 0.9 }}
    onClick={onClick}
    title={title}
    style={{
      background: active ? "rgba(255,255,255,0.1)" : "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      width: "32px", height: "32px", borderRadius: "8px",
      cursor: "pointer", fontSize: "0.9rem",
      display: "flex", alignItems: "center", justifyContent: "center",
      transition: "background 0.15s"
    }}
  >
    {children}
  </motion.button>
);

export default VideoChat;
