'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

const BRAND_PRESETS = [
  { name: 'Chrono Cyan', color: '#00e5ff', bg: '#09090b', text: '#f5f7fa' },
  { name: 'Electric Iris', color: '#9b8cff', bg: '#0a0a12', text: '#f5f7fa' },
  { name: 'Neon Emerald', color: '#10b981', bg: '#06130e', text: '#f5f7fa' },
  { name: 'Solar Amber', color: '#f59e0b', bg: '#140e04', text: '#f5f7fa' },
  { name: 'Crimson Flare', color: '#ef4444', bg: '#140505', text: '#f5f7fa' },
];

export default function WhiteLabelPage() {
  // Interactive demo states
  const [studioName, setStudioName] = useState('CinemaForge Studio');
  const [customDomain, setCustomDomain] = useState('studio.cinemaforge.ai');
  const [brandColor, setBrandColor] = useState('#00e5ff');
  const [markup, setMarkup] = useState(2.0);
  const [activeTab, setActiveTab] = useState('overview');

  // Calculator states
  const [calcUsers, setCalcUsers] = useState(250);
  const [calcGenerations, setCalcGenerations] = useState(60);
  const [calcMultiplier, setCalcMultiplier] = useState(2.2);

  // Waitlist form state (Design-Partner program: 5 partners at 50% off)
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistStudio, setWaitlistStudio] = useState('');
  const [waitlistTier, setWaitlistTier] = useState('Growth');
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const handleWaitlistSubmit = (e) => {
    e.preventDefault();
    if (!waitlistEmail) return;
    setWaitlistSubmitted(true);
  };

  // Financial calculations
  const wholesaleCostPerGen = 0.05; // $0.05 wholesale cost
  const retailPricePerGen = wholesaleCostPerGen * calcMultiplier;
  const totalGenerations = calcUsers * calcGenerations;
  const grossMonthlyRevenue = totalGenerations * retailPricePerGen;
  const wholesaleCostTotal = totalGenerations * wholesaleCostPerGen;
  const netMonthlyProfit = grossMonthlyRevenue - wholesaleCostTotal;

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="white-label" />

      <main className="flex-1 flex flex-col">
        {/* Hero Section */}
        <section className="relative overflow-hidden py-16 sm:py-24 border-b border-white/10 bg-gradient-to-b from-[#09090b] via-[#0c0c12] to-[#09090b]">
          {/* Subtle volumetric lighting aura */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-gradient-to-tr from-cyan-500/15 via-indigo-600/15 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none" />

          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Pill Badges */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600/20 border border-blue-500/40 text-blue-400 text-xs font-bold uppercase tracking-wider mb-6 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse" />
              Turnkey AI SaaS Infrastructure
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-tight mb-6">
              Launch Your Own Branded <span className="text-[#00e5ff]">AI Studio</span> in Minutes
            </h1>

            <p className="text-base sm:text-lg text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-8">
              A fully hosted multimodal generative AI creation platform under your brand, on your custom domain, with your own retail pricing and user checkout. Zero GPU infrastructure to build or maintain.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
              <a
                href="#waitlist"
                className="w-full sm:w-auto px-7 py-3.5 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] font-black text-xs uppercase tracking-widest rounded-md transition-all shadow-lg hover:shadow-cyan-500/20"
              >
                Join Design-Partner Waitlist
              </a>
              <Link
                href="/docs/white-label#custom-domain"
                className="w-full sm:w-auto px-7 py-3.5 bg-[#121217] hover:bg-[#181820] border border-white/20 text-white font-bold text-xs uppercase tracking-widest rounded-md transition-all shadow-sm"
              >
                Custom Domain Docs →
              </Link>
            </div>
            <p className="text-xs text-zinc-400 mb-12">
              Founding resellers get <strong className="text-white">50% off for 12 months</strong> (limited to first 5 design partners).
            </p>

            {/* Quick Proof Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-6 border-t border-white/10 text-left">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Deployment</p>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">&lt; 10 Mins</p>
                <p className="text-[11px] text-zinc-400">DNS CNAME & live SSL</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Retail Margin</p>
                <p className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">100% Yours</p>
                <p className="text-[11px] text-zinc-400">Custom credit multipliers</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Curated Catalog</p>
                <p className="text-xl sm:text-2xl font-black text-white mt-1">627+ Models</p>
                <p className="text-[11px] text-zinc-400">Veo, Flux, Seedance, Wan</p>
              </div>
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-500">Payment Flow</p>
                <p className="text-xl sm:text-2xl font-black text-[#00e5ff] mt-1">Direct Payouts</p>
                <p className="text-[11px] text-zinc-400">Platform checkout · BYO-Stripe rolling out</p>
              </div>
            </div>
          </div>
        </section>

        {/* Live Interactive Custom Studio Sandbox Preview */}
        <section className="py-16 sm:py-20 border-b border-white/10 bg-[#070709]">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-10">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                Preview Simulator
              </div>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-1 mb-3">
                See How Your Branded Studio Looks in Real Time
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Interactive client-side simulator: customize the studio name, domain, and signature brand accent below to preview the runtime white-label experience.
              </p>
            </div>

            {/* Sandbox Controls Bar */}
            <div className="bg-[#121217] border border-white/10 rounded-xl p-4 sm:p-6 mb-8 shadow-xl max-w-4xl mx-auto">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Studio Brand Name
                  </label>
                  <input
                    type="text"
                    value={studioName}
                    onChange={(e) => setStudioName(e.target.value)}
                    className="w-full h-10 bg-[#09090b] border border-white/15 rounded-md px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Custom Domain
                  </label>
                  <input
                    type="text"
                    value={customDomain}
                    onChange={(e) => setCustomDomain(e.target.value)}
                    className="w-full h-10 bg-[#09090b] border border-white/15 rounded-md px-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00e5ff]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                    Brand Accent Color
                  </label>
                  <div className="flex items-center gap-2 h-10">
                    {BRAND_PRESETS.map((p) => (
                      <button
                        key={p.name}
                        onClick={() => setBrandColor(p.color)}
                        title={p.name}
                        className={`w-7 h-7 rounded-full border-2 transition-transform ${
                          brandColor === p.color ? 'scale-110 border-white' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                        style={{ backgroundColor: p.color }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Simulated Browser Chrome Mockup */}
            <div className="max-w-5xl mx-auto rounded-xl border border-white/15 bg-[#09090b] overflow-hidden shadow-2xl">
              {/* Browser Window Header */}
              <div className="bg-[#121217] border-b border-white/10 px-4 py-3 flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>

                {/* Simulated URL bar with lock */}
                <div className="flex-1 max-w-md mx-auto bg-[#09090b] border border-white/10 rounded-md py-1 px-3 flex items-center gap-2 text-xs font-mono text-zinc-400">
                  <BrandIcon name="lock" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-zinc-500">https://</span>
                  <span className="text-white font-medium truncate">{customDomain}</span>
                </div>

                <div className="text-[10px] font-mono text-zinc-500 hidden sm:block">
                  Automatic SSL Active
                </div>
              </div>

              {/* Simulated Branded Header Inside Browser */}
              <div className="border-b border-white/10 px-6 py-4 flex items-center justify-between bg-[#0e0e13]">
                <div className="flex items-center gap-3">
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center font-black text-black text-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    {studioName.charAt(0)}
                  </div>
                  <span className="font-extrabold text-sm tracking-wider uppercase text-white">
                    {studioName}
                  </span>
                </div>

                <div className="flex items-center gap-4 text-xs font-medium text-zinc-400">
                  <span className="text-white font-bold" style={{ color: brandColor }}>Explore</span>
                  <span className="hover:text-white cursor-pointer">Cinema</span>
                  <span className="hover:text-white cursor-pointer">Pricing</span>
                  <button
                    className="px-3.5 py-1.5 rounded-full text-xs font-bold text-black shadow-xs"
                    style={{ backgroundColor: brandColor }}
                  >
                    Sign In
                  </button>
                </div>
              </div>

              {/* Simulated Content Grid */}
              <div className="p-6 bg-[#09090b]">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wider font-bold text-zinc-400">Active AI Models (627)</span>
                  <span className="text-xs font-semibold" style={{ color: brandColor }}>Reseller Retail Rates Active</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Seedance 2.5 Cinema', cat: 'TEXT TO VIDEO', price: '$0.34/gen', wholesale: '$0.17' },
                    { name: 'FLUX 3 Klein Pro', cat: 'TEXT TO IMAGE', price: '$0.020/gen', wholesale: '$0.009' },
                    { name: 'Google Veo 3.1 Fast', cat: 'IMAGE TO VIDEO', price: '$0.30/gen', wholesale: '$0.15' },
                  ].map((m) => (
                    <div key={m.name} className="bg-[#121217] border border-white/10 rounded-lg p-4 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-1">
                          <span style={{ color: brandColor }}>{m.cat}</span>
                          <span className="text-emerald-400 font-mono">{m.price}</span>
                        </div>
                        <h4 className="text-xs font-bold text-white mb-2">{m.name}</h4>
                        <div className="h-16 rounded bg-[#181820] border border-white/5 flex items-center justify-center text-xs text-zinc-500">
                          Deterministic Neural Preview
                        </div>
                      </div>
                      <div className="mt-3 pt-2 border-t border-white/5 flex items-center justify-between text-[10px] text-zinc-500">
                        <span>Wholesale: {m.wholesale}</span>
                        <span className="font-bold text-emerald-400">Margin: ~50%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Feature Grid: What You Control */}
        <section className="py-20 border-b border-white/10 bg-[#09090b]">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#00e5ff]">
                White-Label Engine Architecture
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-2 mb-3">
                Everything You Need to Run an AI Software Business
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                You control the brand, catalog, pricing, domains, and users. We operate the underlying dual-provider API cluster, GPU queues, and ledger accounting.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="bg-[#121217] border border-white/10 rounded-xl p-6 hover:border-[#00e5ff]/50 transition-all shadow-xs group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                      <BrandIcon name="palette" className="w-5 h-5 text-[#00e5ff]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      In Development
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00e5ff] transition-colors">
                    Custom Branding
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Your logo, favicon, product title, and primary color palette injected at runtime across all application routes and mobile shells.
                  </p>
                </div>
              </div>

              {/* Feature 2 */}
              <div className="bg-[#121217] border border-white/10 rounded-xl p-6 hover:border-[#00e5ff]/50 transition-all shadow-xs group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                      <BrandIcon name="globe" className="w-5 h-5 text-[#00e5ff]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      In Development
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00e5ff] transition-colors">
                    Custom Domain + Auto SSL
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Point any domain or subdomain with a single CNAME record. Our automated TLS engine provisions valid HTTPS certificates in under 30 minutes.
                  </p>
                </div>
              </div>

              {/* Feature 3 */}
              <div className="bg-[#121217] border border-white/10 rounded-xl p-6 hover:border-[#00e5ff]/50 transition-all shadow-xs group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                      <BrandIcon name="settings" className="w-5 h-5 text-[#00e5ff]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      In Development
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00e5ff] transition-colors">
                    Studio Gating Toggles
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Enable or disable individual creative studios: Image Synthesis, Cinema Video, Lipsync, AI Audio, Workflows, or Autonomous Agents.
                  </p>
                </div>
              </div>

              {/* Feature 4 */}
              <div className="bg-[#121217] border border-white/10 rounded-xl p-6 hover:border-[#00e5ff]/50 transition-all shadow-xs group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                      <BrandIcon name="chart" className="w-5 h-5 text-[#00e5ff]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      In Development
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00e5ff] transition-colors">
                    Custom Credit Markups
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Define your retail multiplier (e.g. 2.0x wholesale). Your end users purchase credits from you at your price, keeping your margin intact.
                  </p>
                </div>
              </div>

              {/* Feature 5 */}
              <div className="bg-[#121217] border border-white/10 rounded-xl p-6 hover:border-[#00e5ff]/50 transition-all shadow-xs group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                      <BrandIcon name="card" className="w-5 h-5 text-[#00e5ff]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
                      Roadmap (Stage C)
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00e5ff] transition-colors">
                    Reseller Revenue & Wholesale Pricing
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    End-user checkout runs through the platform today; BYO-Stripe is available on Scale (rolling out). Retain up to 100% of your retail margin.
                  </p>
                </div>
              </div>

              {/* Feature 6 */}
              <div className="bg-[#121217] border border-white/10 rounded-xl p-6 hover:border-[#00e5ff]/50 transition-all shadow-xs group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                      <BrandIcon name="sparkle" className="w-5 h-5 text-[#00e5ff]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      In Development
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00e5ff] transition-colors">
                    Zero-Cost Sandbox Mode
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Turn on sandbox testing for new accounts to deliver instant mock sample generations with zero credit consumption during demos.
                  </p>
                </div>
              </div>

              {/* Feature 7 */}
              <div className="bg-[#121217] border border-white/10 rounded-xl p-6 hover:border-[#00e5ff]/50 transition-all shadow-xs group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                      <BrandIcon name="person" className="w-5 h-5 text-[#00e5ff]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      In Development
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00e5ff] transition-colors">
                    End-User Management
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Reseller admin console with live user balances, manual credit adjustments with required reason logging, and instant account suspensions.
                  </p>
                </div>
              </div>

              {/* Feature 8 */}
              <div className="bg-[#121217] border border-white/10 rounded-xl p-6 hover:border-[#00e5ff]/50 transition-all shadow-xs group flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-[#00e5ff]/10 border border-[#00e5ff]/20 flex items-center justify-center text-[#00e5ff]">
                      <BrandIcon name="shield" className="w-5 h-5 text-[#00e5ff]" />
                    </div>
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                      In Development
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mb-2 group-hover:text-[#00e5ff] transition-colors">
                    Spend Caps & Kill Switch
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed">
                    Built-in platform survival controls: set per-tenant monthly compute ceilings and kill switches to protect against unexpected end-user spikes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reseller Profit Margin Calculator */}
        <section className="py-20 border-b border-white/10 bg-[#0c0c12]">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto bg-[#121217] border border-white/15 rounded-2xl p-6 sm:p-10 shadow-2xl">
              <div className="text-center mb-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase tracking-widest mb-3">
                  Preview Simulator
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 mb-2">
                  Calculate Your Reseller Monthly Profit
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400">
                  Estimate your gross recurring income based on your user count, generation volume, and pricing multiplier.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Sliders Column */}
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-zinc-300">Active End Users</span>
                      <span className="text-[#00e5ff] font-mono font-bold">{calcUsers.toLocaleString()} users</span>
                    </div>
                    <input
                      type="range"
                      min="25"
                      max="2000"
                      step="25"
                      value={calcUsers}
                      onChange={(e) => setCalcUsers(Number(e.target.value))}
                      className="w-full accent-[#00e5ff] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-zinc-300">Avg. Generations / User / Month</span>
                      <span className="text-[#00e5ff] font-mono font-bold">{calcGenerations} generations</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      step="5"
                      value={calcGenerations}
                      onChange={(e) => setCalcGenerations(Number(e.target.value))}
                      className="w-full accent-[#00e5ff] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-2">
                      <span className="text-zinc-300">Retail Markup Multiplier</span>
                      <span className="text-emerald-400 font-mono font-bold">{calcMultiplier.toFixed(1)}x wholesale</span>
                    </div>
                    <input
                      type="range"
                      min="1.2"
                      max="4.0"
                      step="0.1"
                      value={calcMultiplier}
                      onChange={(e) => setCalcMultiplier(Number(e.target.value))}
                      className="w-full accent-emerald-400 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Calculation Output Card */}
                <div className="bg-[#09090b] border border-white/10 rounded-xl p-6 flex flex-col justify-between h-full">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                      Estimated Monthly Net Profit
                    </span>
                    <h3 className="text-3xl sm:text-4xl font-black text-emerald-400 mt-1 mb-4">
                      ${Math.round(netMonthlyProfit).toLocaleString()}
                      <span className="text-xs text-zinc-400 font-normal"> / month</span>
                    </h3>

                    <div className="space-y-2 text-xs border-t border-white/10 pt-4 text-zinc-400">
                      <div className="flex justify-between">
                        <span>Total Monthly Generations:</span>
                        <span className="text-white font-mono">{totalGenerations.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Gross End-User Billing:</span>
                        <span className="text-white font-mono">${Math.round(grossMonthlyRevenue).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wholesale Compute COGS:</span>
                        <span className="text-zinc-400 font-mono">${Math.round(wholesaleCostTotal).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-white/10 text-[11px] text-zinc-400 flex items-center gap-2">
                    <BrandIcon name="sparkle" className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />
                    <span>Margin scales dynamically as you upgrade plans and volume tiering direct with providers.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Plans Section */}
        <section id="pricing" className="py-20 border-b border-white/10 bg-[#09090b]">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="text-[11px] font-bold uppercase tracking-widest text-[#00e5ff]">
                Reseller Platform Subscriptions
              </span>
              <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mt-2 mb-3">
                Simple, Transparent White-Label Tiers
              </h2>
              <p className="text-xs sm:text-sm text-zinc-400">
                Choose the scale that matches your agency or micro-SaaS. All tiers include multi-provider failover routing.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Starter Plan */}
              <div className="bg-[#121217] border border-white/10 rounded-2xl p-8 flex flex-col justify-between shadow-lg">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Starter</h3>
                  <p className="text-xs text-zinc-400 mb-6">For indie founders launching their first vertical AI tool.</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-white">$29</span>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>

                  <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Up to 100 Active End Users</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Image & Video Studio Suites</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Subdomain (`slug.timecapsule.ai`)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Custom Branding & Logo</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Configurable Credit Markup (up to 1.5x)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Zero-Cost Sandbox Mode</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-600">
                      <BrandIcon name="close" className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <span>Custom Domain & SSL</span>
                    </li>
                    <li className="flex items-center gap-2.5 text-zinc-600">
                      <BrandIcon name="close" className="w-3.5 h-3.5 text-zinc-600 shrink-0" />
                      <span>Reseller&apos;s Own Stripe Keys (Platform Checkout Only)</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="#waitlist"
                  onClick={() => setWaitlistTier('Starter')}
                  className="w-full py-3 bg-[#181820] hover:bg-[#20202a] border border-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-md text-center transition-all block"
                >
                  Apply for Starter Beta
                </a>
              </div>

              {/* Growth Plan (Featured) */}
              <div className="bg-[#15151e] border-2 border-[#00e5ff] rounded-2xl p-8 flex flex-col justify-between shadow-2xl relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#00e5ff] text-[#09090b] text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-sm">
                  Most Popular
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Growth</h3>
                  <p className="text-xs text-zinc-400 mb-6">For creative agencies & content production retainers.</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-[#00e5ff]">$99</span>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>

                  <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Up to 1,000 Active End Users</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>All 8 Studios (Cinema, Audio, Lipsync...)</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-white">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />
                      <span>Custom Domain + Auto-SSL</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-white">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-[#00e5ff] shrink-0" />
                      <span>Reseller Own SMTP Email Sender</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Custom Credit Markups (up to 3x) & Free Grants</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>End-User Balances & Reason Audit Log</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Tenant Spend Caps & Kill Switch</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Standard Slack & Ticket Support</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="#waitlist"
                  onClick={() => setWaitlistTier('Growth')}
                  className="w-full py-3 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] font-black text-xs uppercase tracking-widest rounded-md text-center transition-all shadow-md block"
                >
                  Apply for Growth Beta
                </a>
              </div>

              {/* Scale Plan */}
              <div className="bg-[#121217] border border-white/10 rounded-2xl p-8 flex flex-col justify-between shadow-lg">
                <div>
                  <h3 className="text-lg font-bold text-white mb-1">Scale</h3>
                  <p className="text-xs text-zinc-400 mb-6">For established AI startups and high-volume platforms.</p>

                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-black text-white">$299</span>
                    <span className="text-xs text-zinc-400">/ month</span>
                  </div>

                  <ul className="space-y-3 text-xs text-zinc-300 mb-8">
                    <li className="flex items-center gap-2.5 font-bold text-emerald-400">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Unlimited End Users</span>
                    </li>
                    <li className="flex items-center gap-2.5 font-bold text-emerald-400">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>BYO-Stripe Checkout (Stage C · rolling out)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Priority GPU Queue Execution</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Custom Credit Markups (Unlimited Multipliers)</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Custom Domain + Multi-Host Routing</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Dedicated Technical Account Manager</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Priority Engineering Support</span>
                    </li>
                    <li className="flex items-center gap-2.5">
                      <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      <span>Custom Moderation Webhooks</span>
                    </li>
                  </ul>
                </div>

                <a
                  href="#waitlist"
                  onClick={() => setWaitlistTier('Scale')}
                  className="w-full py-3 bg-[#181820] hover:bg-[#20202a] border border-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-md text-center transition-all block"
                >
                  Apply for Scale Beta
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Founding Design-Partner Waitlist Section */}
        <section id="waitlist" className="py-20 border-b border-white/10 bg-[#0c0c12] relative overflow-hidden">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="max-w-2xl mx-auto bg-[#121217] border border-cyan-500/30 rounded-2xl p-8 sm:p-10 shadow-2xl">
              <div className="text-center mb-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[10px] font-mono font-bold uppercase tracking-widest mb-4">
                  Founding Design Partners
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight mb-2">
                  Join the Design-Partner Waitlist
                </h2>
                <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed">
                  Founding resellers get <strong>50% off for 12 months</strong> and direct weekly roadmap access with our core engineering team. Limited to 5 design partners.
                </p>
              </div>

              {waitlistSubmitted ? (
                <div className="p-6 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center text-xs">
                  <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 mx-auto flex items-center justify-center mb-3">
                    <BrandIcon name="check" className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h4 className="text-base font-bold text-white mb-1">Application Received</h4>
                  <p className="text-zinc-300 mb-2">
                    Thank you! We&apos;ve reserved your priority slot for <strong>{waitlistStudio || 'your studio'}</strong> on the <strong>{waitlistTier}</strong> tier.
                  </p>
                  <p className="text-zinc-400 text-[11px] font-mono">
                    We will reach out to <span className="text-white font-bold">{waitlistEmail}</span> for private onboarding.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleWaitlistSubmit} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                      Work Email
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="founder@youragency.com"
                      value={waitlistEmail}
                      onChange={(e) => setWaitlistEmail(e.target.value)}
                      className="w-full h-11 bg-[#09090b] border border-white/15 rounded-md px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00e5ff]"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Brand / Studio Name
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Apex Cinema"
                        value={waitlistStudio}
                        onChange={(e) => setWaitlistStudio(e.target.value)}
                        className="w-full h-11 bg-[#09090b] border border-white/15 rounded-md px-3.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-[#00e5ff]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-1.5">
                        Target Tier
                      </label>
                      <select
                        value={waitlistTier}
                        onChange={(e) => setWaitlistTier(e.target.value)}
                        className="w-full h-11 bg-[#09090b] border border-white/15 rounded-md px-3.5 text-xs text-white focus:outline-none focus:border-[#00e5ff]"
                      >
                        <option value="Starter">Starter ($29/mo · $14.50 founding)</option>
                        <option value="Growth">Growth ($99/mo · $49.50 founding)</option>
                        <option value="Scale">Scale ($299/mo · $149.50 founding)</option>
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] font-black text-xs uppercase tracking-widest rounded-md transition-all shadow-lg hover:shadow-cyan-500/25 mt-2 cursor-pointer"
                  >
                    Request Founding Partner Access (50% Off)
                  </button>

                  <p className="text-[11px] text-zinc-500 text-center pt-2">
                    Zero upfront payment or credit card required. Hand-reviewed within 24 hours.
                  </p>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* Custom Domain Documentation Callout */}
        <section className="py-16 bg-[#070709] border-b border-white/10">
          <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl mx-auto rounded-xl border border-white/15 bg-gradient-to-r from-[#121217] to-[#151522] p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#00e5ff]">
                  Operator Documentation
                </span>
                <h3 className="text-xl font-bold text-white mt-1 mb-2">
                  Learn How to Setup Your Custom Domain
                </h3>
                <p className="text-xs text-zinc-400 max-w-xl">
                  Step-by-step instructions for configuring DNS TXT verification, CNAME pointing, Cloudflare proxy settings, and automatic TLS certification.
                </p>
              </div>

              <Link
                href="/docs/white-label#custom-domain"
                className="shrink-0 px-6 py-3 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] font-black text-xs uppercase tracking-widest rounded-md transition-all shadow-md"
              >
                Read Setup Guide →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <PlatformFooter />
    </div>
  );
}
