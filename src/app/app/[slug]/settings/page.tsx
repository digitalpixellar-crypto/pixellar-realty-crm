import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatINR } from '@/components/ui/StatCard';
import { ROLE_LABELS } from '@/lib/auth/permissions';
import {
  Settings,
  Users,
  CreditCard,
  Building,
  Mail,
  Plus,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  UserCheck,
  RotateCw,
  ExternalLink,
  Clock,
  Send,
} from 'lucide-react';
import { revalidatePath } from 'next/cache';
import { sendEmail, generateInvitationHtml } from '@/lib/mail/resend';

interface SettingsPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ tab?: string }>;
}

async function handleUpdateCompanyProfile(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const name = formData.get('name') as string;
  const phone = formData.get('phone') as string;
  const address = formData.get('address') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const timezone = formData.get('timezone') as string;
  const currency = formData.get('currency') as string;
  const holdDuration = parseInt(formData.get('hold_duration_hours') as string, 10) || 48;
  const enableRoundRobin = formData.get('enable_round_robin') === 'on';

  db.updateCompany(company.id, {
    name,
    phone,
    address,
    city,
    state,
    timezone,
    currency,
    settings: {
      ...company.settings,
      hold_duration_hours: holdDuration,
      enable_round_robin: enableRoundRobin,
    },
  });

  revalidatePath(`/app/${companySlug}/settings`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

async function handleInviteMember(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const email = formData.get('email') as string;
  const role = formData.get('role') as any;

  try {
    const inv = db.createInvitation(company.id, 'mem-vikram-01', email, role);
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pixellarealty.com';
    const inviteUrl = `${appUrl}/invite/accept?token=${inv.token}`;
    const roleLabel = ROLE_LABELS[role as keyof typeof ROLE_LABELS] || role;

    await sendEmail({
      to: email,
      subject: `You've been invited to join ${company.name} on Pixellar Realty CRM`,
      html: generateInvitationHtml(email, company.name, roleLabel, 'Company Owner', inviteUrl),
      text: `Accept your invitation to join ${company.name}: ${inviteUrl}`,
    });

    revalidatePath(`/app/${companySlug}/settings`);
  } catch (err: any) {
    console.error('Invite error:', err);
  }
}

async function handleResendInvite(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const token = formData.get('invitation_token') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  try {
    const existing = db.getInvitationByToken(token);
    if (existing) {
      const refreshed = db.createInvitation(company.id, 'mem-vikram-01', existing.email, existing.role);
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://www.pixellarealty.com';
      const inviteUrl = `${appUrl}/invite/accept?token=${refreshed.token}`;
      const roleLabel = ROLE_LABELS[existing.role as keyof typeof ROLE_LABELS] || existing.role;

      await sendEmail({
        to: existing.email,
        subject: `[REMINDER] You've been invited to join ${company.name} on Pixellar Realty CRM`,
        html: generateInvitationHtml(existing.email, company.name, roleLabel, 'Company Owner', inviteUrl),
        text: `Accept your invitation to join ${company.name}: ${inviteUrl}`,
      });
    }

    revalidatePath(`/app/${companySlug}/settings`);
  } catch (err: any) {
    console.error('Resend error:', err);
  }
}

async function handleDeleteMember(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const memberId = formData.get('member_id') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  try {
    db.deleteMember(memberId, company.id);
    revalidatePath(`/app/${companySlug}/settings`);
  } catch (err: any) {
    console.error('Delete member error:', err);
  }
}

export default async function TenantSettingsPage({ params, searchParams }: SettingsPageProps) {
  const { slug } = await params;
  const { tab = 'company' } = await searchParams;

  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const members = db.getCompanyMembers(company.id);
  const plan = db.getSubscriptionPlans().find((p) => p.id === company.plan_id);
  const subscription = db.getCompanySubscription(company.id);
  const invoices = db.getSubscriptionInvoices(company.id);
  const invitations = db.getInvitations(company.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Workspace Settings</h1>
            <Badge variant="primary">{ROLE_LABELS[context.role]}</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Company branding, team hierarchy, security credentials, and SaaS subscription.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Company Profile & Policies */}
        <div className="lg:col-span-2 space-y-8">
          {/* Company Profile Form */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-base text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Building className="w-5 h-5 text-brand-600" />
              <span>Company Information & Localization</span>
            </h3>

            <form action={handleUpdateCompanyProfile} className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <input type="hidden" name="company_slug" value={slug} />

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Company Legal Name *
                </label>
                <input
                  type="text"
                  name="name"
                  required
                  defaultValue={company.name}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Official Phone
                </label>
                <input
                  type="text"
                  name="phone"
                  defaultValue={company.phone || ''}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Official Email
                </label>
                <input
                  type="email"
                  name="email"
                  disabled
                  defaultValue={company.email}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-slate-500 text-sm cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Operating Timezone
                </label>
                <select
                  name="timezone"
                  defaultValue={company.timezone}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  <option value="Asia/Kolkata">Asia/Kolkata (IST - UTC+5:30)</option>
                  <option value="Asia/Dubai">Asia/Dubai (GST - UTC+4:00)</option>
                  <option value="Asia/Singapore">Asia/Singapore (SGT - UTC+8:00)</option>
                  <option value="Europe/London">Europe/London (GMT - UTC+0:00)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Base Currency
                </label>
                <select
                  name="currency"
                  defaultValue={company.currency}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                >
                  <option value="INR">INR (Indian Rupee - ₹)</option>
                  <option value="AED">AED (UAE Dirham)</option>
                  <option value="USD">USD (US Dollar - $)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Unit Hold Expiration (Hours)
                </label>
                <input
                  type="number"
                  name="hold_duration_hours"
                  defaultValue={company.settings?.hold_duration_hours || 48}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 pt-5">
                <input
                  type="checkbox"
                  id="round_robin"
                  name="enable_round_robin"
                  defaultChecked={company.settings?.enable_round_robin}
                  className="rounded"
                />
                <label htmlFor="round_robin" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Auto Round-Robin Lead Assignment
                </label>
              </div>

              <div className="sm:col-span-2 flex justify-end pt-2">
                <button
                  type="submit"
                  className="px-6 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all"
                >
                  Save Profile Changes
                </button>
              </div>
            </form>
          </div>

          {/* Team Members List */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900">Workspace Team Members ({members.length})</h3>
                <p className="text-xs text-slate-500">
                  Seat Quota: {members.length} used of {plan?.max_users || 5} allowed
                </p>
              </div>

              <span className="text-xs font-semibold px-2.5 py-1 rounded bg-brand-50 text-brand-700 border border-brand-200">
                {plan?.name} Plan
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3.5">Employee Name</th>
                    <th className="px-6 py-3.5">Email</th>
                    <th className="px-6 py-3.5">Assigned Role</th>
                    <th className="px-6 py-3.5">Status</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {members.map((member) => (
                    <tr key={member.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900">{member.name}</div>
                        <div className="text-xs text-slate-400">{member.title || 'Staff'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-mono text-slate-600">{member.email}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                          {ROLE_LABELS[member.role]}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={member.is_active ? 'active' : 'suspended'} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {member.role === 'company_owner' ? (
                          <span className="text-xs text-slate-400 italic">Protected Owner</span>
                        ) : (
                          <form action={handleDeleteMember} className="inline">
                            <input type="hidden" name="company_slug" value={slug} />
                            <input type="hidden" name="member_id" value={member.id} />
                            <button
                              type="submit"
                              className="text-xs text-rose-600 hover:text-rose-800 font-semibold"
                            >
                              Remove
                            </button>
                          </form>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pending Invitations & Resend Mail */}
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span>Pending Invitations & Resend Mail ({invitations.filter((i) => i.status === 'pending').length})</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Invited staff awaiting acceptance. Resend invitation emails directly via Resend.
                </p>
              </div>
            </div>

            {invitations.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No invitations issued yet. Use the invite form to add staff.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-6 py-3.5">Invited Email</th>
                      <th className="px-6 py-3.5">Assigned Role</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Expires</th>
                      <th className="px-6 py-3.5 text-right">Email Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {invitations.map((inv) => {
                      const isExpired = new Date(inv.expires_at) < new Date();
                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 text-xs font-mono font-bold text-slate-900">{inv.email}</td>
                          <td className="px-6 py-4">
                            <span className="text-xs font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                              {ROLE_LABELS[inv.role]}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusBadge status={inv.status === 'pending' ? (isExpired ? 'expired' : 'trial') : 'active'} />
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-500">
                            {new Date(inv.expires_at).toLocaleDateString('en-IN')}
                          </td>
                          <td className="px-6 py-4 text-right space-x-2">
                            {inv.status === 'pending' && (
                              <form action={handleResendInvite} className="inline">
                                <input type="hidden" name="company_slug" value={slug} />
                                <input type="hidden" name="invitation_token" value={inv.token} />
                                <button
                                  type="submit"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100 px-2.5 py-1 rounded-md border border-sky-200 transition-colors"
                                >
                                  <RotateCw className="w-3 h-3" />
                                  <span>Resend Invite Email</span>
                                </button>
                              </form>
                            )}
                            <a
                              href={`/invite/accept?token=${inv.token}`}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-700 underline"
                              title="Direct acceptance link"
                            >
                              <span>Direct Link</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Invite Member & SaaS Billing */}
        <div className="space-y-6">
          {/* Invite Member Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <Mail className="w-4 h-4 text-brand-600" />
              <span>Invite Team Member</span>
            </h3>

            <form action={handleInviteMember} className="mt-4 space-y-3 text-xs">
              <input type="hidden" name="company_slug" value={slug} />

              <div>
                <label className="block font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Employee Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="agent@skylinedev.com"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-500 uppercase tracking-wider mb-1">
                  Assign CRM Role *
                </label>
                <select
                  name="role"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="sales_executive">Sales Executive / Agent</option>
                  <option value="sales_manager">Sales Manager</option>
                  <option value="telecaller">Telecaller</option>
                  <option value="company_admin">Company Admin</option>
                  <option value="accounts">Accounts & Finance</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
              </div>

              <button
                type="submit"
                className="w-full py-2 px-4 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs shadow-sm transition-all mt-2"
              >
                Send Expiring Invitation
              </button>
            </form>
          </div>

          {/* SaaS Subscription Info */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h3 className="font-bold text-sm text-slate-900 pb-3 border-b border-slate-100 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-600" />
              <span>SaaS Subscription & Billing</span>
            </h3>

            <div className="mt-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Active Tier:</span>
                <span className="font-bold text-slate-900">{plan?.name} Plan</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Subscription Fee:</span>
                <span className="font-semibold text-slate-800">
                  ₹{plan?.monthly_price_inr.toLocaleString('en-IN')}/mo
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Payment Gateway:</span>
                <span className="font-semibold text-slate-800">Razorpay Subscriptions</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500">Status:</span>
                <StatusBadge status={subscription?.status || company.status} />
              </div>

              <div className="pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => alert('Razorpay Test Mode Checkout would open here in live browser.')}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 font-semibold text-xs text-slate-700 transition-colors text-center"
                >
                  Upgrade Subscription Plan
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
