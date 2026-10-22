'use client';

import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';
import BrandIcon from '@/components/BrandIcon';

export default function CliPage() {
  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="cli" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 xl:px-0 py-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-500/30">
                Developer Tooling
              </span>
              <ModuleStatusBadge status="working" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight mb-2">
              Timecapsule CLI & Model Context Protocol (MCP) Gateway
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Connect autonomous coding agents, Claude Desktop, Cursor, and terminal scripts directly to your local Timecapsule AI engine via LiteLLM and Model Context Protocol.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-[#121217] border border-white/10 rounded-xl p-3.5 self-start shadow-sm">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-[#f5f7fa] uppercase tracking-wider">Gateway Status</div>
              <div className="text-xs text-zinc-400 font-mono">127.0.0.1:4001 • Online</div>
            </div>
          </div>
        </div>

        {/* Quickstart Command Card */}
        <div className="bg-[#121217] border border-white/10 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <h3 className="text-sm font-bold text-[#f5f7fa] uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Terminal Quick Launch
          </h3>
          <p className="text-xs text-zinc-400 mb-6 max-w-xl">
            Start the unified Model Context Protocol daemon to expose all multimodal generation capabilities as native tools to AI agents:
          </p>

          <div className="bg-[#09090b] border border-white/10 text-zinc-200 rounded-lg p-4 font-mono text-xs sm:text-sm overflow-x-auto no-scrollbar shadow-inner">
            <div className="text-zinc-500 select-none mb-1"># Start Timecapsule MCP Server & CLI Gateway</div>
            <div className="flex items-center justify-between text-[#00e5ff]">
              <code>npx @timecapsule/mcp-gateway --port 4001 --host 127.0.0.1</code>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText('npx @timecapsule/mcp-gateway --port 4001 --host 127.0.0.1')}
                className="text-xs px-2.5 py-1 rounded bg-white/10 text-zinc-200 hover:text-white hover:bg-white/20 transition-colors cursor-pointer"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#121217] border border-white/10 rounded-xl p-5 shadow-sm hover:border-blue-500/50 transition-all">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center font-bold text-sm mb-3 border border-blue-500/20">
              <BrandIcon name="bolt" className="w-4 h-4 text-blue-400" />
            </div>
            <h4 className="text-sm font-bold text-[#f5f7fa] mb-1.5">Direct Agent Tooling</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Exposes text-to-image, video rendering, and lip sync directly as callable MCP tools inside Claude Desktop and Cursor.
            </p>
          </div>

          <div className="bg-[#121217] border border-white/10 rounded-xl p-5 shadow-sm hover:border-emerald-500/50 transition-all">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold text-sm mb-3 border border-emerald-500/20">
              <BrandIcon name="shield" className="w-4 h-4 text-emerald-400" />
            </div>
            <h4 className="text-sm font-bold text-[#f5f7fa] mb-1.5">Durable Fencing</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              CLI and agent requests inherit the same PostgreSQL transactional ledger, fencing tokens, and lease locks as the web UI.
            </p>
          </div>

          <div className="bg-[#121217] border border-white/10 rounded-xl p-5 shadow-sm hover:border-purple-500/50 transition-all">
            <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-300 flex items-center justify-center font-bold text-sm mb-3 border border-purple-500/20">
              <BrandIcon name="product" className="w-4 h-4 text-purple-400" />
            </div>
            <h4 className="text-sm font-bold text-[#f5f7fa] mb-1.5">Zero Silent Substitution</h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Every route requested by your terminal script executes the exact pinned model version or fails closed with clear diagnostic errors.
            </p>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
