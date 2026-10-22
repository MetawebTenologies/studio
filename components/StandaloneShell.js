'use client';

import { useState, useEffect, useCallback } from 'react';
import { ImageStudio, VideoStudio, LipSyncStudio, CinemaStudio } from 'studio';
import { TIMECAPSULE_BRAND } from '@/branding';
import ApiKeyModal from './ApiKeyModal';

const TABS = [
  { id: 'library', label: 'Library' },
  { id: 'image', label: 'Image Studio' },
  { id: 'video', label: 'Video Studio' },
  { id: 'lipsync', label: 'Lip Sync' },
  { id: 'cinema', label: 'Cinema Studio' },
];

const STORAGE_KEY = TIMECAPSULE_BRAND.storageKeys.legacyApiKey;

export const SAMPLE_LIBRARY_ITEMS = [
  {
    id: 'sample_video_cinema_1',
    url: '/samples/demo.mp4',
    prompt: 'Cinematic wide shot of an astronaut navigating a misty glowing neon nebula, anamorphic lens 35mm f/1.4, volumetric lighting, photorealistic 8k',
    model: 'Veo 3.1 Cinema',
    kind: 'video',
    timestamp: '2026-10-21T18:00:00.000Z',
    provider: 'veo-sample',
  },
  {
    id: 'sample_image_nano_1',
    url: '/samples/sample_image_1.webp',
    prompt: 'High-fashion editorial portrait of a woman with bioluminescent crystal accents, ultra-sharp studio rim lighting, 85mm prime, dark aesthetic',
    model: 'Nano Banana Pro',
    kind: 'image',
    timestamp: '2026-10-21T17:30:00.000Z',
    provider: 'muapi-sample',
  },
  {
    id: 'sample_image_nano_2',
    url: '/samples/sample_image_2.webp',
    prompt: 'Hyper-detailed futuristic architectural pavilion with curving chrome pillars and reflecting pools at dusk',
    model: 'Seedream v4.5',
    kind: 'image',
    timestamp: '2026-10-21T16:45:00.000Z',
    provider: 'kie-sample',
  },
  {
    id: 'sample_image_banner_1',
    url: '/samples/sample_banner.png',
    prompt: 'Timecapsule Studio generative landscape concept art with glowing neon accents and cyberpunk horizon',
    model: 'Flux Schnell',
    kind: 'image',
    timestamp: '2026-10-21T15:00:00.000Z',
    provider: 'muapi-sample',
  },
];

