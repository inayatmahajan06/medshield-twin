/**
 * DigitalTwinPage.jsx
 * ------------------
 * Purpose: Renders the virtual smart hospital Digital Twin.
 * Why: Serves as the primary visual display for evaluators, mapping clinical locations
 *      to physical sensor data, live IP configurations, and security warning states.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity, ShieldAlert, Wifi, WifiOff, Thermometer,
  Heart, AlertTriangle, Play, HelpCircle, HardDrive, Terminal
} from 'lucide-react';
import { getApiUrl } from '../api/config';

const ROOMS_LIST = [
  { id: "Reception", name: "Reception Desk", desc: "Patient intake & check-in kiosk" },
  { id: "Emergency Room", name: "Emergency Department", desc: "Triage monitoring & sensors" },
  { id: "ICU", name: "Intensive Care Unit (ICU)", desc: "Life support & critical telemetry" },
  { id: "Operation Theatre", name: "Operating Theatre (OT)", desc: "Surgical systems & life-support" },
  { id: "Radiology", name: "Radiology & Imaging", desc: "MRI controller & X-Ray modalities" },
  { id: "Pharmacy", name: "Automated Pharmacy", desc: "Drug dispensing consoles" },
  { id: "Laboratory", name: "Clinical Laboratory", desc: "Blood analysis & analyzers" },
  { id: "General Ward", name: "General Inpatient Ward", desc: "Smart beds & safety telemetry" },
  { id: "Server Room", name: "Hospital Core Server Room", desc: "Medical records database server" },
  { id: "Network Control Room", name: "Network Control Room", desc: "Primary firewall and gateways" }
];

export default function DigitalTwinPage({ user }) {
  const [devices, setDevices] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState("ICU");
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [injectingAttack, setInjectingAttack] = useState(false);
  const [injectStatus, setInjectStatus] = useState("");

  const fetchData = async () => {
    try {
      const devRes = await fetch(getApiUrl('/api/devices'), { credentials: 'include' });
      const devData = await devRes.json();
      setDevices(Array.isArray(devData) ? devData : []);

      const alertRes = await fetch(getApiUrl('/api/alerts?limit=30'), { credentials: 'include' });
      const alertData = await alertRes.json();
      setAlerts(Array.isArray(alertData) ? alertData : []);

      // Keep selected device telemetry fresh by matching ID
      if (selectedDevice && Array.isArray(devData)) {
        const freshDev = devData.find(d => d.id === selectedDevice.id);
        if (freshDev) setSelectedDevice(freshDev);
      }
    } catch (err) {
      console.error("Error fetching twin data:", err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 2000); // 2 second polling for live telemetry
    return () => clearInterval(interval);
  }, [selectedDevice]);

  // Determine a room's safety status based on devices inside it
  const getRoomStatus = (roomName) => {
    const roomDevices = devices.filter(d => d.room === roomName);
    if (roomDevices.length === 0) return "Empty";
    
    if (roomDevices.some(d => d.status === "Under Attack")) return "Under Attack";
    if (roomDevices.some(d => d.status === "Offline")) return "Offline";
    if (roomDevices.some(d => d.status === "Maintenance")) return "Maintenance";
    return "Safe";
  };

  // Helper to get status colors
  const getStatusClasses = (status) => {
    switch (status) {
      case "Under Attack":
        return "border-red-500 bg-red-50/50 dark:bg-red-950/15 text-red-500 shadow-lg shadow-red-500/10 dark:shadow-red-500/5 ring-1 ring-red-500/30";
      case "Offline":
        return "border-slate-300 bg-slate-50 dark:bg-slate-900/40 text-slate-400 border-dashed";
      case "Maintenance":
        return "border-amber-400 bg-amber-50 dark:bg-amber-950/15 text-amber-500";
      case "Safe":
      case "Online":
        return "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/10 text-emerald-500";
      default:
        return "border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-400";
    }
  };

  // Inject attack simulator helper
  const handleInjectAttack = async (attackType) => {
    if (!selectedDevice) return;
    setInjectingAttack(true);
    setInjectStatus("Injecting payload...");
    
    try {
      const response = await fetch(getApiUrl('/api/simulation/start-attack'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          device_id: selectedDevice.id,
          attack_type: attackType
        })
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setInjectStatus(`Success: Simulated ${attackType} active.`);
        setTimeout(() => setInjectStatus(""), 4000);
      } else {
        setInjectStatus(`Failed: ${data.message}`);
      }
    } catch (err) {
      setInjectStatus("Connection error. Check Flask server.");
    } finally {
      setInjectingAttack(false);
    }
  };

  const selectedRoomDevices = devices.filter(d => d.room === selectedRoom);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Hospital Digital Twin Grid</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Select physical locations to inspect telemetry metrics, MAC registers, and inject attacks.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Virtual Room Layout (Left Column - Spans 2 cols) */}
        <div className="xl:col-span-2 space-y-6">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center space-x-2">
            <Activity className="h-5 w-5 text-sky-500" />
            <span>Smart Hospital Floor Map</span>
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROOMS_LIST.map((room) => {
              const roomStatus = getRoomStatus(room.id);
              const roomDevices = devices.filter(d => d.room === room.id);
              
              return (
                <div
                  key={room.id}
                  onClick={() => {
                    setSelectedRoom(room.id);
                    setSelectedDevice(null);
                  }}
                  className={`p-5 rounded-2xl border transition-all cursor-pointer select-none relative group ${
                    selectedRoom === room.id ? 'ring-2 ring-sky-500 scale-[1.02]' : 'hover:scale-[1.01]'
                  } ${getStatusClasses(roomStatus)}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-extrabold text-sm tracking-tight text-slate-800 dark:text-slate-200">
                        {room.name}
                      </h4>
                      <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-1 max-w-[170px] leading-tight">
                        {room.desc}
                      </p>
                    </div>
                    
                    {/* Status badge */}
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full shrink-0">
                      {roomStatus}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>IoMT Hardware:</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300">
                      {roomDevices.length} Connected
                    </span>
                  </div>
                  
                  {/* Glowing alert ring for attacks */}
                  {roomStatus === "Under Attack" && (
                    <div className="absolute -inset-0.5 rounded-2xl border border-red-500 animate-pulse-red pointer-events-none" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Room Devices and Inspector (Right Column) */}
        <div className="space-y-6">
          
          {/* Room Devices List */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Devices in <span className="text-sky-500">{selectedRoom}</span>
            </h3>

            <div className="space-y-3">
              {selectedRoomDevices.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">No devices mapped in this ward.</p>
              ) : (
                selectedRoomDevices.map((device) => {
                  const statusDotColor = 
                    device.status === 'Online' || device.status === 'Safe' ? 'bg-emerald-500' :
                    device.status === 'Under Attack' ? 'bg-red-500 animate-ping' :
                    device.status === 'Offline' ? 'bg-slate-400' : 'bg-amber-400';

                  return (
                    <div
                      key={device.id}
                      onClick={() => setSelectedDevice(device)}
                      className={`p-3 rounded-xl border border-slate-100 dark:border-slate-800/60 bg-slate-50 dark:bg-slate-950/40 hover:bg-slate-100 dark:hover:bg-slate-900 cursor-pointer flex items-center justify-between transition-all ${
                        selectedDevice?.id === device.id ? 'ring-1 ring-sky-500 bg-sky-500/5 border-transparent' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`h-2.5 w-2.5 rounded-full ${statusDotColor}`} />
                        <div>
                          <p className="text-xs font-bold text-slate-700 dark:text-slate-350">{device.name}</p>
                          <p className="text-[10px] text-slate-400">{device.id}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400">{device.ip_address}</span>
                        {device.status === 'Under Attack' && (
                          <p className="text-[9px] font-black text-red-500 mt-0.5 animate-pulse uppercase">ATTACK</p>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Device Inspector Detail Pane */}
          {selectedDevice ? (
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-5 relative overflow-hidden">
              <div className="flex items-start justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                <div>
                  <span className="text-[9px] font-black uppercase text-sky-500 tracking-wider">Device Inspector</span>
                  <h3 className="text-base font-extrabold text-slate-900 dark:text-white mt-1">{selectedDevice.name}</h3>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{selectedDevice.id}</p>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                  selectedDevice.status === 'Online' || selectedDevice.status === 'Safe' ? 'bg-emerald-500/10 text-emerald-500' :
                  selectedDevice.status === 'Under Attack' ? 'bg-red-500/15 text-red-500 animate-pulse' :
                  selectedDevice.status === 'Offline' ? 'bg-slate-400/15 text-slate-500' : 'bg-amber-400/10 text-amber-500'
                }`}>
                  {selectedDevice.status}
                </span>
              </div>

              {/* Physical Clinical Telemetry */}
              {selectedDevice.status !== "Offline" && (
                <div className="grid grid-cols-3 gap-2">
                  {/* Telemetry 1: Heart Rate */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
                    <Heart className="h-4 w-4 text-red-500 mx-auto animate-pulse" />
                    <p className="text-[10px] text-slate-500 mt-2">Heart Rate</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">{selectedDevice.heart_rate} BPM</p>
                  </div>
                  {/* Telemetry 2: Temp */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
                    <Thermometer className="h-4 w-4 text-sky-500 mx-auto" />
                    <p className="text-[10px] text-slate-500 mt-2">Temperature</p>
                    <p className="text-sm font-black text-slate-800 dark:text-slate-200 mt-1">{selectedDevice.temperature}°C</p>
                  </div>
                  {/* Telemetry 3: BP */}
                  <div className="bg-slate-50 dark:bg-slate-950 p-3 rounded-xl border border-slate-100 dark:border-slate-850 text-center">
                    <Activity className="h-4 w-4 text-indigo-500 mx-auto" />
                    <p className="text-[10px] text-slate-500 mt-2">Blood Press.</p>
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 mt-2 leading-none">{selectedDevice.blood_pressure}</p>
                  </div>
                </div>
              )}

              {/* Technical Specifications list */}
              <div className="space-y-2 text-xs">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Technical Registry</h4>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-1">
                  <span className="text-slate-500">IP Address:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedDevice.ip_address}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-1">
                  <span className="text-slate-500">MAC Registry:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedDevice.mac_address}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-1">
                  <span className="text-slate-500">Firmware Build:</span>
                  <span className="font-mono text-slate-700 dark:text-slate-300">{selectedDevice.firmware_version}</span>
                </div>
                <div className="flex justify-between border-b border-slate-50 dark:border-slate-850 pb-1">
                  <span className="text-slate-500">Connected Since:</span>
                  <span className="text-slate-700 dark:text-slate-300">{selectedDevice.connected_since}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Threat Vulnerability:</span>
                  <span className={`font-bold ${
                    selectedDevice.risk_score > 60 ? 'text-red-500' :
                    selectedDevice.risk_score > 25 ? 'text-orange-500' :
                    'text-emerald-500'
                  }`}>{selectedDevice.risk_score}%</span>
                </div>
              </div>

              {/* Simulation Attack Injector (Admin and Analyst only) */}
              {user.role !== 'Guest' && selectedDevice.status !== 'Offline' && (
                <div className="border-t border-slate-100 dark:border-slate-850 pt-4 space-y-3">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                    <Terminal className="h-3 w-3 text-red-500" />
                    <span>Attack Injection Simulation console</span>
                  </h4>
                  
                  {injectStatus && (
                    <div className="bg-slate-950 text-sky-400 font-mono text-[10px] p-2 rounded border border-slate-850">
                      {injectStatus}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleInjectAttack("DDoS")}
                      disabled={injectingAttack}
                      className="px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                    >
                      <Play className="h-3 w-3 shrink-0" />
                      <span>Inject DDoS</span>
                    </button>
                    <button
                      onClick={() => handleInjectAttack("Spoofing")}
                      disabled={injectingAttack}
                      className="px-3 py-2 rounded-lg bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs transition-colors flex items-center justify-center space-x-1"
                    >
                      <Play className="h-3 w-3 shrink-0" />
                      <span>Inject Spoofing</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-12 rounded-2xl text-center text-slate-400">
              <HelpCircle className="h-10 w-10 mx-auto text-slate-350 dark:text-slate-700" />
              <p className="text-xs mt-3">Select a device from the list above to audit hardware logs and check live telemetry feeds.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
