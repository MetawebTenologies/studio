'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

const LATEST_MODELS = [
  {
    id: 'flux-dev',
    name: 'flux-dev',
    type: 'Text to Image',
    icon: '🖼️',
    gradient: 'from-blue-500/20 to-indigo-500/20',
  },
  {
    id: 'veo-3.1',
    name: 'veo-3-1-cinema',
    type: 'Text to Video',
    icon: '🎬',
    gradient: 'from-purple-500/20 to-pink-500/20',
  },
  {
    id: 'nano-banana-pro',
    name: 'nano-banana-pro',
    type: 'Image to Image',
    icon: '🍌',
    gradient: 'from-amber-500/20 to-yellow-500/20',
  },
  {
    id: 'seedance-2.5',
    name: 'seedance-2-5-omni',
    type: 'Image to Video',
    icon: '⚡',
    gradient: 'from-emerald-500/20 to-teal-500/20',
  },
  {
    id: 'lyria-3',
    name: 'lyria-3-studio',
    type: 'Text to Audio',
    icon: '🎵',
    gradient: 'from-cyan-500/20 to-blue-500/20',
  },
  {
    id: 'wan-2.1',
    name: 'wan-2-1-pro-video',
    type: 'Video to Video',
    icon: '🎥',
    gradient: 'from-rose-500/20 to-red-500/20',
  },
  {
    id: 'qwen-image',
    name: 'qwen-image-edit',
    type: 'Image Editing',
    icon: '✨',
    gradient: 'from-violet-500/20 to-purple-500/20',
  },
  {
    id: 'kling-v2',
    name: 'kling-2-1-pro',
    type: 'Text to Video',
    icon: '🎞️',
    gradient: 'from-orange-500/20 to-amber-500/20',
  },
];

