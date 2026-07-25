/**
 * LoginPage.jsx
 * -------------
 * Purpose: Handles user authentication, validating credentials against the SQLite database.
 * Why: Restricts access to sensitive clinical dashboards and forensic PDF exports based
 *      on user roles.
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Lock, User, AlertCircle, Eye, EyeOff } from 'lucide-react';

export default function LoginPage({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Callback to App.jsx to update authenticated user state
        onLoginSuccess(data.user);
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid username or password.');
      }
    } catch (err) {
      setError('Connection refused. Please confirm Flask server is running.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Visual background lights */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/5 rounded-full blur-3xl" />
      
      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2.5 rounded-xl group-hover:scale-105 transition-transform">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white">
              MedShield Twin
            </span>
          </Link>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Security Console Login
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Enter credentials to access digital twin metrics
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900 border border-slate-800 py-8 px-4 shadow-xl rounded-2xl sm:px-10">
          
          {error && (
            <div className="mb-4 bg-red-950/30 border border-red-500/30 text-red-400 p-3 rounded-xl flex items-center space-x-2 text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Username
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="e.g. admin"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Password
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 border border-slate-800 rounded-xl bg-slate-950 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all sm:text-sm"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center py-3.5 px-4 border border-transparent rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>

          {/* Quick Access Credentials Box */}
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 text-center">
              Evaluator Test Accounts
            </h4>
            <div className="grid grid-cols-3 gap-2 text-[11px]">
              <div
                onClick={() => { setUsername('admin'); setPassword('admin123'); }}
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-center cursor-pointer hover:border-sky-500/50 transition-colors"
              >
                <p className="font-bold text-sky-400">Admin</p>
                <p className="text-slate-500 mt-1">admin</p>
                <p className="text-slate-500">admin123</p>
              </div>
              <div
                onClick={() => { setUsername('analyst'); setPassword('analyst123'); }}
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-center cursor-pointer hover:border-indigo-500/50 transition-colors"
              >
                <p className="font-bold text-indigo-400">Analyst</p>
                <p className="text-slate-500 mt-1">analyst</p>
                <p className="text-slate-500">analyst123</p>
              </div>
              <div
                onClick={() => { setUsername('guest'); setPassword('guest123'); }}
                className="bg-slate-950 border border-slate-800 p-2.5 rounded-xl text-center cursor-pointer hover:border-emerald-500/50 transition-colors"
              >
                <p className="font-bold text-emerald-400">Guest</p>
                <p className="text-slate-500 mt-1">guest</p>
                <p className="text-slate-500">guest123</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
