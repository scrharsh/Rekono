'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import BrandLogoLink from '@/components/BrandLogoLink';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

type RoleType = 'ca' | 'business' | null;

const roles = [
  {
    id: 'ca' as RoleType,
    title: 'Chartered Accountant',
    desc: 'Manage clients, services, payments, documents & compliance',
    icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    features: ['Client Management', 'Service Tracking', 'Document Hub', 'Knowledge Engine'],
  },
  {
    id: 'business' as RoleType,
    title: 'Business Owner',
    desc: 'Reconcile payments, manage catalog & connect with your CA',
    icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    features: ['Payment Matching', 'Progressive Catalog', 'GST Invoices', 'CA Bridge'],
  },
];

export default function RegisterPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedRole, setSelectedRole] = useState<RoleType>(null);
  const [form, setForm] = useState({ username: '', fullName: '', email: '', password: '', confirm: '', phone: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const inputClass = 'w-full rounded-xl border border-[#d3e3ff] bg-white px-3.5 py-2.5 text-sm text-[#143a73] placeholder:text-[#89a4ca] transition focus:outline-none focus:border-[#0b57d0] focus:ring-4 focus:ring-[#e3efff]';
  const labelClass = 'block text-xs font-medium mb-1.5 text-[#5a7dae]';
  const primaryButtonClass = 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b57d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0846ab] disabled:cursor-not-allowed disabled:opacity-50';

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) { setError('Passwords do not match'); return; }
    if (form.password.length < 8) { setError('Password must be at least 8 characters'); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: form.username,
          fullName: form.fullName,
          email: form.email,
          password: form.password,
          phone: form.phone || undefined,
          role: selectedRole === 'business' ? 'staff' : 'ca',
        }),
      });

      if (!res.ok) {
        let msg = '';
        try { const d = await res.json(); msg = d?.message || d?.error?.message || ''; } catch { msg = ''; }
        if (res.status === 409) throw new Error('This username is already taken.');
        throw new Error(msg || 'Registration failed. Please try again.');
      }

      const loggedInUser = await login(form.username, form.password);
      const requiresSubscription = Boolean(loggedInUser.subscription?.required);
      const hasActiveSubscription = loggedInUser.subscription?.status === 'active';
      const isBusinessUser = loggedInUser.role === 'staff';

      if (isBusinessUser && requiresSubscription && !hasActiveSubscription) {
        router.push('/subscribe');
        return;
      }

      router.push(isBusinessUser ? '/dashboard' : '/command-center');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-[#f5f9ff] text-[#0f2347]">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: '#0b57d0' }}>
        <div className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #dce8ff 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(255,255,255,0.12) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="relative inline-flex items-center px-3 py-0">
            <div
              aria-hidden="true"
              style={{
                position: 'absolute',
                left: '-40px',
                right: '-8px',
                top: 0,
                bottom: 0,
                background: 'linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(243,248,255,0.88) 100%)',
                border: '1px solid rgba(255,255,255,0.56)',
                clipPath: 'polygon(0 0, calc(100% - 48px) 0, 100% 100%, 0 100%)',
                boxShadow: '0 8px 18px rgba(4,39,96,0.22), 0 0 16px rgba(168,215,255,0.48), 0 0 34px rgba(206,234,255,0.24)',
              }}
            />
            <BrandLogoLink className="relative z-10" logoClassName="h-12 w-auto" variant="default" />
          </div>
        </div>

        <div className="relative z-10 space-y-5">
          <h2 className="text-3xl font-bold text-white leading-tight">
            Join the platform that
            <br />
            <span className="text-[#dcecff]">works for CA and Business</span>
          </h2>
          <p className="text-base leading-relaxed text-[#e1eeff]">
            Whether you&apos;re a CA managing clients or a business tracking transactions, Rekono adapts to your workflow.
          </p>
          <div className="space-y-3 pt-4" style={{ borderTop: '1px solid rgba(206,225,255,0.6)' }}>
            {['Secure end-to-end encryption', 'Role-based access control', 'Multi-platform available'].map((f) => (
              <div key={f} className="flex items-center gap-2.5">
                <svg className="w-4 h-4 shrink-0 text-[#d7e8ff]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
                <span className="text-sm text-[#e1eeff]">{f}</span>
              </div>
            ))}
          </div>
        </div>

        <p className="relative z-10 text-xs text-[#d8e8ff]">
          © {new Date().getFullYear()} Rekono — Business Reconciliation & CA Intelligence
        </p>
      </div>

      {/* Right Panel */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-8 overflow-hidden">
        <div className="w-full max-w-md animate-fade-in rounded-3xl border border-[#d0e1ff] bg-white p-6">
          {/* Mobile logo */}
          <div className="lg:hidden mb-5">
            <BrandLogoLink logoClassName="h-12 w-auto" />
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0b57d0] hover:underline mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Rekono home
          </Link>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white"
                style={{ background: '#0b57d0' }}>1</div>
              <span className="text-xs font-medium" style={{ color: step === 1 ? '#153c74' : '#6f8fbe' }}>Role</span>
            </div>
            <div className="flex-1 h-px" style={{ background: step === 2 ? '#0b57d0' : '#d3e1fb' }} />
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ background: step === 2 ? '#0b57d0' : '#eef4ff', color: step === 2 ? '#fff' : '#6f8fbe' }}>2</div>
              <span className="text-xs font-medium" style={{ color: step === 2 ? '#153c74' : '#6f8fbe' }}>Details</span>
            </div>
          </div>

          {step === 1 ? (
            /* Step 1: Role Selection */
            <div className="animate-slide-up">
              <h1 className="text-2xl font-bold mb-1 text-[#153c74]">Set up your workspace</h1>
              <p className="text-sm mb-5 text-[#4f71a5]">Choose the workspace that fits how you run Rekono.</p>

              <div className="space-y-3">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedRole(role.id)}
                    className="w-full text-left p-4 rounded-xl transition-all duration-200"
                    style={{
                      background: selectedRole === role.id ? '#eef4ff' : '#f8fbff',
                      border: selectedRole === role.id ? '2px solid #0b57d0' : '2px solid #d7e5ff',
                    }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                        style={{ background: selectedRole === role.id ? '#0b57d0' : '#edf4ff' }}>
                        <svg className="w-5 h-5" style={{ color: selectedRole === role.id ? '#fff' : '#5a7dae' }}
                          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={role.icon} />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold mb-0.5 text-[#153c74]">{role.title}</p>
                        <p className="text-xs mb-2 text-[#4f71a5]">{role.desc}</p>
                        <div className="flex flex-wrap gap-1.5">
                          {role.features.slice(0, 3).map((f) => (
                            <span key={f} className="text-xs px-2 py-0.5 rounded-md"
                              style={{ background: '#edf4ff', color: '#5a7dae' }}>
                              {f}
                            </span>
                          ))}
                        </div>
                      </div>
                      {/* Radio indicator */}
                      <div className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 mt-0.5"
                        style={{ borderColor: selectedRole === role.id ? '#0b57d0' : '#b8cff6' }}>
                        {selectedRole === role.id && (
                          <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#0b57d0' }} />
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => selectedRole && setStep(2)}
                disabled={!selectedRole}
                className={`${primaryButtonClass} mt-6`}
              >
                Continue setup
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          ) : (
            /* Step 2: Details */
            <div className="animate-slide-up">
              <div className="flex items-center gap-2 mb-4">
                <button onClick={() => setStep(1)} className="p-1.5 rounded-lg transition-colors"
                  style={{ color: '#6f8fbe' }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h1 className="text-xl font-bold text-[#153c74]">Workspace details</h1>
                  <p className="text-xs text-[#4f71a5]">
                    Joining as {selectedRole === 'ca' ? 'Chartered Accountant' : 'Business Owner'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Full Name</label>
                    <input type="text" value={form.fullName} onChange={set('fullName')}
                      placeholder={selectedRole === 'ca' ? 'CA Rajesh Kumar' : 'Sharma Traders'}
                      className={inputClass} required />
                  </div>

                  <div>
                    <label className={labelClass}>Username</label>
                    <input type="text" value={form.username} onChange={set('username')}
                      placeholder={selectedRole === 'ca' ? 'rajesh_ca' : 'sharma_traders'}
                      className={inputClass} required autoComplete="username" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Email</label>
                    <input type="email" value={form.email} onChange={set('email')}
                      placeholder="you@example.com" className={inputClass} required autoComplete="email" />
                  </div>
                  <div>
                    <label className={labelClass}>Phone (optional)</label>
                    <input type="tel" value={form.phone} onChange={set('phone')}
                      placeholder="+91 98765 43210" className={inputClass} autoComplete="tel" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={form.password} onChange={set('password')}
                        placeholder="Min. 8 characters"
                        className={`${inputClass} pr-10`} required autoComplete="new-password"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        style={{ color: '#7d9ac5' }}  tabIndex={-1}>
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d={showPassword
                            ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M3 3l18 18"
                            : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                        </svg>
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className={labelClass}>Confirm Password</label>
                    <input type={showPassword ? 'text' : 'password'}
                      value={form.confirm} onChange={set('confirm')}
                      placeholder="Repeat password" className={inputClass} required autoComplete="new-password" />
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2.5 p-3.5 rounded-xl"
                    style={{ background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.15)' }}>
                    <svg className="w-4 h-4 shrink-0 text-[#d92d20]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="text-sm text-[#d92d20]">{error}</p>
                  </div>
                )}

                <button type="submit"
                  disabled={loading || !form.username || !form.password || !form.confirm || !form.fullName}
                  className={primaryButtonClass}>
                  {loading ? (
                    <>
                      <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                      </svg>
                      Creating account...
                    </>
                  ) : 'Create workspace'}
                </button>
              </form>
            </div>
          )}

          <p className="text-center text-sm mt-4 text-[#4f71a5]">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold transition-colors hover:underline text-[#0b57d0]">
              Sign in
            </Link>
          </p>
        </div>
      </div>

    </div>
  );
}
