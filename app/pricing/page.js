'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';
import { Button, Badge, Card, Input } from '@/components/ui';

const MODEL_GROUPS = [
  {
    name: 'Tools & Utilities',
    count: '20 models',
    models: [
      { name: 'ai-image-upscaler', modality: 'IMAGE TO IMAGE', timecapsule: '$0.02 per generation', fal: '$0.03 per gen', replicate: '$0.03 per gen', discount: '-33% ↓' },
      { name: 'ai-image-face-swap', modality: 'IMAGE TO IMAGE', timecapsule: '$0.02', fal: '$0.03', replicate: '$0.03', discount: '-33% ↓' },
      { name: 'ai-product-shot', modality: 'IMAGE TO IMAGE', timecapsule: '$0.06', fal: '$0.08', replicate: '$0.08', discount: '-25% ↓' },
      { name: 'ai-skin-enhancer', modality: 'IMAGE TO IMAGE', timecapsule: '$0.01 per generation', fal: '$0.015 per gen', replicate: '$0.015 per gen', discount: '-33% ↓' },
      { name: 'ai-background-remover', modality: 'IMAGE TO IMAGE', timecapsule: '$0.01 per generation', fal: '$0.02 per gen', replicate: '$0.02 per gen', discount: '-50% ↓' },
    ],
  },
  {
    name: 'Google Veo Series',
    count: '4 models',
    models: [
      { name: 'veo3-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '$2.5 per generation', fal: '$3.5 per generation', replicate: '$3.5 per generation', discount: '-28% ↓' },
      { name: 'veo3-fast-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '$0.6 per generation', fal: '$0.8 per generation', replicate: '$0.8 per generation', discount: '-25% ↓' },
      { name: 'veo3-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '$2.5', fal: '$3.5', replicate: '$3.5', discount: '-28% ↓' },
      { name: 'veo3-fast-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '$0.6', fal: '$0.8', replicate: '$0.8', discount: '-25% ↓' },
    ],
  },
  {
    name: 'Black Forest Labs Flux',
    count: '11 models',
    models: [
      { name: 'flux-dev', modality: 'TEXT TO IMAGE', timecapsule: '$0.015', fal: '$0.020', replicate: '$0.020', discount: '-25% ↓' },
      { name: 'flux-schnell', modality: 'TEXT TO IMAGE', timecapsule: '$0.003 per generation', fal: '$0.005 per generation', replicate: '$0.005 per generation', discount: '-40% ↓' },
      { name: 'flux-3-klein-text-to-image', modality: 'TEXT TO IMAGE', timecapsule: '$0.009', fal: '$0.015', replicate: '$0.015', discount: '-40% ↓' },
      { name: 'flux-3-klein-edit-image', modality: 'IMAGE TO IMAGE', timecapsule: '$0.009', fal: '$0.015', replicate: '$0.015', discount: '-40% ↓' },
    ],
  },
  {
    name: 'ByteDance Seedance 2.5',
    count: '18 models',
    models: [
      { name: 'seedance-2.5-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '$0.17/sec (480p), $0.34/sec (720p)', fal: '$0.47/sec (720p)', replicate: 'Not available', discount: '-64% ↓' },
      { name: 'seedance-2.5-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '$0.17/sec (480p), $0.34/sec (720p)', fal: '$0.47/sec (720p)', replicate: 'Not available', discount: '-64% ↓' },
      { name: 'seedance-2.5-first-last-frame', modality: 'IMAGE TO VIDEO', timecapsule: '$0.17-$1.70/sec (480p-4k)', fal: '$0.47/sec (720p)', replicate: 'Not available', discount: '-64% ↓' },
    ],
  },
  {
    name: 'Audio & Music Synthesis',
    count: '4 models',
    models: [
      { name: 'mmaudio-v2-text-to-audio', modality: 'TEXT TO AUDIO', timecapsule: '$0.01 per generation', fal: '$0.02 per generation', replicate: '$0.02 per generation', discount: '-50% ↓' },
      { name: 'lyria-3-music', modality: 'TEXT TO AUDIO', timecapsule: '$0.04 per generation', fal: '$0.06 per generation', replicate: '$0.06 per generation', discount: '-33% ↓' },
    ],
  },
];

const CREDIT_PACKS = [
  { name: 'Starter Pack', price: '$10', credits: '10,000 Credits', desc: 'Ideal for prototyping and quick tests.' },
  { name: 'Pro Studio', price: '$50', credits: '55,000 Credits', desc: '10% bonus compute for creators and batch pipelines.', popular: true },
  { name: 'Enterprise Pack', price: '$200', credits: '250,000 Credits', desc: '25% volume bonus for continuous production jobs.' },
];

export default function PricingPage() {
  const [activeModality, setActiveModality] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [showPacks, setShowPacks] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="pricing" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
                  Transparent Rate Cards
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-[11px] text-zinc-400 font-mono">Real-time Arbitrage</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#f5f7fa]">
                Provider Pricing Comparison
              </h1>
              <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                Compare multi-provider model rates. Timecapsule routes tasks to optimal verified provider gateways.
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowPacks(!showPacks)}
              className="self-start sm:self-auto flex items-center gap-2"
            >
              <svg className="w-3.5 h-3.5 text-[#00e5ff]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="5" width="20" height="14" rx="2" />
                <line x1="2" y1="10" x2="22" y2="10" />
              </svg>
              <span>{showPacks ? 'Hide Credit Packs' : 'View Credit Top-Up Packs'}</span>
            </Button>
          </div>
        </div>

        {/* Optional Credit Packs Drawer */}
        {showPacks && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 p-6 bg-[#121217] border border-white/10 rounded-xl">
            {CREDIT_PACKS.map((pack) => (
              <Card
                key={pack.name}
                className={`p-5 flex flex-col justify-between ${
                  pack.popular ? 'border-[#00e5ff]/50 shadow-[0_0_20px_rgba(0,229,255,0.1)]' : 'border-white/10'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-[#f5f7fa] text-sm">{pack.name}</h3>
                    {pack.popular && (
                      <Badge variant="default">
                        MOST POPULAR
                      </Badge>
                    )}
                  </div>
                  <div className="text-2xl font-black font-mono text-[#f5f7fa] mb-1">{pack.price}</div>
                  <div className="text-xs font-bold text-[#00e5ff] font-mono mb-2">{pack.credits}</div>
                  <p className="text-xs text-zinc-400">{pack.desc}</p>
                </div>
                <Link
                  href="/billing"
                  className="mt-4 block text-center py-2 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] rounded text-xs font-bold uppercase tracking-wider transition-colors"
                >
                  Buy Compute Credits
                </Link>
              </Card>
            ))}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Modality Filter Pills */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#121217] border border-white/10 rounded-lg">
            {[
              { id: 'All', label: 'All Models' },
              { id: 'Video', label: 'Video 307' },
              { id: 'Image', label: 'Image 213' },
              { id: 'Music', label: 'Music 25' },
              { id: 'Tools', label: 'Tools 188' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveModality(tab.id)}
                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all cursor-pointer ${
                  activeModality === tab.id
                    ? 'bg-[#00e5ff] text-[#09090b] shadow-xs'
                    : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
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
              placeholder="Search models..."
              className="pl-8"
            />
          </div>
        </div>

        {/* Grouped Comparison Tables */}
        <div className="space-y-8 mb-12">
          {MODEL_GROUPS.map((group) => {
            const visibleModels = group.models.filter(
              (m) =>
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.modality.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (visibleModels.length === 0) return null;

            return (
              <Card key={group.name} className="overflow-hidden">
                {/* Group Title Header */}
                <div className="px-6 py-3.5 bg-[#181820] border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <BrandIcon name={group.name} className="w-4 h-4 text-[#00e5ff]" />
                    <h2 className="text-sm font-bold text-[#f5f7fa]">{group.name}</h2>
                  </div>
                  <Badge variant="secondary">
                    {group.count}
                  </Badge>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#14141a] text-zinc-400 uppercase font-semibold text-[10px] tracking-wider border-b border-white/5">
                      <tr>
                        <th className="px-6 py-3">MODEL & MODALITY</th>
                        <th className="px-6 py-3">TIMECAPSULE RATE</th>
                        <th className="px-6 py-3">FAL.AI RATE</th>
                        <th className="px-6 py-3">REPLICATE RATE</th>
                        <th className="px-6 py-3 text-right">SAVINGS</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {visibleModels.map((row) => (
                        <tr key={row.name} className="hover:bg-white/[0.02] transition-colors">
                          <td className="px-6 py-3.5">
                            <Link href={`/${row.name}`} className="font-bold text-[#f5f7fa] hover:text-[#00e5ff] transition-colors block">
                              {row.name}
                            </Link>
                            <span className="text-[10px] text-zinc-500 font-mono tracking-wider">
                              {row.modality}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-bold text-[#00e5ff] font-mono">
                            {row.timecapsule}
                          </td>
                          <td className="px-6 py-3.5 text-zinc-400 font-mono">
                            {row.fal}
                          </td>
                          <td className="px-6 py-3.5 text-zinc-400 font-mono">
                            {row.replicate}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {row.discount ? (
                              <Badge variant="success">
                                {row.discount}
                              </Badge>
                            ) : (
                              <span className="text-zinc-600">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Footer Note */}
        <div className="flex items-center justify-between pb-8 text-xs text-zinc-500 border-t border-white/5 pt-4">
          <span>Rates updated daily via provider API telemetry. All tasks backed by durable credit refund protection.</span>
          <span className="font-mono text-[11px] text-zinc-400">Page 1 of 1</span>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
