'use client';

import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default function CliPage() {
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans">
      <PlatformNav activeModule="cli" />

      <main className="max-w-[1440px] w-full mx-auto px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded bg-blue-600/20 text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-500/30">
                Developer Tooling
              </span>
              <ModuleStatusBadge status="working" />
            </div>
            <h1 className="text-xl sm:text-3xl font-black uppercase tracking-tight text-white mb-1">
              Timecapsule MCP Server & CLI Gateway
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-2xl leading-relaxed">
              Connect autonomous coding agents, Cursor, Claude Code, and terminal workflows directly to your local Timecapsule AI cluster via LiteLLM and Model Context Protocol.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#111116] border border-zinc-800 rounded-xl p-3.5 self-start">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-white uppercase tracking-wider">Gateway Status</div>
              <div className="text-xs text-zinc-400 font-mono">127.0.0.1:4001 • Online</div>
            </div>
          </div>
        </div>

        {/* Quickstart Command Card */}
        <div className="bg-[#111116] border border-zinc-800/80 rounded-2xl p-6 sm:p-8 mb-8 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />

          <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Terminal Quick Launch
          </h3>
          <p className="text-xs text-zinc-400 mb-6 max-w-xl">
            Launch Claude Code or any MCP-compatible coding agent wired through the Timecapsule local development proxy:
          </p>

          <div className="bg-black/80 border border-zinc-800 rounded-xl p-4 font-mono text-sm flex items-center justify-between gap-4 mb-4">
            <span className="text-[#00e5ff] font-semibold">$ tc-claude</span>
            <span className="text-xs text-zinc-500">Default: Poolside Laguna-S 2.1 (Free)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="p-4 rounded-xl bg-[#14141a] border border-zinc-800">
              <span className="text-[11px] font-bold text-blue-400 uppercase block mb-1">Large Repo Reasoning</span>
              <code className="text-xs text-white/90 font-mono block">$ tc-claude free-1m</code>
              <span className="text-[10px] text-zinc-500 mt-1 block">MiniMax 1M Context Engine</span>
            </div>
            <div className="p-4 rounded-xl bg-[#14141a] border border-zinc-800">
              <span className="text-[11px] font-bold text-blue-400 uppercase block mb-1">Terminal Coding</span>
              <code className="text-xs text-white/90 font-mono block">$ tc-claude north-mini-code</code>
              <span className="text-[10px] text-zinc-500 mt-1 block">Cohere Agentic Code Engine</span>
            </div>
            <div className="p-4 rounded-xl bg-[#14141a] border border-zinc-800">
              <span className="text-[11px] font-bold text-blue-400 uppercase block mb-1">100% Offline Hardware</span>
              <code className="text-xs text-white/90 font-mono block">$ tc-claude local-coder</code>
              <span className="text-[10px] text-zinc-500 mt-1 block">Apple Silicon Ollama Qwen 7B</span>
            </div>
          </div>
        </div>

        {/* Configuration Details */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-[#111116] border border-zinc-800/80 rounded-xl p-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              Cursor & VS Code Continue Config
            </h4>
            <pre className="bg-black/80 border border-zinc-800 rounded-lg p-4 text-[11px] font-mono text-zinc-300 overflow-x-auto no-scrollbar leading-relaxed">
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

          <div className="bg-[#111116] border border-zinc-800/80 rounded-xl p-6">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              Gateway Management Commands
            </h4>
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-black/80 border border-zinc-800 rounded-lg p-3">
                <span className="text-zinc-500 text-[10px] block mb-0.5">CHECK STATUS:</span>
                <span className="text-cyan-400">~/timecapsule-dev-gateway/gateway.sh status</span>
              </div>
              <div className="bg-black/80 border border-zinc-800 rounded-lg p-3">
                <span className="text-zinc-500 text-[10px] block mb-0.5">RESTART DAEMON:</span>
                <span className="text-cyan-400">~/timecapsule-dev-gateway/gateway.sh restart</span>
              </div>
              <div className="bg-black/80 border border-zinc-800 rounded-lg p-3">
                <span className="text-zinc-500 text-[10px] block mb-0.5">LIVE STREAM LOGS:</span>
                <span className="text-cyan-400">tail -f ~/timecapsule-dev-gateway/litellm.log</span>
              </div>
            </div>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
