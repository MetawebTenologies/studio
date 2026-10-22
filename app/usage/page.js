import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';
import ModuleStatusBadge from '@/components/ModuleStatusBadge';

export default function UsagePage() {
  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col font-sans">
      <PlatformNav activeModule="usage" />

      <main className="max-w-[1440px] w-full mx-auto px-6 lg:px-8 py-8 flex-1 flex flex-col">
        {/* Header Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-zinc-800/80">
          <div>
            <div className="flex items-center gap-3 mb-1.5">
              <h1 className="text-xl sm:text-2xl font-black uppercase tracking-tight text-white">
                Credit & Usage Ledger
              </h1>
              <ModuleStatusBadge status="working" />
            </div>
            <p className="text-zinc-400 text-xs sm:text-sm">
              Transparent, double-entry credit ledger separating user balances from upstream provider costs.
            </p>
          </div>

          <div className="bg-[#111116] border border-zinc-800 rounded-xl px-4 py-2 self-start">
            <span className="text-[11px] text-zinc-500 block uppercase font-bold">Verified Balance</span>
            <span className="text-lg font-black text-[#00e5ff] font-mono">500 cr</span>
          </div>
        </div>

        <div className="bg-[#111116] border border-zinc-800/80 rounded-xl overflow-hidden mb-8">
          <div className="px-6 py-4 border-b border-zinc-800/80 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white">Recent Ledger Events</h3>
            <span className="text-xs font-mono text-zinc-400">PostgreSQL Durable Record</span>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#14141a] text-zinc-400 uppercase font-mono text-[11px] border-b border-zinc-800/80">
                <tr>
                  <th className="px-6 py-3 font-semibold">Timestamp</th>
                  <th className="px-6 py-3 font-semibold">Job / Operation</th>
                  <th className="px-6 py-3 font-semibold">Model</th>
                  <th className="px-6 py-3 font-semibold">Status</th>
                  <th className="px-6 py-3 font-semibold text-right">User Credits</th>
                  <th className="px-6 py-3 font-semibold text-right">Provider Cost (Internal)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50 font-mono text-zinc-300">
                <tr>
                  <td className="px-6 py-3.5 text-zinc-400">2026-10-21 18:00</td>
                  <td className="text-white font-medium">t2v_cinema_veo</td>
                  <td>Veo 3.1 Cinema</td>
                  <td><span className="text-emerald-400 font-sans font-medium">settled</span></td>
                  <td className="px-6 py-3.5 text-right text-amber-400">-70 cr</td>
                  <td className="px-6 py-3.5 text-right text-zinc-500">$0.0700</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 text-zinc-400">2026-10-21 17:30</td>
                  <td className="text-white font-medium">t2i_nano_banana</td>
                  <td>Nano Banana Pro</td>
                  <td><span className="text-emerald-400 font-sans font-medium">settled</span></td>
                  <td className="px-6 py-3.5 text-right text-amber-400">-10 cr</td>
                  <td className="px-6 py-3.5 text-right text-zinc-500">$0.0090</td>
                </tr>
                <tr>
                  <td className="px-6 py-3.5 text-zinc-400">2026-10-21 15:00</td>
                  <td className="text-white font-medium">initial_grant</td>
                  <td>System Provisioning</td>
                  <td><span className="text-emerald-400 font-sans font-medium">settled</span></td>
                  <td className="px-6 py-3.5 text-right text-emerald-400 font-bold">+500 cr</td>
                  <td className="px-6 py-3.5 text-right text-zinc-500">$0.0000</td>
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
