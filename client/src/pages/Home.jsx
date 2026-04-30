import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { nanoid } from "nanoid";
import { TubesCursorBackground } from "@/components/ui/tubes-curor";
import { useAuth } from "../hooks/useAuth";
import { Helmet } from "react-helmet-async";

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

const SVGIcons = {
  Play: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>,
  Chat: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>,
  Link: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>,
  Screen: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>,
  Video: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>,
  Filter: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>,
  Check: <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>,
  Lock: <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>,
  Globe: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1 4-10z"></path></svg>,
  Plus: <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>,
  ArrowRight: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
};

// --- Content Data (English + Hinglish) with YouTube + Screen Share modes ---
const content = {
  en: {
    youtube: {
      sectionTitle: "How to Use",
      sectionSubtitle: "Everything you need to know about YouTube Watch Party",
      features: [
        { icon: SVGIcons.Play, title: "Synchronized Playback", desc: "Watch YouTube videos together in perfect sync. When anyone plays, pauses, or seeks — everyone follows in real time." },
        { icon: SVGIcons.Chat, title: "Live Chat", desc: "Chat with your friends while watching. Share reactions, comments, and moments — all in real-time alongside the video." },
        { icon: SVGIcons.Link, title: "Easy Room Sharing", desc: "Create a room with a unique ID and share it with anyone. They just enter the same Room ID to join your watch party instantly." }
      ],
      stepsTitle: "Getting Started",
      steps: [
        { num: "01", title: "Secure Login", desc: "Sign in with your Google account for a safe and personalized experience." },
        { num: "02", title: "Create or Join", desc: "Create a new Watch Party room or paste an existing Room ID to join your friends." },
        { num: "03", title: "Add YouTube Link", desc: "Paste any valid YouTube URL to queue up the video for everyone." },
        { num: "04", title: "Watch Together", desc: "Start watching! Play, pause, and seek will instantly sync for all members." }
      ]
    },
    screenshare: {
      sectionTitle: "Screen Share Guide",
      sectionSubtitle: "Everything you need to know about Screen Share Watch Party",
      features: [
        { icon: SVGIcons.Screen, title: "Screen Sharing", desc: "Share your entire screen, a specific window, or a browser tab with everyone in the room. Audio is captured too!" },
        { icon: SVGIcons.Video, title: "Video Chat", desc: "Enable your camera and microphone for face-to-face interaction while watching content together." },
        { icon: SVGIcons.Filter, title: "Fun Filters & Stickers", desc: "Apply fun video filters and stickers to your camera feed. Spice up your watch party with visual effects!" }
      ],
      stepsTitle: "Getting Started",
      steps: [
        { num: "01", title: "Secure Login", desc: "Log in safely with Google. Your profile information will be shown in the room." },
        { num: "02", title: "Create or Join", desc: "Start your own screen share room or join someone else's using a Room ID." },
        { num: "03", title: "Start Presenting", desc: "Click 'Share Screen' to broadcast a browser tab, a window, or your entire desktop." },
        { num: "04", title: "Video & Chat", desc: "Enable your camera and mic to talk directly, and apply fun video filters!" }
      ]
    },
    toggleLabel: "Translate to Hinglish",
    updatesTitle: "What's New in WatchParty v2.0",
    updates: [
      { version: "v2.0", title: "Google Authentication", desc: "Added secure Google Sign-In via Firebase for a personalized, secure experience." },
      { version: "v2.0", title: "Enhanced Security", desc: "Implemented DOMPurify for chat sanitization with real-time payload length tracking." },
      { version: "v2.0", title: "WebRTC TURN Support", desc: "Integrated robust TURN servers ensuring high-performance screen sharing without IP leaks." },
      { version: "v2.0", title: "Live Member Sync", desc: "Real-time user counting within active rooms to see exactly who's watching alongside you." },
    ]
  },
  hi: {
    youtube: {
      sectionTitle: "Kaise Use Karein",
      sectionSubtitle: "YouTube Watch Party ke baare mein sab kuch jaano",
      features: [
        { icon: SVGIcons.Play, title: "Synchronized Playback", desc: "YouTube videos saath mein sync mein dekho. Jab koi bhi play, pause ya seek kare — sabko real time mein same change dikhta hai." },
        { icon: SVGIcons.Chat, title: "Live Chat", desc: "Video dekhte waqt apne doston ke saath chat karo. Reactions, comments aur moments — sab kuch real-time mein share karo." },
        { icon: SVGIcons.Link, title: "Aasan Room Sharing", desc: "Ek unique ID ke saath room banao aur kisi ko bhi share karo. Unhe bas same Room ID daalna hoga aur wo turant join kar lenge." }
      ],
      stepsTitle: "Shuru Kaise Karein",
      steps: [
        { num: "01", title: "Secure Login", desc: "Apne Google account se secure login karein taaki aapka profile room mein dikhe." },
        { num: "02", title: "Room Banao ya Join", desc: "Naya Watch Party room create karein ya fir doston ka Room ID daalkar directly join karein." },
        { num: "03", title: "YouTube Link Daalo", desc: "Koi bhi YouTube video ka URL copy karke link box mein paste karein." },
        { num: "04", title: "Saath Mein Dekho", desc: "Ab video start karein! Play, pause aur seek sabhi ke liye real-time mein sync hoga." }
      ]
    },
    screenshare: {
      sectionTitle: "Screen Share Guide",
      sectionSubtitle: "Screen Share Watch Party ke baare mein sab kuch jaano",
      features: [
        { icon: SVGIcons.Screen, title: "Screen Sharing", desc: "Apni poori screen, koi specific window, ya browser tab sabke saath share karo. Audio bhi capture hota hai!" },
        { icon: SVGIcons.Video, title: "Video Chat", desc: "Camera aur microphone enable karo taaki sab ek doosre ko dekh sakein content dekhte waqt." },
        { icon: SVGIcons.Filter, title: "Fun Filters & Stickers", desc: "Apne camera feed pe mazedaar filters aur stickers lagao. Watch party ko aur exciting banao!" }
      ],
      stepsTitle: "Shuru Kaise Karein",
      steps: [
        { num: "01", title: "Secure Login", desc: "Saath milkar movies aur screen dekhne ke liye pehle Google se login karein." },
        { num: "02", title: "Room Banao ya Join", desc: "Apna khud ka room banayein ya kisi bhi existing room ko uski ID se join karein." },
        { num: "03", title: "Screen Share Karo", desc: "Share Screen par click karke browser tab, window ya puri desktop display karein." },
        { num: "04", title: "Video Chat & Filters", desc: "Camera on karke doston se face-to-face baat karein, aur mazedaar video filters lagayein!" }
      ]
    },
    toggleLabel: "Translate to English",
    updatesTitle: "WatchParty v2.0 Ke Naye Updates",
    updates: [
      { version: "v2.0", title: "Google Authentication", desc: "Firebase Google Sign-In add ho gaya hai, ab experience bilkul secure aur private hai." },
      { version: "v2.0", title: "Enhanced Security", desc: "Chat ke liye DOMPurify add kiya gaya hai jisse koi spam/script na bhej sake. Message limit 500 chars." },
      { version: "v2.0", title: "WebRTC TURN Support", desc: "Private TURN servers add kiye gaye hain, jisse IP leak issue khatam, aur speed ultra-fast." },
      { version: "v2.0", title: "Live Member Sync", desc: "Room mein kitne log hain, ye live ab upar member icon ke saath dikh jayega." },
    ]
  }
};

