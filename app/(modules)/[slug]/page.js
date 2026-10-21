import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default async function GenericModulePage({ params }) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  const titles = {
    workflows: { name: 'Workflows & Automation', status: 'preview', desc: 'Pre-built multi-step AI video and character creation pipelines.' },
    assistant: { name: 'Creative Assistant', status: 'planned', desc: 'Context-aware screenwriting, style prompting, and camera direction companion.' },
    agents: { name: 'Autonomous Production Agents', status: 'planned', desc: 'Coordinated agent squad for script breakdown, shot lists, and batch rendering.' },
    apps: { name: 'AI Creative Apps', status: 'preview', desc: 'Specialized single-purpose web apps: Upscaler, Face Swap, and Background Remover.' },
    'api-keys': { name: 'Developer API Keys', status: 'planned', desc: 'Unified developer API keys for programmatic inference across all providers.' },
    integrations: { name: 'SDKs & Integrations', status: 'preview', desc: 'Connect Timecapsule to Next.js, Python, ComfyUI, and Blender.' },
    billing: { name: 'Billing & Top-Up', status: 'planned', desc: 'Enterprise and single-tenant credit balance replenishment.' },
    referrals: { name: 'Creator Referrals', status: 'planned', desc: 'Earn generation credits by inviting fellow filmmakers and studios.' },
    'white-label': { name: 'White-Label Dedicated Clusters', status: 'planned', desc: 'Custom branding and dedicated private GPU nodes for enterprise studios.' },
    rankings: { name: 'Model Quality Leaderboard', status: 'preview', desc: 'Community blind test rankings across video fidelity, motion smoothness, and adherence.' },
    docs: { name: 'Platform Documentation', status: 'working', desc: 'Technical specifications, API reference, and self-hosted deployment guides.' },
    blog: { name: 'Timecapsule Engineering Blog', status: 'preview', desc: 'Architecture deep-dives, benchmark releases, and platform updates.' },
  };

  const meta = titles[slug] || { name: 'Timecapsule Module', status: 'planned', desc: 'Planned platform feature.' };

  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <PlatformNav activeModule={slug} />

      <main className="max-w-4xl mx-auto px-6 py-16 flex-1 w-full text-center flex flex-col items-center justify-center">
        <div className="mb-4">
          <ModuleStatusBadge status={meta.status} />
        </div>

        <h1 className="text-3xl sm:text-5xl font-black uppercase tracking-tight mb-4">
          {meta.name}
        </h1>
        <p className="text-white/60 text-base max-w-xl mb-8 leading-relaxed">
          {meta.desc}
        </p>

        <div className="p-8 rounded-3xl bg-[#121217] border border-white/10 max-w-md w-full mb-8 text-left space-y-4">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#00e5ff]">
            <span className="w-2 h-2 rounded-full bg-[#00e5ff]" />
            Module Posture & Contract Guard
          </div>
          <p className="text-xs text-white/50 leading-relaxed">
            {meta.status === 'working'
              ? 'This module is fully backed by verified backend contracts.'
              : meta.status === 'preview'
              ? 'This module is operating in Development UI Preview mode. Simulated fixtures are strictly isolated from backend credits.'
              : 'This module is on the engineering roadmap. Backend services are not yet provisioned.'}
          </p>
          <div className="pt-2">
            <Link
              href="/studio?mode=preview"
              className="w-full block text-center py-3 rounded-xl bg-[#00e5ff] text-black font-black text-xs hover:opacity-90 transition-opacity"
            >
              Open Creative Studio →
            </Link>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
