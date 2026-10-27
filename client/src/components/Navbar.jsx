import React, { useState, useEffect } from 'react';
import { Play, Activity, RefreshCw, User, LogOut, Menu, X, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';
import api from '../api/client.js';

export function Navbar({ onToggleSidebar, isSidebarOpen }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [ticking, setTicking] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { timeZone: 'Asia/Kolkata', hour12: false }) + ' IST');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleManualTick = async () => {
    try {
      setTicking(true);
      // Calls internal tick endpoint
      const res = await api.post('/internal/tick', {}, {
        headers: {
          'X-Tick-Secret': 'apna_tick_secret_backup_cron_2026', // matches default development secret
        }
      });
      const summary = res.data?.summary || {};
      showToast(`Tick executed: ${summary.claimed || 0} claimed, ${summary.retries || 0} retried`, 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Tick trigger failed', 'error');
    } finally {
      setTicking(false);
    }
  };

  return (
    <header className="h-14 border-b border-slate-800 bg-slate-900/90 backdrop-blur px-4 flex items-center justify-between sticky top-0 z-40">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800"
          aria-label="Toggle menu"
        >
          {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-emerald-600 flex items-center justify-center shadow-md shadow-emerald-950 font-bold text-white text-xs">
            ACJ
          </div>
          <div className="hidden sm:block">
            <h1 className="text-sm font-bold tracking-tight text-slate-100 flex items-center gap-1.5">
              Aapna Cron Job <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">PRO</span>
            </h1>
            <p className="text-[10px] text-slate-400 -mt-0.5">Reliable Cron & HTTP Automation</p>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* System Time */}
        <div className="hidden md:flex items-center gap-1.5 text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>{currentTime}</span>
        </div>

        {/* Quick Tick Trigger Button */}
        <button
          onClick={handleManualTick}
          disabled={ticking}
          title="Manually trigger scheduler tick and retry evaluation"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${ticking ? 'animate-spin' : ''}`} />
          <span className="hidden sm:inline">{ticking ? 'Ticking...' : 'Trigger Tick'}</span>
        </button>

        {/* User profile & Logout */}
        <div className="flex items-center gap-2 border-l border-slate-800 pl-4">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-semibold text-slate-200">{user?.username || 'User'}</span>
            <span className="text-[10px] text-slate-400 uppercase font-mono">{user?.role || 'Admin'}</span>
          </div>
          <button
            onClick={logout}
            title="Log out of Apna Scheduler"
            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
