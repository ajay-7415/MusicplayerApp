import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import MusicPlayer from "./MusicPlayer";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to="/foryou" />} />
        <Route path="/foryou" element={<MusicPlayer view="foryou" />} />
        <Route path="/favorites" element={<MusicPlayer view="favorites" />} />
        <Route path="/recent" element={<MusicPlayer view="recent" />} />
      </Routes>
    </Router>
  );
};

export default App;
