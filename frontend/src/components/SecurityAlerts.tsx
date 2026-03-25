import { ShieldAlert, Clock, CheckCircle, RefreshCcw, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';

interface SecurityAlertsProps {
  API_BASE_URL: string;
  addToast: (msg: string, type: any) => void;
}

export default function SecurityAlerts({ API_BASE_URL, addToast }: SecurityAlertsProps) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/alerts`);
      if (resp.ok) {
        setAlerts(await resp.json());
      }
    } catch (e) {
      console.error("Failed to fetch alerts", e);
    } finally {
      setIsLoading(false);
    }
  };

  const dismissAlert = async (id: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/alerts/${id}`, {
        method: 'DELETE'
      });
      if (resp.ok) {
        setAlerts(prev => prev.filter(a => a.id !== id));
        addToast("Alert dismissed and logged as resolved", "success");
      }
    } catch (e) {
      addToast("Failed to dismiss alert", "error");
    }
  };

  useEffect(() => {
    fetchAlerts();
    // Poll for alerts every 10 seconds
    const interval = setInterval(fetchAlerts, 10000);
    return () => clearInterval(interval);
  }, []);

  const getSeverityStyles = (severity: string) => {
    switch(severity.toLowerCase()) {
      case 'high': return 'text-red-400 bg-red-400/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.1)]';
      case 'medium': return 'text-amber-400 bg-amber-400/10 border-amber-500/20';
      case 'low': return 'text-blue-400 bg-blue-400/10 border-blue-500/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-500/20';
    }
  };

  return (
    <div className="flex flex-col h-full animate-in fade-in duration-500">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-black text-white tracking-widest uppercase flex items-center">
            <ShieldAlert className="w-6 h-6 mr-4 text-red-500" />
            Security Alerts Center
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-60">Anomaly detection & infrastructure drift monitor</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <button 
            onClick={fetchAlerts}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-400 rounded-xl transition-all shadow-lg active:scale-95"
            title="Force Sync"
          >
            <RefreshCcw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <div className="bg-slate-900 border border-slate-800 px-5 py-2.5 rounded-xl text-xs font-black text-red-400 font-mono italic shadow-lg">
            {alerts.length} <span className="text-slate-500 uppercase font-bold tracking-tighter ml-1">Critical Events Active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col min-h-0 shadow-2xl relative">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-900/80 text-slate-500 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Event ID</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Timestamp</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px]">Event Description</th>
                <th className="px-8 py-5 font-black uppercase tracking-widest text-[10px] text-center">Triage Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {alerts.length > 0 ? (
                alerts.map((alert) => (
                  <tr key={alert.id} className="hover:bg-slate-800/40 transition-all group">
                    <td className="px-8 py-6">
                      <span className="font-mono text-[10px] text-slate-500 group-hover:text-cyan-400 transition-colors uppercase font-bold">#{alert.id.split('-')[0]}</span>
                    </td>
                    <td className="px-8 py-6 whitespace-nowrap">
                      <div className="flex items-center space-x-3 text-slate-400">
                        <Clock className="w-3.5 h-3.5 opacity-50 font-bold" />
                        <span className="text-xs font-mono font-bold">{new Date(alert.timestamp).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center space-x-4">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest border ${getSeverityStyles(alert.severity)}`}>
                          {alert.severity}
                        </span>
                        <p className="text-xs font-bold text-slate-300 tracking-tight leading-relaxed">{alert.description}</p>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <button 
                        onClick={() => dismissAlert(alert.id)}
                        className="p-2.5 bg-slate-800 hover:bg-emerald-500/20 text-slate-500 hover:text-emerald-400 rounded-xl border border-slate-700 hover:border-emerald-500/30 transition-all transform active:scale-95 group/btn"
                        title="Resolve and Dismiss"
                      >
                        <CheckCircle className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="h-96">
                    <div className="flex flex-col items-center justify-center text-slate-500 opacity-40">
                      <div className="relative mb-6">
                        <div className="absolute -inset-8 bg-slate-400/5 rounded-full blur-3xl animate-pulse"></div>
                        <Bell className="w-20 h-20 text-slate-800 relative z-10" />
                      </div>
                      <h3 className="text-sm font-black uppercase tracking-[0.4em] mb-2">Platform Secure</h3>
                      <p className="text-[10px] font-bold uppercase tracking-widest">No infrastructure drift detected in recent sessions</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
