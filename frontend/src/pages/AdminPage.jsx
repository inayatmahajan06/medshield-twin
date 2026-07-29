/**
 * AdminPage.jsx
 * -------------
 * Purpose: Provides a restricted management console for Administrator users.
 * Why: Role-Based Access Control (RBAC) requires distinct features (like adding or
 *      decommissioning hospital devices) to be locked to specific credentials,
 *      which is essential for secure network auditing.
 */

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, ShieldAlert, Cpu, UserPlus, Info, CheckCircle } from 'lucide-react';
import { getApiUrl } from '../api/config';

const DEPARTMENTS = [
  "Reception", "Emergency Room", "ICU", "Operation Theatre",
  "Radiology", "Pharmacy", "Laboratory", "General Ward",
  "Server Room", "Network Control Room"
];

export default function AdminPage({ user }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // Device Form State
  const [devId, setDevId] = useState('');
  const [devName, setDevName] = useState('');
  const [devRoom, setDevRoom] = useState('ICU');
  const [devIp, setDevIp] = useState('');
  const [devMac, setDevMac] = useState('');
  const [devFirmware, setDevFirmware] = useState('v1.0.0');
  const [deviceStatusMsg, setDeviceStatusMsg] = useState('');
  const [deviceSuccess, setDeviceSuccess] = useState(false);

  // User Register Form State
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regRole, setRegRole] = useState('Security Analyst');
  const [userStatusMsg, setUserStatusMsg] = useState('');
  const [userSuccess, setUserSuccess] = useState(false);

  const fetchDevices = async () => {
    try {
      const response = await fetch(getApiUrl('/api/devices'), { credentials: 'include' });
      const data = await response.json();
      setDevices(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user.role === 'Admin') {
      fetchDevices();
    }
  }, [user]);

  const handleAddDevice = async (e) => {
    e.preventDefault();
    setDeviceStatusMsg('');
    setDeviceSuccess(false);

    try {
      const response = await fetch(getApiUrl('/api/devices'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          id: devId,
          name: devName,
          room: devRoom,
          ip_address: devIp,
          mac_address: devMac,
          firmware_version: devFirmware
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setDeviceSuccess(true);
        setDeviceStatusMsg("Device successfully registered in database & blockchain!");
        // Reset form
        setDevId('');
        setDevName('');
        setDevIp('');
        setDevMac('');
        fetchDevices(); // reload list
      } else {
        setDeviceStatusMsg(data.message || "Failed to add device.");
      }
    } catch (err) {
      setDeviceStatusMsg("Connection error. Check Flask backend.");
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm(`Are you sure you want to delete and decommission device ${id}?`)) return;

    try {
      const response = await fetch(getApiUrl(`/api/devices/${id}`), {
        method: 'DELETE',
        credentials: 'include'
      });
      const data = await response.json();
      if (response.ok && data.success) {
        alert("Device decommissioned successfully.");
        fetchDevices(); // reload
      } else {
        alert(data.message || "Decommissioning failed.");
      }
    } catch (err) {
      alert("Connection error.");
    }
  };

  const handleRegisterUser = async (e) => {
    e.preventDefault();
    setUserStatusMsg('');
    setUserSuccess(false);

    try {
      const response = await fetch(getApiUrl('/api/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          username: regUsername,
          password: regPassword,
          role: regRole
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setUserSuccess(true);
        setUserStatusMsg(`User ${regUsername} successfully created as ${regRole}!`);
        setRegUsername('');
        setRegPassword('');
      } else {
        setUserStatusMsg(data.message || "Registration failed.");
      }
    } catch (err) {
      setUserStatusMsg("Connection error.");
    }
  };

  // Guard Clause: If not Admin, show Access Denied
  if (user.role !== 'Admin') {
    return (
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-12 rounded-3xl max-w-2xl mx-auto text-center space-y-6 shadow-sm mt-12">
        <ShieldAlert className="h-16 w-16 mx-auto text-red-500 animate-pulse-red" />
        <h2 className="text-2xl font-black text-slate-800 dark:text-white uppercase tracking-tight">Access Denied: Admin Privileges Required</h2>
        <p className="text-slate-500 dark:text-slate-400 text-sm max-w-md mx-auto leading-relaxed">
          Your current profile role is <b>{user.role}</b>. The Administrative panel allows direct changes to SQL schemas, user credentials, and device networks, which is locked to Admin accounts.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Admin Command Center</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Manage system-level configurations, add/remove smart clinical endpoints, and assign operator access.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Side: Forms (Spans 2) */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Form 1: Add Smart Device */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Cpu className="h-5 w-5 text-sky-500" />
              <span>Register New IoMT Device Node</span>
            </h3>

            {deviceStatusMsg && (
              <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 font-medium ${
                deviceSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                {deviceSuccess ? <CheckCircle className="h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
                <span>{deviceStatusMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddDevice} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Device ID (Unique Key):</label>
                <input
                  type="text" required value={devId} onChange={(e) => setDevId(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none"
                  placeholder="e.g. ICU-ECG-02"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Display Name:</label>
                <input
                  type="text" required value={devName} onChange={(e) => setDevName(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none"
                  placeholder="e.g. Vital Sign Monitor B"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Department Location:</label>
                <select
                  value={devRoom} onChange={(e) => setDevRoom(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none"
                >
                  {DEPARTMENTS.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">IP Address Configuration:</label>
                <input
                  type="text" required value={devIp} onChange={(e) => setDevIp(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none font-mono"
                  placeholder="e.g. 192.168.10.105"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">MAC Physical Address:</label>
                <input
                  type="text" required value={devMac} onChange={(e) => setDevMac(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none font-mono"
                  placeholder="e.g. 00:50:56:A1:B2:FF"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Firmware Version:</label>
                <input
                  type="text" required value={devFirmware} onChange={(e) => setDevFirmware(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none font-mono"
                  placeholder="e.g. v1.0.0"
                />
              </div>

              <div className="sm:col-span-2 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 flex items-center space-x-2"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Device Node</span>
                </button>
              </div>
            </form>
          </div>

          {/* Form 2: Register User Console */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <UserPlus className="h-5 w-5 text-indigo-500" />
              <span>Register New System Operator Account</span>
            </h3>

            {userStatusMsg && (
              <div className={`p-3 rounded-xl border text-xs flex items-center space-x-2 font-medium ${
                userSuccess
                  ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
              }`}>
                {userSuccess ? <CheckCircle className="h-4.5 w-4.5" /> : <ShieldAlert className="h-4.5 w-4.5" />}
                <span>{userStatusMsg}</span>
              </div>
            )}

            <form onSubmit={handleRegisterUser} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Username:</label>
                <input
                  type="text" required value={regUsername} onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none"
                  placeholder="e.g. analyst_sarah"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Password:</label>
                <input
                  type="password" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div>
                <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Assign System Role:</label>
                <select
                  value={regRole} onChange={(e) => setRegRole(e.target.value)}
                  className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-850 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none"
                >
                  <option value="Admin">Admin (Full Access)</option>
                  <option value="Security Analyst">Security Analyst (Audit & Report)</option>
                  <option value="Guest">Guest (Read Only)</option>
                </select>
              </div>

              <div className="sm:col-span-3 pt-2">
                <button
                  type="submit"
                  className="px-6 py-3 rounded-xl shadow-sm text-sm font-semibold text-white bg-gradient-to-r from-indigo-500 to-sky-600 hover:from-indigo-400 hover:to-sky-500 flex items-center space-x-2"
                >
                  <UserPlus className="h-4 w-4" />
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>

        </div>

        {/* Right Side: Device Decommission list */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Active Device Catalog</h3>
            <p className="text-slate-400 text-xs mt-1">Audit and decommission registered smart hospital endpoints.</p>
          </div>

          <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
            {devices.map((device) => (
              <div key={device.id} className="p-3 border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <p className="font-bold text-slate-700 dark:text-slate-350">{device.name}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{device.id} | {device.room}</p>
                </div>
                <button
                  onClick={() => handleDeleteDevice(device.id)}
                  className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-colors"
                  title="Decommission Device"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
