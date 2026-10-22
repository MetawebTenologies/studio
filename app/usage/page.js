'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';
import { Badge, Card, Input } from '@/components/ui';

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
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
              Compute Telemetry
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] text-zinc-400 font-mono">Real-time Settlement</span>
          </div>
          <h1 className="text-2xl sm:text-[28px] font-black tracking-tight text-[#f5f7fa]">
            Usage & Analytics
          </h1>
          <p className="text-xs sm:text-[13px] text-zinc-400 mt-1">
            Consumption trends and per-model credit settlement across all executed generation jobs
          </p>
        </div>

        {/* Main Usage Card */}
        <Card className="overflow-hidden mb-8">
          {/* Card Header */}
          <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#14141a]">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-[#181820] border border-white/10 flex items-center justify-center text-[#00e5ff]">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 20V10" />
                  <path d="M12 20V4" />
                  <path d="M6 20v-6" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-bold text-[#f5f7fa]">Usage per Model</h2>
                <span className="text-[11px] text-zinc-400 font-mono">Last 30 days telemetry</span>
              </div>
            </div>

            <div className="relative w-full sm:w-64">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="11" cy="11" r="8" />
                  <line x1="21" y1="21" x2="16.65" y2="16.65" />
                </svg>
              </span>
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Filter models..."
                className="pl-8"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181820] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-6 py-3">Model Name</th>
                  <th className="px-6 py-3">Category</th>
                  <th className="px-6 py-3 text-center">Request Count</th>
                  <th className="px-6 py-3 text-right">Total Credits</th>
                  <th className="px-6 py-3 text-right">Total Cost</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {filteredModels.length > 0 ? (
                  filteredModels.map((row) => (
                    <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-3.5 font-bold text-[#f5f7fa]">
                        <Link href={`/${row.name}`} className="hover:text-[#00e5ff] transition-colors flex items-center gap-2">
                          <BrandIcon name={row.name} className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{row.name}</span>
                        </Link>
                      </td>
                      <td className="px-6 py-3.5 text-zinc-400 font-mono">{row.category}</td>
                      <td className="px-6 py-3.5 text-center font-mono font-medium text-zinc-300">{row.requestCount}</td>
                      <td className="px-6 py-3.5 text-right font-mono font-bold text-[#00e5ff]">
                        {row.totalCredits} cr
                      </td>
                      <td className="px-6 py-3.5 text-right font-mono text-emerald-400 font-bold">
                        {row.cost}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-zinc-500 italic">
                      No models found matching "{searchTerm}"
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Durable Credit Ledger Details */}
        <Card className="p-6 mb-8">
          <div className="flex items-center justify-between pb-4 border-b border-white/10 mb-4">
            <div>
              <h3 className="text-sm font-bold text-[#f5f7fa]">Verified PostgreSQL Credit Ledger</h3>
              <p className="text-xs text-zinc-400">Double-entry audit log separating user compute credits from internal provider charges</p>
            </div>
            <Badge variant="success">
              Active Tenant
            </Badge>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="p-4 bg-[#181820] rounded border border-white/10">
              <span className="text-zinc-400 block mb-1">Starting Allocation</span>
              <span className="text-lg font-bold text-[#f5f7fa] font-mono">500 cr</span>
            </div>
            <div className="p-4 bg-[#181820] rounded border border-white/10">
              <span className="text-zinc-400 block mb-1">Total Settled Charges</span>
              <span className="text-lg font-bold text-[#f5f7fa] font-mono">0 cr</span>
            </div>
            <div className="p-4 bg-[#181820] rounded border border-white/10">
              <span className="text-zinc-400 block mb-1">Current Usable Balance</span>
              <span className="text-lg font-bold text-emerald-400 font-mono">500 cr ($0.50)</span>
            </div>
          </div>
        </Card>
      </main>

      <PlatformFooter />
    </div>
  );
}
