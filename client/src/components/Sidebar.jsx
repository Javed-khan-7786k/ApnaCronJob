import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Clock,
  PlusCircle,
  Calendar,
  History,
  AlertOctagon,
  Send,
  Settings,
  ShieldAlert,
} from 'lucide-react';

const NAV_ITEMS = [
  { name: 'Dashboard', path: '/', icon: LayoutDashboard },
  { name: 'Jobs', path: '/jobs', icon: Clock },
  { name: 'Create Job', path: '/jobs/new', icon: PlusCircle },
  { name: 'Calendar', path: '/calendar', icon: Calendar },
  { name: 'Executions', path: '/executions', icon: History },
  { name: 'Failed Jobs', path: '/failed', icon: AlertOctagon },
  { name: 'Telegram Bot', path: '/telegram', icon: Send },
  { name: 'Settings', path: '/settings', icon: Settings },
  { name: 'Security & Audit', path: '/audit-logs', icon: ShieldAlert },
];

export function Sidebar({ isOpen, onClose }) {
  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/50 md:hidden backdrop-blur-xs"
        />
      )}

      <aside
        className={`fixed md:static inset-y-0 left-0 z-45 w-60 bg-slate-900 border-r border-slate-800 flex flex-col transition-transform duration-200 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        <div className="p-4 border-b border-slate-800">
          <div className="text-xs font-mono font-semibold uppercase tracking-wider text-slate-400">
            Navigation
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={() => onClose && onClose()}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-600/15 text-emerald-400 font-semibold border border-emerald-500/20'
                      : 'text-slate-300 hover:text-slate-100 hover:bg-slate-800'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-800 text-[11px] text-slate-500 font-mono">
          <div>Aapna Cron Job v1.0.0</div>
          <div className="text-slate-600">Render &bull; Atlas &bull; Telegram</div>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
