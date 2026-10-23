import { notFound } from 'next/navigation';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';
import ModelPlayground from '@/components/ModelPlayground';
import AppsTemplateRegistry from '@/components/AppsTemplateRegistry';
import { getModelCapabilities } from '../../../packages/timecapsule/src/models/capabilities.js';

export default async function GenericModulePage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug || slug.includes('.')) {
    notFound();
  }

  const capabilities = getModelCapabilities(slug);

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

  // Determine category, provider and price defaults for model playground
  const isVideo = slug.includes('video') || slug.includes('t2v') || slug.includes('i2v') || slug.includes('veo') || slug.includes('seedance');
  const isAudio = slug.includes('audio') || slug.includes('music') || slug.includes('lyria') || slug.includes('suno') || slug.includes('fish');
  const isLipsync = slug.includes('lipsync') || slug.includes('sync');
  const modelCategory = isVideo ? 'Video Generation' : isAudio ? 'AI Audio' : isLipsync ? 'Lip Sync' : 'Image Generation';
  const modelPrice = isVideo ? '$0.150' : isAudio ? '$0.040' : '$0.009';
  const estimatedCredits = isVideo ? 150 : isAudio ? 40 : 15;

  let providerName = 'Verified Gateway';
  let providerFamily = 'studio';
  if (slug.includes('flux')) {
    providerName = 'Black Forest Labs';
    providerFamily = 'flux';
  } else if (slug.includes('seedance') || slug.includes('seedream')) {
    providerName = 'ByteDance';
    providerFamily = 'seedance';
  } else if (slug.includes('veo')) {
    providerName = 'Google DeepMind';
    providerFamily = 'veo';
  } else if (slug.includes('banana')) {
    providerName = 'Google';
    providerFamily = 'nano-banana';
  } else if (slug.includes('kling')) {
    providerName = 'Kuaishou Kling';
    providerFamily = 'kling';
  } else if (slug.includes('wan')) {
    providerName = 'WanX Alibaba';
    providerFamily = 'wan';
  } else if (slug.includes('hailuo') || slug.includes('minimax')) {
    providerName = 'MiniMax Hailuo';
    providerFamily = 'minimax';
  } else if (slug.includes('luma')) {
    providerName = 'Luma AI';
    providerFamily = 'luma';
  } else if (slug.includes('openai') || slug.includes('gpt')) {
    providerName = 'OpenAI';
    providerFamily = 'openai';
  } else if (slug.includes('midjourney')) {
    providerName = 'Midjourney';
    providerFamily = 'midjourney';
  } else if (slug.includes('ideogram')) {
    providerName = 'Ideogram';
    providerFamily = 'ideogram';
  }

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule={slug} />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 xl:px-0 py-8 flex-1 flex flex-col">
        {/* Breadcrumb Navigation */}
        <nav className="flex items-center gap-2 text-xs text-zinc-400 mb-6" aria-label="Breadcrumb">
          <Link href="/explore" className="hover:text-blue-400 transition-colors">Explore</Link>
          <span>/</span>
          <span className="text-zinc-200 font-semibold">{isModelSlug ? modelTitle : MODULE_CATALOG[slug].title}</span>
        </nav>

        {isModelSlug ? (
          <ModelPlayground
            slug={slug}
            modelTitle={modelTitle}
            modelCategory={modelCategory}
            modelPrice={modelPrice}
            providerName={providerName}
            providerFamily={providerFamily}
            estimatedCredits={estimatedCredits}
            capabilities={capabilities}
          />
        ) : slug === 'apps' ? (
          <AppsTemplateRegistry />
        ) : (
          /* General Module Layout (Workflows, Assistant, etc.) */
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-500/30">
                    {MODULE_CATALOG[slug].category}
                  </span>
                  <ModuleStatusBadge status={MODULE_CATALOG[slug].status} />
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight mb-2">
                  {MODULE_CATALOG[slug].title}
                </h1>
                <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
                  {MODULE_CATALOG[slug].description}
                </p>
              </div>

              <div className="flex items-center gap-3 bg-[#121217] border border-white/10 rounded-xl p-3.5 self-start shadow-sm">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse" />
                <div>
                  <div className="text-xs font-bold text-[#f5f7fa] uppercase tracking-wider">Module Status</div>
                  <div className="text-xs text-zinc-400 font-mono">
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
                  className="bg-[#121217] border border-white/10 hover:border-blue-500/50 rounded-xl p-5 transition-all flex flex-col justify-between group shadow-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.1)]"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20">
                        {c.tag}
                      </span>
                      <span className="text-[10px] font-mono text-zinc-500">Feature Preview</span>
                    </div>
                    <h2 className="text-base font-bold text-[#f5f7fa] mb-2 group-hover:text-blue-400 transition-colors">
                      {c.name}
                    </h2>
                    <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                      {c.steps}
                    </p>
                  </div>
                  <div className="mt-5 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-zinc-500">
                    <span>Single-Tenant Pipeline</span>
                    <span className="text-blue-400 font-semibold text-xs">Ready</span>
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
