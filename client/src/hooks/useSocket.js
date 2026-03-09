import { io } from "socket.io-client";

// Use Vite's environment variable to safely determine if we're in dev or prod
const isLocal = import.meta.env.DEV;

const BACKEND_URL = isLocal
  ? `http://${window.location.hostname}:5000`
  : "https://watch-party-app-pulj.onrender.com";

const socket = io(BACKEND_URL, {
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  timeout: 10000
});

socket.on("connect", () => {
  console.log("Connected to backend:", BACKEND_URL, "Socket ID:", socket.id);
});
socket.on("connect_error", (err) => {
  console.error("Socket connection error:", err);
});
socket.on("disconnect", (reason) => {
  console.warn("Socket disconnected:", reason);
});

export const useSocket = () => socket;