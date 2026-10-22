'use client';

import { useState } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([
    {
      id: 'key_1',
      name: 'Default Development Key',
      prefix: 'tc_live_948f',
      createdAt: '2026-10-21',
      lastUsed: 'Just now',
    },
  ]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');

  const handleCreate = (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;
    const newKey = {
      id: `key_${Date.now()}`,
      name: newKeyName.trim(),
      prefix: `tc_live_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString().split('T')[0],
      lastUsed: 'Never',
    };
    setKeys([newKey, ...keys]);
    setNewKeyName('');
    setShowCreateModal(false);
  };

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans">
      <PlatformNav activeModule="api-keys" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#00e5ff]">
                Developer Credentials
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-[11px] text-zinc-400 font-mono">Secret Bearer Tokens</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#f5f7fa]">
              API Keys
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1">
              Manage secret credentials for authenticating requests to Timecapsule API and MCP daemon.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold self-start sm:self-auto transition-colors shadow-xs cursor-pointer"
          >
            + Create New API Key
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-300 text-xs flex items-center gap-3 mb-8 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <BrandIcon name="lock" className="w-4 h-4 text-blue-400" />
          </div>
          <div>
            <span className="font-bold text-white">Keep your secret keys safe:</span> Your API keys carry full access to your compute balance. Never expose them in client-side browser code or public GitHub repositories.
          </div>
        </div>

        {/* API Keys Table */}
        <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#181820]/60">
            <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Active Keys</h2>
            <span className="text-xs text-zinc-400 font-mono">{keys.length} key active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181820]/80 text-zinc-400 uppercase font-semibold text-[10px] border-b border-white/10 font-mono tracking-wider">
                <tr>
                  <th className="px-6 py-3">NAME</th>
                  <th className="px-6 py-3">SECRET KEY</th>
                  <th className="px-6 py-3">CREATED AT</th>
                  <th className="px-6 py-3">LAST USED</th>
                  <th className="px-6 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-[#f5f7fa]">{k.name}</td>
                    <td className="px-6 py-3.5 font-mono text-zinc-400">
                      <code>{k.prefix}••••••••••••••••</code>
                    </td>
                    <td className="px-6 py-3.5 text-zinc-500 font-mono">{k.createdAt}</td>
                    <td className="px-6 py-3.5 text-zinc-500 font-mono">{k.lastUsed}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setKeys(keys.filter((item) => item.id !== k.id))}
                        className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer transition-colors"
                      >
                        Revoke
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Modal for Creating Key */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-base font-bold text-[#f5f7fa] mb-2">Create New API Key</h3>
              <p className="text-xs text-zinc-400 mb-4">Give your key a recognizable name to track where it is being used.</p>
              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  placeholder="e.g. Production Server, Claude MCP"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full text-xs px-3 py-2.5 bg-[#181820] border border-white/10 rounded-lg text-zinc-200 placeholder-zinc-500 mb-4 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3.5 py-2 text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer shadow-xs"
                  >
                    Generate Key
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      <PlatformFooter />
    </div>
  );
}
