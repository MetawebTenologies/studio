'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

export default function BillingPage() {
  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="billing" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            Billing & Invoices
          </h1>
          <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
            Manage your compute credits, payment methods, and invoice records.
          </p>
        </div>

        {/* Balance & Top Up Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Usable Credits</span>
              <div className="text-3xl font-black text-slate-900 font-mono mb-2">500 cr</div>
              <p className="text-xs text-slate-500">Estimated value: $0.500 USD</p>
            </div>
            <Link
              href="/pricing"
              className="mt-4 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded text-center transition-colors"
            >
              Top Up Balance
            </Link>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Payment Method</span>
              <div className="flex items-center gap-2 mt-2 mb-2">
                <span className="text-lg">💳</span>
                <span className="text-sm font-bold text-slate-900">Direct Pay-As-You-Go</span>
              </div>
              <p className="text-xs text-slate-500">Credits never expire. Top up when your balance runs low.</p>
            </div>
            <button className="mt-4 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded text-center transition-colors">
              Add Payment Method
            </button>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs text-slate-500 font-medium block mb-1">Current Billing Cycle</span>
              <div className="text-sm font-bold text-slate-900 mt-2 mb-1">October 2026</div>
              <p className="text-xs text-slate-500">Total settled: 0 cr. Zero overdue invoices.</p>
            </div>
            <Link
              href="/usage"
              className="mt-4 px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded text-center transition-colors"
            >
              View Full Usage Ledger
            </Link>
          </div>
        </div>

        {/* Invoice History Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs mb-8">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Invoice History</h2>
            <span className="text-xs text-slate-400 font-medium">All amounts in USD</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">INVOICE ID</th>
                  <th className="px-6 py-3">DATE</th>
                  <th className="px-6 py-3">DESCRIPTION</th>
                  <th className="px-6 py-3">AMOUNT</th>
                  <th className="px-6 py-3">STATUS</th>
                  <th className="px-6 py-3 text-right">RECEIPT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr className="hover:bg-slate-50/60 transition-colors">
                  <td className="px-6 py-3.5 font-mono font-semibold text-slate-900">INV-2026-001</td>
                  <td className="px-6 py-3.5">2026-10-21</td>
                  <td className="px-6 py-3.5">Developer Preview Initial Grant (500 Credits)</td>
                  <td className="px-6 py-3.5 font-mono font-bold text-slate-900">$0.00</td>
                  <td className="px-6 py-3.5">
                    <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold text-[11px]">
                      Paid
                    </span>
                  </td>
                  <td className="px-6 py-3.5 text-right">
                    <button className="text-blue-600 hover:underline font-medium">Download PDF</button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
