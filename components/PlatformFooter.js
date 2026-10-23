'use client';

import Link from 'next/link';
import { TIMECAPSULE_BRAND } from '@/branding';

const LANGUAGES = [
  'English',
  '简体中文',
  '日本語',
  'Español',
  'Français',
  'Deutsch',
  '한국어',
  'हिन्दी',
  'Português',
  'Italiano',
  'Русский',
  'العربية',
];

export default function PlatformFooter() {
  return (
    <footer id="site-footer" className="w-full bg-[#08080a] border-t border-white/10 text-zinc-300 text-xs py-16 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="max-w-[1360px] mx-auto">
        
        {/* Main 7-Column Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-[1.4fr_1fr_1fr_1.4fr_1fr_1fr_1fr] gap-x-8 gap-y-12 mb-16">
          
          {/* Col 1: Brand Info */}
          <div className="col-span-2 sm:col-span-3 lg:col-span-1 space-y-4 pr-2">
            <Link href="/" className="flex items-center gap-2 group select-none">
              <div className="w-8 h-8 rounded-lg bg-[#121217] border border-white/10 flex items-center justify-center p-1.5 shadow-sm group-hover:border-[#00e5ff]/50 transition-colors">
                <svg viewBox="0 0 240 240" width="22" height="22" className="w-full h-full" fill="none">
                  <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA" />
                  <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF" />
                </svg>
              </div>
              <span className="text-white font-black text-sm tracking-wider uppercase">
                {TIMECAPSULE_BRAND.name}
              </span>
            </Link>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Unified API gateway for state-of-the-art media generation models. Build, scale, and deploy generative workflows with verifiable model pinning and sovereign billing.
            </p>

            <div className="pt-1">
              <Link
                href="/status"
                className="inline-flex items-center gap-2 text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                All Systems Operational
              </Link>
            </div>
          </div>

          {/* Col 2: PRODUCT */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white font-mono">
              Product
            </h3>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link href="/" className="hover:text-[#00e5ff] transition-colors">Home</Link></li>
              <li><Link href="/dashboard" className="hover:text-[#00e5ff] transition-colors">Dashboard</Link></li>
              <li><Link href="/white-label" className="hover:text-[#00e5ff] transition-colors">White-Label</Link></li>
              <li><Link href="/explore" className="hover:text-[#00e5ff] transition-colors">Explore</Link></li>
              <li><Link href="/rankings" className="hover:text-[#00e5ff] transition-colors">Rankings</Link></li>
              <li><Link href="/pricing" className="hover:text-[#00e5ff] transition-colors">Pricing</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[#00e5ff] transition-colors">Studio</Link></li>
              <li><Link href="/usage" className="hover:text-[#00e5ff] transition-colors">Usage</Link></li>
            </ul>
          </div>

          {/* Col 3: RESOURCES */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white font-mono">
              Resources
            </h3>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link href="/docs" className="hover:text-[#00e5ff] transition-colors">Docs</Link></li>
              <li><Link href="/docs/introduction" className="hover:text-[#00e5ff] transition-colors">API Reference</Link></li>
              <li><Link href="/docs/white-label" className="hover:text-[#00e5ff] transition-colors">Architecture</Link></li>
              <li><Link href="/cli" className="hover:text-[#00e5ff] transition-colors">MCP &amp; CLI</Link></li>
              <li><Link href="/providers" className="hover:text-[#00e5ff] transition-colors">Providers</Link></li>
              <li><Link href="/blog" className="hover:text-[#00e5ff] transition-colors">Blog</Link></li>
              <li><Link href="https://github.com/MetawebTenologies/studio" target="_blank" className="hover:text-[#00e5ff] transition-colors">Discord</Link></li>
            </ul>
          </div>

          {/* Col 4: MODELS */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white font-mono">
              Models
            </h3>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link href="/nano-banana-pro" className="hover:text-[#00e5ff] transition-colors">Nano Banana Pro</Link></li>
              <li><Link href="/seedance-pro-t2v" className="hover:text-[#00e5ff] transition-colors">Seedance Pro 2.5</Link></li>
              <li><Link href="/veo3.1-fast-text-to-video" className="hover:text-[#00e5ff] transition-colors">Google Veo 3.1 Fast</Link></li>
              <li><Link href="/flux-dev" className="hover:text-[#00e5ff] transition-colors">Flux Dev / Schnell</Link></li>
              <li><Link href="/kling-2-1-pro" className="hover:text-[#00e5ff] transition-colors">Kling 2.1 Pro</Link></li>
              <li><Link href="/qwen-image-edit" className="hover:text-[#00e5ff] transition-colors">Qwen Image Edit</Link></li>
              <li><Link href="/explore" className="hover:text-[#00e5ff] transition-colors">Recraft Vector</Link></li>
            </ul>
          </div>

          {/* Col 5: TOOLS */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white font-mono">
              Tools
            </h3>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link href="/studio?preview=1" className="hover:text-[#00e5ff] transition-colors">AI Image Generator</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[#00e5ff] transition-colors">AI Video Generator</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[#00e5ff] transition-colors">Image to Video</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[#00e5ff] transition-colors">Video to Video</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[#00e5ff] transition-colors">Background Remover</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[#00e5ff] transition-colors">Lip Sync Studio</Link></li>
              <li><Link href="/studio?preview=1" className="hover:text-[#00e5ff] transition-colors">Cinema Lens Studio</Link></li>
            </ul>
          </div>

          {/* Col 6: MODEL PAGES */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white font-mono">
              Model Pages
            </h3>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link href="/explore" className="hover:text-[#00e5ff] transition-colors">Seedance 2.5 API</Link></li>
              <li><Link href="/explore" className="hover:text-[#00e5ff] transition-colors">Seedance 3 API</Link></li>
              <li><Link href="/explore" className="hover:text-[#00e5ff] transition-colors">Nano Banana 2.1 API</Link></li>
              <li><Link href="/explore" className="hover:text-[#00e5ff] transition-colors">GPT Image 3 API</Link></li>
              <li><Link href="/explore" className="hover:text-[#00e5ff] transition-colors">Wan 2.2 API</Link></li>
              <li><Link href="/explore" className="hover:text-[#00e5ff] transition-colors">Flux 3 API</Link></li>
            </ul>
          </div>

          {/* Col 7: COMPANY */}
          <div className="space-y-4">
            <h3 className="text-[11px] font-bold tracking-widest uppercase text-white font-mono">
              Company
            </h3>
            <ul className="space-y-2.5 text-zinc-400">
              <li><Link href="/about" className="hover:text-[#00e5ff] transition-colors">About</Link></li>
              <li><Link href="/terms" className="hover:text-[#00e5ff] transition-colors">Terms of Use</Link></li>
              <li><Link href="/privacy" className="hover:text-[#00e5ff] transition-colors">Privacy Policy</Link></li>
              <li><Link href="/privacy#gdpr" className="hover:text-[#00e5ff] transition-colors">GDPR &amp; Data Rights</Link></li>
              <li><Link href="/refund-policy" className="hover:text-[#00e5ff] transition-colors">Refund Policy</Link></li>
              <li><Link href="/status" className="hover:text-[#00e5ff] transition-colors">Status</Link></li>
              <li><Link href="https://github.com/MetawebTenologies/studio/issues" target="_blank" className="hover:text-[#00e5ff] transition-colors">Support</Link></li>
            </ul>
          </div>

        </div>

        {/* Bottom Multi-Language Navigation Bar */}
        <div className="py-6 border-t border-white/10 flex flex-wrap items-center justify-center gap-y-2 gap-x-3 text-[11px] text-zinc-500 font-medium">
          {LANGUAGES.map((lang, idx) => (
            <span key={lang} className="inline-flex items-center gap-3">
              {idx > 0 && <span className="opacity-30">/</span>}
              <button
                type="button"
                className="hover:text-white transition-colors cursor-pointer"
              >
                {lang}
              </button>
            </span>
          ))}
        </div>

        {/* Bottom Copyright & Version Bar */}
        <div className="pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 font-mono">
          <p>© 2026 {TIMECAPSULE_BRAND.name}. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-[#00e5ff]">Verified Production Seam</span>
            <span>•</span>
            <span>v1.0.0-preview</span>
          </div>
        </div>

      </div>
    </footer>
  );
}
