'use client';

import { useState } from 'react';
import { TIMECAPSULE_BRAND } from '@/branding';

export default function ApiKeyModal({ onSave }) {
  const [key, setKey] = useState('');
  const [error, setError] = useState('');
  const [loadingManaged, setLoadingManaged] = useState(false);

  const handleDirectSubmit = (e) => {
    e.preventDefault();
    const trimmed = key.trim();
    if (!trimmed) {
      setError('Please enter your provider API key or choose Timecapsule Managed Mode below.');
      return;
    }
    localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.backendMode, 'direct');
    localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.apiKey, trimmed);
    onSave(trimmed);
  };

  const handleManagedMode = async () => {
    setLoadingManaged(true);
    setError('');
    try {
      const res = await fetch('/api/v1/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Timecapsule Creator' }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.token) {
        localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.sessionToken, data.token);
      }
      localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.backendMode, 'bff');
      onSave('TIMECAPSULE_BFF');
    } catch {
      localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.backendMode, 'bff');
      onSave('TIMECAPSULE_BFF');
    } finally {
      setLoadingManaged(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center px-4">
      <div className="w-full max-w-md bg-[#121217] border border-white/10 rounded-3xl p-8 shadow-2xl">
        <div className="flex flex-col items-center text-center mb-8">
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
            {TIMECAPSULE_BRAND.tagline} — launch with the managed Timecapsule BFF or connect a direct provider key.
          </p>
        </div>

        <div className="space-y-5">
          <button
            type="button"
            onClick={handleManagedMode}
            disabled={loadingManaged}
            className="w-full bg-[#00e5ff] text-black font-black py-3.5 rounded-xl hover:opacity-90 transition-opacity cursor-pointer"
          >
            {loadingManaged ? 'Connecting Session…' : 'Enter Timecapsule Managed Studio →'}
          </button>

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
              {error && <p className="mt-1 text-red-400 text-xs">{error}</p>}
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
