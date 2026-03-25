import React from 'react';
import { Activity, Shield, Server, AlertTriangle } from 'lucide-react';

interface DashboardOverviewProps {
  totalHosts: number;
  totalScans: number;
}

export default function DashboardOverview({ totalHosts, totalScans }: DashboardOverviewProps) {
  const stats = [
    { label: 'Active Infrastructure', value: totalHosts, icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Discovery Operations', value: totalScans, icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Identified Vulnerabilities', value: '42', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Platform Integrity', value: '100%', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-800 p-6 rounded-2xl shadow-xl backdrop-blur-sm group hover:border-slate-700/50 transition-all">
            <div className="flex items-center space-x-4">
              <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{stat.label}</p>
                <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
            <Activity className="w-64 h-64 text-cyan-400" />
          </div>
          <div className="relative z-10">
            <h2 className="text-2xl font-black text-white tracking-tighter mb-2">Welcome to your Control Center</h2>
            <p className="text-slate-400 text-sm max-w-lg mb-8 leading-relaxed font-medium capitalize">
                Your autonomous network discovery engine is operational. Monitor identified assets and launch stealth audits directly from this console.
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors">
                  <span className="text-[10px] block font-black text-slate-600 uppercase tracking-widest mb-1.5">Last Sync</span>
                  <span className="text-xs font-bold text-cyan-400/80 font-mono italic">{new Date().toLocaleTimeString()}</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors">
                  <span className="text-[10px] block font-black text-slate-600 uppercase tracking-widest mb-1.5">Active Nodes</span>
                  <span className="text-xs font-bold text-emerald-400/80 font-mono italic">{totalHosts} UP</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors">
                  <span className="text-[10px] block font-black text-slate-600 uppercase tracking-widest mb-1.5">Engine Status</span>
                  <span className="text-xs font-bold text-blue-400/80 font-mono italic uppercase tracking-wider">Operational</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors hidden sm:block">
                  <span className="text-[10px] block font-black text-slate-600 uppercase tracking-widest mb-1.5">DB Latency</span>
                  <span className="text-xs font-bold text-slate-400 font-mono italic">1.2ms (Redis)</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors hidden sm:block">
                  <span className="text-[10px] block font-black text-slate-600 uppercase tracking-widest mb-1.5">Global Coverage</span>
                  <span className="text-xs font-bold text-slate-400 font-mono italic">85% Segment</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors hidden sm:block">
                  <span className="text-[10px] block font-black text-slate-600 uppercase tracking-widest mb-1.5">API Protocol</span>
                  <span className="text-xs font-bold text-slate-400 font-mono italic">v2.4 Stealth</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-8 flex flex-col justify-center shadow-2xl backdrop-blur-md">
           <div className="w-16 h-16 bg-gradient-to-br from-cyan-600 to-blue-600 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-8 h-8 text-white" />
           </div>
           <h3 className="text-xl font-black text-white tracking-widest uppercase mb-4 opacity-90 leading-tight">Security Audit Posture</h3>
           <p className="text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose">
              Infrastructure integrity is stable. No unauthorized lateral movements detected in the last scan cycle.
           </p>
           <button className="mt-8 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-700">
              Generate Report
           </button>
        </div>
      </div>
    </div>
  );
}
