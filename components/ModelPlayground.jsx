'use client';

import { useState, useEffect, useRef, useTransition } from 'react';
import Link from 'next/link';
import BrandIcon from '@/components/BrandIcon';

const SAMPLE_PROMPTS = [
  'A cinematic wide-angle shot of an astronaut navigating a misty glowing neon nebula, anamorphic lens 35mm f/1.4, volumetric lighting, photorealistic 8k',
  'High-fashion editorial portrait with bioluminescent crystal accents, ultra-sharp studio rim lighting, 85mm prime, dark cinematic mood',
  'Futuristic architectural pavilion with curving chrome pillars and reflecting pools at dusk, architectural digest style, volumetric fog',
  'Close-up macro of an ancient mechanical pocket watch with glowing blue gears and visible steam release, intricate horology, shallow depth of field',
  'Hyperrealistic documentary footage of a cybernetic tiger walking through rain-slicked Tokyo streets, reflections on asphalt, neon signage',
];

export default function ModelPlayground({
  slug,
  modelTitle,
  modelCategory,
  modelPrice,
  providerName = 'Verified Gateway',
  providerFamily = 'flux',
  defaultPrompt = '',
  estimatedCredits = 15,
}) {
  // Navigation / Mode state
  const [activeTab, setActiveTab] = useState('playground'); // 'playground' | 'api'
  const [apiLang, setApiLang] = useState('curl'); // 'curl' | 'python' | 'node'
  const [copiedCode, setCopiedCode] = useState(false);

  // Form State
  const [prompt, setPrompt] = useState(defaultPrompt || SAMPLE_PROMPTS[0]);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('16:9');
  const [resolution, setResolution] = useState('1080p');
  const [quality, setQuality] = useState('standard');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Execution State Machine
  // 'idle' | 'authenticating' | 'submitting' | 'queued' | 'processing' | 'completed' | 'failed'
  const [execState, setExecState] = useState('idle');
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [activeJobId, setActiveJobId] = useState(null);
  const [outputAsset, setOutputAsset] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);
  const [history, setHistory] = useState([]);

  // Session & Auth state
  const [session, setSession] = useState(null);
  const [creditsBalance, setCreditsBalance] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [previewKeyInput, setPreviewKeyInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  const eventSourceRef = useRef(null);

  const isVideo =
    modelCategory.toLowerCase().includes('video') ||
    slug.includes('video') ||
    slug.includes('t2v') ||
    slug.includes('i2v') ||
    slug.includes('veo') ||
    slug.includes('seedance');

  // Check initial session
  useEffect(() => {
    let mounted = true;
    fetch('/api/v1/session')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!mounted) return;
        if (data?.ok && data.session) {
          setSession(data.session);
          if (data.credits) {
            setCreditsBalance(data.credits.available_credits ?? data.credits.balance);
          }
        }
        setAuthChecked(true);
      })
      .catch(() => {
        if (mounted) setAuthChecked(true);
      });

    return () => {
      mounted = false;
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const handleRandomPrompt = () => {
    const next = SAMPLE_PROMPTS[Math.floor(Math.random() * SAMPLE_PROMPTS.length)];
    setPrompt(next);
  };

  const handleCopyCode = (text) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  // Submit Private Preview Auth Key
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const key = previewKeyInput.trim();
    if (!key) {
      setAuthError('Please enter a private-preview access key.');
      return;
    }
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const res = await fetch('/api/v1/session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Timecapsule-CSRF': '1',
        },
        body: JSON.stringify({ access_key: key }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.ok) {
        setAuthError(data.error || 'Authentication failed. Please verify your key.');
        return;
      }
      setSession(data.session);
      if (data.credits) {
        setCreditsBalance(data.credits.available_credits ?? data.credits.balance);
      }
      setShowAuthModal(false);
      // Auto-trigger generation
      executeJob(true);
    } catch (err) {
      setAuthError(err.message || 'Network error verifying key.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Simulated Safe Demo Generation (deterministic offline dogfooding)
  const runSimulatedDemo = () => {
    setExecState('submitting');
    setStatusMessage('Simulating deterministic execution in preview sandbox...');
    setProgress(15);
    setErrorMessage(null);

    const fakeJobId = `tc_demo_${Date.now().toString(36)}`;
    setActiveJobId(fakeJobId);

    setTimeout(() => {
      setExecState('queued');
      setStatusMessage('Queued on Timecapsule Gateway (Preview Sandbox)...');
      setProgress(35);

      setTimeout(() => {
        setExecState('processing');
        setStatusMessage(
          isVideo
            ? 'Generating temporal frames & volumetric light pass (720p)...'
            : 'Sampling diffusion latents & applying 70mm grain...'
        );
        setProgress(70);

        setTimeout(() => {
          setProgress(100);
          setExecState('completed');
          setStatusMessage('Generation completed successfully.');

          const result = {
            id: fakeJobId,
            url: isVideo ? '/samples/demo.mp4' : '/samples/sample_image_1.webp',
            kind: isVideo ? 'video' : 'image',
            prompt,
            aspectRatio,
            resolution,
            model: slug,
            timestamp: new Date().toISOString(),
            isDemo: true,
          };

          setOutputAsset(result);
          setHistory((prev) => [result, ...prev.slice(0, 4)]);
        }, 1200);
      }, 900);
    }, 700);
  };

  // Real Dispatch to /api/v1/generations
  const executeJob = async (forceWithSession = false) => {
    if (!session && !forceWithSession) {
      setShowAuthModal(true);
      return;
    }

    setExecState('submitting');
    setProgress(5);
    setStatusMessage('Submitting generation to Timecapsule BFF...');
    setErrorMessage(null);

    try {
      const payload = {
        model: slug,
        params: {
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
          quality,
          ...(negativePrompt ? { negative_prompt: negativePrompt } : {}),
        },
      };

      const res = await fetch('/api/v1/generations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Timecapsule-CSRF': '1',
          'Idempotency-Key': `tc_${slug}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        if (res.status === 401) {
          setShowAuthModal(true);
          setExecState('idle');
          return;
        }
        throw new Error(data.error || `Generation submission failed (${res.status})`);
      }

      const jobId = data.job_id;
      setActiveJobId(jobId);
      setExecState('queued');
      setProgress(25);
      setStatusMessage(`Job #${jobId.slice(0, 12)} queued on ${data.provider || 'gateway'}...`);

      // Connect to SSE stream
      subscribeToJobEvents(jobId);
    } catch (err) {
      setExecState('failed');
      setErrorMessage(err.message || 'Generation failed to submit.');
    }
  };

  // SSE Event Listener
  const subscribeToJobEvents = (jobId) => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    const sse = new EventSource(`/api/v1/generations/${jobId}/events`);
    eventSourceRef.current = sse;

    sse.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.status === 'processing') {
          setExecState('processing');
          setProgress((prev) => Math.min(prev + 20, 85));
          setStatusMessage(payload.message || 'Processing model execution...');
        } else if (payload.status === 'completed') {
          setProgress(100);
          setExecState('completed');
          setStatusMessage('Generation completed.');
          sse.close();

          const result = {
            id: jobId,
            url: payload.output?.url || (isVideo ? '/samples/demo.mp4' : '/samples/sample_image_1.webp'),
            kind: isVideo ? 'video' : 'image',
            prompt,
            aspectRatio,
            resolution,
            model: slug,
            timestamp: new Date().toISOString(),
            isDemo: false,
          };

          setOutputAsset(result);
          setHistory((prev) => [result, ...prev.slice(0, 4)]);

          // Refresh credit balance
          fetch('/api/v1/session')
            .then((r) => r.json())
            .then((d) => {
              if (d?.credits) {
                setCreditsBalance(d.credits.available_credits ?? d.credits.balance);
              }
            })
            .catch(() => {});
        } else if (payload.status === 'failed') {
          setExecState('failed');
          setErrorMessage(payload.error || 'Job failed during execution.');
          sse.close();
        }
      } catch {
        // ignore malformed SSE line
      }
    };

    sse.onerror = () => {
      sse.close();
      // Fallback: poll once after 2 seconds
      setTimeout(async () => {
        try {
          const pollRes = await fetch(`/api/v1/generations/${jobId}`);
          if (pollRes.ok) {
            const jobData = await pollRes.json();
            if (jobData.status === 'completed' && jobData.output?.url) {
              setProgress(100);
              setExecState('completed');
              setOutputAsset({
                id: jobId,
                url: jobData.output.url,
                kind: isVideo ? 'video' : 'image',
                prompt,
                aspectRatio,
                resolution,
                model: slug,
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch {
          // keep error state if poll fails
        }
      }, 2500);
    };
  };

  // Generate dynamic API code examples
  const curlCode = `curl -X POST https://api.timecapsule.ai/api/v1/generations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${slug}",
    "params": {
      "prompt": "${prompt.replace(/"/g, '\\"')}",
      "aspect_ratio": "${aspectRatio}",
      "resolution": "${resolution}"
    }
  }'`;

  const pythonCode = `import requests

url = "https://api.timecapsule.ai/api/v1/generations"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = {
    "model": "${slug}",
    "params": {
        "prompt": """${prompt}""",
        "aspect_ratio": "${aspectRatio}",
        "resolution": "${resolution}"
    }
}

response = requests.post(url, json=payload, headers=headers)
job = response.json()
print("Job Queued:", job["job_id"])
print("Events SSE URL:", job["events_url"])`;

  const nodeCode = `import fetch from 'node-fetch';

const res = await fetch('https://api.timecapsule.ai/api/v1/generations', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    model: '${slug}',
    params: {
      prompt: ${JSON.stringify(prompt)},
      aspect_ratio: '${aspectRatio}',
      resolution: '${resolution}',
    },
  }),
});

const job = await res.json();
console.log('Job Queued:', job.job_id);
console.log('SSE Stream:', job.events_url);`;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Header Card: Title, Modality, Price, and [Playground / API Reference] Switcher */}
      <div className="bg-[#121217] border border-white/10 rounded-[12px] p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[10px] font-black uppercase tracking-widest border border-blue-500/30">
              {modelCategory}
            </span>
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-zinc-300 text-[11px] font-semibold">
              <BrandIcon name={providerFamily} className="w-3.5 h-3.5 text-zinc-400" />
              <span>{providerName}</span>
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-500/30">
              Gateway Ready
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight">
            {modelTitle}
          </h1>
          <p className="text-xs text-zinc-400 mt-1 font-mono">
            Endpoint: <code className="text-zinc-200">/api/v1/generations</code> · Model ID: <code className="text-zinc-200">{slug}</code>
          </p>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4">
          <div className="text-left md:text-right">
            <div className="text-[11px] text-zinc-400 font-medium">Model Price</div>
            <div className="text-xl font-black text-emerald-400 font-mono">{modelPrice}</div>
            <div className="text-[10px] text-zinc-500">~{estimatedCredits} credits / run</div>
          </div>

          {/* Segmented [Playground | API Reference] Toggle */}
          <div className="inline-flex bg-[#181820] p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'playground'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>⚡</span>
              <span>Playground</span>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'api'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <span>{'</>'}</span>
              <span>API Reference</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mode 1: Interactive In-Place Playground */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Form & Parameter Controls (7 Cols) */}
          <div className="lg:col-span-7 bg-[#121217] border border-white/10 rounded-[12px] p-6 shadow-sm space-y-6">
            {/* Prompt Input */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-1.5">
                  <span>Prompt</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-zinc-500 font-mono">{prompt.length} chars</span>
                  <button
                    type="button"
                    onClick={handleRandomPrompt}
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>🎲</span>
                    <span>Surprise Me</span>
                  </button>
                </div>
              </div>
              <textarea
                rows={4}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your vision with detail on lighting, style, lens, and subject..."
                className="w-full bg-[#181820] border border-white/10 rounded-lg p-3.5 text-xs sm:text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all font-sans leading-relaxed"
              />
            </div>

            {/* Aspect Ratio Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Aspect Ratio
                </label>
                <span className="text-[11px] text-zinc-400 font-mono">{aspectRatio}</span>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {[
                  { label: '1:1', desc: 'Square' },
                  { label: '16:9', desc: 'Cinema' },
                  { label: '9:16', desc: 'Reels' },
                  { label: '4:3', desc: 'Classic' },
                  { label: '21:9', desc: 'UltraWide' },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => setAspectRatio(item.label)}
                    className={`py-2 px-1 text-center rounded-lg border transition-all cursor-pointer ${
                      aspectRatio === item.label
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-xs'
                        : 'bg-[#181820] border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[9px] text-zinc-500 uppercase">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution & Quality Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-[#181820] border border-white/10 rounded-lg p-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="720p">720p Standard Fast</option>
                  <option value="1080p">1080p Full HD (Master)</option>
                  <option value="4k">4K Ultra HD Fidelity</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5">
                  Generation Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full bg-[#181820] border border-white/10 rounded-lg p-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                >
                  <option value="standard">Production (Balanced)</option>
                  <option value="preview">Fast Preview Draft</option>
                  <option value="high">Maximum Detail (2x Steps)</option>
                </select>
              </div>
            </div>

            {/* Advanced Parameters Accordion */}
            <div className="border border-white/10 rounded-lg bg-[#181820]/40 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="w-full px-4 py-3 flex items-center justify-between text-xs font-bold text-zinc-300 hover:text-white transition-colors cursor-pointer"
              >
                <span>Advanced Parameters (Negative Prompt, Seed)</span>
                <span>{showAdvanced ? '▴' : '▾'}</span>
              </button>
              {showAdvanced && (
                <div className="p-4 pt-0 space-y-3 border-t border-white/5">
                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 uppercase mb-1">
                      Negative Prompt
                    </label>
                    <input
                      type="text"
                      value={negativePrompt}
                      onChange={(e) => setNegativePrompt(e.target.value)}
                      placeholder="low quality, artifacts, blur, extra limbs..."
                      className="w-full bg-[#121217] border border-white/10 rounded p-2 text-xs text-zinc-200 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Execution Bar */}
            <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="text-xs text-zinc-400">
                  Cost: <span className="font-bold text-emerald-400 font-mono">{estimatedCredits} credits</span>
                </div>
                {creditsBalance !== null && (
                  <div className="text-xs text-zinc-500 font-mono">
                    (Balance: <span className="text-zinc-300 font-bold">{creditsBalance}</span>)
                  </div>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={runSimulatedDemo}
                  disabled={execState === 'submitting' || execState === 'queued' || execState === 'processing'}
                  className="px-4 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-zinc-300 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                  title="Run deterministic simulation without spending provider credits"
                >
                  Safe Preview
                </button>

                <button
                  type="button"
                  onClick={() => executeJob(false)}
                  disabled={execState === 'submitting' || execState === 'queued' || execState === 'processing'}
                  className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-md flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {execState === 'submitting' || execState === 'queued' || execState === 'processing' ? (
                    <>
                      <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>⚡</span>
                      <span>Generate</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Error Message if any */}
            {errorMessage && (
              <div className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <span>{errorMessage}</span>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="text-rose-400 hover:text-white ml-2 text-xs font-bold"
                >
                  ✕
                </button>
              </div>
            )}
          </div>

          {/* Right Column: Live Canvas & Real-time Execution (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            <div className="bg-[#121217] border border-white/10 rounded-[12px] overflow-hidden shadow-sm flex flex-col">
              {/* Canvas Header */}
              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between bg-[#181820]/60">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
                    Output Canvas
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {outputAsset?.isDemo && (
                    <span className="text-[10px] font-mono text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/20">
                      Deterministic Demo
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-zinc-400">
                    {aspectRatio} · {resolution}
                  </span>
                </div>
              </div>

              {/* Canvas Viewport */}
              <div className="aspect-[4/3] bg-[#09090b] flex items-center justify-center relative overflow-hidden group">
                {/* 1. Loading / In-flight state */}
                {(execState === 'submitting' || execState === 'queued' || execState === 'processing') && (
                  <div className="absolute inset-0 bg-[#09090b]/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center z-20">
                    <div className="w-12 h-12 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin mb-4" />
                    <div className="text-sm font-bold text-[#f5f7fa] mb-1">
                      {execState === 'submitting' && 'Reserving Credits & Dispatching...'}
                      {execState === 'queued' && 'Queued on Gateway Worker...'}
                      {execState === 'processing' && 'Rendering Multimodal Output...'}
                    </div>
                    <div className="text-xs text-zinc-400 max-w-xs leading-relaxed mb-4">
                      {statusMessage}
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full max-w-xs bg-white/10 h-1.5 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-500 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* 2. Completed Asset (Video or Image) */}
                {outputAsset ? (
                  outputAsset.kind === 'video' ? (
                    <video
                      key={outputAsset.url}
                      src={outputAsset.url}
                      controls
                      autoPlay
                      loop
                      playsInline
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <img
                      key={outputAsset.url}
                      src={outputAsset.url}
                      alt={prompt}
                      className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
                    />
                  )
                ) : (
                  /* 3. Default Idle Sample Preview */
                  <div className="w-full h-full relative">
                    <img
                      src="/assets/cinema/grand_format_70mm_film.webp"
                      alt={modelTitle}
                      className="w-full h-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-4">
                      <div className="inline-block self-start px-2 py-0.5 rounded bg-black/60 backdrop-blur-xs border border-white/10 text-[10px] font-mono text-zinc-300 mb-1">
                        Deterministic High-Res Sample
                      </div>
                      <div className="text-xs text-zinc-200 line-clamp-1 font-sans">
                        &ldquo;{prompt}&rdquo;
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Canvas Footer Actions */}
              <div className="p-3 border-t border-white/10 bg-[#181820]/40 flex items-center justify-between text-xs">
                <span className="text-[11px] text-zinc-500">
                  {outputAsset ? 'Render complete' : 'Ready to execute'}
                </span>

                {outputAsset ? (
                  <div className="flex items-center gap-2">
                    <a
                      href={outputAsset.url}
                      download={`timecapsule_${slug}.png`}
                      className="px-3 py-1.5 rounded bg-white/5 hover:bg-white/10 text-zinc-200 font-semibold text-[11px] transition-colors"
                    >
                      Download
                    </a>
                    <Link
                      href={`/studio?model=${slug}&preview=1`}
                      className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold text-[11px] transition-colors"
                    >
                      Open in Studio →
                    </Link>
                  </div>
                ) : (
                  <Link
                    href={`/studio?model=${slug}&preview=1`}
                    className="text-blue-400 hover:text-blue-300 font-semibold text-[11px] transition-colors"
                  >
                    Open in Full Studio →
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Output History Carousel */}
            {history.length > 0 && (
              <div className="bg-[#121217] border border-white/10 rounded-[12px] p-4">
                <div className="text-xs font-bold text-zinc-300 mb-3">Session Generations</div>
                <div className="grid grid-cols-4 gap-2">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => setOutputAsset(h)}
                      className="aspect-square rounded-md overflow-hidden border border-white/10 hover:border-blue-500 transition-all cursor-pointer relative group"
                    >
                      {h.kind === 'video' ? (
                        <video src={h.url} muted className="w-full h-full object-cover" />
                      ) : (
                        <img src={h.url} alt="" className="w-full h-full object-cover" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mode 2: Interactive API Reference */}
      {activeTab === 'api' && (
        <div className="space-y-6">
          {/* Language Switcher & Snippet Box */}
          <div className="bg-[#121217] border border-white/10 rounded-[12px] overflow-hidden shadow-sm">
            <div className="px-5 py-3 border-b border-white/10 flex items-center justify-between bg-[#181820]/60">
              <div className="flex items-center gap-1.5">
                {[
                  { id: 'curl', label: 'cURL' },
                  { id: 'python', label: 'Python' },
                  { id: 'node', label: 'Node.js' },
                ].map((l) => (
                  <button
                    key={l.id}
                    onClick={() => setApiLang(l.id)}
                    className={`px-3 py-1 rounded text-xs font-bold transition-all cursor-pointer ${
                      apiLang === l.id
                        ? 'bg-blue-600 text-white'
                        : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    {l.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() =>
                  handleCopyCode(
                    apiLang === 'curl' ? curlCode : apiLang === 'python' ? pythonCode : nodeCode
                  )
                }
                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1"
              >
                <span>{copiedCode ? '✓ Copied' : 'Copy'}</span>
              </button>
            </div>

            <pre className="p-5 bg-[#09090b] text-zinc-200 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed">
              {apiLang === 'curl' && curlCode}
              {apiLang === 'python' && pythonCode}
              {apiLang === 'node' && nodeCode}
            </pre>
          </div>

          {/* Parameters Specification Table */}
          <div className="bg-[#121217] border border-white/10 rounded-[12px] p-6 shadow-sm">
            <h2 className="text-base font-bold text-[#f5f7fa] mb-4">Request Parameters</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-zinc-400 uppercase tracking-wider font-mono">
                    <th className="py-2.5 px-3">Field</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Required</th>
                    <th className="py-2.5 px-3">Description</th>
                    <th className="py-2.5 px-3">Allowed Values</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-zinc-300">
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">model</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">string</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">Yes</td>
                    <td className="py-3 px-3">Canonical model identifier in Timecapsule catalog.</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">&quot;{slug}&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">params.prompt</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">string</td>
                    <td className="py-3 px-3 text-rose-400 font-bold">Yes</td>
                    <td className="py-3 px-3">Natural language description of desired scene/generation.</td>
                    <td className="py-3 px-3 text-zinc-400">1 – 2,000 characters</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">params.aspect_ratio</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">string</td>
                    <td className="py-3 px-3 text-zinc-500">No</td>
                    <td className="py-3 px-3">Output framing aspect ratio. Default is 16:9.</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">&quot;1:1&quot;, &quot;16:9&quot;, &quot;9:16&quot;, &quot;4:3&quot;, &quot;21:9&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">params.resolution</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">string</td>
                    <td className="py-3 px-3 text-zinc-500">No</td>
                    <td className="py-3 px-3">Resolution tier for rendering master assets.</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">&quot;720p&quot;, &quot;1080p&quot;, &quot;4k&quot;</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-3 font-mono font-bold text-blue-400">params.negative_prompt</td>
                    <td className="py-3 px-3 font-mono text-zinc-400">string</td>
                    <td className="py-3 px-3 text-zinc-500">No</td>
                    <td className="py-3 px-3">Features and artifacts to penalize during generation.</td>
                    <td className="py-3 px-3 text-zinc-400">Optional text string</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Response Schema Preview */}
          <div className="bg-[#121217] border border-white/10 rounded-[12px] p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-[#f5f7fa]">Response Formats</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="text-xs font-mono font-bold text-emerald-400 mb-2">
                  202 Accepted (Initial Task Creation)
                </div>
                <pre className="p-4 bg-[#09090b] text-zinc-300 text-xs font-mono rounded-lg overflow-x-auto">
{`{
  "job_id": "job_01j7b9c9z4",
  "status": "queued",
  "credits_reserved": ${estimatedCredits},
  "estimated_cost": "${modelPrice}",
  "events_url": "/api/v1/generations/job_01j7b9c9z4/events",
  "provider": "${providerFamily}",
  "created_at": "${new Date().toISOString()}"
}`}
                </pre>
              </div>

              <div>
                <div className="text-xs font-mono font-bold text-blue-400 mb-2">
                  SSE Events Stream (Real-Time Progress)
                </div>
                <pre className="p-4 bg-[#09090b] text-zinc-300 text-xs font-mono rounded-lg overflow-x-auto">
{`// GET /api/v1/generations/{id}/events
event: message
data: {"status":"processing","step":"sampling"}

event: message
data: {
  "status": "completed",
  "output": {
    "url": "https://cdn.timecapsule.ai/outputs/...",
    "resolution": "${resolution}"
  }
}`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Private Preview Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#121217] border border-white/10 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black text-[#f5f7fa] mb-2">
              Private Preview Authentication
            </h2>
            <p className="text-xs text-zinc-400 leading-relaxed mb-6">
              Timecapsule is currently operating in single-tenant private preview. Enter your workspace preview key to reserve credits and execute server-side generation jobs.
            </p>

            <form onSubmit={handleAuthSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-zinc-300 uppercase mb-1.5">
                  Private Preview Key
                </label>
                <input
                  type="password"
                  value={previewKeyInput}
                  onChange={(e) => setPreviewKeyInput(e.target.value)}
                  placeholder="tc_preview_••••••••••••"
                  className="w-full bg-[#181820] border border-white/10 rounded-lg p-3 text-xs font-mono text-zinc-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              {authError && (
                <div className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 p-2.5 rounded">
                  {authError}
                </div>
              )}

              <div className="flex items-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAuthModal(false);
                    runSimulatedDemo();
                  }}
                  className="flex-1 py-2.5 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Use Safe Preview Demo
                </button>
                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="flex-1 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isAuthenticating ? 'Verifying...' : 'Sign In & Run'}
                </button>
              </div>
            </form>

            <div className="mt-4 text-center">
              <button
                type="button"
                onClick={() => setShowAuthModal(false)}
                className="text-xs text-zinc-500 hover:text-zinc-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
