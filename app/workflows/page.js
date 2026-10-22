'use client';

import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';
import Link from 'next/link';

export default function WorkflowsPage() {
  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans">
      <PlatformNav activeModule="workflows" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
                Graph Automation
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">Chained Pipelines</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#f5f7fa]">
              Workflows & Pipelines
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Visual node graphs to orchestrate, chain, and automate multimodal AI models.
            </p>
          </div>

          <Link
            href="/studio?tab=workflows"
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold self-start sm:self-auto transition-colors shadow-xs"
          >
            + Create New Workflow
          </Link>
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
              className="bg-[#121217] border border-white/10 rounded-xl p-6 shadow-sm hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">{wf.category}</span>
                  {wf.badge && (
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {wf.badge}
                    </span>
                  )}
                </div>
                <h3 className="text-sm font-bold text-[#f5f7fa] group-hover:text-blue-400 transition-colors mb-2">
                  {wf.title}
                </h3>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">{wf.desc}</p>
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs">
                <span className="text-zinc-500 font-mono text-[11px]">{wf.nodes} Nodes in Graph</span>
                <span className="text-blue-400 font-semibold group-hover:underline">Open Canvas →</span>
              </div>
            </div>
          ))}
        </div>

        {/* Graph Preview Mockup Card */}
        <div className="bg-[#121217] border border-white/10 rounded-xl p-8 shadow-sm mb-8 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-4">
              <BrandIcon name="bolt" className="w-6 h-6 text-[#00e5ff]" />
            </div>
            <h3 className="text-base font-bold text-[#f5f7fa] mb-2">Visual Pipeline Node Editor</h3>
            <p className="text-xs text-zinc-400 mb-6 leading-relaxed">
              Connect inputs, image transformations, video generation, and sound synthesis with drag-and-drop wire nodes. Execute locally or deploy as a serverless REST endpoint.
            </p>
            <Link
              href="/studio"
              className="inline-block px-5 py-2.5 bg-white text-black hover:bg-[#00e5ff] rounded text-xs font-bold uppercase tracking-wider transition-colors shadow-sm"
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
