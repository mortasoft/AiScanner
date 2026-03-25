import React from 'react';
import { ChevronLeft, RefreshCw, Terminal, Globe, Cpu, Hash, AlertTriangle } from 'lucide-react';

interface NetworkDetailsProps {
  selectedScanId: string;
  scanHistory: any[];
  scanStatus: string;
  devices: any[];
  setSelectedScanId: (id: string | null) => void;
  copyToClipboard: (text: string) => void;
  SCAN_INTENSITIES: Record<string, string>;
  scanIntensity: string;
}

export default function NetworkDetails({
  selectedScanId, scanHistory, scanStatus, devices, setSelectedScanId,
  copyToClipboard, SCAN_INTENSITIES, scanIntensity
}: NetworkDetailsProps) {
  const currentScan = scanHistory.find(s => s.id === selectedScanId);
  const nmapCommand = currentScan ? `nmap ${SCAN_INTENSITIES[scanIntensity] || '-F'} ${currentScan.target}` : '';

  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-4 animate-in fade-in duration-500">
      {/* Detail Header / Nav */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setSelectedScanId(null)}
          className="flex items-center space-x-2 text-slate-400 hover:text-cyan-400 transition-colors group"
        >
          <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
          <span className="text-xs font-bold uppercase tracking-widest">Return to scan history</span>
        </button>
        <div className="flex items-center space-x-3">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">
            Audit ID: <span className="text-cyan-400 font-mono">{selectedScanId.slice(0, 8)}</span>
          </span>
        </div>
      </div>

      {/* Command Preview */}
      <div className="bg-slate-950/80 border border-slate-800 p-4 rounded-xl flex items-center justify-between group">
        <div className="flex items-center space-x-4">
          <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
            <Terminal className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-xs font-mono text-slate-300 truncate max-w-lg">
            <span className="text-cyan-600 mr-2">aura@cgr:~$</span>
            {nmapCommand}
          </p>
        </div>
        <button
          onClick={() => copyToClipboard(nmapCommand)}
          className="text-[10px] font-bold text-cyan-400 hover:text-cyan-300 uppercase tracking-wider px-3 py-1.5 bg-cyan-500/10 rounded-lg border border-cyan-500/20 active:scale-95 transition-all"
        >
          Copy Payload
        </button>
      </div>

      {/* Audit Stats Board */}
      {currentScan && (
        <div className={`p-5 border rounded-2xl flex items-center justify-between backdrop-blur-md shadow-lg
          ${(scanStatus || currentScan.status) === 'running' || (scanStatus || currentScan.status) === 'queued' ? 'bg-blue-500/5 border-blue-500/20 shadow-blue-500/10' :
            (scanStatus || currentScan.status) === 'completed' ? 'bg-emerald-500/5 border-emerald-500/20 shadow-emerald-500/10' :
              (scanStatus || currentScan.status) === 'error' ? 'bg-red-500/5 border-red-500/20 shadow-red-500/10' : 'bg-slate-900/60 border-slate-800 shadow-xl'}`}
        >
          <div className="flex-1">
            <p className="text-sm font-bold text-white mb-2 tracking-tight">
              {(scanStatus || currentScan.status) === 'queued' && '⏳ Audit queued. Waiting for core allocation...'}
              {(scanStatus || currentScan.status) === 'running' && '📡 Initializing multi-vector discovery. Live infrastructure monitoring enabled.'}
              {(scanStatus || currentScan.status) === 'completed' && '✅ Forensic reconstruction finalized. Results retrieved from historical archives.'}
              {(scanStatus || currentScan.status) === 'error' && '❌ Technical failure in core discovery engine. Check network permissions.'}
              {!scanStatus && !currentScan.status && '⚡ Synchronizing with backend subsystem...'}
            </p>
            <div className="flex space-x-6 text-[10px] text-slate-500 uppercase font-black tracking-[0.2em]">
              <div className="flex items-center"><RefreshCw className={`w-3 h-3 mr-2 ${(scanStatus || currentScan.status) === 'running' ? 'animate-spin text-blue-400' : 'text-slate-600'}`} /><span>Runtime: <span className="text-cyan-400 font-mono italic">{currentScan.duration || '--'}</span></span></div>
              <div className="flex items-center"><Hash className="w-3 h-3 mr-2 text-slate-600" /><span>Nodes: <span className="text-cyan-400 font-mono italic">{currentScan.hosts_found}</span></span></div>
              <div className="flex items-center"><Globe className="w-3 h-3 mr-2 text-slate-600" /><span>Target: <span className="text-cyan-400 font-mono italic">{currentScan.target}</span></span></div>
            </div>
          </div>
        </div>
      )}

      {/* Target Results Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0 shadow-2xl relative">
        {(scanStatus === 'running' || scanStatus === 'queued' || (!scanStatus && devices.length === 0)) ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <div className="relative mb-6">
              <div className="absolute -inset-4 bg-cyan-500/10 rounded-full blur-xl animate-pulse"></div>
              <RefreshCw className="w-12 h-12 animate-spin text-cyan-500 relative z-10" />
            </div>
            <p className="text-[11px] font-black uppercase tracking-[0.3em] text-cyan-400/60">
              {scanStatus === 'running' ? 'Intercepting Packets...' : 'Syncing Archives...'}
            </p>
          </div>
        ) : devices.length > 0 ? (
          <div className="flex-1 overflow-auto">
            <table className="w-full text-left text-sm border-separate border-spacing-0">
              <thead className="bg-slate-950/50 text-slate-500 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                <tr>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Identified IP</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Signature Status</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]"><Cpu className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />Operating System</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px]">Open Ports Detected</th>
                  <th className="px-6 py-4 font-black uppercase tracking-widest text-[10px] text-right">Hardware MAC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/30">
                {devices.map((target, i) => (
                  <tr key={i} className="hover:bg-slate-800/40 transition-all border-l-2 border-transparent hover:border-emerald-500">
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)]"></div>
                        <span className="font-mono text-cyan-400 font-black tracking-tighter text-sm">{target.ip}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase italic">
                        Verified UP
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-300 font-bold text-xs">{target.os}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs italic opacity-80">{target.ports}</td>
                    <td className="px-6 py-4 text-right font-mono text-[10px] text-slate-500 font-bold">{target.mac}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500 px-6 text-center">
            <AlertTriangle className="w-12 h-12 text-slate-800 mb-4" />
            <p className="font-bold uppercase tracking-[0.2em] text-xs opacity-50 mb-2">Zero Active Nodes Found</p>
            <p className="max-w-xs text-[10px] text-slate-600 font-medium">Nmap scan reported zero alive hosts in this range. Check subnet mask or bypass firewalls using aggressive profile.</p>
          </div>
        )}
      </div>
    </div>
  );
}
