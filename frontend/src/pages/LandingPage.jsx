/**
 * LandingPage.jsx
 * ---------------
 * Purpose: Public landing page for the MedShield Twin application.
 * Why: Sets a strong first impression for evaluators, presenting the main objectives
 *      and technical components of the digital twin.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Shield, Activity, Database, Cpu, FileText, Lock, Users, ArrowRight } from 'lucide-react';

export default function LandingPage() {
  // Animation configurations
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.15 } }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-sky-500 selection:text-white">
      {/* --- Navigation Bar --- */}
      <nav className="fixed top-0 left-0 w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-900 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-tr from-sky-500 to-indigo-600 p-2 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-sky-100 to-sky-300 bg-clip-text text-transparent">
              MedShield Twin
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-300">
            <a href="#home" className="hover:text-sky-400 transition-colors">Home</a>
            <a href="#features" className="hover:text-sky-400 transition-colors">Features</a>
            <a href="#about" className="hover:text-sky-400 transition-colors">Digital Twin</a>
            <a href="#security" className="hover:text-sky-400 transition-colors">Cyber Security</a>
          </div>

          <div>
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-medium text-sm transition-all shadow-lg shadow-sky-500/20 hover:shadow-sky-500/35 hover:-translate-y-0.5 inline-flex items-center space-x-2"
            >
              <span>Access System</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* --- Hero Section --- */}
      <section id="home" className="relative pt-32 pb-24 md:pt-40 md:pb-32 px-6 overflow-hidden">
        {/* Decorative Background Gradients */}
        <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 right-10 w-[400px] h-[400px] bg-indigo-600/10 rounded-full blur-3xl" />

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={fadeInUp}
            className="space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full border border-sky-500/30 bg-sky-950/30 text-sky-400 text-xs font-semibold">
              <span className="flex h-2 w-2 rounded-full bg-sky-400 animate-pulse" />
              <span>Enterprise Cybersecurity Console</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Protecting Smart Hospitals using{" "}
              <span className="bg-gradient-to-r from-sky-400 via-indigo-300 to-sky-200 bg-clip-text text-transparent">
                AI, Blockchain & Digital Twins
              </span>
            </h1>
            
            <p className="text-slate-400 text-lg md:text-xl font-normal leading-relaxed max-w-xl mx-auto lg:mx-0">
              Simulate and protect IoMT medical hardware under threat. MedShield Twin uses Random Forest classifiers for real-time attack prediction and SHA-256 Blockchains for tamper-proof audit logs.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <Link
                to="/login"
                className="w-full sm:w-auto px-8 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-semibold text-center transition-all shadow-xl shadow-sky-500/10 hover:shadow-sky-500/25 hover:-translate-y-0.5"
              >
                Log In to Console
              </Link>
              <a
                href="#features"
                className="w-full sm:w-auto px-8 py-4 rounded-xl border border-slate-800 bg-slate-900/40 hover:bg-slate-900 text-slate-300 hover:text-white font-semibold text-center transition-all"
              >
                Explore Modules
              </a>
            </div>
          </motion.div>

          {/* Animated IoMT Nodes Simulator Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8 }}
            className="relative bg-slate-900/50 border border-slate-800 p-6 md:p-8 rounded-3xl backdrop-blur-sm"
          >
            <div className="absolute top-4 left-4 flex space-x-2">
              <div className="w-3 h-3 rounded-full bg-red-500" />
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <div className="w-3 h-3 rounded-full bg-green-500" />
            </div>
            
            <h3 className="text-center text-sm font-semibold text-slate-400 mb-6 uppercase tracking-wider">
              Hospital Network Live Twin Feed
            </h3>
            
            <div className="space-y-4">
              {/* Telemetry Card 1 */}
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <Activity className="h-5 w-5 animate-pulse" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">ICU ECG Monitor</h4>
                    <p className="text-xs text-slate-500">192.168.10.101</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-400">
                    Safe
                  </span>
                  <p className="text-sm font-bold text-slate-300 mt-1">74 BPM</p>
                </div>
              </div>

              {/* Telemetry Card 2 */}
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-red-500/10 text-red-400">
                    <Activity className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Smart Ventilator</h4>
                    <p className="text-xs text-slate-500">192.168.10.102</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-950/50 border border-red-500/30 text-red-400 animate-pulse">
                    DDoS Attack
                  </span>
                  <p className="text-sm font-bold text-slate-300 mt-1">182 BPM</p>
                </div>
              </div>

              {/* Blockchain Node */}
              <div className="bg-slate-950 border border-slate-900 p-4 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Database className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold">Cryptographic Ledger</h4>
                    <p className="text-xs text-slate-500">Block #42 Verified</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded bg-sky-950/50 border border-sky-500/30 text-sky-400">
                    Verified Hash
                  </span>
                  <p className="text-xs font-mono text-slate-400 mt-1">SHA-256: 8a7c...</p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* --- Features Section --- */}
      <section id="features" className="py-24 border-t border-slate-900 bg-slate-900/20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold tracking-tight">
              Advanced Cybersecurity Modules
            </h2>
            <p className="text-slate-400">
              MedShield Twin coordinates multi-layered defensive strategies designed to secure healthcare IoT infrastructures.
            </p>
          </div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {/* Feature 1 */}
            <motion.div variants={fadeInUp} className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl hover:border-sky-500/30 transition-all group">
              <div className="bg-sky-500/10 text-sky-400 p-3.5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Cpu className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mt-6 mb-3">AI Threat Detection</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Utilizes Random Forest classifiers to continuously examine telemetry rates, average sizes, and failed login markers for rapid threat flagging.
              </p>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={fadeInUp} className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl hover:border-sky-500/30 transition-all group">
              <div className="bg-indigo-500/10 text-indigo-400 p-3.5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mt-6 mb-3">Blockchain Integrity</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Appends network metrics and authentication logs to a SHA-256 linked ledger. Identifies and isolates direct database tampering.
              </p>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={fadeInUp} className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl hover:border-sky-500/30 transition-all group">
              <div className="bg-emerald-500/10 text-emerald-400 p-3.5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Activity className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mt-6 mb-3">Hospital Digital Twin</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Visualizes 10 critical clinical spaces with active IoMT markers. Maps threats from Emergency, ICU, and Radiology departments.
              </p>
            </motion.div>

            {/* Feature 4 */}
            <motion.div variants={fadeInUp} className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl hover:border-sky-500/30 transition-all group">
              <div className="bg-amber-500/10 text-amber-400 p-3.5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Database className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mt-6 mb-3">IoMT Packet Monitoring</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Captures and evaluates active network packets to identify DDoS flood vectors, port scans, and command injection attacks.
              </p>
            </motion.div>

            {/* Feature 5 */}
            <motion.div variants={fadeInUp} className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl hover:border-sky-500/30 transition-all group">
              <div className="bg-purple-500/10 text-purple-400 p-3.5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <FileText className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mt-6 mb-3">Forensic PDF Reports</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Generates stylized compliance documents via ReportLab detailing active vulnerabilities, attack timelines, and blockchain hashes.
              </p>
            </motion.div>

            {/* Feature 6 */}
            <motion.div variants={fadeInUp} className="bg-slate-900/40 border border-slate-800 p-8 rounded-2xl hover:border-sky-500/30 transition-all group">
              <div className="bg-rose-500/10 text-rose-400 p-3.5 rounded-xl w-fit group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold mt-6 mb-3">Role-Based Access</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Implements Admin, Security Analyst, and Guest profiles, allowing tailored controls for device management and forensic reporting.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* --- Footer Section --- */}
      <footer className="border-t border-slate-900 bg-slate-950 py-16 px-6">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="space-y-4">
            <h4 className="text-lg font-bold">MedShield Twin</h4>
            <p className="text-slate-500 text-sm leading-relaxed">
              AI-Powered Secure Hospital Digital Twin. Engineered for monitoring and safeguarding smart medical infrastructures under threat.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Core Capabilities</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Real-time Device Monitoring</li>
              <li>Explainable Threat Diagnostics</li>
              <li>Cryptographic Auditing</li>
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-bold mb-4">Project Development</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li>Frameworks: React + Python Flask</li>
              <li>AI Pipeline: Scikit-Learn</li>
              <li>Audit Trail: SHA-256 Ledger</li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-slate-900 text-center text-xs text-slate-600">
          <p>© {new Date().getFullYear()} MedShield Twin. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
}
