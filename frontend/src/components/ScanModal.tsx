import React from 'react';
import { X, Search, RefreshCw, Zap, Shield, ZapOff, Activity, Terminal, Info, Cpu, Server, FileCode } from 'lucide-react';

interface ScanModalProps {
  show: boolean;
  onClose: () => void;
  targetIP: string;
  setTargetIP: (ip: string) => void;
  scanIntensity: string;
  setScanIntensity: (intensity: string) => void;
  SCAN_INTENSITIES: Record<string, string>;
  isScanning: boolean;
  triggerNetworkScan: () => void;
}

export default function ScanModal({
  show, onClose, targetIP, setTargetIP, scanIntensity, setScanIntensity,
  SCAN_INTENSITIES, isScanning, triggerNetworkScan
}: ScanModalProps) {
  if (!show) return null;

  const currentFlags = SCAN_INTENSITIES[scanIntensity] || "";

  const intensityProfiles: Record<string, { label: string, desc: string, icon: any }> = {
    'fast': { label: 'Fast Discovery', desc: 'Minimal footprint, top 100 ports only.', icon: ZapOff },
    'deep': { label: 'Deep Scan', desc: 'Full port inspection with OS/Service detection.', icon: Server },
    'stealth': { label: 'Stealth Audit', desc: 'SYN scan with OS evasion techniques.', icon: Shield },
    'ping_sweep': { label: 'Ping Sweep', desc: 'Host discovery without port scanning.', icon: Activity },
    'os_detection': { label: 'OS Fingerprint', desc: 'Deduce OS version via TCP/IP stack.', icon: Cpu },
    'aggressive': { label: 'Aggressive', desc: 'Full inspection, scripts & vuln scan.', icon: Zap },
    'script_audit': { label: 'Script Audit', desc: 'NSE scripts for auth and discovery.', icon: FileCode }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md transition-all duration-300" onClick={onClose}></div>
      <div className="relative bg-slate-900 border border-slate-700/50 rounded-3xl w-full max-w-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in zoom-in-95 duration-200">

        {/* Modal Header */}
        <div className="px-8 py-6 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/20">
              <Terminal className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white tracking-widest uppercase">New Scan</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5 opacity-60 italic text-left">Configure Scan Parameters</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-xl transition-all text-slate-500 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-8 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* Target Input */}
          <div className="space-y-3">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1 flex items-center">
              Target Network Range
            </label>
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                <Search className="w-4 h-4 text-slate-600 group-focus-within:text-cyan-500 transition-colors" />
              </div>
              <input
                type="text"
                value={targetIP}
                onChange={(e) => setTargetIP(e.target.value)}
                placeholder="e.g., 192.168.1.0/24"
                className="block w-full pl-12 pr-6 py-4 bg-slate-950/50 border border-slate-800 rounded-2xl focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500/50 text-slate-200 placeholder-slate-700 transition-all font-mono text-base"
              />
            </div>
          </div>

          {/* Premium Intensity Select */}
          <div className="space-y-4">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] ml-1">
              Select Scan Profile
            </label>
            <div className="grid grid-cols-2 gap-3">
              {Object.keys(intensityProfiles).map(key => {
                const ProfileIcon = intensityProfiles[key].icon;
                return (
                  <button
                    key={key}
                    onClick={() => setScanIntensity(key)}
                    className={`flex flex-col items-start p-5 rounded-2xl border transition-all text-left relative group overflow-hidden ${scanIntensity === key
                      ? 'bg-cyan-500/10 border-cyan-500/40 shadow-[0_0_20px_rgba(34,211,238,0.1)]'
                      : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                      }`}
                  >
                    <div className={`p-2 rounded-lg mb-3 ${scanIntensity === key ? 'bg-cyan-500/20 text-cyan-400' : 'bg-slate-900 text-slate-600 group-hover:text-slate-400'}`}>
                      <ProfileIcon className="w-4 h-4" />
                    </div>
                    <span className={`text-[11px] font-black uppercase tracking-widest mb-1 ${scanIntensity === key ? 'text-cyan-300' : 'text-slate-300'}`}>
                      {intensityProfiles[key].label}
                    </span>
                    <p className="text-[10px] text-slate-500 leading-relaxed line-clamp-2">
                      {intensityProfiles[key].desc}
                    </p>
                    {scanIntensity === key && (
                      <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-cyan-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Command Preview Panel */}
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.2em] flex items-center">
                <Terminal className="w-3.5 h-3.5 mr-2 text-cyan-500/70" /> Executable Command
              </label>
              <div className="flex items-center text-[9px] text-slate-600 font-bold uppercase tracking-widest">
                <Info className="w-3 h-3 mr-1 opacity-50" /> Native Nmap Output
              </div>
            </div>
            <div className="bg-black/60 border border-slate-800 p-5 rounded-2xl font-mono text-sm relative group overflow-hidden">
              <div className="absolute top-0 left-0 w-1 h-full bg-cyan-500/30"></div>
              <div className="flex items-start">
                <span className="text-cyan-500/40 select-none mr-4">$</span>
                <code className="text-slate-300 break-all leading-relaxed whitespace-pre-wrap">
                  <span className="text-emerald-400 font-bold">nmap</span>{' '}
                  <span className="text-blue-400">{currentFlags}</span>{' '}
                  <span className="text-cyan-400 font-black">{targetIP || '[IP_REQUIRED]'}</span>
                </code>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-8 py-6 bg-slate-950/40 border-t border-slate-800 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-6 py-3.5 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-white transition-colors"
          >
            Cancel Scan
          </button>
          <button
            onClick={() => {
              triggerNetworkScan();
              onClose();
            }}
            disabled={isScanning || !targetIP}
            className={`px-10 py-3.5 rounded-2xl font-black text-xs uppercase tracking-[0.25em] transition-all transform active:scale-95 shadow-xl flex items-center space-x-3
              ${isScanning || !targetIP
                ? 'bg-slate-800 text-slate-600 cursor-not-allowed border border-slate-700 opacity-50'
                : 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white border border-white/10 shadow-blue-500/40'}`}
          >
            {isScanning ? <RefreshCw className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />}
            <span>Start Scan</span>
          </button>
        </div>
      </div>
    </div>
  );
}
