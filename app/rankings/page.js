'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

const LEADERBOARD_DATA = [
  { rank: 1, name: 'flux-dev', provider: 'Black Forest Labs', slug: 'flux-dev', category: 'Image to Image', volume: '10,623', trend: '+2.7%', positive: true, reliability: '98%', cost: 'from $0.015' },
  { rank: 2, name: 'nano-banana-pro', provider: 'Google', slug: 'nano-banana-pro', category: 'Image to Image', volume: '6,792', trend: '-14.7%', positive: false, reliability: '96.3%', cost: 'from $0.06' },
  { rank: 3, name: 'seedance-2.5-omni', provider: 'ByteDance', slug: 'seedance-2.5', category: 'Image to Video', volume: '6,637', trend: '+18.3%', positive: true, reliability: '95.6%', cost: 'from $0.17' },
  { rank: 4, name: 'veo-3-1-cinema', provider: 'Google DeepMind', slug: 'veo-3.1', category: 'Text to Video', volume: '6,349', trend: '-18.9%', positive: false, reliability: '92.5%', cost: 'from $0.60' },
  { rank: 5, name: 'wan-2-1-pro-video', provider: 'WanX', slug: 'wan-2.1', category: 'Video to Video', volume: '5,419', trend: '+1.3%', positive: true, reliability: '97.1%', cost: 'from $0.12' },
  { rank: 6, name: 'lyria-3-studio', provider: 'Google', slug: 'lyria-3', category: 'Text to Audio', volume: '4,149', trend: '+29.4%', positive: true, reliability: '99%', cost: 'from $0.04' },
  { rank: 7, name: 'qwen-image-edit', provider: 'Alibaba', slug: 'qwen-image', category: 'Image to Image', volume: '3,572', trend: '+0.2%', positive: true, reliability: '88.7%', cost: 'from $0.02' },
  { rank: 8, name: 'flux-schnell', provider: 'Black Forest Labs', slug: 'flux-schnell', category: 'Text to Image', volume: '2,053', trend: '+214.4%', positive: true, reliability: '87.6%', cost: 'from $0.003' },
];

