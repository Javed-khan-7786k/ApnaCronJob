import React, { useState } from 'react';
import { Settings as SettingsIcon, Key, Copy, Check, Lock, Download, Upload, Terminal, Shield } from 'lucide-react';
import api from '../api/client.js';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from '../context/ToastContext.jsx';

export function Settings() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [copiedSnippet, setCopiedSnippet] = useState('');

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showToast('New passwords do not match', 'warn');
      return;
    }
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters long', 'warn');
      return;
    }

    try {
      setSavingPassword(true);
      const res = await api.put('/auth/password', { currentPassword, newPassword });
      showToast(res.data.message || 'Password updated successfully', 'success');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to update password', 'error');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleExportJobs = async () => {
    try {
      const res = await api.get('/jobs?limit=500');
      if (res.data?.success) {
        const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(res.data.data, null, 2));
        const downloadAnchor = document.createElement('a');
        downloadAnchor.setAttribute('href', dataStr);
        downloadAnchor.setAttribute('download', `apna-scheduler-backup-${new Date().toISOString().slice(0, 10)}.json`);
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        downloadAnchor.remove();
        showToast('Exported jobs backup JSON file', 'success');
      }
    } catch {
      showToast('Failed to export jobs', 'error');
    }
  };

  const copyToClipboard = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopiedSnippet(label);
    showToast(`Copied ${label}`, 'success');
    setTimeout(() => setCopiedSnippet(''), 2000);
  };

  const tickCurlSnippet = `curl -X POST "https://your-scheduler-api.onrender.com/internal/tick" \\
  -H "X-Tick-Secret: your_internal_tick_secret_key_here"`;

  const githubActionsSnippet = `name: Apna Scheduler Backup Trigger

on:
  schedule:
    # Trigger tick every 10 minutes (backup for sleeping Render instance)
    - cron: '*/10 * * * *'
  workflow_dispatch:

jobs:
  tick:
    runs-on: ubuntu-latest
    steps:
      - name: Ping Internal Tick Endpoint
        run: |
          curl -s -X POST "\${{ secrets.SCHEDULER_API_URL }}/internal/tick" \\
            -H "X-Tick-Secret: \${{ secrets.INTERNAL_TICK_SECRET }}" \\
            --fail || echo "Tick completed or throttled"`;

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-xs">
      <div>
        <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
          <SettingsIcon className="w-5 h-5 text-emerald-400" /> Platform Settings & Automation Keys
        </h2>
        <p className="text-slate-400 mt-1">
          Configure external triggers, backup workflows, password credentials, and data exports
        </p>
      </div>

      {/* External Tick & Render Keepalive Integration */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" /> External Scheduler / Render Keepalive Trigger
          </h3>
          <span className="text-[11px] font-mono text-emerald-400">Endpoint: POST /internal/tick</span>
        </div>

        <p className="text-slate-300 leading-relaxed">
          On Render free-tier, your backend will sleep after 15 minutes of inactivity. When asleep, in-process timers cannot fire.
          Use a free external trigger (such as <b>GitHub Actions</b> or <b>UptimeRobot</b>) to ping <code>/internal/tick</code> every 5&ndash;10 minutes.
          This wakes your service and automatically executes any scheduled jobs that became due.
        </p>

        {/* cURL Snippet */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
            <span>cURL Command for External Polling:</span>
            <button
              onClick={() => copyToClipboard(tickCurlSnippet, 'cURL snippet')}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-normal"
            >
              {copiedSnippet === 'cURL snippet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet === 'cURL snippet' ? 'Copied' : 'Copy cURL'}</span>
            </button>
          </div>
          <pre className="terminal-window p-3 rounded-lg text-slate-200 font-mono text-[11px] overflow-x-auto">
            {tickCurlSnippet}
          </pre>
        </div>

        {/* GitHub Actions Snippet */}
        <div className="space-y-1.5 pt-2">
          <div className="flex items-center justify-between text-slate-400 font-semibold text-[11px]">
            <span>GitHub Actions Workflow (.github/workflows/scheduler-cron.yml):</span>
            <button
              onClick={() => copyToClipboard(githubActionsSnippet, 'GitHub Actions snippet')}
              className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-normal"
            >
              {copiedSnippet === 'GitHub Actions snippet' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedSnippet === 'GitHub Actions snippet' ? 'Copied' : 'Copy YAML'}</span>
            </button>
          </div>
          <pre className="terminal-window p-3 rounded-lg text-slate-300 font-mono text-[11px] overflow-x-auto max-h-48">
            {githubActionsSnippet}
          </pre>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
        <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-400" /> Security & Password
        </h3>

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-slate-300 font-medium mb-1">Current Password</label>
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-300 font-medium mb-1">Confirm New Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={savingPassword}
            className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors disabled:opacity-50"
          >
            {savingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>

      {/* Backup and Data Export */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
        <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
          <Download className="w-4 h-4 text-emerald-400" /> Backup & Data Export
        </h3>
        <p className="text-slate-400">
          Export your scheduled jobs and automation parameters into a JSON backup file for disaster recovery or migration.
        </p>
        <button
          onClick={handleExportJobs}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium border border-slate-700 transition-colors"
        >
          <Download className="w-4 h-4 text-emerald-400" /> Export Jobs as JSON
        </button>
      </div>
    </div>
  );
}

export default Settings;
