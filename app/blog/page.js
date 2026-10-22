'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

const BLOG_POSTS = [
  {
    id: 1,
    title: 'Best AI Video Models (2026): Quality, Speed & Price',
    category: 'VIDEO',
    readTime: '5 min read',
    date: '2026-10-20',
    summary: 'Compare leading multimodal video models by motion fidelity, rendering latency, audio sync, and token compute rates: Veo 3.1, Seedance 2.5, Kling, and Sora.',
    gradient: 'from-purple-600/30 to-blue-600/30',
  },
  {
    id: 2,
    title: 'Nano Banana Pro API: Pricing, Code & Integration Guide',
    category: 'IMAGE',
    readTime: '4 min read',
    date: '2026-10-18',
    summary: 'Call the Nano Banana Pro API via Timecapsule. Sub-second generation, $0.015/image, strong prompt adherence, and full cURL & Python code samples.',
    gradient: 'from-amber-500/30 to-yellow-500/30',
  },
  {
    id: 3,
    title: 'Seedance 2.5 API: Native 4K Video in Seconds',
    category: 'VIDEO',
    readTime: '5 min read',
    date: '2026-10-15',
    summary: 'Seedance 2.5 on Timecapsule delivers native 4K video, 16s clips, and built-in audio sync — call it with a single REST request from any language.',
    gradient: 'from-emerald-600/30 to-teal-600/30',
  },
  {
    id: 4,
    title: 'Google Veo 3.1 Live on Timecapsule: The Cinema Masterpiece',
    category: 'VIDEO',
    readTime: '6 min read',
    date: '2026-10-12',
    summary: 'Explore the groundbreaking capabilities of Google DeepMind’s latest video model. Unprecedented narrative continuity and native audio are now integrated.',
    gradient: 'from-blue-600/30 to-indigo-600/30',
  },
  {
    id: 5,
    title: 'Building the Future: Generative AI Pipelines with Workflows',
    category: 'WORKFLOWS',
    readTime: '5 min read',
    date: '2026-10-08',
    summary: 'Go beyond single prompts. Learn how to leverage Timecapsule’s visual node canvas to build robust, production-ready multimodal pipelines.',
    gradient: 'from-rose-600/30 to-pink-600/30',
  },
  {
    id: 6,
    title: 'Lyria 3 Studio: AI Music Composition & Cinematic Stems',
    category: 'AUDIO',
    readTime: '4 min read',
    date: '2026-10-04',
    summary: 'Synthesize full-length audio tracks, ambient soundscapes, and instrumental stems with fine-grained tempo and key modulation.',
    gradient: 'from-cyan-600/30 to-blue-600/30',
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
    <div className="min-h-screen bg-[var(--tc-bg-page)] text-[var(--tc-text-primary)] flex flex-col font-sans">
      <PlatformNav activeModule="blog" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header Breadcrumbs & Title */}
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider mb-2">
            <Link href="/" className="hover:text-slate-600">Home</Link> / <span className="text-blue-600">Insights</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900 mb-3">
            Timecapsule <span className="text-blue-600">Insights</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Stay updated with the latest in AI image, video, and audio generation. Tutorials, news, and engineering insights from our team.
          </p>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 mb-8">
          <div className="relative w-full sm:w-80">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 text-xs">
              🔍
            </span>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by title or topic..."
              className="w-full text-xs pl-8 pr-3 py-2 border border-slate-200 rounded-md bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {['All', 'Video', 'Image', 'Audio', 'Workflows'].map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  activeCategory === cat
                    ? 'bg-slate-900 text-white'
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Featured Article Card */}
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs mb-12 hover:border-blue-500/60 transition-all duration-300 group">
          <div className="grid grid-cols-1 lg:grid-cols-2">
            <div className="h-64 lg:h-auto bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 flex items-center justify-center p-8 text-white relative">
              <div className="text-center">
                <span className="text-4xl mb-2 block">🌌</span>
                <span className="text-lg font-bold tracking-tight">Timecapsule Frontier Research</span>
              </div>
            </div>
            <div className="p-8 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider mb-3">
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-600 border border-blue-200">
                    FEATURED ARTICLE
                  </span>
                  <span className="text-slate-400">MULTIMODAL AI</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900 group-hover:text-blue-600 transition-colors mb-3 leading-snug">
                  Best Generative AI Models 2026: Speed, Quality & Compute Efficiency
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                  Compare leading multimodal AI video and image models by output quality, prompt adherence, style fidelity, rendering speed, and API cost per compute unit.
                </p>
              </div>
              <div className="flex items-center justify-between text-xs text-slate-400 font-medium pt-4 border-t border-slate-100">
                <span>2026-10-21 · 6 min read</span>
                <span className="text-blue-600 font-semibold group-hover:underline">Read Article →</span>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Articles Grid */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-slate-900 mb-6">Recent Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs hover:border-blue-500/60 hover:shadow-md transition-all group flex flex-col justify-between"
              >
                <div>
                  <div className={`h-40 bg-gradient-to-br ${post.gradient} border-b border-slate-100 flex items-center justify-center`}>
                    <span className="text-3xl">✨</span>
                  </div>
                  <div className="p-5">
                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      <span className="text-blue-600">{post.category}</span>
                      <span>{post.readTime}</span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2 leading-snug">
                      {post.title}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed mb-4">
                      {post.summary}
                    </p>
                  </div>
                </div>
                <div className="px-5 pb-5 pt-0 flex items-center justify-between text-[11px] text-slate-400 font-medium border-t border-slate-50 pt-3">
                  <span>{post.date}</span>
                  <span className="text-blue-600 font-semibold group-hover:underline">Read Story →</span>
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
