'use client';

import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default function CliPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <PlatformNav activeModule="cli" />

      <main className="max-w-6xl mx-auto px-6 py-12 flex-1 w-full">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <span className="px-2.5 py-1 rounded bg-[#00e5ff]/15 text-[#00e5ff] text-[11px] font-black uppercase tracking-wider border border-[#00e5ff]/30">
                Developer Tooling
              </span>
              <ModuleStatusBadge status="working" />
            </div>
            <h1 className="text-3xl sm:text-4xl font-black uppercase tracking-tight mb-2">
              Timecapsule MCP Server & CLI Gateway
            </h1>
            <p className="text-white/60 text-sm max-w-2xl">
              Connect autonomous coding agents, Cursor, Claude Code, and terminal workflows directly to your local Timecapsule AI cluster via LiteLLM and Model Context Protocol.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#121217] border border-white/10 rounded-2xl p-4">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Gateway Status</div>
              <div className="text-xs text-white/50 font-mono">127.0.0.1:4001 • Online</div>
            </div>
          </div>
        </div>

        {/* Quickstart Command Card */}
        <div className="bg-[#121217] border border-white/10 rounded-3xl p-8 mb-10 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-[#00e5ff]/5 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-base font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Terminal Quick Launch
          </h3>
          <p className="text-xs text-white/50 mb-6 max-w-xl">
            Launch Claude Code or any MCP-compatible coding agent wired through the Timecapsule local development proxy:
          </p>

          <div className="bg-black/80 border border-white/10 rounded-2xl p-4 font-mono text-sm flex items-center justify-between gap-4 mb-4">
            <span className="text-[#00e5ff]">$ tc-claude</span>
            <span className="text-xs text-white/40">Default: Poolside Laguna-S 2.1 (Free)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[11px] font-bold text-[#00e5ff] uppercase block mb-1">Large Repo Reasoning</span>
              <code className="text-xs text-white/80 font-mono block">$ tc-claude free-1m</code>
              <span className="text-[10px] text-white/40 mt-1 block">MiniMax 1M Context Engine</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[11px] font-bold text-[#00e5ff] uppercase block mb-1">Terminal Coding</span>
              <code className="text-xs text-white/80 font-mono block">$ tc-claude north-mini-code</code>
              <span className="text-[10px] text-white/40 mt-1 block">Cohere Agentic Code Engine</span>
            </div>
            <div className="p-4 rounded-xl bg-white/5 border border-white/5">
              <span className="text-[11px] font-bold text-[#00e5ff] uppercase block mb-1">100% Offline Hardware</span>
              <code className="text-xs text-white/80 font-mono block">$ tc-claude local-coder</code>
              <span className="text-[10px] text-white/40 mt-1 block">Apple Silicon Ollama Qwen 7B</span>
            </div>
          </div>
        </div>

        {/* Architecture & MCP Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          <div className="bg-[#121217] border border-white/10 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#00e5ff]" />
              Cursor & VS Code Continue Config
            </h4>
            <pre className="bg-black/60 rounded-xl p-4 text-[11px] font-mono text-white/70 overflow-x-auto border border-white/5 leading-relaxed">
{`models:
  - name: Timecapsule Laguna-S
    model: laguna-s
    apiBase: http://127.0.0.1:4001/v1
    provider: openai
  - name: Timecapsule 1M Context
    model: free-1m
    apiBase: http://127.0.0.1:4001/v1
    provider: openai`}
            </pre>
          </div>

          <div className="bg-[#121217] border border-white/10 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Gateway Management Commands
            </h4>
            <div className="space-y-3 text-xs font-mono">
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-white/40 block text-[10px] uppercase font-sans font-bold">Check Status:</span>
                <span className="text-[#00e5ff]">~/timecapsule-dev-gateway/gateway.sh status</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-white/40 block text-[10px] uppercase font-sans font-bold">Restart Daemon:</span>
                <span className="text-[#00e5ff]">~/timecapsule-dev-gateway/gateway.sh restart</span>
              </div>
              <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-white/40 block text-[10px] uppercase font-sans font-bold">Live Stream Logs:</span>
                <span className="text-[#00e5ff]">tail -f ~/timecapsule-dev-gateway/litellm.log</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
