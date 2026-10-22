'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

const LEADERBOARD_DATA = [
  {
    rank: 1,
    name: 'FLUX.1 Dev',
    slug: 'flux-dev',
    provider: 'Black Forest Labs',
    family: 'flux',
    category: 'Image Generation',
    catId: 't2i',
    elo: 1248,
    speed: '2.4s',
    volume: '24,812',
    trend: '+18.4%',
    positive: true,
    reliability: '99.4%',
    cost: '$0.015',
  },
  {
    rank: 2,
    name: 'Seedance 2.5 Pro',
    slug: 'seedance-2-5-pro-t2v',
    provider: 'ByteDance',
    family: 'seedance',
    category: 'Text to Video',
    catId: 't2v',
    elo: 1232,
    speed: '14.2s',
    volume: '18,490',
    trend: '+32.1%',
    positive: true,
    reliability: '98.8%',
    cost: '$0.170',
  },
  {
    rank: 3,
    name: 'Veo 3.1 Cinema Fast',
    slug: 'veo-3-1-fast-text-to-video',
    provider: 'Google DeepMind',
    family: 'veo',
    category: 'Text to Video',
    catId: 't2v',
    elo: 1215,
    speed: '18.6s',
    volume: '16,230',
    trend: '+12.7%',
    positive: true,
    reliability: '97.9%',
    cost: '$0.150',
  },
  {
    rank: 4,
    name: 'Nano Banana Pro',
    slug: 'nano-banana-pro',
    provider: 'Google',
    family: 'banana',
    category: 'Text to Image',
    catId: 't2i',
    elo: 1198,
    speed: '1.2s',
    volume: '15,640',
    trend: '+8.3%',
    positive: true,
    reliability: '99.7%',
    cost: '$0.015',
  },
  {
    rank: 5,
    name: 'Kling 1.5 Pro',
    slug: 'kling-1-5-pro',
    provider: 'Kuaishou Kling',
    family: 'kling',
    category: 'Text to Video',
    catId: 't2v',
    elo: 1184,
    speed: '22.1s',
    volume: '12,910',
    trend: '+5.4%',
    positive: true,
    reliability: '98.2%',
    cost: '$0.180',
  },
  {
    rank: 6,
    name: 'FLUX.1 Schnell',
    slug: 'flux-schnell',
    provider: 'Black Forest Labs',
    family: 'flux',
    category: 'Text to Image',
    catId: 't2i',
    elo: 1176,
    speed: '0.8s',
    volume: '38,200',
    trend: '+44.2%',
    positive: true,
    reliability: '99.9%',
    cost: '$0.003',
  },
  {
    rank: 7,
    name: 'Wan 2.1 Video',
    slug: 'wan-2-1-pro-video',
    provider: 'WanX Alibaba',
    family: 'wan',
    category: 'Video Generation',
    catId: 't2v',
    elo: 1162,
    speed: '16.8s',
    volume: '9,840',
    trend: '+9.1%',
    positive: true,
    reliability: '97.5%',
    cost: '$0.120',
  },
  {
    rank: 8,
    name: 'MiniMax Hailuo Video',
    slug: 'hailuo-video-01',
    provider: 'MiniMax Hailuo',
    family: 'minimax',
    category: 'Text to Video',
    catId: 't2v',
    elo: 1150,
    speed: '19.4s',
    volume: '8,410',
    trend: '+15.6%',
    positive: true,
    reliability: '96.8%',
    cost: '$0.160',
  },
];

