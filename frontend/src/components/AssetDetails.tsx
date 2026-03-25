import { useState, useEffect, useMemo } from 'react';
import { ArrowLeft, Activity, Shield, List, Globe, Zap, Key, Trash2, Eye, Calendar, Terminal, Plus, ExternalLink, Edit } from 'lucide-react';
import AssetQuickStats from './AssetQuickStats';

interface AssetDetailsProps {
  host: any;
  onBack: () => void;
  API_BASE_URL: string;
  onHostUpdate?: (updatedHost: any) => void;
  onHostDelete?: (ip: string) => void;
  addToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  setConfirmDialog: (cfg: any) => void;
  fullScanHistory?: any[];
  onSelectScan?: (scanId: string) => void;
}

export default function AssetDetails({
  host, onBack, API_BASE_URL, onHostUpdate, onHostDelete, addToast, setConfirmDialog,
  fullScanHistory, onSelectScan
}: AssetDetailsProps) {
  const [activeSubTab, setActiveSubTab] = useState('overview');
  const [localNotes, setLocalNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isAddingUrl, setIsAddingUrl] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [editingUrlIdx, setEditingUrlIdx] = useState<number | null>(null);
  const [editedUrl, setEditedUrl] = useState('');

  const updateUrlList = async (newList: string[]) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/host/${host.ip}/urls`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls: newList })
      });
      const data = await resp.json();
      if (data.status === 'success') {
        onHostUpdate?.({ ...host, urls: data.urls });
        return true;
      }
    } catch (e) {
      addToast('Sync failed', 'error');
    }
    return false;
  };

  const addHostUrl = async () => {
    if (!newUrl.trim()) return;
    const currentUrls = host.urls ? host.urls.split(',').map((u: string) => u.trim()) : [];
    if (currentUrls.includes(newUrl.trim())) {
      addToast('URL already registered', 'info');
      return;
    }
    const success = await updateUrlList([...currentUrls, newUrl.trim()]);
    if (success) {
      setNewUrl('');
      setIsAddingUrl(false);
      addToast('Web surface registered', 'success');
    }
  };

  const deleteHostUrl = async (idx: number) => {
    const urlList = host.urls.split(',');
    const newList = urlList.filter((_: any, i: number) => i !== idx);
    const success = await updateUrlList(newList);
    if (success) addToast('Surface removed', 'success');
  };

  const saveEditedUrl = async (idx: number) => {
    if (!editedUrl.trim()) return;
    const urlList = host.urls.split(',');
    urlList[idx] = editedUrl.trim();
    const success = await updateUrlList(urlList);
    if (success) {
      setEditingUrlIdx(null);
      addToast('URL updated', 'success');
    }
  };

  // Sync notes when host changes
  useEffect(() => {
    if (host) {
      setLocalNotes(host.notes || '');
    }
  }, [host]);

  const scanAuditTrail = useMemo(() => {
    if (!host.scan_history) return [];
    const scanIds = host.scan_history.split(',').filter(Boolean);
    return scanIds.map((sid: string) => {
      const scanMeta = fullScanHistory?.find(s => s.id === sid);
      return {
        id: sid,
        date: scanMeta?.started_at ? new Date(scanMeta.started_at).toLocaleString() : '-',
        target: scanMeta?.target || host.ip,
        status: scanMeta?.status || 'Archived'
      };
    });
  }, [host.scan_history, fullScanHistory]);

  const handleDelete = () => {
    if (!host || !onHostDelete) return;

    setConfirmDialog({
      show: true,
      title: 'Purge Registry Index',
      message: `Are you sure you want to permanently delete endpoint ${host.ip} from the Aura forensic registry? This action cannot be reversed.`,
      type: 'danger',
      onConfirm: async () => {
        setIsDeleting(true);
        try {
          const resp = await fetch(`${API_BASE_URL}/host/${host.ip}`, {
            method: 'DELETE'
          });
          if (resp.ok) {
            addToast(`Endpoint ${host.ip} deleted from system registry`, 'success');
            onHostDelete(host.ip);
          } else {
            addToast("Failed to delete endpoint", 'error');
          }
        } catch (err) {
          addToast("Connection error: Failed to delete endpoint", 'error');
        } finally {
          setIsDeleting(false);
        }
      }
    });
  };

  const saveNotes = async () => {
    if (!host) return;
    setIsSaving(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/host/${host.ip}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: localNotes })
      });
      if (resp.ok && onHostUpdate) {
        onHostUpdate({ ...host, notes: localNotes });
        addToast("Notes synchronized with central engine", 'success');
      } else {
        addToast("Failed to synchronize notes", 'error');
      }
    } catch (err) {
      addToast("Connection error: Synchronization failed", 'error');
      console.error("Failed to save notes", err);
    } finally {
      setIsSaving(false);
    }
  };

  const updateHostOs = async (newOs: string) => {
    if (!host) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/host/${host.ip}/os`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ os: newOs })
      });
      if (resp.ok && onHostUpdate) {
        onHostUpdate({ ...host, os: newOs });
        addToast(`OS profile updated to ${newOs}`, 'success');
      } else {
        addToast("Failed to update OS profile", 'error');
      }
    } catch (err) {
      addToast("Connection error: Synchronization failed", 'error');
      console.error("Failed to update OS", err);
    }
  };

  const updateHostname = async (newName: string) => {
    if (!host) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/host/${host.ip}/hostname`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostname: newName })
      });
      if (resp.ok && onHostUpdate) {
        onHostUpdate({ ...host, hostname: newName });
        addToast(`Hostname updated to ${newName}`, 'success');
      } else {
        addToast("Failed to update hostname", 'error');
      }
    } catch (err) {
      addToast("Connection error: Synchronization failed", 'error');
      console.error("Failed to update hostname", err);
    }
  };

  if (!host) return (
    <div className="flex items-center justify-center h-full">
      <Activity className="w-8 h-8 text-cyan-500 animate-spin" />
    </div>
  );

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Globe },
    { id: 'services', label: 'Services & Ports', icon: List },
    { id: 'vulnerabilities', label: 'Vulnerabilities', icon: Shield },
    { id: 'history', label: 'Scan History', icon: Terminal },
  ];


  return (
    <div className="flex flex-col h-full animate-in fade-in slide-in-from-bottom-5 duration-500">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-6">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-cyan-400 hover:border-cyan-500/50 transition-all active:scale-90"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-3xl font-black text-white tracking-tighter font-mono">{host.ip}</h2>
              <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${host.status === 'up' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border border-slate-500/20'}`}>
                {host.status || 'OFFLINE'}
              </span>
            </div>
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-[0.2em] mt-1 opacity-60 italic text-left">
              Endpoint Assets Module
            </p>
          </div>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center space-x-2 bg-red-500/10 border border-red-500/20 text-red-500/60 hover:text-red-500 hover:bg-red-500/20 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 disabled:opacity-50"
          >
            <Trash2 className="w-4 h-4" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Asset'}</span>
          </button>
          <button className="flex items-center space-x-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-cyan-400 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all shadow-lg active:scale-95">
            <Zap className="w-4 h-4" />
            <span>Full Audit</span>
          </button>
        </div>
      </div>


      {/* Tabs Navigation */}
      <div className="flex space-x-1 p-1 bg-slate-900/60 border border-slate-800/50 rounded-2xl mb-6 w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id)}
              className={`
                flex items-center space-x-2 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                ${isActive
                  ? 'bg-slate-800 text-cyan-400 shadow-lg border border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'}
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-600'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content Area */}
      <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-3xl p-8 overflow-auto custom-scrollbar relative">

        {activeSubTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in duration-300">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <AssetQuickStats 
                host={host} 
                onUpdateOs={updateHostOs} 
                onUpdateHostname={updateHostname} 
              />
              
              <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-6">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center">
                  <Key className="w-4 h-4 mr-3 text-cyan-500" />
                  Hardware Identifiers
                </h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-3 border-b border-slate-800/30">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">MAC Address</span>
                    <span className="font-mono text-xs text-slate-300">{host.mac || 'N/A'}</span>
                  </div>
                  <div className="flex flex-col space-y-3 py-3 border-b border-slate-800/30">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Network Interface(s)</span>
                    <div className="flex flex-wrap gap-2">
                      {host.all_ips ? host.all_ips.split(',').map((ip: string, idx: number) => (
                        <span key={idx} className={`font-mono text-[11px] px-2 py-1 rounded-md border ${ip.trim() === host.ip ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20 shadow-[0_0_8px_rgba(6,182,212,0.1)]' : 'bg-slate-800/40 text-slate-400 border-slate-700/50'}`}>
                          {ip.trim()}
                        </span>
                      )) : (
                        <span className="font-mono text-xs text-slate-300">{host.ip}</span>
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between items-center py-3">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Internal ID</span>
                    <span className="font-mono text-[10px] text-slate-500 italic uppercase">{host.internal_id || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Identified Web Surfaces - Full Width Card */}
              <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-6 flex flex-col h-full md:col-span-2">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                    <Globe className="w-4 h-4 mr-3 text-blue-400" />
                    Identified Web Surfaces
                  </h3>
                  <button
                    onClick={() => setIsAddingUrl(!isAddingUrl)}
                    className="p-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg border border-blue-500/20 transition-all"
                  >
                    <Plus className={`w-3.5 h-3.5 transition-transform ${isAddingUrl ? 'rotate-45' : ''}`} />
                  </button>
                </div>

                <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar min-h-[120px]">
                  {isAddingUrl && (
                    <div className="p-3 bg-slate-900 border border-blue-500/30 rounded-xl mb-4 animate-in slide-in-from-top-2 duration-300">
                      <input
                        type="text"
                        placeholder="https://example.com"
                        value={newUrl}
                        onChange={(e) => setNewUrl(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-[10px] font-mono text-blue-400 placeholder:text-slate-700 focus:outline-none focus:border-blue-500/50 transition-all"
                        onKeyDown={(e) => e.key === 'Enter' && addHostUrl()}
                      />
                      <div className="flex justify-end mt-2 space-x-2">
                        <button onClick={() => setIsAddingUrl(false)} className="text-[9px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300">Cancel</button>
                        <button onClick={addHostUrl} className="text-[9px] font-black text-blue-400 uppercase tracking-widest hover:text-blue-300">Add Surface</button>
                      </div>
                    </div>
                  )}

                  {host.urls ? host.urls.split(',').map((url: string, idx: number) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-900/40 border border-slate-800/30 rounded-xl hover:bg-blue-500/5 hover:border-blue-500/20 transition-all group/item">
                      {editingUrlIdx === idx ? (
                        <div className="flex-1 flex flex-col space-y-2">
                          <input
                            type="text"
                            value={editedUrl}
                            onChange={(e) => setEditedUrl(e.target.value)}
                            className="w-full bg-slate-950 border border-blue-500/50 rounded-lg px-2 py-1 text-[10px] text-blue-400 font-mono"
                            autoFocus
                            onKeyDown={(e) => e.key === 'Enter' && saveEditedUrl(idx)}
                          />
                          <div className="flex justify-end space-x-2">
                            <button onClick={() => setEditingUrlIdx(null)} className="text-[8px] text-slate-500 uppercase font-black">Cancel</button>
                            <button onClick={() => saveEditedUrl(idx)} className="text-[8px] text-blue-400 uppercase font-black">Save</button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <a
                            href={url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center space-x-3 overflow-hidden"
                          >
                            <div className="p-2 bg-blue-500/5 rounded-lg border border-blue-500/10 group-hover/item:border-blue-500/30 transition-colors">
                              <Globe className="w-3.5 h-3.5 text-blue-400" />
                            </div>
                            <span className="text-[10px] font-mono font-bold text-slate-300 group-hover/item:text-blue-300 transition-colors truncate max-w-[150px]">{url}</span>
                          </a>
                          <div className="flex space-x-1 opacity-0 group-hover/item:opacity-100 transition-all">
                            <button
                              onClick={() => { setEditingUrlIdx(idx); setEditedUrl(url); }}
                              className="p-1.5 text-slate-500 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors"
                            >
                              <Edit className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteHostUrl(idx)}
                              className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <a href={url} target="_blank" rel="noopener noreferrer" className="p-1.5 text-slate-500 hover:text-white transition-colors">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        </>
                      )}
                    </div>
                  )) : (
                    <div className="flex flex-col items-center justify-center h-32 text-center opacity-40">
                      <Globe className="w-8 h-8 text-slate-700 mb-2" />
                      <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest leading-relaxed"> No web entrypoints mapped to this infrastructure node yet </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Card - Full Width too for balance */}
              <div className="bg-slate-950/40 border border-slate-800/50 rounded-2xl p-6 relative group md:col-span-2">
                <h3 className="text-xs font-black text-white uppercase tracking-widest mb-4 flex items-center">
                  <List className="w-4 h-4 mr-3 text-cyan-500" />
                  Host Analysis Notes
                </h3>
                <textarea
                  value={localNotes}
                  onChange={(e) => setLocalNotes(e.target.value)}
                  placeholder="Enter administrative notes, ownership details, or vulnerability context..."
                  className="w-full h-32 bg-slate-900/50 border border-slate-800 rounded-xl p-4 text-xs text-slate-300 placeholder:text-slate-700 focus:border-cyan-500/40 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono custom-scrollbar resize-none"
                />
                <div className="mt-4 flex justify-end">
                  <button
                    onClick={saveNotes}
                    disabled={isSaving}
                    className={`flex items-center space-x-2 px-6 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${isSaving ? 'bg-slate-800 text-slate-500' : 'bg-slate-800 hover:bg-slate-700 text-cyan-400 border border-slate-700'}`}
                  >
                    {isSaving ? (
                      <>
                        <Activity className="w-3.5 h-3.5 animate-spin" />
                        <span>Syncing...</span>
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5" />
                        <span>Save Analysis Notes</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSubTab === 'services' && (
          <div className="animate-in fade-in duration-300">
            <h3 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center">
              <Zap className="w-4 h-4 mr-3 text-cyan-500" />
              Open Service Ports
            </h3>
            {host.ports && host.ports !== '-' ? (
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {host.ports.split(',').map((port: string, idx: number) => (
                  <div key={idx} className="bg-slate-950/40 border border-slate-800 rounded-xl p-4 flex flex-col items-center justify-center hover:border-cyan-500/50 transition-all cursor-default group">
                    <span className="text-xl font-black text-white font-mono group-hover:text-cyan-400 transition-colors">{port.trim()}</span>
                    <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">TCP/OPEN</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-40 flex flex-col items-center justify-center text-slate-500 bg-slate-950/20 rounded-2xl border border-dashed border-slate-800">
                <p className="text-[10px] font-black uppercase tracking-widest">No active services detected on this endpoint</p>
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'vulnerabilities' && (
          <div className="animate-in fade-in duration-300">
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Shield className="w-12 h-12 text-slate-700 mb-4" />
              <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">Vulnerability Map Restricted</h3>
              <p className="max-w-xs text-[10px] text-slate-600 font-bold uppercase tracking-widest leading-relaxed italic text-center">
                Specific host CVE indexing requires an active 'Deep Impact' scan session which is not currently detected for this IP.
              </p>
            </div>
          </div>
        )}

        {activeSubTab === 'history' && (
          <div className="animate-in fade-in duration-300">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
              <div className="px-6 py-4 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
                <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center">
                  <Terminal className="w-4 h-4 mr-3 text-cyan-400" />
                  Scan History
                </h3>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-tighter italic">Total Sessions: {scanAuditTrail.length}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-[10px] border-separate border-spacing-0">
                  <thead className="bg-slate-950/60 text-slate-500 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 font-black uppercase tracking-widest">Session Date / Time</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest">Reconnaissance ID</th>
                      <th className="px-6 py-4 font-black uppercase tracking-widest text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/30">
                    {scanAuditTrail.length > 0 ? scanAuditTrail.map((scan: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-800/20 transition-all group">
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3.5 h-3.5 text-slate-600 group-hover:text-amber-500 transition-colors" />
                            <span className="font-mono text-slate-300 font-bold italic">{scan.date}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-mono text-cyan-400/80 group-hover:text-cyan-400 font-black tracking-tighter text-xs">{scan.id}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <button
                            onClick={() => onSelectScan?.(scan.id)}
                            className="p-2 bg-slate-800 hover:bg-cyan-500/20 text-slate-500 hover:text-cyan-400 rounded-lg border border-slate-700 hover:border-cyan-500/30 transition-all transform active:scale-90"
                            title="Pivot to Mission Results"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-6 py-10 text-center text-slate-600 italic uppercase font-bold tracking-widest bg-slate-950/20">
                          No discovery sessions found for this asset entry
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
