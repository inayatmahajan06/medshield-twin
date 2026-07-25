/**
 * NetworkPage.jsx
 * ---------------
 * Purpose: Provides a live network analyzer interface.
 * Why: Allows students to inspect raw packet flows (captured via Scapy or the simulator),
 *      highlighting how malicious payloads can trigger flag protocols.
 */

import React, { useState, useEffect } from 'react';
import { Search, ShieldAlert, ShieldCheck, Activity, Filter, Info } from 'lucide-react';

export default function NetworkPage() {
  const [packets, setPackets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchPackets = async () => {
    try {
      const response = await fetch('/api/packets?limit=80');
      const data = await response.json();
      setPackets(data);
    } catch (err) {
      console.error("Error fetching packets:", err);
    }
  };

  useEffect(() => {
    fetchPackets();
    // Poll every 1.5 seconds for live packet updates
    const interval = setInterval(fetchPackets, 1500);
    return () => clearInterval(interval);
  }, []);

  // Filter logic
  const filteredPackets = packets.filter(pkt => {
    const matchesSearch = 
      pkt.src_ip.includes(searchQuery) || 
      pkt.dst_ip.includes(searchQuery) ||
      pkt.port.toString().includes(searchQuery);
      
    const matchesProtocol = protocolFilter === 'ALL' || pkt.protocol === protocolFilter;
    const matchesStatus = statusFilter === 'ALL' || pkt.status === statusFilter;
    
    return matchesSearch && matchesProtocol && matchesStatus;
  });

  const totalFlagged = packets.filter(p => p.status === 'Flagged').length;
  const totalNormal = packets.filter(p => p.status === 'Normal').length;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Live Network Monitor</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Sniffs and analyzes incoming and outgoing IP packet streams across hospital subnets.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Total Sniffed Packets</p>
            <h3 className="text-2xl font-black text-slate-800 dark:text-white mt-1">{packets.length}</h3>
          </div>
          <Activity className="h-8 w-8 text-sky-500" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Verified Secure Flows</p>
            <h3 className="text-2xl font-black text-emerald-500 mt-1">{totalNormal}</h3>
          </div>
          <ShieldCheck className="h-8 w-8 text-emerald-500" />
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-5 rounded-2xl flex items-center justify-between shadow-sm">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Flagged Intrusion Indicators</p>
            <h3 className={`text-2xl font-black mt-1 ${totalFlagged > 0 ? 'text-red-500 animate-pulse' : 'text-slate-400'}`}>
              {totalFlagged}
            </h3>
          </div>
          <ShieldAlert className={`h-8 w-8 ${totalFlagged > 0 ? 'text-red-500 animate-bounce' : 'text-slate-400'}`} />
        </div>
      </div>

      {/* Filters Toolbar */}
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
            placeholder="Search by IP address or destination port..."
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Protocol dropdown */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl">
            <Filter className="h-3.5 w-3.5" />
            <span>Protocol:</span>
            <select
              value={protocolFilter}
              onChange={(e) => setProtocolFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-350 font-bold focus:outline-none"
            >
              <option value="ALL">ALL</option>
              <option value="TCP">TCP</option>
              <option value="UDP">UDP</option>
            </select>
          </div>

          {/* Status dropdown */}
          <div className="flex items-center space-x-2 text-xs text-slate-500 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 px-3 py-2 rounded-xl">
            <Filter className="h-3.5 w-3.5" />
            <span>Security Check:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-350 font-bold focus:outline-none"
            >
              <option value="ALL">ALL</option>
              <option value="Normal">Normal Only</option>
              <option value="Flagged">Flagged Only</option>
            </select>
          </div>
        </div>
      </div>

      {/* Packet Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 dark:bg-slate-950 text-slate-500 border-b border-slate-200 dark:border-slate-850">
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Timestamp</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Source IP Address</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Destination IP</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Protocol</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Dest Port</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Length (Bytes)</th>
                <th className="py-4 px-6 font-bold uppercase tracking-wider">Alert Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-850">
              {filteredPackets.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-slate-400 font-medium">
                    No matching packets found in active buffer.
                  </td>
                </tr>
              ) : (
                filteredPackets.map((pkt, idx) => {
                  const isFlagged = pkt.status === 'Flagged';
                  return (
                    <tr
                      key={idx}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-950/40 transition-colors ${
                        isFlagged ? 'bg-red-500/5 hover:bg-red-500/10' : ''
                      }`}
                    >
                      <td className="py-3.5 px-6 font-mono text-slate-400">{pkt.timestamp}</td>
                      <td className="py-3.5 px-6 font-mono font-bold text-slate-700 dark:text-slate-300">{pkt.src_ip}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-700 dark:text-slate-350">{pkt.dst_ip}</td>
                      <td className="py-3.5 px-6 font-mono">
                        <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                          pkt.protocol === 'TCP' ? 'bg-sky-100 dark:bg-sky-950/40 text-sky-500' :
                          pkt.protocol === 'UDP' ? 'bg-indigo-100 dark:bg-indigo-950/40 text-indigo-500' :
                          'bg-slate-200 dark:bg-slate-850 text-slate-500'
                        }`}>
                          {pkt.protocol}
                        </span>
                      </td>
                      <td className="py-3.5 px-6 font-mono text-slate-700 dark:text-slate-300 font-bold">{pkt.port}</td>
                      <td className="py-3.5 px-6 font-mono text-slate-400">{pkt.size} B</td>
                      <td className="py-3.5 px-6">
                        <span className={`px-2.5 py-1 rounded font-bold uppercase tracking-wide text-[10px] ${
                          isFlagged ? 'bg-red-500 text-white' : 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/10'
                        }`}>
                          {pkt.status}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Educational info box */}
      <div className="bg-sky-50 dark:bg-sky-950/15 border border-sky-100 dark:border-sky-900/30 p-4 rounded-xl flex items-start space-x-3 text-xs text-sky-600 dark:text-sky-400">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <div>
          <p className="font-bold">Educational Project Context: Network Sniffing & Scapy</p>
          <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">
            In medical environments, device nodes communicate using network protocols (like Modbus/TCP or DICOM/HL7). 
            MedShield Twin utilizes Scapy to listen on the local network card for active packet transmissions. If Scapy detects 
            attacks or anomalies, they are immediately flagged, logged to SQLite, and stored securely on the ledger.
          </p>
        </div>
      </div>
    </div>
  );
}
