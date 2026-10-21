'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default function ExplorePage() {
  const [catalog, setCatalog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetch('/api/v1/models')
      .then((r) => r.json())
      .then((data) => {
        setCatalog(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const releaseModels = catalog?.release_catalog || [];
  const allModels = [
    ...(catalog?.catalog?.t2i || []),
    ...(catalog?.catalog?.t2v || []),
    ...(catalog?.catalog?.i2i || []),
    ...(catalog?.catalog?.i2v || []),
    ...(catalog?.catalog?.lipsync || []),
  ];

  const deduped = Array.from(new Map(allModels.map((m) => [m.id, m])).values());

  const filtered = deduped.filter((m) => {
    const matchesSearch =
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()) ||
      (m.provider && m.provider.toLowerCase().includes(search.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeTab === 'all') return true;
    if (activeTab === 'image') return ['image', 'i2i', 't2i'].includes(m.modality);
    if (activeTab === 'video') return ['video', 'i2v', 'v2v', 't2v'].includes(m.modality);
    if (activeTab === 'lipsync') return m.modality === 'lipsync';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <PlatformNav activeModule="explore" />

      {/* Hero Banner matching user screenshot */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#121217] to-[#09090b] border-b border-white/10 px-6 py-12 lg:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <span className="px-2.5 py-1 rounded-md bg-[#00e5ff] text-black font-black text-[11px] uppercase tracking-wider">
              Timecapsule Release
            </span>
            <span className="text-white/40 text-xs font-mono">Multi-Provider Engine v1.0</span>
            <ModuleStatusBadge status="working" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight max-w-3xl mb-4 leading-tight">
            Explore 29+ Multimodal AI Models on Timecapsule
          </h1>
          <p className="text-white/60 text-sm sm:text-base max-w-2xl mb-8 leading-relaxed">
            Unified access to state-of-the-art Image, Video, Lip-Sync, and Cinema generation engines. Protected by zero silent-fallback guarantees and durable credit ledgers.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link
              href="/studio?mode=preview"
              className="px-6 py-3 rounded-xl bg-[#00e5ff] text-black font-black text-sm hover:opacity-90 transition-opacity"
            >
              Open in Studio →
            </Link>
            <Link
              href="/docs"
              className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-sm transition-colors"
            >
              View API Contracts
            </Link>
          </div>
        </div>
      </section>

      {/* Filter Tabs & Search */}
      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0">
            {[
              { id: 'all', label: 'All Models' },
              { id: 'image', label: 'Image Models' },
              { id: 'video', label: 'Video Models' },
              { id: 'lipsync', label: 'Lip Sync' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#00e5ff] text-black shadow-[0_0_15px_rgba(0,229,255,0.3)]'
                    : 'bg-white/5 text-white/60 hover:text-white hover:bg-white/10'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by name or provider..."
              className="w-full bg-[#121217] border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-white/30 focus:outline-none focus:border-[#00e5ff]/50"
            />
          </div>
        </div>

        {/* Model Cards Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 rounded-2xl bg-white/5 animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((m) => (
              <div
                key={m.id}
                className="bg-[#121217] border border-white/10 hover:border-[#00e5ff]/40 rounded-2xl p-6 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-[#00e5ff] px-2 py-0.5 rounded bg-[#00e5ff]/10">
                      {m.modality}
                    </span>
                    <span className="text-[10px] font-mono text-white/40">
                      {m.estimated_credits ? `${m.estimated_credits} cr` : 'Dynamic'}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white mb-1 group-hover:text-[#00e5ff] transition-colors">
                    {m.name}
                  </h3>
                  <p className="text-xs font-mono text-white/40 mb-4 truncate">
                    ID: {m.id}
                  </p>
                </div>

                <div className="pt-4 border-t border-white/5 flex items-center justify-between">
                  <span className="text-[11px] text-white/50 flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    Provider: {m.provider}
                  </span>
                  <Link
                    href={`/studio?mode=preview`}
                    className="text-xs font-bold text-[#00e5ff] hover:underline"
                  >
                    Open →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <PlatformFooter />
    </div>
  );
}
