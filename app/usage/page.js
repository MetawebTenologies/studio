'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

const MODEL_USAGE_DATA = [
  {
    name: 'veo-3-1-cinema',
    category: 'Text to Video',
    requestCount: 3,
    totalCredits: 210,
    cost: '$0.210',
  },
  {
    name: 'nano-banana-pro',
    category: 'Image to Image',
    requestCount: 5,
    totalCredits: 50,
    cost: '$0.050',
  },
  {
    name: 'flux-dev',
    category: 'Text to Image',
    requestCount: 8,
    totalCredits: 80,
    cost: '$0.080',
  },
  {
    name: 'seedance-2-5-omni',
    category: 'Image to Video',
    requestCount: 2,
    totalCredits: 140,
    cost: '$0.140',
  },
  {
    name: 'lyria-3-studio',
    category: 'Text to Audio',
    requestCount: 1,
    totalCredits: 20,
    cost: '$0.020',
  },
];

export default function UsagePage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredModels = MODEL_USAGE_DATA.filter((m) =>
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="usage" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header Row */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-[28px] font-bold tracking-tight text-slate-900">
            Usage
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Trends and per-model breakdown of your API usage
          </p>
        </div>

        {/* Main Usage Card matching Reference Layout */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs mb-8">
          {/* Card Header */}
          <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-2.5">
              <span className="text-blue-600 text-lg">📈</span>
              <div>
                <h2 className="text-sm font-bold text-slate-900">Usage per Model</h2>
                <span className="text-[11px] text-slate-400 font-medium">Last 30 days</span>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
                🔍
              </span>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter models..."
                className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[11px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">Model Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-center">Request Count</th>
                  <th className="px-6 py-3 text-right">Total Credits</th>
                  <th className="px-6 py-3 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredModels.length > 0 ? (
                  filteredModels.map((row) => (
                    <tr key={row.name} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-semibold text-slate-900">
                        <Link href={`/${row.name}`} className="hover:text-blue-600 transition-colors">
                          {row.name}
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-slate-500">{row.category}</td>
                      <td className="px-6 py-3.5 text-center font-mono font-medium">{row.requestCount}</td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-slate-900">
                        {row.totalCredits} cr
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-emerald-600 font-bold">
                        {row.cost}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                      <div className="w-8 h-8 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin mx-auto mb-2" />
                      No models found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Durable Credit Ledger Details */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Verified PostgreSQL Credit Ledger</h3>
              <p className="text-xs text-slate-500">Double-entry audit log separating user credits from internal provider costs</p>
            </div>
            <span className="px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-600 font-bold text-xs">
              Active Tenant
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block mb-1">Starting Allocation</span>
              <span className="text-lg font-bold text-slate-900 font-mono">500 cr</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block mb-1">Total Settled Charges</span>
              <span className="text-lg font-bold text-slate-900 font-mono">0 cr</span>
            </div>
            <div className="p-3 bg-slate-50 rounded border border-slate-200">
              <span className="text-slate-500 block mb-1">Current Usable Balance</span>
              <span className="text-lg font-bold text-emerald-600 font-mono">500 cr ($0.50)</span>
            </div>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
