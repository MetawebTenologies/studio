'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import ModuleStatusBadge from './ModuleStatusBadge';

const FALLBACK_TEMPLATES = [
  {
    id: 'tmpl_product_concept_01',
    slug: 'product-concept-pro',
    version: 1,
    title: 'Commercial Product Concept',
    category: 'Product Visualization',
    description: 'Photorealistic 2D raster studio product concept staging.',
    model_id: 'nano-banana-pro',
    status: 'published',
    pricing: 'tier_image_resolution_v1',
  },
  {
    id: 'tmpl_brand_logo_01',
    slug: 'brand-logo-concept',
    version: 1,
    title: 'Minimalist Brand Logo Concept',
    category: 'Brand Identity',
    description: 'Raster visual insignia and minimal logo concept artwork.',
    model_id: 'nano-banana-pro',
    status: 'published',
    pricing: 'tier_image_resolution_v1',
  },
];

export default function AppsTemplateRegistry() {
  const [templates, setTemplates] = useState(FALLBACK_TEMPLATES);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;

    async function loadTemplates() {
      try {
        const res = await fetch('/api/v1/templates', {
          credentials: 'same-origin',
        });
        if (!res.ok) {
          // If unauthenticated or preview mode, retain verified fallback catalog
          return;
        }
        const data = await res.json();
        if (active && data.ok && Array.isArray(data.templates) && data.templates.length > 0) {
          setTemplates(data.templates);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadTemplates();
    return () => {
      active = false;
    };
  }, []);

  return (
    <div>
      {/* Registry Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 pb-6 border-b border-white/10">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-400 text-[11px] font-bold uppercase tracking-wider border border-blue-500/30">
              Single-Purpose Web Tools
            </span>
            <ModuleStatusBadge status="working" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-[#f5f7fa] tracking-tight mb-2">
            Specialized Creative Apps
          </h1>
          <p className="text-zinc-400 text-sm max-w-2xl leading-relaxed">
            Data-driven application templates configured with curated prompt harnesses, resolution constraints, and deterministic credit billing. Deep links mount template settings without auto-submitting.
          </p>
        </div>

        <div className="flex items-center gap-3 bg-[#121217] border border-white/10 rounded-xl p-3.5 self-start shadow-sm">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <div>
            <div className="text-xs font-bold text-[#f5f7fa] uppercase tracking-wider">Registry Status</div>
            <div className="text-xs text-zinc-400 font-mono">
              {templates.length} Published Templates
            </div>
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      <div className="bg-[#121217] border border-white/10 rounded-xl p-4 mb-8 flex items-center justify-between text-xs text-zinc-400">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          <span>
            <strong>Deterministic Recipe Guard:</strong> Templates mount the approved model and prompt framework into Studio. Jobs are only submitted upon your explicit generation click.
          </span>
        </div>
        <span className="font-mono text-[11px] text-zinc-500 hidden sm:inline">
          Contract Tested Route: nano-banana-pro
        </span>
      </div>

      {/* Dynamic Template Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {templates.map((tmpl) => (
          <div
            key={tmpl.id || tmpl.slug}
            className="bg-[#121217] border border-white/10 hover:border-blue-500/50 rounded-2xl p-6 transition-all flex flex-col justify-between group shadow-sm hover:shadow-[0_0_25px_rgba(59,130,246,0.12)]"
          >
            <div>
              <div className="flex items-center justify-between gap-2 mb-4">
                <span className="text-[11px] font-bold uppercase tracking-widest text-blue-400 px-2.5 py-1 rounded bg-blue-500/10 border border-blue-500/20">
                  {tmpl.category}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded">
                  v{tmpl.version || 1} Published
                </span>
              </div>

              <h2 className="text-lg font-bold text-[#f5f7fa] mb-2 group-hover:text-blue-400 transition-colors">
                {tmpl.title}
              </h2>

              <p className="text-sm text-zinc-400 leading-relaxed mb-4">
                {tmpl.description}
              </p>

              <div className="bg-black/30 rounded-xl p-3 border border-white/5 space-y-2 mb-5 text-xs font-mono">
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Engine:</span>
                  <span className="text-zinc-200">{tmpl.model_id}</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Base Cost:</span>
                  <span className="text-blue-400">15 Credits (1K)</span>
                </div>
                <div className="flex items-center justify-between text-zinc-400">
                  <span>Pricing Policy:</span>
                  <span className="text-zinc-400">{tmpl.pricing || 'tier_image_resolution_v1'}</span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <span className="text-xs text-zinc-500 font-mono">
                Ready to mount
              </span>
              <Link
                href={`/studio?model=nano-banana-pro&preset=${tmpl.slug}`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-sm hover:shadow-md cursor-pointer"
              >
                <span>Use Template</span>
                <span className="text-xs">→</span>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
