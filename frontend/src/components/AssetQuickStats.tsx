import { Server, Cpu, Clock, Activity, Fingerprint, Edit2, Check, X } from 'lucide-react';
import { useState } from 'react';

interface QuickStatsProps {
  host: any;
  onUpdateOs: (newOs: string) => void;
  onUpdateHostname: (newHostname: string) => void;
}

export default function AssetQuickStats({ host, onUpdateOs, onUpdateHostname }: QuickStatsProps) {
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [editedValue, setEditedValue] = useState('');

  const startEditing = (key: string, currentVal: string) => {
    setEditingKey(key);
    setEditedValue(currentVal || '');
  };

  const handleSave = () => {
    if (editingKey === 'Operating System') {
      onUpdateOs(editedValue);
    } else if (editingKey === 'Hostname') {
      onUpdateHostname(editedValue);
    }
    setEditingKey(null);
  };

  const items = [
    { label: 'Hostname', value: host.hostname, icon: Server, color: 'text-blue-500', editable: true },
    { label: 'Operating System', value: host.os, icon: Cpu, color: 'text-purple-500', editable: true },
    { label: 'Registration Date', value: host.first_seen ? new Date(host.first_seen).toLocaleDateString() : '-', icon: Clock, color: 'text-amber-500' },
    { label: 'Last Active Scan', value: host.last_seen ? new Date(host.last_seen).toLocaleDateString() : 'N/A', icon: Activity, color: 'text-cyan-500' }
  ];

  return (
    <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-6 h-full shadow-lg">
      <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center">
        <Fingerprint className="w-4 h-4 mr-3 text-purple-500" />
        Endpoint Identity & Discovery
      </h3>
      
      <div className="space-y-4">
        {items.map((item, idx) => (
          <div key={idx} className="flex flex-col py-3 border-b border-slate-800/30 last:border-0 hover:bg-slate-800/5 rounded px-2 transition-all group/row">
            <div className="flex items-center space-x-3 mb-1.5">
              <item.icon className={`w-3.5 h-3.5 ${item.color} opacity-70`} />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{item.label}</span>
            </div>
            
            <div className="flex items-center justify-between group">
              <div className="pl-6.5">
                {item.editable && editingKey === item.label ? (
                  <div className="flex items-center space-x-1 animate-in slide-in-from-left-2">
                    <input
                      type="text"
                      value={editedValue}
                      onChange={(e) => setEditedValue(e.target.value)}
                      className="bg-slate-900 border border-cyan-500/30 rounded px-2 py-0.5 text-[11px] font-mono text-cyan-400 focus:outline-none focus:border-cyan-500/50 w-full min-w-[150px]"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                    />
                    <button onClick={handleSave} className="p-1 hover:text-emerald-400 text-emerald-500/50 transition-colors">
                      <Check className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => setEditingKey(null)} className="p-1 hover:text-red-400 text-red-500/50 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-[11px] text-white font-bold tracking-tight">
                      {item.value || (item.label === 'Hostname' ? '-' : 'NOT DETECTED')}
                    </span>
                    {item.editable && (
                      <button 
                        onClick={() => startEditing(item.label, item.value)}
                        className="opacity-0 group-hover/row:opacity-100 p-1 text-slate-500 hover:text-cyan-400 transition-all transform active:scale-90"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
