'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

const MODEL_GROUPS = [
  {
    name: 'Tools',
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
    name: 'Veo',
    count: '4 models',
    models: [
      { name: 'veo3-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '$2.5 per generation', fal: '$3.5 per generation', replicate: '$3.5 per generation', discount: '-28% ↓' },
      { name: 'veo3-fast-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '$0.6 per generation', fal: '$0.8 per generation', replicate: '$0.8 per generation', discount: '-25% ↓' },
      { name: 'veo3-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '$2.5', fal: '$3.5', replicate: '$3.5', discount: '-28% ↓' },
      { name: 'veo3-fast-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '$0.6', fal: '$0.8', replicate: '$0.8', discount: '-25% ↓' },
    ],
  },
  {
    name: 'Flux',
    count: '11 models',
    models: [
      { name: 'flux-dev', modality: 'TEXT TO IMAGE', timecapsule: '$0.015', fal: '$0.020', replicate: '$0.020', discount: '-25% ↓' },
      { name: 'flux-schnell', modality: 'TEXT TO IMAGE', timecapsule: '$0.003 per generation', fal: '$0.005 per generation', replicate: '$0.005 per generation', discount: '-40% ↓' },
      { name: 'flux-3-klein-text-to-image', modality: 'TEXT TO IMAGE', timecapsule: '$0.009', fal: '$0.015', replicate: '$0.015', discount: '-40% ↓' },
      { name: 'flux-3-klein-edit-image', modality: 'IMAGE TO IMAGE', timecapsule: '$0.009', fal: '$0.015', replicate: '$0.015', discount: '-40% ↓' },
    ],
  },
  {
    name: 'Seedance-2.5',
    count: '18 models',
    models: [
      { name: 'seedance-2.5-text-to-video', modality: 'TEXT TO VIDEO', timecapsule: '$0.17/sec (480p), $0.34/sec (720p)', fal: '$0.47/sec (720p)', replicate: 'Not available', discount: '-64% ↓' },
      { name: 'seedance-2.5-image-to-video', modality: 'IMAGE TO VIDEO', timecapsule: '$0.17/sec (480p), $0.34/sec (720p)', fal: '$0.47/sec (720p)', replicate: 'Not available', discount: '-64% ↓' },
      { name: 'seedance-2.5-first-last-frame', modality: 'IMAGE TO VIDEO', timecapsule: '$0.17-$1.70/sec (480p-4k)', fal: '$0.47/sec (720p)', replicate: 'Not available', discount: '-64% ↓' },
    ],
  },
  {
    name: 'Mmaudio & Audio',
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
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                Pricing Comparison
              </h1>
              <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
                Compare model rates across major providers.
              </p>
            </div>

            <button
              onClick={() => setShowPacks(!showPacks)}
              className="self-start sm:self-auto px-3.5 py-1.5 rounded border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 shadow-xs transition-colors"
            >
              {showPacks ? 'Hide Credit Packs' : '💳 View Credit Top-Up Packs'}
            </button>
          </div>
        </div>

        {/* Optional Credit Packs Drawer */}
        {showPacks && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10 p-6 bg-slate-50 border border-slate-200 rounded-xl">
            {CREDIT_PACKS.map((pack) => (
              <div
                key={pack.name}
                className={`p-5 rounded-lg border bg-white flex flex-col justify-between ${
                  pack.popular ? 'border-blue-500 shadow-sm ring-1 ring-blue-500/20' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-slate-900 text-sm">{pack.name}</h3>
                    {pack.popular && (
                      <span className="text-[10px] bg-blue-50 text-blue-600 font-bold px-2 py-0.5 rounded border border-blue-200">
                        POPULAR
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black font-mono text-slate-900 mb-1">{pack.price}</div>
                  <div className="text-xs font-bold text-blue-600 mb-2">{pack.credits}</div>
                  <p className="text-xs text-slate-500">{pack.desc}</p>
                </div>
                <Link
                  href="/billing"
                  className="mt-4 block text-center py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors"
                >
                  Buy Credits
                </Link>
              </div>
            ))}
          </div>
        )}

        {/* Filter and Search Bar */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 mb-8">
          {/* Modality Filter Pills */}
          <div className="flex flex-wrap items-center gap-2">
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
                className={`px-3.5 py-1.5 rounded text-xs font-semibold transition-colors ${
                  activeModality === tab.id
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search models..."
              className="w-full text-xs pl-8 pr-3 py-1.5 border border-slate-200 rounded bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        {/* Grouped Comparison Tables matching Reference Layout */}
        <div className="space-y-8 mb-12">
          {MODEL_GROUPS.map((group) => {
            const visibleModels = group.models.filter(
              (m) =>
                m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                m.modality.toLowerCase().includes(searchTerm.toLowerCase())
            );

            if (visibleModels.length === 0) return null;

            return (
              <div key={group.name} className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
                {/* Group Title Header */}
                <div className="px-6 py-3.5 bg-slate-50/70 border-b border-slate-200 flex items-center gap-2.5">
                  <h2 className="text-sm font-bold text-slate-900">{group.name}</h2>
                  <span className="text-[11px] px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200 font-semibold">
                    {group.count}
                  </span>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50/40 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="px-6 py-3">MODEL & MODALITY</th>
                        <th className="px-6 py-3">TIMECAPSULE PRICE</th>
                        <th className="px-6 py-3">FAL.AI PRICE</th>
                        <th className="px-6 py-3">REPLICATE PRICE</th>
                        <th className="px-6 py-3 text-right">DISCOUNT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleModels.map((row) => (
                        <tr key={row.name} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5">
                            <Link href={`/${row.name}`} className="font-bold text-slate-900 hover:text-blue-600 transition-colors block">
                              {row.name}
                            </Link>
                            <span className="text-[10px] text-slate-400 font-medium tracking-wide">
                              {row.modality}
                            </span>
                          </td>
                          <td className="px-6 py-3.5 font-bold text-blue-600 font-mono">
                            {row.timecapsule}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600 font-mono">
                            {row.fal}
                          </td>
                          <td className="px-6 py-3.5 text-slate-600 font-mono">
                            {row.replicate}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {row.discount ? (
                              <span className="inline-block text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                                {row.discount}
                              </span>
                            ) : (
                              <span className="text-slate-400">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </div>

        {/* Pagination Bar */}
        <div className="flex items-center justify-center gap-2 pb-8 text-xs text-slate-500">
          <button disabled className="px-3 py-1 border border-slate-200 rounded text-slate-400 cursor-not-allowed">
            &lt; Group Page 1 of 15 &gt;
          </button>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
