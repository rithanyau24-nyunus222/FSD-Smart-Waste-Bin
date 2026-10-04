import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import { ProtectedRoute } from './components.jsx';
import Login from './pages/Login.jsx';
import Citizen from './pages/Citizen.jsx';
import Authority from './pages/Authority.jsx';
import Collector from './pages/Collector.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Login />} />

          <Route
            path="/citizen/*"
            element={
              <ProtectedRoute allowedRoles={['citizen']}>
                <Citizen />
              </ProtectedRoute>
            }
          />

          <Route
            path="/authority/*"
            element={
              <ProtectedRoute allowedRoles={['authority']}>
                <Authority />
              </ProtectedRoute>
            }
          />

          <Route
            path="/collector/*"
            element={
              <ProtectedRoute allowedRoles={['collector']}>
                <Collector />
              </ProtectedRoute>
            }
          />

          <Route
            path="/complaint/:id"
            element={
              <ProtectedRoute allowedRoles={['citizen', 'authority', 'collector']}>
                <ComplaintDetail />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
