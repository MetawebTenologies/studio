'use client';

import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import Link from 'next/link';

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="workflows" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Workflows & Pipelines
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
              Visual node graphs to orchestrate, chain, and automate multimodal AI models.
            </p>
          </div>

          <button className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold self-start sm:self-auto transition-colors shadow-xs">
            + Create New Workflow
          </button>
        </div>

        {/* Workflow Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            {
              title: 'Cinema 4K Storyboard Pipeline',
              category: 'VIDEO PRODUCTION',
              nodes: 4,
              desc: 'Generate storyboard frames with FLUX, interpolate motion with Seedance 2.5, upscale with 4K Real-ESRGAN, and score background soundtrack with Lyria 3.',
              badge: 'POPULAR',
            },
            {
              title: 'Multi-Perspective Product Render',
              category: 'COMMERCE & 3D',
              nodes: 3,
              desc: 'Upload a single product photo, remove background, composite into realistic studio environments, and render 360-degree turnaround video.',
              badge: 'NEW',
            },
            {
              title: 'Character Voice & Lip-Sync Chain',
              category: 'AVATAR & SPEECH',
              nodes: 3,
              desc: 'Synthesize expressive multi-lingual dialogue with ElevenLabs and drive facial micro-expressions with Wan 2.2 Speech-to-Video.',
            },
          ].map((wf) => (
            <div
              key={wf.title}
              className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs hover:border-blue-500/60 hover:shadow-md transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-600">{wf.category}</span>
                  {wf.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {wf.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-2">
                  {wf.title}
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">{wf.desc}</p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-medium">{wf.nodes} Nodes in Graph</span>
                <span className="text-blue-600 font-semibold group-hover:underline">Open Canvas →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Graph Preview Mockup Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-8 shadow-xs mb-8 text-center">
          <div className="max-w-md mx-auto">
            <span className="text-4xl mb-3 block">⚡</span>
            <h3 className="text-base font-bold text-slate-900 mb-2">Visual Pipeline Node Editor</h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Connect inputs, image transformations, video generation, and sound synthesis with drag-and-drop wire nodes. Execute locally or deploy as a serverless REST endpoint.
            </p>
            <Link
              href="/studio"
              className="inline-block px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-semibold transition-colors"
            >
              Launch Workflow Studio
            </Link>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
