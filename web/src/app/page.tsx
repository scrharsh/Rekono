import Link from 'next/link';
import Icon from '@/components/Icon';
import BrandLogo from '@/components/BrandLogo';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#f5f9ff] text-[#0f2347]">
      {/* Announcement Bar */}
      <div className="bg-[#0b57d0] px-4 py-2.5 text-center text-xs text-white sm:text-sm font-medium">
        Rekono: Business reconciliation OS for Indian businesses and CAs
      </div>

      {/* Sticky Navigation */}
      <nav className="sticky top-0 z-50 border-b border-[#d6e4ff] bg-white/95 backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-5 sm:px-8">
          <BrandLogo className="h-11 w-auto" />

          <div className="hidden items-center gap-8 text-sm text-[#2f4f83] md:flex">
            <Link href="/features" className="hover:text-[#0b57d0] transition">Features</Link>
            <Link href="/products" className="hover:text-[#0b57d0] transition">Products</Link>
            <Link href="/industries">Industries</Link>
            <Link href="/faq">FAQ</Link>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/login" className="rounded-lg px-4 py-2 text-sm font-medium text-[#2a4c83] hover:bg-[#eef4ff]">
              Login
            </Link>
            <Link href="/register" className="rounded-xl bg-[#0b57d0] px-5 py-2 text-sm font-semibold text-white shadow-[0_6px_14px_rgba(11,87,208,0.18)] transition hover:bg-[#0846ab]">
              Sign up
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section id="platform" className="relative overflow-hidden border-b border-[#d9e6ff] bg-[linear-gradient(180deg,#f8fbff_0%,#edf4ff_100%)]">

        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-14 px-5 pb-20 pt-16 sm:px-8 lg:grid-cols-2 lg:items-center lg:pb-24 lg:pt-20">
          <div>
            <p className="mb-5 inline-flex rounded-full border border-[#b7d0ff] bg-white px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#0b57d0]">
              Business & CA Operating System
            </p>
            <h1 className="text-4xl font-extrabold leading-tight text-[#142b57] sm:text-5xl lg:text-6xl">
              Turn operational chaos
              <span className="block text-[#0b57d0]">into structured intelligence</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-[#3e5f92] sm:text-lg">
              Capture transactions once, auto-reconcile payments intelligently, and power CA workflows with one unified platform. Mobile, web, and desktop.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row flex-wrap items-start sm:items-center gap-4">
              <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-[#0b57d0] px-7 py-3.5 text-sm font-semibold text-white hover:bg-[#0846ab] transition">
                Get started
                <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" className="h-4 w-4" />
              </Link>
              <Link href="/download" className="inline-flex items-center gap-2 rounded-xl border border-[#b8d1ff] bg-white px-7 py-3.5 text-sm font-semibold text-[#1f4f95] hover:border-[#0b57d0] hover:text-[#0b57d0] transition">
                Download app
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-[#c9dbff] bg-white p-6 sm:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#2d5aa2]">Live Example</h3>
              <span className="rounded-full bg-[#e8f0ff] px-3 py-1 text-xs font-semibold text-[#0b57d0]">Real-time</span>
            </div>
            <div className="space-y-3">
              {[
                { label: 'Payments received today', value: 'INR 2,48,500', tone: 'text-[#0d7c5f]' },
                { label: 'Auto-reconciled', value: 'INR 2,11,300', tone: 'text-[#0b57d0]' },
                { label: 'Manual exceptions', value: 'INR 37,200', tone: 'text-[#a05e08]' },
              ].map((item) => (
                <div key={item.label} className="rounded-2xl border border-[#dbe7ff] bg-[#f8fbff] px-4 py-3">
                  <p className="text-xs uppercase tracking-wide text-[#6686ba]">{item.label}</p>
                  <p className={`mt-1 text-xl font-semibold ${item.tone}`}>{item.value}</p>
                </div>
              ))}
            </div>
            <div className="mt-5 rounded-2xl bg-[#0b57d0] p-4 text-white">
              <p className="text-xs uppercase tracking-wider text-[#c6d9ff]">System recommendation</p>
              <p className="mt-1 text-sm font-medium">Resolve 8 probable matches to close out reconciliation flow. Estimated time: 5 minutes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Capture Transactions - First Product Module */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Get Started</p>
          <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Capture transactions in seconds</h2>
          <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">Business events flow in from multiple channels. System learns your patterns and suggests the right details.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              title: 'Manual Entry',
              desc: 'Quick form-based capture for in-person transactions. Progressive details, auto-categorization, default values from history.',
              action: 'See entry flow',
            },
            {
              title: 'Bank Import',
              desc: 'Connect your bank account once. Transactions sync daily. System matches them to business events automatically.',
              action: 'View import guide',
            },
            {
              title: 'Bulk Upload',
              desc: 'Import CSV, Excel, or PDF statements from multiple banks and payment sources. Instant processing and classification.',
              action: 'Try bulk upload',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#d8e6ff] bg-white p-6 flex flex-col">
              <h3 className="font-semibold text-[#153c74]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#4f71a5] flex-1">{item.desc}</p>
              <button className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0b57d0] hover:text-[#0846ab]">
                {item.action}
                <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Reconcile Payments - Second Product Module */}
      <section className="border-y border-[#dce8ff] bg-[#f7fbff]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-14">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Core Intelligence</p>
            <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Reconcile payments automatically</h2>
            <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">Payments from UPI, bank transfers, cards—all matched to business events with confidence scoring. Only exceptions need your review.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            {[
              {
                title: 'Exact Match',
                desc: 'Amount matches perfectly. System reconciles instantly. Zero manual intervention. Happens 60-70% of the time.',
                action: 'See confidence scoring',
              },
              {
                title: 'Suggested Match',
                desc: 'Multiple invoices could match. System ranks them by likelihood. You click one button to confirm.',
                action: 'Learn matching algorithm',
              },
              {
                title: 'Manual Resolution',
                desc: 'Unusual cases: partial payments, split invoices, reversals. Simple interface to link payment to events.',
                action: 'View exception handling',
              },
            ].map((item) => (
              <div key={item.title} className="rounded-2xl border border-[#d8e6ff] bg-white p-6 flex flex-col">
                <h3 className="font-semibold text-[#153c74]">{item.title}</h3>
                <p className="mt-2 text-sm text-[#4f71a5] flex-1">{item.desc}</p>
                <button className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0b57d0] hover:text-[#0846ab]">
                  {item.action}
                  <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Generate Reports - Third Product Module */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Extract Value</p>
          <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Generate compliance-ready reports</h2>
          <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">From verified transactions and reconciliations, produce audit-ready outputs instantly. No manual spreadsheet work.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              title: 'Reconciliation Reports',
              desc: 'Daily, weekly, or monthly. Shows transactions vs. payments, matched items, and pending exceptions.',
              action: 'Sample report',
            },
            {
              title: 'GST & Tax Exports',
              desc: 'GSTR1, GSTR2 formatted datasets. TDS computation. Income statement snapshots ready for CA submission.',
              action: 'View export formats',
            },
            {
              title: 'Client Dashboards',
              desc: 'CA firms: Generate white-labeled health dashboards per client. Show pending work and payment status.',
              action: 'Try client portal',
            },
          ].map((item) => (
            <div key={item.title} className="rounded-2xl border border-[#d8e6ff] bg-white p-6 flex flex-col">
              <h3 className="font-semibold text-[#153c74]">{item.title}</h3>
              <p className="mt-2 text-sm text-[#4f71a5] flex-1">{item.desc}</p>
              <button className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0b57d0] hover:text-[#0846ab]">
                {item.action}
                <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Industry Use Cases */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Purpose-Built</p>
          <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Trusted by businesses that need to move fast</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {[
            {
              title: 'Retail & Quick-Service',
              problem: '50+ daily transactions across cash, card, and UPI. Manual daily reconciliation takes 2+ hours.',
              solution: 'Auto-reconcile daily payments in under 5 minutes. Flag discrepancies instantly.',
              users: '+ 12,000 retailers',
              link: '/industries',
            },
            {
              title: 'Service Businesses',
              problem: 'Milestone billing, partial payments, and follow-ups lost in WhatsApp and email.',
              solution: 'Track service deliverables and payment status. Smart reminders for pending invoices.',
              users: '+ 8,500 agencies',
              link: '/industries',
            },
            {
              title: 'CA Firms',
              problem: 'Manage 50+ clients. Deadlines spread across spreadsheets. Document requests scattered.',
              solution: 'One client workspace. Unified deadline tracking. Ready-to-file exports every quarter.',
              users: '+ 4,200 CA practices',
              link: '/industries',
            },
            {
              title: 'High-Growth Startups',
              problem: 'Operations scale faster than accounting processes. Admin spending 3+ hours daily on reconciliation.',
              solution: 'Let the system handle 80% of reconciliation. Your team focuses on exceptions and growth.',
              users: '+ 6,800 startups',
              link: '/industries',
            },
          ].map((useCase) => (
            <div key={useCase.title} className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
              <h3 className="text-lg font-semibold text-[#153c74]">{useCase.title}</h3>
              <div className="mt-5 space-y-4">
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#5f7fb1]">The Problem</p>
                  <p className="mt-2 text-sm text-[#4f71a5]">{useCase.problem}</p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider font-semibold text-[#5f7fb1]">Our Solution</p>
                  <p className="mt-2 text-sm text-[#4f71a5]">{useCase.solution}</p>
                </div>
              </div>
              <div className="mt-6 flex items-end justify-between">
                <p className="text-xs font-semibold text-[#0b57d0]">{useCase.users}</p>
                <Link href={useCase.link} className="inline-flex items-center gap-1 text-sm font-semibold text-[#0b57d0] hover:text-[#0846ab]">
                  See how
                  <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Field Operations Section */}
      <section className="border-t border-[#dce8ff] bg-[#f7fbff]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">For Field Teams</p>
            <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Lightning-fast mobile entry</h2>
            <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">Your team out in the field. Capture transactions on mobile. Offline sync when network returns. No need for manual data entry later.</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8">
              <h3 className="text-lg font-semibold text-[#153c74] mb-4">Mobile App (iOS & Android)</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-[#4f71a5]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Works offline - sync when connected</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#4f71a5]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Biometric login for field security</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#4f71a5]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Camera to capture invoices and receipts</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#4f71a5]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Push notifications for urgent approvals</span>
                </li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8">
              <h3 className="text-lg font-semibold text-[#153c74] mb-4">Desktop App (Windows)</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3 text-sm text-[#4f71a5]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Full multitasking interface for power users</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#4f71a5]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Advanced reporting and bulk export</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#4f71a5]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Offline mode with local data sync</span>
                </li>
                <li className="flex items-start gap-3 text-sm text-[#4f71a5]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Multi-monitor layout support</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CA-Specific Section */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">For CAs</p>
          <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Manage clients, not chaos</h2>
          <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">CA Workspace centralizes client management: deadlines, documents, services, and invoicing. Everything your clients need—everything you need to manage them.</p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {[
            {
              title: 'Client Onboarding',
              desc: 'Invite clients to their workspace. Auto-populated with their account, transactions, and reconciliation status. Smart document checklists.',
              action: 'View onboarding flow',
            },
            {
              title: 'Deadline & Service Tracking',
              desc: 'Set quarterly/annual audit deadlines per client. Track which services you offer them. Auto-reminder system for you and clients.',
              action: 'See deadline setup',
            },
            {
              title: 'Export-Ready Compliance',
              desc: 'GST-GSTR1, GSTR2, TDS, income statements. One click to generate. All audit-ready. Admissible for tax prosecution.',
              action: 'Sample exports',
            },
          ].map((feature) => (
            <div key={feature.title} className="rounded-2xl border border-[#d8e6ff] bg-white p-6 flex flex-col">
              <h3 className="font-semibold text-[#153c74]">{feature.title}</h3>
              <p className="mt-2 text-sm text-[#4f71a5] flex-1">{feature.desc}</p>
              <button className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[#0b57d0] hover:text-[#0846ab]">
                {feature.action}
                <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Block */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-3xl bg-[linear-gradient(135deg,#0b57d0_0%,#0e7ef0_100%)] p-10 text-white sm:p-14">
          <h2 className="text-3xl font-extrabold sm:text-4xl">Ready to automate your operations?</h2>
          <p className="mt-4 max-w-2xl text-base text-[#d6e6ff] sm:text-lg">
            Start with Business OS. Add CA Workspace when needed. Scale across mobile, web, and desktop without changing core systems.
          </p>
          <div className="mt-10 flex flex-wrap gap-4">
            <Link href="/register" className="inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-semibold text-[#0b57d0] border border-[#e0e8f5] hover:border-[#c9d9ff] transition">
              Get started
              <Icon d="M13 7l5 5m0 0l-5 5m5-5H6" className="h-4 w-4" />
            </Link>
            <Link href="/login" className="inline-flex items-center rounded-xl border border-white/35 px-7 py-3.5 text-sm font-semibold text-white hover:bg-white/10 transition">
              Already using Rekono? Login
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#dce8ff] bg-white">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 px-5 py-12 sm:grid-cols-2 sm:px-8 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <div className="mb-4">
              <BrandLogo className="h-11 w-auto" />
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
