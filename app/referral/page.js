'use client';

import { useState } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

export default function ReferralPage() {
  const [copied, setCopied] = useState(false);
  const referralLink = 'https://timecapsule.app/join?ref=tc-preview-tenant';

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="referral" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider mb-4">
            <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
            Developer Referral Program
          </div>
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-[#f5f7fa] mt-1 mb-2">
            Earn 15% Lifetime Commission
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Invite creators, engineers, and studios to build on Timecapsule. Earn 15% on every credit package they purchase, credited directly to your account.
          </p>
        </div>

        {/* Referral Link Box */}
        <div className="bg-[#121217] border border-white/10 rounded-xl p-6 max-w-2xl w-full mx-auto shadow-sm mb-10">
          <label className="block text-xs font-bold text-zinc-300 uppercase tracking-wider mb-2 font-mono">
            Your Unique Referral Link
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={referralLink}
              className="flex-1 text-xs px-3 py-2.5 border border-white/10 rounded-lg bg-[#181820] text-zinc-200 font-mono focus:outline-none"
            />
            <button
              onClick={copyToClipboard}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-xs cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied</span>
                </>
              ) : (
                <span>Copy Link</span>
              )}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl w-full mx-auto mb-12">
          <div className="bg-[#121217] border border-white/10 rounded-xl p-6 text-center shadow-sm">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block mb-1">Total Referrals</span>
            <span className="text-3xl font-black text-white font-mono">0</span>
          </div>
          <div className="bg-[#121217] border border-white/10 rounded-xl p-6 text-center shadow-sm">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block mb-1">Active Studios</span>
            <span className="text-3xl font-black text-white font-mono">0</span>
          </div>
          <div className="bg-[#121217] border border-white/10 rounded-xl p-6 text-center shadow-sm">
            <span className="text-xs text-zinc-400 font-medium uppercase tracking-wider block mb-1">Lifetime Commission</span>
            <span className="text-3xl font-black text-emerald-400 font-mono">$0.00</span>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
