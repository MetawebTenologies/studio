'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

export default function DocsPage() {
  const [activeNav, setActiveNav] = useState('Introduction');

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="docs" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left Docs Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          {/* Search Bar */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search docs..."
              className="w-full text-xs pl-8 pr-10 py-2 border border-slate-200 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
            <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[10px] text-slate-400 font-mono">
              ⌘K
            </span>
          </div>

          <div className="space-y-6 text-xs">
            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Get started</h4>
              <ul className="space-y-1">
                {['Introduction', 'Quick Start', 'Application Guides', 'Authentication'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => setActiveNav(item)}
                      className={`w-full text-left px-3 py-1.5 rounded transition-colors ${
                        activeNav === item
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">API reference</h4>
              <ul className="space-y-1">
                {['API Reference', 'Models Catalog', 'Pricing & Rates', 'Credits Ledger', 'File Upload', 'Webhooks', 'Streaming Events'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => setActiveNav(item)}
                      className={`w-full text-left px-3 py-1.5 rounded transition-colors ${
                        activeNav === item
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-2">Media guides</h4>
              <ul className="space-y-1">
                {['Image Generation', 'Video Generation', 'Text-to-Video', 'Music & Speech', 'Specialized Apps'].map((item) => (
                  <li key={item}>
                    <button
                      onClick={() => setActiveNav(item)}
                      className={`w-full text-left px-3 py-1.5 rounded transition-colors ${
                        activeNav === item
                          ? 'bg-blue-50 text-blue-600 font-semibold'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
                      }`}
                    >
                      {item}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </aside>

        {/* Center Main Documentation Body */}
        <article className="flex-1 min-w-0 bg-white border border-slate-200 rounded-lg p-8 shadow-xs">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 mb-3">
            Timecapsule Documentation
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed mb-8">
            Timecapsule provides a unified gateway for generative media and foundational models. Run models through our API, execute in the Playground, or connect to MCP tools and coding agents.
          </p>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Choose a starting point
            </h2>
            <ul className="space-y-3 text-xs sm:text-sm text-slate-700">
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">—</span>
                <div>
                  <strong className="text-slate-900">Make your first request:</strong> follow the{' '}
                  <Link href="/cli" className="text-blue-600 hover:underline font-medium">Quick Start guide</Link>.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">—</span>
                <div>
                  <strong className="text-slate-900">Connect an application:</strong> browse our{' '}
                  <Link href="/explore" className="text-blue-600 hover:underline font-medium">Model Catalog</Link> or test in the{' '}
                  <Link href="/studio" className="text-blue-600 hover:underline font-medium">Studio</Link>.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">—</span>
                <div>
                  <strong className="text-slate-900">Build an API integration:</strong> review the{' '}
                  <Link href="/api-keys" className="text-blue-600 hover:underline font-medium">API Keys & Authentication</Link> workflows.
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-slate-400 font-bold">—</span>
                <div>
                  <strong className="text-slate-900">Use Timecapsule from an AI assistant:</strong> see our{' '}
                  <Link href="/cli" className="text-blue-600 hover:underline font-medium">MCP Server & Agent Skills</Link> documentation.
                </div>
              </li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              What you can build
            </h2>
            <div className="space-y-3 text-xs sm:text-sm text-slate-700">
              <p>— Generate or edit images, create cinematic 4K video clips, and synthesize music and natural speech.</p>
              <p>— Combine model calls in visual pipelines or automate them through node workflows.</p>
              <p>— Give coding agents direct access to creative AI capabilities via our Model Context Protocol server.</p>
              <p>— Integrate generation into your applications with low-latency REST endpoints and Server-Sent Events.</p>
            </div>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
              Quick cURL Example
            </h2>
            <div className="bg-slate-950 text-slate-100 rounded-md p-4 font-mono text-xs overflow-x-auto">
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
          <div className="sticky top-24">
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[11px] mb-3">On this page</h4>
            <ul className="space-y-2 border-l border-slate-200 pl-3 text-slate-600">
              <li className="font-semibold text-blue-600">Documentation Overview</li>
              <li className="hover:text-slate-900 cursor-pointer">Choose a starting point</li>
              <li className="hover:text-slate-900 cursor-pointer">What you can build</li>
              <li className="hover:text-slate-900 cursor-pointer">Quick cURL Example</li>
            </ul>
          </div>
        </aside>
      </main>

      <PlatformFooter />
    </div>
  );
}
