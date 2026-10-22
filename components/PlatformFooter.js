import Link from 'next/link';
import { TIMECAPSULE_BRAND } from '@/branding';

export default function PlatformFooter() {
  return (
    <footer className="bg-[var(--tc-bg-page,#f8fafc)] border-t border-[var(--tc-border-divider,rgba(226,232,240,0.8))] text-[var(--tc-text-secondary,#475569)] text-xs py-14 px-4 sm:px-6 xl:px-0 mt-auto transition-colors">
      <div className="max-w-[1400px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 pr-4">
            <Link href="/explore" className="flex items-center gap-2 mb-3 group">
              <div className="w-7 h-7 rounded-lg bg-[#09090b] border border-white/10 flex items-center justify-center p-1 shadow-xs group-hover:border-[#00e5ff]/50 transition-colors">
                <svg viewBox="0 0 240 240" width="20" height="20" className="w-full h-full" fill="none">
                  <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA" />
                  <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF" />
                </svg>
              </div>
              <span className="text-[var(--tc-text-primary,#f5f7fa)] font-extrabold text-sm tracking-wider uppercase">
                {TIMECAPSULE_BRAND.name}
              </span>
            </Link>
            <p className="text-[var(--tc-text-secondary,#94a3b8)] text-xs leading-relaxed mb-5">
              Self-hostable multimodal studio for generative cinema, video, image, and speech pipelines with durable queue orchestration.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[var(--tc-text-primary,#0f172a)] font-medium text-xs">All Systems Operational</span>
            </div>
          </div>

          {/* Col 2: PRODUCT */}
          <div>
            <h4 className="text-[var(--tc-text-primary,#0f172a)] font-bold uppercase tracking-wider text-[11px] mb-3">Product</h4>
            <ul className="space-y-2 text-[var(--tc-text-secondary,#475569)]">
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Home</Link></li>
              <li><Link href="/dashboard" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Dashboard</Link></li>
              <li><Link href="/white-label" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">White-Label Studio</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Explore Models</Link></li>
              <li><Link href="/rankings" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Model Rankings</Link></li>
              <li><Link href="/pricing" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Pricing</Link></li>
              <li><Link href="/workflows" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Workflows</Link></li>
              <li><Link href="/agents" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Agents</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Studio</Link></li>
              <li><Link href="/usage" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">History & Usage</Link></li>
              <li><Link href="/integrations" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Integrations</Link></li>
              <li><Link href="/api-keys" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">API Keys</Link></li>
            </ul>
          </div>

          {/* Col 3: RESOURCES */}
          <div>
            <h4 className="text-[var(--tc-text-primary,#0f172a)] font-bold uppercase tracking-wider text-[11px] mb-3">Resources</h4>
            <ul className="space-y-2 text-[var(--tc-text-secondary,#475569)]">
              <li><Link href="/docs" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Documentation</Link></li>
              <li><Link href="/docs/white-label" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">White-Label Architecture</Link></li>
              <li><Link href="/docs/white-label#custom-domain" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Custom Domain Setup</Link></li>
              <li><Link href="/rankings" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Model Leaderboard</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Providers Hub</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Comparison Hub</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Alternatives Hub</Link></li>
              <li><Link href="/blog" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Blog</Link></li>
              <li><Link href="https://github.com/MetawebTenologies/studio" target="_blank" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Discord</Link></li>
              <li><Link href="/cli" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">CLI & MCP Gateway</Link></li>
            </ul>
          </div>

          {/* Col 4: MODELS */}
          <div>
            <h4 className="text-[var(--tc-text-primary,#0f172a)] font-bold uppercase tracking-wider text-[11px] mb-3">Models</h4>
            <ul className="space-y-2 text-[var(--tc-text-secondary,#475569)]">
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Veo 3.1</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Flux Kontext</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Midjourney V7</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">HiDream I1</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Seedance 2.5</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Kling API</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Nano Banana 2.1</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Suno API</Link></li>
            </ul>
          </div>

          {/* Col 5: TOOLS */}
          <div>
            <h4 className="text-[var(--tc-text-primary,#0f172a)] font-bold uppercase tracking-wider text-[11px] mb-3">Tools</h4>
            <ul className="space-y-2 text-[var(--tc-text-secondary,#475569)]">
              <li><Link href="/studio?preview=1" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">AI Image Generator</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">AI Video Generator</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Image to Video</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Video to Video</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Background Remover</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Voice Sync</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Cinema Lens Studio</Link></li>
            </ul>
          </div>

          {/* Col 6: MODEL PAGES */}
          <div>
            <h4 className="text-[var(--tc-text-primary,#0f172a)] font-bold uppercase tracking-wider text-[11px] mb-3">Model Pages</h4>
            <ul className="space-y-2 text-[var(--tc-text-secondary,#475569)]">
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Seedance 2.5 API</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Seedance 3 API</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Nano Banana 2.1 API</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">GPT Image 3 API</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Wan 2.2 API</Link></li>
              <li><Link href="/explore" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Flux 3 API</Link></li>
            </ul>
          </div>

          {/* Col 7: COMPANY */}
          <div>
            <h4 className="text-[var(--tc-text-primary,#0f172a)] font-bold uppercase tracking-wider text-[11px] mb-3">Company</h4>
            <ul className="space-y-2 text-[var(--tc-text-secondary,#475569)]">
              <li><Link href="/about" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">About</Link></li>
              <li><Link href="/terms" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/privacy#gdpr" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">GDPR & Data Rights</Link></li>
              <li><Link href="/refund-policy" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Refund Policy</Link></li>
              <li><Link href="/status" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Status</Link></li>
              <li><Link href="https://github.com/MetawebTenologies/studio/issues" target="_blank" className="hover:text-[var(--tc-text-primary,#0f172a)] transition-colors">Support</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Copyright & Disclaimer */}
        <div className="pt-8 border-t border-[var(--tc-border-divider,rgba(226,232,240,0.8))] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[var(--tc-text-muted,#94a3b8)]">
          <p>© 2026 {TIMECAPSULE_BRAND.name}. All rights reserved.</p>
          <p className="font-mono text-[11px]">Timecapsule Monorepo · v1.0.0-preview</p>
        </div>
      </div>
    </footer>
  );
}
