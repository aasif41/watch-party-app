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
    { urls: "stun:stun2.l.google.com:19302" },
    { urls: "stun:stun3.l.google.com:19302" },
  ],
};

/* ======================================================
   NOISE GATE — Web Audio API noise suppression
   Creates an audio processing chain:
   Mic → Analyser (volume detection) → Gain (gate) → Output
   Silences audio when volume is below threshold (kills
   fan noise, keyboard clicks, ambient hum, etc.)
   ====================================================== */
const createNoiseGate = (stream) => {
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)({
      sampleRate: 16000, // Voice-optimized, low bandwidth
    });
    const source = audioCtx.createMediaStreamSource(stream);

    // Analyser for volume detection
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.5;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    // Gain node acts as the gate
    const gateGain = audioCtx.createGain();
    gateGain.gain.value = 1;

    // Highpass filter to cut low-frequency rumble (below 85Hz)
    const highpass = audioCtx.createBiquadFilter();
    highpass.type = "highpass";
    highpass.frequency.value = 85;
    highpass.Q.value = 0.7;

    // Lowpass filter to cut high-frequency hiss (above 8kHz for voice)
    const lowpass = audioCtx.createBiquadFilter();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 8000;
    lowpass.Q.value = 0.7;

    // Compressor to smooth out volume spikes
    const compressor = audioCtx.createDynamicsCompressor();
    compressor.threshold.value = -30;
    compressor.knee.value = 12;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.15;

    // Connect chain: source → highpass → lowpass → analyser → gateGain → compressor → destination
    const dest = audioCtx.createMediaStreamDestination();
    source.connect(highpass);
    highpass.connect(lowpass);
    lowpass.connect(analyser);
    analyser.connect(gateGain);
    gateGain.connect(compressor);
    compressor.connect(dest);

    // Noise gate loop — check volume ~30 times per second
    const NOISE_THRESHOLD = 18; // Volume below this = silence (0-255 scale)
    const GATE_ATTACK = 0.01;   // Seconds to open gate
    const GATE_RELEASE = 0.15;  // Seconds to close gate (smooth tail-off)
    let isOpen = false;
    let gateInterval = setInterval(() => {
      analyser.getByteFrequencyData(dataArray);
      // Calculate average volume
      let sum = 0;
      for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
      const avg = sum / dataArray.length;

      if (avg > NOISE_THRESHOLD) {
        if (!isOpen) {
          gateGain.gain.linearRampToValueAtTime(1, audioCtx.currentTime + GATE_ATTACK);
          isOpen = true;
        }
      } else {
        if (isOpen) {
          gateGain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + GATE_RELEASE);
          isOpen = false;
        }
      }
    }, 33);

    return {
      processedStream: dest.stream,
      audioContext: audioCtx,
      cleanup: () => {
        clearInterval(gateInterval);
        source.disconnect();
        highpass.disconnect();
        lowpass.disconnect();
        analyser.disconnect();
        gateGain.disconnect();
        compressor.disconnect();
        if (audioCtx.state !== "closed") audioCtx.close().catch(() => {});
      }
    };
  } catch (e) {
    console.warn("NoiseGate: Web Audio not available, using raw stream", e);
    return { processedStream: stream, audioContext: null, cleanup: () => {} };
  }
};

