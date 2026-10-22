'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import BrandIcon from '@/components/BrandIcon';

const BLOG_POSTS = [
  {
    id: 1,
    title: 'Best AI Video Models (2026): Quality, Speed & Price',
    category: 'VIDEO',
    readTime: '5 min read',
    date: '2026-10-20',
    summary: 'Compare leading multimodal video models by motion fidelity, rendering latency, audio sync, and token compute rates: Veo 3.1, Seedance 2.5, Kling, and Sora.',
    gradient: 'from-purple-900/40 via-blue-900/30 to-[#121217]',
    icon: 'video',
  },
  {
    id: 2,
    title: 'Nano Banana Pro API: Pricing, Code & Integration Guide',
    category: 'IMAGE',
    readTime: '4 min read',
    date: '2026-10-18',
    summary: 'Call the Nano Banana Pro API via Timecapsule. Sub-second generation, $0.015/image, strong prompt adherence, and full cURL & Python code samples.',
    gradient: 'from-amber-900/40 via-yellow-900/30 to-[#121217]',
    icon: 'banana',
  },
  {
    id: 3,
    title: 'Seedance 2.5 API: Native 4K Video in Seconds',
    category: 'VIDEO',
    readTime: '5 min read',
    date: '2026-10-15',
    summary: 'Seedance 2.5 on Timecapsule delivers native 4K video, 16s clips, and built-in audio sync — call it with a single REST request from any language.',
    gradient: 'from-emerald-900/40 via-teal-900/30 to-[#121217]',
    icon: 'seedance',
  },
  {
    id: 4,
    title: 'Google Veo 3.1 Live on Timecapsule: The Cinema Masterpiece',
    category: 'VIDEO',
    readTime: '6 min read',
    date: '2026-10-12',
    summary: 'Explore the groundbreaking capabilities of Google DeepMind’s latest video model. Unprecedented narrative continuity and native audio are now integrated.',
    gradient: 'from-blue-900/40 via-indigo-900/30 to-[#121217]',
    icon: 'veo',
  },
  {
    id: 5,
    title: 'Building the Future: Generative AI Pipelines with Workflows',
    category: 'WORKFLOWS',
    readTime: '5 min read',
    date: '2026-10-08',
    summary: 'Go beyond single prompts. Learn how to leverage Timecapsule’s visual node canvas to build robust, production-ready multimodal pipelines.',
    gradient: 'from-rose-900/40 via-pink-900/30 to-[#121217]',
    icon: 'bolt',
  },
  {
    id: 6,
    title: 'Lyria 3 Studio: AI Music Composition & Cinematic Stems',
    category: 'AUDIO',
    readTime: '4 min read',
    date: '2026-10-04',
    summary: 'Synthesize full-length audio tracks, ambient soundscapes, and instrumental stems with fine-grained tempo and key modulation.',
    gradient: 'from-cyan-900/40 via-blue-900/30 to-[#121217]',
    icon: 'audio',
  },
];

export default function BlogPage() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPosts = BLOG_POSTS.filter((post) => {
    const matchesCat = activeCategory === 'All' || post.category.toLowerCase() === activeCategory.toLowerCase();
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || post.summary.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="blog" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header Breadcrumbs & Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-xs text-zinc-400 font-semibold uppercase tracking-wider mb-2">
            <Link href="/" className="hover:text-white transition-colors">Home</Link> / <span className="text-[#00e5ff]">Insights</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-[#f5f7fa] mb-3">
            Timecapsule <span className="text-[#00e5ff]">Insights</span>
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
            Stay updated with the latest in AI image, video, and audio generation. Tutorials, news, and engineering insights from our team.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500">
              <BrandIcon name="search" className="w-3.5 h-3.5 text-zinc-500" />
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or topic..."
              className="w-full text-xs pl-8 pr-3 py-2 border border-white/10 rounded-lg bg-[#121217] text-zinc-200 placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Video', 'Image', 'Audio', 'Workflows'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  activeCategory === cat
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-[#121217] border border-white/10 text-zinc-400 hover:text-white hover:border-white/20'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Article Card */}
        <div className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden shadow-sm mb-12 hover:border-blue-500/50 transition-all duration-300 group">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="h-64 lg:h-auto bg-gradient-to-br from-blue-900/60 via-indigo-900/40 to-[#09090b] flex items-center justify-center p-8 text-white relative border-b lg:border-b-0 lg:border-r border-white/10">
              <div className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center mx-auto mb-3">
                  <BrandIcon name="sparkle" className="w-7 h-7 text-[#00e5ff]" />
                </div>
                <span className="text-lg font-bold tracking-tight text-white">Timecapsule Frontier Research</span>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-3">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                    FEATURED ARTICLE
                  </span>
                  <span className="text-zinc-500">MULTIMODAL AI</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#f5f7fa] group-hover:text-blue-400 transition-colors mb-3 leading-snug">
                  Best Generative AI Models 2026: Speed, Quality & Compute Efficiency
                </h2>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
                  Compare leading multimodal AI video and image models by output quality, prompt adherence, style fidelity, rendering speed, and API cost per compute unit.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-zinc-500 font-medium pt-4 border-t border-white/5">
                <span>2026-10-21 · 6 min read</span>
                <span className="text-blue-400 font-semibold group-hover:underline">Read Article →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Articles Grid */}
        <div className="mb-12">
          <h3 className="text-base font-bold text-[#f5f7fa] mb-6 uppercase tracking-wider">Recent Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-[#121217] border border-white/10 rounded-xl overflow-hidden shadow-sm hover:border-blue-500/50 hover:shadow-[0_0_20px_rgba(59,130,246,0.1)] transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className={`h-40 bg-gradient-to-br ${post.gradient} border-b border-white/10 flex items-center justify-center`}>
                    <div className="w-10 h-10 rounded-lg bg-black/40 backdrop-blur-xs border border-white/10 flex items-center justify-center">
                      <BrandIcon name={post.icon} className="w-5 h-5 text-white/90" />
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-zinc-400 mb-2">
                      <span className="text-blue-400">{post.category}</span>
                      <span className="font-mono text-zinc-500">{post.readTime}</span>
                    </div>
                    <h4 className="text-sm font-bold text-[#f5f7fa] group-hover:text-blue-400 transition-colors line-clamp-2 mb-2 leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-xs text-zinc-400 line-clamp-3 leading-relaxed mb-4">
                      {post.summary}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 flex items-center justify-between text-[11px] text-zinc-500 font-medium border-t border-white/5 pt-3">
                  <span className="font-mono">{post.date}</span>
                  <span className="text-blue-400 font-semibold group-hover:underline">Read Story →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
