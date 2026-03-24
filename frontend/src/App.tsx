import React, { useState, useEffect } from 'react';
import { Shield, Network, AlertTriangle, Activity, Server, Lock, Search, RefreshCw, ChevronRight, ArrowLeft } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [scanStatus, setScanStatus] = useState<string | null>(null);
  const [devices, setDevices] = useState<any[]>([]);
  const [targetIP, setTargetIP] = useState("192.168.1.0/24"); // Default target
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [globalHosts, setGlobalHosts] = useState<any[]>([]);

  // Check initial scan state on mount or on active tab change
  useEffect(() => {
    if (activeTab === 'network') {
      if (!selectedScanId) {
        fetchScanHistory();
      } else {
        pollScanStatus(selectedScanId);
      }
    } else if (activeTab === 'endpoints') {
      fetchGlobalHosts();
    }
  }, [activeTab, selectedScanId]);

  const fetchGlobalHosts = async () => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/hosts`);
      if (resp.ok) {
        setGlobalHosts(await resp.json());
      }
    } catch(e) {
      console.error(e);
    }
  };

  const fetchScanHistory = async () => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/scan/history`);
      if (resp.ok) {
        setScanHistory(await resp.json());
      }
    } catch(e) {
      console.error(e);
    }
  };

  const pollScanStatus = async (scanId: string) => {
    if (!scanId) return;
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/scan/${scanId}/status`);
      if (resp.ok) {
        const data = await resp.json();
        const currentStatus = data.status || 'idle';
        setScanStatus(currentStatus);
        
        // If completed, fetch the results
        if (currentStatus === 'completed') {
          fetchResults(scanId);
        } else if (currentStatus === 'running' || currentStatus === 'queued') {
          // If still running, poll again in 2 seconds
          setTimeout(() => {
            if (activeTab === 'network' && selectedScanId === scanId) {
              pollScanStatus(scanId);
            }
          }, 2000);
        }
      }
    } catch(e) {
      console.error(e);
      setScanStatus('error');
    }
  };

  const fetchResults = async (scanId: string) => {
    try {
      const resp = await fetch(`${import.meta.env.VITE_API_URL}/scan/${scanId}/results`);
      if (resp.ok) {
        setDevices(await resp.json());
      }
    } catch(e) {
      console.error(e);
    }
  };

  const triggerNetworkScan = async (overrideTarget?: string) => {
    const targetToScan = overrideTarget || targetIP;
    setScanStatus('queued');
    setDevices([]); // clear old results
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/scan/network?target=${encodeURIComponent(targetToScan)}`, { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        // Go to results view for this new scan
        setSelectedScanId(data.scan_id);
      } else {
        setScanStatus('error');
      }
    } catch (err) {
      setScanStatus('error');
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-50 overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900/50 flex flex-col backdrop-blur-md">
        <div className="p-6 flex items-center space-x-3 border-b border-slate-800">
          <Shield className="w-8 h-8 text-cyan-400" />
          <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
            AiScanner
          </h1>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'dashboard' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span>Dashboard</span>
          </button>
          <button 
            onClick={() => { setActiveTab('network'); setSelectedScanId(null); fetchScanHistory(); }}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'network' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Network className="w-5 h-5" />
            <span>Network Discovery</span>
          </button>
          <button 
            onClick={() => setActiveTab('vulnerabilities')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'vulnerabilities' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
            <span>Vulnerability Scans</span>
          </button>
          <button 
            onClick={() => setActiveTab('endpoints')}
            className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all ${
              activeTab === 'endpoints' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
            }`}
          >
            <Server className="w-5 h-5" />
            <span>Endpoints & Ports</span>
          </button>
        </nav>
        
        <div className="p-4 border-t border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center font-bold">
              CISO
            </div>
            <div>
              <p className="text-sm font-medium">Mario Zamora</p>
              <p className="text-xs text-slate-400">Chief Info Security</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 flex flex-col">
        <header className="sticky top-0 z-10 p-6 flex items-center justify-between backdrop-blur-xl border-b border-slate-800/50">
          <h2 className="text-2xl font-bold tracking-tight capitalize">{activeTab.replace('-', ' ')}</h2>
          <div className="flex items-center space-x-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
              <input 
                type="text" 
                placeholder="Search resources..." 
                className="pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-full text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all w-64"
              />
            </div>
          </div>
        </header>

        <div className="p-6 flex-1">
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Quick Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Active Devices', value: '1,204', icon: Network, color: 'text-blue-400' },
                  { title: 'Open Ports', value: '342', icon: Server, color: 'text-amber-400' },
                  { title: 'Critical Vulns', value: '12', icon: AlertTriangle, color: 'text-red-400' },
                  { title: 'Scan Coverage', value: '98%', icon: Shield, color: 'text-green-400' }
                ].map((stat, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 relative overflow-hidden group hover:border-slate-700 transition-colors">
                    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                      <stat.icon className={`w-24 h-24 ${stat.color} transform rotate-12`} />
                    </div>
                    <div className="relative z-10 flex items-center space-x-4 mb-4">
                      <div className={`p-3 rounded-lg bg-slate-800/80 border border-slate-700`}>
                        <stat.icon className={`w-6 h-6 ${stat.color}`} />
                      </div>
                      <h3 className="text-slate-400 font-medium">{stat.title}</h3>
                    </div>
                    <p className="text-4xl font-bold tracking-tight">{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-cyan-400" /> Active System Status
                  </h3>
                  <div className="space-y-4">
                    <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-200">Redis Queue (Celery)</span>
                        <span className="text-xs font-semibold px-2 py-1 bg-green-500/20 text-green-400 rounded-full">Available</span>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">Handling asynchronous tasks perfectly.</p>
                      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-2">
                        <div className="bg-green-500 h-1.5 rounded-full w-[100%]"></div>
                      </div>
                    </div>
                    <div className="p-4 border border-slate-800 rounded-xl bg-slate-900/50">
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-medium text-slate-200">Nessus Scanner</span>
                        <span className="text-xs font-semibold px-2 py-1 bg-slate-500/20 text-slate-400 rounded-full">Idle</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-lg font-semibold mb-6 flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2 text-red-400" /> Recent Critical Findings
                  </h3>
                  <div className="space-y-3">
                    {[
                      { cve: 'CVE-2023-4567', desc: 'Outdated OpenSSL version on API Gateway', host: '10.0.0.12' },
                      { cve: 'CVE-2021-44228', desc: 'Log4j Unpatched Component', host: '10.0.0.45' },
                    ].map((vuln, i) => (
                      <div key={i} className="group p-4 border border-slate-800 bg-slate-900/50 rounded-xl flex items-center justify-between hover:border-red-500/30 transition-colors cursor-pointer">
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-red-500/10 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-200">{vuln.cve}</p>
                            <p className="text-xs text-slate-400">{vuln.desc}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3 text-sm">
                          <span className="text-slate-400">{vuln.host}</span>
                          <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-red-400 transition-colors" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'network' && (
            <div className="space-y-6 flex flex-col h-full">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1 flex items-center">
                  {selectedScanId && (
                    <button 
                      onClick={() => { setSelectedScanId(null); fetchScanHistory(); }} 
                      className="mr-4 p-2 rounded-full hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  <div>
                    <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2">
                      <Network className="w-5 h-5 text-cyan-400" />
                      <span>{selectedScanId ? 'Scan Log Details' : 'Network Discovery History'}</span>
                    </h3>
                    <p className="text-slate-400 text-sm">
                      {selectedScanId 
                        ? 'Detailed view of hosts and open ports discovered.' 
                        : 'List of recent network scans executed asynchronously via Nmap.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <button 
                    onClick={() => setShowScanModal(true)}
                    className="flex items-center px-6 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-medium transition-all shadow-[0_0_15px_rgba(8,145,178,0.4)] whitespace-nowrap"
                  >
                    <Search className="w-5 h-5 mr-2" />
                    Configure New Scan
                  </button>
                </div>
              </div>

              {/* Scan Configuration Modal */}
              {showScanModal && (
                <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                  <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                    <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                      <h3 className="text-xl font-bold flex items-center"><Network className="w-5 h-5 mr-2 text-cyan-400"/> New Discovery Scan</h3>
                      <button onClick={() => setShowScanModal(false)} className="text-slate-400 hover:text-white">&times;</button>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Target IP or Subnet</label>
                        <input 
                          type="text" 
                          value={targetIP}
                          onChange={(e) => setTargetIP(e.target.value)}
                          placeholder="e.g. 192.168.1.1 or 10.0.0.0/24" 
                          className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 font-mono text-cyan-400"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">Scan Intensity</label>
                        <select className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500">
                          <option>Fast Scan (Top 100 ports)</option>
                          <option>Deep Scan (All ports, OS & Services)</option>
                          <option>Stealth SYN Scan</option>
                        </select>
                      </div>
                    </div>
                    <div className="p-6 bg-slate-900/50 border-t border-slate-800 flex justify-end space-x-3">
                      <button onClick={() => setShowScanModal(false)} className="px-5 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 transition-colors">
                        Cancel
                      </button>
                      <button 
                        onClick={() => {
                          setShowScanModal(false);
                          triggerNetworkScan();
                        }}
                        className="flex items-center px-5 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-medium transition-all shadow-[0_0_10px_rgba(8,145,178,0.4)]"
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Launch Scan
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Detail View Status Message */}
              {selectedScanId && scanStatus && (
                <div className={`p-4 border rounded-xl flex items-center justify-between
                  ${scanStatus === 'running' || scanStatus === 'queued' ? 'bg-blue-500/10 border-blue-500/30' : 
                    scanStatus === 'completed' ? 'bg-green-500/10 border-green-500/30' : 
                    scanStatus === 'error' ? 'bg-red-500/10 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}
                >
                  <p className="text-sm font-medium">
                    {scanStatus === 'queued' && '⏳ Scan queued. Waiting for execution...'}
                    {scanStatus === 'running' && '📡 Nmap is scanning network ports asynchronously. This may take a minute...'}
                    {scanStatus === 'completed' && '✅ Nmap background scanning complete. Results loaded from Redis queue.'}
                    {scanStatus === 'error' && '❌ Background sub-task failed. Check syntax or permissions.'}
                  </p>
                </div>
              )}

              {/* Dynamic Content: List History OR Details */}
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex-1 flex flex-col">
                {!selectedScanId ? (
                  // HISTORY LIST VIEW
                  scanHistory.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Date & Time</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Target</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Hosts Discovered</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {scanHistory.map((scan, i) => (
                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 text-slate-300">
                                {new Date(scan.started_at).toLocaleString()}
                              </td>
                              <td className="px-6 py-4 font-mono text-cyan-400 font-medium">{scan.target}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                  scan.status === 'completed' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 
                                  scan.status === 'running' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                                  'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                  {scan.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-300">{scan.hosts_found}</td>
                              <td className="px-6 py-4">
                                <div className="flex justify-end space-x-4 items-center">
                                  <button
                                    onClick={() => {
                                      setTargetIP(scan.target);
                                      triggerNetworkScan(scan.target);
                                    }}
                                    className="text-emerald-400 hover:text-emerald-300 flex items-center font-medium transition-colors"
                                    title="Run Scan Again"
                                  >
                                    <RefreshCw className="w-4 h-4 mr-1.5" /> Re-Scan
                                  </button>
                                  <button
                                    onClick={() => setSelectedScanId(scan.id)}
                                    className="text-cyan-400 hover:text-cyan-300 flex items-center font-medium transition-colors"
                                  >
                                    View Log <ChevronRight className="w-4 h-4 ml-1" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                      <Server className="w-12 h-12 text-slate-700 mb-4" />
                      <p>No previous scans found. Click Configure New Scan to begin.</p>
                    </div>
                  )
                ) : (
                  // DETAILS VIEW (Hosts table)
                  (scanStatus === 'running' || scanStatus === 'queued' ? (
                     <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                        <RefreshCw className="w-10 h-10 animate-spin text-cyan-600 mb-4" />
                        <p>Performing stealth scan utilizing background queue...</p>
                     </div>
                  ) : devices.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                          <tr>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">IP Address</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Discovered OS</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Open Ports Filtered</th>
                            <th className="px-6 py-4 font-medium uppercase tracking-wider">Hardware (MAC)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/50">
                          {devices.map((target, i) => (
                            <tr key={i} className="hover:bg-slate-800/30 transition-colors">
                              <td className="px-6 py-4 font-mono text-cyan-400 font-medium">{target.ip}</td>
                              <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                  target.status === 'up' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                }`}>
                                  {target.status.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-slate-300 font-medium">{target.os || 'Unknown OS'}</td>
                              <td className="px-6 py-4 text-slate-300">
                                 {target.ports !== "None" ? 
                                   target.ports.split(', ').map((p: string, pIdx: number) => (
                                     <span key={pIdx} className="inline-block bg-slate-800 px-2.5 py-1 rounded text-amber-400 text-xs mr-2 border border-slate-700">{p}</span>
                                   )) 
                                 : <span className="text-slate-600 italic">No ports found</span>}
                              </td>
                              <td className="px-6 py-4 text-slate-400 font-mono text-xs">{target.mac || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                      <Server className="w-12 h-12 text-slate-700 mb-4" />
                      <p>No active scan results or no hosts were discovered.</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'vulnerabilities' && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex justify-between items-center backdrop-blur-sm">
                <div>
                  <h3 className="text-xl font-semibold mb-2">Vulnerability Scanners (Nessus & OpenVAS)</h3>
                  <p className="text-slate-400 text-sm">Launch automated credentialed scans using containerized API integration.</p>
                </div>
                <div className="flex space-x-3">
                  <button className="flex items-center px-4 py-2 border border-slate-700 hover:bg-slate-800 rounded-lg text-sm transition-colors">
                    <AlertTriangle className="w-4 h-4 mr-2 text-cyan-500" />
                    OpenVAS Scan
                  </button>
                  <button className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm transition-all shadow-[0_0_10px_rgba(37,99,235,0.4)]">
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Nessus API Sync
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[
                  { name: 'Weekly Internal Audit', target: '10.0.0.0/16', scanner: 'Nessus', findings: 145, critical: 3, lastRun: '2 days ago' },
                  { name: 'DMZ Perimeter', target: 'External IPs', scanner: 'OpenVAS', findings: 12, critical: 0, lastRun: '5 hours ago' },
                  { name: 'PCI Compliance DBs', target: '10.0.2.0/24', scanner: 'Nessus', findings: 45, critical: 1, lastRun: '1 day ago' },
                ].map((policy, i) => (
                  <div key={i} className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-all cursor-pointer group">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h4 className="font-semibold text-slate-200">{policy.name}</h4>
                        <p className="text-xs text-slate-400 mt-1">{policy.target}</p>
                      </div>
                      <span className="text-xs font-semibold px-2 py-1 bg-slate-800 rounded text-slate-300">{policy.scanner}</span>
                    </div>
                    <div className="flex space-x-6 mt-6">
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Total Findings</p>
                        <p className="font-semibold text-xl">{policy.findings}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Critical</p>
                        <p className={`font-semibold text-xl ${policy.critical > 0 ? 'text-red-400' : 'text-slate-200'}`}>{policy.critical}</p>
                      </div>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-800/50 flex justify-between items-center text-xs text-slate-400">
                      <span>Last run: {policy.lastRun}</span>
                      <span className="group-hover:text-cyan-400 transition-colors flex items-center">View Report <ChevronRight className="w-3 h-3 ml-1" /></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
            {activeTab === 'endpoints' && (
            <div className="space-y-6 flex flex-col h-full">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex-1">
                  <h3 className="text-xl font-semibold mb-2 flex items-center space-x-2">
                    <Server className="w-5 h-5 text-cyan-400" />
                    <span>Centralized Hosts Database</span>
                  </h3>
                  <p className="text-slate-400 text-sm">Aggregated view of all discovered hosts across all network and vulnerability scans.</p>
                </div>
                
                <div className="flex items-center space-x-3 w-full md:w-auto">
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500" />
                    <input 
                      type="text" 
                      placeholder="Filter by IP, OS, or Port..." 
                      className="pl-9 pr-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all w-64"
                    />
                  </div>
                  <button onClick={fetchGlobalHosts} className="p-2 border border-slate-700 bg-slate-800 rounded-lg hover:bg-slate-700 hover:text-cyan-400 transition-colors">
                    <RefreshCw className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl overflow-hidden flex-1">
                {globalHosts.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                      <thead className="bg-slate-900/80 text-slate-400 border-b border-slate-800">
                        <tr>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider">Host IP</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider">State</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider">OS Footprint</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider">Open Services</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider">Vulnerabilities</th>
                          <th className="px-6 py-4 font-medium uppercase tracking-wider">Last Seen</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/50">
                        {globalHosts.map((host, i) => (
                          <tr key={i} className="hover:bg-slate-800/30 transition-colors group">
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-3">
                                <div className="p-2 bg-slate-800 rounded-lg group-hover:bg-cyan-500/10 transition-colors">
                                  <Server className="w-4 h-4 text-cyan-400" />
                                </div>
                                <div>
                                  <p className="font-mono text-slate-200 font-medium">{host.ip}</p>
                                  <p className="text-xs text-slate-500 font-mono">{host.mac || '-'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${
                                host.status === 'up' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                              }`}>
                                {host.status.toUpperCase()}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-slate-300 font-medium">{host.os || 'Unknown OS'}</td>
                            <td className="px-6 py-4 text-slate-300">
                               {host.ports !== "None" ? 
                                 host.ports.split(', ').map((p: string, pIdx: number) => (
                                   <span key={pIdx} className="inline-block bg-slate-800 px-2.5 py-1 rounded text-cyan-400 text-xs mr-2 mb-1 border border-slate-700">{p}</span>
                                 )) 
                               : <span className="text-slate-600 italic">No ports</span>}
                            </td>
                            <td className="px-6 py-4 text-slate-300">
                               <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${host.vulns > 0 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                                 {host.vulns} CVEs
                               </span>
                            </td>
                            <td className="px-6 py-4 text-slate-400 text-xs">
                              {new Date(host.last_seen).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="h-64 flex flex-col items-center justify-center text-slate-500">
                    <Server className="w-12 h-12 text-slate-700 mb-4" />
                    <p>No hosts collected yet. Run a Network Discovery Scan to populate this database.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
