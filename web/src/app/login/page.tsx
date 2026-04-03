'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import BrandLogoLink from '@/components/BrandLogoLink';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const inputClass = 'w-full rounded-xl border border-[#d3e3ff] bg-white px-3.5 py-2.5 text-sm text-[#143a73] placeholder:text-[#89a4ca] transition focus:outline-none focus:border-[#0b57d0] focus:ring-4 focus:ring-[#e3efff]';
  const labelClass = 'block text-xs font-medium mb-1.5 text-[#5a7dae]';
  const primaryButtonClass = 'inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#0b57d0] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#0846ab] disabled:cursor-not-allowed disabled:opacity-50';

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const loggedInUser = await login(username, password);
      const requiresSubscription = Boolean(loggedInUser.subscription?.required);
      const hasActiveSubscription = loggedInUser.subscription?.status === 'active';
      const isBusinessUser = loggedInUser.role === 'staff';

      if (isBusinessUser && requiresSubscription && !hasActiveSubscription) {
        router.push('/subscribe');
        return;
      }

      router.push(isBusinessUser ? '/dashboard' : '/command-center');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen overflow-hidden flex bg-[#f5f9ff] text-[#0f2347]">
      {/* Left Panel — Brand */}
      <div className="hidden lg:flex lg:w-[45%] relative overflow-hidden flex-col justify-between p-10"
        style={{ background: 'linear-gradient(135deg, #0b57d0 0%, #0e7ef0 100%)' }}>

        {/* Background decoration */}
        <div className="absolute inset-0 opacity-[0.12]"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #dce8ff 1px, transparent 0)', backgroundSize: '48px 48px' }} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(214,231,255,0.25) 0%, transparent 70%)' }} />
        <div className="absolute -bottom-20 -left-20 w-[300px] h-[300px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(214,231,255,0.18) 0%, transparent 70%)' }} />

        <div className="relative z-10">
          <div className="mb-2 relative inline-flex items-center px-3 py-0">
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

        <div className="relative z-10 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white leading-tight mb-3">
              The Intelligent
              <br />
              <span className="text-[#dcecff]">Business & CA Workspace</span>
            </h2>
            <p className="text-base leading-relaxed text-[#e1eeff]">
              Manage clients, services, payments, documents, and deadlines for both CA firms and businesses in one platform.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['CA Workflows', 'Business Reconciliation', 'Health Scores', 'GST Ready'].map((f) => (
              <span key={f} className="px-3 py-1.5 rounded-lg text-xs font-medium"
                style={{ background: 'rgba(232,240,255,0.95)', color: '#0b57d0', border: '1px solid #c8dcff' }}>
                {f}
              </span>
            ))}
          </div>

          {/* Social proof */}
          <div className="flex items-center gap-3 pt-4" style={{ borderTop: '1px solid rgba(206,225,255,0.6)' }}>
            <div className="flex -space-x-2">
              {['RK', 'SP', 'AM'].map((initials, i) => (
                <div key={i} className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white border-2"
                  style={{
                    background: i === 0 ? '#0b57d0' : i === 1 ? '#1f6dde' : '#3a89ee',
                    borderColor: '#ffffff',
                  }}>
                  {initials}
                </div>
              ))}
            </div>
            <p className="text-xs text-[#e1eeff]">
              Trusted by CA firms and businesses across India
            </p>
          </div>
        </div>

        <p className="relative z-10 text-xs text-[#d8e8ff]">
          © {new Date().getFullYear()} Rekono — Business Reconciliation & CA Intelligence
        </p>
      </div>

      {/* Right Panel — Form */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 sm:p-8">
        <div className="w-full max-w-md animate-fade-in rounded-3xl border border-[#d0e1ff] bg-white p-6">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6">
            <BrandLogoLink logoClassName="h-12 w-auto" />
          </div>

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#0b57d0] hover:underline mb-3"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to home
          </Link>

          <h1 className="text-2xl font-bold mb-1 text-[#153c74]">Welcome back</h1>
          <p className="text-sm mb-6 text-[#4f71a5]">
            Sign in to your workspace
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username */}
            <div>
              <label htmlFor="login-username" className={labelClass}>Username</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#7d9ac5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <input
                  id="login-username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className={`${inputClass} pl-10`}
                  required
                  autoComplete="username"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="login-password" className={labelClass}>Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <svg className="w-4 h-4 text-[#7d9ac5]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className={`${inputClass} pl-10 pr-10`}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center transition-colors"
                  style={{ color: '#7d9ac5' }}
                  tabIndex={-1}
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={showPassword
                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"} />
                  </svg>
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2.5 p-3.5 rounded-xl"
                style={{ background: 'rgba(255,180,171,0.08)', border: '1px solid rgba(255,180,171,0.15)' }}>
                <svg className="w-4 h-4 shrink-0 text-[#d92d20]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-sm text-[#d92d20]">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !username || !password}
              className={primaryButtonClass}
            >
              {loading ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          <p className="text-center text-sm mt-5 text-[#4f71a5]">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold transition-colors hover:underline text-[#0b57d0]">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
