import React from 'react';
import { db } from '@/lib/db';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import { Building, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface AcceptInviteProps {
  searchParams: Promise<{ token?: string; error?: string }>;
}

async function handleAcceptInvite(formData: FormData) {
  'use server';
  const token = formData.get('token') as string;
  const fullName = formData.get('full_name') as string;

  try {
    const member = db.acceptInvitation(token, fullName, `usr-${Date.now()}`);
    const company = db.getCompany(member.company_id);
    if (company) {
      redirect(`/app/${company.slug}/dashboard`);
    }
  } catch (err: any) {
    redirect(`/invite/accept?token=${token}&error=${encodeURIComponent(err.message)}`);
  }
}

export default async function AcceptInvitePage({ searchParams }: AcceptInviteProps) {
  const { token, error } = await searchParams;

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 text-center space-y-4">
          <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
          <h2 className="text-lg font-bold text-white">Missing Invitation Token</h2>
          <p className="text-xs text-slate-400">
            Please use the exact invitation link sent to your work email address.
          </p>
          <Link href="/" className="inline-block text-xs text-brand-400 hover:underline">
            ← Return to Homepage
          </Link>
        </div>
      </div>
    );
  }

  const invitation = db.getInvitationByToken(token);
  const company = invitation ? db.getCompany(invitation.company_id) : null;

  const isExpired = invitation && new Date(invitation.expires_at) < new Date();
  const isInvalid = !invitation || invitation.status !== 'pending' || isExpired;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-6 text-slate-100">
      <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6 shadow-2xl">
        <div className="text-center">
          <div className="inline-flex h-12 w-12 rounded-xl bg-brand-600 items-center justify-center text-white shadow-lg shadow-brand-600/30 mb-3">
            <Building className="w-6 h-6" />
          </div>
          <h1 className="text-xl font-bold text-white">Team Invitation</h1>
          <p className="text-xs text-slate-400 mt-1">PIXELLAR REALTY CRM</p>
        </div>

        {isInvalid ? (
          <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/60 text-center space-y-2">
            <AlertCircle className="w-6 h-6 text-rose-400 mx-auto" />
            <h3 className="text-sm font-bold text-rose-300">Invitation Unavailable</h3>
            <p className="text-xs text-rose-400/80">
              {error || (invitation?.status === 'accepted' ? 'This invitation has already been accepted.' : 'This invitation has expired or been revoked.')}
            </p>
          </div>
        ) : (
          <form action={handleAcceptInvite} className="space-y-4">
            <input type="hidden" name="token" value={token} />

            <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1">
              <div>
                <span className="text-slate-500 font-medium">Invited To:</span>{' '}
                <strong className="text-white">{company?.name}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Assigned Role:</span>{' '}
                <strong className="text-brand-400">{ROLE_LABELS[invitation.role]}</strong>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Invited Email:</span>{' '}
                <strong className="text-slate-300">{invitation.email}</strong>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                Your Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                required
                placeholder="e.g. Rohith Sharma"
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-brand-500"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 px-4 rounded-lg bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-md shadow-brand-600/30 transition-all flex items-center justify-center gap-2"
            >
              <span>Accept Invitation & Enter Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
