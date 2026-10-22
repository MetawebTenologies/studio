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

  const catalog = {
    workflows: {
      title: 'AI Workflows & Generation Pipelines',
      category: 'Pipeline Orchestration',
      status: 'preview',
      description: 'Chained multimodal workflows connecting scriptwriting, character design, image-to-video expansion, and lip synchronization.',
      cards: [
        { name: 'Cinematic Teaser Pipeline', steps: 'Script Breakdown → Veo 3.1 Shot Generation → Lip Sync Audio Pass', tag: 'Cinema' },
        { name: 'Character Consistency Reel', steps: 'Character Seed Shot → Multi-Angle I2I → Motion Video Render', tag: 'Animation' },
        { name: 'Talking Portrait Pipeline', steps: 'Nano Banana Pro Portrait → Voice Track Upload → LipSync Studio', tag: 'Avatar' },
      ]
    },
    assistant: {
      title: 'Timecapsule Creative Assistant',
      category: 'Screenplay & Prompts',
      status: 'planned',
      description: 'An intelligent creative copilot trained on cinematic cinematography, camera angles, lighting prompts, and director style guides.',
      cards: [
        { name: 'Camera & Lens Prompt Assistant', steps: 'Converts simple descriptions into 35mm anamorphic, volumetric lighting specifications.', tag: 'Prompts' },
        { name: 'Scene & Storyboard Co-Writer', steps: 'Generates shot-by-shot visual sequences ready for Cinema Studio.', tag: 'Directing' },
      ]
    },
    agents: {
      title: 'Autonomous Production Agents',
      category: 'Multi-Agent Suite',
      status: 'planned',
      description: 'A squad of coordinated autonomous agents handling background batch rendering, asset tagging, and video quality checks.',
      cards: [
        { name: 'Render Orchestrator Agent', steps: 'Queues jobs across providers with automatic retry, refund guards, and format validation.', tag: 'System' },
        { name: 'Quality & Consistency Reviewer', steps: 'Inspects generated frames for motion artifacts, limb distortions, and facial coherence.', tag: 'Review' },
      ]
    },
    apps: {
      title: 'Specialized Creative Apps',
      category: 'Single-Purpose Web Tools',
      status: 'preview',
      description: 'One-click AI utility tools designed for instant image manipulation, video upscaling, and background isolation.',
      cards: [
        { name: '4K Cinema Video Upscaler', steps: 'AI super-resolution enhancing 480p/720p generations to crisp 4K master files.', tag: 'Video' },
        { name: 'Bioluminescent Face Swap', steps: 'Transfer consistent actor faces onto generated video sequences seamlessly.', tag: 'Identity' },
        { name: 'Alpha Matting Background Remover', steps: 'Produce clean transparent PNGs and ProRes 4444 video cutouts in 1 click.', tag: 'Compositing' },
      ]
    },
    'api-keys': {
      title: 'Developer API Keys & Access Control',
      category: 'Developer Platform',
      status: 'planned',
      description: 'Manage programmatic API keys, rate limits, and webhook endpoints for automated pipeline integration.',
      cards: [
        { name: 'Production API Key', steps: 'High-throughput dedicated queue with priority provider routing.', tag: 'API' },
        { name: 'Sandbox Development Key', steps: 'Zero-credit test mode enforcing mock adapters and format verification.', tag: 'Test' },
      ]
    },
    integrations: {
      title: 'SDKs & Studio Integrations',
      category: 'Ecosystem & Plugins',
      status: 'preview',
      description: 'Pre-built client SDKs and plugins for integrating Timecapsule into popular creative and web development tools.',
      cards: [
        { name: 'Python SDK (`timecapsule-ai`)', steps: 'Async client for batch generation, SSE event streaming, and asset management.', tag: 'Python' },
        { name: 'Next.js & React Component Library', steps: 'Embeddable video players, prompt bars, and model pickers.', tag: 'React' },
        { name: 'ComfyUI Custom Node Pack', steps: 'Direct integration with local ComfyUI nodes for hybrid cloud rendering.', tag: 'ComfyUI' },
      ]
    },
    billing: {
      title: 'Billing, Plans & Credit Top-Up',
      category: 'Account Management',
      status: 'planned',
      description: 'Credit package purchases, monthly subscriptions, and invoice history. Protected by double-entry credit ledgering.',
      cards: [
        { name: 'Creator Pro Plan', steps: '5,000 monthly credits with priority Veo 3.1 & Seedance access.', tag: 'Tier' },
        { name: 'Studio Cluster License', steps: 'Dedicated private GPU worker nodes and zero provider rate limits.', tag: 'Enterprise' },
      ]
    },
    referrals: {
      title: 'Creator Referral Program',
      category: 'Community Rewards',
      status: 'planned',
      description: 'Invite fellow filmmakers, studios, and creators to Timecapsule and earn generation credits on every render.',
      cards: [
        { name: 'Referral Link Generator', steps: 'Share your link and earn 20% bonus generation credits on your friend’s renders.', tag: 'Rewards' },
      ]
    },
    'white-label': {
      title: 'White-Label Dedicated Clusters',
      category: 'Enterprise Solutions',
      status: 'planned',
      description: 'Deploy Timecapsule Studio under your own production studio domain with custom branding and private VPC security.',
      cards: [
        { name: 'Custom Domain & Branding', steps: 'Full white-label UI with your custom logo, CSS design tokens, and subdomains.', tag: 'Brand' },
        { name: 'Private GPU Isolated Mesh', steps: 'Dedicated inference infrastructure isolated in your private AWS/GCP VPC.', tag: 'Security' },
      ]
    },
    rankings: {
      title: 'Model Quality & Benchmark Rankings',
      category: 'Community Leaderboard',
      status: 'preview',
      description: 'Blind comparison ratings evaluating video realism, prompt adherence, camera motion smoothness, and inference speed.',
      cards: [
        { name: 'Veo 3.1 Cinema', steps: 'Rank #1 • Cinematic Realism: 9.6/10 • Motion Consistency: 9.4/10', tag: '#1 Cinema' },
        { name: 'Nano Banana Pro', steps: 'Rank #1 • Photorealistic Portrait Adherence: 9.7/10', tag: '#1 Image' },
        { name: 'Kie Veo Alternative', steps: 'Rank #2 • Fast Inference Latency: 4.2s per 5s clip', tag: 'Fast Video' },
      ]
    },
    docs: {
      title: 'Timecapsule Platform Documentation',
      category: 'Technical Specifications',
      status: 'working',
      description: 'Complete architecture specifications, OpenAPI schemas, authentication contracts, and self-hosted installation guides.',
      cards: [
        { name: 'BFF Architecture Specification', steps: 'Fail-closed authentication, CSRF validation, and single-tenant session handling.', tag: 'Security' },
        { name: 'PostgreSQL Durable Queue', steps: 'Idempotency fingerprints, fenced worker leases, and crash reconciliation.', tag: 'Backend' },
        { name: 'Provider Contract Registry', steps: 'Muapi, Kie.ai, and self-hosted GPU worker adapter specifications.', tag: 'Adapters' },
      ]
    },
    blog: {
      title: 'Engineering Blog & Checkpoint Releases',
      category: 'Product Changelog',
      status: 'preview',
      description: 'In-depth engineering write-ups, architecture decisions, and release notes from the Timecapsule core team.',
      cards: [
        { name: 'Checkpoint 3A: Provider Failover & Cost Separation', steps: 'How we achieved zero-loss provider billing and automated disposable test DBs.', tag: 'Deep Dive' },
        { name: 'Checkpoint 2: Durable PostgreSQL Job Queues', steps: 'Fenced leases and multi-process crash recovery for generative AI pipelines.', tag: 'Architecture' },
      ]
    }
  };

  const meta = catalog[slug] || {
    title: 'Timecapsule Module',
    category: 'Platform Feature',
    status: 'planned',
    description: 'This module is on the Timecapsule engineering roadmap.',
    cards: []
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans">
      <PlatformNav activeModule={slug} />

      <main className="max-w-[1440px] w-full mx-auto px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Module Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-500/30">
                {meta.category}
              </span>
              <ModuleStatusBadge status={meta.status} />
            </div>
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight mb-2 text-white">
              {meta.title}
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              {meta.description}
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#111116] border border-zinc-800 rounded-xl p-3.5 self-start">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Module Posture</div>
              <div className="text-xs text-zinc-400 font-mono">
                {meta.status === 'working' ? 'Production Ready' : meta.status === 'preview' ? 'Sample UI Preview' : 'Roadmap Planned'}
              </div>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid matching Muapi's rich layout */}
        {meta.cards && meta.cards.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {meta.cards.map((c, i) => (
              <div
                key={i}
                className="bg-[#111116] border border-zinc-800/80 hover:border-zinc-700 rounded-xl p-5 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-blue-400 px-2 py-0.5 rounded bg-blue-900/30">
                      {c.tag}
                    </span>
                    <span className="text-[10px] font-mono text-zinc-500">Feature Preview</span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2 group-hover:text-blue-400 transition-colors">
                    {c.name}
                  </h3>
                  <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                    {c.steps}
                  </p>
                </div>

                <div className="pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-500">Status: Integrated</span>
                  <Link
                    href="/studio?preview=1"
                    className="text-xs font-semibold text-blue-400 hover:text-blue-300"
                  >
                    Try in Studio →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Context Explainer Banner */}
        <div className="p-6 rounded-2xl bg-[#111116] border border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl mb-8">
          <div>
            <h4 className="text-sm font-bold text-white mb-1">Looking to generate cinema or image assets now?</h4>
            <p className="text-xs text-zinc-400 max-w-xl">
              All core Image, Video, Cinema, and Lip-Sync engines are fully active in Timecapsule Creative Studio.
            </p>
          </div>
          <Link
            href="/studio?preview=1"
            className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition-colors whitespace-nowrap shadow-md"
          >
            Launch Creative Studio →
          </Link>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
