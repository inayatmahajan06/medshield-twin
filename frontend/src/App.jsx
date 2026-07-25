/**
 * App.jsx
 * -------
 * Purpose: Central shell of the MedShield Twin React frontend.
 * Why: Establishes the routing infrastructure, checks active login sessions,
 *      maintains layout structures, and acts as the gatekeeper for private panels.
 */

import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Shield, LayoutDashboard, Activity, Database,
  Cpu, AlertTriangle, Settings, LogOut, Menu, X, User
} from 'lucide-react';

import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import DigitalTwinPage from './pages/DigitalTwinPage';
import NetworkPage from './pages/NetworkPage';
import AIThreatPage from './pages/AIThreatPage';
import BlockchainPage from './pages/BlockchainPage';
import AlertsLogsPage from './pages/AlertsLogsPage';
import AdminPage from './pages/AdminPage';
import SettingsPage from './pages/SettingsPage';

function AppContent() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();

  // Sync active login status with Flask backend on mount
  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/auth/current');
      const data = await response.json();
      if (response.ok && data.authenticated) {
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error("Auth sync error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  // Skip showing sidebar on landing and login pages
  const isAuthPage = location.pathname === '/' || location.pathname === '/login';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
        <div className="text-center space-y-4">
          <Shield className="h-12 w-12 text-sky-500 animate-pulse mx-auto" />
          <p className="text-sm font-bold tracking-widest text-slate-400">LOADING MEDSHIELD TWIN...</p>
        </div>
      </div>
    );
  }

  // Route guarding helper
  const ProtectedRoute = ({ children }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  if (isAuthPage) {
    return (
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage onLoginSuccess={handleLoginSuccess} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      
      {/* --- Sidebar Navigation --- */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-850 flex flex-col justify-between transform transition-transform duration-255 lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        
        {/* Header and Branding */}
        <div>
          <div className="px-6 py-5 border-b border-slate-100 dark:border-slate-850 flex items-center justify-between">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-sky-500" />
              <span className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-white uppercase">
                MedShield Console
              </span>
            </Link>
            <button className="lg:hidden text-slate-400" onClick={() => setSidebarOpen(false)}>
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Links list */}
          <nav className="p-4 space-y-1.5 text-sm">
            {/* Dashboard */}
            <Link
              to="/dashboard"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === '/dashboard'
                  ? 'bg-sky-500/10 text-sky-500'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span>Dashboard</span>
            </Link>

            {/* Hospital Digital Twin */}
            <Link
              to="/digital-twin"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === '/digital-twin'
                  ? 'bg-sky-500/10 text-sky-500'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Activity className="h-4.5 w-4.5" />
              <span>Digital Twin Map</span>
            </Link>

            {/* Network Monitor */}
            <Link
              to="/network"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === '/network'
                  ? 'bg-sky-500/10 text-sky-500'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Shield className="h-4.5 w-4.5" />
              <span>Network Sniffer</span>
            </Link>

            {/* Machine Learning */}
            <Link
              to="/ai-threat"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === '/ai-threat'
                  ? 'bg-sky-500/10 text-sky-500'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Cpu className="h-4.5 w-4.5" />
              <span>AI Classifier</span>
            </Link>

            {/* Blockchain */}
            <Link
              to="/blockchain"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === '/blockchain'
                  ? 'bg-sky-500/10 text-sky-500'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Database className="h-4.5 w-4.5" />
              <span>Blockchain Ledger</span>
            </Link>

            {/* Alerts & Logs */}
            <Link
              to="/alerts-logs"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === '/alerts-logs'
                  ? 'bg-sky-500/10 text-sky-500'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <AlertTriangle className="h-4.5 w-4.5" />
              <span>Forensic Auditing</span>
            </Link>

            {/* Admin (Locked for Admin role) */}
            {user.role === 'Admin' && (
              <Link
                to="/admin"
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                  location.pathname === '/admin'
                    ? 'bg-sky-500/10 text-sky-500'
                    : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                <User className="h-4.5 w-4.5" />
                <span>Admin Panel</span>
              </Link>
            )}

            {/* Settings */}
            <Link
              to="/settings"
              className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold transition-all ${
                location.pathname === '/settings'
                  ? 'bg-sky-500/10 text-sky-500'
                  : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-850 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <Settings className="h-4.5 w-4.5" />
              <span>Configurations</span>
            </Link>
          </nav>
        </div>

        {/* Footer User Info and Logout */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-900/60 space-y-3">
          <div className="flex items-center space-x-3 px-2">
            <div className="h-8 w-8 rounded-full bg-sky-500/10 text-sky-500 font-black flex items-center justify-center border border-sky-500/20 text-xs">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{user.username}</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{user.role}</p>
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-4 py-2.5 rounded-xl font-bold text-red-500 hover:bg-red-500/10 hover:text-red-500 transition-colors text-xs"
          >
            <LogOut className="h-4 w-4" />
            <span>Terminate Session</span>
          </button>
        </div>

      </aside>

      {/* --- Main Dashboard Container --- */}
      <div className="flex-1 flex flex-col lg:pl-64">
        {/* Mobile Top Navbar */}
        <header className="lg:hidden flex items-center justify-between px-6 py-4 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-850">
          <div className="flex items-center space-x-2">
            <Shield className="h-6 w-6 text-sky-500" />
            <span className="font-extrabold text-sm text-slate-800 dark:text-white tracking-tight uppercase">MedShield</span>
          </div>
          <button className="text-slate-500" onClick={() => setSidebarOpen(!sidebarOpen)}>
            <Menu className="h-6 w-6" />
          </button>
        </header>

        {/* Internal Dashboard View */}
        <main className="p-6 md:p-8 max-w-7xl w-full mx-auto flex-1">
          <Routes>
            <Route path="/dashboard" element={<ProtectedRoute><DashboardPage user={user} /></ProtectedRoute>} />
            <Route path="/digital-twin" element={<ProtectedRoute><DigitalTwinPage user={user} /></ProtectedRoute>} />
            <Route path="/network" element={<ProtectedRoute><NetworkPage /></ProtectedRoute>} />
            <Route path="/ai-threat" element={<ProtectedRoute><AIThreatPage /></ProtectedRoute>} />
            <Route path="/blockchain" element={<ProtectedRoute><BlockchainPage user={user} /></ProtectedRoute>} />
            <Route path="/alerts-logs" element={<ProtectedRoute><AlertsLogsPage /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute><AdminPage user={user} /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage user={user} /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </main>
      </div>

    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}
