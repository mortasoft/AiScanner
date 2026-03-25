import { Server, Globe, Search, Filter, ChevronUp, ChevronDown, ArrowUpDown } from 'lucide-react';
import { useState, useMemo } from 'react';

interface HardwareInventoryProps {
  globalHosts: any[];
  onSelectHost: (host: any) => void;
}

export default function HardwareInventory({ globalHosts, onSelectHost }: HardwareInventoryProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState('all'); // all, up, with_ports
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'ip', direction: 'asc' });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };
  const filteredHosts = useMemo(() => {
    if (!globalHosts) return [];
    return globalHosts.filter(host => {
      const matchesSearch = (
        host.ip?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        host.os?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        host.hostname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        host.mac?.toLowerCase().includes(searchTerm.toLowerCase())
      );

      const matchesFilter =
        activeFilter === 'all' ||
        (activeFilter === 'up' && host.status === 'up') ||
        (activeFilter === 'with_ports' && host.ports && host.ports !== '-');

      return matchesSearch && matchesFilter;
    });
  }, [globalHosts, searchTerm, activeFilter]);

  const sortedHosts = useMemo(() => {
    const sortable = [...filteredHosts];
    if (sortConfig.key) {
      sortable.sort((a, b) => {
        let valA: any = a[sortConfig.key];
        let valB: any = b[sortConfig.key];

        // Specific logic for IP sorting (numeric segments)
        if (sortConfig.key === 'ip') {
          const partsA = a.ip?.split('.').map(Number) || [];
          const partsB = b.ip?.split('.').map(Number) || [];
          for (let i = 0; i < 4; i++) {
            if (partsA[i] > partsB[i]) return sortConfig.direction === 'asc' ? 1 : -1;
            if (partsA[i] < partsB[i]) return sortConfig.direction === 'asc' ? -1 : 1;
          }
          return 0;
        }

        // Ports sorting by count
        if (sortConfig.key === 'ports') {
          valA = a.ports && a.ports !== '-' ? a.ports.split(',').length : 0;
          valB = b.ports && b.ports !== '-' ? b.ports.split(',').length : 0;
        }

        // Date sorting
        if (sortConfig.key === 'last_seen') {
          valA = a.last_seen ? new Date(a.last_seen).getTime() : 0;
          valB = b.last_seen ? new Date(b.last_seen).getTime() : 0;
        }

        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return sortable;
  }, [filteredHosts, sortConfig]);

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden flex flex-col min-h-0 shadow-2xl animate-in fade-in slide-in-from-bottom-5 duration-500">
      <div className="px-8 py-6 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-black text-white tracking-widest uppercase flex items-center">
            <Server className="w-5 h-5 mr-3 text-cyan-400" />
            Asset Inventory
          </h2>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 opacity-60">Consolidated Infrastructure Assets</p>
        </div>
        <div className="bg-slate-900 border border-slate-800 px-4 py-2 rounded-xl text-xs font-black text-cyan-400 font-mono italic shadow-lg">
          {filteredHosts?.length || 0} <span className="text-slate-500 uppercase font-bold tracking-tighter ml-1">Endpoints Displayed</span>
        </div>
      </div>

      {/* Premium Search & Filters */}
      <div className="px-8 py-4 bg-slate-950/20 border-b border-slate-800/50 flex flex-col md:flex-row md:items-center space-y-4 md:space-y-0 md:space-x-6">
        <div className="relative flex-1 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
          <input
            type="text"
            placeholder="Search by IP, OS, Hostname or MAC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 transition-all"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-500 mr-2" />
          <button
            onClick={() => setActiveFilter('all')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeFilter === 'all' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.1)]' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
          >
            All Assets
          </button>
          <button
            onClick={() => setActiveFilter('up')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeFilter === 'up' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
          >
            Live Nodes
          </button>
          <button
            onClick={() => setActiveFilter('with_ports')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeFilter === 'with_ports' ? 'bg-blue-500/10 border-blue-500/30 text-blue-400' : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'}`}
          >
            Full Profiles
          </button>
        </div>
      </div>

      {(filteredHosts?.length || 0) > 0 ? (
        <div className="flex-1 overflow-auto custom-scrollbar">
          <table className="w-full text-left text-sm border-separate border-spacing-0">
            <thead className="bg-slate-900/80 text-slate-500 border-b border-slate-800 sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th 
                  className="px-8 py-5 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-cyan-400 border-r border-slate-800/20 group"
                  onClick={() => requestSort('ip')}
                >
                  <div className="flex items-center space-x-3">
                    <span>Asset IP Address</span>
                    {sortConfig.key === 'ip' ? (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-cyan-400" /> : <ChevronDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-700 group-hover:text-cyan-500/50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-8 py-5 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-cyan-400 border-r border-slate-800/20 group"
                  onClick={() => requestSort('last_seen')}
                >
                  <div className="flex items-center space-x-3">
                    <span>Last Seen</span>
                    {sortConfig.key === 'last_seen' ? (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-cyan-400" /> : <ChevronDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-700 group-hover:text-cyan-500/50" />
                    )}
                  </div>
                </th>
                <th 
                  className="px-8 py-5 font-black uppercase tracking-widest text-[10px] cursor-pointer hover:text-cyan-400 group"
                  onClick={() => requestSort('ports')}
                >
                  <div className="flex items-center space-x-3">
                    <span>Open Service Map</span>
                    {sortConfig.key === 'ports' ? (
                      sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-cyan-400" /> : <ChevronDown className="w-3 h-3 text-cyan-400" />
                    ) : (
                      <ArrowUpDown className="w-3 h-3 text-slate-700 group-hover:text-cyan-500/50" />
                    )}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/30">
              {sortedHosts.map((host, i) => (
                <tr
                  key={i}
                  onClick={() => onSelectHost(host)}
                  className="hover:bg-slate-800/40 transition-all border-l-2 border-transparent hover:border-cyan-500 group cursor-pointer active:scale-[0.99] origin-left"
                >
                  <td className="px-8 py-5">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)] group-hover:scale-125 transition-transform ${host.status === 'up' ? 'bg-blue-500' : 'bg-slate-600'}`}></div>
                      <div className="flex flex-col">
                        <span className="font-mono text-cyan-400 font-black tracking-tighter text-sm group-hover:text-cyan-300 transition-colors">{host.ip}</span>
                        {host.mac && host.mac !== '-' && (
                          <div className="flex flex-col mt-1">
                            <span className="text-[10px] font-mono text-slate-500 font-black tracking-tighter uppercase opacity-70">
                              {host.mac.split(' (')[0]}
                            </span>
                            {host.mac.includes('(') && (
                              <span className="text-[8px] font-black text-cyan-500/50 uppercase tracking-[0.1em] italic leading-tight">
                                {host.mac.split('(')[1].replace(')', '')}
                              </span>
                            )}
                          </div>
                        )}
                        {host.all_ips && host.all_ips.split(',').length > 1 && (
                          <span className="text-[8px] bg-cyan-500/10 text-cyan-500/60 px-1 rounded border border-cyan-500/20 w-fit mt-0.5 font-black uppercase tracking-tighter">
                            +{host.all_ips.split(',').length - 1} Secondary Interfaces
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-5">
                    <span className="text-xs font-black text-cyan-400 font-mono tracking-tighter">
                      {host.last_seen ? new Date(host.last_seen).toLocaleString() : '-'}
                    </span>
                  </td>
                  <td className="px-8 py-5">
                    <div className="flex flex-wrap gap-1.5 max-w-[250px]">
                      {host.ports && host.ports !== '-' ? (
                        host.ports.split(',').map((port: string, pIdx: number) => (
                          <span 
                            key={pIdx} 
                            className="text-[9px] font-black font-mono px-2 py-0.5 bg-slate-800 text-slate-300 border border-slate-700 rounded-md hover:border-cyan-500/40 hover:text-cyan-400 transition-colors shadow-sm"
                          >
                            {port.trim()}
                          </span>
                        ))
                      ) : (
                        <span className="text-[10px] text-slate-600 italic font-black uppercase tracking-widest">-</span>
                      )}
                    </div>
                  </td>
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

