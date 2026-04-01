import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

function Icon({ d, className = 'w-5 h-5' }: { d: string; className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  );
}

export default function ProductsPage() {
  return (
    <div className={`${jakarta.className} min-h-screen bg-[#f5f9ff] text-[#0f2347]`}>
      {/* Announcement Bar */}
      <div className="bg-[#0b57d0] px-4 py-2.5 text-center text-xs text-white sm:text-sm font-medium">
        Rekono: Business reconciliation OS for Indian businesses and CAs
      </div>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#d6e4ff] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b57d0] text-white shadow-[0_10px_22px_rgba(11,87,208,0.35)]">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight">Rekono</span>
          </div>

          <div className="hidden items-center gap-8 text-sm text-[#2f4f83] md:flex">
            <Link href="/features" className="hover:text-[#0b57d0] transition">Features</Link>
            <Link href="/products" className="hover:text-[#0b57d0] transition">Products</Link>
            <Link href="/industries" className="hover:text-[#0b57d0] transition">Industries</Link>
            <Link href="/faq" className="hover:text-[#0b57d0] transition">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-[#2a4c83] hover:bg-[#eef4ff]">
              Login
            </Link>
            <Link href="/register" className="rounded-xl bg-[#0b57d0] px-5 py-2 text-sm font-semibold text-white shadow-[0_12px_24px_rgba(11,87,208,0.26)] transition hover:bg-[#0846ab]">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Product Line</p>
          <h1 className="mt-4 text-4xl font-bold text-[#142b57] sm:text-5xl">Three products, one ecosystem</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[#4f71a5]">Built for Indian businesses and CAs. Each product adapts to your workflow, but all share unified data and intelligence.</p>
        </div>
      </section>

      {/* Business OS */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Product 1</p>
          <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Business OS</h2>
          <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">For store owners, agencies, and service businesses. Capture transactions once, auto-reconcile payments, run operations with minimal staff overhead.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              icon: 'M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z',
              title: 'Smart Event Capture',
              desc: 'Capture sales and service events with progressive detail. System learns from patterns and makes suggestions automatically. No clunky forms—just natural entry.',
            },
            {
              icon: 'M15 12c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zm6 0c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3zM3 12c0 1.66-1.34 3-3 3s-3-1.34-3-3 1.34-3 3-3 3 1.34 3 3z',
              title: 'Intelligent Payment Matching',
              desc: 'Auto-link bank transfers, UPI, credit cards, and wallet payments to business events. Confidence scoring shows matches. Ambiguous cases surface for review.',
            },
            {
              icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z',
              title: 'Business Mode Adaptation',
              desc: 'Choose retail, wholesale, services, or agency mode. System adapts fields, defaults, and workflows. Same system, different behaviors.',
            },
          ].map((feature) => (
            <article key={feature.title} className="rounded-2xl border border-[#d2e2ff] bg-white p-6 transition">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ebf3ff] text-[#0b57d0]">
                <Icon d={feature.icon} />
              </div>
              <h3 className="text-lg font-semibold text-[#14305e]">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#476da3]">{feature.desc}</p>
            </article>
          ))}
        </div>
      </section>

      {/* CA OS */}
      <section className="border-y border-[#dce8ff] bg-[#f7fbff]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Product 2</p>
            <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">CA OS</h2>
            <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">For chartered accountants and CA firms. Manage clients, track services, monitor deadlines, and deliver compliance-ready exports every quarter from one workspace.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
                title: 'Client Workspace',
                desc: 'Manage all clients from one unified dashboard. See health scores, pending work, documents, deadlines, and service status at a glance. No tab-switching.',
              },
              {
                icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
                title: 'Service & Billing Tracker',
                desc: 'Manage services offered, track pending invoices, monitor payment status. Smart reminders for follow-ups and deadline tracking. One source of truth for all services.',
              },
              {
                icon: 'M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z',
                title: 'Work Prioritization',
                desc: 'System-generated task queue prioritized by deadline, complexity, and revenue impact. Clear next steps every day. Never miss a deadline or high-revenue client need.',
              },
            ].map((feature) => (
              <article key={feature.title} className="rounded-2xl border border-[#d2e2ff] bg-white p-6 transition">
                <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-[#ebf3ff] text-[#0b57d0]">
                  <Icon d={feature.icon} />
                </div>
                <h3 className="text-lg font-semibold text-[#14305e]">{feature.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-[#476da3]">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Reconciliation Engine */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Product 3</p>
          <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Reconciliation Engine</h2>
          <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">The intelligent backbone that powers both Business OS and CA OS. Automatically matches payments to business events. Learns patterns. Suggests fixes for ambiguous matches.</p>
        </div>
        <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <div>
              <h3 className="text-xl font-semibold text-[#153c74] mb-6">How It Works</h3>
              <ol className="space-y-4">
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b57d0] text-white text-sm font-semibold flex-shrink-0">1</span>
                  <div>
                    <p className="font-medium text-[#153c74]">Capture Business Events</p>
                    <p className="mt-1 text-sm text-[#5277ae]">Sales, services, refunds, adjustments—all captured in one record per event.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b57d0] text-white text-sm font-semibold flex-shrink-0">2</span>
                  <div>
                    <p className="font-medium text-[#153c74]">Receive Payments</p>
                    <p className="mt-1 text-sm text-[#5277ae]">Bank transfers, UPI, cards, wallets—all automatically connected to your accounts.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b57d0] text-white text-sm font-semibold flex-shrink-0">3</span>
                  <div>
                    <p className="font-medium text-[#153c74]">Auto-Reconcile</p>
                    <p className="mt-1 text-sm text-[#5277ae]">System matches payments to events using amount, timing, and learned patterns.</p>
                  </div>
                </li>
                <li className="flex gap-4">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0b57d0] text-white text-sm font-semibold flex-shrink-0">4</span>
                  <div>
                    <p className="font-medium text-[#153c74]">Handle Exceptions</p>
                    <p className="mt-1 text-sm text-[#5277ae]">Ambiguous matches surface for your review. System suggests fixes based on patterns.</p>
                  </div>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-xl font-semibold text-[#153c74] mb-6">Key Capabilities</h3>
              <ul className="space-y-4">
                {[
                  'Confidence scoring for each match',
                  'Pattern learning from past matches',
                  'Support for all payment methods',
                  'Time-range matching window',
                  'Duplicate payment detection',
                  'Partial payment tracking',
                  'Refund and adjustment handling',
                  'Compliance audit trail',
                  'Export-ready reconciliation reports',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3">
                    <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span className="text-[#5277ae]">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b57d0] to-[#0846ab] px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to streamline your operations?</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-[#e6f0ff]">Choose the right product for your business and get started today.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/register" className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#0b57d0] transition hover:bg-[#f5f9ff]">
              Get started
            </Link>
            <Link href="/download" className="rounded-xl border border-white px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10">
              Download now
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#dce8ff] bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0b57d0] text-white">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-lg font-bold text-[#143468]">Rekono</p>
            </div>
            <p className="max-w-sm text-sm leading-relaxed text-[#5c7cae]">
              Business reconciliation and CA intelligence platform. Built for Indian businesses that move fast. Available on mobile, web, and desktop.
            </p>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1a4f97]">Products</p>
            <div className="space-y-2 text-sm text-[#5a79ac]">
              <Link href="/products" className="block hover:text-[#0b57d0]">Business OS</Link>
              <Link href="/products" className="block hover:text-[#0b57d0]">CA Workspace</Link>
              <Link href="/products" className="block hover:text-[#0b57d0]">Reconciliation Engine</Link>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1a4f97]">Downloads</p>
            <div className="space-y-2 text-sm text-[#5a79ac]">
              <Link href="/download" className="block hover:text-[#0b57d0]">Desktop • Windows</Link>
              <Link href="/download" className="block hover:text-[#0b57d0]">Mobile • iOS • Android</Link>
            </div>
          </div>

          <div>
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-[#1a4f97]">Access</p>
            <div className="space-y-2 text-sm text-[#5a79ac]">
              <Link href="/register" className="block hover:text-[#0b57d0]">Create account</Link>
              <Link href="/login" className="block hover:text-[#0b57d0]">Sign in</Link>
            </div>
          </div>
        </div>
        <div className="border-t border-[#e4ecff] bg-[#f9fbff]">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 py-5 text-xs text-[#6d8fc3] sm:flex-row sm:px-8">
            <p>© 2026 Rekono. All rights reserved.</p>
            <p>Built with security-first operations. Enterprise-ready. Indian business focused.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
