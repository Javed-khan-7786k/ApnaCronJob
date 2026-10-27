import React, { useState, useEffect } from 'react';
import { Send, CheckCircle2, AlertCircle, Copy, Check, Terminal, ExternalLink, ShieldCheck } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function TelegramConfig() {
  const { user, setUser } = useAuth();
  const { showToast } = useToast();
  const [chatId, setChatId] = useState(user?.telegramChatId || '');
  const [notificationsEnabled, setNotificationsEnabled] = useState(user?.telegramNotificationsEnabled !== false);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [botInfo, setBotInfo] = useState(null);
  const [copiedCmd, setCopiedCmd] = useState('');

  useEffect(() => {
    async function loadInfo() {
      try {
        const res = await api.get('/telegram/info');
        if (res.data?.success) {
          setBotInfo(res.data.data);
        }
      } catch {
        // quiet
      }
    }
    loadInfo();
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await api.put('/auth/profile', {
        telegramChatId: chatId.trim(),
        telegramNotificationsEnabled: notificationsEnabled,
      });
      if (res.data?.success) {
        setUser(res.data.user);
        showToast('Telegram preferences saved successfully', 'success');
      }
    } catch (err) {
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSendTestMessage = async () => {
    if (!chatId.trim()) {
      showToast('Please enter your Telegram Chat ID first', 'warn');
      return;
    }
    try {
      setTesting(true);
      const res = await api.post('/telegram/test', { chatId: chatId.trim() });
      showToast(res.data?.message || 'Test message sent to Telegram!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to dispatch test message. Verify Bot Token in .env', 'error');
    } finally {
      setTesting(false);
    }
  };

  const copyCommand = (cmd) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    showToast(`Copied ${cmd}`, 'info');
    setTimeout(() => setCopiedCmd(''), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <Send className="w-5 h-5 text-sky-400" /> Aapna Cron Job & Telegram Alerts
        </h2>
        <p className="text-slate-400 mt-1">
          Control scheduled tasks from Telegram and receive instant failure and recovery notifications
        </p>
      </div>

      {/* Integration Status Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <span>Bot Configuration Status</span>
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              botInfo?.isConfigured
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}>
              {botInfo?.isConfigured ? 'Bot Token Detected' : 'Token Missing in .env'}
            </span>
          </div>
          <p className="text-slate-400">
            Active Mode: <span className="font-mono text-slate-200">{botInfo?.mode || 'none'}</span> &bull; Allowed Admins: {botInfo?.allowedChatsConfigured || 0}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSendTestMessage}
          disabled={testing}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-semibold shadow-sm transition-colors disabled:opacity-50 shrink-0"
        >
          <Send className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
          {testing ? 'Sending...' : 'Send Test Alert'}
        </button>
      </div>

      {/* Form: Chat ID & Preferences */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
          Your Telegram Account Settings
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="max-w-md">
            <label className="block text-slate-300 font-medium mb-1">
              Your Telegram Chat ID
            </label>
            <input
              type="text"
              placeholder="e.g. 123456789"
              value={chatId}
              onChange={(e) => setChatId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              To find your Telegram Chat ID, start a conversation with <code>@userinfobot</code> or <code>@raw_data_bot</code> on Telegram.
            </p>
          </div>

          <div className="pt-1">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={notificationsEnabled}
                onChange={(e) => setNotificationsEnabled(e.target.checked)}
                className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
              />
              <span>Enable instant notifications for failed executions and retries</span>
            </label>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Telegram Settings'}
            </button>
          </div>
        </form>
      </div>

      {/* Bot Commands Cheatsheet */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" /> Supported Telegram Bot Commands
        </h3>
        <p className="text-slate-400">
          Once your bot is running, you can send any of the following commands in Telegram to control your scheduler:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-2">
          {[
            { cmd: '/status', desc: 'Check health of API, MongoDB connection, and scheduler engine' },
            { cmd: '/jobs', desc: 'List active and paused scheduled jobs with their IDs' },
            { cmd: '/next', desc: 'Show upcoming executions scheduled across all jobs' },
            { cmd: '/run <JOB_ID>', desc: 'Trigger immediate manual execution of a specific job' },
            { cmd: '/pause <JOB_ID>', desc: 'Pause a scheduled job to temporarily stop executions' },
            { cmd: '/resume <JOB_ID>', desc: 'Resume and recompute the next schedule for a paused job' },
            { cmd: '/history', desc: 'View summary of the 5 most recent HTTP runs' },
            { cmd: '/failed', desc: 'Inspect the latest failed jobs and error messages' },
          ].map((item) => (
            <div
              key={item.cmd}
              onClick={() => copyCommand(item.cmd)}
              className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 hover:border-slate-700 flex items-center justify-between cursor-pointer transition-colors"
            >
              <div>
                <div className="font-mono text-emerald-400 font-semibold">{item.cmd}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{item.desc}</div>
              </div>
              {copiedCmd === item.cmd ? (
                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 ml-2" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-600 shrink-0 ml-2 hover:text-slate-300" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default TelegramConfig;