function LibraryStudioView({ onNavigateTab, isPreviewMode }) {
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('all');
  const [previewState, setPreviewState] = useState('default'); // 'default' | 'loading' | 'empty' | 'error'

  const loadItems = useCallback(async () => {
    const collected = [];
    if (isPreviewMode) {
      collected.push(...SAMPLE_LIBRARY_ITEMS);
    }
    const localSources = [
      { key: 'studio_image_outputs', kind: 'image' },
      { key: 'studio_video_outputs', kind: 'video' },
      { key: 'studio_cinema_outputs', kind: 'video' },
      { key: 'studio_lipsync_outputs', kind: 'video' },
    ];
    for (const src of localSources) {
      try {
        const parsed = JSON.parse(localStorage.getItem(src.key) || '[]');
        if (Array.isArray(parsed)) {
          parsed.forEach((item) => {
            if (item && item.url) {
              collected.push({
                id: item.id || `${src.key}_${item.timestamp || Math.random()}`,
                url: item.url,
                prompt: item.prompt || '',
                model: item.model || src.kind,
                kind: item.type || src.kind,
                timestamp: item.timestamp || new Date().toISOString(),
              });
            }
          });
        }
      } catch {
        // ignore malformed local storage
      }
    }

    try {
      const res = await fetch('/api/v1/generations?limit=50');
      if (res.ok) {
        const data = await res.json();
        (data.items || []).forEach((job) => {
          if (job.output?.url) {
            collected.push({
              id: job.job_id,
              url: job.output.url,
              prompt: job.inputs?.prompt || '',
              model: job.model,
              kind: ['video', 'i2v', 'v2v', 'lipsync'].includes(job.modality) ? 'video' : 'image',
              timestamp: job.created_at,
              provider: job.provider,
            });
          }
        });
      }
    } catch {
      // BFF history optional in offline/direct mode
    }

    const dedup = new Map();
    collected.forEach((it) => {
      if (!dedup.has(it.id)) dedup.set(it.id, it);
    });
    const sorted = Array.from(dedup.values()).sort((a, b) =>
      String(a.timestamp) < String(b.timestamp) ? 1 : -1
    );
    setItems(sorted);
  }, [isPreviewMode]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const filtered = items.filter((it) => {
    if (filter === 'all') return true;
    return it.kind === filter;
  });

  return (
    <div className="h-full overflow-y-auto p-6 md:p-10 bg-[#09090b] text-white">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-black tracking-tight">Timecapsule Library</h2>
            <p className="text-white/50 text-sm">
              Unified media archive across Image, Video, Cinema, and Lip Sync studios.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isPreviewMode && (
              <div className="flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10 text-xs">
                <span className="text-white/40 px-2 font-bold uppercase tracking-wider text-[10px]">Preview State:</span>
                {[
                  { id: 'default', label: 'Default' },
                  { id: 'loading', label: 'Loading' },
                  { id: 'empty', label: 'Empty' },
                  { id: 'error', label: 'Error' },
                ].map((st) => (
                  <button
                    key={st.id}
                    onClick={() => setPreviewState(st.id)}
                    className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-colors ${
                      previewState === st.id
                        ? 'bg-amber-400 text-black'
                        : 'text-white/60 hover:text-white'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            )}
            <div className="flex items-center gap-2">
              {['all', 'image', 'video'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                    filter === f
                      ? 'bg-[#00e5ff] text-black'
                      : 'bg-white/5 text-white/60 hover:text-white'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {previewState === 'error' && (
          <div className="mb-6 p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
              <div>
                <p className="font-bold text-sm">Preview Simulation: Generation API Failure</p>
                <p className="text-xs text-red-300/80">Simulated 429 Provider Rate Limit with safe error redaction. No user credits were deducted.</p>
              </div>
            </div>
            <button
              onClick={() => setPreviewState('default')}
              className="text-xs bg-red-500/20 hover:bg-red-500/30 px-3 py-1.5 rounded-lg font-bold text-red-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}

        {previewState === 'loading' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="bg-[#121217] border border-white/10 rounded-2xl overflow-hidden flex flex-col animate-pulse"
              >
                <div className="aspect-video bg-white/5 flex items-center justify-center">
                  <span className="text-[#00e5ff] text-2xl animate-spin">◌</span>
                </div>
                <div className="p-4 space-y-2">
                  <div className="h-3 bg-white/10 rounded w-1/3" />
                  <div className="h-3 bg-white/5 rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : (previewState === 'empty' || filtered.length === 0) ? (
          <div className="border border-white/10 rounded-3xl p-12 text-center bg-[#121217]">
            <p className="text-white/60 text-base mb-4">
              No generated assets in your Timecapsule Library yet.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onNavigateTab('image')}
                className="px-5 py-2.5 rounded-xl bg-[#00e5ff] text-black font-bold text-sm"
              >
                Create Image
              </button>
              <button
                onClick={() => onNavigateTab('video')}
                className="px-5 py-2.5 rounded-xl bg-white/10 text-white font-bold text-sm hover:bg-white/15"
              >
                Create Video
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-[#121217] border border-white/10 rounded-2xl overflow-hidden flex flex-col"
              >
                <div className="aspect-video bg-black relative flex items-center justify-center overflow-hidden">
                  {item.kind === 'video' ? (
                    <video src={item.url} controls loop className="w-full h-full object-cover" />
                  ) : (
                    <img src={item.url} alt={item.prompt} className="w-full h-full object-cover" />
                  )}
                </div>
                <div className="p-4 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-[11px] text-[#00e5ff] font-bold uppercase">
                    <span>{item.model}</span>
                    <span>{item.kind}</span>
                  </div>
                  {item.prompt && (
                    <p className="text-xs text-white/70 line-clamp-2 mt-1">{item.prompt}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StandaloneShell({ hideHeader = false }) {
  const [apiKey, setApiKey] = useState(null);
  const [activeTab, setActiveTab] = useState('image');
  const [showSettings, setShowSettings] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);
  const [credits, setCredits] = useState(null);

  useEffect(() => {
    setHasMounted(true);
    const searchParams = new URLSearchParams(window.location.search);
    const isUrlPreview = searchParams.get('preview') === '1' || searchParams.get('mode') === 'preview';

    const mode = localStorage.getItem(TIMECAPSULE_BRAND.storageKeys.backendMode);
    const stored =
      localStorage.getItem(TIMECAPSULE_BRAND.storageKeys.apiKey) ||
      localStorage.getItem(STORAGE_KEY);
    if (isUrlPreview) {
      localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.backendMode, 'preview');
      setApiKey('TIMECAPSULE_OFFLINE_PREVIEW');
    } else if (mode === 'bff') {
      setApiKey('TIMECAPSULE_BFF');
    } else if (mode === 'preview') {
      setApiKey('TIMECAPSULE_OFFLINE_PREVIEW');
    } else if (stored) {
      setApiKey(stored);
    }
  }, []);

  const isPreviewMode = apiKey === 'TIMECAPSULE_OFFLINE_PREVIEW';
  const isManagedBff = apiKey === 'TIMECAPSULE_BFF';

  useEffect(() => {
    if (!hasMounted || !apiKey || isPreviewMode) return;
    fetch('/api/v1/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.credits) {
          setCredits(data.credits.available_credits);
        }
      })
      .catch(() => {});
  }, [hasMounted, apiKey, activeTab, isPreviewMode]);

  const handleKeySave = useCallback((key) => {
    if (key !== 'TIMECAPSULE_BFF' && key !== 'TIMECAPSULE_OFFLINE_PREVIEW') {
      localStorage.setItem(STORAGE_KEY, key);
      localStorage.setItem(TIMECAPSULE_BRAND.storageKeys.apiKey, key);
    }
    setApiKey(key);
  }, []);

  const handleKeyChange = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(TIMECAPSULE_BRAND.storageKeys.apiKey);
    localStorage.removeItem(TIMECAPSULE_BRAND.storageKeys.backendMode);
    setApiKey(null);
    setShowSettings(false);
  }, []);

  if (!hasMounted) {
    return (
      <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
        <div className="animate-spin text-[#00e5ff] text-3xl">◌</div>
      </div>
    );
  }

  if (!apiKey) {
    return <ApiKeyModal onSave={handleKeySave} />;
  }

  return (
    <div className="h-full bg-[#09090b] flex flex-col overflow-hidden">
      {!hideHeader && (
        <header className="flex-shrink-0 flex items-center justify-between px-4 pt-3 pb-2 border-b border-white/10 bg-[#09090b]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#09090b] border border-[#00e5ff]/40 flex items-center justify-center p-1.5 shadow-sm">
              <svg viewBox="0 0 240 240" className="w-full h-full" fill="none">
                <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA" />
                <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF" />
              </svg>
            </div>
            <span className="text-white font-black text-lg tracking-wider uppercase">
              {TIMECAPSULE_BRAND.name}
            </span>
          </div>

          <nav className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#00e5ff] text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            {credits !== null && (
              <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80 font-mono">
                <span className="w-2 h-2 rounded-full bg-[#00e5ff]" />
                {credits} cr
              </span>
            )}
            <span
              className={`hidden md:inline-block px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                isPreviewMode
                  ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                  : 'bg-[#00e5ff]/10 text-[#00e5ff]'
              }`}
            >
              {isPreviewMode ? 'UI Preview' : isManagedBff ? 'Managed BFF' : 'Direct Key'}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="text-white/60 hover:text-white text-sm transition-colors cursor-pointer"
            >
              ⚙ Settings
            </button>
          </div>
        </header>
      )}

      {hideHeader && (
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-2.5 border-b border-white/5 bg-[#09090b]">
          <nav className="flex items-center gap-1 overflow-x-auto">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-bold rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#00e5ff] text-black'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-xs">
            <span
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                isPreviewMode
                  ? 'bg-amber-400/15 text-amber-300 border border-amber-400/30'
                  : 'bg-[#00e5ff]/10 text-[#00e5ff]'
              }`}
            >
              {isPreviewMode ? 'Safe Offline Preview' : isManagedBff ? 'Managed BFF' : 'Direct Key'}
            </span>
            <button
              onClick={() => setShowSettings(true)}
              className="text-white/50 hover:text-white transition-colors cursor-pointer"
            >
              ⚙ Settings
            </button>
          </div>
        </div>
      )}

      {isPreviewMode && (
        <div className="flex-shrink-0 bg-amber-500/10 border-b border-amber-500/25 px-4 py-2 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            <span>
              <strong>Safe UI Preview Mode:</strong> Exploring studio interfaces and sample media offline. Live provider calls and private keys are disabled.
            </span>
          </div>
          <button
            onClick={() => setShowSettings(true)}
            className="underline hover:text-white font-medium ml-4 cursor-pointer"
          >
            Switch to Live Key
          </button>
        </div>
      )}

      <div className="flex-1 overflow-hidden">
        {activeTab === 'library' && (
          <LibraryStudioView onNavigateTab={setActiveTab} isPreviewMode={isPreviewMode} />
        )}
        {activeTab === 'image' && <ImageStudio apiKey={apiKey} />}
        {activeTab === 'video' && <VideoStudio apiKey={apiKey} />}
        {activeTab === 'lipsync' && <LipSyncStudio apiKey={apiKey} />}
        {activeTab === 'cinema' && <CinemaStudio apiKey={apiKey} />}
      </div>

      {showSettings && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-[#121217] border border-white/10 rounded-2xl p-8 w-full max-w-md">
            <h2 className="text-white font-bold text-xl mb-4">Timecapsule Settings</h2>
            <p className="text-white/60 text-sm mb-2">
              Mode:{' '}
              <span className="text-[#00e5ff] font-semibold">
                {isPreviewMode
                  ? 'Offline UI Preview (Zero Quota / Sample Media)'
                  : isManagedBff
                  ? 'Timecapsule Managed BFF (/api/v1)'
                  : 'Direct Provider Key'}
              </span>
            </p>
            {!isManagedBff && !isPreviewMode && (
              <p className="text-white/50 text-sm mb-6">
                Current Key: <span className="text-white/80 font-mono">{apiKey.slice(0, 6)}••••••••</span>
              </p>
            )}
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleKeyChange}
                className="flex-1 py-2.5 rounded-lg bg-[#00e5ff]/20 text-[#00e5ff] hover:bg-[#00e5ff]/30 text-sm font-bold transition-colors cursor-pointer"
              >
                Switch Mode / Key
              </button>
              <button
                onClick={() => setShowSettings(false)}
                className="flex-1 py-2.5 rounded-lg bg-white/5 text-white hover:bg-white/10 text-sm transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
