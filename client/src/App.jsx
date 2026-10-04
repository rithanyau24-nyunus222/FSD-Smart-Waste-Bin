import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './auth.jsx';
import { ProtectedRoute } from './components.jsx';
import Login from './pages/Login.jsx';
import Citizen from './pages/Citizen.jsx';
import Authority from './pages/Authority.jsx';
import Collector from './pages/Collector.jsx';
import ComplaintDetail from './pages/ComplaintDetail.jsx';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', padding: '40px 24px', background: '#f4f4e1', color: '#294237', fontFamily: 'system-ui, sans-serif' }}>
          <div style={{ maxWidth: '640px', margin: '40px auto', background: '#fff', borderRadius: '16px', padding: '32px', border: '2px solid #294237' }}>
            <h2 style={{ fontSize: '24px', marginBottom: '12px', color: '#294237' }}>Application View Notice</h2>
            <p style={{ fontSize: '14px', marginBottom: '16px', color: '#555' }}>
              The application encountered an unexpected state while loading this page:
            </p>
            <pre style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '12px', borderRadius: '8px', color: '#991b1b', fontSize: '12px', overflowX: 'auto', marginBottom: '20px', whiteSpace: 'pre-wrap' }}>
              {this.state.error?.stack || this.state.error?.message || String(this.state.error)}
            </pre>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/citizen';
                }}
                style={{ padding: '10px 18px', background: '#ffc2ef', color: '#294237', border: '2px solid #294237', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Launch Citizen Portal (Rithanya)
              </button>
              <button
                type="button"
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  window.location.href = '/collector';
                }}
                style={{ padding: '10px 18px', background: '#d9f99d', color: '#294237', border: '2px solid #294237', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Launch Collector Hub
              </button>
              <button
                type="button"
                onClick={() => {
                  localStorage.clear();
                  window.location.href = '/';
                }}
                style={{ padding: '10px 18px', background: '#294237', color: '#f4f4e1', border: 'none', borderRadius: '999px', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Reset & Return Home
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
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
  </ErrorBoundary>
);
}