const VideoChat = ({ socket, roomId, username }) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [localStream, setLocalStream] = useState(null);
  const [peers, setPeers] = useState([]);
  const [activeFilter, setActiveFilter] = useState("none");
  const [activeSticker, setActiveSticker] = useState(null);
  const [stickerPos, setStickerPos] = useState({ x: 70, y: 10 });
  const [activePanel, setActivePanel] = useState(null);
  const [filterCategory, setFilterCategory] = useState(0);
  const [stickerPack, setStickerPack] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);

  const localVideoRef = useRef(null);
  const peerConnectionsRef = useRef(new Map());
  const localStreamRef = useRef(null);
  const rawStreamRef = useRef(null);        // Keep original mic stream for cleanup
  const noiseGateRef = useRef(null);         // Noise gate cleanup ref

  const enableVideoChat = async () => {
    try {
      // Get raw mic+cam stream with W3C standard constraints only (Safari-safe)
      const rawStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 320 }, height: { ideal: 240 }, frameRate: { ideal: 24 } },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,         // Mono — voice only, saves bandwidth
          sampleRate: { ideal: 16000 }, // Low sample rate for voice clarity
        },
      });

      rawStreamRef.current = rawStream;

      // Process audio through noise gate
      const noiseGate = createNoiseGate(rawStream);
      noiseGateRef.current = noiseGate;

      // Build the final stream: processed audio + original video
      const processedStream = new MediaStream();
      // Add noise-gated audio tracks
      noiseGate.processedStream.getAudioTracks().forEach(t => processedStream.addTrack(t));
      // Add original video tracks
      rawStream.getVideoTracks().forEach(t => processedStream.addTrack(t));

      localStreamRef.current = processedStream;
      setLocalStream(processedStream);
      setIsEnabled(true);
      socket.emit("video_chat_enabled", { room: roomId, username });
    } catch (err) {
      console.error("Camera/mic error:", err);
    }
  };

  const disableVideoChat = useCallback(() => {
    // Stop raw mic/camera tracks
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach((t) => t.stop());
      rawStreamRef.current = null;
    }
    // Cleanup noise gate audio context
    if (noiseGateRef.current) {
      noiseGateRef.current.cleanup();
      noiseGateRef.current = null;
    }
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
    // Mute processed audio tracks (noise gate output) + raw audio tracks
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    }
    // Raw audio tracks are separate (noise gate creates new tracks), so toggle those too
    if (rawStreamRef.current) {
      rawStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
    }
    setIsMuted(prev => !prev);
  };

  const toggleCamera = () => {
    // ONLY toggle on localStreamRef — the video track is the SAME object in both
    // localStreamRef and rawStreamRef (added via addTrack), so toggling both
    // would toggle it OFF then ON again, cancelling out!
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
    }
    setIsCamOff(prev => !prev);
  };

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Sync visual effects (filters/stickers)
  useEffect(() => {
    if (isEnabled) {
      socket.emit("video_chat_effect", { room: roomId, filter: activeFilter, sticker: activeSticker, stickerPos });
    }
  }, [isEnabled, activeFilter, activeSticker, stickerPos, peers.length, socket, roomId]);

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
      socket.emit("video_chat_offer", { to: peerId, offer: pc.localDescription, room: roomId, username });
    };

    const handleOffer = async ({ from, offer, username: peerUsername }) => {
      if (!localStreamRef.current) return;
      const pc = new RTCPeerConnection(ICE_SERVERS);
      peerConnectionsRef.current.set(from, pc);
      localStreamRef.current.getTracks().forEach((track) => pc.addTrack(track, localStreamRef.current));

      pc.ontrack = (event) => {
        setPeers((prev) => {
          const existing = prev.find((p) => p.peerId === from);
          if (existing) return prev.map((p) => p.peerId === from ? { ...p, stream: event.streams[0] } : p);
          return [...prev, { peerId: from, username: peerUsername || "Peer", stream: event.streams[0] }];
        });
      };

      pc.onicecandidate = (event) => {
        if (event.candidate) socket.emit("video_chat_ice", { to: from, candidate: event.candidate, room: roomId });
      };

      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      socket.emit("video_chat_answer", { to: from, answer: pc.localDescription, room: roomId, username });
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

    const handleEffect = ({ from, filter, sticker, stickerPos }) => {
      setPeers((prev) => prev.map((p) => p.peerId === from ? { ...p, filter, sticker, stickerPos } : p));
    };

    socket.on("peer_video_chat_enabled", handlePeerEnabled);
    socket.on("video_chat_offer", handleOffer);
    socket.on("video_chat_answer", handleAnswer);
    socket.on("video_chat_ice", handleIce);
    socket.on("peer_video_chat_disabled", handlePeerDisabled);
    socket.on("video_chat_effect", handleEffect);

    return () => {
      socket.off("peer_video_chat_enabled", handlePeerEnabled);
      socket.off("video_chat_offer", handleOffer);
      socket.off("video_chat_answer", handleAnswer);
      socket.off("video_chat_ice", handleIce);
      socket.off("peer_video_chat_disabled", handlePeerDisabled);
      socket.off("video_chat_effect", handleEffect);
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
            Camera & microphone · Noise suppressed
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
  const hasPeer = peers.length > 0;
  const mainStream = hasPeer ? peers[0].stream : localStream;
  const isMainLocal = !hasPeer;

  return (
    <div style={{
      width: "100%", height: "100%", position: "relative",
      background: "#000", overflow: "hidden", display: "flex", flexDirection: "column"
    }}>
      {/* Main Full-Size Video */}
      <video
        ref={(el) => {
          if (el && mainStream) {
            el.srcObject = mainStream;
            if (isMainLocal && localVideoRef) localVideoRef.current = el;
          }
        }}
        autoPlay playsInline muted={isMainLocal}
        style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: isMainLocal ? "scaleX(-1)" : "none",
          filter: isMainLocal ? activeFilter : (peers[0]?.filter || "none")
        }}
      />

      {/* Main stream labels & stickers (only apply stickers/bg if main is local) */}
      {isMainLocal && isCamOff && (
        <div style={{ position: "absolute", inset: 0, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "24px", fontWeight: "700", color: "#64748b" }}>
            {username.charAt(0).toUpperCase()}
          </div>
        </div>
      )}
      {isMainLocal && activeSticker && (
        <motion.div
          drag dragMomentum={false}
          style={{
            position: "absolute", top: `${stickerPos.y}%`, right: `${100 - stickerPos.x}%`,
            fontSize: "2.5rem", cursor: "grab", textShadow: "0 2px 12px rgba(0,0,0,0.6)", userSelect: "none"
          }}
          onDragEnd={(_, info) => {
            setStickerPos(prev => ({ x: Math.max(0, Math.min(90, prev.x + (info.offset.x / 2))), y: Math.max(0, Math.min(80, prev.y + (info.offset.y / 2))) }));
          }}
        >
          {activeSticker}
        </motion.div>
      )}

      {/* Main stream labels & stickers (if main is remote) */}
      {!isMainLocal && peers[0]?.sticker && (
        <div
          style={{
            position: "absolute", top: `${peers[0].stickerPos?.y || 10}%`, right: `${100 - (peers[0].stickerPos?.x || 70)}%`,
            fontSize: "2.5rem", textShadow: "0 2px 12px rgba(0,0,0,0.6)", userSelect: "none"
          }}
        >
          {peers[0].sticker}
        </div>
      )}

      {/* Label for main video */}
      <div style={{
        position: "absolute", top: "12px", left: "12px",
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
        padding: "4px 10px", borderRadius: "8px", fontSize: "0.7rem", color: "#fff"
      }}>
        {isMainLocal ? "You" : peers[0].username}
      </div>

      {/* Local PiP Video (Only show if there is a peer) */}
      {hasPeer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }}
          style={{
            position: "absolute", bottom: "70px", right: "12px",
            width: "90px", height: "130px", borderRadius: "10px",
            overflow: "hidden", background: "#111", border: "2px solid rgba(255,255,255,0.1)",
            boxShadow: "0 8px 24px rgba(0,0,0,0.4)", zIndex: 10
          }}
        >
          <video
            ref={(el) => { if (el && localStream) el.srcObject = localStream; localVideoRef.current = el; }}
            autoPlay playsInline muted
            style={{ width: "100%", height: "100%", objectFit: "cover", transform: "scaleX(-1)", filter: activeFilter }}
          />
          {isCamOff && (
            <div style={{ position: "absolute", inset: 0, background: "#111", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "rgba(255,255,255,0.1)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px", fontWeight: "700", color: "#64748b" }}>
                {username.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
          {activeSticker && (
            <div style={{ position: "absolute", bottom: "4px", right: "4px", fontSize: "1.2rem", textShadow: "0 2px 4px rgba(0,0,0,0.5)"}}>
              {activeSticker}
            </div>
          )}
        </motion.div>
      )}

      {/* Floating Toolbar */}
      <div style={{
        position: "absolute", bottom: "12px", left: "50%", transform: "translateX(-50%)",
        display: "flex", alignItems: "center", gap: "6px",
        background: "rgba(20, 20, 20, 0.85)", backdropFilter: "blur(12px)",
        border: "1px solid rgba(255,255,255,0.08)", padding: "6px", borderRadius: "12px", zIndex: 20
      }}>
        <ToolBtn active={!isMuted} onClick={toggleMute} title={isMuted ? "Unmute" : "Mute"}>{isMuted ? "🔇" : "🎤"}</ToolBtn>
        <ToolBtn active={!isCamOff} onClick={toggleCamera} title={isCamOff ? "Camera On" : "Camera Off"}>{isCamOff ? "📷" : "📹"}</ToolBtn>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
        <ToolBtn active={activePanel === "filters"} onClick={() => setActivePanel(p => p === "filters" ? null : "filters")}>🎨</ToolBtn>
        <ToolBtn active={activePanel === "stickers"} onClick={() => setActivePanel(p => p === "stickers" ? null : "stickers")}>😎</ToolBtn>
        <div style={{ width: "1px", height: "20px", background: "rgba(255,255,255,0.1)", margin: "0 2px" }} />
        <motion.button
          whileTap={{ scale: 0.9 }} onClick={disableVideoChat}
          style={{
            background: "#ef4444", color: "#fff", border: "none", width: "32px", height: "32px", borderRadius: "8px",
            display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer"
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </motion.button>
      </div>

      {/* Popovers for Filters/Stickers */}
      <AnimatePresence>
        {activePanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            style={{
              position: "absolute", bottom: "60px", left: "12px", right: "12px",
              background: "rgba(20,20,20,0.95)", backdropFilter: "blur(16px)",
              border: "1px solid rgba(255,255,255,0.08)", borderRadius: "12px",
              padding: "10px", zIndex: 15, maxHeight: "200px", overflowY: "auto"
            }}
          >
            {activePanel === "filters" && (
              <div>
                <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                  {FILTER_CATEGORIES.map((cat, idx) => (
                    <button key={cat.label} onClick={() => setFilterCategory(idx)} style={{ background: filterCategory === idx ? "rgba(255,255,255,0.1)" : "transparent", color: filterCategory === idx ? "#fff" : "rgba(255,255,255,0.4)", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "0.7rem", fontWeight: "600" }}>{cat.label}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {FILTER_CATEGORIES[filterCategory].filters.map((f) => (
                    <button key={f.label} onClick={() => setActiveFilter(f.value)} style={{ background: activeFilter === f.value ? "#fff" : "rgba(255,255,255,0.06)", color: activeFilter === f.value ? "#000" : "rgba(255,255,255,0.7)", border: "none", padding: "6px 10px", borderRadius: "8px", cursor: "pointer", fontSize: "0.7rem", fontWeight: "600", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>{f.icon}</span>{f.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {activePanel === "stickers" && (
              <div>
                <div style={{ display: "flex", gap: "4px", marginBottom: "8px" }}>
                  <button onClick={() => setActiveSticker(null)} style={{ background: activeSticker === null ? "rgba(255,255,255,0.1)" : "transparent", color: activeSticker === null ? "#fff" : "rgba(255,255,255,0.4)", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "0.7rem", fontWeight: "600" }}>None</button>
                  {STICKER_PACKS.map((pack, idx) => (
                    <button key={pack.label} onClick={() => setStickerPack(idx)} style={{ background: stickerPack === idx && activeSticker ? "rgba(255,255,255,0.1)" : "transparent", color: stickerPack === idx && activeSticker ? "#fff" : "rgba(255,255,255,0.4)", border: "none", padding: "4px 8px", borderRadius: "6px", cursor: "pointer", fontSize: "0.7rem", fontWeight: "600" }}>{pack.label}</button>
                  ))}
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                  {STICKER_PACKS[stickerPack].stickers.map((s) => (
                    <button key={s} onClick={() => setActiveSticker(s)} style={{ background: activeSticker === s ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)", border: activeSticker === s ? "1px solid rgba(255,255,255,0.3)" : "1px solid transparent", width: "34px", height: "34px", borderRadius: "8px", cursor: "pointer", fontSize: "1.1rem", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
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
