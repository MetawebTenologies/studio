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
          <div className="w-16 h-16 bg-[#09090b] rounded-2xl flex items-center justify-center border border-[#00e5ff]/30 p-3 mb-6 shadow-glow">
            <svg viewBox="0 0 240 240" width="40" height="40" className="w-full h-full" fill="none">
              <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA" />
              <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF" />
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
          <button
            type="button"
            onClick={() => {
              localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.backendMode, 'bff');
              onSave('TIMECAPSULE_BFF');
            }}
            className="w-full bg-[#00e5ff] text-black font-black py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-[#00e5ff]/20"
          >
            <span>Enter Studio with Account Credits</span>
            <span className="text-xs bg-black/20 px-2 py-0.5 rounded-full font-bold">Default</span>
          </button>

          <div className="flex items-center gap-3">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              or enter private preview key
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

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

          <div className="flex items-center gap-3">
            <div className="h-px bg-white/10 flex-1" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/30">
              or zero-quota preview
            </span>
            <div className="h-px bg-white/10 flex-1" />
          </div>

          <button
            type="button"
            onClick={() => {
              localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.backendMode, 'preview');
              onSave('TIMECAPSULE_OFFLINE_PREVIEW');
            }}
            className="w-full bg-[#00e5ff]/10 hover:bg-[#00e5ff]/20 border border-[#00e5ff]/30 text-[#00e5ff] font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
            Explore UI Preview with Sample Media
          </button>
        </div>
      </div>
    </div>
  );
}
