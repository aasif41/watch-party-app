# WatchParty — Watch YouTube & Any Movie Together

**WatchParty** is a free, real-time watch party platform that lets you watch YouTube videos, share your screen, and enjoy content together with friends — all perfectly synchronized. No downloads required.

**Live at**: [watchparty.website](https://watchparty.website/)

---

## What WatchParty Offers

### YouTube Watch Party
Watch any YouTube video together in perfect sync. When anyone plays, pauses, or seeks — everyone in the room follows in real time. A heartbeat sync mechanism runs every 2 seconds to keep all members aligned within 1.5 seconds of each other.

### Screen Share Mode
Share your entire screen, a specific window, or a browser tab with everyone in the room — complete with system audio. Streams at up to 1920×1080 @ 30fps with 8 Mbps bitrate for crisp, readable content. Mobile users can join rooms to view shared screens.

### Real-Time Chat
Chat alongside the video with instant messaging. The last 100 messages are stored per room so new joiners never miss context. All messages are sanitized with DOMPurify to prevent XSS attacks, and a 500-character limit keeps things clean.

### Video Chat
Enable your camera and microphone for face-to-face interaction. Audio is processed through a custom noise gate that filters out background noise like fan hum, keyboard clicks, and ambient sounds — so only your voice comes through clearly.

### Fun Filters & Stickers
Apply video filters (B&W, Sepia, Neon, Vintage, Noir, and more) and draggable emoji stickers to your camera feed. Effects are synced in real time so all participants see them.

### Secure Authentication
Login with Google via Firebase for a safe, personalized experience. Room pages are protected — only authenticated users can create or join watch parties.

### Easy Room Management
Create a room with a unique ID and share it with anyone. Live member counting shows who's watching, and room state (video position, chat history, screen share status) persists server-side so new joiners sync up immediately.

### Bilingual Support
The home page supports both English and Hinglish (Hindi-English) with a one-click toggle.

---

## How It Works

### Synchronized Playback
When a user plays, pauses, or seeks the video, the action is emitted as a Socket.IO event to the server. The server updates the room state and broadcasts it to all other members, who adjust their local player accordingly. A periodic heartbeat keeps everyone in sync.

### Screen Sharing
The presenter captures their screen using the browser's `getDisplayMedia` API. WebRTC peer connections are established with each viewer — the presenter sends an offer, the viewer responds with an answer, and ICE candidates are exchanged through the server. The actual video stream flows directly peer-to-peer. STUN/TURN servers ensure connectivity behind NATs and firewalls.

### Video Chat
Camera and mic access is obtained via `getUserMedia`. The raw audio goes through a Web Audio API processing chain — highpass filter, lowpass filter, volume analyser, noise gate, and compressor — before being sent over WebRTC peer connections to other participants.

### Chat System
Messages are broadcast via Socket.IO and sanitized with DOMPurify on both send and receive. The server maintains a rolling history of the last 100 messages per room, delivered to new joiners on connect.

---

## Built With

| Technology | Purpose |
|-----------|---------|
| **React 18 + Vite** | Frontend framework and build tool |
| **Node.js + Express** | Backend server |
| **Socket.IO** | Real-time bidirectional communication |
| **WebRTC** | Peer-to-peer video/screen streaming |
| **Firebase Auth** | Google Sign-In authentication |
| **Three.js + React Three Fiber** | 3D animated background on the landing page |
| **Framer Motion** | Smooth UI animations and transitions |
| **Tailwind CSS v4** | Styling |
| **Web Audio API** | Noise gate and audio processing for video chat |
| **DOMPurify** | Chat message sanitization (XSS protection) |
| **nanoid** | Unique room ID generation |

---

**Built with love by [Aasif](https://github.com/aasif41)**
