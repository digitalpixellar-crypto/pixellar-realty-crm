import React from 'react';
import Link from 'next/link';
import { Building, ShieldCheck, ArrowRight, UserCheck } from 'lucide-react';
import { db } from '@/lib/db';

export default function LoginPage() {
  const companies = db.getCompanies();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 items-center justify-center text-white shadow-lg shadow-brand-500/30 mb-4">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">PIXELLAR REALTY CRM</h1>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-semibold">
            Universal Tenant & Platform Portal
          </p>
        </div>

        {/* Demo Fast-Login Personas Box */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <UserCheck className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold text-white">Select Workspace Persona to Sign In:</h2>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/app/skyline-developers/dashboard"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-brand-500 transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-white block group-hover:text-brand-400">
                  Vikram Malhotra (Company Owner)
                </span>
                <span className="text-xs text-slate-400">Skyline Developers & Builders</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
            </Link>

            <Link
              href="/app/skyline-developers/dashboard"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-brand-500 transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-white block group-hover:text-brand-400">
                  Arjun Reddy (Sales Agent)
                </span>
                <span className="text-xs text-slate-400">Skyline Developers & Builders</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
            </Link>

            <Link
              href="/app/greenfield-estates/dashboard"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-slate-950 border border-slate-800 hover:border-brand-500 transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-white block group-hover:text-brand-400">
                  Ananya Sharma (Company Owner)
                </span>
                <span className="text-xs text-slate-400">Greenfield Estates (Tenant B)</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400" />
            </Link>

            <Link
              href="/platform/dashboard"
              className="w-full flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/30 hover:bg-amber-500/20 transition-colors group"
            >
              <div>
                <span className="font-bold text-sm text-amber-300 block">
                  K. Yeswanth Kumar Reddy (Platform Superadmin)
                </span>
                <span className="text-xs text-amber-400/80">Digital Pixellar Platform Owner</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </Link>
          </div>

          <div className="pt-3 border-t border-slate-800 text-center">
            <Link href="/" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Return to Home Page
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
