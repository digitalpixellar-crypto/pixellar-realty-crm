import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatINR } from '@/components/ui/StatCard';
import {
  Handshake,
  Plus,
  CheckCircle2,
  PhoneCall,
  Mail,
  FileText,
  DollarSign,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

interface ChannelPartnersPageProps {
  params: Promise<{ slug: string }>;
}

async function handleAddPartner(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const name = formData.get('name') as string;
  const companyName = formData.get('company_name') as string;
  const reraReg = formData.get('rera_registration_number') as string;
  const phone = formData.get('phone') as string;
  const email = formData.get('email') as string;
  const commissionType = formData.get('commission_type') as any || 'percentage';
  const defaultRate = parseFloat(formData.get('default_commission_rate') as string) || 2.0;

  db.createChannelPartner(company.id, {
    name,
    company_name: companyName,
    rera_registration_number: reraReg,
    phone,
    email: email || undefined,
    commission_type: commissionType,
    default_commission_rate: defaultRate,
    status: 'active',
  });

  revalidatePath(`/app/${companySlug}/channel-partners`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

async function handleApproveCommission(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const commId = formData.get('commission_id') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.approveCommission(company.id, commId, 'mem-vikram-01');
  revalidatePath(`/app/${companySlug}/channel-partners`);
}

async function handlePayCommission(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const commId = formData.get('commission_id') as string;
  const ref = formData.get('payment_reference') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.payCommission(company.id, commId, ref || `NEFT-${Date.now()}`);
  revalidatePath(`/app/${companySlug}/channel-partners`);
}

export default async function TenantChannelPartnersPage({ params }: ChannelPartnersPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const partners = db.getChannelPartners(company.id);
  const commissions = db.getCommissions(company.id);
  const bookings = db.getBookings(company.id);

  const totalCommissionsPaid = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + c.total_commission_amount, 0);

  const pendingCommissions = commissions
    .filter((c) => c.status === 'pending' || c.status === 'approved')
    .reduce((sum, c) => sum + c.total_commission_amount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Channel Partners & Brokers</h1>
            <Badge variant="primary">{partners.length} Partners</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Broker network management, snapshotted commission rules, and settlement ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Commissions Paid</span>
            <span className="text-lg font-bold text-slate-900">{formatINR(totalCommissionsPaid)}</span>
          </div>
          <a
            href="#add-partner-form"
            className="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            + Register Broker
          </a>
        </div>
      </div>

      {/* Historical Rule Protection Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Historical Commission Rule Integrity Guaranteed</h4>
            <p className="text-xs text-slate-500">
              When a booking is confirmed, the partner&apos;s active commission rate is snapshotted into the commission ledger. Future broker rule changes will never modify past transactions.
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <span className="text-slate-500 block">Pending Payouts</span>
          <span className="font-bold text-amber-700">{formatINR(pendingCommissions)}</span>
        </div>
      </div>

      {/* Partners Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Registered Brokers & Channel Partners</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Broker / Partner</th>
                <th className="px-6 py-3.5">Agency / LLP</th>
                <th className="px-6 py-3.5">RERA Reg #</th>
                <th className="px-6 py-3.5">Phone & Email</th>
                <th className="px-6 py-3.5">Commission Rate</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {partners.map((partner) => (
                <tr key={partner.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{partner.name}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-700">
                    {partner.company_name || 'Independent'}
                  </td>
                  <td className="px-6 py-4 font-mono text-xs text-slate-500">
                    {partner.rera_registration_number || 'N/A'}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono">
                    <a href={`tel:${partner.phone}`} className="text-brand-600 hover:underline">
                      {partner.phone}
                    </a>
                    {partner.email && <div className="text-slate-400 mt-0.5">{partner.email}</div>}
                  </td>
                  <td className="px-6 py-4 text-xs font-bold text-indigo-700">
                    {partner.default_commission_rate}% {partner.commission_type}
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={partner.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Commissions Ledger */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Commission Settlement Ledger ({commissions.length})</h3>
          <p className="text-xs text-slate-500">Approved broker incentives tied to property booking sales</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Partner</th>
                <th className="px-6 py-3.5">Booking #</th>
                <th className="px-6 py-3.5">Applied Rate (Snapshot)</th>
                <th className="px-6 py-3.5">Total Amount (INR)</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                    No commissions triggered yet.
                  </td>
                </tr>
              ) : (
                commissions.map((comm) => {
                  const partner = partners.find((p) => p.id === comm.channel_partner_id);
                  const booking = bookings.find((b) => b.id === comm.booking_id);

                  return (
                    <tr key={comm.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">{partner?.name}</td>
                      <td className="px-6 py-4 font-mono text-xs font-semibold text-brand-600">
                        {booking?.booking_number}
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-700">
                        {comm.applied_rate}% {comm.commission_type}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatINR(comm.total_commission_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={comm.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {comm.status === 'pending' && (
                          <form action={handleApproveCommission} className="inline">
                            <input type="hidden" name="company_slug" value={slug} />
                            <input type="hidden" name="commission_id" value={comm.id} />
                            <button
                              type="submit"
                              className="px-3 py-1 text-xs font-semibold bg-brand-600 hover:bg-brand-700 text-white rounded-lg shadow-sm"
                            >
                              Approve
                            </button>
                          </form>
                        )}
                        {comm.status === 'approved' && (
                          <form action={handlePayCommission} className="inline-flex items-center gap-1.5">
                            <input type="hidden" name="company_slug" value={slug} />
                            <input type="hidden" name="commission_id" value={comm.id} />
                            <input
                              type="text"
                              name="payment_reference"
                              placeholder="NEFT UTR..."
                              required
                              className="px-2 py-1 text-xs border border-slate-200 rounded w-28"
                            />
                            <button
                              type="submit"
                              className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm"
                            >
                              Mark Paid
                            </button>
                          </form>
                        )}
                        {comm.status === 'paid' && (
                          <span className="text-xs text-slate-400 font-mono">
                            Ref: {comm.payment_reference || 'Cleared'}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Partner Form */}
      <div id="add-partner-form" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-600" />
          <span>Register New Channel Partner / Broker</span>
        </h3>

        <form action={handleAddPartner} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <input type="hidden" name="company_slug" value={slug} />

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Broker Full Name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Girish Chandra"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Agency / Company Name
            </label>
            <input
              type="text"
              name="company_name"
              placeholder="e.g. Synergy Realty Advisory LLP"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              RERA Agent Registration #
            </label>
            <input
              type="text"
              name="rera_registration_number"
              placeholder="e.g. A02400001928"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Phone Number *
            </label>
            <input
              type="text"
              name="phone"
              required
              placeholder="+91 99000 88776"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Email</label>
            <input
              type="email"
              name="email"
              placeholder="broker@synergyrealty.in"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Default Commission Rate (%) *
            </label>
            <input
              type="number"
              name="default_commission_rate"
              required
              defaultValue={2.0}
              step="0.1"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Save Channel Partner
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
