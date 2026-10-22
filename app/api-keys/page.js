'use client';

import { useState } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

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
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="api-keys" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              API Keys
            </h1>
            <p className="text-xs sm:text-[13px] text-slate-500 mt-1">
              Manage secret credentials for authenticating requests to Timecapsule API and MCP daemon.
            </p>
          </div>

          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold self-start sm:self-auto transition-colors shadow-xs"
          >
            + Create New API Key
          </button>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-xs flex items-center gap-3 mb-8 shadow-xs">
          <span className="text-lg">🔒</span>
          <div>
            <span className="font-bold">Keep your secret keys safe:</span> Your API keys carry full access to your compute balance. Never expose them in client-side browser code or public GitHub repositories.
          </div>
        </div>

        {/* API Keys Table */}
        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs mb-8">
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-900">Active Keys</h2>
            <span className="text-xs text-slate-400 font-medium">{keys.length} key active</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold text-[10px] border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3">NAME</th>
                  <th className="px-6 py-3">SECRET KEY</th>
                  <th className="px-6 py-3">CREATED AT</th>
                  <th className="px-6 py-3">LAST USED</th>
                  <th className="px-6 py-3 text-right">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {keys.map((k) => (
                  <tr key={k.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="px-6 py-3.5 font-bold text-slate-900">{k.name}</td>
                    <td className="px-6 py-3.5 font-mono text-slate-600">
                      <code>{k.prefix}••••••••••••••••</code>
                    </td>
                    <td className="px-6 py-3.5 text-slate-500">{k.createdAt}</td>
                    <td className="px-6 py-3.5 text-slate-500">{k.lastUsed}</td>
                    <td className="px-6 py-3.5 text-right">
                      <button
                        onClick={() => setKeys(keys.filter((item) => item.id !== k.id))}
                        className="text-rose-600 hover:text-rose-700 font-semibold"
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
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white border border-slate-200 rounded-xl p-6 max-w-md w-full shadow-xl">
              <h3 className="text-base font-bold text-slate-900 mb-2">Create New API Key</h3>
              <p className="text-xs text-slate-500 mb-4">Give your key a recognizable name to track where it is being used.</p>
              <form onSubmit={handleCreate}>
                <input
                  type="text"
                  placeholder="e.g. Production Server, Claude MCP"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  className="w-full text-xs px-3 py-2 border border-slate-200 rounded mb-4 focus:outline-none focus:border-blue-500"
                  autoFocus
                />
                <div className="flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-3 py-1.5 text-xs text-slate-600 hover:text-slate-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-xs font-semibold transition-colors"
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
