'use client';

/**
 * Clean monochrome vector glyphs for AI model providers and engines (F2/F4).
 * All icons are original open-licensed geometric/functional glyphs designed
 * for dark-mode high-contrast interfaces. (No copied trademarked vector art).
 */
export default function BrandIcon({ name, className = 'w-4 h-4' }) {
  const normalized = String(name || '').toLowerCase().trim();

  // Kling
  if (normalized.includes('kling')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="6 3 18 3 21 8 18 21 6 21 3 8" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="3" x2="12" y2="8" />
      </svg>
    );
  }

  // Runway
  if (normalized.includes('runway')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 19L9 5h6l5 14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 14h10" strokeLinecap="round" />
        <path d="M12 5v9" strokeLinecap="round" />
      </svg>
    );
  }

  // Luma
  if (normalized.includes('luma')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="4" />
        <line x1="12" y1="2" x2="12" y2="5" strokeLinecap="round" />
        <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round" />
        <line x1="2" y1="12" x2="5" y2="12" strokeLinecap="round" />
        <line x1="19" y1="12" x2="22" y2="12" strokeLinecap="round" />
      </svg>
    );
  }

  // Pika
  if (normalized.includes('pika')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // WanX / Alibaba
  if (normalized.includes('wanx') || normalized.includes('wan')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M3 17l4-10 4 10 4-10 4 10" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="19" cy="8" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // Hunyuan / Tencent
  if (normalized.includes('hunyuan')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="12 2 22 12 12 22 2 12" strokeLinejoin="round" />
        <polygon points="12 6 18 12 12 18 6 12" strokeLinejoin="round" />
      </svg>
    );
  }

  // Google / Veo / Imagen
  if (normalized.includes('google') || normalized.includes('veo') || normalized.includes('imagen')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C12 7.52 7.52 12 2 12C7.52 12 12 16.48 12 22C12 16.48 16.48 12 22 12C16.48 12 12 7.52 12 2Z" />
      </svg>
    );
  }

  // PixVerse
  if (normalized.includes('pixverse')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="18" height="18" rx="3" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <polyline points="21 15 16 10 5 21" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  }

  // Vidu
  if (normalized.includes('vidu')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="9" />
        <polygon points="10 8 16 12 10 16 10 8" fill="currentColor" />
      </svg>
    );
  }

  // MiniMax / Hailuo
  if (normalized.includes('minimax') || normalized.includes('hailuo')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="4" y1="12" x2="4" y2="12" strokeWidth="3" strokeLinecap="round" />
        <line x1="8" y1="8" x2="8" y2="16" strokeLinecap="round" />
        <line x1="12" y1="4" x2="12" y2="20" strokeLinecap="round" />
        <line x1="16" y1="7" x2="16" y2="17" strokeLinecap="round" />
        <line x1="20" y1="11" x2="20" y2="13" strokeLinecap="round" />
      </svg>
    );
  }

  // Flux / Black Forest Labs
  if (normalized.includes('flux') || normalized.includes('black forest')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9L12 3z" strokeLinejoin="round" />
        <path d="M12 3v18" strokeLinecap="round" />
        <path d="M4 7.5l16 9" strokeLinecap="round" />
        <path d="M20 7.5l-16 9" strokeLinecap="round" />
      </svg>
    );
  }

  // Banana / Nano Banana / ByteDance
  if (normalized.includes('banana') || normalized.includes('bytedance')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="4 4 10 4 14 20 8 20" strokeLinejoin="round" fill="currentColor" opacity="0.3" />
        <polygon points="10 4 20 4 16 20 6 20" strokeLinejoin="round" strokeWidth="1.75" />
      </svg>
    );
  }

  // Seedance
  if (normalized.includes('seedance')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="4" width="20" height="16" rx="2" strokeLinejoin="round" />
        <path d="M7 4v16" strokeLinecap="round" />
        <path d="M17 4v16" strokeLinecap="round" />
        <line x1="2" y1="9" x2="7" y2="9" />
        <line x1="2" y1="14" x2="7" y2="14" />
        <line x1="17" y1="9" x2="22" y2="9" />
        <line x1="17" y1="14" x2="22" y2="14" />
        <circle cx="12" cy="12" r="2.5" fill="currentColor" />
      </svg>
    );
  }

  // HiDream
  if (normalized.includes('hidream')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2a10 10 0 0 0-10 10c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z" />
      </svg>
    );
  }

  // Ideogram
  if (normalized.includes('ideogram')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="12 3 2 21 22 21 12 3" strokeLinejoin="round" />
        <line x1="12" y1="10" x2="12" y2="15" strokeLinecap="round" />
        <circle cx="12" cy="18" r="0.75" fill="currentColor" />
      </svg>
    );
  }

  // OpenAI / GPT
  if (normalized.includes('gpt') || normalized.includes('openai')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2a5 5 0 0 1 4.7 3.3A5 5 0 0 1 21 10a5 5 0 0 1-.3 5.4A5 5 0 0 1 18 20a5 5 0 0 1-6 2 5 5 0 0 1-4.7-3.3A5 5 0 0 1 3 14a5 5 0 0 1 .3-5.4A5 5 0 0 1 6 4a5 5 0 0 1 6-2z" strokeLinejoin="round" />
        <circle cx="12" cy="12" r="2.5" />
      </svg>
    );
  }

  // Qwen
  if (normalized.includes('qwen')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="8" />
        <polygon points="12 7 16 12 12 17 8 12" strokeLinejoin="round" />
      </svg>
    );
  }

  // Stability
  if (normalized.includes('stability')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="3" fill="currentColor" />
        <circle cx="12" cy="4" r="2" />
        <circle cx="12" cy="20" r="2" />
        <circle cx="4" cy="12" r="2" />
        <circle cx="20" cy="12" r="2" />
      </svg>
    );
  }

  // Modality & Functional Glyphs
  if (normalized.includes('image') || normalized === 't2i' || normalized === 'i2i') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="18" height="18" rx="2" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <polyline points="21 15 16 10 5 21" strokeLinejoin="round" strokeLinecap="round" />
      </svg>
    );
  }

  if (normalized.includes('video') || normalized === 't2v' || normalized === 'i2v' || normalized.includes('cinema')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="5 3 19 12 5 21 5 3" strokeLinejoin="round" fill="currentColor" opacity="0.2" />
        <polygon points="5 3 19 12 5 21 5 3" strokeLinejoin="round" />
      </svg>
    );
  }

  if (normalized.includes('audio') || normalized.includes('music') || normalized.includes('sound') || normalized.includes('speech')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M9 18V5l12-2v13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="6" cy="18" r="3" fill="currentColor" opacity="0.3" />
        <circle cx="18" cy="16" r="3" fill="currentColor" opacity="0.3" />
      </svg>
    );
  }

  if (normalized.includes('sparkle') || normalized.includes('edit') || normalized.includes('enhance') || normalized.includes('magic')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2l2.4 5.6L20 10l-5.6 2.4L12 18l-2.4-5.6L4 10l5.6-2.4L12 2z" strokeLinejoin="round" />
      </svg>
    );
  }

  // Bolt / Lightning / Fast
  if (normalized.includes('bolt') || normalized.includes('lightning') || normalized.includes('zap') || normalized === 'fast') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Dice / Random / Surprise
  if (normalized.includes('dice') || normalized.includes('random') || normalized.includes('surprise') || normalized.includes('shuffle')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="3" width="18" height="18" rx="4" strokeLinejoin="round" />
        <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
        <circle cx="15.5" cy="8.5" r="1.5" fill="currentColor" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
        <circle cx="8.5" cy="15.5" r="1.5" fill="currentColor" />
        <circle cx="15.5" cy="15.5" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // Shield / Security / Verify
  if (normalized.includes('shield') || normalized.includes('security') || normalized.includes('protect') || normalized.includes('verify')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinejoin="round" />
        <polyline points="9 12 11 14 15 10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Crown / Leaderboard / Rank
  if (normalized.includes('crown') || normalized.includes('rank') || normalized.includes('leaderboard') || normalized.includes('trophy')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M2 19h20M4 19l2-13 5 6 5-6 2 13" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="4" cy="6" r="1" fill="currentColor" />
        <circle cx="12" cy="6" r="1" fill="currentColor" />
        <circle cx="20" cy="6" r="1" fill="currentColor" />
      </svg>
    );
  }

  // Chart / Stats / Volume / Analytics
  if (normalized.includes('chart') || normalized.includes('stats') || normalized.includes('volume') || normalized.includes('analytics') || normalized.includes('trend')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="18" y1="20" x2="18" y2="10" strokeLinecap="round" />
        <line x1="12" y1="20" x2="12" y2="4" strokeLinecap="round" />
        <line x1="6" y1="20" x2="6" y2="14" strokeLinecap="round" />
      </svg>
    );
  }

  // Search
  if (normalized.includes('search')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" strokeLinecap="round" />
      </svg>
    );
  }

  // Swap / Faceswap / Sync
  if (normalized.includes('swap') || normalized.includes('faceswap') || normalized.includes('cycle')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M17 1l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 11V9a4 4 0 0 1 4-4h14" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 23l-4-4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 13v2a4 4 0 0 1-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Scissors / Cut / Background Remover
  if (normalized.includes('scissor') || normalized.includes('cut') || normalized.includes('remove') || normalized.includes('crop')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="6" cy="6" r="3" />
        <circle cx="6" cy="18" r="3" />
        <line x1="20" y1="4" x2="8.12" y2="15.88" strokeLinecap="round" />
        <line x1="14.47" y1="14.48" x2="20" y2="20" strokeLinecap="round" />
        <line x1="8.12" y1="8.12" x2="12" y2="12" strokeLinecap="round" />
      </svg>
    );
  }

  // Box / Product / Cube
  if (normalized.includes('product') || normalized.includes('box') || normalized.includes('package')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" strokeLinejoin="round" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="12" y1="22.08" x2="12" y2="12" strokeLinecap="round" />
      </svg>
    );
  }

  // Expand / Extend / Dimension / Ruler
  if (normalized.includes('extend') || normalized.includes('expand') || normalized.includes('dimension') || normalized.includes('ruler')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <polyline points="15 3 21 3 21 9" strokeLinecap="round" strokeLinejoin="round" />
        <polyline points="9 21 3 21 3 15" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="21" y1="3" x2="14" y2="10" strokeLinecap="round" />
        <line x1="3" y1="21" x2="10" y2="14" strokeLinecap="round" />
      </svg>
    );
  }

  // Person / Skin / Face / Avatar
  if (normalized.includes('person') || normalized.includes('skin') || normalized.includes('face') || normalized.includes('user')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" strokeLinecap="round" />
        <circle cx="12" cy="7" r="4" />
      </svg>
    );
  }

  // Palette / Paint / Color / Ghibli
  if (normalized.includes('color') || normalized.includes('palette') || normalized.includes('paint') || normalized.includes('ghibli')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="13.5" cy="6.5" r="1.5" fill="currentColor" />
        <circle cx="17.5" cy="10.5" r="1.5" fill="currentColor" />
        <circle cx="8.5" cy="7.5" r="1.5" fill="currentColor" />
        <circle cx="6.5" cy="12.5" r="1.5" fill="currentColor" />
        <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 1.5-.7 1.5-1.5 0-.4-.2-.8-.4-1.1-.3-.4-.4-.8-.4-1.4 0-1.1.9-2 2-2h2.3c3.9 0 7-3.1 7-7 0-5-4.5-9-10-9z" strokeLinejoin="round" />
      </svg>
    );
  }

  // Puzzle / LoRA
  if (normalized.includes('lora') || normalized.includes('puzzle')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M19.439 7.85c-.049-.322.059-.648.289-.878l1.568-1.568c.47-.47.47-1.23 0-1.7l-1.99-1.99a1.2 1.2 0 0 0-1.7 0l-1.568 1.568c-.23.23-.556.338-.878.289A4.004 4.004 0 0 0 11 6.5V4a1 1 0 0 0-1-1H6a1 1 0 0 0-1 1v5c0 1.657 1.343 3 3 3h2.5c.322-.049.648.059.878.289l1.568 1.568c.47.47 1.23.47 1.7 0l1.99-1.99a1.2 1.2 0 0 0 0-1.7l-1.568-1.568c-.23-.23-.338-.556-.289-.878A4.004 4.004 0 0 0 19.439 7.85z" strokeLinejoin="round" />
      </svg>
    );
  }

  // Eraser / Object Eraser
  if (normalized.includes('eraser') || normalized.includes('brush') || normalized.includes('clean')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M20 20H7L3 16C2 15 2 13 3 12L13 2C14 1 16 1 17 2L22 7C23 8 23 10 22 11L14 19" strokeLinecap="round" strokeLinejoin="round" />
        <line x1="18" y1="6" x2="9" y2="15" strokeLinecap="round" />
      </svg>
    );
  }

  // Lipsync / Speech / Voice / Mouth
  if (normalized.includes('lipsync') || normalized.includes('mouth') || normalized.includes('speech')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3v18" strokeLinecap="round" />
        <path d="M8 7v10" strokeLinecap="round" />
        <path d="M16 7v10" strokeLinecap="round" />
        <path d="M4 11v2" strokeLinecap="round" />
        <path d="M20 11v2" strokeLinecap="round" />
      </svg>
    );
  }

  // Watermark / Droplet
  if (normalized.includes('watermark') || normalized.includes('droplet') || normalized.includes('drop')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" strokeLinejoin="round" />
      </svg>
    );
  }

  // Social / Scraper / Media
  if (normalized.includes('social') || normalized.includes('share') || normalized.includes('feed') || normalized.includes('network')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="18" cy="5" r="3" />
        <circle cx="6" cy="12" r="3" />
        <circle cx="18" cy="19" r="3" />
        <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" strokeLinecap="round" />
        <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" strokeLinecap="round" />
      </svg>
    );
  }

  // Rocket / Publish
  if (normalized.includes('rocket') || normalized.includes('publish') || normalized.includes('launch')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" strokeLinejoin="round" />
        <path d="M12 15l-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" strokeLinejoin="round" />
      </svg>
    );
  }

  // Lock / Auth / Key / Secret
  if (normalized.includes('lock') || normalized.includes('auth') || normalized.includes('key') || normalized.includes('secret')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2" strokeLinejoin="round" />
        <path d="M7 11V7a5 5 0 0 1 10 0v4" strokeLinecap="round" />
      </svg>
    );
  }

  // Globe / Web / Domain
  if (normalized.includes('globe') || normalized.includes('domain') || normalized.includes('web') || normalized.includes('cname')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="10" />
        <line x1="2" y1="12" x2="22" y2="12" strokeLinecap="round" />
        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" strokeLinejoin="round" />
      </svg>
    );
  }

  // Credit / Card / Billing
  if (normalized.includes('card') || normalized.includes('billing') || normalized.includes('credit') || normalized.includes('payout')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <rect x="2" y="5" width="20" height="14" rx="2" strokeLinejoin="round" />
        <line x1="2" y1="10" x2="22" y2="10" strokeLinecap="round" />
      </svg>
    );
  }

  // Settings / Controls / Config
  if (normalized.includes('setting') || normalized.includes('control') || normalized.includes('config') || normalized.includes('slider')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <line x1="4" y1="21" x2="4" y2="14" strokeLinecap="round" />
        <line x1="4" y1="10" x2="4" y2="3" strokeLinecap="round" />
        <line x1="12" y1="21" x2="12" y2="12" strokeLinecap="round" />
        <line x1="12" y1="8" x2="12" y2="3" strokeLinecap="round" />
        <line x1="20" y1="21" x2="20" y2="16" strokeLinecap="round" />
        <line x1="20" y1="12" x2="20" y2="3" strokeLinecap="round" />
        <line x1="1" y1="14" x2="7" y2="14" strokeLinecap="round" />
        <line x1="9" y1="8" x2="15" y2="8" strokeLinecap="round" />
        <line x1="17" y1="16" x2="23" y2="16" strokeLinecap="round" />
      </svg>
    );
  }

  // Checkmark / Success
  if (normalized.includes('check') || normalized.includes('success')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="20 6 9 17 4 12" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  // Close / Cancel / Cross
  if (normalized.includes('close') || normalized.includes('cross') || normalized.includes('cancel')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18" strokeLinecap="round" />
        <line x1="6" y1="6" x2="18" y2="18" strokeLinecap="round" />
      </svg>
    );
  }

  // Default clean geometric AI node mark
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="4" y="4" width="16" height="16" rx="4" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
