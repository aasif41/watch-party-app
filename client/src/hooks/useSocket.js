import { io } from "socket.io-client";

// Use Vite's environment variable to safely determine if we're in dev or prod
const isLocal = import.meta.env.DEV;

const BACKEND_URL = isLocal
  ? `http://${window.location.hostname}:5000`
  : "https://watch-party-app-pulj.onrender.com";

const socket = io(BACKEND_URL, {
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  timeout: 10000
});

console.log("=== APP ENVIRONMENT DEBUGS ===");
console.log("Window Hostname:", window.location.hostname);
console.log("Is Local (Vite Dev Mode):", isLocal);
console.log("Attempting Socket Connection to BACKEND_URL:", BACKEND_URL);

socket.on("connect", () => {
  console.log("✅ Successfully connected to backend:", BACKEND_URL, "| Socket ID:", socket.id);
});
socket.on("connect_error", (err) => {
  console.error("❌ Socket connection error:");
  console.error("Error Message:", err.message);
  console.error("Error Description:", err.description);
  console.error("Context:", err.context);
  console.error("Target URL was:", BACKEND_URL);
});
socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket disconnected:", reason);
});

export const useSocket = () => socket;