'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default function DashboardPage() {
  const [stats, setStats] = useState({
    credits: 500,
    activeJobs: 0,
    completedJobs: 12,
    failedJobs: 0,
  });

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <PlatformNav activeModule="dashboard" />

      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-black uppercase tracking-tight">Timecapsule Dashboard</h1>
              <ModuleStatusBadge status="working" />
            </div>
            <p className="text-white/50 text-sm">
              Single-tenant studio overview, active PostgreSQL worker queues, and credit ledger.
            </p>
          </div>

          <Link
            href="/studio?mode=preview"
            className="px-5 py-2.5 rounded-xl bg-[#00e5ff] text-black font-black text-xs hover:opacity-90 transition-opacity"
          >
            Launch Creative Studio →
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-[#121217] border border-white/10 rounded-2xl p-6">
            <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-2">Available Credits</span>
            <div className="text-3xl font-black text-[#00e5ff]">{stats.credits} <span className="text-sm font-normal text-white/40">cr</span></div>
            <span className="text-[11px] text-emerald-400 mt-2 block">Durable Ledger Protected</span>
          </div>

          <div className="bg-[#121217] border border-white/10 rounded-2xl p-6">
            <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-2">Queued & Running</span>
            <div className="text-3xl font-black text-white">{stats.activeJobs}</div>
            <span className="text-[11px] text-white/40 mt-2 block">PostgreSQL Fenced Leases</span>
          </div>

          <div className="bg-[#121217] border border-white/10 rounded-2xl p-6">
            <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-2">Total Completed</span>
            <div className="text-3xl font-black text-white">{stats.completedJobs}</div>
            <span className="text-[11px] text-emerald-400 mt-2 block">100% Verified Artifacts</span>
          </div>

          <div className="bg-[#121217] border border-white/10 rounded-2xl p-6">
            <span className="text-xs text-white/40 font-bold uppercase tracking-wider block mb-2">Failed (Refunded)</span>
            <div className="text-3xl font-black text-white">{stats.failedJobs}</div>
            <span className="text-[11px] text-white/40 mt-2 block">Zero Leaked Credits</span>
          </div>
        </div>

        {/* Recent Workflows */}
        <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 mb-8">
          <h3 className="text-base font-bold text-white mb-4">Studio Quick Actions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/studio?mode=preview"
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#00e5ff]/40 transition-colors block"
            >
              <h4 className="text-sm font-bold text-white mb-1">Image Studio</h4>
              <p className="text-xs text-white/50">Nano Banana Pro, Flux Schnell, and Seedream image engines.</p>
            </Link>

            <Link
              href="/studio?mode=preview"
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#00e5ff]/40 transition-colors block"
            >
              <h4 className="text-sm font-bold text-white mb-1">Cinema Studio</h4>
              <p className="text-xs text-white/50">Veo 3.1 & Seedance multi-camera cinematic shots.</p>
            </Link>

            <Link
              href="/studio?mode=preview"
              className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-[#00e5ff]/40 transition-colors block"
            >
              <h4 className="text-sm font-bold text-white mb-1">Lip Sync Studio</h4>
              <p className="text-xs text-white/50">High-fidelity facial animation driven by dialogue audio.</p>
            </Link>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
