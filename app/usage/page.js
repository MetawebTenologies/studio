import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default function UsagePage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white flex flex-col">
      <PlatformNav activeModule="usage" />

      <main className="max-w-6xl mx-auto px-6 py-10 flex-1 w-full">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-black uppercase tracking-tight">Credit & Usage Ledger</h1>
              <ModuleStatusBadge status="working" />
            </div>
            <p className="text-white/50 text-sm">
              Transparent, double-entry credit ledger separating user balances from upstream provider costs.
            </p>
          </div>
        </div>

        <div className="bg-[#121217] border border-white/10 rounded-2xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-white/10 flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white">Recent Ledger Events</h3>
            <span className="text-xs font-mono text-[#00e5ff]">Verified Balance: 500 cr</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/5 text-white/40 uppercase font-mono border-b border-white/5">
                <tr>
                  <th className="px-6 py-3">Timestamp</th>
                  <th className="px-6 py-3">Job / Operation</th>
                  <th className="px-6 py-3">Model</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">User Credits</th>
                  <th className="px-6 py-3 text-right">Provider Cost (Internal)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-white/70">
                <tr>
                  <td className="px-6 py-4">2026-10-21 18:00</td>
                  <td>t2v_cinema_veo</td>
                  <td>Veo 3.1 Cinema</td>
                  <td><span className="text-emerald-400">settled</span></td>
                  <td className="px-6 py-4 text-right text-amber-300">-70 cr</td>
                  <td className="px-6 py-4 text-right text-white/40">$0.0700</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">2026-10-21 17:30</td>
                  <td>t2i_nano_banana</td>
                  <td>Nano Banana Pro</td>
                  <td><span className="text-emerald-400">settled</span></td>
                  <td className="px-6 py-4 text-right text-amber-300">-10 cr</td>
                  <td className="px-6 py-4 text-right text-white/40">$0.0090</td>
                </tr>
                <tr>
                  <td className="px-6 py-4">2026-10-21 15:00</td>
                  <td>initial_grant</td>
                  <td>System Provisioning</td>
                  <td><span className="text-emerald-400">settled</span></td>
                  <td className="px-6 py-4 text-right text-emerald-400">+500 cr</td>
                  <td className="px-6 py-4 text-right text-white/40">$0.0000</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <PlatformFooter />
    </div>
  );
}
