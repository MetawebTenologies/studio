'use client';

import { useState } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://timecapsule.app/join?ref=tc-preview-tenant';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="referral" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold uppercase tracking-wider border border-blue-200">
            Developer Referral Program
          </span>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mt-3 mb-2">
            Earn 15% Lifetime Commission
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Invite creators, engineers, and studios to build on Timecapsule. Earn 15% on every credit package they purchase, credited directly to your account.
          </p>
        </div>

        {/* Referral Link Box */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 max-w-2xl w-full mx-auto shadow-xs mb-10">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
            Your Unique Referral Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 text-xs px-3 py-2 border border-slate-200 rounded bg-slate-50 text-slate-800 font-mono focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors shadow-xs"
            >
              {copied ? '✓ Copied' : 'Copy Link'}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mx-auto mb-12">
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center shadow-xs">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Total Referrals</span>
            <span className="text-3xl font-black text-slate-900 font-mono">0</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center shadow-xs">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Active Studios</span>
            <span className="text-3xl font-black text-slate-900 font-mono">0</span>
          </div>
          <div className="bg-white border border-slate-200 rounded-lg p-6 text-center shadow-xs">
            <span className="text-xs text-slate-400 font-medium uppercase tracking-wider block mb-1">Lifetime Commission</span>
            <span className="text-3xl font-black text-emerald-600 font-mono">$0.00</span>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
