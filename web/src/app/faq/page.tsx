import Link from 'next/link';
import { Plus_Jakarta_Sans } from 'next/font/google';
import BrandLogoLink from '@/components/BrandLogoLink';

const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'] });

export default function FAQPage() {
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
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#0b57d0]">Questions Answered</p>
          <h1 className="mt-4 text-4xl font-bold text-[#142b57] sm:text-5xl">Frequently asked questions</h1>
          <p className="mt-6 max-w-2xl mx-auto text-lg text-[#4f71a5]">Everything you need to know about Rekono's features, pricing, and support.</p>
        </div>
      </section>

      {/* FAQ Grid */}
      <section className="mx-auto w-full max-w-4xl px-5 py-20 sm:px-8">
        <div className="space-y-6">
          {/* FAQ 1 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">Is Rekono a Tally replacement or accounting software?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              No, Rekono is not a replacement for Tally or accounting systems. Rekono sits upstream of accounting. We handle reconciliation, transaction intelligence, and workflow automation. Our outputs—verified transactions, matched payments, compliance-ready reports—feed into your existing accounting system or CA process. Think of us as the data validation and intelligence layer before accounting.
            </p>
          </div>

          {/* FAQ 2 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">Can my business operate without connecting a CA?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Yes, completely. Business OS and CA OS are independent systems. A business owner can run Business OS without any CA involvement. Similarly, a CA can run CA OS without direct integration to their clients' businesses. Connection happens only if both parties choose it, and only with explicit permission from both sides. Data sharing is granular and you control what gets shared.
            </p>
          </div>

          {/* FAQ 3 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">How does Rekono handle direct bank transfers and UPI payments?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Through intelligent reconciliation. When a bank transfer or UPI payment arrives in your account, Rekono automatically matches it with business events based on amount, timing, and learned patterns. If a payment amount matches a single invoice, the match is instant. If a payment could match multiple invoices (or none), our system suggests the most likely match with a confidence score. You review and confirm high-value or ambiguous matches; routine ones reconcile automatically.
            </p>
          </div>

          {/* FAQ 4 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">Do you support all payment methods?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Yes. Rekono supports all major payment methods: bank transfers (NEFT, RTGS, IMPS), UPI, credit cards, debit cards, digital wallets (Paytm, PhonePe, Google Pay, etc.), cryptocurrency (where applicable), cash on delivery, and physical cash. The system automatically detects payment type and source, then reconciles against business events. Multi-currency support is available for businesses with international transactions.
            </p>
          </div>

          {/* FAQ 5 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">Is my data encrypted and secure?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Yes, we use enterprise-grade security. All data is encrypted using AES-256 encryption at rest. Data in transit uses TLS 1.3. We implement role-based access control (RBAC) so each user sees and edits only authorized data. Every action—create, edit, delete, export—is logged in tamper-proof audit trails. We undergo regular security audits and penetration testing. Compliance certifications: SOC 2 Type II, ISO 27001, and GDPR-compliant where applicable.
            </p>
          </div>

          {/* FAQ 6 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">Can multiple users work on Rekono at the same time?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Yes, absolutely. Rekono supports unlimited concurrent users with role-based permissions. Assign roles such as Admin (full access), Operator (capture and reconcile), Reviewer (approve reconciliations), Accountant (export for filing), or Client (view-only). Each role has granular permissions. Real-time collaboration happens with instant data sync across all sessions. You can see who last edited a record and when, with full audit trail visibility.
            </p>
          </div>

          {/* FAQ 7 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">What compliance standards does Rekono meet?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Rekono is designed for Indian compliance: GST, TDS, income tax filing requirements, and CA audit standards. We generate GST-GSTR1/GSTR2 formatted data, TDS computation reports, and financial statements compatible with CA practice standards. For exports, we support standard formats: JSON, CSV, PDF, and Excel. Reconciliation outputs are audit-ready and admissible for tax prosecution/defense scenarios.
            </p>
          </div>

          {/* FAQ 8 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">Can I export my data if I switch to a competing product?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Yes, you own your data. You can export all your records, transactions, reconciliations, and documents in standard formats (JSON, CSV, XML) at any time. We encourage data portability. No lock-in periods or fees. If you choose to leave, we support a structured export process and can help you migrate to another system. Your data remains yours—always.
            </p>
          </div>

          {/* FAQ 9 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">What happens if I have duplicate or conflicting records?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Our system actively detects duplicates and conflicts. When you attempt to create a record similar to existing ones, Rekono flags the potential duplicate with details on the existing record. You can then choose to merge, skip, or create as new. For reconciliation conflicts (e.g., one payment matched to two invoices), the system prevents the conflict and suggests corrections. You never accidentally double-reconcile.
            </p>
          </div>

          {/* FAQ 10 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">How much does Rekono cost?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Pricing is available on our pricing page or via demo request. We offer flexible models: per-user subscriptions, transaction-volume based (for high-volume retail), and enterprise licensing (for CA firms managing 100+ clients). Free tier available for small businesses (up to 5 users, 500 transactions/month). No hidden fees, no setup charges. All plans include mobile, web, and desktop access.
            </p>
          </div>

          {/* FAQ 11 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">Do you offer onboarding and training?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              Yes. Every new account comes with onboarding (setup, data import, initial configuration). For advanced features, we offer training sessions via video, docs, or live sessions. Customer success team is available via chat, email, or scheduled calls. For enterprise customers, we provide dedicated onboarding and ongoing support. All plans include community access (Slack/Forum) for peer assistance.
            </p>
          </div>

          {/* FAQ 12 */}
          <div className="rounded-2xl border border-[#d8e6ff] bg-white p-6">
            <h3 className="text-lg font-semibold text-[#1a447f]">Is Rekono available offline?</h3>
            <p className="mt-4 text-base leading-relaxed text-[#5277ae]">
              The desktop app (Windows) has limited offline functionality—you can capture transactions offline and they sync once reconnected. The mobile app works fully offline for capture and approvals; syncing happens when connection returns. The web app requires internet connection. We recommend desktop for operations in low-connectivity areas and mobile for agents in the field.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="mx-auto w-full max-w-7xl px-5 py-20 sm:px-8">
        <div className="rounded-2xl bg-gradient-to-r from-[#0b57d0] to-[#0846ab] px-8 py-16 text-center">
          <h2 className="text-3xl font-bold text-white sm:text-4xl">Still have questions?</h2>
          <p className="mt-4 max-w-2xl mx-auto text-lg text-[#e6f0ff]">Get in touch with our team or schedule a personalized demo.</p>
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
