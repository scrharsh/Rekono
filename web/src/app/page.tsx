import Link from 'next/link';

const features = [
  {
    icon: 'M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z',
    title: 'Sale-First Capture',
    desc: 'Staff log sales in under 10 seconds. Quick, detailed, or session mode — built for the showroom floor.',
  },
  {
    icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
    title: 'Automatic SMS Matching',
    desc: 'PhonePe, Google Pay, Paytm, BHIM — payments are parsed from SMS and matched to sales automatically.',
  },
  {
    icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
    title: 'CA Operating System',
    desc: 'Health scores, task engine, risk alerts, and deadline tracking — everything a CA needs across all clients.',
  },
  {
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    title: 'GST-Compliant Invoices',
    desc: 'Generate and share GST invoices with CGST/SGST/IGST breakdown. WhatsApp sharing built in.',
  },
  {
    icon: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4',
    title: 'Tally Export',
    desc: 'One-click Excel export in Tally-compatible format. GST summary reports ready for filing.',
  },
  {
    icon: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z',
    title: 'Offline-First Mobile',
    desc: 'Works without internet. Data syncs automatically when connectivity is restored.',
  },
];

const stats = [
  { value: '< 10s', label: 'Sale entry time' },
  { value: '90%+', label: 'Auto-match rate' },
  { value: '₹0', label: 'Deployment cost' },
  { value: '52', label: 'Correctness properties' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Nav */}
      <nav className="border-b border-white/5 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center">
              <svg className="w-4.5 h-4.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span className="font-bold text-lg tracking-tight">Rekono</span>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-slate-400 hover:text-white transition px-3 py-1.5">
              Sign in
            </Link>
            <Link href="/register" className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg transition">
              Create account
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Grid background */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />
        {/* Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-indigo-600/20 rounded-full blur-3xl" />

        <div className="relative max-w-6xl mx-auto px-6 pt-24 pb-20 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
            Built for Indian showrooms & CAs
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold tracking-tight leading-tight mb-6">
            The intelligent OS for<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-violet-400">
              Chartered Accountants
            </span>
          </h1>

          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Rekono connects showroom sales with UPI payments automatically, generates GST invoices,
            and gives CAs a real-time operating system across all their clients.
          </p>

          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link href="/register"
              className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-xl transition shadow-lg shadow-indigo-600/25">
              Start for free
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
            <a href="#features"
              className="inline-flex items-center gap-2 text-slate-400 hover:text-white font-medium px-6 py-3 rounded-xl border border-white/10 hover:border-white/20 transition">
              See features
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 sm:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-3xl font-bold text-white tabular-nums">{s.value}</p>
              <p className="text-sm text-slate-500 mt-1">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-4">Everything in one platform</h2>
          <p className="text-slate-400 max-w-xl mx-auto">
            From sale entry to GST filing — Rekono handles the full workflow for showrooms and their CAs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((f) => (
            <div key={f.title}
              className="group p-6 rounded-2xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06] hover:border-indigo-500/30 transition-all duration-200">
              <div className="w-10 h-10 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mb-4 group-hover:bg-indigo-600/20 transition">
                <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={f.icon} />
                </svg>
              </div>
              <h3 className="font-semibold text-white mb-2">{f.title}</h3>
              <p className="text-sm text-slate-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-white/5 bg-white/[0.02]">
        <div className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">How it works</h2>
            <p className="text-slate-400">Three steps from sale to verified GST record.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-indigo-600/0 via-indigo-600/50 to-indigo-600/0" />
            {[
              { step: '01', title: 'Staff logs the sale', desc: 'Showroom staff enters sale details on mobile in under 10 seconds. Works offline.' },
              { step: '02', title: 'Payment auto-matched', desc: 'UPI SMS is parsed and matched to the sale automatically. High-confidence matches need zero manual work.' },
              { step: '03', title: 'CA reviews & exports', desc: 'CA sees health scores, resolves exceptions, and exports to Tally or GST summary in one click.' },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-xl font-bold text-indigo-400">{item.step}</span>
                </div>
                <h3 className="font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="relative rounded-3xl bg-gradient-to-br from-indigo-600 to-violet-700 p-12 text-center overflow-hidden">
          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
          <div className="relative">
            <h2 className="text-3xl font-bold mb-4">Ready to modernise your practice?</h2>
            <p className="text-indigo-200 mb-8 max-w-lg mx-auto">
              Zero deployment cost. Runs on MongoDB Atlas, Render, and Vercel free tiers.
            </p>
            <Link href="/login"
              className="inline-flex items-center gap-2 bg-white text-indigo-700 font-bold px-8 py-3 rounded-xl hover:bg-indigo-50 transition shadow-lg">
              Sign in to Rekono
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-slate-600">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 11h.01M12 11h.01M15 11h.01M4 19h16a2 2 0 002-2V7a2 2 0 00-2-2H4a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <span>Rekono © {new Date().getFullYear()}</span>
          </div>
          <span>Built for Indian CAs & showrooms</span>
        </div>
      </footer>
    </div>
  );
}
