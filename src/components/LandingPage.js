export function LandingPage(navigate) {
  const container = document.createElement('div');
  container.className = 'w-full h-full overflow-y-auto bg-[#08080a] text-[#f5f7fa] selection:bg-[#00e5ff] selection:text-[#08080a]';

  container.innerHTML = `
    <!-- Top Announcement Strip -->
    <div class="bg-[#0c0c12] border-b border-white/10 text-xs font-medium py-2.5 px-4 text-center flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-zinc-300">
      <span class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-[#00e5ff] animate-pulse"></span>
        <strong class="text-white">Timecapsule Studio 2.0 Live</strong> — Cinematic multi-model creative suite
      </span>
      <span class="hidden sm:inline opacity-30">|</span>
      <span class="text-zinc-400">Arri Alexa, IMAX 70mm, Seedance 2.5, Google Veo, Nano Banana</span>
      <button id="strip-explore-btn" class="text-[#00e5ff] hover:text-[#38bdf8] font-bold text-xs underline cursor-pointer">
        Open Studio →
      </button>
    </div>

    <!-- =========================================================================
         Hero Section: Direct Multi-Provider AI Gateway
         ========================================================================= -->
    <section class="relative overflow-hidden py-16 sm:py-24 border-b border-white/10 bg-[#08080a]">
      <!-- Background Glow Grid -->
      <div class="absolute inset-0 pointer-events-none select-none">
        <div class="absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,_rgba(0,229,255,0.08)_0%,_rgba(155,140,255,0.03)_40%,_transparent_75%)]"></div>
        <div class="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-30"></div>
      </div>

      <div class="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 text-center">
        <!-- Badge -->
        <div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[11px] font-bold uppercase tracking-wider mb-6">
          <span class="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping"></span>
          Cinematic Multimodal AI Studio
        </div>

        <!-- Headline -->
        <h1 class="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.12] mb-6">
          From Imagination <br class="hidden sm:block" />
          To <span class="bg-gradient-to-r from-[#00e5ff] via-[#38bdf8] to-[#c084fc] bg-clip-text text-transparent">Cinematic Motion</span>
        </h1>

        <!-- Subtitle -->
        <p class="text-sm sm:text-base text-zinc-300 max-w-2xl mx-auto leading-relaxed mb-8">
          Turn ideas into photorealistic images, cinema-grade video, and lip-synced avatars.
          A dedicated creative workspace powered by direct multi-provider model routing.
        </p>

        <!-- CTA Action Buttons -->
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto mb-10">
          <button id="hero-launch-cinema-btn" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#00e5ff] hover:bg-[#38bdf8] text-[#08080a] font-black text-xs uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,229,255,0.35)] hover:shadow-[0_0_35px_rgba(0,229,255,0.55)] hover:scale-105 active:scale-95 cursor-pointer">
            Launch Cinema Studio →
          </button>
          <button id="hero-launch-video-btn" class="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#121217] hover:bg-[#181820] border border-white/20 hover:border-white/40 text-white font-bold text-xs uppercase tracking-wider transition-all cursor-pointer">
            Create AI Video
          </button>
        </div>

        <!-- Trust Guarantees -->
        <div class="flex items-center justify-center gap-4 sm:gap-8 text-[11px] font-mono text-zinc-400 flex-wrap">
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Fail-Closed Safety Seams
          </span>
          <span class="opacity-30">•</span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-[#00e5ff]"></span>
            Multi-Tenant Isolation
          </span>
          <span class="opacity-30">•</span>
          <span class="flex items-center gap-1.5">
            <span class="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
            Real-Time SSE Streaming
          </span>
        </div>
      </div>
    </section>

    <!-- =========================================================================
         Studio Modes: Dedicated Creative Suites
         ========================================================================= -->
    <section class="py-16 sm:py-20 bg-[#09090b] border-b border-white/10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
            CREATIVE SUITES
          </span>
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 mb-3">
            Choose Your Studio Mode
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400">
            Switch between specialized generative tools designed for professional directors, artists, and creators.
          </p>
        </div>

        <!-- 4 Studio Mode Cards Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          
          <!-- Mode 1: Cinema Studio -->
          <div class="p-6 rounded-2xl bg-[#0e0e14] border border-white/10 hover:border-[#00e5ff]/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.12)] transition-all flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-[#00e5ff]/10 border border-[#00e5ff]/30 flex items-center justify-center text-[#00e5ff] mb-5 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M23 7l-7 5 7 5V7z"></path>
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
                </svg>
              </div>
              <h3 class="text-base font-black text-white mb-2 group-hover:text-[#00e5ff] transition-colors">Cinema Studio</h3>
              <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                Simulate legendary camera bodies (Arri, RED, IMAX), anamorphic lenses, aperture depth-of-field, and 4K film stocks.
              </p>
              <div class="flex flex-wrap gap-1.5 mb-6">
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">Arri Alexa</span>
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">Cooke Anamorphic</span>
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">4K UHD</span>
              </div>
            </div>
            <button id="card-cinema-btn" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#00e5ff] text-zinc-300 hover:text-black font-bold text-xs transition-all border border-white/10 hover:border-transparent cursor-pointer">
              Open Cinema Studio →
            </button>
          </div>

          <!-- Mode 2: Video Studio -->
          <div class="p-6 rounded-2xl bg-[#0e0e14] border border-white/10 hover:border-[#00e5ff]/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.12)] transition-all flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-5 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <h3 class="text-base font-black text-white mb-2 group-hover:text-purple-400 transition-colors">Video Studio</h3>
              <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                Generate high-dynamic motion with Text-to-Video and Image-to-Video using Seedance, Kling 2.1, and Google Veo.
              </p>
              <div class="flex flex-wrap gap-1.5 mb-6">
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">Seedance 2.5</span>
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">Kling Pro</span>
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">T2V / I2V</span>
              </div>
            </div>
            <button id="card-video-btn" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#00e5ff] text-zinc-300 hover:text-black font-bold text-xs transition-all border border-white/10 hover:border-transparent cursor-pointer">
              Generate Video →
            </button>
          </div>

          <!-- Mode 3: Image Studio -->
          <div class="p-6 rounded-2xl bg-[#0e0e14] border border-white/10 hover:border-[#00e5ff]/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.12)] transition-all flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-5 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                  <circle cx="8.5" cy="8.5" r="1.5"></circle>
                  <polyline points="21 15 16 10 5 21"></polyline>
                </svg>
              </div>
              <h3 class="text-base font-black text-white mb-2 group-hover:text-emerald-400 transition-colors">Image Studio</h3>
              <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                State-of-the-art image synthesis with Nano Banana Pro, Flux Dev, and Qwen image inpainting with reference consistency.
              </p>
              <div class="flex flex-wrap gap-1.5 mb-6">
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">Nano Banana</span>
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">Flux Dev</span>
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">T2I / I2I</span>
              </div>
            </div>
            <button id="card-image-btn" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#00e5ff] text-zinc-300 hover:text-black font-bold text-xs transition-all border border-white/10 hover:border-transparent cursor-pointer">
              Create Image →
            </button>
          </div>

          <!-- Mode 4: LipSync Studio -->
          <div class="p-6 rounded-2xl bg-[#0e0e14] border border-white/10 hover:border-[#00e5ff]/50 hover:shadow-[0_0_30px_rgba(0,229,255,0.12)] transition-all flex flex-col justify-between group">
            <div>
              <div class="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-5 group-hover:scale-110 transition-transform">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"></path>
                  <path d="M19 10v2a7 7 0 0 1-14 0v-2"></path>
                  <line x1="12" y1="19" x2="12" y2="23"></line>
                  <line x1="8" y1="23" x2="16" y2="23"></line>
                </svg>
              </div>
              <h3 class="text-base font-black text-white mb-2 group-hover:text-amber-400 transition-colors">Lip Sync Studio</h3>
              <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                Bring characters and avatars to life by syncing voice audio tracks directly with facial phonemes and natural head motion.
              </p>
              <div class="flex flex-wrap gap-1.5 mb-6">
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">InfiniTalk</span>
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">Audio Sync</span>
                <span class="px-2 py-0.5 rounded bg-white/5 text-[10px] text-zinc-400 font-mono">Phoneme Match</span>
              </div>
            </div>
            <button id="card-lipsync-btn" class="w-full py-2.5 rounded-xl bg-white/5 hover:bg-[#00e5ff] text-zinc-300 hover:text-black font-bold text-xs transition-all border border-white/10 hover:border-transparent cursor-pointer">
              Sync Audio →
            </button>
          </div>

        </div>
      </div>
    </section>

    <!-- =========================================================================
         Featured Models & Parameters
         ========================================================================= -->
    <section class="py-16 sm:py-20 bg-[#08080a] border-b border-white/10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-white/10">
          <div>
            <span class="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
              PRODUCTION CAPABILITIES
            </span>
            <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1">
              Featured Generative Models
            </h2>
            <p class="text-xs sm:text-sm text-zinc-400 mt-1">
              Tested for high fidelity, low latency, and zero prompt drift.
            </p>
          </div>

          <button id="models-launch-btn" class="self-start sm:self-auto px-5 py-2.5 rounded-xl bg-[#121217] hover:bg-[#181820] border border-white/15 text-xs font-bold text-zinc-200 hover:text-[#00e5ff] transition-all cursor-pointer">
            Open Studio Environment →
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-5 rounded-2xl bg-[#0e0e14] border border-white/10 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-white">Nano Banana Pro</span>
                <span class="px-2 py-0.5 rounded bg-[#00e5ff]/10 text-[#00e5ff] text-[10px] font-mono">1.2s avg</span>
              </div>
              <span class="text-[10px] text-zinc-500 font-mono block mb-2">TEXT TO IMAGE · 2K / 4K</span>
              <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                High-speed generative photorealism with strict prompt adherence, native lighting, and ultra-crisp textures.
              </p>
            </div>
            <div class="pt-3 border-t border-white/5 flex items-center justify-between">
              <span class="text-xs font-mono text-[#00e5ff] font-bold">$0.015 / gen</span>
              <button id="btn-model-banana" class="text-xs font-bold text-zinc-300 hover:text-[#00e5ff] cursor-pointer">Launch in Studio →</button>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-[#0e0e14] border border-white/10 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-white">Seedance 2.5 Cinema</span>
                <span class="px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 text-[10px] font-mono">8.4s avg</span>
              </div>
              <span class="text-[10px] text-zinc-500 font-mono block mb-2">TEXT TO VIDEO · 1080P</span>
              <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                Ultra-smooth cinematic camera pan, tilt, zoom, and coherent temporal continuity across full scenes.
              </p>
            </div>
            <div class="pt-3 border-t border-white/5 flex items-center justify-between">
              <span class="text-xs font-mono text-purple-400 font-bold">$0.120 / 5s</span>
              <button id="btn-model-seedance" class="text-xs font-bold text-zinc-300 hover:text-purple-400 cursor-pointer">Launch in Studio →</button>
            </div>
          </div>

          <div class="p-5 rounded-2xl bg-[#0e0e14] border border-white/10 flex flex-col justify-between">
            <div>
              <div class="flex items-center justify-between mb-3">
                <span class="text-xs font-bold text-white">Google Veo 3.1 Fast</span>
                <span class="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-mono">11.8s avg</span>
              </div>
              <span class="text-[10px] text-zinc-500 font-mono block mb-2">TEXT TO VIDEO · 8 SECONDS</span>
              <p class="text-xs text-zinc-400 leading-relaxed mb-4">
                State-of-the-art Google DeepMind video foundation model for high visual fidelity and complex physical motions.
              </p>
            </div>
            <div class="pt-3 border-t border-white/5 flex items-center justify-between">
              <span class="text-xs font-mono text-emerald-400 font-bold">$0.600 / 8s</span>
              <button id="btn-model-veo" class="text-xs font-bold text-zinc-300 hover:text-emerald-400 cursor-pointer">Launch in Studio →</button>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================================
         Why Developers & Creators Choose Timecapsule
         ========================================================================= -->
    <section class="py-16 sm:py-20 bg-[#09090b] border-b border-white/10">
      <div class="max-w-6xl mx-auto px-4 sm:px-6">
        <div class="text-center max-w-2xl mx-auto mb-12">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
            ARCHITECTURE & INTEGRITY
          </span>
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 mb-3">
            Built for Production Reliability
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400">
            A hardened engineering foundation eliminating vendor lock-in, silent failures, and billing surprises.
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="p-6 rounded-2xl bg-[#0c0c12] border border-white/10">
            <div class="w-10 h-10 rounded-lg bg-[#00e5ff]/10 flex items-center justify-center text-[#00e5ff] mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-white mb-2">Fail-Closed Security</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">
              Strict request validation, MIME magic-byte sniffing, and fenced worker leases preventing corrupted runs or malicious uploads.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-[#0c0c12] border border-white/10">
            <div class="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
            <h3 class="text-sm font-bold text-white mb-2">Double-Entry Credit Ledger</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">
              Append-only accounting guarantees zero lost credits. Failed or timed-out generation jobs automatically refund instantly.
            </p>
          </div>

          <div class="p-6 rounded-2xl bg-[#0c0c12] border border-white/10">
            <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>
            </div>
            <h3 class="text-sm font-bold text-white mb-2">Tenant-Isolated RLS</h3>
            <p class="text-xs text-zinc-400 leading-relaxed">
              PostgreSQL Row-Level Security scoped by tenant boundaries. Your assets, history, and generations remain 100% private.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================================
         FAQ Section
         ========================================================================= -->
    <section class="py-16 sm:py-20 bg-[#08080a] border-b border-white/10">
      <div class="max-w-3xl mx-auto px-4 sm:px-6">
        <div class="text-center mb-10">
          <span class="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
            QUESTIONS & ANSWERS
          </span>
          <h2 class="text-2xl sm:text-3xl font-black text-white tracking-tight mt-1 mb-2">
            Frequently Asked Questions
          </h2>
          <p class="text-xs sm:text-sm text-zinc-400">Everything you need to know about getting started.</p>
        </div>

        <div class="space-y-4">
          <div class="p-5 rounded-2xl bg-[#0c0c12] border border-white/10">
            <h4 class="text-sm font-bold text-white mb-2">What is Timecapsule Studio?</h4>
            <p class="text-xs text-zinc-400 leading-relaxed">
              Timecapsule Studio is a cinematic creative platform for generating AI video, photorealistic images, voice lip-sync, and film-style visual sequences across top model providers.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-[#0c0c12] border border-white/10">
            <h4 class="text-sm font-bold text-white mb-2">Do I need my own API keys to test?</h4>
            <p class="text-xs text-zinc-400 leading-relaxed">
              You can explore the full UI, camera configurations, and presets immediately. To trigger live generations, you can either sign in with your account or enter a provider API key in your private browser settings.
            </p>
          </div>

          <div class="p-5 rounded-2xl bg-[#0c0c12] border border-white/10">
            <h4 class="text-sm font-bold text-white mb-2">What makes Cinema Studio different from standard prompts?</h4>
            <p class="text-xs text-zinc-400 leading-relaxed">
              Cinema Studio gives you real physical lens physics controls: Arri Alexa color science, RED V-Raptor sharpness, Cooke anamorphic flares, precise focal lengths (24mm, 50mm, 85mm), and real aperture depths (f/1.4, f/2.8).
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- =========================================================================
         Footer
         ========================================================================= -->
    <footer class="py-12 bg-[#050508] border-t border-white/5 text-center text-xs text-zinc-500">
      <div class="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <div class="w-6 h-6 bg-[#09090b] border border-[#00e5ff]/40 rounded flex items-center justify-center p-1">
            <svg viewBox="0 0 240 240" class="w-full h-full" fill="none">
              <path d="M 36 45 H 180 V 69 H 60 V 129 H 132 V 153 H 36 Z" fill="#F5F7FA"/>
              <path d="M 108 87 H 204 V 195 H 60 V 171 H 180 V 111 H 108 Z" fill="#00E5FF"/>
            </svg>
          </div>
          <span class="text-sm font-bold text-white uppercase tracking-wider">Timecapsule Studio</span>
        </div>
        <p>© 2026 Timecapsule Studio. All rights reserved.</p>
        <div class="flex items-center gap-4 text-xs">
          <button id="footer-cinema-btn" class="hover:text-white transition-colors cursor-pointer">Cinema Studio</button>
          <button id="footer-video-btn" class="hover:text-white transition-colors cursor-pointer">Video Studio</button>
          <button id="footer-image-btn" class="hover:text-white transition-colors cursor-pointer">Image Studio</button>
        </div>
      </div>
    </footer>
  `;

  // Attach Navigation Listeners to all buttons
  const goto = (page) => {
    if (navigate) navigate(page);
    window.dispatchEvent(new CustomEvent('nav-page-change', { detail: { page } }));
  };

  container.querySelector('#strip-explore-btn')?.addEventListener('click', () => goto('cinema'));
  container.querySelector('#hero-launch-cinema-btn')?.addEventListener('click', () => goto('cinema'));
  container.querySelector('#hero-launch-video-btn')?.addEventListener('click', () => goto('video'));

  container.querySelector('#card-cinema-btn')?.addEventListener('click', () => goto('cinema'));
  container.querySelector('#card-video-btn')?.addEventListener('click', () => goto('video'));
  container.querySelector('#card-image-btn')?.addEventListener('click', () => goto('image'));
  container.querySelector('#card-lipsync-btn')?.addEventListener('click', () => goto('lipsync'));

  container.querySelector('#models-launch-btn')?.addEventListener('click', () => goto('cinema'));
  container.querySelector('#btn-model-banana')?.addEventListener('click', () => goto('image'));
  container.querySelector('#btn-model-seedance')?.addEventListener('click', () => goto('video'));
  container.querySelector('#btn-model-veo')?.addEventListener('click', () => goto('video'));

  container.querySelector('#footer-cinema-btn')?.addEventListener('click', () => goto('cinema'));
  container.querySelector('#footer-video-btn')?.addEventListener('click', () => goto('video'));
  container.querySelector('#footer-image-btn')?.addEventListener('click', () => goto('image'));

  return container;
}
