import { io } from "socket.io-client";

// Yahan humne socket connection setup kiya hai.
// Ye URL aapke server ke port (5000) se match hona chahiye.
const socket = io.connect("https://watch-party-app-1-fco3.onrender.com");

export const useSocket = () => {
  return socket;
};