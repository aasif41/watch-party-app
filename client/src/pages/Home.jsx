import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { TubesCursorBackground } from "@/components/ui/tubes-curor";

// Inline SVG Logo Component (matches favicon)
const WPLogo = ({ size = 28 }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width={size} height={size} style={{ flexShrink: 0 }}>
    <defs>
      <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#60a5fa" />
        <stop offset="50%" stopColor="#3b82f6" />
        <stop offset="100%" stopColor="#93c5fd" />
      </linearGradient>
      <linearGradient id="logoBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e3a5f" />
        <stop offset="100%" stopColor="#0c1929" />
      </linearGradient>
      <filter id="logoGlow">
        <feGaussianBlur stdDeviation="2.5" result="blur" />
        <feFlood floodColor="#60a5fa" floodOpacity="0.7" result="color" />
        <feComposite in="color" in2="blur" operator="in" result="shadow" />
        <feMerge><feMergeNode in="shadow" /><feMergeNode in="SourceGraphic" /></feMerge>
      </filter>
    </defs>
    <rect width="100" height="100" rx="22" fill="url(#logoBg)" />
    <circle cx="50" cy="42" r="36" fill="#3b82f6" opacity="0.1" />
    <g filter="url(#logoGlow)">
      <path d="M22 28 L32 72 L44 44 L50 58 L56 44 L68 72 L78 28" fill="none" stroke="url(#logoGrad)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
    </g>
    <circle cx="50" cy="80" r="4" fill="#93c5fd" />
  </svg>
);

