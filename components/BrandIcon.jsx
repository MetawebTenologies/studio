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

  // Default clean geometric AI node mark
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
      <rect x="4" y="4" width="16" height="16" rx="4" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}