const glassCard = {
  background: "rgba(255, 255, 255, 0.03)",
  backdropFilter: "blur(25px)",
  WebkitBackdropFilter: "blur(25px)",
  border: "1px solid rgba(255, 255, 255, 0.08)",
  boxShadow: "0 25px 50px rgba(0,0,0,0.4)"
};

// Google "G" icon SVG for the login button
const GoogleIcon = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const Home = () => {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const [username, setUsername] = useState("");
  const [joinRoomId, setJoinRoomId] = useState("");
  const [videoUrl, setVideoUrl] = useState("");
  const [linkError, setLinkError] = useState("");
  const [isMobile, setIsMobile] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [showGlow, setShowGlow] = useState(false);
  const [isHinglish, setIsHinglish] = useState(false);
  const [roomMode, setRoomMode] = useState("youtube");
  const [helpMode, setHelpMode] = useState("youtube");
  const [generatedRoomId, setGeneratedRoomId] = useState("");
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAvatarDropdown, setShowAvatarDropdown] = useState(false);
  const pendingAction = useRef(null); // "create" or "join"
  const helpRef = useRef(null);
  const avatarRef = useRef(null);
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

  // Close avatar dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target)) {
        setShowAvatarDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // After login, automatically execute the pending action
  useEffect(() => {
    if (user && pendingAction.current) {
      const action = pendingAction.current;
      pendingAction.current = null;
      setShowLoginModal(false);
      // Small delay to let auth state propagate
      setTimeout(() => {
        if (action === "create") {
          executeCreateRoom();
        } else if (action === "join") {
          executeJoinRoom();
        }
      }, 100);
    }
  }, [user]);



  const handleVideoUrlChange = (e) => {
    const val = e.target.value;
    setVideoUrl(val);
    if (val && !isValidYouTubeUrl(val)) {
      setLinkError("Please enter a valid YouTube video link");
    } else {
      setLinkError("");
    }
  };

  // === Validate form fields ===
  const validateCreateFields = () => {
    if (!username.trim()) {
      alert("Please enter a username!");
      return false;
    }
    if (roomMode === "youtube") {
      if (!videoUrl) {
        alert("Please enter a YouTube video link!");
        return false;
      }
      if (!isValidYouTubeUrl(videoUrl)) {
        setLinkError("Please enter a valid YouTube video link");
        return false;
      }
    }
    return true;
  };

  const validateJoinFields = () => {
    if (!username.trim()) {
      alert("Please enter a username!");
      return false;
    }
    if (roomMode === "youtube") {
      if (!joinRoomId || !videoUrl) {
        alert("Room ID and YouTube link cannot be empty!");
        return false;
      }
      if (!isValidYouTubeUrl(videoUrl)) {
        setLinkError("Please enter a valid YouTube video link");
        return false;
      }
    } else {
      if (!joinRoomId) {
        alert("Room ID cannot be empty!");
        return false;
      }
    }
    return true;
  };

  // === Actual room creation (called only when authed) ===
  const executeCreateRoom = useCallback(() => {
    const newId = nanoid();
    setGeneratedRoomId(newId);
    setCopied(false);
    setShowRoomModal(true);
  }, []);

  // === Actual room join (called only when authed) ===
  const executeJoinRoom = useCallback(() => {
    localStorage.setItem("wp_username", username.trim());
    if (roomMode === "youtube") {
      localStorage.setItem("wp_videoUrl", videoUrl);
      localStorage.setItem("wp_roomMode", "youtube");
      navigate(`/stream/${joinRoomId}`);
    } else {
      localStorage.setItem("wp_roomMode", "screenshare");
      navigate(`/screen/${joinRoomId}`);
    }
  }, [roomMode, videoUrl, joinRoomId, navigate, username]);

  // === CREATE ROOM: validate, check auth, then execute or show login ===
  const createRoom = () => {
    if (!validateCreateFields()) return;
    if (!user) {
      pendingAction.current = "create";
      setShowLoginModal(true);
      return;
    }
    executeCreateRoom();
  };

  // === JOIN ROOM: validate, check auth, then execute or show login ===
  const handleJoinRoom = () => {
    if (!validateJoinFields()) return;
    if (!user) {
      pendingAction.current = "join";
      setShowLoginModal(true);
      return;
    }
    executeJoinRoom();
  };

  // === ENTER ROOM: called from room-ID modal after seeing the generated ID ===
  const enterGeneratedRoom = () => {
    localStorage.setItem("wp_username", username.trim());
    if (roomMode === "youtube") {
      localStorage.setItem("wp_videoUrl", videoUrl);
      localStorage.setItem("wp_roomMode", "youtube");
      navigate(`/stream/${generatedRoomId}`);
    } else {
      localStorage.setItem("wp_roomMode", "screenshare");
      navigate(`/screen/${generatedRoomId}`);
    }
  };

  // === Google login from modal ===
  const handleGoogleLogin = async () => {
    try {
      await signInWithGoogle();
      // The useEffect watching `user` will handle the pending action
    } catch (err) {
      console.error("Login failed:", err);
    }
  };

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(generatedRoomId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const ta = document.createElement("textarea");
      ta.value = generatedRoomId;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const scrollToHelp = () => {
    helpRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const modes = [
    { key: "youtube", label: "YouTube Party", icon: <div style={{ transform: "scale(0.8)", display: "flex", alignItems: "center" }}>{SVGIcons.Play}</div> },
    { key: "screenshare", label: "Screen Share", icon: <div style={{ transform: "scale(0.8)", display: "flex", alignItems: "center" }}>{SVGIcons.Screen}</div> },
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
      <Helmet>
        <title>WatchParty — Watch YouTube Together in Sync</title>
        <meta name="description" content="WatchParty — Watch YouTube together in sync for free. Enjoy live chat, video call, screen sharing, and synchronized playback with friends. No download required!" />
        <meta property="og:title" content="WatchParty — Watch YouTube Together in Sync" />
        <meta property="og:description" content="WatchParty — Watch YouTube together in sync for free. Enjoy live chat, video call, screen sharing, and synchronized playback with friends. No download required!" />
        <meta property="og:url" content="https://watchparty.website/" />
        <link rel="canonical" href="https://watchparty.website/" />
      </Helmet>

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
        {/* Auth UI — right side of navbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {authLoading ? (
            <div style={{
              width: "28px", height: "28px", borderRadius: "50%",
              background: "rgba(255,255,255,0.06)",
            }} />
          ) : user ? (
            <div ref={avatarRef} style={{ position: "relative" }}>
              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAvatarDropdown(!showAvatarDropdown)}
                style={{
                  display: "flex", alignItems: "center", gap: isMobile ? "6px" : "10px",
                  cursor: "pointer", padding: "4px 8px",
                  borderRadius: "12px",
                  background: showAvatarDropdown ? "rgba(255,255,255,0.06)" : "transparent",
                  transition: "background 0.2s"
                }}
              >
                <img
                  src={user.photoURL}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    width: isMobile ? "28px" : "32px",
                    height: isMobile ? "28px" : "32px",
                    borderRadius: "50%",
                    border: "2px solid rgba(59, 130, 246, 0.3)",
                    objectFit: "cover"
                  }}
                />
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                  style={{ transform: showAvatarDropdown ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </motion.div>

              {/* Dropdown */}
              <AnimatePresence>
                {showAvatarDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    style={{
                      position: "absolute", top: "calc(100% + 8px)", right: 0,
                      background: "rgba(15, 23, 42, 0.95)",
                      backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      borderRadius: "14px",
                      padding: "8px",
                      minWidth: "180px",
                      boxShadow: "0 15px 40px rgba(0,0,0,0.5)",
                      zIndex: 100
                    }}
                  >
                    {/* Sign out button */}
                    <motion.button
                      whileHover={{ background: "rgba(239, 68, 68, 0.1)" }}
                      onClick={() => { signOut(); setShowAvatarDropdown(false); }}
                      style={{
                        width: "100%", padding: "10px 12px",
                        background: "transparent", border: "none",
                        color: "#f87171", fontSize: "0.8rem",
                        fontWeight: "600", cursor: "pointer",
                        borderRadius: "10px", textAlign: "left",
                        display: "flex", alignItems: "center", gap: "8px",
                        transition: "background 0.15s"
                      }}
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                        <polyline points="16 17 21 12 16 7" />
                        <line x1="21" y1="12" x2="9" y2="12" />
                      </svg>
                      Sign Out
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <motion.button
              whileHover={{ scale: 1.05, background: "rgba(255,255,255,0.1)" }}
              whileTap={{ scale: 0.95 }}
              onClick={async () => { try { await signInWithGoogle(); } catch {} }}
              style={{
                display: "flex", alignItems: "center", gap: "8px",
                padding: isMobile ? "7px 14px" : "8px 18px",
                background: "rgba(255,255,255,0.06)",
                border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "10px",
                color: "#fff", fontSize: isMobile ? "0.72rem" : "0.8rem",
                fontWeight: "600", cursor: "pointer",
                transition: "all 0.2s ease",
                letterSpacing: "0.3px"
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Login
            </motion.button>
          )}
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
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <div style={{ transform: "scale(0.8)" }}>{SVGIcons.Screen}</div>
                        <span>You'll be able to share your screen after joining the room. Screen, window, and tab sharing are supported.</span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* === DIVIDER: Create vs Join === */}
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                margin: isMobile ? "4px 0" : "6px 0"
              }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
                <span style={{
                  color: "rgba(255,255,255,0.25)", fontSize: isMobile ? "0.6rem" : "0.7rem",
                  letterSpacing: "2px", fontWeight: "600", textTransform: "uppercase"
                }}>choose action</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.08)" }} />
              </div>

              {/* === CREATE ROOM BUTTON === */}
              <motion.button
                whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(37, 99, 235, 0.3)" }}
                whileTap={{ scale: 0.95 }}
                style={{
                  ...buttonStyle,
                  padding: isMobile ? "12px" : "14px",
                  borderRadius: isMobile ? "10px" : "12px",
                  fontSize: isMobile ? "12px" : "14px",
                  background: "linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(59, 130, 246, 0.2))",
                  border: "1px solid rgba(59, 130, 246, 0.25)",
                  marginTop: "0"
                }}
                onClick={createRoom}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>{SVGIcons.Plus} CREATE ROOM</div>
              </motion.button>

              {/* === OR DIVIDER === */}
              <div style={{
                display: "flex", alignItems: "center", gap: "12px",
                margin: isMobile ? "2px 0" : "4px 0"
              }}>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
                <span style={{
                  color: "rgba(255,255,255,0.2)", fontSize: isMobile ? "0.6rem" : "0.7rem",
                  fontWeight: "600"
                }}>OR</span>
                <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.06)" }} />
              </div>

              {/* === JOIN ROOM: input + button === */}
              <div style={{ display: "flex", gap: "8px" }}>
                <input
                  style={{
                    ...inputStyle,
                    padding: isMobile ? "10px 12px" : "13px 16px",
                    borderRadius: isMobile ? "10px" : "12px",
                    fontSize: isMobile ? "13px" : "14px",
                    flex: 1,
                    minWidth: 0
                  }}
                  placeholder="Paste Room ID to join"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    ...buttonStyle,
                    padding: isMobile ? "10px 14px" : "13px 20px",
                    borderRadius: isMobile ? "10px" : "12px",
                    fontSize: isMobile ? "11px" : "13px",
                    marginTop: "0",
                    whiteSpace: "nowrap"
                  }}
                  onClick={handleJoinRoom}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>JOIN {SVGIcons.ArrowRight}</div>
                </motion.button>
              </div>
            </div>
          </motion.div>

          {/* === ROOM ID MODAL OVERLAY === */}
          <AnimatePresence>
            {showRoomModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: "fixed", inset: 0, zIndex: 100,
                  background: "rgba(0, 0, 0, 0.7)",
                  backdropFilter: "blur(8px)", WebkitBackdropFilter: "blur(8px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "20px"
                }}
                onClick={() => setShowRoomModal(false)}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 30 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    ...glassCard,
                    borderRadius: isMobile ? "18px" : "24px",
                    padding: isMobile ? "28px 22px" : "40px 44px",
                    width: isMobile ? "92%" : "auto",
                    maxWidth: "480px",
                    textAlign: "center",
                    background: "rgba(15, 23, 42, 0.95)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    boxShadow: "0 25px 80px rgba(0,0,0,0.6), 0 0 40px rgba(59, 130, 246, 0.1)"
                  }}
                >
                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.15 }}
                    style={{
                      width: isMobile ? "50px" : "60px", height: isMobile ? "50px" : "60px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, rgba(37,99,235,0.25), rgba(59,130,246,0.15))",
                      border: "1px solid rgba(59,130,246,0.3)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 18px",
                      color: "#60a5fa"
                    }}
                  >
                    <svg width={isMobile ? "24" : "28"} height={isMobile ? "24" : "28"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                  </motion.div>

                  <h3 style={{
                    color: "#fff", fontSize: isMobile ? "1.1rem" : "1.4rem",
                    fontWeight: "800", margin: "0 0 6px 0"
                  }}>
                    Room Created!
                  </h3>
                  <p style={{
                    color: "rgba(255,255,255,0.4)",
                    fontSize: isMobile ? "0.72rem" : "0.85rem",
                    margin: "0 0 20px 0", lineHeight: "1.5"
                  }}>
                    Share this Room ID with your friends so they can join
                  </p>

                  {/* Room ID display */}
                  <div style={{
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(59, 130, 246, 0.2)",
                    borderRadius: isMobile ? "10px" : "14px",
                    padding: isMobile ? "14px" : "18px",
                    marginBottom: "16px",
                    position: "relative"
                  }}>
                    <p style={{
                      color: "rgba(96,165,250,0.5)",
                      fontSize: "0.65rem", letterSpacing: "2px",
                      margin: "0 0 8px 0", textTransform: "uppercase", fontWeight: "600"
                    }}>
                      Your Room ID
                    </p>
                    <p style={{
                      color: "#60a5fa",
                      fontSize: isMobile ? "0.85rem" : "1.05rem",
                      fontWeight: "700", margin: 0,
                      fontFamily: "'Courier New', Courier, monospace",
                      letterSpacing: "0.5px",
                      wordBreak: "break-all",
                      lineHeight: "1.4"
                    }}>
                      {generatedRoomId}
                    </p>
                  </div>

                  {/* Buttons */}
                  <div style={{ display: "flex", gap: "10px", flexDirection: isMobile ? "column" : "row" }}>
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={copyRoomId}
                      style={{
                        flex: 1,
                        padding: isMobile ? "12px" : "14px 20px",
                        background: copied
                          ? "rgba(16, 185, 129, 0.15)"
                          : "rgba(255,255,255,0.06)",
                        border: copied
                          ? "1px solid rgba(16, 185, 129, 0.3)"
                          : "1px solid rgba(255,255,255,0.1)",
                        borderRadius: isMobile ? "10px" : "12px",
                        color: copied ? "#6ee7b7" : "#fff",
                        fontSize: isMobile ? "0.75rem" : "0.85rem",
                        fontWeight: "700", cursor: "pointer",
                        letterSpacing: "0.5px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      {copied ? (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><polyline points="20 6 9 17 4 12"></polyline></svg>COPIED</>) : (<><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{marginRight: "6px"}}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>COPY ID</>)}
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(37, 99, 235, 0.3)" }}
                      whileTap={{ scale: 0.95 }}
                      onClick={enterGeneratedRoom}
                      style={{
                        flex: 1,
                        padding: isMobile ? "12px" : "14px 20px",
                        background: "linear-gradient(135deg, rgba(37,99,235,0.4), rgba(59,130,246,0.25))",
                        border: "1px solid rgba(59, 130, 246, 0.3)",
                        borderRadius: isMobile ? "10px" : "12px",
                        color: "#fff",
                        fontSize: isMobile ? "0.75rem" : "0.85rem",
                        fontWeight: "700", cursor: "pointer",
                        letterSpacing: "0.5px",
                        transition: "all 0.2s ease"
                      }}
                    >
                      ENTER ROOM →
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* === LOGIN REQUIRED MODAL === */}
          <AnimatePresence>
            {showLoginModal && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                style={{
                  position: "fixed", inset: 0, zIndex: 200,
                  background: "rgba(0, 0, 0, 0.75)",
                  backdropFilter: "blur(10px)", WebkitBackdropFilter: "blur(10px)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  padding: "20px"
                }}
                onClick={() => { setShowLoginModal(false); pendingAction.current = null; }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.85, y: 30 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.85, y: 30 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    ...glassCard,
                    borderRadius: isMobile ? "18px" : "22px",
                    padding: isMobile ? "28px 22px" : "36px 40px",
                    width: isMobile ? "92%" : "auto",
                    maxWidth: "380px",
                    textAlign: "center",
                    background: "rgba(15, 23, 42, 0.97)",
                    border: "1px solid rgba(255, 255, 255, 0.08)",
                    boxShadow: "0 25px 80px rgba(0,0,0,0.6)"
                  }}
                >
                  {/* Lock icon */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 500, damping: 20, delay: 0.1 }}
                    style={{
                      width: isMobile ? "48px" : "56px", height: isMobile ? "48px" : "56px",
                      borderRadius: "16px",
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.08)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      margin: "0 auto 18px",
                      color: "#64748b"
                    }}
                  >
                    <svg width={isMobile ? "22" : "26"} height={isMobile ? "22" : "26"} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                  </motion.div>

                  <h3 style={{
                    color: "#fff", fontSize: isMobile ? "1.05rem" : "1.25rem",
                    fontWeight: "700", margin: "0 0 6px 0",
                    letterSpacing: "-0.3px"
                  }}>
                    Sign in to continue
                  </h3>
                  <p style={{
                    color: "rgba(255,255,255,0.35)",
                    fontSize: isMobile ? "0.72rem" : "0.82rem",
                    margin: "0 0 24px 0", lineHeight: "1.5"
                  }}>
                    Authentication is required to create or join a room
                  </p>

                  {/* Continue with Google button */}
                  <motion.button
                    whileHover={{ scale: 1.03, boxShadow: "0 0 30px rgba(255,255,255,0.08)" }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGoogleLogin}
                    style={{
                      width: "100%",
                      padding: isMobile ? "13px" : "15px 24px",
                      background: "#fff",
                      border: "none",
                      borderRadius: isMobile ? "10px" : "12px",
                      color: "#1f2937",
                      fontSize: isMobile ? "0.82rem" : "0.92rem",
                      fontWeight: "700", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      gap: "10px",
                      transition: "all 0.2s ease",
                      letterSpacing: "0.3px"
                    }}
                  >
                    <GoogleIcon size={20} />
                    Continue with Google
                  </motion.button>

                  <p style={{
                    color: "rgba(255,255,255,0.2)",
                    fontSize: "0.65rem",
                    margin: "12px 0 0 0", letterSpacing: "0.3px"
                  }}>
                    Secure authentication via Google
                  </p>

                  {/* Divider */}
                  <div style={{ width: "100%", height: "1px", background: "rgba(255,255,255,0.06)", margin: "16px 0 0 0" }} />

                  {/* Cancel link */}
                  <motion.button
                    whileHover={{ color: "rgba(255,255,255,0.5)" }}
                    onClick={() => { setShowLoginModal(false); pendingAction.current = null; }}
                    style={{
                      background: "none", border: "none",
                      color: "rgba(255,255,255,0.25)",
                      fontSize: isMobile ? "0.72rem" : "0.78rem",
                      fontWeight: "500", cursor: "pointer",
                      marginTop: "12px",
                      transition: "color 0.2s",
                      padding: "6px 12px"
                    }}
                  >
                    Cancel
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

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
              <div style={{ transform: "scale(0.9)" }}>{SVGIcons.Globe}</div>
              {content[lang].toggleLabel}
            </motion.button>

            {/* Help Mode Tabs */}
            <div style={{
              display: "flex", gap: "0",
              background: "rgba(255, 255, 255, 0.04)",
              borderRadius: "12px", padding: "3px",
              border: "1px solid rgba(255, 255, 255, 0.06)"
            }}>
              {[
                { key: "youtube", label: "YouTube", icon: SVGIcons.Play, color: "#3b82f6" },
                { key: "screenshare", label: "Screen Share", icon: SVGIcons.Screen, color: "#10b981" }
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
                    transition: "all 0.2s ease",
                    display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  <div style={{ transform: "scale(0.8)" }}>{m.icon}</div>
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