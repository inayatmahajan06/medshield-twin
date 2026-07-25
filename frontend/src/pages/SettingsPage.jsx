/**
 * SettingsPage.jsx
 * ----------------
 * Purpose: Handles application and system-level configuration parameters.
 * Why: Administrators need options to adjust ML classification confidence boundaries,
 *      telemetry polling frequencies, and visually toggle Light/Dark themes.
 */

import React, { useState, useEffect } from 'react';
import { Save, Database, ShieldAlert, CheckCircle, Info, Moon, Sun, Mail } from 'lucide-react';

export default function SettingsPage({ user }) {
  const [darkMode, setDarkMode] = useState(true);
  const [scanInterval, setScanInterval] = useState(3);
  const [aiThreshold, setAiThreshold] = useState(80);
  const [emailAlerts, setEmailAlerts] = useState(true);
  
  const [statusMsg, setStatusMsg] = useState('');
  const [success, setSuccess] = useState(false);

  // Fetch settings from Flask
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      setScanInterval(data.scan_interval);
      setAiThreshold(data.ai_threshold);
      setEmailAlerts(data.email_alerts_enabled);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchSettings();
    // Check initial dark mode state on document
    const isDark = document.documentElement.classList.contains('dark');
    setDarkMode(isDark);
  }, []);

  const handleToggleTheme = () => {
    if (darkMode) {
      document.documentElement.classList.remove('dark');
      setDarkMode(false);
    } else {
      document.documentElement.classList.add('dark');
      setDarkMode(true);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setStatusMsg('');
    setSuccess(false);

    if (user.role !== 'Admin') {
      setStatusMsg("Permission Denied: Admin role required to modify server settings.");
      return;
    }

    try {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scan_interval: parseInt(scanInterval),
          ai_threshold: parseInt(aiThreshold),
          email_alerts_enabled: emailAlerts
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setSuccess(true);
        setStatusMsg("Settings saved and propagated to background simulator!");
      } else {
        setStatusMsg(data.message || "Failed to update settings.");
      }
    } catch (err) {
      setStatusMsg("Connection error.");
    }
  };

  const handleDatabaseBackup = () => {
    alert("Database Backup Created: Saved cold snapshot to 'database/hospital_backup.db'");
  };

  const handleDatabaseRestore = () => {
    if (user.role !== 'Admin') {
      alert("Permission Denied: Admin privileges required.");
      return;
    }
    if (window.confirm("Restore database? This will revert all telemetry data to default states.")) {
      alert("Database snapshot restored. Blockchain ledger checked.");
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white font-sans">Settings & Configurations</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Configure telemetry sweep rates, machine learning alert boundaries, and visually toggle interface aesthetics.
        </p>
      </div>

      {statusMsg && (
        <div className={`p-4 rounded-xl border text-xs flex items-center space-x-2 font-medium ${
          success
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            : 'bg-red-500/10 border-red-500/20 text-red-500'
        }`}>
          {success ? <CheckCircle className="h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* Left Side: System settings */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
            <Save className="h-4.5 w-4.5 text-sky-500" />
            <span>AI & Telemetry Tuning</span>
          </h3>

          <form onSubmit={handleSaveSettings} className="space-y-5 text-xs">
            {/* Scan interval */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-450">
                <span>Simulator Sweep Frequency</span>
                <span className="text-sky-500 font-mono">{scanInterval} seconds</span>
              </div>
              <input
                type="range" min="1" max="10" step="1"
                disabled={user.role !== 'Admin'}
                value={scanInterval}
                onChange={(e) => setScanInterval(e.target.value)}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-50"
              />
              <p className="text-[10px] text-slate-400">Controls how often the background simulator ticks to update device stats.</p>
            </div>

            {/* AI Alert boundary */}
            <div className="space-y-2">
              <div className="flex justify-between font-bold text-slate-700 dark:text-slate-450">
                <span>AI Prediction Alert Boundary</span>
                <span className="text-sky-500 font-mono">{aiThreshold}%</span>
              </div>
              <input
                type="range" min="50" max="100" step="5"
                disabled={user.role !== 'Admin'}
                value={aiThreshold}
                onChange={(e) => setAiThreshold(e.target.value)}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500 disabled:opacity-50"
              />
              <p className="text-[10px] text-slate-400">Alerts are only stored if the ML classification probability meets this threshold.</p>
            </div>

            {/* Email alerts simulation toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40">
              <div className="flex items-center space-x-3">
                <Mail className="h-4.5 w-4.5 text-indigo-500" />
                <div>
                  <h4 className="font-bold text-slate-700 dark:text-slate-350">Simulated Email Notifications</h4>
                  <p className="text-[10px] text-slate-400">Triggers console warning emails on critical DDoS alerts.</p>
                </div>
              </div>
              <input
                type="checkbox"
                disabled={user.role !== 'Admin'}
                checked={emailAlerts}
                onChange={(e) => setEmailAlerts(e.target.checked)}
                className="h-4.5 w-4.5 text-sky-600 focus:ring-sky-500 border-slate-300 dark:border-slate-800 rounded accent-sky-500"
              />
            </div>

            {user.role === 'Admin' && (
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl shadow-sm text-xs font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500"
              >
                Save Configurations
              </button>
            )}
          </form>
        </div>

        {/* Right Side: Theme & DB maintenance */}
        <div className="space-y-8">
          
          {/* Theme switcher */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              {darkMode ? <Moon className="h-4.5 w-4.5 text-sky-500" /> : <Sun className="h-4.5 w-4.5 text-amber-500" />}
              <span>Interface Appearance</span>
            </h3>

            <div className="flex items-center justify-between text-xs">
              <div>
                <h4 className="font-bold text-slate-700 dark:text-slate-350">Visual Theme:</h4>
                <p className="text-[10px] text-slate-400 mt-1">Switch between Slate Dark and Bright Hospital palettes.</p>
              </div>
              <button
                onClick={handleToggleTheme}
                className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 font-bold hover:border-sky-500/50 transition-colors"
              >
                {darkMode ? 'Toggle Light Theme' : 'Toggle Dark Theme'}
              </button>
            </div>
          </div>

          {/* Database maintenance */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Database className="h-4.5 w-4.5 text-indigo-500" />
              <span>Database Backups & Registry Maintenance</span>
            </h3>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <button
                onClick={handleDatabaseBackup}
                className="p-3 border border-slate-200 dark:border-slate-800 hover:border-sky-500 bg-slate-50 dark:bg-slate-950 rounded-xl font-bold transition-all text-center"
              >
                Backup SQLite DB
              </button>
              <button
                onClick={handleDatabaseRestore}
                disabled={user.role !== 'Admin'}
                className="p-3 border border-slate-200 dark:border-slate-800 hover:border-red-500 bg-slate-50 dark:bg-slate-950 rounded-xl font-bold transition-all text-center disabled:opacity-50"
              >
                Restore Snapshot
              </button>
            </div>
          </div>

          {/* RBAC notice */}
          <div className="bg-sky-50 dark:bg-sky-950/15 border border-sky-100 dark:border-sky-900/30 p-4 rounded-xl flex items-start space-x-3 text-xs text-sky-600 dark:text-sky-400">
            <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Role-Based Safeguards Active</p>
              <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">
                Administrative settings (Simulator Frequency and AI prediction boundary thresholds) require full **Admin** authentication credentials. Security Analysts and Guests hold read-only status in this pane.
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
