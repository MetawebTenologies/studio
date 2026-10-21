import Link from 'next/link';
import { TIMECAPSULE_BRAND } from '@/branding';

export default function PlatformFooter() {
  return (
    <footer className="bg-[#050505] border-t border-white/10 text-white/50 text-xs py-12 px-6 lg:px-12 mt-auto">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded bg-[#00e5ff]/20 text-[#00e5ff] font-bold flex items-center justify-center text-xs">
              TC
            </div>
            <span className="text-white font-black text-sm uppercase tracking-wider">
              {TIMECAPSULE_BRAND.name}
            </span>
          </div>
          <p className="text-white/40 max-w-sm mb-4 leading-relaxed">
            Multimodal AI cinema, video, image, and lip-sync platform. Build, scale, and orchestrate generative media with verifiable credit ledgers and zero silent failures.
          </p>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/60 font-mono text-[11px]">All Systems Operational</span>
          </div>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Product</h4>
          <ul className="space-y-2">
            <li><Link href="/studio" className="hover:text-white transition-colors">Studio</Link></li>
            <li><Link href="/explore" className="hover:text-white transition-colors">Explore Models</Link></li>
            <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
            <li><Link href="/workflows" className="hover:text-white transition-colors">Workflows</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Resources</h4>
          <ul className="space-y-2">
            <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
            <li><Link href="/cli" className="hover:text-white transition-colors">MCP & CLI Gateway</Link></li>
            <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
            <li><Link href="/rankings" className="hover:text-white transition-colors">Model Leaderboard</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Legal & OSS</h4>
          <ul className="space-y-2">
            <li><span className="text-white/40">MIT Open Source</span></li>
            <li><Link href="https://github.com/MetawebTenologies/studio" target="_blank" className="hover:text-white transition-colors">GitHub Repository</Link></li>
            <li><span className="text-white/40">Single-Tenant Preview</span></li>
            <li><span className="text-white/40">Privacy & Terms</span></li>
          </ul>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-white/40">
        <div>© 2026 {TIMECAPSULE_BRAND.name}. All Rights Reserved.</div>
        <div className="flex items-center gap-4">
          <span>License: MIT</span>
          <span>•</span>
          <span>Version 1.0.0</span>
          <span>•</span>
          <span className="text-[#00e5ff]">Verified Gateway Active</span>
        </div>
      </div>
    </footer>
  );
}
