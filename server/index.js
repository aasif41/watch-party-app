const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
require("dotenv").config();

const app = express();
app.use(cors());

app.get("/", (req, res) => {
  res.send("Watch Party Server is running!");
});

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

// Store room state in memory
const rooms = new Map();
// Store cleanup timers — rooms are deleted 10 min after last user leaves
const roomCleanupTimers = new Map();

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  // ========================
  // YOUTUBE ROOM EVENTS (unchanged)
  // ========================

  // Room Join logic
  socket.on("join_room", (roomData) => {
    const roomId = typeof roomData === 'object' ? roomData.roomId : roomData;
    const incomingUrl = typeof roomData === 'object' ? roomData.videoUrl : null;
    const roomType = typeof roomData === 'object' ? (roomData.roomType || 'youtube') : 'youtube';
    
    socket.join(roomId);

    // Cancel any pending cleanup timer for this room
    if (roomCleanupTimers.has(roomId)) {
      clearTimeout(roomCleanupTimers.get(roomId));
      roomCleanupTimers.delete(roomId);
      console.log(`Cleanup timer cancelled for room ${roomId} (user joined)`);
    }
    console.log(`User ${socket.id} joined room: ${roomId} (type: ${roomType})`);

    const count = io.sockets.adapter.rooms.get(roomId)?.size || 0;
    io.to(roomId).emit("member_count_update", count);

    if (!rooms.has(roomId)) {
      rooms.set(roomId, {
        roomType,
        videoUrl: incomingUrl || "",
        playing: false,
        seekTime: 0,
        lastUpdated: Date.now(),
        presenterId: null,       // Screen share presenter socket ID
        isScreenSharing: false,  // Whether someone is currently sharing
        messages: []             // Chat history
      });
    } else if (incomingUrl && rooms.get(roomId).videoUrl !== incomingUrl) {
      const currentRoom = rooms.get(roomId);
      currentRoom.videoUrl = incomingUrl;
      currentRoom.seekTime = 0;
      rooms.set(roomId, currentRoom);
    }

    const currentState = rooms.get(roomId);
    if (!currentState.messages) currentState.messages = [];
    socket.emit("room_state", currentState);
    socket.emit("chat_history", currentState.messages);
  });

  // Chat Message
  socket.on("send_message", (data) => {
    // SECURITY: Server-side length validation
    // if (!data.message || typeof data.message !== 'string' || data.message.trim() === "" || data.message.length > 500) {
    //   return; // Reject invalid or excessively long messages
    // }
    
    if (rooms.has(data.room)) {
      const roomState = rooms.get(data.room);
      if (!roomState.messages) roomState.messages = [];
      roomState.messages.push(data);
      if (roomState.messages.length > 100) roomState.messages.shift();
    }
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

  // Periodic heartbeat sync
  socket.on("sync_time", (data) => {
    if (rooms.has(data.room)) {
      const roomState = rooms.get(data.room);
      roomState.seekTime = data.time;
      roomState.playing = data.playing;
      roomState.lastUpdated = Date.now();
      rooms.set(data.room, roomState);
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

  // ========================
  // SCREEN SHARE SIGNALING
  // ========================

  // Presenter starts screen share — notify all viewers in the room
  socket.on("start_screen_share", (data) => {
    const { room } = data;
    if (rooms.has(room)) {
      const roomState = rooms.get(room);
      roomState.presenterId = socket.id;
      roomState.isScreenSharing = true;
      rooms.set(room, roomState);
    }
    socket.to(room).emit("screen_share_started", { presenterId: socket.id });
    console.log(`Screen share started by ${socket.id} in room ${room}`);
  });

  // Presenter stops screen share
  socket.on("stop_screen_share", (data) => {
    const { room } = data;
    if (rooms.has(room)) {
      const roomState = rooms.get(room);
      roomState.presenterId = null;
      roomState.isScreenSharing = false;
      rooms.set(room, roomState);
    }
    socket.to(room).emit("screen_share_stopped", { presenterId: socket.id });
    console.log(`Screen share stopped by ${socket.id} in room ${room}`);
  });

  // WebRTC offer from presenter to a specific viewer
  socket.on("screen_share_offer", (data) => {
    const { to, offer, room } = data;
    io.to(to).emit("screen_share_offer", { from: socket.id, offer, room });
  });

  // WebRTC answer from viewer back to presenter
  socket.on("screen_share_answer", (data) => {
    const { to, answer, room } = data;
    io.to(to).emit("screen_share_answer", { from: socket.id, answer, room });
  });

  // ICE candidate relay (screen share)
  socket.on("screen_ice_candidate", (data) => {
    const { to, candidate, room } = data;
    io.to(to).emit("screen_ice_candidate", { from: socket.id, candidate, room });
  });

  // Viewer requests the presenter to send them the stream
  socket.on("request_screen_share", (data) => {
    const { room } = data;
    if (rooms.has(room)) {
      const roomState = rooms.get(room);
      if (roomState.presenterId && roomState.isScreenSharing) {
        // Tell the presenter about this new viewer
        io.to(roomState.presenterId).emit("viewer_joined", { viewerId: socket.id, room });
      }
    }
  });

  // ========================
  // VIDEO CHAT SIGNALING
  // ========================

  // Video chat offer (peer-to-peer between participants)
  socket.on("video_chat_offer", (data) => {
    const { to, offer, room, username } = data;
    io.to(to).emit("video_chat_offer", { from: socket.id, offer, room, username });
  });

  // Video chat answer
  socket.on("video_chat_answer", (data) => {
    const { to, answer, room, username } = data;
    io.to(to).emit("video_chat_answer", { from: socket.id, answer, room, username });
  });

  // Video chat ICE candidate
  socket.on("video_chat_ice", (data) => {
    const { to, candidate, room } = data;
    io.to(to).emit("video_chat_ice", { from: socket.id, candidate, room });
  });

  // Notify room when someone enables/disables video chat
  socket.on("video_chat_enabled", (data) => {
    socket.to(data.room).emit("peer_video_chat_enabled", {
      peerId: socket.id,
      username: data.username
    });
  });

  socket.on("video_chat_disabled", (data) => {
    socket.to(data.room).emit("peer_video_chat_disabled", {
      peerId: socket.id
    });
  });

  socket.on("video_chat_effect", (data) => {
    socket.to(data.room).emit("video_chat_effect", {
      from: socket.id,
      filter: data.filter,
      sticker: data.sticker,
      stickerPos: data.stickerPos
    });
  });

  // ========================
  // DISCONNECT
  // ========================

  socket.on("disconnecting", () => {
    socket.rooms.forEach((roomId) => {
      if (roomId !== socket.id) {
        const count = (io.sockets.adapter.rooms.get(roomId)?.size || 1) - 1;
        io.to(roomId).emit("member_count_update", count);

        // If room is now empty, start a 10-minute cleanup timer
        if (count === 0 && rooms.has(roomId)) {
          const CLEANUP_DELAY = 10 * 60 * 1000; // 10 minutes
          console.log(`Room ${roomId} is empty. Will clean up in 10 minutes.`);
          const timer = setTimeout(() => {
            // Double-check room is still empty before deleting
            const currentSize = io.sockets.adapter.rooms.get(roomId)?.size || 0;
            if (currentSize === 0) {
              rooms.delete(roomId);
              roomCleanupTimers.delete(roomId);
              console.log(`Room ${roomId} cleaned up after 10-minute timeout.`);
            } else {
              roomCleanupTimers.delete(roomId);
              console.log(`Room ${roomId} cleanup cancelled — users rejoined.`);
            }
          }, CLEANUP_DELAY);
          roomCleanupTimers.set(roomId, timer);
        }
      }
    });
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
    // Clean up screen share if the presenter disconnects
    rooms.forEach((roomState, roomId) => {
      if (roomState.presenterId === socket.id) {
        roomState.presenterId = null;
        roomState.isScreenSharing = false;
        rooms.set(roomId, roomState);
        io.to(roomId).emit("screen_share_stopped", { presenterId: socket.id });
        console.log(`Screen share auto-stopped in room ${roomId} (presenter disconnected)`);
      }
    });
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`SERVER RUNNING ON PORT ${PORT}`);
});