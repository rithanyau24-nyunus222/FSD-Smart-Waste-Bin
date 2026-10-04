import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Navbar, DemoDock } from './components.jsx';

import { Home, About, NotFound } from './pages/Home.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { Report } from './pages/Report.jsx';
import { MyComplaints, ComplaintDetail } from './pages/Complaints.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Tasks } from './pages/Tasks.jsx';

const App = () => {
  return (
    <div className="app-shell">
      {/* Clean Minimalist Top Navbar */}
      <Navbar />

      {/* Spacious, Centered Main Content Area */}
      <main className="app-main-content">
        <Routes>
          {/* Overview & Live City Map */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* 1. Citizen Reporting */}
          <Route path="/report" element={<Report />} />
          <Route path="/my-complaints" element={<MyComplaints />} />
          <Route path="/complaints/:id" element={<ComplaintDetail />} />

          {/* 2. Municipal Admin & Duplicate Detection */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* 3. Driver Field Tasks & Closed Verification */}
          <Route path="/tasks" element={<Tasks />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>

      {/* Interactive Review Demo Dock */}
      <DemoDock />
    </div>
  );
};

export default App;
