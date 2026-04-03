import Link from 'next/link';
import BrandLogoLink from '@/components/BrandLogoLink';

export default function DownloadPage() {
  return (
    <div className="min-h-screen bg-[#f5f9ff] text-[#0f2347]">
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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Get Started</p>
          <h1 className="mt-4 text-4xl font-bold text-[#142b57] sm:text-5xl">Download Rekono</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[#4f71a5]">Available on desktop and mobile. Choose your platform and start reconciling today.</p>
        </div>
      </section>

      {/* Desktop Section */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-12">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">For Heavy Lifting</p>
          <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Desktop Application</h2>
          <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">Full-featured desktop app for comprehensive business reconciliation, reporting, and analytics.</p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {/* Windows */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
              <div className="flex flex-col justify-center">
                <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#ebf3ff]">
                  <svg className="h-10 w-10 text-[#0b57d0]" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 15h7v7H4v-7zm9 0h7v7h-7v-7z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-semibold text-[#153c74]">Windows</h3>
                <p className="mt-2 text-base text-[#5277ae]">Full-featured desktop app for Windows 10 and 11. All reconciliation, reporting, and analytics features.</p>
                <ul className="mt-6 space-y-2">
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Fast and native Windows experience</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Works offline with automatic sync</span>
                  </li>
                  <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                    <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    <span>Advanced reporting and exports</span>
                  </li>
                </ul>
              </div>
              <div className="flex items-center justify-center">
                <div className="space-y-4 w-full">
                  <button className="w-full rounded-xl bg-[#0b57d0] px-6 py-4 text-base font-semibold text-white hover:bg-[#0846ab] transition">
                    Download for Windows
                  </button>
                  <p className="text-center text-xs text-[#7a8fa8]">Windows 10 and 11 (64-bit) • ~150 MB • Latest version v1.0</p>
                  <div className="rounded-lg bg-[#f7fbff] p-4 text-center">
                    <p className="text-xs font-medium text-[#5277ae]">Alternative download</p>
                    <a href="#" className="text-sm font-semibold text-[#0b57d0] hover:text-[#0846ab] mt-1 block">Get from Microsoft Store</a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mobile Section */}
      <section className="border-y border-[#dce8ff] bg-[#f7fbff]">
        <div className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
          <div className="mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">For On-the-Go</p>
            <h2 className="mt-3 text-3xl font-bold text-[#142b57] sm:text-4xl">Mobile Platforms</h2>
            <p className="mt-4 max-w-2xl text-base text-[#4f71a5]">Lightning-fast mobile apps for capture, approvals, and field operations from your phone.</p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* iOS */}
            <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#ebf3ff]">
                <svg className="h-10 w-10 text-[#0b57d0]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 3h12a3 3 0 013 3v12a3 3 0 01-3 3H6a3 3 0 01-3-3V6a3 3 0 013-3zm0 2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V6a1 1 0 00-1-1H6z" />
                  <path d="M12 18a1 1 0 100-2 1 1 0 000 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-[#153c74]">iOS</h3>
              <p className="mt-2 text-base text-[#5277ae]">Native app for iPhone and iPad. Optimized for touchscreen with all core features.</p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Smooth, responsive iOS interface</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Offline-first capture and sync</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Biometric authentication</span>
                </li>
              </ul>
              <button className="mt-8 w-full rounded-xl bg-[#0b57d0] px-6 py-4 text-base font-semibold text-white hover:bg-[#0846ab] transition">
                Get on App Store
              </button>
              <p className="mt-3 text-center text-xs text-[#7a8fa8]">iOS 14.0 and later • Latest version v1.0</p>
            </div>

            {/* Android */}
            <div className="rounded-2xl border border-[#d8e6ff] bg-white p-8 transition">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-[#ebf3ff]">
                <svg className="h-10 w-10 text-[#0b57d0]" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.6 9.48l1.84-3.18c.16-.31.04-.72-.27-.88-.31-.16-.72-.04-.88.27L16.9 9h-4.5l.63-1.95c.09-.3-.02-.72-.36-.81-.34-.09-.72.02-.81.36-.97.26-1.88.56-2.75.88L8.1 9H3.4L1.56 5.82C1.4 5.51 1.52 5.1 1.83 4.94c.31-.16.72-.04.88.27L3.71 8.1C8.06 6.82 12.14 6.78 16.6 8.1L17.6 9.48M7 14.5c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1m10 0c.5 0 1 .5 1 1s-.5 1-1 1-1-.5-1-1 .5-1 1-1M7 2h10a2 2 0 012 2v13a2 2 0 01-2 2H7a2 2 0 01-2-2V4a2 2 0 012-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-semibold text-[#153c74]">Android</h3>
              <p className="mt-2 text-base text-[#5277ae]">Native app for Android phones and tablets. Full power of Rekono in your pocket.</p>
              <ul className="mt-6 space-y-2">
                <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Material Design Android experience</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Full offline functionality</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-[#5277ae]">
                  <svg className="h-5 w-5 text-[#0b57d0] flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                  <span>Fingerprint and PIN security</span>
                </li>
              </ul>
              <button className="mt-8 w-full rounded-xl bg-[#0b57d0] px-6 py-4 text-base font-semibold text-white hover:bg-[#0846ab] transition">
                Get on Google Play
              </button>
              <p className="mt-3 text-center text-xs text-[#7a8fa8]">Android 10.0 and later • Latest version v1.0</p>
            </div>
          </div>
        </div>
      </section>

      {/* System Requirements */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-[#142b57] sm:text-4xl">System Requirements</h2>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Windows Requirements */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#153c74] mb-4">Windows Desktop</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-[#5277ae]">
                <span className="text-[#0b57d0] font-semibold">OS:</span>
                <span>Windows 10 or later (64-bit)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#5277ae]">
                <span className="text-[#0b57d0] font-semibold">Memory:</span>
                <span>4 GB RAM minimum (8 GB recommended)</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#5277ae]">
                <span className="text-[#0b57d0] font-semibold">Storage:</span>
                <span>500 MB free disk space</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#5277ae]">
                <span className="text-[#0b57d0] font-semibold">Network:</span>
                <span>Internet connection for sync and features</span>
              </li>
            </ul>
          </div>

          {/* Mobile Requirements */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#153c74] mb-4">Mobile Apps</h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-[#5277ae]">
                <span className="text-[#0b57d0] font-semibold">iOS:</span>
                <span>iOS 14.0 or later, iPhone 8 and newer</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#5277ae]">
                <span className="text-[#0b57d0] font-semibold">Android:</span>
                <span>Android 10.0 or later, 2 GB RAM minimum</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#5277ae]">
                <span className="text-[#0b57d0] font-semibold">Storage:</span>
                <span>150 MB free space on device</span>
              </li>
              <li className="flex items-start gap-3 text-sm text-[#5277ae]">
                <span className="text-[#0b57d0] font-semibold">Network:</span>
                <span>WiFi or cellular; offline mode available</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b57d0] to-[#0846ab] px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Ready to simplify reconciliation?</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-[#e6f0ff]">Download the app and get started in minutes. Available on Windows, iOS, and Android.</p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row justify-center">
            <Link href="/register" className="rounded-xl bg-white px-6 py-3 text-base font-semibold text-[#0b57d0] transition hover:bg-[#f5f9ff]\">
              Create account
            </Link>
            <a href="#" className="rounded-xl border border-white px-6 py-3 text-base font-semibold text-white transition hover:bg-white/10">
              View demo
            </a>
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
