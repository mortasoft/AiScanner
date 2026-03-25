import React from 'react';
import { Server, Globe, Cpu, Hash } from 'lucide-react';

interface HardwareInventoryProps {
  globalHosts: any[];
}

export default function HardwareInventory({ globalHosts }: HardwareInventoryProps) {
  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col min-h-0 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="px-8 py-6 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center">
            <Server className="w-5 h-5 mr-3 text-cyan-400" />
            Global Hardware Inventory
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-60">Consolidated Infrastructure Assets</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-black text-cyan-400 font-mono italic shadow-lg">
          {globalHosts.length} <span className="text-slate-500 uppercase font-bold tracking-tighter ml-1">Nodes Verified</span>
        </div>
      </div>

      {globalHosts.length > 0 ? (
        <div className="flex-1 overflow-auto">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-900/80 text-slate-500 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Asset IP Address</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Detected Signature</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Open Service Map</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-right">Hardware MAC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {globalHosts.map((host, i) => (
                <tr key={i} className="hover:bg-slate-800/40 transition-all border-l-2 border-transparent hover:border-cyan-500 group">
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                       <div className="w-2.5 h-2.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform"></div>
                       <span className="font-mono text-cyan-400 font-black tracking-tighter text-sm">{host.ip}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-col">
                       <span className="text-xs text-white font-bold">{host.os || 'Unknown Device'}</span>
                       <span className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter mt-0.5 opacity-60 italic">Last Seen: {host.last_seen ? new Date(host.last_seen).toLocaleDateString() : 'Historical'}</span>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <div className="max-w-xs overflow-hidden">
                       <p className="text-[11px] text-slate-400 font-mono italic truncate opacity-80">{host.ports || 'Zero Discovery Details'}</p>
                    </div>
                  </td>
                  <td className="px-8 py-5 text-right font-mono text-[11px] text-slate-300 font-black tracking-widest uppercase opacity-70 italic shadow-inner">{host.mac || 'No Hardware ID'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="h-96 flex flex-col items-center justify-center text-slate-500 text-center px-6">
          <div className="relative mb-8">
             <div className="absolute -inset-8 bg-slate-400/5 rounded-full blur-3xl animate-pulse"></div>
             <Globe className="w-20 h-20 text-slate-800 relative z-10" />
          </div>
          <h3 className="text-sm font-black text-slate-600 uppercase tracking-[0.3em] mb-3">Inventory Empty</h3>
          <p className="text-[10px] text-slate-700 font-semibold max-w-sm uppercase tracking-widest leading-loose">
            No global asset profiles have been recorded. Launch a network discovery operation to populate the central infrastructure registry.
          </p>
        </div>
      )}
    </div>
  );
}
