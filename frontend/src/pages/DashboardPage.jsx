/**
 * DashboardPage.jsx
 * ----------------
 * Purpose: Central control dashboard for MedShield Twin.
 * Why: Provides security analysts and administrators with high-level statistics,
 *      attack activity summaries, quick forensic exports, and network trend charts.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import {
  Shield, Cpu, AlertTriangle, CheckCircle, Database,
  Activity, Play, FileText, ArrowRight, Clock, Plus, Trash2
} from 'lucide-react';

// Register ChartJS elements
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function DashboardPage({ user }) {
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [blockchainLength, setBlockchainLength] = useState(0);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Fetch all dashboard stats
  const fetchStats = async () => {
    try {
      // Fetch devices
      const devRes = await fetch('/api/devices');
      const devData = await devRes.json();
      setDevices(devData);

      // Fetch alerts
      const alertRes = await fetch('/api/alerts?limit=6');
      const alertData = await alertRes.json();
      setAlerts(alertData);

      // Fetch recent logs
      const logRes = await fetch('/api/logs?limit=8');
      const logData = await logRes.json();
      setLogs(logData);

      // Fetch blockchain length
      const bcRes = await fetch('/api/blockchain');
      const bcData = await bcRes.json();
      setBlockchainLength(bcData.length);
    } catch (err) {
      console.error("Error fetching stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Poll every 3 seconds to keep telemetry fresh
    const interval = setInterval(fetchStats, 3000);
    return () => clearInterval(interval);
  }, []);

  // Compute metrics
  const totalDevices = devices.length;
  const onlineDevices = devices.filter(d => d.status === 'Online' || d.status === 'Safe').length;
  const attackedDevices = devices.filter(d => d.status === 'Under Attack').length;
  const offlineDevices = devices.filter(d => d.status === 'Offline').length;
  const avgRisk = totalDevices ? Math.round(devices.reduce((acc, curr) => acc + curr.risk_score, 0) / totalDevices) : 0;

  // Handle PDF report generation
  const handleDownloadReport = async () => {
    if (user.role === 'Guest') {
      alert("Permission Denied: Guests cannot generate reports. Please login as Admin or Analyst.");
      return;
    }
    
    try {
      window.open('/api/reports/download', '_blank');
    } catch (err) {
      console.error("Error downloading report:", err);
    }
  };

  // Compile Department data for Chart.js
  const departmentCounts = devices.reduce((acc, device) => {
    const dept = device.room;
    if (!acc[dept]) acc[dept] = { total: 0, risky: 0 };
    acc[dept].total += 1;
    if (device.risk_score > 30) acc[dept].risky += 1;
    return acc;
  }, {});

  const chartData = {
    labels: Object.keys(departmentCounts),
    datasets: [
      {
        label: 'Total Devices',
        data: Object.values(departmentCounts).map(d => d.total),
        backgroundColor: 'rgba(56, 189, 248, 0.6)', // Tailwind sky-400
        borderColor: 'rgb(56, 189, 248)',
        borderWidth: 1,
      },
      {
        label: 'High Risk (>30%)',
        data: Object.values(departmentCounts).map(d => d.risky),
        backgroundColor: 'rgba(239, 68, 68, 0.6)', // Tailwind red-500
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: { color: '#94a3b8' } // Tailwind slate-400
      },
    },
    scales: {
      x: { grid: { display: false }, ticks: { color: '#94a3b8' } },
      y: { grid: { color: '#1e293b' }, ticks: { color: '#94a3b8', stepSize: 1 } }
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Security Command Dashboard
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            Real-time status of hospital digital twin nodes, cybersecurity alerts, and ledger logs.
          </p>
        </div>

        <div className="flex items-center space-x-3 text-xs bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-4 py-2.5 rounded-xl text-slate-500 dark:text-slate-400">
          <Clock className="h-4 w-4 text-sky-500" />
          <span>Active Role: <b className="text-sky-500 uppercase">{user.role}</b></span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1: Connected */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Connected Nodes</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">{onlineDevices}/{totalDevices}</h3>
            <p className="text-xs text-slate-400 mt-1">Safe and responding</p>
          </div>
          <div className="bg-emerald-500/10 text-emerald-500 p-4 rounded-xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2: Offline */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Offline Nodes</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">{offlineDevices}</h3>
            <p className="text-xs text-slate-400 mt-1">Check cable connections</p>
          </div>
          <div className="bg-slate-500/10 text-slate-400 p-4 rounded-xl">
            <Cpu className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3: Compromised */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Active Threats</p>
            <h3 className={`text-2xl font-black mt-2 ${attackedDevices > 0 ? 'text-red-500 animate-pulse' : 'text-slate-800 dark:text-white'}`}>
              {attackedDevices}
            </h3>
            <p className="text-xs text-slate-400 mt-1">AI flagged activities</p>
          </div>
          <div className={`p-4 rounded-xl ${attackedDevices > 0 ? 'bg-red-500/10 text-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-400'}`}>
            <AlertTriangle className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4: Blockchain Blocks */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Ledger Size</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-2">#{blockchainLength} Blocks</h3>
            <p className="text-xs text-slate-400 mt-1">Tamper-proof medical log</p>
          </div>
          <div className="bg-sky-500/10 text-sky-500 p-4 rounded-xl">
            <Database className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Quick Actions & Department Risk Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Quick Actions Card */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-6">Quick Operations</h3>
            <div className="space-y-4">
              {/* Action 1: Add Device */}
              <button
                onClick={() => navigate('/admin')}
                disabled={user.role !== 'Admin'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-sky-500/10 text-sky-500">
                    <Plus className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">Add Device Node</h4>
                    <p className="text-[11px] text-slate-400">Register new clinical hardware</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 2: Start Attack simulator */}
              <button
                onClick={() => navigate('/ai-threat')}
                disabled={user.role === 'Guest'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-indigo-500/10 text-indigo-500">
                    <Play className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">Inject Attack Sim</h4>
                    <p className="text-[11px] text-slate-400">Trigger simulated cyber threat</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>

              {/* Action 3: Generate Forensic PDF Report */}
              <button
                onClick={handleDownloadReport}
                disabled={user.role === 'Guest'}
                className="w-full flex items-center justify-between p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 hover:bg-slate-100 dark:hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed group text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded bg-emerald-500/10 text-emerald-500">
                    <FileText className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-slate-700 dark:text-slate-350">Forensic Report (PDF)</h4>
                    <p className="text-[11px] text-slate-400">Compile & download compliance audit</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>
          </div>
          
          <div className="mt-6 border-t border-slate-100 dark:border-slate-800 pt-4 flex justify-between text-xs text-slate-400">
            <span>Hospital Risk Level:</span>
            <span className={`font-bold ${avgRisk > 30 ? 'text-red-500 animate-pulse' : 'text-emerald-500'}`}>{avgRisk}%</span>
          </div>
        </div>

        {/* Department Analytics Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm flex flex-col justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Department Risk Distribution</h3>
            <p className="text-slate-400 text-xs mt-1">IoMT device quantities compared to critical risk thresholds</p>
          </div>
          <div className="h-64 mt-4">
            <Bar data={chartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Alerts and Logs Split Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Recent AI Threat Flags */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-red-500 animate-pulse" />
              <h3 className="font-bold text-slate-900 dark:text-white">Recent AI Security Alerts</h3>
            </div>
            <button onClick={() => navigate('/alerts-logs')} className="text-xs text-sky-500 font-semibold hover:underline">
              View All
            </button>
          </div>
          
          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
            {alerts.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">No active security alerts flagged.</p>
            ) : (
              alerts.map((alert) => (
                <div key={alert.id} className="p-3 bg-red-50/50 dark:bg-red-950/10 border border-red-100 dark:border-red-900/30 rounded-xl flex items-start space-x-3 text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold uppercase tracking-wider shrink-0 ${
                    alert.severity === 'Critical' ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                  }`}>
                    {alert.severity}
                  </span>
                  <div className="space-y-1">
                    <p className="text-slate-700 dark:text-slate-300 font-medium">{alert.message}</p>
                    <p className="text-slate-400 text-[10px]">{alert.timestamp} | Target: {alert.device_id}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Real-time System Audit Log */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-sky-500" />
              <h3 className="font-bold text-slate-900 dark:text-white">System Activity Audit Log</h3>
            </div>
            <button onClick={() => navigate('/alerts-logs')} className="text-xs text-sky-500 font-semibold hover:underline">
              View All
            </button>
          </div>

          <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 font-mono text-xs">
            {logs.length === 0 ? (
              <p className="text-slate-400 text-sm text-center py-8">Log history empty.</p>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-950/40 text-slate-600 dark:text-slate-400 flex items-start space-x-3">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold shrink-0 ${
                    log.log_type === 'Attack Log' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                    log.log_type === 'Blockchain Log' ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20' :
                    log.log_type === 'User Log' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                    'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}>
                    {log.log_type.replace(' Log', '')}
                  </span>
                  <div className="space-y-1">
                    <p className="font-medium text-slate-700 dark:text-slate-300">{log.message}</p>
                    <p className="text-[10px] text-slate-400">{log.timestamp} {log.details ? `| ${log.details}` : ''}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
