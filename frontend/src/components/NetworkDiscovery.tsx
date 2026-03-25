import { RefreshCw, Trash2, ChevronLeft, ChevronRight, Server, Network, Play, Eye, Shield, Zap, Cpu, Activity, ZapOff, FileCode } from 'lucide-react';
import React from 'react';

const INTENSITY_LABELS: Record<string, string> = {
  'fast': 'Fast Discovery',
  'deep': 'Deep Scan',
  'stealth': 'Stealth Audit',
  'ping_sweep': 'Ping Sweep',
  'os_detection': 'OS Fingerprint',
  'aggressive': 'Aggressive',
  'script_audit': 'Script Audit'
};

interface NetworkDiscoveryProps {
  scanHistory: any[];
  totalScans: number;
  currentPage: number;
  setCurrentPage: React.Dispatch<React.SetStateAction<number>>;
  totalPages: number;
  pageSize: number;
  setSelectedScanId: (id: string | null) => void;
  deleteSingleScan: (id: string) => void;
  setShowScanModal: (show: boolean) => void;
  triggerNetworkScan: (target?: string, intensity?: string) => void;
  isScanning: boolean;
}

export default function NetworkDiscovery({
  scanHistory, totalScans, currentPage,
  setCurrentPage, totalPages, pageSize, setSelectedScanId, deleteSingleScan,
  setShowScanModal, triggerNetworkScan, isScanning
}: NetworkDiscoveryProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0 space-y-6 animate-in fade-in duration-500">
      {/* Search & Action Bar - MODIFIED TO MODAL TRIGGER */}
      <div className="flex items-center justify-between bg-slate-900/40 border border-slate-800 p-6 rounded-2xl backdrop-blur-sm shadow-xl">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-cyan-500/10 rounded-xl border border-cyan-500/20 shadow-[0_0_15px_rgba(6,182,212,0.1)]">
            <Network className="w-6 h-6 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-black text-white tracking-widest uppercase mb-1">Network Discovery</h1>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest opacity-60 italic">Launch multi-vector scans on target mesh</p>
          </div>
        </div>

        <button
          onClick={() => setShowScanModal(true)}
          className="px-8 py-3.5 bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white rounded-xl font-black text-xs uppercase tracking-[0.2em] transition-all transform active:scale-95 shadow-lg shadow-blue-500/20 border border-blue-400/20 flex items-center space-x-3 group"
        >
          <RefreshCw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-700" />
          <span>New Scan</span>
        </button>
      </div>

      {/* Audit History Table */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex-1 flex flex-col min-h-0 shadow-2xl">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 transition-colors">
          <h2 className="text-sm font-bold text-white uppercase tracking-[0.2em] flex items-center">
            <span className="w-2 h-2 bg-cyan-500 rounded-full mr-3 shadow-[0_0_8px_rgba(6,182,212,0.8)] animate-pulse"></span>
            Scan History
          </h2>
          <div className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Last <span className="text-cyan-400 font-mono">10</span> Tasks
          </div>
        </div>

        {scanHistory.length > 0 ? (
          <>
            <div className="flex-1 overflow-auto">
              <table className="w-full text-left text-sm border-separate border-spacing-0">
                <thead className="bg-slate-950/50 text-slate-500 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
                  <tr>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Audit Target</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">Scan Status</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px]">System Yield</th>
                    <th className="px-6 py-4 font-bold uppercase tracking-widest text-[10px] text-right">Utility</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/30">
                  {scanHistory.map((scan, i) => (
                    <tr
                      key={i}
                      className="hover:bg-slate-800/40 transition-all cursor-pointer group border-l-2 border-transparent hover:border-cyan-500"
                      onClick={() => setSelectedScanId(scan.id)}
                    >
                      <td className="px-6 py-5">
                        <div className="flex flex-col space-y-1">
                          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                            {new Date(scan.started_at).toLocaleString()}
                          </span>
                          <span className="font-mono text-cyan-400 font-black tracking-tighter text-sm">
                            {scan.target}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex flex-col space-y-2">
                           <div>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black tracking-widest border uppercase italic ${
                              scan.intensity === 'aggressive' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20 shadow-[0_0_8px_rgba(234,179,8,0.1)]' :
                              scan.intensity === 'stealth' ? 'bg-slate-700/20 text-slate-400 border-slate-700/40 shadow-inner' :
                              scan.intensity === 'os_detection' ? 'bg-slate-800/40 text-slate-300 border-slate-700' :
                              scan.intensity === 'deep' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                              scan.intensity === 'script_audit' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                              'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                            }`}>
                              {INTENSITY_LABELS[scan.intensity] || scan.intensity || 'standard'}
                            </span>
                           </div>
                           {scan.status === 'running' ? (
                            <div className="flex flex-col w-full min-w-[140px]">
                              <div className="flex items-center justify-between mb-1 px-0.5">
                                <span className="text-[9px] text-blue-400 font-black tracking-tighter uppercase italic animate-pulse">Discovery {Math.round(Number(scan.progress) || 0)}%</span>
                              </div>
                              <div className="w-full bg-slate-950 border border-slate-800 rounded-full h-1 overflow-hidden">
                                <div
                                  className="bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 h-full transition-all duration-700 ease-out"
                                  style={{ width: `${Math.min(100, Math.max(2, Number(scan.progress) || 0))}%` }}
                                ></div>
                              </div>
                            </div>
                          ) : (
                            <span className={`text-[10px] font-black tracking-widest uppercase ${
                              scan.status === 'completed' ? 'text-emerald-500/60' : 'text-slate-500'
                            }`}>
                              {scan.status}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center space-x-4">
                           <div className="flex flex-col">
                              <span className="text-lg font-black text-slate-200 leading-none">{scan.hosts_found}</span>
                              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">Hosts</span>
                           </div>
                           <div className="h-8 w-px bg-slate-800/50"></div>
                           <div className="flex flex-col">
                              <span className="text-[10px] text-slate-400 font-mono font-bold italic">{scan.duration || '--'}</span>
                              <span className="text-[9px] text-slate-600 font-mono uppercase opacity-60 tracking-tighter">{scan.size || '0 KB'}</span>
                           </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => setSelectedScanId(scan.id)}
                            className="p-2.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 rounded-xl transition-all border border-blue-500/20 hover:scale-105"
                            title="Investigate Scan"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            disabled={isScanning}
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerNetworkScan(scan.target, scan.intensity);
                            }}
                            className="p-2.5 bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl transition-all border border-cyan-500/20 hover:scale-105"
                            title="Re-run Scan"
                          >
                            <RefreshCw className="w-4 h-4 opacity-60" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteSingleScan(scan.id);
                            }}
                            className="p-2.5 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl transition-all border border-red-500/20 hover:scale-105"
                            title="Delete Record"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="p-4 bg-slate-950/40 border-t border-slate-800 flex items-center justify-between backdrop-blur-md">
              <div className="text-[10px] text-slate-500 font-black uppercase tracking-[0.2em]">
                RECORD <span className="text-cyan-400">{(currentPage - 1) * pageSize + 1}</span> TO <span className="text-cyan-400">{Math.min(currentPage * pageSize, totalScans)}</span> <span className="mx-2 text-slate-700">|</span> TOTAL <span className="text-white">{totalScans}</span> ENTRIES
              </div>
              <div className="flex items-center space-x-3">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl border border-slate-800 transition-all text-slate-300 shadow-lg"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-black font-mono text-cyan-400 shadow-lg tracking-wider">
                  PAGE {currentPage} <span className="text-slate-700 mx-1">/</span> {totalPages}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  className="p-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-20 disabled:cursor-not-allowed rounded-xl border border-slate-800 transition-all text-slate-300 shadow-lg"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="h-64 flex flex-col items-center justify-center text-slate-500">
            <Server className="w-12 h-12 text-slate-800 mb-4 animate-pulse" />
            <p className="font-bold uppercase tracking-widest text-xs opacity-40">Zero discovery operations on record</p>
          </div>
        )}
      </div>
    </div>
  );
}
