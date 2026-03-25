import { Shield, Network, AlertTriangle, Activity, Server, ChevronLeft, Menu, Bell } from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: (collapsed: boolean) => void;
  system: any;
}

export default function Sidebar({ activeTab, setActiveTab, isSidebarCollapsed, setIsSidebarCollapsed, system }: SidebarProps) {
  const navItems = [
    { id: 'dashboard', icon: Activity, label: 'Control Center' },
    { id: 'network', icon: Network, label: 'Network Discovery' },
    { id: 'endpoints', icon: Server, label: 'Endpoint Assets' },
    { id: 'alerts', icon: Bell, label: 'Security Alerts' },
    { id: 'vulnerability', icon: AlertTriangle, label: 'Vulnerabilities' },
  ];

  return (
    <aside className={`relative bg-slate-950 border-r border-slate-800 transition-all duration-500 ease-in-out flex flex-col z-30 shadow-[5px_0_20px_rgba(0,0,0,0.5)] ${isSidebarCollapsed ? 'w-20' : 'w-60'}`}>
      <div className={`${isSidebarCollapsed ? 'px-3' : 'px-5'} py-6 mb-2 transition-all duration-500`}>
        <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col space-y-6' : 'justify-between'} mb-8`}>
          <div className="flex items-center space-x-4">
            <div className="relative group shrink-0 animate-[pulse_4s_cubic-bezier(0.4,0,0.6,1)_infinite]">
              <div className="absolute -inset-1.5 bg-cyan-400 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
              <div className="relative w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center border border-slate-700/50 shadow-2xl scale-100 hover:scale-110 transition-transform">
                <svg className="w-8 h-8" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 2L2 7L12 12L22 7L12 2Z" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M2 17L12 22L22 17" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.4" />
                  <path d="M2 12L12 17L22 12" stroke="#22D3EE" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.7" />
                </svg>
              </div>
            </div>
            {!isSidebarCollapsed && (
              <div className="flex flex-col animate-in fade-in slide-in-from-left-4 duration-500">
                <h1 className="text-3xl font-black tracking-tighter text-white">{system?.name || 'AURA'}</h1>
                <span className="text-[10px] font-bold text-cyan-400 tracking-[0.25em] uppercase -mt-1 opacity-70 leading-tight">{system?.slogan || 'Cyber Intelligence'}</span>
              </div>
            )}
          </div>

          <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`p-2.5 rounded-xl transition-all border shadow-lg group active:scale-95 flex items-center justify-center
              ${isSidebarCollapsed
                ? 'bg-slate-900 border-slate-800 text-slate-500 hover:text-cyan-400'
                : 'bg-slate-900/50 border-slate-800/50 text-slate-400 hover:text-white hover:bg-slate-800'}`}
            title={isSidebarCollapsed ? 'Expand View' : 'Collapse Hierarchy'}
          >
            {isSidebarCollapsed ? <Menu className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />}
          </button>
        </div>

        <nav className="space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center p-3.5 rounded-xl transition-all duration-300 group
                ${activeTab === item.id
                  ? 'bg-cyan-500/10 text-cyan-400 shadow-[inset_0_0_15px_rgba(34,211,238,0.1)] border border-cyan-500/20'
                  : 'text-slate-500 hover:bg-slate-900 hover:text-slate-300 border border-transparent'}`}
              title={isSidebarCollapsed ? item.label : ''}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${activeTab === item.id ? 'text-cyan-400 drop-shadow-[0_0_5px_rgba(34,211,238,0.5)]' : 'group-hover:text-cyan-400'}`} />
              {!isSidebarCollapsed && (
                <span className="ml-4 font-semibold text-sm tracking-wide">{item.label}</span>
              )}
            </button>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-6">
        {!isSidebarCollapsed && (
          <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Security Status</span>
            </div>
            <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 transition-all duration-1000" style={{ width: `${system?.coverage || 0}%` }}></div>
            </div>
            <p className="text-[10px] text-slate-500 mt-2 font-mono">Infrastructure Coverage: {system?.coverage || 0}%</p>
          </div>
        )}
      </div>
    </aside>
  );
}
