'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

export default function DocsPage() {
  const [activeNav, setActiveNav] = useState('Introduction');

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="docs" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left Docs Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          {/* Search Bar */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 text-xs">
              <BrandIcon name="search" className="w-3.5 h-3.5 text-zinc-500" />
            </span>
            <input
              type="text"
              placeholder="Search docs..."
              className="w-full text-xs pl-8 pr-10 py-2 border border-white/10 rounded-lg bg-[#121217] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 shadow-xs"
            />
            <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[10px] text-zinc-500 font-mono">
              ⌘K
            </span>
          </div>

          <div className="space-y-6 text-xs">
            <div>
              <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] mb-2 font-mono">Get started</h4>
              <ul className="space-y-1">
                {['Introduction', 'Quick Start', 'Application Guides', 'Authentication'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => setActiveNav(item)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeNav === item
                          ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] mb-2 font-mono">API reference</h4>
              <ul className="space-y-1">
                {['API Reference', 'Models Catalog', 'Pricing & Rates', 'Credits Ledger', 'File Upload', 'Webhooks', 'Streaming Events'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => setActiveNav(item)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeNav === item
                          ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] mb-2 font-mono">Media guides</h4>
              <ul className="space-y-1">
                {['Image Generation', 'Video Generation', 'Text-to-Video', 'Music & Speech', 'Specialized Apps'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => setActiveNav(item)}
                      className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer ${
                        activeNav === item
                          ? 'bg-blue-600/20 text-blue-400 font-semibold border border-blue-500/30'
                          : 'text-zinc-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-zinc-400 uppercase tracking-wider text-[11px] mb-2 font-mono">White-Label & Reselling</h4>
              <ul className="space-y-1">
                <li>
                  <Link
                    href="/docs/white-label"
                    className="block px-3 py-1.5 rounded-lg transition-colors text-zinc-400 hover:text-white hover:bg-white/5"
                  >
                    White-Label Architecture
                  </Link>
                </li>
                <li>
                  <Link
                    href="/docs/white-label#custom-domain"
                    className="flex items-center justify-between px-3 py-1.5 rounded-lg transition-colors text-blue-400 font-semibold hover:bg-white/5"
                  >
                    <span>Custom Domain Setup</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono border border-blue-500/30">CNAME</span>
                  </Link>
                </li>
                <li>
                  <Link
                    href="/white-label"
                    className="block px-3 py-1.5 rounded-lg transition-colors text-zinc-400 hover:text-white hover:bg-white/5"
                  >
                    Reseller Program & Calculator
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </aside>

        {/* Center Main Documentation Body */}
        <article className="flex-1 min-w-0 bg-[#121217] border border-white/10 rounded-xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
              Documentation
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-[11px] text-zinc-400 font-mono">Unified Platform Guide</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-[#f5f7fa] mb-3">
            Timecapsule Documentation
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-8">
            Timecapsule provides a unified gateway for generative media and foundational models. Run models through our API, execute in the Playground, or connect to MCP tools and coding agents.
          </p>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-[#f5f7fa] mb-4 pb-2 border-b border-white/10">
              Choose a starting point
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-zinc-300">
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold font-mono">/</span>
                <div>
                  <strong className="text-white">Make your first request:</strong> follow the{' '}
                  <Link href="/cli" className="text-blue-400 hover:underline font-medium">Quick Start guide</Link>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold font-mono">/</span>
                <div>
                  <strong className="text-white">Connect an application:</strong> browse our{' '}
                  <Link href="/explore" className="text-blue-400 hover:underline font-medium">Model Catalog</Link> or test in the{' '}
                  <Link href="/studio" className="text-blue-400 hover:underline font-medium">Studio</Link>.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold font-mono">/</span>
                <div>
                  <strong className="text-white">Build an API integration:</strong> review the{' '}
                  <Link href="/api-keys" className="text-blue-400 hover:underline font-medium">API Keys & Authentication</Link> workflows.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold font-mono">/</span>
                <div>
                  <strong className="text-white">Use Timecapsule from an AI assistant:</strong> see our{' '}
                  <Link href="/cli" className="text-blue-400 hover:underline font-medium">MCP Server & Agent Skills</Link> documentation.
                </div>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="text-blue-400 font-bold font-mono">/</span>
                <div>
                  <strong className="text-white">White-label & brand the studio:</strong> see the{' '}
                  <Link href="/docs/white-label" className="text-blue-400 hover:underline font-medium">White-Label Deployment</Link> guide and configure your{' '}
                  <Link href="/docs/white-label#custom-domain" className="text-blue-400 hover:underline font-medium">Custom Domain & CNAME</Link>.
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-bold text-[#f5f7fa] mb-4 pb-2 border-b border-white/10">
              What you can build
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-zinc-400">
              <p>— Generate or edit images, create cinematic 4K video clips, and synthesize music and natural speech.</p>
              <p>— Combine model calls in visual pipelines or automate them through node workflows.</p>
              <p>— Give coding agents direct access to creative AI capabilities via our Model Context Protocol server.</p>
              <p>— Integrate generation into your applications with low-latency REST endpoints and Server-Sent Events.</p>
            </div>
          </section>

          <section>
            <h2 className="text-lg font-bold text-[#f5f7fa] mb-4 pb-2 border-b border-white/10">
              Quick cURL Example
            </h2>
            <div className="bg-[#09090b] border border-white/10 text-zinc-200 rounded-lg p-4 font-mono text-xs overflow-x-auto leading-relaxed shadow-inner">
              <pre>{`curl -X POST https://api.timecapsule.app/api/v1/generations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "flux-dev",
    "inputs": {
      "prompt": "Cinematic 35mm photograph of an ancient observatory at twilight",
      "aspect_ratio": "16:9"
    }
  }'`}</pre>
            </div>
          </section>
        </article>

        {/* Right Sidebar: Table of Contents */}
        <aside className="hidden xl:block w-56 shrink-0 text-xs">
          <div className="sticky top-24 bg-[#121217] border border-white/10 rounded-xl p-4">
            <h4 className="font-bold text-zinc-300 uppercase tracking-wider text-[11px] mb-3 font-mono">On this page</h4>
            <ul className="space-y-2 border-l border-white/10 pl-3 text-zinc-400">
              <li className="font-semibold text-blue-400">Documentation Overview</li>
              <li className="hover:text-white cursor-pointer transition-colors">Choose a starting point</li>
              <li className="hover:text-white cursor-pointer transition-colors">What you can build</li>
              <li className="hover:text-white cursor-pointer transition-colors">Quick cURL Example</li>
            </ul>
          </div>
        </aside>
      </main>

      <PlatformFooter />
    </div>
  );
}
