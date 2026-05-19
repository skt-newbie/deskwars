import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Settings, ShieldOff, Zap, Package, BarChart3, RefreshCcw, Power, ShieldAlert, Gift } from 'lucide-react';
import { fetchJson } from '../lib/api';

export default function AdminPanel() {
  const [data, setData] = useState<{ configs: any[], inventory: any[], stats: any } | null>(null);
  const [prizeClaims, setPrizeClaims] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'config' | 'claims'>('config');

  useEffect(() => {
    loadAdminData();
    loadPrizeClaims();
  }, []);

  const loadAdminData = async () => {
    setLoading(true);
    try {
      const res = await fetchJson('/api/admin/status');
      setData(res);
      setError(null);
    } catch (err: any) {
      console.error('[AdminPanel] Error loading data:', err);
      setError(err.message || "Unauthorized Access");
    } finally {
      setLoading(false);
    }
  };

  const loadPrizeClaims = async () => {
    try {
      const res = await fetchJson('/api/admin/prize-claims');
      setPrizeClaims(res.claims || []);
    } catch (err: any) {
      console.error('[AdminPanel] Error loading prize claims:', err);
      // If unauthorized, don't set claims (user might not be admin)
      if (err.message?.includes('Access denied') || err.message?.includes('Unauthorized')) {
        setPrizeClaims([]);
      }
    }
  };

  const toggleGame = async (gameId: string, isEnabled: boolean) => {
    try {
      await fetchJson('/api/admin/toggle-game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, isEnabled: !isEnabled })
      });
      loadAdminData();
    } catch (err) {
      if ((err as any).message !== 'Unauthorized') {
        console.error(err);
      }
    }
  };

  const updateInventory = async (itemId: string, newQty: number) => {
    try {
      await fetchJson('/api/admin/update-inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, quantity: newQty })
      });
      loadAdminData();
    } catch (err) {
      if ((err as any).message !== 'Unauthorized') {
        console.error(err);
      }
    }
  };

  const resetPlatform = async () => {
    if (!confirm("WARNING: This will permanently purge all non-admin users, scores, submissions, and session data. ONLY ADMINS WILL REMAIN. Are you absolutely certain?")) return;
    
    try {
      setLoading(true);
      const res = await fetchJson('/api/admin/reset-platform', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      alert(res.message);
      loadAdminData();
    } catch (err: any) {
      alert("Purge failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-black flex items-center justify-center text-chaos-pink animate-pulse font-black uppercase tracking-widest">Scanning Authorization...</div>;
  if (error) return <div className="min-h-screen bg-black flex flex-col items-center justify-center p-6 text-center">
    <ShieldOff className="w-20 h-20 text-red-500 mb-6" />
    <h2 className="text-4xl font-black uppercase text-white italic mb-2">Access Denied</h2>
    <p className="text-zinc-500 font-mono text-xs uppercase">{error}</p>
  </div>;

  return (
    <div className="min-h-screen bg-black text-white p-8 pb-32 overflow-y-auto">
      <header className="mb-12 border-b-4 border-white pb-8 flex justify-between items-end">
        <div>
          <div className="flex items-center gap-3 text-chaos-pink font-mono text-xs uppercase tracking-[0.5em] mb-2">
            <Settings className="w-4 h-4" /> System Administration
          </div>
          <h1 className="text-7xl font-black uppercase tracking-tighter italic">The Void Core</h1>
        </div>
        <div className="flex gap-4">
           <button onClick={loadAdminData} className="p-4 border-2 border-zinc-800 hover:border-white transition-colors">
              <RefreshCcw className="w-6 h-6" />
           </button>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="flex gap-4 mb-8 border-b-2 border-zinc-900">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-6 py-3 font-black uppercase text-sm transition-colors ${
            activeTab === 'config'
              ? 'bg-chaos-green text-black'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Power className="w-4 h-4 inline mr-2" />
          Configuration
        </button>
        <button
          onClick={() => setActiveTab('claims')}
          className={`px-6 py-3 font-black uppercase text-sm transition-colors ${
            activeTab === 'claims'
              ? 'bg-chaos-pink text-black'
              : 'text-zinc-500 hover:text-white'
          }`}
        >
          <Gift className="w-4 h-4 inline mr-2" />
          Prize Claims
        </button>
      </div>

      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Game Toggles */}
          <div className="lg:col-span-2 space-y-8">
            <section>
             <h2 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3">
               <Power className="w-6 h-6 text-chaos-green" /> Zone Configuration
             </h2>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {data?.configs.map((config) => (
                <div key={config.gameId} className={`p-6 border-2 transition-all ${config.isEnabled ? 'border-chaos-green bg-chaos-green/5' : 'border-zinc-800 opacity-60'}`}>
                   <div className="flex justify-between items-center mb-4">
                     <span className="font-black uppercase italic text-lg">{config.gameId?.replace('-', ' ')}</span>
                     <button
                       onClick={() => toggleGame(config.gameId, !!config.isEnabled)}
                       className={`px-4 py-2 font-black uppercase text-[10px] transition-colors ${config.isEnabled ? 'bg-chaos-green text-black' : 'bg-zinc-800 text-zinc-500'}`}
                     >
                       {config.isEnabled ? 'ONLINE' : 'OFFLINE'}
                     </button>
                   </div>
                   <p className="text-zinc-500 font-mono text-[10px] uppercase">
                     Status: {config.isEnabled ? 'Ready for deployment' : 'Recalibrating flux...'}
                   </p>
                </div>
              ))}
            </div>
          </section>

          <section>
             <h2 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3">
               <Package className="w-6 h-6 text-chaos-yellow" /> Inventory Matrix
             </h2>
             <div className="bg-zinc-950 border-2 border-zinc-900 overflow-hidden">
               <table className="w-full text-left font-mono text-xs">
                 <thead>
                   <tr className="bg-zinc-900 uppercase tracking-widest">
                     <th className="p-4">Item Name</th>
                     <th className="p-4">Stock</th>
                     <th className="p-4">Fallback Points</th>
                     <th className="p-4">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-zinc-900">
                   {data?.inventory.map((item) => (
                     <tr key={item.id} className="hover:bg-white/5">
                       <td className="p-4 font-bold uppercase">{item.name}</td>
                       <td className={`p-4 font-black ${(item.quantity ?? 0) <= 0 ? 'text-red-500' : 'text-chaos-yellow'}`}>
                         {item.quantity ?? 0} units
                       </td>
                       <td className="p-4 text-zinc-500">+{item.digitalFallbackPoints} pts</td>
                       <td className="p-4 flex gap-2">
                         <button onClick={() => updateInventory(item.id, item.quantity + 1)} className="px-2 py-1 bg-zinc-800 hover:bg-white hover:text-black font-black">+</button>
                         <button onClick={() => updateInventory(item.id, Math.max(0, item.quantity - 1))} className="px-2 py-1 bg-zinc-800 hover:bg-white hover:text-black font-black">-</button>
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
             </div>
          </section>
        </div>

        {/* Global Stats */}
        <div className="space-y-8">
           <section className="bg-zinc-900 p-8 border-4 border-white relative overflow-hidden">
              <BarChart3 className="absolute -bottom-6 -right-6 w-32 h-32 text-white/5" />
              <h2 className="text-xl font-black uppercase italic mb-8 border-b border-zinc-800 pb-4">Live Analytics</h2>
              
              <div className="space-y-8">
                <div>
                   <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Total Souls Captured</p>
                   <p className="text-5xl font-black italic tracking-tighter tabular-nums">{data?.stats.totalUsers}</p>
                </div>
                <div>
                   <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Chaos Verdicts Rendered</p>
                   <p className="text-5xl font-black italic tracking-tighter tabular-nums text-chaos-pink">{data?.stats.totalSubmissions}</p>
                </div>
                <div>
                   <p className="text-zinc-500 font-mono text-[10px] uppercase tracking-widest mb-1">Atomic Success Rate</p>
                   <p className="text-5xl font-black italic tracking-tighter tabular-nums text-chaos-green">84.2%</p>
                </div>
              </div>
           </section>

           <div className="border-2 border-dashed border-zinc-800 p-6 mb-8">
              <p className="text-[10px] font-mono text-zinc-600 uppercase mb-4 tracking-widest">Admin Instructions:</p>
              <ul className="space-y-2 text-[10px] font-mono text-zinc-500 uppercase list-disc list-inside">
                <li>Email is the global tracking key</li>
                <li>Single-chance logic is enforced at judge time</li>
                <li>Inventories fall back to digital points at zero</li>
                <li>Hunts process physical scan params synchronously</li>
              </ul>
           </div>

           <section className="bg-red-950/20 border-2 border-red-900 p-8">
              <div className="flex items-center gap-4 mb-4">
                 <ShieldAlert className="w-8 h-8 text-red-500 animate-pulse" />
                 <h2 className="text-xl font-black uppercase text-red-500 italic">Nuclear Reset Protocol</h2>
              </div>
              <p className="text-zinc-500 font-mono text-[10px] uppercase mb-6 leading-relaxed">
                Initiating this sequence will purge all user records, mission progress, and chaotic data. Admin identities persist but are zeroed.
              </p>
              <button 
                onClick={resetPlatform}
                className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-4 uppercase tracking-[0.2em] transition-colors"
              >
                Activate Atomic Purge
              </button>
           </section>
        </div>
      </div>
      )}

      {activeTab === 'claims' && (
        <div className="space-y-8">
          <section>
            <h2 className="text-2xl font-black uppercase italic mb-6 flex items-center gap-3">
              <Gift className="w-6 h-6 text-chaos-pink" /> Prize Claims Log
            </h2>
            <div className="bg-zinc-950 border-2 border-zinc-900 overflow-hidden">
              <table className="w-full text-left font-mono text-xs">
                <thead>
                  <tr className="bg-zinc-900 uppercase tracking-widest">
                    <th className="p-4">User</th>
                    <th className="p-4">Prize</th>
                    <th className="p-4">Type</th>
                    <th className="p-4">Allocation ID</th>
                    <th className="p-4">Claimed At</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900">
                  {prizeClaims.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-zinc-600 uppercase">
                        No prize claims yet
                      </td>
                    </tr>
                  ) : (
                    prizeClaims.map((claim) => (
                      <tr key={claim.id} className="hover:bg-white/5">
                        <td className="p-4 font-bold text-chaos-green">
                          {claim.user.username}
                          <br />
                          <span className="text-[10px] text-zinc-600">{claim.user.email}</span>
                        </td>
                        <td className="p-4 font-bold uppercase text-chaos-yellow">
                          {claim.inventory.name}
                          <br />
                          <span className="text-[10px] text-zinc-600">{claim.inventory.id}</span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-1 text-[10px] font-black uppercase ${
                            claim.claimType === 'mystery_gift' ? 'bg-chaos-pink/20 text-chaos-pink' :
                            claim.claimType === 'guaranteed' ? 'bg-chaos-green/20 text-chaos-green' :
                            'bg-chaos-yellow/20 text-chaos-yellow'
                          }`}>
                            {claim.claimType.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500 font-mono">
                          {claim.allocationId || 'N/A'}
                        </td>
                        <td className="p-4 text-zinc-500">
                          {new Date(claim.claimedAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs font-mono text-zinc-600 uppercase">
              <span>Total Claims: {prizeClaims.length}</span>
              <button
                onClick={loadPrizeClaims}
                className="px-4 py-2 bg-zinc-900 hover:bg-white hover:text-black font-black uppercase transition-colors"
              >
                <RefreshCcw className="w-3 h-3 inline mr-2" />
                Refresh
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
