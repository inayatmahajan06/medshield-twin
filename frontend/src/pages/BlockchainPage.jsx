/**
 * BlockchainPage.jsx
 * ------------------
 * Purpose: Visualizes the educational blockchain ledger.
 * Why: Demonstrates how historical logs (patient updates, cyber alerts) can be protected
 *      against tampering. Lets administrators simulate tampering with records directly in SQLite and audit the chain.
 */

import React, { useState, useEffect } from 'react';
import { Database, ShieldCheck, ShieldAlert, Edit3, Check, RefreshCw, Link2, Info } from 'lucide-react';
import { getApiUrl } from '../api/config';

export default function BlockchainPage({ user }) {
  const [chain, setChain] = useState([]);
  const [auditResult, setAuditResult] = useState(null);
  const [auditing, setAuditing] = useState(false);

  // Tamper form state
  const [tamperIndex, setTamperIndex] = useState(1);
  const [tamperData, setTamperData] = useState('Patient records modified: Critical status deleted.');
  const [tampering, setTampering] = useState(false);
  const [tamperStatus, setTamperStatus] = useState('');

  const fetchBlockchain = async () => {
    try {
      const response = await fetch(getApiUrl('/api/blockchain'), { credentials: 'include' });
      const data = await response.json();
      setChain(Array.isArray(data) ? data : []);
      
      // Auto-run integrity check
      const verifyRes = await fetch(getApiUrl('/api/blockchain/verify'), { credentials: 'include' });
      const verifyData = await verifyRes.json();
      setAuditResult(verifyData);
    } catch (err) {
      console.error("Error fetching blockchain:", err);
    }
  };

  useEffect(() => {
    fetchBlockchain();
  }, []);

  const handleVerify = async () => {
    setAuditing(true);
    try {
      const verifyRes = await fetch(getApiUrl('/api/blockchain/verify'), { credentials: 'include' });
      const verifyData = await verifyRes.json();
      setAuditResult(verifyData);
    } catch (err) {
      console.error(err);
    } finally {
      setAuditing(false);
    }
  };

  const handleTamper = async (e) => {
    e.preventDefault();
    if (user.role === 'Guest') {
      alert("Permission Denied: Guests cannot access tamper tools.");
      return;
    }
    
    setTampering(true);
    setTamperStatus("Writing corrupt block directly to SQL...");
    
    try {
      const response = await fetch(getApiUrl('/api/blockchain/tamper'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          block_index: parseInt(tamperIndex),
          data: tamperData
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setTamperStatus(`Corrupted Block #${tamperIndex} in SQLite successfully!`);
        fetchBlockchain(); // Refresh
      } else {
        setTamperStatus(`Tampering failed: ${data.message}`);
      }
    } catch (err) {
      setTamperStatus("Connection error. Check Flask server.");
    } finally {
      setTampering(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Cryptographic Blockchain Ledger</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          A secure, sequential database where medical events and security updates are sealed via SHA-256 links.
        </p>
      </div>

      {/* Integrity Audit Banner */}
      {auditResult && (
        <div className={`p-5 rounded-2xl border ${
          auditResult.status === 'Valid'
            ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-500 shadow-emerald-500/5 shadow-lg'
            : 'bg-red-500/15 border-red-500/30 text-red-500 animate-pulse-red'
        } flex flex-col md:flex-row items-start md:items-center justify-between gap-4`}>
          <div className="flex items-start space-x-3 text-xs md:text-sm">
            {auditResult.status === 'Valid' ? (
              <ShieldCheck className="h-6 w-6 shrink-0 text-emerald-500" />
            ) : (
              <ShieldAlert className="h-6 w-6 shrink-0 text-red-500" />
            )}
            <div>
              <p className="font-extrabold uppercase">
                {auditResult.status === 'Valid' ? 'Blockchain Integrity Verified' : 'CRITICAL ALERT: Blockchain Integrity Failed!'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                {auditResult.status === 'Valid'
                  ? 'All SHA-256 blocks are properly chained. Historical clinical records are secure against tampering.'
                  : `Detection audit reports database tampering! Links broken: ${auditResult.errors.join(', ')}`}
              </p>
            </div>
          </div>
          <button
            onClick={handleVerify}
            disabled={auditing}
            className={`px-4 py-2.5 rounded-xl border text-xs font-bold shrink-0 transition-colors flex items-center space-x-2 ${
              auditResult.status === 'Valid'
                ? 'bg-emerald-500 text-white border-transparent hover:bg-emerald-600'
                : 'bg-red-600 text-white border-transparent hover:bg-red-500'
            }`}
          >
            <RefreshCw className={`h-4 w-4 ${auditing ? 'animate-spin' : ''}`} />
            <span>{auditing ? 'Verifying...' : 'Audit Ledger Integrity'}</span>
          </button>
        </div>
      )}

      {/* Split Page Layout: Chain display on left, Tamper console on right */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Visual Blockchain Cards (Left Column - Spans 2) */}
        <div className="xl:col-span-2 space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Database className="h-5 w-5 text-sky-500" />
            <span>Chained Ledgers Sequence</span>
          </h3>

          <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2">
            {chain.map((block, idx) => {
              const isCompromised = auditResult?.errors.some(err => err.includes(`Block ${block.index}`));
              
              return (
                <div key={block.index} className="relative">
                  {/* Visual chain links connecting blocks */}
                  {idx > 0 && (
                    <div className="absolute -top-6 left-8 flex flex-col items-center space-y-0.5">
                      <Link2 className="h-4 w-4 text-sky-500/40 rotate-90" />
                    </div>
                  )}

                  <div className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border shadow-sm space-y-3 transition-colors ${
                    isCompromised
                      ? 'border-red-500 shadow-lg shadow-red-500/5'
                      : 'border-slate-200 dark:border-slate-850'
                  }`}>
                    {/* Block Info Header */}
                    <div className="flex items-center justify-between text-xs border-b border-slate-100 dark:border-slate-850 pb-2">
                      <span className="font-extrabold text-sky-500">BLOCK INDEX #{block.index}</span>
                      <span className="text-slate-400">{block.timestamp}</span>
                    </div>

                    {/* Block Event Payload */}
                    <div className="space-y-1 text-xs">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Stored Event Payload:</span>
                      <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 font-mono text-slate-700 dark:text-slate-300">
                        {typeof block.data === 'object' ? JSON.stringify(block.data, null, 2) : block.data}
                      </div>
                    </div>

                    {/* Hashes Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10px] font-mono">
                      <div className="space-y-1">
                        <span className="text-slate-400">PREVIOUS BLOCK HASH:</span>
                        <p className="text-slate-700 dark:text-slate-400 break-all select-all font-semibold">
                          {block.previous_hash}
                        </p>
                      </div>
                      <div className="space-y-1">
                        <span className="text-slate-400">CURRENT BLOCK HASH:</span>
                        <p className="text-sky-500 break-all select-all font-bold">
                          {block.hash}
                        </p>
                      </div>
                    </div>

                    {/* Signature */}
                    <div className="flex items-center justify-between text-[10px] bg-slate-100/50 dark:bg-slate-950/40 p-2 rounded-lg border border-slate-200 dark:border-slate-850 font-mono">
                      <span className="text-slate-400 font-sans">Digital Signature Verification:</span>
                      <span className="text-sky-400 font-bold uppercase">{block.signature}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Database Tamper sandbox (Right Column) */}
        <div className="space-y-6">
          
          {/* Tamper Card Console */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <Edit3 className="h-5 w-5 text-red-500 animate-pulse" />
              <span>Database SQL Tampering Simulator</span>
            </h3>

            {user.role === 'Guest' ? (
              <p className="text-slate-400 text-xs text-center py-6">Access Denied: Guests cannot modify SQLite databases.</p>
            ) : (
              <form onSubmit={handleTamper} className="space-y-4 text-xs">
                
                {tamperStatus && (
                  <div className="bg-slate-950 text-indigo-400 font-mono text-[10px] p-2.5 rounded border border-slate-850">
                    {tamperStatus}
                  </div>
                )}

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Select Target Block to Mutate:</label>
                  <select
                    value={tamperIndex}
                    onChange={(e) => setTamperIndex(e.target.value)}
                    className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-350 focus:outline-none"
                  >
                    {chain.filter(b => b.index > 0).map(b => (
                      <option key={b.index} value={b.index}>Block #{b.index} ({typeof b.data === 'object' ? b.data.event_type : b.data.substring(0, 20)})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-400 font-bold uppercase tracking-wider mb-2">Inject Modified Block Data:</label>
                  <textarea
                    required
                    rows={4}
                    value={tamperData}
                    onChange={(e) => setTamperData(e.target.value)}
                    className="w-full py-2.5 px-3 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-850 dark:text-white focus:outline-none focus:ring-1 focus:ring-red-500 font-mono"
                    placeholder="Enter modified text payload..."
                  />
                </div>

                <button
                  type="submit"
                  disabled={tampering}
                  className="w-full flex justify-center py-3 rounded-xl shadow-sm font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500"
                >
                  {tampering ? 'Tampering Database...' : 'Tamper Block SQLite Record'}
                </button>
              </form>
            )}
          </div>

          {/* Hashing explanation box */}
          <div className="bg-sky-50 dark:bg-sky-950/15 border border-sky-100 dark:border-sky-900/30 p-5 rounded-2xl flex items-start space-x-3 text-xs text-sky-600 dark:text-sky-400 leading-relaxed shadow-sm">
            <Info className="h-5 w-5 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h4 className="font-extrabold">Why Hashing Defeats Tampering</h4>
              <p className="text-slate-600 dark:text-slate-400">
                1. <b>Cryptographic Linking:</b> Every block stores the SHA-256 hash value of the block directly preceding it in the ledger chain.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                2. <b>The Avalanche Effect:</b> If an attacker modifies the SQLite record for Block #2, the calculated hash of Block #2 changes completely.
              </p>
              <p className="text-slate-600 dark:text-slate-400">
                3. <b>Broken Chain:</b> Because Block #3 references Block #2's original hash in <i>previous_hash</i>, the link breaks. The audit instantly catches the manipulation!
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
