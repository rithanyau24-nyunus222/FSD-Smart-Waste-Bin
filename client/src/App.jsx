import React from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './api.jsx';
import { Sidebar, Header, RightPanel } from './components.jsx';

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
      <div style={{ textAlign: 'center', padding: '100px 0', color: 'var(--text-muted)' }}>
        Loading CleanChennai portal...
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'authority') return <Navigate to="/dashboard" replace />;
    if (user.role === 'collector') return <Navigate to="/tasks" replace />;
    return <Navigate to="/report" replace />;
  }

  return children;
};

const App = () => {
  return (
    <div className="dashboard-root">
      {/* Permanent Left Sidebar */}
      <Sidebar />

      {/* Main Workspace (Header + Center + Right Panel) */}
      <div className="main-wrapper">
        <Header />

        <div className="content-body">
          <main className="center-content">
            <Routes>
              {/* Home & Overview */}
              <Route path="/" element={<Home />} />
              <Route path="/about" element={<About />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* Citizen Reporting */}
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

              {/* Shared Complaint Detail Tracker */}
              <Route
                path="/complaints/:id"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'authority', 'collector']}>
                    <ComplaintDetail />
                  </ProtectedRoute>
                }
              />

              {/* Corporation Hub */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['authority']}>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* Driver Daily Tasks */}
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute allowedRoles={['collector', 'authority']}>
                    <Tasks />
                  </ProtectedRoute>
                }
              />

              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>

          {/* Right Stats & Activity Panel (Matching Reference Image) */}
          <RightPanel />
        </div>
      </div>
    </div>
  );
};

export default App;
