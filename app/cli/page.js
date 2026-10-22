'use client';

import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default function CliPage() {
  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#f8fafc)] text-[var(--tc-text-primary,#0f172a)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="cli" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 xl:px-0 py-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded bg-blue-50 text-blue-600 text-[11px] font-bold uppercase tracking-wider border border-blue-200">
                Developer Tooling
              </span>
              <ModuleStatusBadge status="working" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mb-2">
              Timecapsule CLI & Model Context Protocol (MCP) Gateway
            </h1>
            <p className="text-slate-600 text-sm max-w-2xl leading-relaxed">
              Connect autonomous coding agents, Claude Desktop, Cursor, and terminal scripts directly to your local Timecapsule AI engine via LiteLLM and Model Context Protocol.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-lg p-3.5 self-start shadow-xs">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <div>
              <div className="text-xs font-bold text-slate-900 uppercase tracking-wider">Gateway Status</div>
              <div className="text-xs text-slate-500 font-mono">127.0.0.1:4001 • Online</div>
            </div>
          </div>
        </div>

        {/* Quickstart Command Card */}
        <div className="bg-white border border-slate-200/90 rounded-[8px] p-6 sm:p-8 mb-8 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            Terminal Quick Launch
          </h3>
          <p className="text-xs text-slate-600 mb-6 max-w-xl">
            Start the unified Model Context Protocol daemon to expose all multimodal generation capabilities as native tools to AI agents:
          </p>

          <div className="bg-slate-900 text-slate-100 rounded-md p-4 font-mono text-xs sm:text-sm overflow-x-auto no-scrollbar shadow-inner">
            <div className="text-slate-400 select-none mb-1"># Start Timecapsule MCP Server & CLI Gateway</div>
            <div className="flex items-center justify-between text-blue-400">
              <code>npx @timecapsule/mcp-gateway --port 4001 --host 127.0.0.1</code>
              <button
                type="button"
                onClick={() => navigator.clipboard?.writeText('npx @timecapsule/mcp-gateway --port 4001 --host 127.0.0.1')}
                className="text-xs px-2.5 py-1 rounded bg-slate-800 text-slate-300 hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white border border-slate-200/90 rounded-[8px] p-5 shadow-xs">
            <div className="w-8 h-8 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-sm mb-3">
              ⚡
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Direct Agent Tooling</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Exposes text-to-image, video rendering, and lip sync directly as callable MCP tools inside Claude Desktop and Cursor.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-[8px] p-5 shadow-xs">
            <div className="w-8 h-8 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-sm mb-3">
              🛡️
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Durable Fencing</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              CLI and agent requests inherit the same PostgreSQL transactional ledger, fencing tokens, and lease locks as the web UI.
            </p>
          </div>

          <div className="bg-white border border-slate-200/90 rounded-[8px] p-5 shadow-xs">
            <div className="w-8 h-8 rounded-md bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-sm mb-3">
              📦
            </div>
            <h4 className="text-sm font-bold text-slate-900 mb-1.5">Zero Silent Substitution</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              Every route requested by your terminal script executes the exact pinned model version or fails closed with clear diagnostic errors.
            </p>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
