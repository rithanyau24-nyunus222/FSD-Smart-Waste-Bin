import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './api.jsx';
import { Navbar, Footer, FloatingDecor } from './components.jsx';

import { Home, About, NotFound } from './pages/Home.jsx';
import { Login, Register } from './pages/Auth.jsx';
import { Report } from './pages/Report.jsx';
import { MyComplaints, ComplaintDetail } from './pages/Complaints.jsx';
import { Dashboard } from './pages/Dashboard.jsx';
import { Tasks } from './pages/Tasks.jsx';

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="container" style={{ textAlign: 'center', padding: '100px 0' }}>
        <p>Verifying credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    // Redirect unauthorized user to their role's natural landing page
    if (user.role === 'authority') return <Navigate to="/dashboard" replace />;
    if (user.role === 'collector') return <Navigate to="/tasks" replace />;
    return <Navigate to="/report" replace />;
  }

  return children;
};

const App = () => {
  return (
    <div className="app-layout">
      <FloatingDecor />
      <Navbar />
      <main className="main-content">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Citizen Routes */}
          <Route
            path="/report"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Report />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-complaints"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <MyComplaints />
              </ProtectedRoute>
            }
          />

          {/* Shared / Role-Checked Detail Route */}
          <Route
            path="/complaints/:id"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'authority', 'collector']}>
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          {/* Authority Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={['authority']}>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          {/* Collector Routes */}
          <Route
            path="/tasks"
            element={
              <ProtectedRoute allowedRoles={['collector', 'authority']}>
                <Tasks />
              </ProtectedRoute>
            }
          />

          {/* 404 Route */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default App;
