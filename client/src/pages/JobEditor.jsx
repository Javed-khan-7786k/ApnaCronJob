import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Play,
  RotateCw,
  Plus,
  Trash2,
  Calendar,
  Clock,
  ShieldCheck,
  Send,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';
import api from '../api/client.js';
import { useToast } from '../context/ToastContext.jsx';

const TIMEZONES = [
  'Asia/Kolkata',
  'UTC',
  'America/New_York',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Berlin',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Australia/Sydney',
];

const DAYS_OF_WEEK = [
  { label: 'Sun', value: 0 },
  { label: 'Mon', value: 1 },
  { label: 'Tue', value: 2 },
  { label: 'Wed', value: 3 },
  { label: 'Thu', value: 4 },
  { label: 'Fri', value: 5 },
  { label: 'Sat', value: 6 },
];

export function JobEditor() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [previews, setPreviews] = useState([]);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    tags: '',
    targetUrl: '',
    httpMethod: 'GET',
    headers: [{ key: '', value: '' }],
    body: '',
    expectedStatusCodes: '200, 201, 202, 204',
    responseValidationText: '',
    scheduleType: 'daily',
    scheduleTime: '09:00',
    daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri default
    daysOfMonth: [1],
    customCron: '*/15 * * * *',
    oneTimeRunAt: '',
    timezone: 'Asia/Kolkata',
    startDate: '',
    endDate: '',
    enabled: true,
    timeoutMs: 30000,
    maxAttempts: 10,
    delaySeconds: 5,
    strategy: 'fixed',
    retryOnHttp5xx: true,
    retryOn429: true,
    retryOnNetworkError: true,
    misfirePolicy: 'run-once',
    notifyOnSuccess: false,
    notifyOnFailure: true,
    notifyOnRetryExhausted: true,
    telegramChatId: '',
  });

  // Load existing job if editing
  useEffect(() => {
    if (!isEditing) return;

    async function fetchJob() {
      try {
        setLoading(true);
        const res = await api.get(`/jobs/${id}`);
        if (res.data?.success) {
          const job = res.data.data;

          // Convert headers Map or object to array
          const headerArr = [];
          if (job.headers) {
            for (const [k, v] of Object.entries(job.headers)) {
              headerArr.push({ key: k, value: String(v) });
            }
          }
          if (headerArr.length === 0) headerArr.push({ key: '', value: '' });

          setFormData({
            name: job.name || '',
            description: job.description || '',
            tags: Array.isArray(job.tags) ? job.tags.join(', ') : '',
            targetUrl: job.targetUrl || '',
            httpMethod: job.httpMethod || 'GET',
            headers: headerArr,
            body: job.body || '',
            expectedStatusCodes: Array.isArray(job.expectedStatusCodes) ? job.expectedStatusCodes.join(', ') : '200, 201, 202, 204',
            responseValidationText: job.responseValidation?.containsText || '',
            scheduleType: job.scheduleType || 'daily',
            scheduleTime: job.scheduleTime || '09:00',
            daysOfWeek: Array.isArray(job.daysOfWeek) ? job.daysOfWeek : [1, 2, 3, 4, 5],
            daysOfMonth: Array.isArray(job.daysOfMonth) ? job.daysOfMonth : [1],
            customCron: job.customCron || '*/15 * * * *',
            oneTimeRunAt: job.oneTimeRunAt ? new Date(job.oneTimeRunAt).toISOString().slice(0, 16) : '',
            timezone: job.timezone || 'Asia/Kolkata',
            startDate: job.startDate ? new Date(job.startDate).toISOString().slice(0, 16) : '',
            endDate: job.endDate ? new Date(job.endDate).toISOString().slice(0, 16) : '',
            enabled: job.enabled !== false,
            timeoutMs: job.timeoutMs || 30000,
            maxAttempts: job.retryPolicy?.maxAttempts || 10,
            delaySeconds: job.retryPolicy?.delaySeconds || 5,
            strategy: job.retryPolicy?.strategy || 'fixed',
            retryOnHttp5xx: job.retryPolicy?.retryOnHttp5xx !== false,
            retryOn429: job.retryPolicy?.retryOn429 !== false,
            retryOnNetworkError: job.retryPolicy?.retryOnNetworkError !== false,
            misfirePolicy: job.misfirePolicy || 'run-once',
            notifyOnSuccess: !!job.notificationSettings?.notifyOnSuccess,
            notifyOnFailure: job.notificationSettings?.notifyOnFailure !== false,
            notifyOnRetryExhausted: job.notificationSettings?.notifyOnRetryExhausted !== false,
            telegramChatId: job.notificationSettings?.telegramChatId || '',
          });
        }
      } catch (err) {
        showToast('Failed to load job details', 'error');
        navigate('/jobs');
      } finally {
        setLoading(false);
      }
    }

    fetchJob();
  }, [id, isEditing]);

  // Update schedule preview dynamically
  useEffect(() => {
    async function updateSchedulePreview() {
      try {
        const payload = {
          scheduleType: formData.scheduleType,
          scheduleTime: formData.scheduleTime,
          daysOfWeek: formData.daysOfWeek,
          daysOfMonth: formData.daysOfMonth,
          customCron: formData.customCron,
          oneTimeRunAt: formData.oneTimeRunAt ? new Date(formData.oneTimeRunAt).toISOString() : null,
          timezone: formData.timezone,
          endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        };
        const res = await api.post('/jobs/preview-schedule', payload);
        if (res.data?.success) {
          setPreviews(res.data.previews || []);
        }
      } catch {
        setPreviews([]);
      }
    }
    updateSchedulePreview();
  }, [
    formData.scheduleType,
    formData.scheduleTime,
    formData.daysOfWeek,
    formData.daysOfMonth,
    formData.customCron,
    formData.oneTimeRunAt,
    formData.timezone,
    formData.endDate,
  ]);

  const handleHeaderChange = (index, field, value) => {
    const updated = [...formData.headers];
    updated[index][field] = value;
    setFormData({ ...formData, headers: updated });
  };

  const addHeaderRow = () => {
    setFormData({
      ...formData,
      headers: [...formData.headers, { key: '', value: '' }],
    });
  };

  const removeHeaderRow = (index) => {
    const updated = formData.headers.filter((_, i) => i !== index);
    setFormData({ ...formData, headers: updated.length ? updated : [{ key: '', value: '' }] });
  };

  const toggleDayOfWeek = (dayVal) => {
    const current = [...formData.daysOfWeek];
    const exists = current.includes(dayVal);
    const updated = exists ? current.filter((d) => d !== dayVal) : [...current, dayVal];
    setFormData({ ...formData, daysOfWeek: updated.sort() });
  };

  // Test request live without saving
  const handleTestRequest = async () => {
    if (!formData.targetUrl) {
      showToast('Please enter a target URL first', 'warn');
      return;
    }

    try {
      setTesting(true);
      setTestResult(null);

      const headerObj = {};
      formData.headers.forEach((h) => {
        if (h.key.trim()) headerObj[h.key.trim()] = h.value;
      });

      const statusArray = formData.expectedStatusCodes
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      const res = await api.post('/jobs/test-request', {
        url: formData.targetUrl,
        method: formData.httpMethod,
        headers: headerObj,
        body: formData.body,
        timeoutMs: formData.timeoutMs,
        expectedStatusCodes: statusArray.length ? statusArray : [200, 201, 202, 204],
      });

      setTestResult(res.data.result);
      if (res.data.result.success) {
        showToast(`Test Succeeded: HTTP ${res.data.result.statusCode} (${res.data.result.durationMs}ms)`, 'success');
      } else {
        showToast(`Test Failed: ${res.data.result.error}`, 'warn');
      }
    } catch (err) {
      showToast(err.response?.data?.error || err.message, 'error');
    } finally {
      setTesting(false);
    }
  };

  // Save Job to DB
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      showToast('Job name is required', 'warn');
      return;
    }
    if (!formData.targetUrl.trim()) {
      showToast('Target URL is required', 'warn');
      return;
    }

    try {
      setSaving(true);

      const headerObj = {};
      formData.headers.forEach((h) => {
        if (h.key.trim()) headerObj[h.key.trim()] = h.value;
      });

      const statusArray = formData.expectedStatusCodes
        .split(',')
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => !isNaN(n));

      const tagsArray = formData.tags
        .split(',')
        .map((t) => t.trim().toLowerCase())
        .filter(Boolean);

      const payload = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        tags: tagsArray,
        targetUrl: formData.targetUrl.trim(),
        httpMethod: formData.httpMethod,
        headers: headerObj,
        body: formData.body,
        expectedStatusCodes: statusArray.length ? statusArray : [200, 201, 202, 204],
        responseValidation: {
          containsText: formData.responseValidationText.trim(),
        },
        scheduleType: formData.scheduleType,
        scheduleTime: formData.scheduleTime,
        daysOfWeek: formData.daysOfWeek,
        daysOfMonth: formData.daysOfMonth,
        customCron: formData.customCron.trim(),
        oneTimeRunAt: formData.oneTimeRunAt ? new Date(formData.oneTimeRunAt).toISOString() : null,
        timezone: formData.timezone,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : null,
        endDate: formData.endDate ? new Date(formData.endDate).toISOString() : null,
        enabled: formData.enabled,
        timeoutMs: Number(formData.timeoutMs),
        retryPolicy: {
          maxAttempts: Number(formData.maxAttempts),
          delaySeconds: Number(formData.delaySeconds),
          strategy: formData.strategy,
          retryOnHttp5xx: formData.retryOnHttp5xx,
          retryOn429: formData.retryOn429,
          retryOnNetworkError: formData.retryOnNetworkError,
        },
        misfirePolicy: formData.misfirePolicy,
        notificationSettings: {
          notifyOnSuccess: formData.notifyOnSuccess,
          notifyOnFailure: formData.notifyOnFailure,
          notifyOnRetryExhausted: formData.notifyOnRetryExhausted,
          telegramChatId: formData.telegramChatId.trim(),
        },
      };

      if (isEditing) {
        await api.put(`/jobs/${id}`, payload);
        showToast('Job updated successfully', 'success');
      } else {
        await api.post('/jobs', payload);
        showToast('Job scheduled successfully', 'success');
      }

      navigate('/jobs');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to save job configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RotateCw className="w-6 h-6 animate-spin text-emerald-400" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            to="/jobs"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-100">
              {isEditing ? 'Edit Scheduled Job' : 'Create Scheduled Job'}
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Specify HTTP endpoint, recurrence interval, retries, and failure alerts
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Saving...' : isEditing ? 'Update Job' : 'Save Job'}
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 text-xs">
        {/* Section 1: General Details */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
            1. Job Identification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Job Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Render Backend Keepalive Ping"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Tags <span className="text-slate-500 font-normal">(comma-separated)</span>
              </label>
              <input
                type="text"
                placeholder="render, keepalive, production"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-slate-300 font-medium mb-1">Description</label>
              <input
                type="text"
                placeholder="Optional purpose, owner, or target backend notes..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: HTTP Automation Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-sm font-bold text-slate-200">
              2. Target HTTP Request & Automation
            </h3>
            <button
              type="button"
              onClick={handleTestRequest}
              disabled={testing}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors disabled:opacity-50"
            >
              <Play className={`w-3.5 h-3.5 text-emerald-400 ${testing ? 'animate-spin' : ''}`} />
              {testing ? 'Testing...' : 'Test Request Live'}
            </button>
          </div>

          {/* Test Result Live Banner */}
          {testResult && (
            <div className={`p-3.5 rounded-lg border text-xs font-mono space-y-1.5 ${
              testResult.success
                ? 'bg-emerald-950/20 border-emerald-800/40 text-emerald-200'
                : 'bg-rose-950/20 border-rose-800/40 text-rose-200'
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span>
                  {testResult.success ? '✅ Test Succeeded' : '❌ Test Failed'} &bull; HTTP {testResult.statusCode || 'N/A'} ({testResult.durationMs}ms)
                </span>
                <span className="text-slate-400">{testResult.isRetryable ? 'Retryable' : 'Terminal'}</span>
              </div>
              {testResult.error && <div>Error: {testResult.error}</div>}
              {testResult.body && (
                <div className="terminal-window p-2 rounded text-[11px] max-h-24 overflow-y-auto mt-1 text-slate-300">
                  {testResult.body}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-6 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-slate-300 font-medium mb-1">Method</label>
              <select
                value={formData.httpMethod}
                onChange={(e) => setFormData({ ...formData, httpMethod: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 font-mono font-bold focus:outline-none focus:border-emerald-500"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="PUT">PUT</option>
                <option value="PATCH">PATCH</option>
                <option value="DELETE">DELETE</option>
                <option value="HEAD">HEAD</option>
              </select>
            </div>

            <div className="sm:col-span-5">
              <label className="block text-slate-300 font-medium mb-1">
                Target URL <span className="text-rose-400">*</span>
              </label>
              <input
                type="url"
                required
                placeholder="https://your-service.onrender.com/api/ping"
                value={formData.targetUrl}
                onChange={(e) => setFormData({ ...formData, targetUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Request Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-slate-300 font-medium">Custom Request Headers</label>
              <button
                type="button"
                onClick={addHeaderRow}
                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-semibold"
              >
                <Plus className="w-3.5 h-3.5" /> Add Header
              </button>
            </div>
            <div className="space-y-2">
              {formData.headers.map((hdr, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Header Key (e.g. Authorization)"
                    value={hdr.key}
                    onChange={(e) => handleHeaderChange(idx, 'key', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <input
                    type="text"
                    placeholder="Header Value (e.g. Bearer token_xyz)"
                    value={hdr.value}
                    onChange={(e) => handleHeaderChange(idx, 'value', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="button"
                    onClick={() => removeHeaderRow(idx)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Request Body */}
          {['POST', 'PUT', 'PATCH'].includes(formData.httpMethod) && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                JSON Request Body <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <textarea
                rows={4}
                placeholder='{"ping": "hello", "source": "apna-scheduler"}'
                value={formData.body}
                onChange={(e) => setFormData({ ...formData, body: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Status Validation & Response Check */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Expected Status Codes
              </label>
              <input
                type="text"
                placeholder="200, 201, 202, 204"
                value={formData.expectedStatusCodes}
                onChange={(e) => setFormData({ ...formData, expectedStatusCodes: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Response Validation <span className="text-slate-500 font-normal">(must contain string)</span>
              </label>
              <input
                type="text"
                placeholder='e.g. "status":"ok" or "pong"'
                value={formData.responseValidationText}
                onChange={(e) => setFormData({ ...formData, responseValidationText: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Recurrence & Scheduling Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center justify-between">
            <span>3. Recurrence & Schedule Engine</span>
            <span className="text-[11px] text-emerald-400 font-normal font-mono">Timezone: {formData.timezone}</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Schedule Type</label>
              <select
                value={formData.scheduleType}
                onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="custom">Custom Cron</option>
                <option value="once">One-Time Run</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Timezone</label>
              <select
                value={formData.timezone}
                onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
            </div>

            {['daily', 'weekly', 'monthly'].includes(formData.scheduleType) && (
              <div>
                <label className="block text-slate-300 font-medium mb-1">Execution Time (24h)</label>
                <input
                  type="time"
                  value={formData.scheduleTime}
                  onChange={(e) => setFormData({ ...formData, scheduleTime: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
                />
              </div>
            )}
          </div>

          {/* Weekly Days Selector */}
          {formData.scheduleType === 'weekly' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1.5">Repeat On Days</label>
              <div className="flex flex-wrap gap-2">
                {DAYS_OF_WEEK.map((day) => {
                  const selected = formData.daysOfWeek.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      onClick={() => toggleDayOfWeek(day.value)}
                      className={`px-3 py-1.5 rounded-lg font-medium transition-colors ${
                        selected
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {day.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Custom Cron Input */}
          {formData.scheduleType === 'custom' && (
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-300 font-medium">Cron Expression (min hr dom mon dow)</label>
                <span className="text-[11px] text-slate-500 font-mono">e.g. */10 * * * *</span>
              </div>
              <input
                type="text"
                placeholder="*/15 * * * *"
                value={formData.customCron}
                onChange={(e) => setFormData({ ...formData, customCron: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* One Time Date Picker */}
          {formData.scheduleType === 'once' && (
            <div>
              <label className="block text-slate-300 font-medium mb-1">Run Exactly At</label>
              <input
                type="datetime-local"
                value={formData.oneTimeRunAt}
                onChange={(e) => setFormData({ ...formData, oneTimeRunAt: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>
          )}

          {/* Next Runs Preview Box */}
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1.5">
            <div className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-emerald-400" /> Next Upcoming Run Times Preview
            </div>
            {previews.length === 0 ? (
              <div className="text-[11px] text-slate-500 italic">No upcoming executions matching schedule.</div>
            ) : (
              <div className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {previews.map((prev, idx) => (
                  <div key={idx} className="py-1 flex items-center justify-between text-slate-300">
                    <span>{idx + 1}. {prev.formatted}</span>
                    <span className="text-slate-500 text-[10px]">{prev.relative}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Retry Policy & Recovery Engine */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2">
            4. Retry Engine & Misfire Policy
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-slate-300 font-medium mb-1">Max Total Attempts (1-10)</label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.maxAttempts}
                onChange={(e) => setFormData({ ...formData, maxAttempts: parseInt(e.target.value, 10) || 10 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Retry Delay (seconds)</label>
              <input
                type="number"
                min={1}
                max={3600}
                value={formData.delaySeconds}
                onChange={(e) => setFormData({ ...formData, delaySeconds: parseInt(e.target.value, 10) || 5 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Backoff Strategy</label>
              <select
                value={formData.strategy}
                onChange={(e) => setFormData({ ...formData, strategy: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="fixed">Fixed Delay (5s default)</option>
                <option value="exponential">Exponential with Jitter</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-medium mb-1">Misfire Policy</label>
              <select
                value={formData.misfirePolicy}
                onChange={(e) => setFormData({ ...formData, misfirePolicy: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="run-once">Run Once on Wakeup</option>
                <option value="skip">Skip Missed Runs</option>
                <option value="run-all">Run All Missed Occurrences</option>
              </select>
            </div>
          </div>

          <div className="flex flex-wrap gap-4 pt-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.retryOnHttp5xx}
                onChange={(e) => setFormData({ ...formData, retryOnHttp5xx: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
              />
              <span>Retry on HTTP 5xx Server Errors</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.retryOn429}
                onChange={(e) => setFormData({ ...formData, retryOn429: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
              />
              <span>Retry on HTTP 429 Rate Limits</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer text-slate-300">
              <input
                type="checkbox"
                checked={formData.retryOnNetworkError}
                onChange={(e) => setFormData({ ...formData, retryOnNetworkError: e.target.checked })}
                className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
              />
              <span>Retry on Network Timeouts</span>
            </label>
          </div>
        </div>

        {/* Section 5: Telegram Notifications */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
          <h3 className="text-sm font-bold text-slate-200 border-b border-slate-800 pb-2 flex items-center gap-2">
            <Send className="w-4 h-4 text-sky-400" /> 5. Telegram Notifications
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 font-medium mb-1">
                Telegram Chat ID Override <span className="text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Leave blank to use default system Telegram chat"
                value={formData.telegramChatId}
                onChange={(e) => setFormData({ ...formData, telegramChatId: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.notifyOnFailure}
                  onChange={(e) => setFormData({ ...formData, notifyOnFailure: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
                />
                <span>Alert on Execution Attempt Failures</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.notifyOnRetryExhausted}
                  onChange={(e) => setFormData({ ...formData, notifyOnRetryExhausted: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
                />
                <span>Alert when All 10 Retries are Exhausted</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.notifyOnSuccess}
                  onChange={(e) => setFormData({ ...formData, notifyOnSuccess: e.target.checked })}
                  className="rounded bg-slate-950 border-slate-800 text-emerald-600 focus:ring-0"
                />
                <span>Notify on Every Successful Run (Verbose)</span>
              </label>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <Link
            to="/jobs"
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : isEditing ? 'Update Job' : 'Schedule Job'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default JobEditor;
