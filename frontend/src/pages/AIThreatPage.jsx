/**
 * AIThreatPage.jsx
 * ----------------
 * Purpose: Visualizes the Machine Learning threat detector and Explainable AI (XAI).
 * Why: Provides an interactive sandbox for security analysts to modify network features
 *      and see the Random Forest output change live, illustrating the decision criteria.
 */

import React, { useState, useEffect } from 'react';
import { Cpu, AlertTriangle, ShieldCheck, ShieldAlert, BarChart3, Info, RefreshCw } from 'lucide-react';

export default function AIThreatPage() {
  // Playground sliders state
  const [packetRate, setPacketRate] = useState(15);
  const [packetSize, setPacketSize] = useState(250);
  const [portEntropy, setPortEntropy] = useState(0.05);
  const [failedLogins, setFailedLogins] = useState(0);
  const [payloadAnomaly, setPayloadAnomaly] = useState(0.05);

  // Prediction output state
  const [prediction, setPrediction] = useState('Normal');
  const [confidence, setConfidence] = useState(100);
  const [threatScore, setThreatScore] = useState(5);
  const [explanation, setExplanation] = useState('');
  const [contributions, setContributions] = useState({});
  const [loading, setLoading] = useState(false);

  // Trigger evaluation from sliders
  const evaluateFeatures = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ml/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          packet_rate: parseFloat(packetRate),
          packet_size_avg: parseFloat(packetSize),
          port_entropy: parseFloat(portEntropy),
          failed_logins: parseInt(failedLogins),
          payload_anomaly: parseFloat(payloadAnomaly)
        })
      });
      const data = await response.json();
      if (response.ok) {
        setPrediction(data.prediction);
        setConfidence(data.confidence);
        setThreatScore(data.threat_score);
        setExplanation(data.explanation);
        setContributions(data.feature_contributions);
      }
    } catch (err) {
      console.error("Error running prediction:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run evaluation whenever sliders change
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      evaluateFeatures();
    }, 250); // debounce API requests by 250ms
    return () => clearTimeout(delayDebounce);
  }, [packetRate, packetSize, portEntropy, failedLogins, payloadAnomaly]);

  // Presets to show quick simulation examples
  const loadPreset = (type) => {
    switch (type) {
      case 'Normal':
        setPacketRate(18);
        setPacketSize(256);
        setPortEntropy(0.08);
        setFailedLogins(0);
        setPayloadAnomaly(0.03);
        break;
      case 'DDoS':
        setPacketRate(1250);
        setPacketSize(80);
        setPortEntropy(0.02);
        setFailedLogins(0);
        setPayloadAnomaly(0.08);
        break;
      case 'PortScan':
        setPacketRate(280);
        setPacketSize(48);
        setPortEntropy(0.95);
        setFailedLogins(0);
        setPayloadAnomaly(0.05);
        break;
      case 'BruteForce':
        setPacketRate(22);
        setPacketSize(192);
        setPortEntropy(0.12);
        setFailedLogins(18);
        setPayloadAnomaly(0.10);
        break;
      case 'Spoofing':
        setPacketRate(35);
        setPacketSize(720);
        setPortEntropy(0.15);
        setFailedLogins(0);
        setPayloadAnomaly(0.88);
        break;
      case 'Botnet':
        setPacketRate(550);
        setPacketSize(1350);
        setPortEntropy(0.45);
        setFailedLogins(1);
        setPayloadAnomaly(0.62);
        break;
      default:
        break;
    }
  };

  // Helper formatting classes
  const getPredictionColor = (pred) => {
    if (pred === 'Normal') return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
    if (pred === 'DDoS' || pred === 'Botnet') return 'text-red-500 bg-red-500/10 border-red-500/20';
    return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">AI Threat Detection Playground</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1">
          Evaluate simulated network telemetry using our trained Random Forest Classifier, backed by Explainable AI.
        </p>
      </div>

      {/* Preset Action Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-4 rounded-2xl shadow-sm">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Load Threat Simulation Presets:</h4>
        <div className="flex flex-wrap gap-2">
          {['Normal', 'DDoS', 'PortScan', 'BruteForce', 'Spoofing', 'Botnet'].map((preset) => (
            <button
              key={preset}
              onClick={() => loadPreset(preset)}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-800 hover:border-sky-500/50 bg-slate-50 dark:bg-slate-950/60 transition-all text-slate-700 dark:text-slate-350 hover:text-sky-500"
            >
              {preset.replace('Scan', ' Scan').replace('Force', ' Force')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Sliders Input Panel */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
            <Cpu className="h-5 w-5 text-sky-500" />
            <span>Interactive Feature Sliders</span>
          </h3>

          <div className="space-y-5">
            {/* Slider 1: Packet Rate */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-400">Packet Rate (packets/sec)</span>
                <span className="font-mono text-sky-500 font-bold">{packetRate} pkts/s</span>
              </div>
              <input
                type="range" min="5" max="2000" step="5"
                value={packetRate}
                onChange={(e) => setPacketRate(e.target.value)}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-slate-400">DDoS flooding usually spikes above 800 packets/sec.</p>
            </div>

            {/* Slider 2: Packet Size */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-400">Average Packet Size (Bytes)</span>
                <span className="font-mono text-sky-500 font-bold">{packetSize} Bytes</span>
              </div>
              <input
                type="range" min="32" max="1500" step="8"
                value={packetSize}
                onChange={(e) => setPacketSize(e.target.value)}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-slate-400">Scans use small headers (32-64B). Data exfiltration uses large sizes (&gt;1000B).</p>
            </div>

            {/* Slider 3: Port Entropy */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-400">Port Entropy (Uniformity rating)</span>
                <span className="font-mono text-sky-500 font-bold">{parseFloat(portEntropy).toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.0" max="1.0" step="0.01"
                value={portEntropy}
                onChange={(e) => setPortEntropy(e.target.value)}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-slate-400">High values (&gt;0.7) represent scanning multiple distinct ports sequentially.</p>
            </div>

            {/* Slider 4: Failed Logins */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-400">Failed Logins (SSH / Web panel)</span>
                <span className="font-mono text-sky-500 font-bold">{failedLogins} Attempts</span>
              </div>
              <input
                type="range" min="0" max="30" step="1"
                value={failedLogins}
                onChange={(e) => setFailedLogins(e.target.value)}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-slate-400">Multiple failed logins (&gt;5) occur during brute force password guesses.</p>
            </div>

            {/* Slider 5: Payload Anomaly */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-400">Payload Anomaly Score</span>
                <span className="font-mono text-sky-500 font-bold">{parseFloat(payloadAnomaly).toFixed(2)}</span>
              </div>
              <input
                type="range" min="0.0" max="1.0" step="0.01"
                value={payloadAnomaly}
                onChange={(e) => setPayloadAnomaly(e.target.value)}
                className="w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <p className="text-[10px] text-slate-400">Elevated ratings indicate weird characters or injection payloads.</p>
            </div>
          </div>
        </div>

        {/* Prediction Outputs Panel */}
        <div className="space-y-8">
          
          {/* Prediction Outcome Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              AI Classifier Prediction
            </h3>

            <div className="flex items-center justify-between p-4 border rounded-xl bg-slate-50 dark:bg-slate-950/40">
              <div>
                <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Threat Diagnosis</p>
                <h4 className="text-2xl font-black mt-1 uppercase tracking-tight text-slate-800 dark:text-white">{prediction}</h4>
              </div>
              <span className={`px-4 py-2 border rounded-xl text-sm font-extrabold flex items-center space-x-1.5 ${getPredictionColor(prediction)}`}>
                {prediction === 'Normal' ? (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    <span>SAFE ({confidence}%)</span>
                  </>
                ) : (
                  <>
                    <ShieldAlert className="h-4 w-4 animate-bounce" />
                    <span>THREAT ({confidence}%)</span>
                  </>
                )}
              </span>
            </div>

            {/* Risk threat score */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500">Intrusion Risk Score:</span>
              <span className={`font-mono font-black text-sm ${threatScore > 50 ? 'text-red-500' : 'text-emerald-500'}`}>
                {threatScore}%
              </span>
            </div>

            {/* Natural language explanation */}
            <div className="p-4 bg-sky-50 dark:bg-sky-950/20 border border-sky-100 dark:border-sky-900/30 rounded-xl flex items-start space-x-3 text-xs">
              <Info className="h-4.5 w-4.5 text-sky-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-sky-700 dark:text-sky-400">Explainable AI (XAI) Justification:</p>
                <p className="mt-1 leading-relaxed text-slate-600 dark:text-slate-400">{explanation}</p>
              </div>
            </div>
          </div>

          {/* Feature Contributions Chart (SHAP-like) */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center space-x-2">
              <BarChart3 className="h-5 w-5 text-sky-500" />
              <span>Feature Contribution Analysis (SHAP-like)</span>
            </h3>

            <div className="space-y-3">
              {Object.entries(contributions).map(([featureName, pct]) => {
                const label = 
                  featureName === 'packet_rate' ? 'Packet Rate' :
                  featureName === 'packet_size_avg' ? 'Packet Size' :
                  featureName === 'port_entropy' ? 'Port Entropy' :
                  featureName === 'failed_logins' ? 'Failed Logins' : 'Payload Anomaly';

                return (
                  <div key={featureName} className="space-y-1 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>{label}</span>
                      <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-200 dark:border-slate-850">
                      <div
                        className="bg-gradient-to-r from-sky-500 to-indigo-600 h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
      
      {/* Model Parameters Box */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl text-xs space-y-2">
        <h4 className="font-bold text-slate-400 uppercase tracking-wider">Model Training Parameters</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2 text-slate-500">
          <div>
            <p>Classifier Type</p>
            <p className="font-bold text-slate-350 mt-0.5">Random Forest (Scikit-Learn)</p>
          </div>
          <div>
            <p>Estimators Count</p>
            <p className="font-bold text-slate-350 mt-0.5">50 Decision Trees</p>
          </div>
          <div>
            <p>Training Set Size</p>
            <p className="font-bold text-slate-350 mt-0.5">2,496 Packets</p>
          </div>
          <div>
            <p>Validation Accuracy</p>
            <p className="font-bold text-emerald-500 mt-0.5">100% Correct</p>
          </div>
        </div>
      </div>
    </div>
  );
}
