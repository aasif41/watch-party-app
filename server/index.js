const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store room state in memory
const rooms = new Map();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // Room Join logic
  socket.on("join_room", (roomData) => {
    // If roomData is an object, it has roomId and videoUrl. If it's a string, it's just roomId.
    const roomId = typeof roomData === 'object' ? roomData.roomId : roomData;
    const incomingUrl = typeof roomData === 'object' ? roomData.videoUrl : null;
    
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);

    // If room doesn't exist, create it
    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        videoUrl: incomingUrl || "",
        playing: false,
        seekTime: 0,
        lastUpdated: Date.now()
      });
    } else if (incomingUrl && rooms.get(roomId).videoUrl !== incomingUrl) {
      // If room exists but host is playing a new video, update the URL
      const currentRoom = rooms.get(roomId);
      currentRoom.videoUrl = incomingUrl;
      currentRoom.seekTime = 0; // Reset time for new video
      rooms.set(roomId, currentRoom);
    }

    // Send the current room state to the newly joined user so they sync immediately
    const currentState = rooms.get(roomId);
    socket.emit("room_state", currentState);
  });

  // Chat Message handle karna
  socket.on("send_message", (data) => {
    socket.to(data.room).emit("receive_message", data);
  });

  // Video State (Play/Pause)
  socket.on("video_state_change", (data) => {
    if (rooms.has(data.room)) {
      const roomState = rooms.get(data.room);
      roomState.playing = data.playing;
      roomState.seekTime = data.seekTime;
      roomState.lastUpdated = Date.now();
      rooms.set(data.room, roomState);
    }
    socket.to(data.room).emit("video_state_update", data);
  });

  // Periodic heartbeat sync from exact position
  socket.on("sync_time", (data) => {
    if (rooms.has(data.room)) {
      const roomState = rooms.get(data.room);
      roomState.seekTime = data.time;
      roomState.playing = data.playing;
      roomState.lastUpdated = Date.now();
      rooms.set(data.room, roomState);
      
      // We can optionally broadcast to others, but we'll let StreamRoom handle drift locally
      // For now, socket.to(data.room).emit("sync_time", data); could be spammy
    }
  });

  // Explicit seek event
  socket.on("video_seek", (data) => {
    if (rooms.has(data.room)) {
      const roomState = rooms.get(data.room);
      roomState.seekTime = data.seekTime;
      roomState.playing = data.playing;
      roomState.lastUpdated = Date.now();
      rooms.set(data.room, roomState);
    }
    socket.to(data.room).emit("video_seek", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});