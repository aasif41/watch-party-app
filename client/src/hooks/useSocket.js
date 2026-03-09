import { io } from "socket.io-client";

const isLocal = window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1" || 
  window.location.hostname.startsWith("192.") || 
  window.location.hostname.startsWith("10.");

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