import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function IndustriesPage() {
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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Built for Indian Business</p>
          <h1 className="mt-4 text-4xl font-bold text-[#142b57] sm:text-5xl">Tailored for your industry</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[#4f71a5]">Rekono adapts to your business model. Retail, services, agencies, or CA practices—we've optimized every workflow.</p>
        </div>
      </section>

      {/* Industries Grid */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Retail */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0] font-semibold text-sm">
                Retail
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-[#153c74]">High-Volume Retail</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">For showrooms, retail chains, and quick-service businesses with multiple daily transactions.</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#1a447f]">The Challenge</p>
                <p className="mt-1 text-sm text-[#5277ae]">Dozens of daily transactions across cash, card, and digital payments. Manual reconciliation takes hours and errors slip through.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a447f]">How Rekono Helps</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Capture volumes in seconds with pre-filled categories</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Auto-match daily bank deposits to sales totals</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Flag payment leaks and mismatches instantly</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Daily reconciliation in under 5 minutes</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Services */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0] font-semibold text-sm">
                Service
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-[#153c74]">Service Businesses</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">For consultancies, repair shops, salons, and project-based service providers.</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#1a447f]">The Challenge</p>
                <p className="mt-1 text-sm text-[#5277ae]">Services billed at completion but payments often delayed. Tracking pending invoices and follow-ups drowns in WhatsApp messages.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a447f]">How Rekono Helps</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Track milestone billing and completion status</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Smart reminders for pending invoice follow-ups</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Reconcile partial and full payments to service records</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Link customer communications to pending work</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Agencies */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0] font-semibold text-sm">
                Agency
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-[#153c74]">Agencies & Consultancies</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">For design studios, marketing agencies, digital consultancies, and software shops.</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#1a447f]">The Challenge</p>
                <p className="mt-1 text-sm text-[#5277ae]">Project-based revenue with retainers, variable scopes, and client budgets. Billing complexity and discrepancies between invoiced and received amounts.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a447f]">How Rekono Helps</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Support project-based and retainer billing</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Track billings vs. revenues with variance flagging</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Flexible billing templates for complex scenarios</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Full audit trail for client and tax compliance</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* CAs */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0] font-semibold text-sm">
                CA/Audit
              </div>
            </div>
            <h3 className="text-2xl font-semibold text-[#153c74]">CA Firms & Accountants</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">For individual CAs, audit firms, and accounting practices managing multiple clients.</p>
            <div className="mt-6 space-y-4">
              <div>
                <p className="text-sm font-semibold text-[#1a447f]">The Challenge</p>
                <p className="mt-1 text-sm text-[#5277ae]">Manage dozens or hundreds of clients. Track services, deadlines, pending documents, and deliver compliance exports quarterly without drowning in spreadsheets.</p>
              </div>
              <div>
                <p className="text-sm font-semibold text-[#1a447f]">How Rekono Helps</p>
                <ul className="mt-2 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>One dashboard for all clients and pending work</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Deadline and document tracking per client</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>GST and compliance-ready exports</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <span className="text-[#0b57d0]">•</span>
                    <span>Service billing and payment tracking</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Comparison */}
      <section className="border-y border-[#dce8ff] bg-[#f7fbff]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-bold text-[#142b57] sm:text-4xl">All industries, core features</h2>
            <p className="mt-4 max-w-2xl mx-auto text-base text-[#4f71a5]">Regardless of industry, every Rekono user gets these foundations.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              {
                title: 'Unified Command Center',
                desc: 'One screen for all urgent items, priorities, and recommended actions.',
              },
              {
                title: 'Real-Time Health Intelligence',
                desc: 'Live status scores for clients, pending items, and payment health.',
              },
              {
                title: 'Autonomous Task Engine',
                desc: 'System generates tasks. You confirm. Exceptions only interrupt.',
              },
              {
                title: 'Payment Visibility',
                desc: 'All payments tracked, reconciled, and categorized for reporting.',
              },
              {
                title: 'Document Management',
                desc: 'Centralized vault with completeness tracking and audit logs.',
              },
              {
                title: 'Knowledge Base',
                desc: 'Contextual process guides, checklists, and reference materials.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
                <h4 className="font-semibold text-[#153c74]">{feature.title}</h4>
                <p className="mt-2 text-sm text-[#5277ae]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b57d0] to-[#0846ab] px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">See Rekono in action for your industry</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-[#e6f0ff]">Get a personalized demo tailored to your business model.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/register" className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#0b57d0] transition hover:bg-[#f5f9ff]">
              Request demo
            </Link>
            <Link href="/download" className="rounded-xl border border-white px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10">
              Try free
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
