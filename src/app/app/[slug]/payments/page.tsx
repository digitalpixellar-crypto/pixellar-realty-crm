import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatINR } from '@/components/ui/StatCard';
import {
  CreditCard,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building2,
  DollarSign,
  Receipt,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

interface PaymentsPageProps {
  params: Promise<{ slug: string }>;
}

async function handleRecordPayment(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const bookingId = formData.get('booking_id') as string;
  const amount = parseFloat(formData.get('amount') as string);
  const paymentMode = formData.get('payment_mode') as any;
  const transactionRef = formData.get('transaction_reference') as string;
  const bankName = formData.get('bank_name') as string;
  const paymentDate = formData.get('payment_date') as string;
  const notes = formData.get('notes') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  const booking = db.getBooking(company.id, bookingId);
  if (!booking) return;

  db.recordCustomerPayment(company.id, {
    booking_id: booking.id,
    customer_id: booking.customer_id,
    amount,
    payment_mode: paymentMode,
    transaction_reference: transactionRef,
    bank_name: bankName,
    payment_date: paymentDate || new Date().toISOString().split('T')[0],
    notes,
    recorded_by_member_id: 'mem-arjun-04',
  });

  revalidatePath(`/app/${companySlug}/payments`);
  revalidatePath(`/app/${companySlug}/bookings`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

async function handleReconcilePayment(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const paymentId = formData.get('payment_id') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  db.reconcileCustomerPayment(company.id, paymentId, 'mem-karthik-06');

  revalidatePath(`/app/${companySlug}/payments`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

export default async function TenantPaymentsPage({ params }: PaymentsPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const payments = db.getCustomerPayments(company.id);
  const bookings = db.getBookings(company.id);
  const customers = db.getCustomers(company.id);

  const totalCollected = payments
    .filter((p) => p.status === 'reconciled')
    .reduce((sum, p) => sum + p.amount, 0);

  const pendingReconciliation = payments
    .filter((p) => p.status === 'recorded')
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Customer Collections Ledger</h1>
            <Badge variant="success">Property Accounting</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Reconciliation workflow for home buyer payments (NEFT/RTGS, Cheque, UPI, Bank Transfer).
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Reconciled Collections</span>
            <span className="text-lg font-bold text-emerald-700">{formatINR(totalCollected)}</span>
          </div>
          <a
            href="#record-payment-form"
            className="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            + Record Payment
          </a>
        </div>
      </div>

      {/* Financial Boundary Alert */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-600">
            <Receipt className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Separate Property Sales Accounting</h4>
            <p className="text-xs text-slate-500">
              Customer payments recorded here represent property buyer purchase transactions directly deposited into {company.name}&apos;s escrow accounts.
              These are strictly separated from SaaS platform subscription billing.
            </p>
          </div>
        </div>
        <div className="text-right text-xs">
          <span className="text-slate-500 block">Unreconciled Pending</span>
          <span className="font-bold text-amber-700">{formatINR(pendingReconciliation)}</span>
        </div>
      </div>

      {/* Payments Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-bold text-slate-900">Payment Transactions ({payments.length})</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Receipt #</th>
                <th className="px-6 py-3.5">Buyer</th>
                <th className="px-6 py-3.5">Amount (INR)</th>
                <th className="px-6 py-3.5">Mode</th>
                <th className="px-6 py-3.5">UTR / Bank Ref</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Reconciliation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No customer payment records logged yet.
                  </td>
                </tr>
              ) : (
                payments.map((pmt) => {
                  const customer = customers.find((c) => c.id === pmt.customer_id);

                  return (
                    <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-slate-900">
                        {pmt.payment_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {customer ? `${customer.first_name} ${customer.last_name || ''}` : 'Customer'}
                        </div>
                        {pmt.notes && <div className="text-xs text-slate-500 truncate max-w-xs">{pmt.notes}</div>}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatINR(pmt.amount)}
                      </td>
                      <td className="px-6 py-4 uppercase text-xs font-semibold text-slate-600">
                        {pmt.payment_mode.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">
                        {pmt.transaction_reference || 'N/A'}
                        {pmt.bank_name && <div className="text-[11px] text-slate-400">{pmt.bank_name}</div>}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-600">
                        {pmt.payment_date}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={pmt.status} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        {pmt.status === 'recorded' ? (
                          <form action={handleReconcilePayment}>
                            <input type="hidden" name="company_slug" value={slug} />
                            <input type="hidden" name="payment_id" value={pmt.id} />
                            <button
                              type="submit"
                              className="px-3 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm transition-colors"
                            >
                              Verify & Reconcile
                            </button>
                          </form>
                        ) : (
                          <span className="text-xs font-medium text-emerald-700 flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Reconciled</span>
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

      {/* Record Payment Form */}
      <div id="record-payment-form" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-600" />
          <span>Record Customer Property Payment</span>
        </h3>

        <form action={handleRecordPayment} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <input type="hidden" name="company_slug" value={slug} />

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Booking *
            </label>
            <select
              name="booking_id"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {bookings.map((b) => {
                const cust = customers.find((c) => c.id === b.customer_id);
                return (
                  <option key={b.id} value={b.id}>
                    {b.booking_number} - {cust?.first_name} {cust?.last_name || ''} ({formatINR(b.net_sale_amount)})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Amount Received (₹) *
            </label>
            <input
              type="number"
              name="amount"
              required
              placeholder="e.g. 1300000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Payment Mode *
            </label>
            <select
              name="payment_mode"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="neft_rtgs">NEFT / RTGS Wire</option>
              <option value="upi">UPI Transfer</option>
              <option value="cheque">Cheque / Demand Draft</option>
              <option value="bank_transfer">Direct Bank Transfer</option>
              <option value="cash">Cash (Compliant Limits)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              UTR / Transaction Reference *
            </label>
            <input
              type="text"
              name="transaction_reference"
              required
              placeholder="e.g. HDFC9081290391"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Bank Name
            </label>
            <input
              type="text"
              name="bank_name"
              placeholder="e.g. ICICI Bank Ltd"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Payment Date
            </label>
            <input
              type="date"
              name="payment_date"
              defaultValue={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Reconciliation Notes
            </label>
            <textarea
              name="notes"
              rows={2}
              placeholder="e.g. Agreement milestone payment cleared in corporate bank account"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Record Payment Receipt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
