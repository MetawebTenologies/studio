'use client';

import PlatformNav from '@/components/PlatformNav';
import StandaloneShell from '@/components/StandaloneShell';

export default function StudioPage() {
  return (
    <div className="h-screen flex flex-col bg-[#09090b] overflow-hidden">
      <PlatformNav activeModule="studio" />
      <div className="flex-1 overflow-hidden">
        <StandaloneShell />
      </div>
    </div>
  );
}
