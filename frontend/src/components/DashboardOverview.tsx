import { Activity, Shield, Server, AlertTriangle } from 'lucide-react';

interface DashboardOverviewProps {
  stats: any;
  system: any;
}

export default function DashboardOverview({ stats, system }: DashboardOverviewProps) {
  const statsList = [
    { label: 'Active Infrastructure', value: stats?.total_hosts ?? '...', icon: Server, color: 'text-cyan-400', bg: 'bg-cyan-500/10' },
    { label: 'Discovery Operations', value: stats?.total_scans ?? '...', icon: Activity, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Identified Vulnerabilities', value: stats?.total_vulnerabilities ?? '...', icon: AlertTriangle, color: 'text-amber-400', bg: 'bg-amber-500/10' },
    { label: 'Platform Integrity', value: stats?.platform_integrity ?? '...', icon: Shield, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
  ];

  return (
    <div className="space-y-6 md:space-y-8 animate-in fade-in duration-500 pb-10">
      {/* Top Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsList.map((stat, i) => (
          <div key={i} className="bg-slate-900/40 border border-slate-800 p-5 md:p-6 rounded-2xl shadow-xl backdrop-blur-sm group hover:border-slate-700/50 transition-all">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div className={`p-3 rounded-xl ${stat.bg} ${stat.color} transition-transform group-hover:scale-110 duration-300 shrink-0`}>
                  <stat.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <p className="text-xl md:text-2xl font-black text-white tracking-tighter">{stat.value}</p>
              </div>
              <div className="min-w-0">
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] leading-relaxed italic">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Welcome & Engine Status */}
        <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 shadow-2xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
            <Activity className="w-48 h-48 md:w-64 md:h-64 text-cyan-400" />
          </div>
          <div className="relative z-10">
            <h2 className="text-xl md:text-2xl font-black text-white tracking-tighter mb-2">Welcome to your Control Center</h2>
            <p className="text-slate-400 text-xs md:text-sm max-w-lg mb-6 md:mb-8 leading-relaxed font-medium capitalize">
                Your autonomous network discovery engine is operational. Monitor identified assets and launch stealth audits directly from this console.
            </p>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-3 gap-3 md:gap-4">
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors">
                  <span className="text-[9px] block font-black text-slate-600 uppercase tracking-widest mb-1">Last Sync</span>
                  <span className="text-xs font-bold text-cyan-400/80 font-mono italic">{stats?.last_sync || '00:00:00'}</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors">
                  <span className="text-[9px] block font-black text-slate-600 uppercase tracking-widest mb-1">Active Nodes</span>
                  <span className="text-xs font-bold text-emerald-400/80 font-mono italic">{stats?.total_hosts || 0} UP</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors">
                  <span className="text-[9px] block font-black text-slate-600 uppercase tracking-widest mb-1">Engine Status</span>
                  <span className="text-xs font-bold text-blue-400/80 font-mono italic uppercase tracking-wider">{stats?.engine_status || 'Offline'}</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors hidden sm:block">
                  <span className="text-[9px] block font-black text-slate-600 uppercase tracking-widest mb-1">DB Latency</span>
                  <span className="text-xs font-bold text-slate-400 font-mono italic">{stats?.db_latency || '0ms'} (Redis)</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors hidden sm:block">
                  <span className="text-[9px] block font-black text-slate-600 uppercase tracking-widest mb-1">Global Coverage</span>
                  <span className="text-xs font-bold text-slate-400 font-mono italic">{system?.coverage || 0}% Segment</span>
               </div>
               <div className="p-4 bg-slate-950/60 rounded-2xl border border-slate-800 group-hover:bg-slate-900/60 transition-colors hidden sm:block">
                  <span className="text-[9px] block font-black text-slate-600 uppercase tracking-widest mb-1">Engine API</span>
                  <span className="text-xs font-bold text-slate-400 font-mono italic">{system?.version || 'v1.0'}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col justify-center shadow-2xl backdrop-blur-md">
           <div className="w-14 h-14 md:w-16 md:h-16 bg-cyan-500 rounded-2xl mb-6 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Shield className="w-6 h-6 md:w-8 md:h-8 text-white" />
           </div>
           <h3 className="text-lg md:text-xl font-black text-white tracking-widest uppercase mb-4 opacity-90 leading-tight">Security Audit Posture</h3>
           <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest leading-loose">
              {system?.posture || 'Auditing infrastructure health...'}
           </p>
           <button className="mt-6 md:mt-8 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all border border-slate-700 active:scale-95">
              Generate Report
           </button>
        </div>
      </div>
    </div>

  );
}

