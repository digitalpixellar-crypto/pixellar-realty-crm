'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Building2,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  UserCheck,
  Sparkles,
  KeyRound,
  Send,
  RotateCw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Eye,
  EyeOff,
} from 'lucide-react';
import Link from 'next/link';

interface LoginFormProps {
  initialEmail?: string;
  initialMessage?: string;
}

export function LoginForm({ initialEmail = '', initialMessage }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState<'password' | 'magic' | 'personas'>('password');
  const [email, setEmail] = useState(initialEmail || searchParams?.get('email') || '');
  const [password, setPassword] = useState('PixellarAdmin2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(initialMessage || null);

  // Magic link states
  const [magicEmail, setMagicEmail] = useState(email || 'digitalpixellar@gmail.com');
  const [magicSent, setMagicSent] = useState(false);
  const [magicCooldown, setMagicCooldown] = useState(0);
  const [directMagicUrl, setDirectMagicUrl] = useState<string | null>(null);

  // Countdown timer for resend
  useEffect(() => {
    if (magicCooldown <= 0) return;
    const timer = setInterval(() => setMagicCooldown((c) => c - 1), 1000);
    return () => clearInterval(timer);
  }, [magicCooldown]);

  // Handle auto-login if magic link URL visited
  useEffect(() => {
    const autoLogin = searchParams?.get('auto_login');
    const paramEmail = searchParams?.get('email');
    const dest = searchParams?.get('dest');

    if (autoLogin === 'true' && paramEmail) {
      handleDirectSignIn(paramEmail, dest || undefined);
    }
  }, [searchParams]);

  // Direct Sign In
  const handleDirectSignIn = async (loginEmail: string, explicitDest?: string) => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: loginEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Authentication failed');
      }

      setSuccessMessage('Authentication successful! Redirecting...');
      const targetUrl = explicitDest || data.redirectUrl || '/platform/dashboard';
      setTimeout(() => {
        router.push(targetUrl);
        router.refresh();
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Login failed. Please try again.');
      setIsLoading(false);
    }
  };

  // Submit Password Login
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setErrorMessage('Please enter your email address.');
      return;
    }
    await handleDirectSignIn(email);
  };

  // Submit Magic Link / Resend Mail
  const handleSendMagicLink = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!magicEmail) {
      setErrorMessage('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/auth/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: magicEmail }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to send login link');
      }

      setMagicSent(true);
      setMagicCooldown(60);
      setDirectMagicUrl(data.directLoginUrl);
      setSuccessMessage(`Login link sent to ${magicEmail}!`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error occurred while sending login link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md space-y-6">
      {/* Brand Header */}
      <div className="text-center">
        <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-600 items-center justify-center text-white shadow-xl shadow-sky-500/25 mb-4 border border-sky-400/30">
          <Building2 className="w-7 h-7" />
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight">PIXELLAR REALTY CRM</h1>
        <p className="text-xs font-semibold text-slate-400 mt-1 uppercase tracking-wider">
          Enterprise Multi-Tenant Real Estate SaaS
        </p>
      </div>

      {/* Main Form Box */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/90 backdrop-blur-xl p-6 shadow-2xl space-y-5">
        {/* Navigation Tabs */}
        <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            type="button"
            onClick={() => { setActiveTab('password'); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'password'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('magic'); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'magic'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>Magic Link</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('personas'); setErrorMessage(null); }}
            className={`py-2 px-2.5 rounded-lg font-bold transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'personas'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Personas</span>
          </button>
        </div>

        {/* Alerts */}
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-950/60 border border-emerald-800/80 text-emerald-300 text-xs flex items-start gap-2.5 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* TAB 1: EMAIL & PASSWORD SIGN-IN */}
        {activeTab === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="digitalpixellar@gmail.com"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-slate-300 font-bold uppercase tracking-wider">
                  Password
                </label>
                <button
                  type="button"
                  onClick={() => setActiveTab('magic')}
                  className="text-sky-400 hover:underline text-[11px]"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-10 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-4 h-4 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        )}

        {/* TAB 2: PASSWORDLESS MAGIC LINK & RESEND MAIL */}
        {activeTab === 'magic' && (
          <div className="space-y-4 text-xs">
            {!magicSent ? (
              <form onSubmit={handleSendMagicLink} className="space-y-4">
                <p className="text-slate-400 leading-relaxed">
                  Enter your email address and we will dispatch a secure 1-click sign-in link directly to your inbox via Resend.
                </p>

                <div>
                  <label className="block text-slate-300 font-bold uppercase tracking-wider mb-1.5">
                    Your Registered Email
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                    <input
                      type="email"
                      required
                      value={magicEmail}
                      onChange={(e) => setMagicEmail(e.target.value)}
                      placeholder="digitalpixellar@gmail.com"
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500 text-sm"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-sm shadow-lg shadow-sky-600/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isLoading ? (
                    <>
                      <RotateCw className="w-4 h-4 animate-spin" />
                      <span>Sending Email via Resend...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>Send Magic Link Email</span>
                    </>
                  )}
                </button>
              </form>
            ) : (
              <div className="space-y-4 animate-fadeIn">
                <div className="p-4 rounded-xl bg-sky-950/40 border border-sky-800/60 text-center space-y-2">
                  <div className="w-10 h-10 rounded-full bg-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
                    <Mail className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-sm text-white">Check Your Inbox</h4>
                  <p className="text-slate-300 text-xs">
                    We sent a secure sign-in link to <strong className="text-sky-400">{magicEmail}</strong>.
                  </p>
                </div>

                {/* Resend Email Button */}
                <div className="flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => handleSendMagicLink()}
                    disabled={magicCooldown > 0 || isLoading}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>
                      {magicCooldown > 0
                        ? `Resend Email in ${magicCooldown}s`
                        : 'Resend Verification Email'}
                    </span>
                  </button>

                  {/* Direct Login Shortcut */}
                  {directMagicUrl && (
                    <a
                      href={directMagicUrl}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition-colors flex items-center justify-center gap-1.5 shadow-sm text-center"
                    >
                      <span>Open Magic Link Instantly (1-Click)</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </a>
                  )}

                  <button
                    type="button"
                    onClick={() => { setMagicSent(false); setDirectMagicUrl(null); }}
                    className="text-slate-500 hover:text-slate-400 text-xs text-center pt-1"
                  >
                    ← Use a different email
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: 1-CLICK DEMO PERSONAS */}
        {activeTab === 'personas' && (
          <div className="space-y-2.5 text-xs">
            <p className="text-slate-400 text-[11px] pb-1">
              Select any verified platform role to test multi-tenant isolation and permissions:
            </p>

            {/* Platform Superadmin */}
            <button
              type="button"
              onClick={() => handleDirectSignIn('digitalpixellar@gmail.com')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 text-left transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-amber-300 block">
                  K. Yeswanth Kumar Reddy
                </span>
                <span className="text-xs text-amber-400/80">
                  Platform Owner • digitalpixellar@gmail.com
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Skyline Developers Owner */}
            <button
              type="button"
              onClick={() => handleDirectSignIn('vikram@skylinedev.com')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 text-left transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-white block group-hover:text-sky-400">
                  Vikram Malhotra
                </span>
                <span className="text-xs text-slate-400">
                  Skyline Developers (Company Owner)
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Skyline Sales Agent */}
            <button
              type="button"
              onClick={() => handleDirectSignIn('arjun@skylinedev.com')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 text-left transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-white block group-hover:text-sky-400">
                  Arjun Reddy
                </span>
                <span className="text-xs text-slate-400">
                  Skyline Developers (Senior Property Consultant)
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
            </button>

            {/* Greenfield Estates Owner */}
            <button
              type="button"
              onClick={() => handleDirectSignIn('ananya@greenfield.in')}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500 text-left transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-white block group-hover:text-sky-400">
                  Ananya Sharma
                </span>
                <span className="text-xs text-slate-400">
                  Greenfield Estates (Tenant B Founder)
                </span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-sky-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>
        )}

        {/* Footer info */}
        <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="hover:text-white transition-colors">
            ← Back to Homepage
          </Link>
          <span className="text-[11px] font-mono">Digital Pixellar SaaS</span>
        </div>
      </div>
    </div>
  );
}
