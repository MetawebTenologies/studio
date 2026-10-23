'use client';

import { useState, useEffect, useRef, useTransition, useMemo } from 'react';
import Link from 'next/link';
import BrandIcon from '@/components/BrandIcon';

const SAMPLE_PROMPTS = [
  'A cinematic wide-angle shot of an astronaut navigating a misty glowing neon nebula, anamorphic lens 35mm f/1.4, volumetric lighting, photorealistic 8k',
  'High-fashion editorial portrait with bioluminescent crystal accents, ultra-sharp studio rim lighting, 85mm prime, dark cinematic mood',
  'Futuristic architectural pavilion with curving chrome pillars and reflecting pools at dusk, architectural digest style, volumetric fog',
  'Close-up macro of an ancient mechanical pocket watch with glowing blue gears and visible steam release, intricate horology, shallow depth of field',
  'Hyperrealistic documentary footage of a cybernetic tiger walking through rain-slicked Tokyo streets, reflections on asphalt, neon signage',
];

const SIBLINGS_BY_FAMILY = {
  flux: [
    { slug: 'flux-dev', name: 'FLUX.1 Dev' },
    { slug: 'flux-schnell', name: 'FLUX.1 Schnell' },
    { slug: 'flux-pro', name: 'FLUX.1 Pro' },
    { slug: 'flux-3-klein-text-to-image', name: 'FLUX 3 Klein T2I' },
  ],
  seedance: [
    { slug: 'seedance-pro-t2v', name: 'Seedance 2.5 Pro T2V' },
    { slug: 'seedance-pro-i2v', name: 'Seedance 2.5 Pro I2V' },
    { slug: 'seedance-2-5-omni', name: 'Seedance 2.5 Omni' },
    { slug: 'seedream-5-0-pro', name: 'Seedream 5.0 Pro' },
  ],
  veo: [
    { slug: 'veo-3-1-cinema', name: 'Veo 3.1 Cinema Fast' },
    { slug: 'veo3.1-fast-text-to-video', name: 'Veo 3.1 Fast T2V' },
    { slug: 'veo3.1-fast-image-to-video', name: 'Veo 3.1 Fast I2V' },
    { slug: 'veo-3-1-4k', name: 'Veo 3.1 4K Direct' },
  ],
  kling: [
    { slug: 'kling-v3-pro-t2v', name: 'Kling v3 Pro T2V' },
    { slug: 'kling-4-0-text-to-video', name: 'Kling 4.0 Text-to-Video' },
    { slug: 'kling-4-0-reference-to-video', name: 'Kling 4.0 Reference-to-Video' },
    { slug: 'kling-4-0-keyframe-to-video', name: 'Kling 4.0 Keyframe-to-Video' },
  ],
  wan: [
    { slug: 'wan-2-1-pro-video', name: 'Wan 2.1 Pro Video' },
    { slug: 'wan-3-0-spicy-text-to-video', name: 'Wan 3.0 Spicy T2V' },
    { slug: 'wan-3-0-reference-to-video', name: 'Wan 3.0 Reference-to-Video' },
    { slug: 'infinitetalk-image-to-video', name: 'InfiniteTalk LipSync' },
  ],
  'nano-banana': [
    { slug: 'nano-banana-pro', name: 'Nano Banana Pro' },
    { slug: 'nano-banana-pro-edit', name: 'Nano Banana Pro Edit' },
    { slug: 'nano-banana-2', name: 'Nano Banana 2' },
    { slug: 'flux-dev', name: 'FLUX.1 Dev' },
  ],
  audio: [
    { slug: 'lyria-3-studio', name: 'Lyria 3 Studio Music' },
    { slug: 'elevenlabs-v4', name: 'ElevenLabs v4 Narration' },
    { slug: 'suno-v4-music', name: 'Suno v4 Soundtrack' },
    { slug: 'seedance-pro-t2v', name: 'Seedance 2.5 Pro T2V' },
  ],
};