const isValidYouTubeUrl = (url) => {
  const patterns = [
    /^(https?:\/\/)?(www\.)?youtube\.com\/watch\?.*v=[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtu\.be\/[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/embed\/[\w-]{11}/,
    /^(https?:\/\/)?(www\.)?youtube\.com\/shorts\/[\w-]{11}/,
    /^(https?:\/\/)?m\.youtube\.com\/watch\?.*v=[\w-]{11}/,
  ];
  return patterns.some((pattern) => pattern.test(url.trim()));
};

// --- Content Data (English + Hinglish) with YouTube + Screen Share modes ---
const content = {
  en: {
    youtube: {
      sectionTitle: "How to Use",
      sectionSubtitle: "Everything you need to know about YouTube Watch Party",
      features: [
        { icon: "🎬", title: "Synchronized Playback", desc: "Watch YouTube videos together in perfect sync. When anyone plays, pauses, or seeks — everyone follows in real time." },
        { icon: "💬", title: "Live Chat", desc: "Chat with your friends while watching. Share reactions, comments, and moments — all in real-time alongside the video." },
        { icon: "🔗", title: "Easy Room Sharing", desc: "Create a room with a unique ID and share it with anyone. They just enter the same Room ID to join your watch party instantly." }
      ],
      stepsTitle: "Getting Started",
      steps: [
        { num: "01", title: "Pick a Username", desc: "Enter any display name you want your friends to see in the chat." },
        { num: "02", title: "Create or Join a Room", desc: "Type a Room ID — any word or number. Share this ID with friends so they can join the same room." },
        { num: "03", title: "Paste a YouTube Link", desc: "Copy a YouTube video URL and paste it in the Video Link field. Only valid YouTube links are accepted." },
        { num: "04", title: "Start Watching!", desc: "Click 'Initialize System' and you're in! Play/pause syncs automatically across all viewers." }
      ]
    },
    screenshare: {
      sectionTitle: "Screen Share Guide",
      sectionSubtitle: "Everything you need to know about Screen Share Watch Party",
      features: [
        { icon: "🖥️", title: "Screen Sharing", desc: "Share your entire screen, a specific window, or a browser tab with everyone in the room. Audio is captured too!" },
        { icon: "📹", title: "Video Chat", desc: "Enable your camera and microphone for face-to-face interaction while watching content together." },
        { icon: "🎨", title: "Fun Filters & Stickers", desc: "Apply fun video filters and stickers to your camera feed. Spice up your watch party with visual effects!" }
      ],
      stepsTitle: "Getting Started",
      steps: [
        { num: "01", title: "Pick a Username", desc: "Enter any display name for others to identify you in the room." },
        { num: "02", title: "Create or Join a Room", desc: "Enter a Room ID and share it with friends. Use the same ID to be in the same room." },
        { num: "03", title: "Share Your Screen", desc: "Click 'Share Screen' and choose what to share — full screen, a window, or a browser tab." },
        { num: "04", title: "Enable Video Chat", desc: "Toggle video chat to see each other while watching. Apply filters and stickers for fun!" }
      ]
    },
    toggleLabel: "Translate to Hinglish"
  },
  hi: {
    youtube: {
      sectionTitle: "Kaise Use Karein",
      sectionSubtitle: "YouTube Watch Party ke baare mein sab kuch jaano",
      features: [
        { icon: "🎬", title: "Synchronized Playback", desc: "YouTube videos saath mein sync mein dekho. Jab koi bhi play, pause ya seek kare — sabko real time mein same change dikhta hai." },
        { icon: "💬", title: "Live Chat", desc: "Video dekhte waqt apne doston ke saath chat karo. Reactions, comments aur moments — sab kuch real-time mein share karo." },
        { icon: "🔗", title: "Aasan Room Sharing", desc: "Ek unique ID ke saath room banao aur kisi ko bhi share karo. Unhe bas same Room ID daalna hoga aur wo turant join kar lenge." }
      ],
      stepsTitle: "Shuru Kaise Karein",
      steps: [
        { num: "01", title: "Username Daalo", desc: "Koi bhi display name daalo jo tumhare dost chat mein dekhein." },
        { num: "02", title: "Room Banao ya Join Karo", desc: "Koi bhi Room ID likho — koi word ya number. Ye ID apne friends ke saath share karo taaki wo same room join kar sakein." },
        { num: "03", title: "YouTube Link Paste Karo", desc: "YouTube video ka URL copy karo aur Video Link field mein paste karo. Sirf valid YouTube links accept hoti hain." },
        { num: "04", title: "Dekhna Shuru Karo!", desc: "'Initialize System' pe click karo aur bas! Play/pause automatically sabke liye sync hota hai." }
      ]
    },
    screenshare: {
      sectionTitle: "Screen Share Guide",
      sectionSubtitle: "Screen Share Watch Party ke baare mein sab kuch jaano",
      features: [
        { icon: "🖥️", title: "Screen Sharing", desc: "Apni poori screen, koi specific window, ya browser tab sabke saath share karo. Audio bhi capture hota hai!" },
        { icon: "📹", title: "Video Chat", desc: "Camera aur microphone enable karo taaki sab ek doosre ko dekh sakein content dekhte waqt." },
        { icon: "🎨", title: "Fun Filters & Stickers", desc: "Apne camera feed pe mazedaar filters aur stickers lagao. Watch party ko aur exciting banao!" }
      ],
      stepsTitle: "Shuru Kaise Karein",
      steps: [
        { num: "01", title: "Username Daalo", desc: "Koi bhi naam daal do jo room mein dikh sake." },
        { num: "02", title: "Room Banao ya Join Karo", desc: "Room ID daalo aur friends ke saath share karo. Same ID daalo same room join karne ke liye." },
        { num: "03", title: "Screen Share Karo", desc: "'Share Screen' pe click karo aur choose karo kya share karna hai — full screen, window, ya tab." },
        { num: "04", title: "Video Chat Enable Karo", desc: "Video chat on karo ek doosre ko dekhne ke liye. Filters aur stickers bhi laga sakte ho!" }
      ]
    },
    toggleLabel: "Translate to English"
  }
};

const glassCard = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(25px)",
  WebkitBackdropFilter: "blur(25px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
};

const Home = () => {
  const [username, setUsername] = useState("");
  const [room, setRoom] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGlow, setShowGlow] = useState(false);
  const [isHinglish, setIsHinglish] = useState(false);
  const [roomMode, setRoomMode] = useState("youtube");
  const [helpMode, setHelpMode] = useState("youtube");
  const helpRef = useRef(null);
  const navigate = useNavigate();



  const lang = isHinglish ? "hi" : "en";
  const t = content[lang][helpMode];
  const toggleLabel = content[lang].toggleLabel;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);



  const handleVideoUrlChange = (e) => {
    const val = e.target.value;
    setVideoUrl(val);
    if (val && !isValidYouTubeUrl(val)) {
      setLinkError("Please enter a valid YouTube video link");
    } else {
      setLinkError("");
    }
  };

  const joinRoom = () => {
    if (roomMode === "youtube") {
      if (!username || !room || !videoUrl) {
        alert("Fields cannot be empty!");
        return;
      }
      if (!isValidYouTubeUrl(videoUrl)) {
        setLinkError("Please enter a valid YouTube video link");
        return;
      }
      localStorage.setItem("wp_username", username);
      localStorage.setItem("wp_videoUrl", videoUrl);
      localStorage.setItem("wp_roomMode", "youtube");
      navigate(`/stream/${room}`);
    } else {
      if (!username || !room) {
        alert("Username and Room ID cannot be empty!");
        return;
      }
      localStorage.setItem("wp_username", username);
      localStorage.setItem("wp_roomMode", "screenshare");
      navigate(`/screen/${room}`);
    }
  };

  const scrollToHelp = () => {
    helpRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const modes = [
    { key: "youtube", label: "YouTube Party", icon: "🎬" },
    { key: "screenshare", label: "Screen Share", icon: "🖥️" },
  ];

  return (
    <div style={{
      height: "100vh",
      width: "100vw",
      backgroundColor: "#0a0a14",
      position: "fixed",
      top: 0,
      left: 0,
      overflow: "hidden",
      zIndex: 1
    }}
      onMouseMove={(e) => {
        setMousePos({ x: e.clientX, y: e.clientY });
        setShowGlow(true);
      }}
      onMouseLeave={() => setShowGlow(false)}
    >
      {/* === MOUSE HOVER GLOW — PURPLE === */}
      {showGlow && !isMobile && (
        <div style={{
          position: "absolute",
          left: mousePos.x - 150,
          top: mousePos.y - 150,
          width: 300,
          height: 300,
          borderRadius: "50%",
          background: `radial-gradient(circle, rgba(255, 255, 255, 0.06) 0%, transparent 70%)`,
          pointerEvents: "none",
          zIndex: 1,
          transition: "left 0.08s ease-out, top 0.08s ease-out",
          filter: "blur(30px)",
          mixBlendMode: "screen"
        }} />
      )}

      {/* === TUBES CURSOR 3D BACKGROUND === */}
      <TubesCursorBackground />

      {/* === FLOATING 3D DECORATIVE ELEMENTS === */}
      <div style={{ position: "fixed", inset: 0, zIndex: 1, pointerEvents: "none", overflow: "hidden" }}>
        {/* Large glowing orb — top right */}
        <motion.div
          animate={{
            y: [0, -30, 0, 20, 0],
            x: [0, 15, 0, -10, 0],
            scale: [1, 1.1, 1, 0.95, 1]
          }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "8%", right: "12%",
            width: isMobile ? "120px" : "200px", height: isMobile ? "120px" : "200px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(59, 130, 246, 0.12) 0%, rgba(37, 99, 235, 0.04) 50%, transparent 70%)",
            filter: "blur(40px)",
          }}
        />

        {/* Smaller orb — bottom left */}
        <motion.div
          animate={{
            y: [0, 25, 0, -15, 0],
            x: [0, -20, 0, 10, 0],
            scale: [1, 0.9, 1, 1.15, 1]
          }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", bottom: "15%", left: "8%",
            width: isMobile ? "100px" : "160px", height: isMobile ? "100px" : "160px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(96, 165, 250, 0.1) 0%, rgba(59, 130, 246, 0.03) 50%, transparent 70%)",
            filter: "blur(35px)",
          }}
        />

        {/* Warm accent orb — mid left */}
        <motion.div
          animate={{
            y: [0, -40, 0, 30, 0],
            x: [0, 10, 0, -8, 0],
            opacity: [0.6, 1, 0.6, 0.8, 0.6]
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "40%", left: "5%",
            width: isMobile ? "80px" : "140px", height: isMobile ? "80px" : "140px",
            borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245, 158, 11, 0.06) 0%, transparent 70%)",
            filter: "blur(30px)",
          }}
        />

        {/* Rotating ring — top left */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", top: isMobile ? "15%" : "20%", left: isMobile ? "5%" : "15%",
            width: isMobile ? "60px" : "100px", height: isMobile ? "60px" : "100px",
            borderRadius: "50%",
            border: "1px solid rgba(59, 130, 246, 0.08)",
            boxShadow: "0 0 20px rgba(59, 130, 246, 0.03)",
          }}
        />

        {/* Rotating ring — bottom right (opposite direction) */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 35, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", bottom: isMobile ? "25%" : "30%", right: isMobile ? "8%" : "18%",
            width: isMobile ? "50px" : "80px", height: isMobile ? "50px" : "80px",
            borderRadius: "50%",
            border: "1px solid rgba(96, 165, 250, 0.06)",
            boxShadow: "0 0 15px rgba(96, 165, 250, 0.02)",
          }}
        />

        {/* Diamond shape — mid right */}
        <motion.div
          animate={{
            rotate: [45, 55, 45, 35, 45],
            y: [0, -20, 0, 15, 0],
            opacity: [0.5, 0.8, 0.5, 0.7, 0.5]
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "55%", right: "10%",
            width: isMobile ? "20px" : "30px", height: isMobile ? "20px" : "30px",
            background: "linear-gradient(135deg, rgba(59, 130, 246, 0.1), rgba(96, 165, 250, 0.05))",
            border: "1px solid rgba(59, 130, 246, 0.1)",
            transform: "rotate(45deg)",
          }}
        />

        {/* Floating dots / particles */}
        {[
          { top: "12%", left: "25%", size: 4, delay: 0, dur: 15 },
          { top: "30%", right: "20%", size: 3, delay: 2, dur: 18 },
          { top: "65%", left: "18%", size: 5, delay: 4, dur: 20 },
          { top: "75%", right: "25%", size: 3, delay: 1, dur: 16 },
          { top: "45%", left: "35%", size: 2, delay: 3, dur: 22 },
          { top: "20%", right: "35%", size: 4, delay: 5, dur: 19 },
          { top: "85%", left: "40%", size: 3, delay: 2, dur: 17 },
          { top: "50%", right: "40%", size: 2, delay: 6, dur: 21 },
        ].map((p, i) => (
          <motion.div
            key={`particle-${i}`}
            animate={{
              y: [0, -15, 0, 10, 0],
              opacity: [0.3, 0.7, 0.3, 0.5, 0.3],
              scale: [1, 1.3, 1, 0.8, 1]
            }}
            transition={{
              duration: p.dur,
              repeat: Infinity,
              ease: "easeInOut",
              delay: p.delay
            }}
            style={{
              position: "absolute",
              top: p.top,
              left: p.left,
              right: p.right,
              width: `${p.size}px`,
              height: `${p.size}px`,
              borderRadius: "50%",
              background: "rgba(96, 165, 250, 0.4)",
              boxShadow: `0 0 ${p.size * 3}px rgba(59, 130, 246, 0.3)`,
            }}
          />
        ))}

        {/* Subtle horizontal line accents */}
        <motion.div
          animate={{ opacity: [0.03, 0.08, 0.03], scaleX: [0.8, 1, 0.8] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute", top: "35%", left: "10%", right: "60%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.15), transparent)",
          }}
        />
        <motion.div
          animate={{ opacity: [0.03, 0.06, 0.03], scaleX: [0.9, 1, 0.9] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 3 }}
          style={{
            position: "absolute", top: "70%", left: "55%", right: "10%",
            height: "1px",
            background: "linear-gradient(90deg, transparent, rgba(96, 165, 250, 0.12), transparent)",
          }}
        />

        {/* Cross/plus shape — lower left */}
        <motion.div
          animate={{
            rotate: [0, 90, 180, 270, 360],
            opacity: [0.4, 0.7, 0.4]
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          style={{
            position: "absolute", bottom: "35%", left: "12%",
            width: isMobile ? "16px" : "24px", height: isMobile ? "16px" : "24px",
          }}
        >
          <div style={{
            position: "absolute", top: "50%", left: 0, right: 0,
            height: "1px", background: "rgba(59, 130, 246, 0.12)",
            transform: "translateY(-50%)"
          }} />
          <div style={{
            position: "absolute", left: "50%", top: 0, bottom: 0,
            width: "1px", background: "rgba(59, 130, 246, 0.12)",
            transform: "translateX(-50%)"
          }} />
        </motion.div>
      </div>

      {/* NAVBAR OVERLAY */}
      <motion.nav
        initial={{ y: -40, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        style={{
          position: "absolute", top: 0, left: 0, right: 0, zIndex: 20,
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: isMobile ? "14px 20px" : "18px 40px",
          background: "rgba(10, 10, 20, 0.45)",
          backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
          pointerEvents: "auto"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: isMobile ? "8px" : "12px" }}>
          <WPLogo size={isMobile ? 28 : 34} />
          <h2 style={{
            margin: 0, fontSize: isMobile ? "1.1rem" : "1.4rem",
            fontWeight: "900", color: "#fff", letterSpacing: "1px"
          }}>
            WATCH<span style={{ color: "#3b82f6" }}>PARTY</span>
          </h2>
        </div>
        <div style={{
          fontSize: isMobile ? "0.65rem" : "0.7rem",
          color: "rgba(96, 165, 250, 0.4)", letterSpacing: "2px", fontWeight: "500"
        }}>
          SYNC · WATCH · CHAT
        </div>
      </motion.nav>

      {/* UI OVERLAY — SCROLLABLE CONTENT OVER FIXED BG */}
      <div style={{
        position: "relative", zIndex: 10, height: "100%",
        overflowY: "auto", overflowX: "hidden", pointerEvents: "auto"
      }}>
        {/* === FIRST SCREEN: Login Card centered === */}
        <div style={{
          minHeight: "100dvh",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          padding: isMobile ? "20px" : "0 20px"
        }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1 }}
            style={{
              ...glassCard,
              borderRadius: isMobile ? "18px" : "28px",
              padding: isMobile ? "24px 18px" : "36px 40px",
              width: isMobile ? "88%" : "85%",
              maxWidth: isMobile ? "320px" : "400px",
              textAlign: "center"
            }}
          >
            {/* Title */}
            <h1 style={{
              color: "#fff", fontSize: isMobile ? "1.5rem" : "2.2rem",
              fontWeight: "900", margin: 0
            }}>
              WATCH<span style={{ color: "#3b82f6" }}>PARTY</span>
            </h1>
            <p style={{
              color: "rgba(96, 165, 250, 0.5)",
              fontSize: isMobile ? "0.6rem" : "0.8rem",
              letterSpacing: isMobile ? "2px" : "3px",
              marginBottom: isMobile ? "10px" : "16px"
            }}>
              WATCH TOGETHER, ANYWHERE
            </p>

            {/* === MODE TOGGLE TABS === */}
            <div style={{
              display: "flex", gap: "0",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "14px", padding: "4px",
              marginBottom: isMobile ? "12px" : "18px",
              position: "relative",
              border: "1px solid rgba(255, 255, 255, 0.06)"
            }}>
              {modes.map((m) => (
                <motion.button
                  key={m.key}
                  onClick={() => { setRoomMode(m.key); setLinkError(""); }}
                  style={{
                    flex: 1, padding: isMobile ? "10px 8px" : "12px 16px",
                    background: "transparent", border: "none",
                    color: roomMode === m.key ? "#fff" : "rgba(255,255,255,0.4)",
                    fontSize: isMobile ? "0.75rem" : "0.85rem", fontWeight: "700",
                    cursor: "pointer", borderRadius: "11px",
                    position: "relative", zIndex: 2,
                    transition: "color 0.2s", display: "flex",
                    alignItems: "center", justifyContent: "center", gap: "6px",
                    whiteSpace: "nowrap"
                  }}
                >
                  {roomMode === m.key && (
                    <motion.div
                      layoutId="activeTab"
                      style={{
                        position: "absolute", inset: 0,
                        background: roomMode === "youtube"
                          ? "linear-gradient(135deg, rgba(37, 99, 235, 0.35), rgba(59, 130, 246, 0.25))"
                          : "linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(37, 99, 235, 0.2))",
                        borderRadius: "11px",
                        border: "1px solid rgba(59, 130, 246, 0.15)",
                        zIndex: -1
                      }}
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span>{m.icon}</span>
                  <span>{m.label}</span>
                </motion.button>
              ))}
            </div>

            {/* === FORM FIELDS === */}
            <div style={{ display: "flex", flexDirection: "column", gap: isMobile ? "8px" : "10px" }}>
              <input
                style={{
                  ...inputStyle,
                  padding: isMobile ? "10px 12px" : "13px 16px",
                  borderRadius: isMobile ? "10px" : "12px",
                  fontSize: isMobile ? "13px" : "14px"
                }}
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <input
                style={{
                  ...inputStyle,
                  padding: isMobile ? "10px 12px" : "13px 16px",
                  borderRadius: isMobile ? "10px" : "12px",
                  fontSize: isMobile ? "13px" : "14px"
                }}
                placeholder="Room ID"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
              />

              {/* YouTube mode: show video link field */}
              <AnimatePresence mode="wait">
                {roomMode === "youtube" && (
                  <motion.div
                    key="youtube-link"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <input
                      style={{
                        ...inputStyle,
                        padding: isMobile ? "10px 12px" : "13px 16px",
                        borderRadius: isMobile ? "10px" : "12px",
                        fontSize: isMobile ? "13px" : "14px",
                        width: "100%",
                        border: linkError ? "1px solid rgba(239, 68, 68, 0.6)" : "1px solid rgba(255, 255, 255, 0.1)"
                      }}
                      placeholder="YouTube Video Link"
                      value={videoUrl}
                      onChange={handleVideoUrlChange}
                    />
                    {linkError && (
                      <p style={{
                        color: "#ef4444", fontSize: "0.75rem",
                        margin: "6px 0 0 4px", textAlign: "left"
                      }}>
                        ⚠ {linkError}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Screen share mode info */}
              <AnimatePresence mode="wait">
                {roomMode === "screenshare" && (
                  <motion.div
                    key="screenshare-info"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{
                      background: "rgba(16, 185, 129, 0.06)",
                      border: "1px solid rgba(16, 185, 129, 0.15)",
                      borderRadius: isMobile ? "10px" : "14px",
                      padding: isMobile ? "12px" : "16px",
                      color: "rgba(16, 185, 129, 0.8)",
                      fontSize: isMobile ? "0.75rem" : "0.85rem",
                      lineHeight: "1.5"
                    }}>
                      🖥️ You'll be able to share your screen after joining the room. Screen, window, and tab sharing are supported.
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(37, 99, 235, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  ...buttonStyle,
                  padding: isMobile ? "12px" : "14px",
                  borderRadius: isMobile ? "10px" : "12px",
                  fontSize: isMobile ? "12px" : "14px"
                }}
                onClick={joinRoom}
              >
                {roomMode === "youtube" ? "INITIALIZE SYSTEM" : "START SCREEN SHARE ROOM"}
              </motion.button>
            </div>
          </motion.div>

          {/* Scroll Down Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 0.8 }}
            onClick={scrollToHelp}
            style={{
              marginTop: isMobile ? "25px" : "35px",
              display: "flex", flexDirection: "column", alignItems: "center",
              gap: "8px", cursor: "pointer"
            }}
          >
            <span style={{
              fontSize: isMobile ? "0.65rem" : "0.75rem",
              color: "rgba(255, 255, 255, 0.5)", letterSpacing: "2px",
              fontWeight: "500", textTransform: "uppercase"
            }}>
              Scroll down for help
            </span>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              style={{
                width: "22px", height: "36px", borderRadius: "11px",
                border: "2px solid rgba(255, 255, 255, 0.5)",
                display: "flex", justifyContent: "center", paddingTop: "7px"
              }}
            >
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3], y: [0, 10, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  width: "3px", height: "7px", borderRadius: "2px",
                  background: "rgba(255, 255, 255, 0.5)"
                }}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* === SECOND SCREEN: How to Use Section === */}
        <div ref={helpRef} style={{
          padding: isMobile ? "50px 20px 60px" : "80px 40px 100px",
          maxWidth: "1000px", margin: "0 auto",
          display: "flex", flexDirection: "column", alignItems: "center"
        }}>
          {/* Top Controls: Language Toggle + Help Mode Toggle */}
          <div style={{
            display: "flex", gap: "12px", flexWrap: "wrap",
            justifyContent: "center", alignItems: "center",
            marginBottom: isMobile ? "30px" : "45px"
          }}>
            {/* Language Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsHinglish(!isHinglish)}
              style={{
                ...glassCard,
                borderRadius: "12px",
                padding: isMobile ? "8px 16px" : "10px 22px",
                color: "#60a5fa",
                fontSize: isMobile ? "0.7rem" : "0.8rem",
                fontWeight: "600", cursor: "pointer", letterSpacing: "1px",
                display: "flex", alignItems: "center", gap: "6px",
                transition: "all 0.3s ease"
              }}
            >
              🌐 {toggleLabel}
            </motion.button>

            {/* Help Mode Tabs */}
            <div style={{
              display: "flex", gap: "0",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "12px", padding: "3px",
              border: "1px solid rgba(255, 255, 255, 0.06)"
            }}>
              {[
                { key: "youtube", label: "🎬 YouTube", color: "#3b82f6" },
                { key: "screenshare", label: "🖥️ Screen Share", color: "#10b981" }
              ].map((m) => (
                <motion.button
                  key={m.key}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setHelpMode(m.key)}
                  style={{
                    padding: isMobile ? "6px 12px" : "8px 18px",
                    background: helpMode === m.key ? "rgba(59, 130, 246, 0.1)" : "transparent",
                    border: helpMode === m.key ? `1px solid ${m.color}33` : "1px solid transparent",
                    color: helpMode === m.key ? m.color : "rgba(255,255,255,0.4)",
                    fontSize: isMobile ? "0.7rem" : "0.78rem",
                    fontWeight: "600", cursor: "pointer", borderRadius: "9px",
                    transition: "all 0.2s ease"
                  }}
                >
                  {m.label}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Section Title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.6 }}
            style={{ textAlign: "center", marginBottom: isMobile ? "30px" : "50px" }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={helpMode + lang}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
              >
                <h2 style={{
                  fontSize: isMobile ? "1.8rem" : "2.6rem",
                  fontWeight: "900", color: "#fff", margin: "0 0 10px 0"
                }}>
                  {t.sectionTitle.split(" ").map((word, i, arr) => (
                    <span key={i}>
                      {i > 0 && " "}
                      {i === arr.length - 1
                        ? <span style={{ color: helpMode === "youtube" ? "#3b82f6" : "#10b981" }}>{word}</span>
                        : word}
                    </span>
                  ))}
                </h2>
                <p style={{
                  color: "rgba(255,255,255,0.35)",
                  fontSize: isMobile ? "0.8rem" : "1rem",
                  maxWidth: "450px", margin: "0 auto", lineHeight: "1.6"
                }}>
                  {t.sectionSubtitle}
                </p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Feature Cards */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(3, 1fr)",
            gap: isMobile ? "14px" : "20px",
            width: "100%",
            marginBottom: isMobile ? "40px" : "60px"
          }}>
            <AnimatePresence mode="wait">
              {t.features.map((f, idx) => (
                <motion.div
                  key={helpMode + lang + idx}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: idx * 0.12 }}
                  whileHover={{ y: -4, borderColor: "rgba(59, 130, 246, 0.25)", transition: { duration: 0.2 } }}
                  style={{
                    ...glassCard,
                    borderRadius: isMobile ? "18px" : "24px",
                    padding: isMobile ? "24px 20px" : "32px 28px",
                    cursor: "default"
                  }}
                >
                  <div style={{ fontSize: "2rem", marginBottom: "14px" }}>
                    {f.icon}
                  </div>
                  <h3 style={{
                    color: "#f1f5f9", fontSize: isMobile ? "1rem" : "1.1rem",
                    fontWeight: "700", margin: "0 0 8px 0"
                  }}>
                    {f.title}
                  </h3>
                  <p style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: isMobile ? "0.8rem" : "0.88rem",
                    lineHeight: "1.6", margin: 0
                  }}>
                    {f.desc}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Steps Title */}
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: false, amount: 0.1 }}
            transition={{ duration: 0.5 }}
            style={{
              fontSize: isMobile ? "1.4rem" : "1.8rem",
              fontWeight: "800", color: "#fff", textAlign: "center",
              marginBottom: isMobile ? "24px" : "35px"
            }}
          >
            {t.stepsTitle}
          </motion.h3>

          {/* Steps */}
          <div style={{
            display: "grid",
            gridTemplateColumns: isMobile ? "1fr" : "repeat(2, 1fr)",
            gap: isMobile ? "12px" : "18px",
            width: "100%"
          }}>
            <AnimatePresence mode="wait">
              {t.steps.map((step, idx) => (
                <motion.div
                  key={helpMode + lang + idx}
                  initial={{ opacity: 0, x: idx % 2 === 0 ? -15 : 15 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: false, amount: 0.1 }}
                  transition={{ duration: 0.4, delay: idx * 0.1 }}
                  style={{
                    ...glassCard,
                    borderRadius: isMobile ? "14px" : "18px",
                    padding: isMobile ? "18px 16px" : "22px 24px",
                    display: "flex", gap: isMobile ? "12px" : "16px",
                    alignItems: "flex-start"
                  }}
                >
                  <div style={{
                    minWidth: isMobile ? "36px" : "44px",
                    height: isMobile ? "36px" : "44px",
                    borderRadius: "12px",
                    background: helpMode === "youtube"
                      ? "linear-gradient(135deg, rgba(37,99,235,0.3), rgba(59,130,246,0.2))"
                      : "linear-gradient(135deg, rgba(16,185,129,0.25), rgba(37,99,235,0.2))",
                    border: helpMode === "youtube"
                      ? "1px solid rgba(59,130,246,0.2)"
                      : "1px solid rgba(16,185,129,0.25)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: isMobile ? "0.8rem" : "0.95rem",
                    fontWeight: "800",
                    color: helpMode === "youtube" ? "#60a5fa" : "#6ee7b7"
                  }}>
                    {step.num}
                  </div>
                  <div>
                    <h4 style={{
                      color: "#e2e8f0",
                      fontSize: isMobile ? "0.9rem" : "1rem",
                      fontWeight: "700", margin: "0 0 5px 0"
                    }}>
                      {step.title}
                    </h4>
                    <p style={{
                      color: "rgba(255,255,255,0.38)",
                      fontSize: isMobile ? "0.78rem" : "0.85rem",
                      lineHeight: "1.55", margin: 0
                    }}>
                      {step.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div style={{
            marginTop: isMobile ? "45px" : "65px",
            textAlign: "center", paddingTop: "25px",
            borderTop: "1px solid rgba(255, 255, 255, 0.06)",
            width: "100%"
          }}>
            <p style={{
              color: "rgba(96, 165, 250, 0.2)",
              fontSize: "0.7rem", letterSpacing: "2px"
            }}>
              WATCHPARTY — Watch Together, Anywhere<br />Design and created by Asif
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  padding: "16px",
  background: "rgba(255, 255, 255, 0.04)",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  borderRadius: "14px",
  color: "#fff",
  outline: "none",
  transition: "border-color 0.2s ease, box-shadow 0.2s ease",
};

const buttonStyle = {
  padding: "18px",
  background: "rgba(255, 255, 255, 0.06)",
  color: "#fff",
  border: "1px solid rgba(255, 255, 255, 0.12)",
  borderRadius: "14px",
  fontWeight: "700",
  cursor: "pointer",
  marginTop: "10px",
  letterSpacing: "1px",
  transition: "all 0.2s ease"
};

export default Home;