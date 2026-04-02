import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import Icon from '@/components/Icon';
import BrandLogoLink from '@/components/BrandLogoLink';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function FeaturesPage() {
  return (
    <div className={`${jakarta.className} min-h-screen bg-[#f5f9ff] text-[#0f2347]`}>
      {/* Announcement Bar */}
      <div className="bg-[#0b57d0] px-4 py-2.5 text-center text-xs text-white sm:text-sm font-medium">
        Rekono: Business reconciliation OS for Indian businesses and CAs
      </div>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#d6e4ff] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <BrandLogoLink logoClassName="h-11 w-auto" />

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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Six Core Capabilities</p>
          <h1 className="mt-4 text-4xl font-bold text-[#142b57] sm:text-5xl">Built for high-velocity operations</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[#4f71a5]">Everything you need to automate business reconciliation, from transaction capture to compliance-ready outputs.</p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {/* Feature 1 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0]">
              <Icon d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6z" className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-[#153c74]">Unified Command Center</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">One decision screen shows urgent items, next priorities, and system-recommended actions. Urgent client issues, pending approvals, and high-priority tasks surface automatically.</p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Status dashboard with live metrics</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Prioritized action queue</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">System-recommended next steps</span>
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0]">
              <Icon d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-[#153c74]">Real-Time Health Intelligence</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">Every client receives a live health score tracking critical issues, overdue items, and payment status. Know instantly who needs attention and why.</p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Live client health scores</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Overdue tracking and warnings</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Critical issue flagging</span>
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0]">
              <Icon d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-[#153c74]">Autonomous Task Engine</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">System generates tasks with deadlines and priorities. You confirm suggestions. Exceptions only reach your desk—everything else runs automatically.</p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Auto-generated task queue</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Deadline and priority tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Exceptions-only interruptions</span>
              </li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0]">
              <Icon d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375" className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-[#153c74]">Payment Visibility Layer</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">Track pending fees, overdue collections, and received payments ranked by urgency. See all revenue streams in one place with clear payment status.</p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">All payment methods unified</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Overdue collection tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Urgency-ranked visibility</span>
              </li>
            </ul>
          </div>

          {/* Feature 5 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0]">
              <Icon d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-[#153c74]">Centralized Document Engine</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">No more scattered WhatsApp documents. One vault for all client records with completeness tracking and status visibility. Organized, searchable, and audit-logged.</p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Unified document storage</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Completeness tracking</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Full audit trail logging</span>
              </li>
            </ul>
          </div>

          {/* Feature 6 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#ebf3ff] text-[#0b57d0]">
              <Icon d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" className="h-7 w-7" />
            </div>
            <h3 className="text-xl font-semibold text-[#153c74]">Structured Knowledge Base</h3>
            <p className="mt-4 text-base leading-relaxed text-[#4f71a5]">Process guides with steps, timelines, costs, and checklists. Not generic FAQs—contextual answers for your workflow. Reference material when you need it.</p>
            <ul className="mt-6 space-y-3">
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Process documentation</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Cost and timeline data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#0b57d0] flex-shrink-0" />
                <span className="text-sm text-[#5277ae]">Step-by-step checklists</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b57d0] to-[#0846ab] px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to automate your operations?</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-[#e6f0ff]">Get started with Rekono today. Available on desktop, mobile, and web.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/register" className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#0b57d0] transition hover:bg-[#f5f9ff]">
              Get started
            </Link>
            <Link href="/download" className="rounded-xl border border-white px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10">
              Download app
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#dce8ff] bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogoLink logoClassName="h-11 w-auto" />
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