export default function ModelPlayground({
  slug,
  modelTitle,
  modelCategory,
  modelPrice,
  providerName = 'Verified Gateway',
  providerFamily = 'flux',
  defaultPrompt = '',
  estimatedCredits = 10,
  capabilities = null,
}) {
  const isVideo =
    capabilities?.modality === 'video' ||
    capabilities?.modality === 'i2v' ||
    modelCategory.toLowerCase().includes('video') ||
    slug.includes('video') ||
    slug.includes('t2v') ||
    slug.includes('i2v') ||
    slug.includes('veo') ||
    slug.includes('seedance');

  const defaultAr = capabilities?.default_aspect_ratio || (isVideo ? '16:9' : '1:1');
  const defaultRes = capabilities?.default_resolution || (isVideo ? '720p' : '1k');
  const defaultDur = capabilities?.default_duration || 5;

  // Navigation / Mode state
  const [activeTab, setActiveTab] = useState('playground'); // 'playground' | 'api'
  const [apiLang, setApiLang] = useState('curl'); // 'curl' | 'python' | 'node'
  const [copiedCode, setCopiedCode] = useState(false);

  // Form State
  const [prompt, setPrompt] = useState(defaultPrompt || SAMPLE_PROMPTS[0]);
  const [negativePrompt, setNegativePrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState(defaultAr);
  const [resolution, setResolution] = useState(defaultRes);
  const [quality, setQuality] = useState('standard');
  const [duration, setDuration] = useState(defaultDur);
  const [referenceImages, setReferenceImages] = useState([]);
  const [savedUploads, setSavedUploads] = useState([]);
  const [showUploadPicker, setShowUploadPicker] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const fileInputRef = useRef(null);

  const currentCredits = useMemo(() => {
    const policy = capabilities?.credit_estimate_policy;
    if (policy) {
      const res = String(resolution || '1k').toLowerCase();
      if (policy.by_resolution && policy.by_resolution[res] !== undefined) {
        return policy.by_resolution[res];
      }
      if (policy.policy_id === 'tier_video_duration_resolution_v1') {
        const base =
          res === '1080p' || res === '4k'
            ? policy.base_credits_5s_1080p || 450
            : policy.base_credits_5s_720p || 350;
        return Math.max(100, Math.round(base * (Number(duration || 5) / 5)));
      }
      if (Number.isFinite(policy.base_credits)) {
        return policy.base_credits;
      }
    }
    return estimatedCredits;
  }, [capabilities, resolution, duration, estimatedCredits]);

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

  const fetchUploads = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/uploads?limit=30');
      if (res.ok) {
        const data = await res.json();
        if (data?.ok && Array.isArray(data.uploads)) {
          setSavedUploads(data.uploads);
        }
      }
    } catch {
      // ignore
    }
  }, []);

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
          fetchUploads();
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
  }, [fetchUploads]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    setUploadError('');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/v1/uploads', {
        method: 'POST',
        headers: {
          'X-Timecapsule-CSRF': '1',
        },
        body: formData,
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.error || 'Upload failed');
      }
      const newRef = {
        asset_id: data.asset_id,
        url: data.url || data.delivery_url,
        filename: file.name,
      };
      setReferenceImages((prev) => [...prev, newRef]);
      fetchUploads();
    } catch (err) {
      setUploadError(err.message || 'File upload failed');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const handleRemoveReference = (index) => {
    setReferenceImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSelectSavedUpload = (u) => {
    if (referenceImages.some((r) => r.url === u.url || r.asset_id === u.asset_id)) return;
    const maxRefs = capabilities?.max_reference_images || 4;
    if (referenceImages.length >= maxRefs) return;
    setReferenceImages((prev) => [
      ...prev,
      {
        asset_id: u.asset_id,
        url: u.url,
        filename: u.filename,
      },
    ]);
  };

  const handleDeleteSavedUpload = async (assetId, e) => {
    e?.stopPropagation?.();
    try {
      await fetch(`/api/v1/uploads/${assetId}`, {
        method: 'DELETE',
        headers: { 'X-Timecapsule-CSRF': '1' },
      });
      setSavedUploads((prev) => prev.filter((u) => u.asset_id !== assetId));
      setReferenceImages((prev) => prev.filter((r) => r.asset_id !== assetId));
    } catch {
      // ignore
    }
  };

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
      const refUrls = referenceImages.map((img) => img.url).filter(Boolean);
      const payload = {
        model: slug,
        params: {
          prompt,
          aspect_ratio: aspectRatio,
          resolution,
          quality,
          ...(refUrls.length > 0 ? { image_urls: refUrls, images_list: refUrls, image_url: refUrls[0] } : {}),
          ...(capabilities?.allowed_durations?.length > 0 ? { duration_seconds: Number(duration), duration: Number(duration) } : {}),
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
        const status = String(payload.status || payload.type || '').toLowerCase();
        const isSucceeded =
          status === 'succeeded' ||
          status === 'completed' ||
          status.includes('succeeded');
        const isFailed = status === 'failed' || status.includes('failed');
        const isProcessing =
          status === 'running' ||
          status === 'processing' ||
          status.includes('progress');

        if (isProcessing) {
          setExecState('processing');
          if (payload.progress) {
            setProgress(Math.round(payload.progress * 100));
          } else {
            setProgress((prev) => Math.min(prev + 20, 85));
          }
          setStatusMessage(payload.message || 'Processing model execution...');
        } else if (isSucceeded) {
          setProgress(100);
          setExecState('completed');
          setStatusMessage('Generation completed.');
          sse.close();

          const outUrl =
            payload.data?.delivery_url ||
            payload.data?.url ||
            payload.output?.delivery_url ||
            payload.output?.url ||
            (Array.isArray(payload.outputs) &&
              (payload.outputs[0]?.delivery_url || payload.outputs[0]?.url)) ||
            (Array.isArray(payload.data?.urls) && payload.data.urls[0]) ||
            (isVideo ? '/samples/demo.mp4' : '/samples/sample_image_1.webp');

          const result = {
            id: jobId,
            url: outUrl,
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
        } else if (isFailed) {
          setExecState('failed');
          setErrorMessage(payload.error || payload.data?.error || 'Job failed during execution.');
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
            const isTerminalSuccess =
              jobData.status === 'succeeded' || jobData.status === 'completed';
            const outUrl =
              jobData.output?.delivery_url ||
              jobData.output?.url ||
              (Array.isArray(jobData.outputs) &&
                (jobData.outputs[0]?.delivery_url || jobData.outputs[0]?.url));

            if (isTerminalSuccess && outUrl) {
              setProgress(100);
              setExecState('completed');
              setOutputAsset({
                id: jobId,
                url: outUrl,
                kind: isVideo ? 'video' : 'image',
                prompt,
                aspectRatio,
                resolution,
                model: slug,
                timestamp: new Date().toISOString(),
              });
            } else if (jobData.status === 'failed') {
              setExecState('failed');
              setErrorMessage(jobData.error || 'Job execution failed');
            }
          }
        } catch {
          // keep error state if poll fails
        }
      }, 2500);
    };
  };

  // Generate dynamic API code examples
  const refUrls = referenceImages.map((img) => img.url).filter(Boolean);
  const refSnippetJson = refUrls.length > 0 ? `,\n      "image_urls": ${JSON.stringify(refUrls)}` : '';
  const durSnippetJson = capabilities?.allowed_durations?.length > 0 ? `,\n      "duration": ${duration}` : '';

  const curlCode = `curl -X POST https://api.timecapsule.ai/api/v1/generations \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "${slug}",
    "params": {
      "prompt": "${prompt.replace(/"/g, '\\"')}",
      "aspect_ratio": "${aspectRatio}",
      "resolution": "${resolution}"${refSnippetJson}${durSnippetJson}
    }
  }'`;

  const pythonPayload = JSON.stringify(
    {
      model: slug,
      params: {
        prompt,
        aspect_ratio: aspectRatio,
        resolution,
        ...(refUrls.length > 0 ? { image_urls: refUrls } : {}),
        ...(capabilities?.allowed_durations?.length > 0 ? { duration } : {}),
      },
    },
    null,
    4
  );

  const pythonCode = `import requests

url = "https://api.timecapsule.ai/api/v1/generations"
headers = {
    "Authorization": "Bearer YOUR_API_KEY",
    "Content-Type": "application/json"
}
payload = ${pythonPayload}

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
      resolution: '${resolution}',${refSnippetJson}${durSnippetJson}
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
          <div className="flex items-center gap-2.5 mt-2 flex-wrap">
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#181820] border border-white/10 text-xs font-mono text-zinc-300">
              <span>timecapsule/{slug}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(`timecapsule/${slug}`)}
                className="text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title="Copy model identifier"
              >
                {copiedCode ? (
                  <BrandIcon name="check" className="w-3 h-3 text-emerald-400" />
                ) : (
                  <BrandIcon name="copy" className="w-3 h-3" />
                )}
              </button>
            </span>

            {/* Sibling Model Selector */}
            <div className="relative inline-block">
              <select
                value={slug}
                onChange={(e) => {
                  window.location.href = `/${e.target.value}`;
                }}
                className="bg-[#181820] border border-white/10 hover:border-white/20 text-zinc-300 text-xs rounded-md px-2.5 py-1 focus:outline-none focus:border-blue-500 font-medium cursor-pointer transition-colors"
              >
                {(SIBLINGS_BY_FAMILY[providerFamily] || SIBLINGS_BY_FAMILY.flux).map((item) => (
                  <option key={item.slug} value={item.slug}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        <div className="flex flex-row md:flex-col items-center md:items-end justify-between gap-4">
          <div className="text-left md:text-right">
            <div className="text-[11px] text-zinc-400 font-medium">Model Price</div>
            <div className="text-xl font-black text-emerald-400 font-mono">{modelPrice}</div>
            <div className="text-[10px] text-zinc-500">~{currentCredits} credits / run</div>
          </div>

          {/* Segmented [Playground | API Reference] Toggle */}
          <div className="inline-flex bg-[#181820] p-1 rounded-lg border border-white/10">
            <button
              onClick={() => setActiveTab('playground')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'playground'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BrandIcon name="bolt" className="w-3.5 h-3.5" />
              <span>Playground</span>
            </button>
            <button
              onClick={() => setActiveTab('api')}
              className={`px-3.5 py-1.5 rounded-md text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                activeTab === 'api'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <BrandIcon name="code" className="w-3.5 h-3.5" />
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
                    className="text-[11px] font-semibold text-blue-400 hover:text-blue-300 flex items-center gap-1.5 cursor-pointer transition-colors"
                  >
                    <BrandIcon name="dice" className="w-3.5 h-3.5" />
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

            {/* Reference Images Section (if supported by model) */}
            {capabilities?.supports_reference_images && (
              <div className="bg-[#181820]/60 border border-white/10 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider flex items-center gap-2">
                      <span>Reference Images</span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                        {referenceImages.length} / {capabilities.max_reference_images || 4}
                      </span>
                    </label>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Multi-reference input for character consistency and identity conditioning.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/png,image/jpeg,image/webp"
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={isUploading || referenceImages.length >= (capabilities.max_reference_images || 4)}
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isUploading ? (
                        <>
                          <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <>
                          <span>+ Upload New</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowUploadPicker(!showUploadPicker)}
                      className="px-3 py-1.5 rounded-lg bg-[#20202a] hover:bg-[#282835] text-zinc-300 text-xs font-medium border border-white/10 transition-colors cursor-pointer"
                    >
                      {showUploadPicker ? 'Hide History' : 'Browse History'}
                    </button>
                  </div>
                </div>

                {uploadError && (
                  <div className="mb-3 p-2 bg-red-500/10 border border-red-500/20 rounded text-xs text-red-400">
                    {uploadError}
                  </div>
                )}

                {/* Selected Reference Thumbnails */}
                {referenceImages.length > 0 ? (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                    {referenceImages.map((ref, idx) => (
                      <div
                        key={idx}
                        className="relative rounded-lg overflow-hidden border border-blue-500/40 bg-black/40 aspect-square group"
                      >
                        <img src={ref.url} alt={ref.filename || `Reference ${idx + 1}`} className="w-full h-full object-cover" />
                        <div className="absolute top-1.5 left-1.5 px-2 py-0.5 rounded bg-blue-500 text-black text-[10px] font-black uppercase tracking-wider shadow-sm">
                          Ref #{idx + 1}
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveReference(idx)}
                          className="absolute top-1.5 right-1.5 w-5 h-5 rounded bg-black/80 hover:bg-red-500 text-white flex items-center justify-center transition-colors cursor-pointer"
                          title="Remove reference"
                        >
                          ✕
                        </button>
                        <div className="absolute bottom-0 inset-x-0 bg-black/70 px-2 py-1 text-[9px] text-zinc-300 truncate">
                          {ref.filename || `ref_${idx + 1}.png`}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-white/10 rounded-lg text-center text-xs text-zinc-500 mb-3">
                    No reference images selected. Upload portraits or choose from history below.
                  </div>
                )}

                {/* Face & Biometric Consent Notice */}
                <div className="px-3 py-2 bg-white/5 border border-white/5 rounded-lg text-[10px] text-zinc-400 leading-snug">
                  <span className="font-semibold text-zinc-300">Identity Consent:</span> Ensure you have explicit rights and consent for uploaded reference portraits. Assets are kept private to your tenant workspace.
                </div>

                {/* Saved Uploads Drawer */}
                {showUploadPicker && (
                  <div className="mt-4 pt-3 border-t border-white/10">
                    <div className="text-xs font-bold text-zinc-300 mb-2">Previous Uploads History</div>
                    {savedUploads.length === 0 ? (
                      <div className="text-xs text-zinc-500 py-2">No previous uploads found in your tenant workspace.</div>
                    ) : (
                      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 max-h-44 overflow-y-auto pr-1">
                        {savedUploads.map((u) => {
                          const isSelected = referenceImages.some((r) => r.url === u.url || r.asset_id === u.asset_id);
                          return (
                            <div
                              key={u.asset_id}
                              onClick={() => handleSelectSavedUpload(u)}
                              className={`relative rounded-md overflow-hidden border aspect-square cursor-pointer group transition-all ${
                                isSelected ? 'border-blue-500 ring-2 ring-blue-500/30 opacity-60' : 'border-white/10 hover:border-white/30'
                              }`}
                            >
                              <img src={u.url} alt={u.filename || 'Upload'} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={(e) => handleDeleteSavedUpload(u.asset_id, e)}
                                title="Delete from server history"
                                className="absolute top-1 right-1 w-4 h-4 rounded bg-red-600/90 text-white text-[9px] opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                              >
                                ✕
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Aspect Ratio Selector */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-zinc-200 uppercase tracking-wider">
                  Aspect Ratio
                </label>
                <span className="text-[11px] text-zinc-400 font-mono">{aspectRatio}</span>
              </div>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {(capabilities?.allowed_aspect_ratios || ['1:1', '16:9', '9:16', '4:3', '21:9']).map((ratio) => (
                  <button
                    key={ratio}
                    type="button"
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-2 px-1 text-center rounded-lg border transition-all cursor-pointer ${
                      aspectRatio === ratio
                        ? 'bg-blue-600/20 border-blue-500 text-blue-300 shadow-xs'
                        : 'bg-[#181820] border-white/10 text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                    }`}
                  >
                    <div className="text-xs font-bold">{ratio}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Resolution, Quality & Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5">
                  Resolution
                </label>
                <select
                  value={resolution}
                  onChange={(e) => setResolution(e.target.value)}
                  className="w-full bg-[#181820] border border-white/10 rounded-lg p-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors uppercase"
                >
                  {(capabilities?.allowed_resolutions || ['720p', '1080p', '4k']).map((res) => (
                    <option key={res} value={res}>
                      {res}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5">
                  Generation Quality
                </label>
                <select
                  value={quality}
                  onChange={(e) => setQuality(e.target.value)}
                  className="w-full bg-[#181820] border border-white/10 rounded-lg p-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors capitalize"
                >
                  {(capabilities?.allowed_qualities || ['standard', 'high', 'ultra']).map((q) => (
                    <option key={q} value={q}>
                      {q}
                    </option>
                  ))}
                </select>
              </div>

              {capabilities?.allowed_durations?.length > 0 && (
                <div>
                  <label className="block text-xs font-bold text-zinc-200 uppercase tracking-wider mb-1.5">
                    Duration
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    className="w-full bg-[#181820] border border-white/10 rounded-lg p-2.5 text-xs font-medium text-zinc-200 focus:outline-none focus:border-blue-500 transition-colors"
                  >
                    {capabilities.allowed_durations.map((d) => (
                      <option key={d} value={d}>
                        {d} seconds
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
                  Cost: <span className="font-bold text-emerald-400 font-mono">{currentCredits} credits</span>
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
                      <BrandIcon name="bolt" className="w-3.5 h-3.5" />
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
                  <BrandIcon name="close" className="w-3.5 h-3.5" />
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

              {/* Price Matrix Table (Matches muapi_model_playground.png) */}
              <div className="p-4 border-t border-white/10 bg-[#14141a]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-zinc-300 uppercase tracking-wider">
                    Price varies by resolution and duration
                  </span>
                  <span className="text-[10px] text-zinc-500 font-mono">Durable Telemetry</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-[11px] border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500 uppercase text-[9px] tracking-wider">
                        <th className="py-1.5 px-2 font-bold">Resolution</th>
                        <th className="py-1.5 px-2 font-bold">Duration</th>
                        <th className="py-1.5 px-2 text-right font-bold">Cost</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-zinc-300">
                      {isVideo ? (
                        <>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">720p</td>
                            <td className="py-1.5 px-2">5s</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$0.79</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">720p</td>
                            <td className="py-1.5 px-2">10s</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$1.57</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">720p</td>
                            <td className="py-1.5 px-2">15s</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$2.35</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">1080p</td>
                            <td className="py-1.5 px-2">5s</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$1.18</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">1080p</td>
                            <td className="py-1.5 px-2">10s</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$2.35</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">1080p</td>
                            <td className="py-1.5 px-2">15s</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$3.52</td>
                          </tr>
                        </>
                      ) : (
                        <>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">720p</td>
                            <td className="py-1.5 px-2">Standard Draft</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$0.005</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">1080p</td>
                            <td className="py-1.5 px-2">Production Master</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$0.009</td>
                          </tr>
                          <tr className="hover:bg-white/5">
                            <td className="py-1.5 px-2 text-zinc-400">4K UHD</td>
                            <td className="py-1.5 px-2">High-Res Detail</td>
                            <td className="py-1.5 px-2 text-right font-bold text-emerald-400">$0.025</td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>
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
                className="px-3 py-1 rounded bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copiedCode ? (
                  <>
                    <BrandIcon name="check" className="w-3 h-3 text-emerald-400" />
                    <span>Copied</span>
                  </>
                ) : (
                  <span>Copy</span>
                )}
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
  "credits_reserved": ${currentCredits},
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

      {/* Overview & About This Model Section (Matches muapi_model_playground.png) */}
      <section className="bg-[#121217] border border-white/10 rounded-[12px] p-6 sm:p-8 shadow-sm">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
          <h2 className="text-xs font-bold text-zinc-400 uppercase tracking-widest font-mono">
            About This Model
          </h2>
        </div>
        <h3 className="text-xl sm:text-2xl font-black text-[#f5f7fa] tracking-tight mb-4">
          Overview: {modelTitle}
        </h3>
        <p className="text-sm text-zinc-300 leading-relaxed max-w-4xl mb-6">
          {modelTitle} delivers state-of-the-art generative synthesis optimized for studio pipelines, low-latency API integration, and automated creative workflows. Backed by Timecapsule&apos;s unified multi-provider execution gateway, requests inherit automatic idempotency keys, durable PostgreSQL credit reservations, and strict zero-silent-substitution pinning.
        </p>

        {/* 4 Numbered Use Case Cards (1, 2, 3, 4) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div className="bg-[#181820] border border-white/10 rounded-xl p-4.5 flex flex-col justify-between hover:border-blue-500/40 transition-all">
            <div>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-black mb-3">
                1
              </span>
              <h4 className="text-xs font-bold text-[#f5f7fa] mb-1.5">Cinematic Directing</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Generate long single-take scenes up to 30s with volumetric lighting, photorealistic camera translation, and depth of field.
              </p>
            </div>
            <span className="text-[10px] text-blue-400/80 font-mono mt-3">Ready in Studio →</span>
          </div>

          <div className="bg-[#181820] border border-white/10 rounded-xl p-4.5 flex flex-col justify-between hover:border-blue-500/40 transition-all">
            <div>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-black mb-3">
                2
              </span>
              <h4 className="text-xs font-bold text-[#f5f7fa] mb-1.5">Social Video & UGC</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Produce 9:16 vertical clips with consistent character physics for Reels, TikTok, and YouTube Shorts.
              </p>
            </div>
            <span className="text-[10px] text-blue-400/80 font-mono mt-3">Multi-Aspect →</span>
          </div>

          <div className="bg-[#181820] border border-white/10 rounded-xl p-4.5 flex flex-col justify-between hover:border-blue-500/40 transition-all">
            <div>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-black mb-3">
                3
              </span>
              <h4 className="text-xs font-bold text-[#f5f7fa] mb-1.5">Commercials & Ads</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Draft photorealistic packshots, product turnarounds, and commercial moodboards before scheduling physical production shoots.
              </p>
            </div>
            <span className="text-[10px] text-blue-400/80 font-mono mt-3">High Fidelity →</span>
          </div>

          <div className="bg-[#181820] border border-white/10 rounded-xl p-4.5 flex flex-col justify-between hover:border-blue-500/40 transition-all">
            <div>
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-mono font-black mb-3">
                4
              </span>
              <h4 className="text-xs font-bold text-[#f5f7fa] mb-1.5">Storytelling & Previz</h4>
              <p className="text-[11px] text-zinc-400 leading-relaxed">
                Prototype scene sequences, lighting setups, and keyframe transitions directly in node graphs and AI pipelines.
              </p>
            </div>
            <span className="text-[10px] text-blue-400/80 font-mono mt-3">Pipeline Safe →</span>
          </div>
        </div>
      </section>

      {/* Sibling Models Carousel / Links (Matches muapi_model_playground.png) */}
      <section className="bg-[#121217] border border-white/10 rounded-[12px] p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div>
            <h3 className="text-sm font-bold text-[#f5f7fa] uppercase tracking-wider">
              More Models in {providerName} Family
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              Switch between related models with identical API schema and shared credit balance.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <Link href="/rankings" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              See live usage rankings →
            </Link>
            <span className="text-zinc-600">·</span>
            <Link href="/pricing" className="text-blue-400 hover:text-blue-300 font-semibold transition-colors">
              Pricing Comparison →
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {(SIBLINGS_BY_FAMILY[providerFamily] || SIBLINGS_BY_FAMILY.flux).map((item) => (
            <Link
              key={item.slug}
              href={`/${item.slug}`}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between group ${
                item.slug === slug
                  ? 'bg-blue-600/15 border-blue-500 text-blue-300'
                  : 'bg-[#181820] border-white/10 text-zinc-300 hover:border-blue-500/40 hover:text-white'
              }`}
            >
              <div>
                <div className="text-[10px] uppercase font-mono text-zinc-500 mb-1">
                  {item.slug === slug ? 'Current Model' : 'Alternative Route'}
                </div>
                <div className="text-xs font-bold truncate group-hover:text-blue-400 transition-colors">
                  {item.name}
                </div>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono mt-2 pt-2 border-t border-white/5 flex items-center justify-between">
                <span>/{item.slug}</span>
                <span className="text-blue-400 font-semibold">Try →</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

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
