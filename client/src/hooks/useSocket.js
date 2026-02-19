import { io } from "socket.io-client";

const socket = io("https://watch-party-app-1-fco3.onrender.com", {
  transports: ["websocket"],
  reconnection: true,
  reconnectionAttempts: 5
});

export const useSocket = () => socket;