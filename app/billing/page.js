'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import { Card, Badge, Button } from '@/components/ui';

export default function BillingPage() {
  const [credits, setCredits] = useState(5000);
  const [reserved, setReserved] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/v1/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.credits) {
          setCredits(Number(data.credits.available_credits ?? data.credits.credits_balance ?? 5000));
          setReserved(Number(data.credits.credits_reserved ?? 0));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const usdValue = (credits * 0.001).toFixed(2);

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="billing" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
              Financial Settlement & Economics
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] text-zinc-400 font-mono">1,000 Credits = $1.00 USD</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#f5f7fa]">
            Billing & Balance Management
          </h1>
          <p className="text-xs sm:text-[13px] text-zinc-400 mt-1">
            Manage your compute credits, review multi-provider settlement invoices, and top up balance.
          </p>
        </div>

        {/* Balance & Top Up Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">Usable Compute Credits</span>
              <div className="text-3xl font-black text-[#f5f7fa] font-mono mb-2">
                {loading ? '...' : `${credits.toLocaleString()} cr`}
              </div>
              <p className="text-xs text-zinc-400 font-mono">
                Purchasing power: ${usdValue} USD {reserved > 0 && `(${reserved} cr in-flight)`}
              </p>
            </div>
            <Link
              href="/pricing"
              className="mt-6 block text-center py-2.5 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-xs"
            >
              Top Up Credits ($10 – $1,000)
            </Link>
          </Card>

          <Card className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">Payment Method & Policy</span>
              <div className="flex items-center gap-2.5 mt-2 mb-2">
                <div className="w-8 h-8 rounded bg-[#181820] border border-white/10 flex items-center justify-center text-[#00e5ff]">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                  </svg>
                </div>
                <span className="text-sm font-bold text-[#f5f7fa]">Pre-Paid Double-Entry Ledger</span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Credits never expire. Multi-provider 2PC rollback automatically refunds failed runs with zero bleed.
              </p>
            </div>
            <Link
              href="/pricing"
              className="mt-6 px-4 py-2 border border-white/10 hover:border-white/20 bg-[#181820] hover:bg-[#22222c] text-zinc-300 text-xs font-medium rounded text-center transition-colors block"
            >
              Explore Studio Plans
            </Link>
          </Card>

          <Card className="p-6 flex flex-col justify-between">
            <div>
              <span className="text-xs text-zinc-400 font-medium block mb-1">Commercial Billing Notice</span>
              <div className="text-sm font-bold text-[#f5f7fa] mt-2 mb-1">Private Preview Mode</div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Live commercial credit purchases are paused while supplier costs are reviewed. Use workspace preview keys or test credit allocations for internal studio verification.
              </p>
            </div>
            <Link
              href="/pricing"
              className="mt-6 px-4 py-2 border border-white/20 hover:border-white/40 bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold rounded text-center transition-colors"
            >
              View Rate Cards & Price Book
            </Link>
          </Card>
        </div>

        {/* Invoice History Table */}
        <Card className="overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#14141a]">
            <h2 className="text-sm font-bold text-[#f5f7fa]">Invoice & Grant History</h2>
            <span className="text-xs text-zinc-400 font-mono">All amounts in USD</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181820] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/5">
                <tr>
                  <th className="px-6 py-3">INVOICE ID</th>
                  <th className="px-6 py-3">DATE</th>
                  <th className="px-6 py-3">DESCRIPTION</th>
                  <th className="px-6 py-3">AMOUNT</th>
                  <th className="px-6 py-3">STATUS</th>
                  <th className="px-6 py-3 text-right">RECEIPT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                <tr className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-3.5 font-mono font-semibold text-[#f5f7fa]">INV-2026-001</td>
                  <td className="px-6 py-3.5 text-zinc-400">2026-10-21</td>
                  <td className="px-6 py-3.5">Developer Preview Initial Grant (5,000 Credits)</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-[#f5f7fa]">$0.00</td>
                  <td className="px-6 py-3.5">
                    <Badge variant="success">Active</Badge>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <Link href="/usage" className="text-[#00e5ff] hover:underline font-medium cursor-pointer">View Ledger</Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </Card>
      </main>

      <PlatformFooter />
    </div>
  );
}
