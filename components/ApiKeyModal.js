'use client';

import { useState } from 'react';
import { TIMECAPSULE_BRAND } from '@/branding';

export default function ApiKeyModal({ onSave }) {
  const [previewKey, setPreviewKey] = useState('');
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loadingManaged, setLoadingManaged] = useState(false);

  const handleDirectSubmit = (e) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please enter your direct provider API key.');
      return;
    }
    localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.backendMode, 'direct');
    localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.apiKey, trimmed);
    onSave(trimmed);
  };

  const handleManagedMode = async (e) => {
    e.preventDefault();
    const trimmedPreviewKey = previewKey.trim();
    if (!trimmedPreviewKey) {
      setError('Private-preview access key is required for Managed BFF mode.');
      return;
    }

    setLoadingManaged(true);
    setError('');
    try {
      const res = await fetch('/api/v1/session', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Timecapsule-CSRF': '1',
        },
        body: JSON.stringify({ access_key: trimmedPreviewKey }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setError(data.error || `Private-preview authentication failed (${res.status})`);
        return;
      }
      localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.backendMode, 'bff');
      onSave('TIMECAPSULE_BFF');
    } catch (err) {
      setError(err.message || 'Unable to verify private-preview access key with server.');
    } finally {
      setLoadingManaged(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#121217] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 bg-[#00e5ff]/10 rounded-2xl flex items-center justify-center border border-[#00e5ff]/25 mb-6">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="1.75">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <h1 className="text-2xl font-black text-white uppercase tracking-wider mb-2">
            {TIMECAPSULE_BRAND.name}
          </h1>
          <p className="text-white/50 text-sm">
            {TIMECAPSULE_BRAND.tagline} — authenticate with a single-tenant private-preview key or connect a direct provider key.
          </p>
        </div>

        <div className="space-y-5">
          <form onSubmit={handleManagedMode} className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-[#00e5ff]/80 uppercase tracking-widest mb-1.5">
                Private-Preview Access Key (Single-Tenant BFF)
              </label>
              <input
                type="password"
                value={previewKey}
                onChange={(e) => {
                  setPreviewKey(e.target.value);
                  setError('');
                }}
                placeholder="Enter TIMECAPSULE_PREVIEW_KEY..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-[#00e5ff]/50 transition-colors"
                suppressHydrationWarning
              />
              <p className="mt-1 text-[11px] text-white/40">
                Single-tenant private-preview access only (not multi-tenant authentication).
              </p>
            </div>
            <button
              type="submit"
              disabled={loadingManaged}
              className="w-full bg-[#00e5ff] text-black font-black py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
            >
              {loadingManaged ? 'Verifying Access Key…' : 'Enter Private-Preview Studio →'}
            </button>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              or direct provider key
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <form onSubmit={handleDirectSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Direct Provider API Key (Kie.ai Parity)
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => {
                  setKey(e.target.value);
                  setError('');
                }}
                placeholder="Enter provider API key..."
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/25 focus:outline-none focus:border-[#00e5ff]/50 transition-colors"
                suppressHydrationWarning
              />
              {error && <p className="mt-2 text-red-400 text-xs">{error}</p>}
            </div>

            <button
              type="submit"
              className="w-full bg-white/10 text-white font-bold py-3 rounded-xl hover:bg-white/15 transition-colors cursor-pointer"
              suppressHydrationWarning
            >
              Launch with Direct Key
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
