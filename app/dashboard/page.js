'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';
import { Button, Badge, Card, Input } from '@/components/ui';

const LATEST_MODELS = [
  {
    id: 'flux-dev',
    name: 'flux-dev',
    type: 'Text to Image',
    iconSlug: 'flux',
    gradient: 'from-blue-500/20 to-indigo-500/10',
  },
  {
    id: 'veo-3.1',
    name: 'veo-3-1-cinema',
    type: 'Text to Video',
    iconSlug: 'veo',
    gradient: 'from-cyan-500/20 to-blue-500/10',
  },
  {
    id: 'nano-banana-pro',
    name: 'nano-banana-pro',
    type: 'Image to Image',
    iconSlug: 'banana',
    gradient: 'from-amber-500/20 to-yellow-500/10',
  },
  {
    id: 'seedance-2.5',
    name: 'seedance-2-5-omni',
    type: 'Image to Video',
    iconSlug: 'seedance',
    gradient: 'from-emerald-500/20 to-teal-500/10',
  },
  {
    id: 'lyria-3',
    name: 'lyria-3-studio',
    type: 'Text to Audio',
    iconSlug: 'audio',
    gradient: 'from-purple-500/20 to-pink-500/10',
  },
  {
    id: 'wan-2.1',
    name: 'wan-2-1-pro-video',
    type: 'Video to Video',
    iconSlug: 'wanx',
    gradient: 'from-rose-500/20 to-red-500/10',
  },
  {
    id: 'qwen-image',
    name: 'qwen-image-edit',
    type: 'Image Editing',
    iconSlug: 'qwen',
    gradient: 'from-violet-500/20 to-purple-500/10',
  },
  {
    id: 'kling-v2',
    name: 'kling-2-1-pro',
    type: 'Text to Video',
    iconSlug: 'kling',
    gradient: 'from-orange-500/20 to-amber-500/10',
  },
];

const COMPACT_MODELS = [
  {
    name: 'flux-dev',
    type: 'Text to Image',
    iconSlug: 'flux',
  },
  {
    name: 'veo-3-1-cinema',
    type: 'Text to Video',
    iconSlug: 'veo',
  },
  {
    name: 'nano-banana-pro',
    type: 'Image to Image',
    iconSlug: 'banana',
  },
  {
    name: 'lyria-3-studio',
    type: 'Text to Audio',
    iconSlug: 'audio',
  },
];