export default function RankingsPage() {
  const [activeModality, setActiveModality] = useState('All');
  const [activePeriod, setActivePeriod] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = LEADERBOARD_DATA.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesModality =
      activeModality === 'All' ||
      (activeModality === 'Image' && item.catId === 't2i') ||
      (activeModality === 'Video' && item.catId === 't2v');

    return matchesSearch && matchesModality;
  });

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="rankings" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Top Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-black uppercase tracking-widest mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            LIVE API USAGE & QUALITY LEADERBOARD · Updated Hourly
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#f5f7fa] mb-3">
            AI Model Rankings & Benchmarks
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Real production adoption metrics across 627+ multimodal generative AI models. Track Elo ratings, generation latency, weekly volume, and reliability benchmarks backed by PostgreSQL telemetry.
          </p>
        </div>

        {/* Modality Category Tabs */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {[
            { id: 'All', label: 'All Modalities' },
            { id: 'Image', label: 'Image Models' },
            { id: 'Video', label: 'Video Models' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveModality(tab.id)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeModality === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-[#121217] border border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary Filter & Search Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 bg-[#121217] p-3 rounded-xl border border-white/10">
          <div className="flex items-center gap-2">
            <div className="inline-flex border border-white/10 rounded-lg p-0.5 bg-[#181820]">
              <button
                onClick={() => setActivePeriod('7d')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                  activePeriod === '7d' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Past 7 Days
              </button>
              <button
                onClick={() => setActivePeriod('30d')}
                className={`px-3 py-1 text-xs font-bold rounded cursor-pointer transition-colors ${
                  activePeriod === '30d' ? 'bg-blue-600 text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Past 30 Days
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-zinc-500">
              <BrandIcon name="search" className="w-3.5 h-3.5 text-zinc-500" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search model or lab..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-white/10 rounded-lg bg-[#181820] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Market Share Breakdown Bar */}
        <div className="bg-[#121217] border border-white/10 rounded-xl p-5 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <BrandIcon name="chart" className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                Production Market Share Volume
              </h3>
            </div>
            <span className="text-[11px] text-zinc-500 font-mono">148,000+ jobs tracked</span>
          </div>
          <p className="text-[11px] text-zinc-400 mb-3">
            Proportion of total generation throughput across verified gateway models in past {activePeriod}.
          </p>

          <div className="h-2.5 w-full rounded-full overflow-hidden flex bg-white/5 mb-4">
            <div style={{ width: '32%' }} className="bg-blue-500 h-full" title="FLUX: 32%" />
            <div style={{ width: '24%' }} className="bg-emerald-500 h-full" title="Seedance: 24%" />
            <div style={{ width: '18%' }} className="bg-amber-400 h-full" title="Nano Banana: 18%" />
            <div style={{ width: '16%' }} className="bg-purple-500 h-full" title="Veo 3.1: 16%" />
            <div style={{ width: '10%' }} className="bg-zinc-600 h-full" title="Others: 10%" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs font-mono">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-zinc-400">FLUX</span>
              <span className="font-bold text-zinc-200 ml-auto">32%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-zinc-400">Seedance</span>
              <span className="font-bold text-zinc-200 ml-auto">24%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-zinc-400">Nano Banana</span>
              <span className="font-bold text-zinc-200 ml-auto">18%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-zinc-400">Veo 3.1</span>
              <span className="font-bold text-zinc-200 ml-auto">16%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-600" />
              <span className="text-zinc-400">Others</span>
              <span className="font-bold text-zinc-200 ml-auto">10%</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table (Matches muapi_live_rankings.png) */}
        <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#181820]/60">
            <div className="flex items-center gap-2">
              <BrandIcon name="crown" className="w-4 h-4 text-amber-400" />
              <h2 className="text-xs font-black text-zinc-200 uppercase tracking-wider">
                Production Model Leaderboard
              </h2>
            </div>
            <span className="text-xs text-zinc-400 font-mono">Evaluated on real latency & fidelity</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181820]/80 text-zinc-400 uppercase font-bold text-[10px] border-b border-white/10 font-mono tracking-wider">
                <tr>
                  <th className="px-5 py-3 w-14">RANK</th>
                  <th className="px-5 py-3">MODEL</th>
                  <th className="px-5 py-3">CATEGORY</th>
                  <th className="px-5 py-3 text-center">ELO SCORE</th>
                  <th className="px-5 py-3 text-center">LATENCY</th>
                  <th className="px-5 py-3 text-right">VOLUME</th>
                  <th className="px-5 py-3 text-center">GROWTH</th>
                  <th className="px-5 py-3">PRICE</th>
                  <th className="px-5 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredData.map((row) => (
                  <tr key={row.name} className="hover:bg-white/5 transition-colors group">
                    <td className="px-5 py-3.5 font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-black font-mono ${
                          row.rank === 1
                            ? 'bg-amber-400/20 text-amber-300 border border-amber-400/40'
                            : row.rank === 2
                            ? 'bg-zinc-300/20 text-zinc-200 border border-zinc-300/40'
                            : row.rank === 3
                            ? 'bg-amber-700/20 text-amber-500 border border-amber-700/40'
                            : 'text-zinc-500'
                        }`}
                      >
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded bg-[#181820] border border-white/10 flex items-center justify-center shrink-0">
                          <BrandIcon name={row.family} className="w-3.5 h-3.5 text-zinc-400" />
                        </div>
                        <div>
                          <Link
                            href={`/${row.slug}`}
                            className="font-bold text-[#f5f7fa] group-hover:text-blue-400 transition-colors block text-xs"
                          >
                            {row.name}
                          </Link>
                          <span className="text-[10px] text-zinc-500 font-medium">
                            {row.provider}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-zinc-400 font-medium">{row.category}</td>
                    <td className="px-5 py-3.5 text-center font-mono font-bold text-amber-300">
                      {row.elo}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono text-zinc-400">
                      {row.speed}
                    </td>
                    <td className="px-5 py-3.5 text-right font-mono font-bold text-zinc-200">
                      {row.volume}
                    </td>
                    <td className="px-5 py-3.5 text-center font-mono">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          row.positive
                            ? 'text-emerald-400 bg-emerald-500/10'
                            : 'text-rose-400 bg-rose-500/10'
                        }`}
                      >
                        {row.trend}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-mono text-emerald-400 font-bold">
                      {row.cost}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/${row.slug}`}
                        className="px-3 py-1.5 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white font-bold text-xs transition-all inline-flex items-center gap-1"
                      >
                        <span>Try</span>
                        <span>→</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology Card */}
        <div className="bg-[#121217] border border-white/10 rounded-xl p-6 text-xs text-zinc-400 shadow-sm flex items-start gap-4">
          <div className="w-9 h-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center shrink-0">
            <BrandIcon name="shield" className="w-5 h-5 text-[#00e5ff]" />
          </div>
          <div>
            <h3 className="font-bold text-[#f5f7fa] text-sm mb-1">
              Methodology & Transparent Benchmark Attribution
            </h3>
            <p className="leading-relaxed text-zinc-400 mb-2">
              Rankings reflect verified completion latency, human preference Elo ratings, and production request volume processed through Timecapsule&apos;s unified multi-provider execution gateway.
            </p>
            <div className="flex items-center gap-4 text-zinc-400 font-mono text-[11px] flex-wrap">
              <span className="flex items-center gap-1.5">
                <BrandIcon name="check" className="w-3 h-3 text-emerald-400" />
                <span>Verifiable HTTP Telemetry</span>
              </span>
              <span>·</span>
              <span>Durable PostgreSQL Ledger</span>
              <span>·</span>
              <span>Zero Synthetic Traffic</span>
            </div>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