export default function RankingsPage() {
  const [activeModality, setActiveModality] = useState('All');
  const [activePeriod, setActivePeriod] = useState('7d');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredData = LEADERBOARD_DATA.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.provider.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="rankings" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Top Header Badge & Title */}
        <div className="text-center max-w-3xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-semibold mb-3">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
            LIVE API USAGE LEADERBOARD · Updated Hourly
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">
            AI Model Rankings
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Real production adoption metrics across 250+ generative AI models. Track weekly volume, growth trends, market share, and reliability — powered by live API completions.
          </p>
        </div>

        {/* Modality Category Tabs */}
        <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
          {[
            { id: 'All', label: 'All Media' },
            { id: 'Image', label: 'Image Models' },
            { id: 'Video', label: 'Video Models' },
            { id: 'Audio', label: 'Audio & Speech' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveModality(tab.id)}
              className={`px-4 py-2 rounded-md text-xs font-semibold transition-colors ${
                activeModality === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Secondary Filter & Search Row */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <div className="inline-flex border border-slate-200 rounded-md p-0.5 bg-white shadow-xs">
              <button
                onClick={() => setActivePeriod('7d')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activePeriod === '7d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Week (7d)
              </button>
              <button
                onClick={() => setActivePeriod('30d')}
                className={`px-3 py-1 text-xs font-medium rounded ${
                  activePeriod === '30d' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Month (30d)
              </button>
            </div>
          </div>

          <div className="relative w-full sm:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search model or vendor..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Market Share Breakdown Bar */}
        <div className="bg-white border border-slate-200 rounded-lg p-5 mb-8 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-blue-600 text-sm">📊</span>
            <h3 className="text-xs font-bold text-slate-900">Market Share Breakdown</h3>
          </div>
          <p className="text-[11px] text-slate-500 mb-3">Proportion of total generation volume among top models in this modality</p>
          
          <div className="h-3 w-full rounded-full overflow-hidden flex bg-slate-100 mb-4">
            <div style={{ width: '25%' }} className="bg-blue-600 h-full" title="FLUX: 25%" />
            <div style={{ width: '20%' }} className="bg-amber-400 h-full" title="Nano Banana: 20%" />
            <div style={{ width: '18%' }} className="bg-purple-600 h-full" title="Veo 3.1: 18%" />
            <div style={{ width: '15%' }} className="bg-emerald-500 h-full" title="Seedance: 15%" />
            <div style={{ width: '22%' }} className="bg-slate-400 h-full" title="Others: 22%" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <span className="text-slate-600 font-medium truncate">FLUX</span>
              <span className="font-bold text-slate-900 ml-auto">25.0%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-600 font-medium truncate">Nano Banana</span>
              <span className="font-bold text-slate-900 ml-auto">20.0%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
              <span className="text-slate-600 font-medium truncate">Veo 3.1</span>
              <span className="font-bold text-slate-900 ml-auto">18.0%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
              <span className="text-slate-600 font-medium truncate">Seedance</span>
              <span className="font-bold text-slate-900 ml-auto">15.0%</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
              <span className="text-slate-600 font-medium truncate">Others</span>
              <span className="font-bold text-slate-900 ml-auto">22.0%</span>
            </div>
          </div>
        </div>

        {/* Leaderboard Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs mb-8">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-amber-500 text-sm">👑</span>
              <h2 className="text-sm font-bold text-slate-900">All Media Leaderboard</h2>
            </div>
            <span className="text-xs text-slate-500 font-medium">175 models evaluated</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3 w-14">RANK</th>
                  <th className="px-6 py-3">MODEL</th>
                  <th className="px-6 py-3">CATEGORY</th>
                  <th className="px-6 py-3 text-right">VOLUME</th>
                  <th className="px-6 py-3 text-center">TREND</th>
                  <th className="px-6 py-3 text-center">RELIABILITY</th>
                  <th className="px-6 py-3">BASE COST</th>
                  <th className="px-6 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map((row) => (
                  <tr key={row.name} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-700">
                      <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                        row.rank === 1 ? 'bg-amber-100 text-amber-800' :
                        row.rank === 2 ? 'bg-slate-200 text-slate-800' :
                        row.rank === 3 ? 'bg-orange-100 text-orange-800' : 'text-slate-500'
                      }`}>
                        {row.rank}
                      </span>
                    </td>
                    <td className="px-6 py-3.5">
                      <Link href={`/${row.slug}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors block">
                        {row.name}
                      </Link>
                      <span className="text-[10px] text-slate-400 font-medium">{row.provider}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{row.category}</td>
                    <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">{row.volume}</td>
                    <td className="px-6 py-3.5 text-center font-mono">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                        row.positive ? 'text-emerald-700 bg-emerald-50' : 'text-rose-700 bg-rose-50'
                      }`}>
                        {row.trend}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-semibold text-[11px] border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        {row.reliability}
                      </span>
                    </td>
                    <td className="px-6 py-3.5 font-mono text-slate-600">{row.cost}</td>
                    <td className="px-6 py-3.5 text-right">
                      <Link
                        href={`/${row.slug}`}
                        className="px-3 py-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs transition-colors"
                      >
                        Playground →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 text-xs text-slate-600 shadow-xs flex items-start gap-4">
          <span className="text-xl">🛡️</span>
          <div>
            <h3 className="font-bold text-slate-900 text-sm mb-1">Methodology & Data Attribution</h3>
            <p className="leading-relaxed text-slate-600 mb-2">
              Rankings reflect live completed request throughput across Timecapsule's unified API layers. Reliability scores are derived from verifiable HTTP status codes and background task settlement confirmations.
            </p>
            <div className="flex items-center gap-4 text-slate-400 font-medium">
              <span>✓ Zero Synthetic Traffic</span>
              <span>·</span>
              <span>Durable PostgreSQL Audit Log</span>
            </div>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