export default function DashboardPage() {
  const [showGettingStarted, setShowGettingStarted] = useState(true);
  const [activeTab, setActiveTab] = useState('latest');
  const [requestIdFilter, setRequestIdFilter] = useState('');
  const [modelFilter, setModelFilter] = useState('');
  const [taskStatus, setTaskStatus] = useState('All');
  const [reviewStatus, setReviewStatus] = useState('All');

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="dashboard" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Top Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
                Operator Console
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">Durable Telemetry</span>
            </div>
            <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[#f5f7fa]">
              Studio Dashboard
            </h1>
            <p className="text-xs sm:text-[13px] text-zinc-400 mt-0.5">
              Overview of your AI compute runs, credit reservation telemetry, and active models
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2 bg-[#121217] border border-white/10 rounded-md px-3 py-1.5 text-xs text-zinc-300">
              <span className="text-zinc-500">Mode:</span>
              <span className="font-semibold text-[#00e5ff] font-mono">Studio Workbench</span>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowGettingStarted(!showGettingStarted)}
              className="flex items-center gap-1.5"
            >
              <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              <span>{showGettingStarted ? 'Hide Checklist' : 'Show Checklist'}</span>
            </Button>
          </div>
        </div>

        {/* 3-Column Onboarding & Quick Start Card */}
        {showGettingStarted && (
          <Card className="p-6 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-white/10">
            {/* Col 1: Welcome Checklist */}
            <div className="pt-2 lg:pt-0 pr-0 lg:pr-6">
              <h2 className="text-sm font-bold text-[#f5f7fa] mb-2 flex items-center gap-2">
                <BrandIcon name="timecapsule" className="w-4 h-4 text-[#00e5ff]" />
                Welcome to Timecapsule Studio
              </h2>
              <p className="text-xs text-zinc-400 leading-relaxed mb-6">
                Your operator workspace is provisioned with single-tenant isolation, forced Row Level Security, and durable credit ledger protection.
              </p>

              <div className="space-y-4 text-xs">
                {/* Step 1 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-[#00e5ff] bg-[#00e5ff]/10 flex items-center justify-center text-[10px] text-[#00e5ff] font-bold">
                      <BrandIcon name="check" className="w-2.5 h-2.5 text-[#00e5ff]" />
                    </span>
                    <span className="text-zinc-200 font-medium">Single-tenant session</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>

                {/* Step 2 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-[10px] text-zinc-400 font-mono">
                      2
                    </span>
                    <span className="text-zinc-200 font-medium">Available balance</span>
                  </div>
                  <Link
                    href="/usage"
                    className="px-2.5 py-1 rounded bg-[#181820] hover:bg-[#22222c] border border-white/10 text-[#00e5ff] text-xs font-mono font-bold transition-colors"
                  >
                    500 cr
                  </Link>
                </div>

                {/* Step 3 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-white/20 bg-white/5 flex items-center justify-center text-[10px] text-zinc-400 font-mono">
                      3
                    </span>
                    <span className="text-zinc-200 font-medium">Generate your first media</span>
                  </div>
                  <Link
                    href="/explore"
                    className="px-3 py-1 rounded bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] text-xs font-bold uppercase tracking-wider transition-colors"
                  >
                    Explore Models
                  </Link>
                </div>
              </div>
            </div>

            {/* Col 2: Quick Start Actions (01 - 08) */}
            <div className="pt-6 lg:pt-0 px-0 lg:px-6">
              <h2 className="text-sm font-bold text-[#f5f7fa] mb-1">Quick Actions</h2>
              <p className="text-xs text-zinc-400 mb-4">Direct shortcuts to studio workflows and developer tooling.</p>

              <div className="space-y-2 text-xs">
                {[
                  { num: '01', label: 'Image Generator', badge: 'HOT', link: '/explore', cta: 'Start →' },
                  { num: '02', label: 'Video Generator', badge: 'HOT', link: '/explore', cta: 'Start →' },
                  { num: '03', label: 'In-Place Playground', link: '/nano-banana-pro', cta: 'Open →' },
                  { num: '04', label: 'Provider Hub (25)', badge: 'NEW', link: '/providers', cta: 'Browse →' },
                  { num: '05', label: 'Leaderboard Rankings', link: '/rankings', cta: 'View →' },
                  { num: '06', label: 'Pricing Comparison', link: '/pricing', cta: 'Compare →' },
                  { num: '07', label: 'API Usage & Ledger', link: '/usage', cta: 'Audit →' },
                  { num: '08', label: 'API Documentation', link: '/docs', cta: 'Docs →' },
                ].map((item) => (
                  <div key={item.num} className="flex items-center justify-between py-1 group">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-zinc-500 text-[11px]">{item.num}</span>
                      <span className="text-zinc-300 group-hover:text-[#f5f7fa] font-medium transition-colors">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.2 rounded font-mono ${
                            item.badge === 'HOT'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-[#00e5ff] text-[#09090b]'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <Link
                      href={item.link}
                      className="text-zinc-500 hover:text-[#00e5ff] transition-colors text-[11px] font-medium"
                    >
                      {item.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

            {/* Col 3: Explore Models Compact List */}
            <div className="pt-6 lg:pt-0 pl-0 lg:pl-6 flex flex-col justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#f5f7fa] mb-1">Featured Foundation Models</h2>
                <p className="text-xs text-zinc-400 mb-4">Production-grade generation endpoints available now.</p>

                <div className="space-y-2.5">
                  {COMPACT_MODELS.map((m) => (
                    <Link
                      key={m.name}
                      href={`/${m.name}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-white/[0.04] transition-colors group border border-white/5"
                    >
                      <div className="w-8 h-8 rounded bg-[#181820] border border-white/10 flex items-center justify-center text-zinc-400 group-hover:text-[#00e5ff] transition-colors shrink-0">
                        <BrandIcon name={m.iconSlug} className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-bold text-[#f5f7fa] group-hover:text-[#00e5ff] transition-colors truncate">
                          {m.name}
                        </h3>
                        <p className="text-[11px] text-zinc-500 font-mono">{m.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/explore"
                className="text-xs font-bold text-zinc-400 hover:text-[#00e5ff] pt-4 flex items-center gap-1.5 transition-colors uppercase tracking-wider"
              >
                <span>View Full Catalog (600+) →</span>
              </Link>
            </div>
          </Card>
        )}

        {/* 3 Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Balance */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">Current Credit Balance</span>
              <div className="text-3xl font-black text-[#f5f7fa] font-mono mb-4">
                500 <span className="text-xs font-normal text-zinc-400">cr ($0.500)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/usage"
                className="px-4 py-1.5 rounded bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
              >
                Manage Credits
              </Link>
              <Link
                href="/billing"
                className="px-4 py-1.5 rounded border border-white/10 bg-[#181820] hover:bg-[#22222c] text-zinc-300 text-xs font-medium transition-colors"
              >
                Billing
              </Link>
            </div>
          </Card>

          {/* Card 2: Requests */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">Requests in Last 7 Days</span>
              <div className="text-3xl font-black text-[#f5f7fa] font-mono mb-4">
                0
              </div>
            </div>
            <div>
              <Link
                href="/usage"
                className="inline-block px-4 py-1.5 rounded border border-white/10 bg-[#181820] hover:bg-[#22222c] text-zinc-300 text-xs font-medium transition-colors"
              >
                Check History
              </Link>
            </div>
          </Card>

          {/* Card 3: Models Used */}
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">Active Verified Models</span>
              <div className="text-3xl font-black text-[#f5f7fa] font-mono mb-4">
                6 <span className="text-xs font-normal text-zinc-500 font-mono">(627 Total)</span>
              </div>
            </div>
            <div>
              <Link
                href="/explore"
                className="inline-block px-4 py-1.5 rounded border border-white/10 bg-[#181820] hover:bg-[#22222c] text-zinc-300 text-xs font-medium transition-colors"
              >
                Explore Marketplace
              </Link>
            </div>
          </Card>
        </div>

        {/* Model Quick Bar (Latest Models / Favourites) */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-4">
            <div className="flex items-center gap-6 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('latest')}
                className={`pb-2 relative cursor-pointer ${
                  activeTab === 'latest'
                    ? 'text-[#00e5ff] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#00e5ff]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Latest Release Models
              </button>
              <button
                onClick={() => setActiveTab('favourites')}
                className={`pb-2 relative cursor-pointer ${
                  activeTab === 'favourites'
                    ? 'text-[#00e5ff] font-bold after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[#00e5ff]'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Starred Models
              </button>
            </div>

            <Link
              href="/explore"
              className="text-xs font-medium text-zinc-400 hover:text-[#00e5ff] transition-colors"
            >
              Browse All Models →
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LATEST_MODELS.map((model) => (
              <Link
                key={model.id}
                href={`/${model.id}`}
                className="bg-[#121217] border border-white/10 rounded-lg p-3.5 flex items-center gap-3.5 hover:border-[#00e5ff]/50 hover:shadow-[0_0_15px_rgba(0,229,255,0.08)] transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-md bg-gradient-to-br ${model.gradient} border border-white/10 flex items-center justify-center text-zinc-300 group-hover:text-[#00e5ff] transition-colors shrink-0`}
                >
                  <BrandIcon name={model.iconSlug} className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-[#f5f7fa] group-hover:text-[#00e5ff] truncate transition-colors">
                    {model.name}
                  </h4>
                  <p className="text-[11px] text-zinc-500 font-mono">{model.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Prediction History Section */}
        <Card className="p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-base font-bold text-[#f5f7fa]">Durable Execution History</h2>
            <p className="text-xs text-zinc-400 mt-0.5">Filter and track past generation jobs across all provider routes</p>
          </div>

          {/* Filter Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Request ID
              </label>
              <Input
                type="text"
                placeholder="job_xxx or file..."
                value={requestIdFilter}
                onChange={(e) => setRequestIdFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Model Name
              </label>
              <Input
                type="text"
                placeholder="e.g. nano-banana..."
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Created At
              </label>
              <input
                type="date"
                className="w-full h-9 px-3 py-1.5 bg-[#09090b] border border-white/15 rounded text-xs text-[#f5f7fa] focus:outline-none focus:border-[#00e5ff] transition-all"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Task Status
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full h-9 px-3 py-1.5 bg-[#09090b] border border-white/15 rounded text-xs text-zinc-300 focus:outline-none focus:border-[#00e5ff] transition-all"
              >
                <option value="All">All Statuses</option>
                <option value="settled">Settled</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed (Refunded)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Provider Gateway
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full h-9 px-3 py-1.5 bg-[#09090b] border border-white/15 rounded text-xs text-zinc-300 focus:outline-none focus:border-[#00e5ff] transition-all"
              >
                <option value="All">All Gateways</option>
                <option value="muapi">Muapi Gateway</option>
                <option value="kie">Kie Gateway</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mb-6">
            <button
              onClick={() => {
                setRequestIdFilter('');
                setModelFilter('');
                setTaskStatus('All');
                setReviewStatus('All');
              }}
              className="text-xs text-zinc-400 hover:text-[#f5f7fa] font-medium cursor-pointer transition-colors"
            >
              Reset Filters
            </button>
            <Button size="sm">
              Search History
            </Button>
          </div>

          {/* Retention Alert Banner */}
          <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded text-amber-300 text-xs flex items-center gap-2 mb-6">
            <svg className="w-4 h-4 text-amber-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>Outputs are persisted in tenant-scoped storage. Download and preserve production media assets locally.</span>
          </div>

          {/* Table */}
          <div className="border border-white/10 rounded overflow-hidden mb-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181820] text-zinc-400 uppercase font-semibold text-[11px] border-b border-white/5">
                <tr>
                  <th className="p-3 w-10">
                    <input type="checkbox" className="rounded border-white/20 bg-[#09090b]" />
                  </th>
                  <th className="p-3">Output</th>
                  <th className="p-3">Job ID</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3">Charge</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-400">
                <tr>
                  <td colSpan={8} className="p-8 text-center text-zinc-500 italic">
                    No matching execution jobs found in your tenant history.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-400">
            <span>0 of 0 records</span>
            <div className="flex items-center gap-2">
              <button disabled className="p-1.5 border border-white/10 rounded text-zinc-600 cursor-not-allowed">
                &lt;
              </button>
              <span className="px-2.5 py-1 border border-white/10 rounded font-semibold text-[#f5f7fa] bg-[#181820] font-mono">
                1
              </span>
              <span>/ 1</span>
              <button disabled className="p-1.5 border border-white/10 rounded text-zinc-600 cursor-not-allowed">
                &gt;
              </button>
            </div>
          </div>
        </Card>
      </main>

      <PlatformFooter />
    </div>
  );
}
