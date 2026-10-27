import React, { useState } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import Navbar from './components/Navbar.jsx';
import Sidebar from './components/Sidebar.jsx';

// Pages
import Dashboard from './pages/Dashboard.jsx';
import Jobs from './pages/Jobs.jsx';
import JobEditor from './pages/JobEditor.jsx';
import CalendarView from './pages/CalendarView.jsx';
import Executions from './pages/Executions.jsx';
import FailedJobs from './pages/FailedJobs.jsx';
import TelegramConfig from './pages/TelegramConfig.jsx';
import Settings from './pages/Settings.jsx';
import AuditLogs from './pages/AuditLogs.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

export function App() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
              <Navbar
                onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
                isSidebarOpen={isSidebarOpen}
              />
              <div className="flex-1 flex overflow-hidden">
                <Sidebar
                  isOpen={isSidebarOpen}
                  onClose={() => setIsSidebarOpen(false)}
                />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/jobs" element={<Jobs />} />
                    <Route path="/jobs/new" element={<JobEditor />} />
                    <Route path="/jobs/edit/:id" element={<JobEditor />} />
                    <Route path="/calendar" element={<CalendarView />} />
                    <Route path="/executions" element={<Executions />} />
                    <Route path="/failed" element={<FailedJobs />} />
                    <Route path="/telegram" element={<TelegramConfig />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/audit-logs" element={<AuditLogs />} />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </main>
              </div>
            </div>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}

export default App;
