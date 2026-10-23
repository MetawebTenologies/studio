'use client';

import { useState, useEffect, useCallback } from 'react';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';
import BrandIcon from '@/components/BrandIcon';

const AVAILABLE_SCOPES = [
  { id: 'generations:write', label: 'generations:write', description: 'Submit AI image and video generation jobs' },
  { id: 'generations:read', label: 'generations:read', description: 'Query status, progress, and download generated media' },
  { id: 'models:read', label: 'models:read', description: 'Query available model catalog and route capabilities' },
  { id: 'uploads:write', label: 'uploads:write', description: 'Upload reference images and videos for multi-modal prompts' },
];

export default function ApiKeysPage() {
  const [keys, setKeys] = useState([]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Creation Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedScopes, setSelectedScopes] = useState([
    'generations:write',
    'generations:read',
    'models:read',
    'uploads:write',
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createError, setCreateError] = useState(null);

  // One-time Reveal Modal State
  const [revealedKey, setRevealedKey] = useState(null);
  const [copied, setCopied] = useState(false);

  // Revocation State
  const [keyToRevoke, setKeyToRevoke] = useState(null);
  const [isRevoking, setIsRevoking] = useState(false);
  const [revokeError, setRevokeError] = useState(null);

  // Code Snippet Tab
  const [codeTab, setCodeTab] = useState('curl');

  const fetchSessionAndKeys = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Session Status
      const sessionRes = await fetch('/api/v1/session', {
        credentials: 'same-origin',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const sessionData = await sessionRes.json().catch(() => ({}));

      if (!sessionRes.ok || !sessionData.authenticated) {
        setSession(null);
        setKeys([]);
        setLoading(false);
        return;
      }

      setSession(sessionData);

      // 2. Fetch Keys List
      const keysRes = await fetch('/api/v1/keys', {
        credentials: 'same-origin',
        headers: { 'Cache-Control': 'no-cache' },
      });
      const keysData = await keysRes.json().catch(() => ({}));

      if (!keysRes.ok) {
        if (keysRes.status === 403) {
          setError('Forbidden: Only tenant administrators or reseller admins can manage API keys.');
        } else {
          setError(keysData.error || `Failed to fetch API keys (${keysRes.status})`);
        }
        setKeys([]);
      } else {
        setKeys(Array.isArray(keysData.items) ? keysData.items : []);
      }
    } catch (err) {
      setError(err.message || 'Network error while contacting Timecapsule gateway.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSessionAndKeys();
  }, [fetchSessionAndKeys]);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    const trimmedName = newKeyName.trim();
    if (!trimmedName) {
      setCreateError('Please enter a recognizable name for this key.');
      return;
    }
    if (selectedScopes.length === 0) {
      setCreateError('Please select at least one permission scope.');
      return;
    }

    setIsSubmitting(true);
    setCreateError(null);

    try {
      const res = await fetch('/api/v1/keys', {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          'Content-Type': 'application/json',
          'X-Timecapsule-CSRF': '1',
        },
        body: JSON.stringify({
          name: trimmedName,
          scopes: selectedScopes,
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setCreateError(data.error || `Failed to create API key (${res.status})`);
        setIsSubmitting(false);
        return;
      }

      // Key generated successfully! Show the one-time reveal modal.
      setRevealedKey(data.key);
      setShowCreateModal(false);
      setNewKeyName('');
      setSelectedScopes(['generations:write', 'generations:read', 'models:read', 'uploads:write']);
      fetchSessionAndKeys();
    } catch (err) {
      setCreateError(err.message || 'Failed to submit key generation request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRevokeKey = async () => {
    if (!keyToRevoke) return;
    setIsRevoking(true);
    setRevokeError(null);

    try {
      const res = await fetch(`/api/v1/keys/${encodeURIComponent(keyToRevoke.key_id)}`, {
        method: 'DELETE',
        credentials: 'same-origin',
        headers: {
          'X-Timecapsule-CSRF': '1',
        },
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.ok) {
        setRevokeError(data.error || `Failed to revoke key (${res.status})`);
        setIsRevoking(false);
        return;
      }

      setKeyToRevoke(null);
      fetchSessionAndKeys();
    } catch (err) {
      setRevokeError(err.message || 'Error occurred while revoking key.');
    } finally {
      setIsRevoking(false);
    }
  };

  const copyToClipboard = async (text) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Clipboard copy failed:', err);
    }
  };

  const toggleScope = (scopeId) => {
    if (selectedScopes.includes(scopeId)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scopeId));
    } else {
      setSelectedScopes([...selectedScopes, scopeId]);
    }
  };

  const toggleAllScopes = () => {
    if (selectedScopes.length === AVAILABLE_SCOPES.length) {
      setSelectedScopes([]);
    } else {
      setSelectedScopes(AVAILABLE_SCOPES.map((s) => s.id));
    }
  };

  const sampleApiKey = revealedKey?.secret_key || 'tcs_live_948f210a48c9038d17b8f9e2';

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="api-keys" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-500/30">
                Developer Credentials
              </span>
              <ModuleStatusBadge status="working" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight mb-2">
              Customer Developer API Keys
            </h1>
            <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
              Programmatic Bearer credentials for authenticating requests to Timecapsule Multi-Provider Gateway,
              automations, MCP daemons, and autonomous agent swarms.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            <button
              onClick={() => {
                setCreateError(null);
                setShowCreateModal(true);
              }}
              disabled={loading || (session && session.session?.role === 'end_user')}
              className="px-4 py-2.5 bg-[#00e5ff] hover:bg-[#00c8e0] text-[#09090b] rounded-xl text-xs font-black transition-all shadow-glow cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Generate New API Key
            </button>
          </div>
        </div>

        {/* Security Notice */}
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-200 text-xs flex items-start sm:items-center gap-3 mb-8 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center shrink-0">
            <BrandIcon name="lock" className="w-4 h-4 text-blue-400" />
          </div>
          <div className="flex-1">
            <span className="font-bold text-white">Sovereign Key Security:</span> API key secrets are hashed using{' '}
            <code className="text-[#00e5ff] font-mono">SHA-256</code> before storage. Plaintext keys are never stored on
            our servers or logged. Never expose secret keys in client-side frontends or public git repositories.
          </div>
        </div>

        {/* Unauthenticated or Insufficient Role Warnings */}
        {!loading && !session && (
          <div className="bg-[#121217] border border-amber-500/30 rounded-xl p-6 sm:p-8 mb-8 text-center">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto mb-4">
              <BrandIcon name="lock" className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Authentication Required</h3>
            <p className="text-xs text-zinc-400 max-w-md mx-auto mb-6">
              You must be signed in to a tenant workspace with administrator permissions to generate and manage developer credentials.
            </p>
            <a
              href="/studio"
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold transition-colors"
            >
              Sign In to Workspace →
            </a>
          </div>
        )}

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BrandIcon name="close" className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={fetchSessionAndKeys}
              className="px-3 py-1 bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 rounded text-[11px] font-semibold cursor-pointer transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {/* Keys Table Container */}
        <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden shadow-sm mb-8">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between bg-[#181820]/60">
            <div className="flex items-center gap-3">
              <h2 className="text-xs font-bold text-zinc-200 uppercase tracking-wider">Active Credentials</h2>
              <span className="px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-zinc-400 font-mono">
                {keys.filter((k) => !k.revoked_at).length} active
              </span>
            </div>
            {session?.session && (
              <span className="text-xs text-zinc-400 font-mono hidden sm:inline">
                Tenant: <span className="text-[#00e5ff]">{session.session.tenant_id}</span> ({session.session.role})
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#181820]/80 text-zinc-400 uppercase font-semibold text-[10px] border-b border-white/10 font-mono tracking-wider">
                <tr>
                  <th className="px-6 py-3.5">NAME</th>
                  <th className="px-6 py-3.5">KEY PREFIX</th>
                  <th className="px-6 py-3.5">PERMISSIONS</th>
                  <th className="px-6 py-3.5">STATUS</th>
                  <th className="px-6 py-3.5">CREATED</th>
                  <th className="px-6 py-3.5">LAST USED</th>
                  <th className="px-6 py-3.5 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-zinc-300">
                {loading && (
                  <tr>
                    <td colSpan="7" className="px-6 py-8 text-center text-zinc-500">
                      <div className="flex items-center justify-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00e5ff] animate-ping" />
                        <span>Loading developer credentials…</span>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && keys.length === 0 && (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="max-w-sm mx-auto">
                        <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center mx-auto mb-3">
                          <BrandIcon name="key" className="w-5 h-5 text-zinc-400" />
                        </div>
                        <h4 className="text-sm font-bold text-white mb-1">No API keys generated yet</h4>
                        <p className="text-xs text-zinc-500 mb-4">
                          Generate a secret key to authenticate your server, worker daemon, or command line interface.
                        </p>
                        <button
                          onClick={() => setShowCreateModal(true)}
                          className="px-3.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                        >
                          + Create First Key
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading &&
                  keys.map((k) => {
                    const isRevoked = Boolean(k.revoked_at);
                    return (
                      <tr key={k.key_id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-[#f5f7fa]">
                          {k.name}
                        </td>
                        <td className="px-6 py-4 font-mono text-zinc-300">
                          <code className="bg-black/40 px-2 py-1 rounded border border-white/10 text-[#00e5ff]">
                            {k.key_prefix}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {Array.isArray(k.scopes) && k.scopes.length > 0 ? (
                              k.scopes.map((scope) => (
                                <span
                                  key={scope}
                                  className="px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-400"
                                >
                                  {scope}
                                </span>
                              ))
                            ) : (
                              <span className="text-zinc-500 text-[11px]">—</span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {isRevoked ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[10px] font-bold uppercase tracking-wider">
                              Revoked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              Active
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-[11px]">
                          {k.created_at ? new Date(k.created_at).toLocaleDateString() : '—'}
                        </td>
                        <td className="px-6 py-4 text-zinc-400 font-mono text-[11px]">
                          {k.last_used_at ? new Date(k.last_used_at).toLocaleString() : 'Never'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {!isRevoked ? (
                            <button
                              onClick={() => {
                                setRevokeError(null);
                                setKeyToRevoke(k);
                              }}
                              className="text-rose-400 hover:text-rose-300 font-semibold cursor-pointer transition-colors text-xs"
                            >
                              Revoke
                            </button>
                          ) : (
                            <span className="text-zinc-600 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quickstart Integration Guide */}
        <div className="bg-[#121217] border border-white/10 rounded-xl p-6 sm:p-8 mb-8 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <h3 className="text-sm font-bold text-[#f5f7fa] uppercase tracking-wider flex items-center gap-2 mb-1">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00e5ff" strokeWidth="2">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </svg>
                Developer Quickstart & Authentication
              </h3>
              <p className="text-xs text-zinc-400">
                Authenticate your API requests by including your key in the <code className="text-[#00e5ff]">Authorization</code> header.
              </p>
            </div>

            {/* Language Tabs */}
            <div className="flex items-center gap-1 bg-[#181820] p-1 rounded-lg border border-white/10 self-start sm:self-auto">
              <button
                onClick={() => setCodeTab('curl')}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  codeTab === 'curl' ? 'bg-[#00e5ff] text-[#09090b]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                cURL
              </button>
              <button
                onClick={() => setCodeTab('node')}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  codeTab === 'node' ? 'bg-[#00e5ff] text-[#09090b]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Node.js
              </button>
              <button
                onClick={() => setCodeTab('python')}
                className={`px-3 py-1 rounded text-xs font-mono font-semibold transition-colors cursor-pointer ${
                  codeTab === 'python' ? 'bg-[#00e5ff] text-[#09090b]' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Python
              </button>
            </div>
          </div>

          <div className="relative">
            <pre className="bg-[#09090b] border border-white/10 rounded-xl p-4 sm:p-5 text-xs text-zinc-300 font-mono overflow-x-auto leading-relaxed">
              {codeTab === 'curl' &&
`# 1. Trigger Image Generation via Cascade Router (MuAPI -> Fal -> Replicate)
curl -X POST https://api.timecapsule.studio/api/v1/generations \\
  -H "Authorization: Bearer ${sampleApiKey}" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "nano-banana-pro",
    "prompt": "Cinematic portrait, volumetric dusk lighting, 35mm photograph",
    "aspectRatio": "16:9",
    "idempotencyKey": "req_${Date.now()}"
  }'

# 2. Check Job Status
curl -X GET https://api.timecapsule.studio/api/v1/generations/job_example123 \\
  -H "Authorization: Bearer ${sampleApiKey}"`}

              {codeTab === 'node' &&
`import fetch from 'node-fetch';

const API_KEY = process.env.TIMECAPSULE_API_KEY || '${sampleApiKey}';

// Submit Generation
const response = await fetch('https://api.timecapsule.studio/api/v1/generations', {
  method: 'POST',
  headers: {
    'Authorization': \`Bearer \${API_KEY}\`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: 'nano-banana-pro',
    prompt: 'Cinematic portrait, volumetric dusk lighting, 35mm photograph',
    aspectRatio: '16:9',
  }),
});

const data = await response.json();
console.log('Job accepted:', data.job_id);`}

              {codeTab === 'python' &&
`import requests
import os

API_KEY = os.getenv("TIMECAPSULE_API_KEY", "${sampleApiKey}")
HEADERS = {
    "Authorization": f"Bearer {API_KEY}",
    "Content-Type": "application/json"
}

# Submit Generation
payload = {
    "model": "nano-banana-pro",
    "prompt": "Cinematic portrait, volumetric dusk lighting, 35mm photograph",
    "aspectRatio": "16:9"
}

response = requests.post(
    "https://api.timecapsule.studio/api/v1/generations",
    headers=HEADERS,
    json=payload
)
job = response.json()
print("Job created:", job.get("job_id"))`}
            </pre>
            <button
              onClick={() => {
                const text =
                  codeTab === 'curl'
                    ? `curl -X POST https://api.timecapsule.studio/api/v1/generations -H "Authorization: Bearer ${sampleApiKey}" -H "Content-Type: application/json" -d '{"model":"nano-banana-pro","prompt":"Cinematic portrait"}'`
                    : codeTab === 'node'
                    ? `const res = await fetch('https://api.timecapsule.studio/api/v1/generations', { method: 'POST', headers: { 'Authorization': 'Bearer ${sampleApiKey}', 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'nano-banana-pro', prompt: 'Cinematic portrait' }) });`
                    : `import requests\nres = requests.post('https://api.timecapsule.studio/api/v1/generations', headers={'Authorization': 'Bearer ${sampleApiKey}', 'Content-Type': 'application/json'}, json={'model': 'nano-banana-pro', 'prompt': 'Cinematic portrait'})\nprint(res.json())`;
                copyToClipboard(text);
              }}
              className="absolute top-3 right-3 px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-[11px] font-mono transition-colors cursor-pointer flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <BrandIcon name="check" className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <BrandIcon name="copy" className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Modal: Create Key */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-bold text-[#f5f7fa] flex items-center gap-2">
                  <BrandIcon name="key" className="w-4 h-4 text-[#00e5ff]" />
                  Generate Developer API Key
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="text-zinc-500 hover:text-white cursor-pointer"
                >
                  <BrandIcon name="close" className="w-4 h-4" />
                </button>
              </div>

              <p className="text-xs text-zinc-400 mb-6">
                Developer API keys allow external services and applications to interact with Timecapsule API.
              </p>

              {createError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs mb-4">
                  {createError}
                </div>
              )}

              <form onSubmit={handleCreateKey} className="space-y-5">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                    Key Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Production Server, Claude MCP, Python Worker"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-[#181820] border border-white/10 rounded-xl text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-[#00e5ff] transition-colors"
                    autoFocus
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-xs font-semibold text-zinc-300">
                      Permission Scopes
                    </label>
                    <button
                      type="button"
                      onClick={toggleAllScopes}
                      className="text-[11px] text-[#00e5ff] hover:underline cursor-pointer"
                    >
                      {selectedScopes.length === AVAILABLE_SCOPES.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="space-y-2 bg-[#181820]/60 p-3 rounded-xl border border-white/5">
                    {AVAILABLE_SCOPES.map((scope) => {
                      const isChecked = selectedScopes.includes(scope.id);
                      return (
                        <label
                          key={scope.id}
                          className="flex items-start gap-2.5 p-1.5 rounded hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleScope(scope.id)}
                            className="mt-0.5 rounded border-white/20 bg-black/40 text-[#00e5ff] focus:ring-0"
                          />
                          <div>
                            <div className="text-xs font-mono font-bold text-zinc-200">{scope.label}</div>
                            <div className="text-[11px] text-zinc-500">{scope.description}</div>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2.5 bg-[#00e5ff] hover:bg-[#00c8e0] text-[#09090b] rounded-xl text-xs font-black transition-all shadow-glow cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? 'Generating…' : 'Generate Secret Key'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Modal: One-Time Secret Key Reveal */}
        {revealedKey && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#121217] border border-[#00e5ff]/30 rounded-2xl p-6 sm:p-8 max-w-lg w-full shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
                <BrandIcon name="check" className="w-6 h-6 text-emerald-400" />
              </div>

              <h3 className="text-lg font-black text-white mb-1">
                API Key Generated Successfully
              </h3>
              <p className="text-xs text-zinc-400 mb-4">
                Key name: <span className="font-bold text-white">{revealedKey.name}</span>
              </p>

              {/* Security Warning Callout */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 text-xs mb-5 flex items-start gap-2.5">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 mt-0.5">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                <div>
                  <span className="font-bold">Save this secret key now:</span> For security reasons, you will{' '}
                  <span className="underline">never</span> be able to view this key again. If you lose it, you will need to
                  generate a replacement.
                </div>
              </div>

              {/* Monospace Key Display Box */}
              <div className="bg-[#09090b] border border-white/10 rounded-xl p-3.5 mb-6 flex items-center justify-between gap-3">
                <code className="text-[#00e5ff] font-mono text-xs break-all select-all">
                  {revealedKey.secret_key}
                </code>
                <button
                  onClick={() => copyToClipboard(revealedKey.secret_key)}
                  className="px-3 py-1.5 bg-[#00e5ff] text-[#09090b] rounded-lg text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-1.5"
                >
                  {copied ? (
                    <>
                      <BrandIcon name="check" className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <BrandIcon name="copy" className="w-3.5 h-3.5" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>

              <div className="flex items-center justify-end">
                <button
                  onClick={() => setRevealedKey(null)}
                  className="w-full sm:w-auto px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer text-center"
                >
                  I Have Copied My Secret Key
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Revocation Confirmation */}
        {keyToRevoke && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-[#121217] border border-rose-500/30 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mb-4">
                <BrandIcon name="close" className="w-6 h-6 text-rose-400" />
              </div>

              <h3 className="text-base font-bold text-white mb-2">
                Revoke API Key?
              </h3>
              <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                Are you sure you want to revoke <span className="font-bold text-white font-mono">{keyToRevoke.name}</span> (
                <code className="text-[#00e5ff]">{keyToRevoke.key_prefix}</code>)?
              </p>

              <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-300 text-xs mb-6">
                ⚠️ Any server, agent swarm, or CI workflow using this key will immediately be denied with{' '}
                <span className="font-mono font-bold">401 Unauthorized</span>. This action cannot be undone.
              </div>

              {revokeError && (
                <div className="p-3 bg-rose-500/20 border border-rose-500/40 rounded-lg text-rose-200 text-xs mb-4">
                  {revokeError}
                </div>
              )}

              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setKeyToRevoke(null)}
                  className="px-4 py-2 text-xs text-zinc-400 hover:text-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleRevokeKey}
                  disabled={isRevoking}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isRevoking ? 'Revoking…' : 'Yes, Revoke Key'}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <PlatformFooter />
    </div>
  );
}
