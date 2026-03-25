import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

// Specialized Submodules
import Sidebar from './components/Sidebar';
import NotificationOverlay from './components/NotificationOverlay';
import DashboardOverview from './components/DashboardOverview';
import NetworkDiscovery from './components/NetworkDiscovery';
import NetworkDetails from './components/NetworkDetails';
import HardwareInventory from './components/HardwareInventory';
import ScanModal from './components/ScanModal';

const SCAN_INTENSITIES: Record<string, string> = {
  'fast': '-F -PE -n -T4 --osscan-limit --max-retries 1 --host-timeout 10s',
  'deep': '-p- -PE -n -A -T4 --host-timeout 5m',
  'stealth': '-sS -Pn -n -T4 --host-timeout 1m',
  'ping_sweep': '-sn -PE -n -T4 --max-retries 1 --host-timeout 10s',
  'os_detection': '-O -sV -PE -n --osscan-guess -T4 --host-timeout 30s',
  'aggressive': '-A -p- -PE -n -T5 --script default,banner,vuln --host-timeout 5m',
  'script_audit': '-sV -sC -PE -n --script auth,discovery,safe -T4 --host-timeout 3m'
};

export default function App() {
  // Navigation & UI State
  const [activeTab, setActiveTab] = useState(() => localStorage.getItem('aura_active_tab') || 'dashboard');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => localStorage.getItem('aura_sidebar_collapsed') === 'true');
  
  // Data State
  const [scanHistory, setScanHistory] = useState<any[]>([]);
  const [totalScans, setTotalScans] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [showScanModal, setShowScanModal] = useState(false);
  const pageSize = 10;
  
  const [targetIP, setTargetIP] = useState("192.168.1.0/24");
  const [scanIntensity, setScanIntensity] = useState("fast");
  const [isScanning, setIsScanning] = useState(false);
  const [selectedScanId, setSelectedScanId] = useState<string | null>(null);
  const [scanStatus, setScanStatus] = useState("");
  const [devices, setDevices] = useState<any[]>([]);
  const [globalHosts, setGlobalHosts] = useState<any[]>([]);

  // Notifications State
  const [toasts, setToasts] = useState<any[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<any>({ show: false, title: '', message: '', onConfirm: () => {}, type: 'info' });

  // Dynamic API URL
  const API_BASE_URL = (import.meta.env.VITE_API_URL || "")
    .replace('localhost', window.location.hostname)
    .replace('127.0.0.1', window.location.hostname);

  // Persistence
  useEffect(() => { localStorage.setItem('aura_active_tab', activeTab); }, [activeTab]);
  useEffect(() => { localStorage.setItem('aura_sidebar_collapsed', isSidebarCollapsed.toString()); }, [isSidebarCollapsed]);

  // Global Lifecycle
  useEffect(() => {
    if (activeTab === 'network') {
      if (!selectedScanId) fetchScanHistory();
      else pollScanStatus(selectedScanId);
    } else if (activeTab === 'endpoints') {
      fetchGlobalHosts();
    }
  }, [activeTab, selectedScanId, currentPage]);

  // Polling for active scans
  useEffect(() => {
    const hasActiveScans = scanHistory.some(s => s.status === 'running' || s.status === 'queued');
    if (hasActiveScans && activeTab === 'network') {
      const interval = setInterval(() => fetchScanHistory(), 1500);
      return () => clearInterval(interval);
    }
  }, [scanHistory, activeTab]);

  // Helper: Trigger Toast
  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now();
    // Deduplicate: If same message exists, refresh it instead of adding new one
    setToasts(prev => {
      const filtered = prev.filter(t => t.message !== message);
      return [...filtered, { id, message, type }];
    });
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  };

  // API Actions
  const fetchScanHistory = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/scan/history?page=${currentPage}&size=${pageSize}`);
      if (resp.ok) {
        const data = await resp.json();
        setScanHistory(data.items || []);
        setTotalScans(data.total || 0);
        setTotalPages(data.pages || 0);
      }
    } catch (e) { console.error(e); }
  };

  const fetchGlobalHosts = async () => {
    try {
      const resp = await fetch(`${API_BASE_URL}/hosts`);
      if (resp.ok) setGlobalHosts(await resp.json());
    } catch (e) { console.error(e); }
  };

  const triggerNetworkScan = async (overrideTarget?: string, overrideIntensity?: string) => {
    const finalTarget = overrideTarget || targetIP;
    const finalIntensity = overrideIntensity || scanIntensity;
    
    if (!finalTarget) {
      addToast("Target signature required for deployment", 'error');
      return;
    }

    setIsScanning(true);
    const modeName = finalIntensity.toUpperCase().replace('_', ' ');
    addToast(`Initializing ${modeName} scan deployment on ${finalTarget}...`, 'info');
    
    try {
      const resp = await fetch(`${API_BASE_URL}/scan/network?target=${encodeURIComponent(finalTarget)}&intensity=${finalIntensity}`, { method: 'POST' });
      if (resp.ok) {
        await resp.json();
        addToast("Audit initialized in background subsystem", 'success');
        fetchScanHistory();
      } else {
        addToast("Discovery failed to initialize", 'error');
      }
    } catch (e) { addToast("Connection refused by core engine", 'error'); }
    finally { setIsScanning(false); }
  };

  const pollScanStatus = async (scanId: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/scan/${scanId}/status`);
      if (resp.ok) {
        const data = await resp.json();
        setScanStatus(data.status);
        if (data.status === 'completed') { fetchResults(scanId); fetchScanHistory(); }
        else if (data.status === 'running' || data.status === 'queued') {
          fetchScanHistory();
          setTimeout(() => { if (selectedScanId === scanId) pollScanStatus(scanId); }, 2000);
        }
      }
    } catch (e) { console.error(e); }
  };

  const fetchResults = async (scanId: string) => {
    try {
      const resp = await fetch(`${API_BASE_URL}/scan/${scanId}/results`);
      if (resp.ok) setDevices(await resp.json());
    } catch (e) { console.error(e); }
  };

  const deleteSingleScan = (scanId: string) => {
    setConfirmDialog({
      show: true,
      title: 'Purge Records?',
      message: 'This will permanently remove the audit data from protected memory caches.',
      type: 'danger',
      onConfirm: async () => {
        try {
          const resp = await fetch(`${API_BASE_URL}/scan/${scanId}`, { method: 'DELETE' });
          if (resp.ok) { addToast("Audit record purged successfully", 'success'); fetchScanHistory(); }
        } catch (e) { addToast("Record purge failed", 'error'); }
      }
    });
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast("Payload copied to clipboard buffer", 'success');
  };

  return (
    <div className="flex h-screen bg-black text-slate-200 overflow-hidden font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isSidebarCollapsed={isSidebarCollapsed} 
        setIsSidebarCollapsed={setIsSidebarCollapsed} 
      />

      <main className="flex-1 flex flex-col relative overflow-hidden bg-[radial-gradient(circle_at_50%_0%,_#0f172a_0%,_#020617_100%)]">
        <div className="p-6 h-full flex flex-col overflow-auto custom-scrollbar relative z-10">
          
          {activeTab === 'dashboard' && <DashboardOverview totalHosts={globalHosts.length} totalScans={totalScans} />}
          
          {activeTab === 'network' && (
            !selectedScanId ? (
              <NetworkDiscovery 
                scanHistory={scanHistory} totalScans={totalScans}
                currentPage={currentPage} setCurrentPage={setCurrentPage}
                totalPages={totalPages} pageSize={pageSize}
                setSelectedScanId={(id) => {
                  setScanStatus(''); // Clear status immediately
                  setDevices([]);    // Clear devices immediately
                  setSelectedScanId(id);
                }} 
                deleteSingleScan={deleteSingleScan}
                setShowScanModal={setShowScanModal}
                triggerNetworkScan={triggerNetworkScan}
                isScanning={isScanning}
              />
            ) : (
              <NetworkDetails 
                selectedScanId={selectedScanId} scanHistory={scanHistory}
                scanStatus={scanStatus} devices={devices}
                setSelectedScanId={setSelectedScanId} copyToClipboard={copyToClipboard}
                SCAN_INTENSITIES={SCAN_INTENSITIES} scanIntensity={scanIntensity}
              />
            )
          )}

          {activeTab === 'endpoints' && <HardwareInventory globalHosts={globalHosts} />}

          {activeTab === 'vulnerability' && (
            <div className="h-full flex flex-col items-center justify-center p-12 text-center bg-slate-900/20 rounded-3xl border border-slate-800 animate-in zoom-in-95 duration-700">
               <div className="w-24 h-24 bg-amber-500/10 rounded-3xl flex items-center justify-center border border-amber-500/20 mb-8">
                  <AlertTriangle className="w-12 h-12 text-amber-500" />
               </div>
               <h3 className="text-2xl font-black text-white tracking-widest uppercase mb-4">Security Audits Restricted</h3>
               <p className="max-w-md text-slate-500 font-bold uppercase tracking-widest text-[11px] leading-relaxed">
                  The vulnerability scanner module is undergoing a deep security review. Multi-scan CVE detection is currently disabled.
               </p>
            </div>
          )}
        </div>
      </main>

      <NotificationOverlay 
        toasts={toasts} 
        confirmDialog={confirmDialog} 
        closeConfirm={() => setConfirmDialog({...confirmDialog, show: false})} 
      />

      <ScanModal
        show={showScanModal}
        onClose={() => setShowScanModal(false)}
        targetIP={targetIP}
        setTargetIP={setTargetIP}
        scanIntensity={scanIntensity}
        setScanIntensity={setScanIntensity}
        SCAN_INTENSITIES={SCAN_INTENSITIES}
        isScanning={isScanning}
        triggerNetworkScan={triggerNetworkScan}
      />
    </div>
  );
}
