import React, { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StreamRoom from "./pages/StreamRoom";

// Lazy load ScreenShareRoom to reduce initial bundle
const ScreenShareRoom = lazy(() => import("./pages/ScreenShareRoom"));

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stream/:roomId" element={<StreamRoom />} />
        <Route
          path="/screen/:roomId"
          element={
            <Suspense fallback={<div style={{ background: "#000", height: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>Loading...</div>}>
              <ScreenShareRoom />
            </Suspense>
          }
        />
      </Routes>
    </>
  );
}

export default App;
