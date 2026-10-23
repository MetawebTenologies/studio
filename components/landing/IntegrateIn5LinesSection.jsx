'use client';

import React, { useState } from 'react';

const CODE_EXAMPLES = {
  curl: `curl -X POST "https://api.timecapsule.ai/v1/generations" \\
  -H "Authorization: Bearer tc_live_your_api_key" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "seedance-pro-t2v",
    "prompt": "Cinematic tracking shot through neon rain, 4k 60fps",
    "aspect_ratio": "16:9"
  }'`,
  nodejs: `import { TimecapsuleClient } from '@timecapsule/client';

const client = new TimecapsuleClient({ apiKey: process.env.TIMECAPSULE_API_KEY });

const generation = await client.generations.create({
  model: 'seedance-pro-t2v',
  prompt: 'Cinematic tracking shot through neon rain, 4k 60fps',
  aspect_ratio: '16:9',
});

console.log(generation.assetUrl);`,
  python: `from timecapsule import Timecapsule

client = Timecapsule(api_key="tc_live_your_api_key")

job = client.generations.create(
    model="seedance-pro-t2v",
    prompt="Cinematic tracking shot through neon rain, 4k 60fps",
    aspect_ratio="16:9",
)

print(job.asset_url)`,
};

export default function IntegrateIn5LinesSection() {
  const [activeLang, setActiveLang] = useState('curl');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(CODE_EXAMPLES[activeLang]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 sm:py-28 bg-[#08080a] border-b border-white/5 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-[500px] h-[300px] bg-[radial-gradient(circle_at_center,_rgba(0,229,255,0.05)_0%,_transparent_70%)] pointer-events-none" />

      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-14">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff] font-mono">
            DEVELOPER FIRST EXPERIENCE
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-[#f5f7fa] tracking-tight mt-2 mb-3">
            Integrate AI In Under 5 Lines
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            One single unified interface contract for 600+ foundation models. Zero vendor lock-in, double-entry credit accounting, and guaranteed fail-closed model pinning.
          </p>
        </div>

        {/* Code & Response Terminal Mockup */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          
          {/* Left Column: Code Editor Terminal (7 cols) */}
          <div className="lg:col-span-7 bg-[#0d0d12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col">
            {/* Terminal Window Header */}
            <div className="px-4 py-3 bg-[#13131a] border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="ml-2 text-xs font-mono text-zinc-400">
                  timecapsule-sdk
                </span>
              </div>

              {/* Language Tabs */}
              <div className="flex items-center gap-1 bg-[#09090d] p-1 rounded-lg border border-white/5">
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'nodejs', label: 'Node.js' },
                  { id: 'python', label: 'Python' },
                ].map((lang) => (
                  <button
                    key={lang.id}
                    onClick={() => setActiveLang(lang.id)}
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold transition-all cursor-pointer ${
                      activeLang === lang.id
                        ? 'bg-[#1e1e28] text-[#00e5ff] shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Code Body */}
            <div className="p-5 font-mono text-xs sm:text-sm text-zinc-200 leading-relaxed overflow-x-auto flex-1 relative bg-[#09090d]">
              <button
                onClick={handleCopy}
                className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-[#181822] hover:bg-[#222230] border border-white/10 hover:border-[#00e5ff]/50 text-xs font-mono text-zinc-300 hover:text-white transition-all flex items-center gap-1.5 cursor-pointer"
                aria-label="Copy code snippet"
              >
                {copied ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                    </svg>
                    <span>Copy</span>
                  </>
                )}
              </button>
              <pre className="text-zinc-300 pr-16 select-text whitespace-pre-wrap">
                {CODE_EXAMPLES[activeLang]}
              </pre>
            </div>

            {/* Terminal Status Bar */}
            <div className="px-4 py-2.5 bg-[#121217] border-t border-white/5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
              <span className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                POST /api/v1/generations
              </span>
              <span>Idempotency-Key: tc_idemp_auto</span>
            </div>
          </div>

          {/* Right Column: Live Simulated Response Card (5 cols) */}
          <div className="lg:col-span-5 bg-[#0d0d12] border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col justify-between">
            <div className="px-4 py-3 bg-[#13131a] border-b border-white/10 flex items-center justify-between">
              <span className="text-xs font-mono text-zinc-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00e5ff]" />
                Simulated Execution Response
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                200 OK
              </span>
            </div>

            <div className="p-5 font-mono text-xs text-zinc-300 leading-relaxed bg-[#09090d] flex-1 overflow-x-auto select-text">
              <div className="text-zinc-500">{`// Response payload`}</div>
              <div className="text-zinc-400">{`{`}</div>
              <div className="pl-4">
                <span className="text-[#38bdf8]">"id"</span>: <span className="text-emerald-300">"job_tc_8f92a10"</span>,
              </div>
              <div className="pl-4">
                <span className="text-[#38bdf8]">"status"</span>: <span className="text-emerald-300">"completed"</span>,
              </div>
              <div className="pl-4">
                <span className="text-[#38bdf8]">"model"</span>: <span className="text-amber-300">"seedance-pro-t2v"</span>,
              </div>
              <div className="pl-4">
                <span className="text-[#38bdf8]">"asset_url"</span>: <span className="text-[#00e5ff]">"https://cdn.timecapsule.ai/assets/a8f.mp4"</span>,
              </div>
              <div className="pl-4">
                <span className="text-[#38bdf8]">"credits_settled"</span>: <span className="text-purple-300">12</span>,
              </div>
              <div className="pl-4">
                <span className="text-[#38bdf8]">"provider_latency_ms"</span>: <span className="text-purple-300">1240</span>,
              </div>
              <div className="pl-4">
                <span className="text-[#38bdf8]">"fail_closed_verified"</span>: <span className="text-emerald-400">true</span>
              </div>
              <div className="text-zinc-400">{`}`}</div>
            </div>

            <div className="p-4 bg-[#121217] border-t border-white/5 grid grid-cols-3 gap-2 text-center">
              <div className="bg-[#181822] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] font-mono text-zinc-400">LATENCY</div>
                <div className="text-xs font-bold font-mono text-[#00e5ff]">1.24s</div>
              </div>
              <div className="bg-[#181822] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] font-mono text-zinc-400">COST</div>
                <div className="text-xs font-bold font-mono text-emerald-400">$0.012</div>
              </div>
              <div className="bg-[#181822] p-2 rounded-lg border border-white/5">
                <div className="text-[10px] font-mono text-zinc-400">FAILOVER</div>
                <div className="text-xs font-bold font-mono text-purple-400">Isolated</div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