const COMPACT_MODELS = [
  {
    name: 'flux-dev',
    type: 'Text to Image',
    icon: '🖼️',
  },
  {
    name: 'veo-3-1-cinema',
    type: 'Text to Video',
    icon: '🎬',
  },
  {
    name: 'nano-banana-pro',
    type: 'Image to Image',
    icon: '🍌',
  },
  {
    name: 'lyria-3-studio',
    type: 'Text to Audio',
    icon: '🎵',
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
        {/* Top Header Row matching Reference Layout */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
              Overview of your API usage and generation history
            </p>
          </div>

          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-md px-3 py-1.5 text-xs text-slate-700 shadow-xs">
              <span className="text-slate-400">I want to</span>
              <span className="font-semibold text-slate-900">create with AI</span>
              <span className="text-slate-400 text-[10px]">▾</span>
            </div>

            <button
              onClick={() => setShowGettingStarted(!showGettingStarted)}
              className="bg-white hover:bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <span>{showGettingStarted ? '👁️ Hide' : '👁️ Show'} Getting Started</span>
            </button>
          </div>
        </div>

        {/* 3-Column Onboarding & Quick Start Card */}
        {showGettingStarted && (
          <div className="bg-white border border-slate-200/90 rounded-lg p-6 mb-8 grid grid-cols-1 lg:grid-cols-3 gap-8 divide-y lg:divide-y-0 lg:divide-x divide-slate-100 shadow-xs">
            {/* Col 1: Welcome Checklist */}
            <div className="pt-2 lg:pt-0 pr-0 lg:pr-6">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Welcome to Timecapsule!</h2>
              <p className="text-xs text-slate-500 leading-relaxed mb-6">
                Follow these steps to get the most out of your experience. If you run into any issues, reach out to our team or consult our documentation—we're happy to help!
              </p>

              <div className="space-y-4 text-xs">
                {/* Step 1 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-blue-600 bg-blue-50 flex items-center justify-center text-[10px] text-blue-600 font-bold">
                      ✓
                    </span>
                    <span className="text-slate-700 font-medium">Single-tenant session</span>
                  </div>
                  <span className="px-3 py-1 rounded bg-blue-50 border border-blue-200 text-blue-600 text-xs font-semibold">
                    Active
                  </span>
                </div>

                {/* Step 2 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-500">
                      2
                    </span>
                    <span className="text-slate-700 font-medium">Available balance</span>
                  </div>
                  <Link
                    href="/usage"
                    className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors"
                  >
                    500 cr
                  </Link>
                </div>

                {/* Step 3 */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-4 h-4 rounded-full border border-slate-300 bg-slate-50 flex items-center justify-center text-[10px] text-slate-500">
                      3
                    </span>
                    <span className="text-slate-700 font-medium">Generate your first media</span>
                  </div>
                  <Link
                    href="/studio?preview=1"
                    className="px-3 py-1 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold transition-colors"
                  >
                    Explore
                  </Link>
                </div>
              </div>
            </div>

            {/* Col 2: Quick Start Actions (01 - 08) */}
            <div className="pt-6 lg:pt-0 px-0 lg:px-6">
              <h2 className="text-sm font-bold text-slate-900 mb-1">Quick start</h2>
              <p className="text-xs text-slate-500 mb-4">Quick access to essential features and tools.</p>

              <div className="space-y-2 text-xs">
                {[
                  { num: '01', label: 'Image Generator', badge: 'HOT', link: '/studio?preview=1', cta: 'Start Creating →' },
                  { num: '02', label: 'Video Generator', badge: 'HOT', link: '/studio?preview=1', cta: 'Start Creating →' },
                  { num: '03', label: 'Studio', link: '/studio?preview=1', cta: 'Open →' },
                  { num: '04', label: 'Workflows', link: '/workflows', cta: 'Build →' },
                  { num: '05', label: 'How to use the CLI/MCP', badge: 'NEW', link: '/cli', cta: 'Check →' },
                  { num: '06', label: 'Agent Skills', link: '/explore', cta: 'Explore →' },
                  { num: '07', label: 'Leaderboard Rankings', link: '/rankings', cta: 'View →' },
                  { num: '08', label: 'API Keys', link: '/api-keys', cta: 'Manage →' },
                ].map((item) => (
                  <div key={item.num} className="flex items-center justify-between py-1 group">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-slate-400 text-[11px]">{item.num}</span>
                      <span className="text-slate-700 group-hover:text-slate-900 font-medium transition-colors">
                        {item.label}
                      </span>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-1.5 py-0.5 rounded ${
                            item.badge === 'HOT'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-purple-600 text-white'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </div>
                    <Link
                      href={item.link}
                      className="text-slate-500 hover:text-blue-600 transition-colors text-[11px] font-medium"
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
                <h2 className="text-sm font-bold text-slate-900 mb-1">Explore models</h2>
                <p className="text-xs text-slate-500 mb-4">Browse latest tools for image, video, and audio generation.</p>

                <div className="space-y-2.5">
                  {COMPACT_MODELS.map((m) => (
                    <Link
                      key={m.name}
                      href={`/${m.name}`}
                      className="flex items-center gap-3 p-2 rounded-md hover:bg-slate-50 transition-colors group border border-slate-100"
                    >
                      <div className="w-8 h-8 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-sm shrink-0">
                        {m.icon}
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-xs font-semibold text-slate-900 group-hover:text-blue-600 transition-colors truncate">
                          {m.name}
                        </h3>
                        <p className="text-[11px] text-slate-500">{m.type}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>

              <Link
                href="/explore"
                className="text-xs font-semibold text-slate-600 hover:text-blue-600 pt-4 flex items-center gap-1.5 transition-colors"
              >
                <span>⊞ View all models →</span>
              </Link>
            </div>
          </div>
        )}

        {/* 3 Metrics Cards (Exact Reference Layout) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Card 1: Balance */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Current credit balance</span>
              <div className="text-3xl font-black text-slate-950 font-mono mb-4">
                500 <span className="text-xs font-normal text-slate-500">cr ($0.500)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/usage"
                className="px-4 py-1.5 rounded bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors shadow-xs"
              >
                Manage credits
              </Link>
              <Link
                href="/billing"
                className="px-4 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                Billing
              </Link>
            </div>
          </div>

          {/* Card 2: Requests in last 7 days */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Requests in last 7 days</span>
              <div className="text-3xl font-black text-slate-950 font-mono mb-4">
                0
              </div>
            </div>
            <div>
              <Link
                href="/usage"
                className="inline-block px-4 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                Check history
              </Link>
            </div>
          </div>

          {/* Card 3: Models Used */}
          <div className="bg-white border border-slate-200/90 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Models Used</span>
              <div className="text-3xl font-black text-slate-950 font-mono mb-4">
                0
              </div>
            </div>
            <div>
              <Link
                href="/usage"
                className="inline-block px-4 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium transition-colors"
              >
                Check usage
              </Link>
            </div>
          </div>
        </div>

        {/* Model Quick Bar (Latest Models / Favourites) */}
        <div className="mb-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-4">
            <div className="flex items-center gap-6 text-sm font-semibold">
              <button
                onClick={() => setActiveTab('latest')}
                className={`pb-2 relative ${
                  activeTab === 'latest'
                    ? 'text-slate-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Latest Models
              </button>
              <button
                onClick={() => setActiveTab('favourites')}
                className={`pb-2 relative ${
                  activeTab === 'favourites'
                    ? 'text-slate-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Favourites
              </button>
            </div>

            <Link
              href="/explore"
              className="text-xs font-medium text-slate-500 hover:text-blue-600 transition-colors"
            >
              View all models
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {LATEST_MODELS.map((model) => (
              <Link
                key={model.id}
                href={`/${model.id}`}
                className="bg-white border border-slate-200 rounded-lg p-3.5 flex items-center gap-3.5 hover:border-blue-500/60 hover:shadow-sm transition-all group"
              >
                <div
                  className={`w-10 h-10 rounded-md bg-gradient-to-br ${model.gradient} border border-slate-100 flex items-center justify-center text-lg shrink-0`}
                >
                  {model.icon}
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate transition-colors">
                    {model.name}
                  </h4>
                  <p className="text-[11px] text-slate-500">{model.type}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Prediction History Section */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-8 shadow-xs">
          <div className="mb-6">
            <h2 className="text-base font-bold text-slate-900">Prediction History</h2>
            <p className="text-xs text-slate-500 mt-0.5">Filter and track your past model runs</p>
          </div>

          {/* Filter Form Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Request ID
              </label>
              <input
                type="text"
                placeholder="Request ID or output filename"
                value={requestIdFilter}
                onChange={(e) => setRequestIdFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Model Name
              </label>
              <input
                type="text"
                placeholder="Search by model..."
                value={modelFilter}
                onChange={(e) => setModelFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Created At
              </label>
              <input
                type="date"
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Task Status
              </label>
              <select
                value={taskStatus}
                onChange={(e) => setTaskStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All</option>
                <option value="settled">Settled</option>
                <option value="processing">Processing</option>
                <option value="failed">Failed</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Review Status
              </label>
              <select
                value={reviewStatus}
                onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-slate-200 rounded bg-white text-slate-700 focus:outline-none focus:border-blue-500"
              >
                <option value="All">All</option>
                <option value="approved">Approved</option>
                <option value="flagged">Flagged</option>
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
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Reset Filters
            </button>
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors shadow-xs">
              Search History
            </button>
          </div>

          {/* Retention Alert Banner */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded text-amber-800 text-xs flex items-center gap-2 mb-6">
            <span>⚠️</span>
            <span>Your outputs are preserved in storage. Make sure to download and save your generated media assets.</span>
          </div>

          {/* Table */}
          <div className="border border-slate-200 rounded overflow-hidden mb-4">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="p-3 w-10">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </th>
                  <th className="p-3">Output</th>
                  <th className="p-3">Request ID</th>
                  <th className="p-3">Model</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Created At</th>
                  <th className="p-3">Cost</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 italic">
                    No matching requests found in your history.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Pagination Footer */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
            <span>No results found</span>
            <div className="flex items-center gap-2">
              <button disabled className="p-1.5 border border-slate-200 rounded text-slate-400 cursor-not-allowed">
                &lt;
              </button>
              <span className="px-2.5 py-1 border border-slate-200 rounded font-semibold text-slate-900 bg-slate-50">
                1
              </span>
              <span>/ 1</span>
              <button disabled className="p-1.5 border border-slate-200 rounded text-slate-400 cursor-not-allowed">
                &gt;
              </button>
              <button className="ml-2 px-3 py-1 bg-blue-600 text-white rounded font-medium hover:bg-blue-500 transition-colors">
                Go to Page
              </button>
            </div>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
