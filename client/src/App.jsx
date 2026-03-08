import React from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import StreamRoom from "./pages/StreamRoom";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stream/:roomId" element={<StreamRoom />} />
      </Routes>
    </>
  );
}

export default App;
