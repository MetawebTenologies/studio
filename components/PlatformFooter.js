import Link from 'next/link';
import { TIMECAPSULE_BRAND } from '@/branding';

export default function PlatformFooter() {
  return (
    <footer className="bg-[#050507] border-t border-[#1a1a20] text-zinc-400 text-xs py-14 px-6 lg:px-8 mt-auto">
      <div className="max-w-[1440px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-8 mb-12">
          {/* Col 1: Brand Info */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 pr-4">
            <Link href="/explore" className="flex items-center gap-2 mb-3 group">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#00e5ff] via-[#0284c7] to-[#2563eb] flex items-center justify-center text-black font-black text-xs">
                TC
              </div>
              <span className="text-white font-extrabold text-sm tracking-wider uppercase">
                {TIMECAPSULE_BRAND.name}
              </span>
            </Link>
            <p className="text-zinc-400 text-xs leading-relaxed mb-5">
              One API for all state-of-the-art AI models. Build, scale, and deploy generative AI workflows at the lowest cost.
            </p>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-zinc-300 font-medium text-xs">All Systems Operational</span>
            </div>
          </div>

          {/* Col 2: PRODUCT */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Product</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/explore" className="hover:text-white transition-colors">Home</Link></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Dashboard</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Explore Models</Link></li>
              <li><Link href="/rankings" className="hover:text-white transition-colors">Model Rankings</Link></li>
              <li><Link href="/billing" className="hover:text-white transition-colors">Pricing</Link></li>
              <li><Link href="/workflows" className="hover:text-white transition-colors">Workflows</Link></li>
              <li><Link href="/agents" className="hover:text-white transition-colors">Agents</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-white transition-colors">Studio</Link></li>
              <li><Link href="/usage" className="hover:text-white transition-colors">History & Usage</Link></li>
              <li><Link href="/integrations" className="hover:text-white transition-colors">Integrations</Link></li>
              <li><Link href="/api-keys" className="hover:text-white transition-colors">API Keys</Link></li>
            </ul>
          </div>

          {/* Col 3: RESOURCES */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Resources</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/docs" className="hover:text-white transition-colors">Documentation</Link></li>
              <li><Link href="/rankings" className="hover:text-white transition-colors">Model Leaderboard</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Providers Hub</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Comparison Hub</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Alternatives Hub</Link></li>
              <li><Link href="/blog" className="hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="https://github.com/MetawebTenologies/studio" target="_blank" className="hover:text-white transition-colors">Discord</Link></li>
              <li><Link href="/cli" className="hover:text-white transition-colors">CLI & MCP Gateway</Link></li>
            </ul>
          </div>

          {/* Col 4: MODELS */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Models</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/explore" className="hover:text-white transition-colors">Veo 3.1</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Flux Kontext</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Midjourney V7</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">HiDream</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Suno</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Hunyuan</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Seedream 5.0</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Flux Dev</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Vidu</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">LatentSync</Link></li>
              <li><Link href="/explore" className="text-blue-400 hover:text-blue-300 font-medium">All Models →</Link></li>
            </ul>
          </div>

          {/* Col 5: TOOLS */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Tools</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/studio?preview=1" className="hover:text-white transition-colors">AI Image Generator</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-white transition-colors">AI Video Generator</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-white transition-colors">Image to Video</Link></li>
              <li><Link href="/apps" className="hover:text-white transition-colors">Image Upscale</Link></li>
              <li><Link href="/apps" className="hover:text-white transition-colors">Background Remover</Link></li>
              <li><Link href="/apps" className="hover:text-white transition-colors">Face Swap</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-white transition-colors">Lip Sync</Link></li>
              <li><Link href="/apps" className="hover:text-white transition-colors">Watermark Remover</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-white transition-colors">Motion Controls</Link></li>
            </ul>
          </div>

          {/* Col 6: MODEL PAGES */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Model Pages</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/explore" className="hover:text-white transition-colors">Seedance 2.5 API</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Seedance 3 API</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Nano Banana 2.1 API</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">GPT Image 3 API</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Wan 3.0 API</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">Veo 3.1 API</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">FLUX 3 API</Link></li>
              <li><Link href="/explore" className="hover:text-white transition-colors">MiniMax H3 API</Link></li>
            </ul>
          </div>

          {/* Col 7: COMPANY */}
          <div>
            <h4 className="text-white font-bold uppercase tracking-wider text-[11px] mb-3">Company</h4>
            <ul className="space-y-2 text-zinc-400">
              <li><Link href="/docs" className="hover:text-white transition-colors">About</Link></li>
              <li><Link href="/docs" className="hover:text-white transition-colors">Terms of Use</Link></li>
              <li><Link href="/docs" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/docs" className="hover:text-white transition-colors">GDPR & Data Rights</Link></li>
              <li><Link href="/docs" className="hover:text-white transition-colors">Refund Policy</Link></li>
              <li><Link href="https://github.com/MetawebTenologies/studio" target="_blank" className="hover:text-white transition-colors">GitHub Repository</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-[#181820] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500">
          <div>© 2026 {TIMECAPSULE_BRAND.name}. All Rights Reserved.</div>
          <div className="flex items-center gap-4 text-zinc-400">
            <span>License: MIT</span>
            <span>•</span>
            <span>Version 1.0.0</span>
            <span>•</span>
            <span className="text-[#00e5ff]">Verified Gateway Active</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
