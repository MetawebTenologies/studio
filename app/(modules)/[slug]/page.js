import { notFound } from 'next/navigation';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default async function GenericModulePage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug || slug.includes('.')) {
    notFound();
  }

  // Pre-configured module metadata
  const MODULE_CATALOG = {
    workflows: {
      title: 'AI Workflows & Generation Pipelines',
      category: 'Pipeline Orchestration',
      status: 'preview',
      description: 'Chained multimodal workflows connecting scriptwriting, character design, image-to-video expansion, and lip synchronization.',
      cards: [
        { name: 'Cinematic Teaser Pipeline', steps: 'Script Breakdown → Veo 3.1 Shot Generation → Lip Sync Audio Pass', tag: 'Cinema' },
        { name: 'Character Consistency Reel', steps: 'Character Seed Shot → Multi-Angle I2I → Motion Video Render', tag: 'Animation' },
        { name: 'Talking Portrait Pipeline', steps: 'Nano Banana Pro Portrait → Voice Track Upload → LipSync Studio', tag: 'Avatar' },
      ],
    },
    assistant: {
      title: 'Timecapsule Creative Assistant',
      category: 'Screenplay & Prompts',
      status: 'planned',
      description: 'An intelligent creative copilot trained on cinematic cinematography, camera angles, lighting prompts, and director style guides.',
      cards: [
        { name: 'Camera & Lens Prompt Assistant', steps: 'Converts simple descriptions into 35mm anamorphic, volumetric lighting specifications.', tag: 'Prompts' },
        { name: 'Scene & Storyboard Co-Writer', steps: 'Generates shot-by-shot visual sequences ready for Cinema Studio.', tag: 'Directing' },
      ],
    },
    agents: {
      title: 'Autonomous Production Agents',
      category: 'Multi-Agent Suite',
      status: 'planned',
      description: 'A squad of coordinated autonomous agents handling background batch rendering, asset tagging, and video quality checks.',
      cards: [
        { name: 'Render Orchestrator Agent', steps: 'Queues jobs across providers with automatic retry, refund guards, and format validation.', tag: 'System' },
        { name: 'Quality & Consistency Reviewer', steps: 'Inspects generated frames for motion artifacts, limb distortions, and facial coherence.', tag: 'Review' },
      ],
    },
    apps: {
      title: 'Specialized Creative Apps',
      category: 'Single-Purpose Web Tools',
      status: 'preview',
      description: 'Lightweight, single-purpose generation tools optimized for rapid execution without navigating the full Cinema Studio.',
      cards: [
        { name: 'AI Face & Character Swap', steps: 'Instant facial identity transfer for video clips and photos.', tag: 'Identity' },
        { name: 'High-Res Upscaler & Detailer', steps: 'Enhance 720p generations up to native 4K with cinematic grain retention.', tag: 'Mastering' },
        { name: 'Voice & Lip Synchronization', steps: 'Synchronize spoken speech audio to video portraits.', tag: 'Voice' },
      ],
    },
    billing: {
      title: 'Ledger & Credit Billing',
      category: 'Accounting & Quota',
      status: 'working',
      description: 'Deterministic double-entry credit accounting. Manage your balance, inspect transaction receipts, and purchase compute top-ups.',
      cards: [
        { name: 'Developer Starter Top-Up', steps: '10,000 Credits — $10.00 Pay as you go', tag: 'Credits' },
        { name: 'Studio Pro Allocation', steps: '100,000 Credits — $85.00 (15% volume discount)', tag: 'Pro' },
        { name: 'Production Volume Tier', steps: '1,000,000 Credits — Dedicated throughput & SLA', tag: 'Enterprise' },
      ],
    },
    'api-keys': {
      title: 'API Keys & Provider Configuration',
      category: 'Developer Credentials',
      status: 'working',
      description: 'Configure and rotate your operator credentials, private preview secrets, and upstream provider adapter keys (Muapi & Kie).',
      cards: [
        { name: 'Preview Operator Key', steps: 'Active for server-side single-tenant admin execution', tag: 'Auth' },
        { name: 'Primary Provider Adapter (Muapi)', steps: 'Managed server-side via MUAPI_API_KEY environment variable', tag: 'Provider' },
        { name: 'Alternative Provider Adapter (Kie)', steps: 'Managed server-side via KIE_API_KEY environment variable', tag: 'Provider' },
      ],
    },
    integrations: {
      title: 'Ecosystem Integrations',
      category: 'Developer Tooling',
      status: 'preview',
      description: 'Connect Timecapsule to your favorite creative applications and pipelines.',
      cards: [
        { name: 'Model Context Protocol (MCP)', steps: 'Direct connection to Claude Desktop and agentic tools via local MCP server.', tag: 'MCP' },
        { name: 'ComfyUI Custom Nodes', steps: 'Bridge Timecapsule durable queue jobs directly into node graph workflows.', tag: 'ComfyUI' },
        { name: 'Blender & Premiere Pro Bridge', steps: 'Direct render-to-timeline plugin for video editors.', tag: 'NLE' },
      ],
    },
    referrals: {
      title: 'Developer Referral Program',
      category: 'Growth & Rewards',
      status: 'preview',
      description: 'Share Timecapsule with your developer team and earn production credit vouchers.',
      cards: [
        { name: 'Give $10, Get $10', steps: 'Invite a creative engineer to get 1,000 free test credits on first generation.', tag: 'Credits' },
      ],
    },
  };

  const isModelSlug = !MODULE_CATALOG[slug];
  const modelTitle = slug.replace(/[-_]/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Determine category and price defaults for model playground
  const isVideo = slug.includes('video') || slug.includes('t2v') || slug.includes('i2v') || slug.includes('veo') || slug.includes('seedance');
  const isAudio = slug.includes('audio') || slug.includes('music') || slug.includes('lyria') || slug.includes('suno') || slug.includes('fish');
  const isLipsync = slug.includes('lipsync') || slug.includes('sync');
  const modelCategory = isVideo ? 'Video Generation' : isAudio ? 'AI Audio' : isLipsync ? 'Lip Sync' : 'Image Generation';
  const modelPrice = isVideo ? '$0.150' : isAudio ? '$0.040' : '$0.015';

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#f8fafc)] text-[var(--tc-text-primary,#0f172a)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule={slug} />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 xl:px-0 py-8 flex-1 flex flex-col">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 mb-6" aria-label="Breadcrumb">
          <Link href="/explore" className="hover:text-blue-600 transition-colors">Explore</Link>
          <span>/</span>
          <span className="text-slate-900 font-semibold">{isModelSlug ? modelTitle : MODULE_CATALOG[slug].title}</span>
        </nav>

        {isModelSlug ? (
          /* High-Fidelity Model Playground Screen (Matches muapi.ai/playground/[slug]) */
          <div className="flex flex-col lg:flex-row gap-8 items-start">
            {/* Left Column: Form & Parameter Controls */}
            <div className="w-full lg:w-[58%] bg-white border border-slate-200/90 rounded-[6px] p-6 shadow-xs">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 text-[10px] font-bold uppercase tracking-widest border border-blue-200/60">
                      {modelCategory}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase">
                      Ready
                    </span>
                  </div>
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {modelTitle}
                  </h1>
                </div>
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-medium">Model Price</div>
                  <div className="text-lg font-black text-emerald-600">{modelPrice}</div>
                </div>
              </div>

              {/* Form Controls */}
              <div className="space-y-5">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Prompt <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[11px] text-slate-400">Describe what to generate</span>
                  </div>
                  <textarea
                    rows={4}
                    defaultValue="A cinematic close-up shot, 35mm film grain, anamorphic lens flare, soft volumetric lighting..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-md p-3 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                {/* Aspect Ratio Options */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Aspect Ratio
                  </label>
                  <div className="grid grid-cols-5 gap-2">
                    {['1:1', '16:9', '9:16', '4:3', '21:9'].map((ratio, idx) => (
                      <button
                        key={ratio}
                        type="button"
                        className={`py-2 text-xs font-semibold rounded border transition-all ${
                          idx === 1
                            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-xs'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                        }`}
                      >
                        {ratio}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Resolution & Quality */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Resolution
                    </label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500">
                      <option>1080p Full HD</option>
                      <option>720p Standard</option>
                      <option>4K Ultra HD (High Detail)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider mb-1.5">
                      Generation Quality
                    </label>
                    <select className="w-full bg-slate-50 border border-slate-200 rounded-md p-2 text-xs font-medium text-slate-800 focus:outline-none focus:border-blue-500">
                      <option>Production Quality (Standard)</option>
                      <option>Fast Preview</option>
                      <option>Maximum Fidelity</option>
                    </select>
                  </div>
                </div>

                {/* Submit / Execute Button */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-xs text-slate-500">
                    Est. Credits: <span className="font-bold text-slate-800">15 credits</span>
                  </div>
                  <Link
                    href={`/studio?model=${slug}&preview=1`}
                    className="px-6 py-2.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-sm flex items-center gap-2"
                  >
                    <span>Run in Studio</span>
                    <span>→</span>
                  </Link>
                </div>
              </div>
            </div>

            {/* Right Column: Preview Canvas & Technical Contract */}
            <div className="w-full lg:w-[42%] flex flex-col gap-5">
              {/* Output Preview Window */}
              <div className="bg-white border border-slate-200/90 rounded-[6px] overflow-hidden shadow-xs">
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Output Preview</span>
                  <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    Deterministic Sample
                  </span>
                </div>
                <div className="aspect-[4/3] bg-slate-900 flex items-center justify-center relative overflow-hidden group">
                  <img
                    src="/assets/cinema/grand_format_70mm_film.webp"
                    alt={modelTitle}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90"
                  />
                  <div className="absolute bottom-3 left-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded text-white text-[11px] font-mono">
                    70mm Anamorphic Master · 1080p
                  </div>
                </div>
              </div>

              {/* API Integration Snippet */}
              <div className="bg-white border border-slate-200/90 rounded-[6px] p-4 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">BFF Integration</span>
                  <span className="text-[10px] font-mono text-blue-600">cURL (BFF Gateway)</span>
                </div>
                <pre className="bg-slate-900 text-slate-200 p-3 rounded text-[11px] font-mono overflow-x-auto no-scrollbar">
{`curl -X POST http://localhost:3000/api/v1/generations \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${slug}",
    "params": {
      "prompt": "Cinematic shot...",
      "aspect_ratio": "16:9"
    }
  }'`}
                </pre>
              </div>
            </div>
          </div>
        ) : (
          /* General Module Layout (Workflows, Assistant, etc.) */
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-wider border border-blue-200">
                    {MODULE_CATALOG[slug].category}
                  </span>
                  <ModuleStatusBadge status={MODULE_CATALOG[slug].status} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
                  {MODULE_CATALOG[slug].title}
                </h1>
                <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
                  {MODULE_CATALOG[slug].description}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3.5 self-start shadow-xs">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <div>
                  <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Module Status</div>
                  <div className="text-xs text-slate-500 font-mono">
                    {MODULE_CATALOG[slug].status === 'working' ? 'Production Ready' : MODULE_CATALOG[slug].status === 'preview' ? 'Sample UI Preview' : 'Roadmap Planned'}
                  </div>
                </div>
              </div>
            </div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {MODULE_CATALOG[slug].cards.map((c, i) => (
                <div
                  key={i}
                  className="bg-white border border-slate-200/90 hover:border-blue-400 rounded-lg p-5 transition-all flex flex-col justify-between group shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-600 px-2 py-0.5 rounded bg-blue-50">
                        {c.tag}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">Feature Preview</span>
                    </div>
                    <h2 className="text-base font-bold text-slate-900 mb-2 group-hover:text-blue-600 transition-colors">
                      {c.name}
                    </h2>
                    <p className="text-xs text-slate-600 leading-relaxed font-mono">
                      {c.steps}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
                    <span>Single-Tenant Pipeline</span>
                    <span className="text-blue-600 font-semibold text-xs">Ready</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <PlatformFooter />
    </div>
  );
}
