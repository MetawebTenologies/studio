'use client';

import { useState } from 'react';
import Link from 'next/link';
import PlatformNav from '@/components/PlatformNav';
import PlatformFooter from '@/components/PlatformFooter';

const DOCS_NAV = [
  { section: 'Get started', items: ['Introduction', 'Quick Start', 'Application Guides', 'Authentication'] },
  { section: 'White-Label Engine', items: ['Overview', 'Custom Domain Setup', 'Studio Toggles', 'Credit Markup', 'Reseller Billing', 'SMTP Sender', 'Sandbox Mode'] },
  { section: 'API reference', items: ['API Reference', 'Models Catalog', 'Pricing & Rates', 'Credits Ledger', 'Webhooks'] },
];

export default function WhiteLabelDocsPage() {
  const [activeNav, setActiveNav] = useState('Custom Domain Setup');
  const [copiedTxt, setCopiedTxt] = useState(false);
  const [copiedCname, setCopiedCname] = useState(false);

  return (
    <div className="min-h-screen bg-[var(--tc-bg-page,#09090b)] text-[var(--tc-text-primary,#f5f7fa)] flex flex-col font-sans transition-colors">
      <PlatformNav activeModule="docs" />

      <main className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 flex flex-col lg:flex-row gap-8">
        {/* Left Docs Navigation Sidebar */}
        <aside className="w-full lg:w-64 shrink-0">
          {/* Search Bar */}
          <div className="relative mb-6">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-zinc-500 text-xs">
              🔍
            </span>
            <input
              type="text"
              placeholder="Search docs..."
              className="w-full text-xs pl-8 pr-10 py-2 border border-white/10 rounded-md bg-[#121217] text-[#f5f7fa] placeholder:text-zinc-500 focus:outline-none focus:border-blue-500 shadow-xs"
            />
            <span className="absolute inset-y-0 right-0 pr-2.5 flex items-center pointer-events-none text-[10px] text-zinc-500 font-mono">
              ⌘K
            </span>
          </div>

          <div className="space-y-6 text-xs">
            {DOCS_NAV.map((group) => (
              <div key={group.section}>
                <h4 className="font-bold text-[#f5f7fa] uppercase tracking-wider text-[11px] mb-2">
                  {group.section}
                </h4>
                <ul className="space-y-1">
                  {group.items.map((item) => (
                    <li key={item}>
                      {item === 'Custom Domain Setup' ? (
                        <a
                          href="#custom-domain"
                          className="block px-3 py-1.5 rounded transition-colors bg-blue-600/15 text-blue-400 font-semibold border border-blue-500/20"
                        >
                          {item}
                        </a>
                      ) : item === 'Overview' ? (
                        <Link
                          href="/white-label"
                          className="block px-3 py-1.5 rounded transition-colors text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                          White-Label Landing
                        </Link>
                      ) : (
                        <Link
                          href="/docs"
                          className="block px-3 py-1.5 rounded transition-colors text-zinc-400 hover:text-white hover:bg-white/5"
                        >
                          {item}
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </aside>

        {/* Center Main Documentation Body */}
        <article className="flex-1 min-w-0 bg-[#121217] border border-white/10 rounded-lg p-6 sm:p-10 shadow-xs">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-zinc-400 mb-4">
            <Link href="/docs" className="hover:text-white">Docs</Link>
            <span>/</span>
            <Link href="/white-label" className="hover:text-white">White-Label Engine</Link>
            <span>/</span>
            <span className="text-white font-medium">Custom Domain Setup</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-white mb-3">
            White-Label Studio & Custom Domain Setup
          </h1>
          <p className="text-sm text-zinc-300 leading-relaxed mb-8">
            Learn how to deploy your own branded Timecapsule AI Studio, configure custom branding tokens, and connect your custom domain with automated SSL/TLS provisioning.
          </p>

          {/* Quick Notice Banner */}
          <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-xs text-blue-200 mb-8 flex items-start gap-3">
            <span className="text-base">💡</span>
            <div>
              <p className="font-semibold text-white mb-0.5">Custom Domains Available on Growth & Scale</p>
              <p className="text-zinc-300">
                Custom domains and automated SSL certification are included on the <strong>Growth ($99/mo)</strong> and <strong>Scale ($299/mo)</strong> plans. Starter plans include instant wildcard subdomains (<code className="bg-black/30 px-1 py-0.5 rounded text-cyan-300">slug.timecapsule.ai</code>).
              </p>
            </div>
          </div>

          {/* Section: Overview */}
          <section id="overview" className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">
              1. White-Label Architecture Overview
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
              Timecapsule&apos;s white-label engine decouples the customer-facing front-end studio from the back-end GPU queue and provider routing. Every white-label reseller operates as an isolated tenant with:
            </p>
            <ul className="space-y-2 text-xs sm:text-sm text-zinc-300 mb-6 pl-4 border-l-2 border-blue-500">
              <li><strong>Dynamic Theming:</strong> CSS variables and assets injected at runtime based on your database configuration.</li>
              <li><strong>Custom Host Routing:</strong> Requests received on your custom domain are resolved to your tenant context via the HTTP <code className="text-cyan-300 font-mono">Host</code> header.</li>
              <li><strong>Isolated Ledger:</strong> End users belong exclusively to your tenant. All credit debits, purchases, and margins are tracked independently.</li>
              <li><strong>Provider Abstraction:</strong> Multi-provider failover (Direct GPU + fallback pipelines) happens behind the scenes transparently.</li>
            </ul>
          </section>

          {/* Section: Custom Domain Setup (#custom-domain) */}
          <section id="custom-domain" className="mb-12 scroll-mt-20">
            <div className="flex items-center justify-between pb-2 border-b border-white/10 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>2. Custom Domain Configuration</span>
                <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950/60 border border-cyan-800 px-2 py-0.5 rounded">
                  #custom-domain
                </span>
              </h2>
            </div>

            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
              To host your branded studio on your own domain (e.g. <code className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded">studio.yourcompany.com</code> or apex <code className="text-white font-mono bg-white/5 px-1.5 py-0.5 rounded">yourbrand.ai</code>), complete the following 4-step DNS setup.
            </p>

            {/* Step 1 */}
            <div className="mb-8 p-5 rounded-lg bg-[#0c0c10] border border-white/10">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">1</span>
                <span>Claim Your Domain in Reseller Dashboard</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Navigate to <strong>Dashboard &gt; White-Label Settings &gt; Domains</strong> and enter your target FQDN. The system will generate a unique domain verification token.
              </p>
              <div className="bg-[#181820] border border-white/10 rounded p-3 text-xs font-mono text-zinc-300 flex items-center justify-between">
                <span>studio.yourcompany.com <span className="text-zinc-500 font-sans text-[11px]">(example hostname)</span></span>
                <span className="text-amber-400 text-[11px] font-sans font-semibold">● Pending Verification</span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="mb-8 p-5 rounded-lg bg-[#0c0c10] border border-white/10">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">2</span>
                <span>Add DNS TXT Verification Record</span>
              </div>
              <p className="text-xs text-zinc-400 mb-2">
                Add a DNS TXT record at your DNS provider (Cloudflare, Namecheap, GoDaddy, AWS Route 53) to verify domain ownership:
              </p>
              <p className="text-[11px] text-zinc-400 italic mb-3">
                * Example token shown below — your unique verification token is generated dynamically when you claim your domain in the dashboard.
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-white/10 rounded mb-3">
                  <thead>
                    <tr className="bg-[#15151f] text-zinc-300 border-b border-white/10">
                      <th className="p-2.5 font-bold">Type</th>
                      <th className="p-2.5 font-bold">Host / Name</th>
                      <th className="p-2.5 font-bold">Value / Content</th>
                      <th className="p-2.5 font-bold">TTL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-zinc-300">
                    <tr>
                      <td className="p-2.5 text-cyan-400 font-bold">TXT</td>
                      <td className="p-2.5">_tc-verify.studio <span className="text-[10px] text-zinc-500 font-sans">(example)</span></td>
                      <td className="p-2.5 text-zinc-400 truncate max-w-xs">tc_verify_8f29c48e02d8471b <span className="text-[10px] text-zinc-500 font-sans">(example)</span></td>
                      <td className="p-2.5">Auto / 300</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText('tc_verify_8f29c48e02d8471b');
                  setCopiedTxt(true);
                  setTimeout(() => setCopiedTxt(false), 2000);
                }}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                {copiedTxt ? '✓ Copied Token' : 'Copy TXT Token'}
              </button>
            </div>

            {/* Step 3 */}
            <div className="mb-8 p-5 rounded-lg bg-[#0c0c10] border border-white/10">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">3</span>
                <span>Point CNAME or A Record to Timecapsule Edge</span>
              </div>
              <p className="text-xs text-zinc-400 mb-3">
                Route traffic to our high-availability global edge proxy:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left border-collapse border border-white/10 rounded mb-3">
                  <thead>
                    <tr className="bg-[#15151f] text-zinc-300 border-b border-white/10">
                      <th className="p-2.5 font-bold">Domain Type</th>
                      <th className="p-2.5 font-bold">DNS Record</th>
                      <th className="p-2.5 font-bold">Host / Name</th>
                      <th className="p-2.5 font-bold">Target Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 font-mono text-zinc-300">
                    <tr>
                      <td className="p-2.5 font-sans font-semibold text-white">Subdomain</td>
                      <td className="p-2.5 text-cyan-400 font-bold">CNAME</td>
                      <td className="p-2.5">studio</td>
                      <td className="p-2.5 text-emerald-400">cname.timecapsule.ai <span className="text-[10px] text-zinc-400 font-sans">(provisions at edge rollout / launch)</span></td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-sans font-semibold text-white">Apex Domain (@)</td>
                      <td className="p-2.5 text-cyan-400 font-bold">A</td>
                      <td className="p-2.5">@</td>
                      <td className="p-2.5 text-emerald-400 font-sans text-xs">Shown in Reseller Dashboard upon domain claim</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-[11px] text-zinc-400 leading-relaxed mb-4">
                Subdomains route via CNAME to <code className="text-white font-mono bg-white/5 px-1 rounded">cname.timecapsule.ai</code> (active at private beta cutover; verified during onboarding). For root/apex domains where CNAME flattening is not supported by your DNS provider, the dedicated edge A-record IP is displayed in your Reseller Dashboard upon domain claim.
              </div>

              <button
                onClick={() => {
                  navigator.clipboard.writeText('cname.timecapsule.ai');
                  setCopiedCname(true);
                  setTimeout(() => setCopiedCname(false), 2000);
                }}
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors"
              >
                {copiedCname ? '✓ Copied CNAME' : 'Copy CNAME Target'}
              </button>
            </div>

            {/* Step 4 */}
            <div className="mb-8 p-5 rounded-lg bg-[#0c0c10] border border-white/10">
              <div className="flex items-center gap-2 text-sm font-bold text-white mb-2">
                <span className="w-5 h-5 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xs font-black">4</span>
                <span>Automated TLS/SSL Certificate Issuance</span>
              </div>
              <p className="text-xs text-zinc-300 leading-relaxed mb-3">
                Once DNS propagation is detected by our background verifier, our edge router (Caddy) automatically requests and provisions a trusted <strong>Let&apos;s Encrypt</strong> TLS certificate for your hostname.
              </p>
              <div className="p-3 rounded bg-emerald-950/40 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
                <span>✓</span>
                <span>Automatic 90-day certificate renewals with zero downtime or maintenance.</span>
              </div>
            </div>

            {/* Cloudflare Caveat Box */}
            <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200">
              <h4 className="font-bold text-white mb-1">⚠️ Cloudflare DNS Users: Proxy Mode</h4>
              <p className="text-zinc-300 leading-relaxed">
                If your domain is managed on Cloudflare, set the CNAME record proxy status to <strong>DNS Only (Gray Cloud)</strong> during initial verification. If you prefer to keep Orange Cloud active, set your Cloudflare SSL/TLS encryption mode to <strong>Full (Strict)</strong>.
              </p>
            </div>
          </section>

          {/* Section: Studio Toggles & Catalogs */}
          <section id="studio-toggles" className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">
              3. Studio Toggles & Capability Gating
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
              You can toggle individual creative suites on or off from your reseller console. Disabled studios disappear from the end-user navigation bar and return 404 on direct route access:
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs mb-4">
              {[
                { name: 'Image Studio (FLUX, Ideogram)', status: 'Active' },
                { name: 'Cinema Video (Veo, Seedance)', status: 'Active' },
                { name: 'LipSync Studio (Wan 2.2, InfiniteTalk)', status: 'Active' },
                { name: 'AI Audio & Speech (Lyria, ElevenLabs)', status: 'Active' },
                { name: 'Chained Workflows', status: 'Optional' },
                { name: 'Autonomous Production Agents', status: 'Optional' },
              ].map((s) => (
                <div key={s.name} className="p-3 bg-[#0c0c10] border border-white/10 rounded flex items-center justify-between">
                  <span className="text-zinc-300">{s.name}</span>
                  <span className="text-cyan-400 font-bold text-[10px]">{s.status}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Section: Setting Credit Markups */}
          <section id="credit-markup" className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">
              4. Credit Markups & Retail Price Sheets
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
              Every generation job in Timecapsule is priced in atomic credits. Resellers define their retail pricing multiplier in <code className="text-cyan-300 font-mono">tenant_price_sheets</code>:
            </p>

            <div className="bg-[#09090b] border border-white/10 rounded-md p-4 font-mono text-xs text-zinc-300 mb-4 overflow-x-auto">
              <pre>{`// Example: 2.0x Retail Markup Configuration
Wholesale Compute Cost : $0.150 (e.g. Veo 3.1 5s clip)
Reseller Multiplier    : 2.0x
End-User Retail Price  : $0.300 (billed to user)
Reseller Gross Profit  : $0.150 per generation (100% margin on compute)`}</pre>
            </div>
            <p className="text-xs text-zinc-400">
              You can also specify flat price overrides per model family or per generation modality.
            </p>
          </section>

          {/* Section: Reseller Billing & Direct Payouts */}
          <section id="billing" className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 pb-2 border-b border-white/10">
              5. Reseller Billing & Direct Payouts
            </h2>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
              End-user checkout runs through the platform today; BYO-Stripe is available on Scale (rolling out). Resellers receive automated monthly net margin disbursements directly to their registered bank accounts.
            </p>
            <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
              On the <strong>Scale</strong> tier, you will be able to configure your own Stripe API keys directly in the reseller admin once Stage C rolls out. Timecapsule creates Checkout Sessions using your encrypted keys, settling payments directly into your Stripe account.
            </p>
            <div className="p-4 bg-[#0c0c10] border border-white/10 rounded-lg text-xs space-y-2 text-zinc-300">
              <div className="flex items-center gap-2 font-bold text-white">
                <span>🔐</span>
                <span>KMS Secret Envelope Encryption</span>
              </div>
              <p>
                Your Stripe Secret Key and Webhook Signing Secret are encrypted at rest with envelope encryption. Timecapsule never acts as a payment intermediary or charges per-transaction revenue share.
              </p>
            </div>
          </section>

          {/* Section: Need Help */}
          <section className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h4 className="text-sm font-bold text-white">Ready to activate White-Label?</h4>
              <p className="text-xs text-zinc-400">Join the founding design-partner cohort for 50% off and dedicated onboarding.</p>
            </div>
            <Link
              href="/white-label#waitlist"
              className="px-5 py-2.5 bg-[#00e5ff] hover:bg-[#38bdf8] text-[#09090b] font-black text-xs uppercase tracking-wider rounded transition-all shadow-sm"
            >
              Join Design-Partner Waitlist →
            </Link>
          </section>
        </article>

        {/* Right Sidebar: Table of Contents */}
        <aside className="hidden xl:block w-56 shrink-0 text-xs">
          <div className="sticky top-24">
            <h4 className="font-bold text-[#f5f7fa] uppercase tracking-wider text-[11px] mb-3">On this page</h4>
            <ul className="space-y-2 border-l border-white/10 pl-3 text-zinc-400">
              <li>
                <a href="#overview" className="hover:text-white">Overview</a>
              </li>
              <li className="font-semibold text-blue-400">
                <a href="#custom-domain">Custom Domain Setup</a>
              </li>
              <li>
                <a href="#studio-toggles" className="hover:text-white">Studio Gating Toggles</a>
              </li>
              <li>
                <a href="#credit-markup" className="hover:text-white">Credit Markups</a>
              </li>
              <li>
                <a href="#billing" className="hover:text-white">Reseller Billing</a>
              </li>
            </ul>
          </div>
        </aside>
      </main>

      <PlatformFooter />
    </div>
  );
}
