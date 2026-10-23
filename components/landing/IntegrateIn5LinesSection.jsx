'use client';

import React, { useState } from 'react';
import { TIMECAPSULE_BRAND } from '@/branding';

const SNIPPETS = {
  curl: `# 1. Submit Generation Task with Webhook Callback
curl -X POST "https://api.timecapsule.studio/api/v1/veo3-text-to-video?webhook=https://your-domain.com/webhook" \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: YOUR_API_KEY" \\
  -d '{"prompt": "Cinematic shot of an obsidian architectural monolith, cyan neon glow, 8k"}'

# 2. Example payload sent to your webhook URL:
# {
#   "id": "task_abc123",
#   "status": "completed",
#   "outputs": ["https://cdn.timecapsule.studio/output_123.mp4"]
# }`,

  javascript: `import { TimecapsuleClient } from '@timecapsule/core';

// 1. Initialize client with server-side API key
const client = new TimecapsuleClient({ apiKey: process.env.TIMECAPSULE_API_KEY });

// 2. Submit generation job with webhook or await completion
const task = await client.video.generate({
  model: 'veo3-text-to-video',
  prompt: 'Cinematic shot of an obsidian architectural monolith, cyan neon glow, 8k',
  webhook: 'https://your-domain.com/webhook',
});

console.log(\`Task queued with ID: \${task.id}\`);`,

  python: `from timecapsule import TimecapsuleClient
import os

# 1. Initialize client
client = TimecapsuleClient(api_key=os.environ.get("TIMECAPSULE_API_KEY"))

# 2. Submit task with webhook callback
task = client.video.generate(
    model="veo3-text-to-video",
    prompt="Cinematic shot of an obsidian architectural monolith, cyan neon glow, 8k",
    webhook="https://your-domain.com/webhook"
)

print(f"Task queued with ID: {task.id}")`,
};

export default function IntegrateIn5LinesSection() {
  const [activeTab, setActiveTab] = useState('curl');
  const [copied, setCopied] = useState(false);

  const copyCode = () => {
    navigator.clipboard.writeText(SNIPPETS[activeTab]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <section className="py-20 sm:py-28 bg-[#08080a] border-b border-white/5 relative overflow-hidden">
      {/* Background radial atmosphere */}
      <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-[1360px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          
          {/* Left Column: Heading + 4 Steps */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="inline-flex items-center self-start px-3 py-1 rounded-full bg-[#00e5ff]/10 border border-[#00e5ff]/30 text-[#00e5ff] text-[11px] font-bold uppercase tracking-wider mb-5">
              DEVELOPER FIRST
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#f5f7fa] tracking-tight leading-[1.15] mb-5">
              Integrate AI <br />
              <span className="bg-gradient-to-r from-[#00e5ff] via-[#38bdf8] to-[#9b8cff] bg-clip-text text-transparent">
                In Under 5 Lines
              </span>
            </h2>

            <p className="text-sm text-zinc-400 leading-relaxed mb-8">
              One unified API layer for generating videos, images, and audio. Authenticate, choose your model parameters, queue the job, and fetch output assets smoothly.
            </p>

            {/* 4 Steps with Number Badges */}
            <div className="space-y-6">
              {[
                {
                  step: '1',
                  title: 'Get API Credentials',
                  desc: 'Sign up and generate your secure x-api-key in the developer panel.',
                },
                {
                  step: '2',
                  title: 'Submit Task with Webhook',
                  desc: 'Submit generation requests specifying the target model parameters and your callback endpoint URL.',
                },
                {
                  step: '3',
                  title: 'Receive Webhook Callbacks',
                  desc: `Let ${TIMECAPSULE_BRAND.name} call your webhook endpoint immediately with the final output JSON when processing completes.`,
                },
                {
                  step: '4',
                  title: 'Retrieve Output Assets',
                  desc: 'Store and display the CDN links to MP4 videos or high-resolution images included in the webhook payload.',
                },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-[#181822] border border-white/10 flex items-center justify-center shrink-0 text-zinc-300 font-bold text-xs shadow-inner">
                    {item.step}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#f5f7fa] mb-1">
                      {item.title}
                    </h3>
                    <p className="text-xs text-zinc-400 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column: Code Terminal */}
          <div className="lg:col-span-7">
            <div className="bg-[#0c0c12] border border-white/15 rounded-2xl shadow-2xl overflow-hidden backdrop-blur-md">
              {/* Terminal Titlebar */}
              <div className="px-4 py-3 bg-[#121218] border-b border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-[#ff5f56]" />
                  <span className="w-3 h-3 rounded-full bg-[#ffbd2e]" />
                  <span className="w-3 h-3 rounded-full bg-[#27c93f]" />
                  <span className="text-xs font-mono text-zinc-400 ml-2">Terminal</span>
                </div>

                <div className="flex items-center gap-1 bg-[#09090d] p-1 rounded-lg border border-white/5">
                  {['curl', 'javascript', 'python'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setActiveTab(tab)}
                      className={`px-3 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
                        activeTab === tab
                          ? 'bg-[#181824] text-[#00e5ff] shadow-xs'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      {tab === 'curl' ? 'cURL' : tab === 'javascript' ? 'JavaScript' : 'Python'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Terminal Code Window */}
              <div className="relative p-6 font-mono text-xs sm:text-[13px] leading-relaxed bg-[#0a0a0f] text-zinc-300 overflow-x-auto min-h-[340px]">
                <button
                  type="button"
                  onClick={copyCode}
                  className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-[#181822] hover:bg-[#20202e] border border-white/10 text-zinc-300 hover:text-white text-[11px] font-sans font-medium flex items-center gap-1.5 transition-all shadow-sm cursor-pointer z-10"
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  {copied ? 'Copied!' : 'Copy'}
                </button>

                <pre className="text-zinc-300 font-mono">
                  <code>{SNIPPETS[activeTab]}</code>
                </pre>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
