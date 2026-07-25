/**
 * AlertsLogsPage.jsx
 * -----------------
 * Purpose: Provides a dual-tabbed logs and alerts explorer.
 * Why: Forensic analysts need clean filters to isolate specific user actions,
 *      device log sequences, or attack timings during post-incident reviews.
 */

import React, { useState, useEffect } from 'react';
import { Search, AlertTriangle, List, ShieldAlert, Cpu, Eye, Filter } from 'lucide-react';

export default function AlertsLogsPage() {
  const [activeTab, setActiveTab] = useState('alerts'); // 'alerts' or 'logs'
  const [alerts, setAlerts] = useState([]);
  const [logs, setLogs] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filters
  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [logTypeFilter, setLogTypeFilter] = useState('ALL');

  const fetchData = async () => {
    try {
      if (activeTab === 'alerts') {
        const response = await fetch('/api/alerts?limit=100');
        const data = await response.json();
        setAlerts(data);
      } else {
        const response = await fetch('/api/logs?limit=150');
        const data = await response.json();
        setLogs(data);
      }
    } catch (err) {
      console.error("Error fetching logs/alerts:", err);
    }
  };

  useEffect(() => {
    fetchData();
    // Poll every 3 seconds
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [activeTab]);

  // Filtered Alert List
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = 
      alert.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (alert.device_id && alert.device_id.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesSeverity = severityFilter === 'ALL' || alert.severity === severityFilter;
    
    return matchesSearch && matchesSeverity;
  });

  // Filtered Logs List
  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchQuery.toLowerCase()));
      
    const matchesType = logTypeFilter === 'ALL' || log.log_type === logTypeFilter;
    
    return matchesSearch && matchesType;
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Forensic Alerts & Logs</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Review system event logs, access attempts, and machine-learning threat histories.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => { setActiveTab('alerts'); setSearchQuery(''); }}
          className={`pb-4 px-6 font-bold text-sm border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'alerts'
              ? 'border-red-500 text-red-500'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <AlertTriangle className="h-4 w-4" />
          <span>Active Threat Alerts ({filteredAlerts.length})</span>
        </button>
        <button
          onClick={() => { setActiveTab('logs'); setSearchQuery(''); }}
          className={`pb-4 px-6 font-bold text-sm border-b-2 flex items-center space-x-2 transition-all ${
            activeTab === 'logs'
              ? 'border-sky-500 text-sky-500'
              : 'border-transparent text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          <List className="h-4 w-4" />
          <span>System Activity Logs ({filteredLogs.length})</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl shadow-sm flex flex-col md:flex-row md:items-center gap-4">
        
        {/* Search */}
        <div className="flex-1 relative rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-9 pr-3 py-2 text-sm border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-sky-500 focus:border-transparent transition-all"
            placeholder={activeTab === 'alerts' ? "Search alerts message or device..." : "Search logs text details..."}
          />
        </div>

        {/* Filter Dropdowns */}
        <div>
          {activeTab === 'alerts' ? (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl">
              <Filter className="h-3.5 w-3.5" />
              <span>Severity:</span>
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-350 font-bold focus:outline-none"
              >
                <option value="ALL">ALL Levels</option>
                <option value="Critical">Critical</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl">
              <Filter className="h-3.5 w-3.5" />
              <span>Log Category:</span>
              <select
                value={logTypeFilter}
                onChange={(e) => setLogTypeFilter(e.target.value)}
                className="bg-transparent text-slate-700 dark:text-slate-350 font-bold focus:outline-none"
              >
                <option value="ALL">ALL Logs</option>
                <option value="User Log">User Log</option>
                <option value="Attack Log">Attack Log</option>
                <option value="Device Log">Device Log</option>
                <option value="Blockchain Log">Blockchain Log</option>
                <option value="System Log">System Log</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Grid Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden">
        {activeTab === 'alerts' ? (
          /* --- Alerts Table --- */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-850">
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Timestamp</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Severity</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Target Device</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Log Message</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredAlerts.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 font-medium">
                      No security alerts found matching query filters.
                    </td>
                  </tr>
                ) : (
                  filteredAlerts.map((alert) => {
                    const isCritical = alert.severity === 'Critical' || alert.severity === 'High';
                    return (
                      <tr key={alert.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                        <td className="py-4 px-6 font-mono text-slate-400">{alert.timestamp}</td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-0.5 rounded font-black text-[9px] uppercase tracking-wider ${
                            isCritical ? 'bg-red-500 text-white' : 'bg-orange-500 text-white'
                          }`}>
                            {alert.severity}
                          </span>
                        </td>
                        <td className="py-4 px-6 font-mono font-bold text-slate-700 dark:text-slate-350">{alert.device_id}</td>
                        <td className="py-4 px-6 text-slate-700 dark:text-slate-300 leading-normal max-w-sm">
                          {alert.message}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* --- Logs Table --- */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-850">
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Timestamp</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Category</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Log Header</th>
                  <th className="py-4 px-6 font-bold uppercase tracking-wider">Metadata Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-12 text-center text-slate-400 font-medium">
                      No system logs found matching query filters.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors">
                      <td className="py-4 px-6 font-mono text-slate-400">{log.timestamp}</td>
                      <td className="py-4 px-6 font-mono">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                          log.log_type === 'Attack Log' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                          log.log_type === 'Blockchain Log' ? 'bg-sky-500/10 text-sky-500 border border-sky-500/20' :
                          log.log_type === 'User Log' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                          log.log_type === 'Device Log' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                          'bg-slate-200 dark:bg-slate-800 text-slate-500'
                        }`}>
                          {log.log_type.replace(' Log', '')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-700 dark:text-slate-300 font-medium leading-normal max-w-xs">{log.message}</td>
                      <td className="py-4 px-6 font-mono text-[10px] text-slate-400 max-w-xs truncate">{log.details || 'None'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
