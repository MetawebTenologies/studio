'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function NavCreditPill() {
  const [mounted, setMounted] = useState(false);
  const [credits, setCredits] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    let isCancelled = false;

    fetch('/api/v1/session')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (isCancelled) return;
        if (data?.ok && data.session) {
          setIsAuthenticated(true);
          if (data.credits) {
            setCredits(data.credits.available_credits ?? data.credits.balance);
          }
        }
      })
      .catch(() => {});

    return () => {
      isCancelled = true;
    };
  }, []);

  if (!mounted) {
    // SSR / Hydration placeholder
    return (
      <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 border border-amber-400/20 text-amber-300 text-xs font-mono font-semibold">
        <span className="text-amber-400">⚡</span>
        <span>5,000 cr</span>
      </div>
    );
  }

  const displayCredits = credits !== null ? Number(credits).toLocaleString() : '5,000';

  return (
    <Link
      href="/billing"
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/25 hover:border-amber-400/40 text-amber-300 text-xs font-mono font-bold transition-all shadow-xs group"
      title={
        isAuthenticated
          ? `Available credits: ${displayCredits}. Click to view ledger & top-up.`
          : 'Private preview credits allocation: 5,000 cr. Click to manage billing.'
      }
    >
      <span className="text-amber-400 group-hover:scale-110 transition-transform">⚡</span>
      <span>{displayCredits} cr</span>
    </Link>
  );
}
