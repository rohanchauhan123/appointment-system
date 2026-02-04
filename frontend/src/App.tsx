/**
 * Main App Component
 * Sets up routing and providers
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Appointments from './pages/Appointments';
import Agents from './pages/Agents';
import ActivityLogs from './pages/ActivityLogs';
import Export from './pages/Export';
import Admins from './pages/Admins';
import './App.css';

// Protected Route component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

// Admin Route component
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-screen">Loading...</div>;
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Appointments />} />
        <Route
          path="agents"
          element={
            <AdminRoute>
              <Agents />
            </AdminRoute>
          }
        />
        <Route
          path="activity-logs"
          element={
            <AdminRoute>
              <ActivityLogs />
            </AdminRoute>
          }
        />
        <Route
          path="export"
          element={
            <AdminRoute>
              <Export />
            </AdminRoute>
          }
        />
        <Route
          path="admins"
          element={
            <AdminRoute>
              <Admins />
            </AdminRoute>
          }
        />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#1a1a2e',
              color: '#fff',
            },
          }}
        />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
