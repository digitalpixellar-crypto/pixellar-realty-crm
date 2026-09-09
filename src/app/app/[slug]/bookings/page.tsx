import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatINR } from '@/components/ui/StatCard';
import {
  FileCheck2,
  Lock,
  DollarSign,
  Calendar,
  Building2,
  User,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

interface BookingsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function TenantBookingsPage({ params }: BookingsPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const bookings = db.getBookings(company.id);
  const customers = db.getCustomers(company.id);
  const units = db.getUnits(company.id);
  const projects = db.getProjects(company.id);
  const channelPartners = db.getChannelPartners(company.id);

  const totalSalesValue = bookings
    .filter((b) => b.status === 'confirmed')
    .reduce((sum, b) => sum + b.net_sale_amount, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property Bookings & Sales</h1>
            <Badge variant="success">{bookings.length} Bookings</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Confirmed unit allocations, approved pricing, and construction milestone schedules.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-xs text-slate-500 block">Total Net Sales Value</span>
            <span className="text-lg font-bold text-slate-900">{formatINR(totalSalesValue)}</span>
          </div>
          <Link
            href={`/app/${slug}/inventory`}
            className="px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            + Book Unit from Inventory
          </Link>
        </div>
      </div>

      {/* Bookings Table */}
      <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="font-bold text-slate-900">Confirmed Booking Contracts</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-6 py-3.5">Booking #</th>
                <th className="px-6 py-3.5">Buyer / Customer</th>
                <th className="px-6 py-3.5">Unit / Plot</th>
                <th className="px-6 py-3.5">Quoted Base</th>
                <th className="px-6 py-3.5">Discount</th>
                <th className="px-6 py-3.5">Net Sale (INR)</th>
                <th className="px-6 py-3.5">Booking Token</th>
                <th className="px-6 py-3.5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-500">
                    No bookings recorded yet.
                  </td>
                </tr>
              ) : (
                bookings.map((booking) => {
                  const customer = customers.find((c) => c.id === booking.customer_id);
                  const unit = units.find((u) => u.id === booking.unit_id);
                  const project = projects.find((p) => p.id === booking.project_id);
                  const cp = channelPartners.find((c) => c.id === booking.channel_partner_id);
                  const schedules = db.getPaymentSchedules(company.id, booking.id);

                  return (
                    <tr key={booking.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-xs text-brand-600">
                        {booking.booking_number}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900">
                          {customer ? `${customer.first_name} ${customer.last_name || ''}` : 'Customer'}
                        </div>
                        {customer && <div className="text-xs text-slate-500 font-mono">{customer.phone}</div>}
                        {cp && <div className="text-[11px] text-amber-700 mt-0.5">Via {cp.name}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono font-bold text-slate-900">{unit?.unit_number || 'Unit'}</div>
                        <div className="text-xs text-slate-500">{project?.name}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-medium text-slate-600">
                        {formatINR(booking.base_quoted_amount)}
                      </td>
                      <td className="px-6 py-4 text-xs text-rose-600 font-medium">
                        {booking.discount_amount > 0 ? `- ${formatINR(booking.discount_amount)}` : '₹0'}
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-900">
                        {formatINR(booking.net_sale_amount)}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-emerald-700">
                        {formatINR(booking.booking_amount)}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={booking.status} />
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Payment Schedules Breakdown */}
      {bookings.length > 0 && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h3 className="font-bold text-base text-slate-900 mb-2">Milestone Payment Schedules</h3>
          <p className="text-xs text-slate-500 mb-6">Installment breakdown and outstanding balances</p>

          <div className="space-y-6">
            {bookings.map((booking) => {
              const schedules = db.getPaymentSchedules(company.id, booking.id);
              const unit = units.find((u) => u.id === booking.unit_id);
              const customer = customers.find((c) => c.id === booking.customer_id);

              return (
                <div key={`sched-block-${booking.id}`} className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div>
                      <span className="font-mono font-bold text-sm text-slate-900">{booking.booking_number}</span>
                      <span className="text-xs text-slate-500 ml-2">
                        {unit?.unit_number} • Buyer: {customer?.first_name} {customer?.last_name || ''}
                      </span>
                    </div>
                    <span className="text-xs font-bold text-slate-700">
                      Total Sale: {formatINR(booking.net_sale_amount)}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {schedules.map((sched) => (
                      <div
                        key={sched.id}
                        className="p-3 bg-white rounded-lg border border-slate-200 flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-800 truncate">{sched.milestone_name}</span>
                            <span className="text-[10px] font-bold text-slate-500">{sched.percentage}%</span>
                          </div>
                          <div className="text-sm font-bold text-slate-900 mt-2">{formatINR(sched.amount)}</div>
                          <div className="text-[11px] text-slate-500 mt-0.5">Due: {sched.due_date}</div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <StatusBadge status={sched.status} />
                          <span className="text-[11px] font-semibold text-emerald-700">
                            Paid: {formatINR(sched.paid_amount)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
