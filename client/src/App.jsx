import React from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import StreamRoom from "./pages/StreamRoom";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/stream" element={<StreamRoom />} />
      </Routes>
    </>
  );
}

export default App;
