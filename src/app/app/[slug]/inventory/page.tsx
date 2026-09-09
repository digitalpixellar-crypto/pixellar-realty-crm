import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import { formatINR } from '@/components/ui/StatCard';
import {
  Boxes,
  Plus,
  Lock,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Building2,
  DollarSign,
  Map as MapIcon,
  LayoutGrid,
  ListFilter,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { InteractiveMasterLayout } from '@/components/inventory/InteractiveMasterLayout';

interface InventoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ project?: string; status?: string; view?: string; message?: string; error?: string }>;
}

async function handleHoldUnit(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const unitId = formData.get('unit_id') as string;
  const leadId = formData.get('lead_id') as string;
  const holdAmount = parseFloat(formData.get('hold_amount') as string) || 50000;
  const durationHours = parseInt(formData.get('duration_hours') as string, 10) || 48;
  const notes = formData.get('notes') as string;

  const company = db.getCompany(companySlug);
  if (!company) return;

  try {
    db.holdUnit(company.id, unitId, leadId, 'mem-arjun-04', holdAmount, durationHours, notes);
    revalidatePath(`/app/${companySlug}/inventory`);
    revalidatePath(`/app/${companySlug}/dashboard`);
  } catch (err: any) {
    console.error('Hold error:', err);
  }
}

async function handleBookUnit(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const unitId = formData.get('unit_id') as string;
  const customerName = formData.get('customer_name') as string;
  const customerPhone = formData.get('customer_phone') as string;
  const baseQuotedAmount = parseFloat(formData.get('base_quoted_amount') as string);
  const discountAmount = parseFloat(formData.get('discount_amount') as string) || 0;
  const bookingAmount = parseFloat(formData.get('booking_amount') as string) || 100000;
  const channelPartnerId = formData.get('channel_partner_id') as string || undefined;

  const company = db.getCompany(companySlug);
  if (!company) return;

  try {
    // Create customer record
    const customer = db.createCustomer(company.id, {
      first_name: customerName,
      phone: customerPhone,
      kyc_status: 'pending',
    });

    // Atomic Booking Lock Execution
    db.bookUnitAtomic(company.id, unitId, {
      customerId: customer.id,
      salesMemberId: 'mem-arjun-04',
      channelPartnerId,
      baseQuotedAmount,
      discountAmount,
      bookingAmount,
    });

    // Record initial booking payment
    db.recordCustomerPayment(company.id, {
      booking_id: `book-${unitId}`,
      customer_id: customer.id,
      amount: bookingAmount,
      payment_mode: 'neft_rtgs',
      payment_date: new Date().toISOString().split('T')[0],
      recorded_by_member_id: 'mem-arjun-04',
      notes: 'Initial booking token recorded at reservation.',
    });

    revalidatePath(`/app/${companySlug}/inventory`);
    revalidatePath(`/app/${companySlug}/bookings`);
    revalidatePath(`/app/${companySlug}/dashboard`);
  } catch (err: any) {
    console.error('Booking lock error:', err);
  }
}

async function handleAddUnit(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const projectId = formData.get('project_id') as string;
  const unitNumber = formData.get('unit_number') as string;
  const towerBlock = formData.get('tower_block') as string;
  const category = formData.get('category') as any;
  const plotOrUnitType = formData.get('plot_or_unit_type') as string;
  const plotArea = parseFloat(formData.get('plot_area') as string) || undefined;
  const superBuiltupArea = parseFloat(formData.get('super_builtup_area') as string) || undefined;
  const areaUnit = formData.get('area_unit') as any || 'sqft';
  const facing = formData.get('facing') as any;
  const basePrice = parseFloat(formData.get('base_price') as string);
  const totalPrice = parseFloat(formData.get('total_price') as string) || basePrice;

  db.createUnit(company.id, {
    project_id: projectId,
    unit_number: unitNumber,
    tower_block: towerBlock,
    category,
    plot_or_unit_type: plotOrUnitType,
    plot_area: plotArea,
    super_builtup_area: superBuiltupArea,
    area_unit: areaUnit,
    facing,
    base_price: basePrice,
    additional_charges: [],
    total_price: totalPrice,
    status: 'available',
  });

  revalidatePath(`/app/${companySlug}/inventory`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

export default async function TenantInventoryPage({ params, searchParams }: InventoryPageProps) {
  const { slug } = await params;
  const { project: filterProjectId, status: filterStatus, view: requestedView } = await searchParams;

  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const projects = db.getProjects(company.id);
  const leads = db.getLeads(company.id);
  const channelPartners = db.getChannelPartners(company.id);

  const selectedProject = filterProjectId
    ? projects.find((p) => p.id === filterProjectId) || projects[0]
    : projects[0];

  let units = db.getUnits(company.id, selectedProject?.id);
  if (filterStatus) {
    units = units.filter((u) => u.status === filterStatus);
  }

  const currentView = requestedView || 'layout';

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Property & Plot Inventory</h1>
            <Badge variant="primary">{units.length} Units Listed</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Real-time availability matrix, expiring holds, and double-booking concurrency protection.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* View Switcher Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80 shadow-xs">
            <Link
              href={`/app/${slug}/inventory?project=${selectedProject?.id || ''}&view=layout`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'layout'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <MapIcon className="w-3.5 h-3.5 text-emerald-600" />
              <span>Master Plan (SVG)</span>
            </Link>

            <Link
              href={`/app/${slug}/inventory?project=${selectedProject?.id || ''}&view=grid`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'grid'
                  ? 'bg-white text-brand-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5 text-brand-600" />
              <span>Unit Grid</span>
            </Link>

            <Link
              href={`/app/${slug}/inventory?project=${selectedProject?.id || ''}&view=table`}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                currentView === 'table'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5 text-indigo-600" />
              <span>Table</span>
            </Link>
          </div>

          <a
            href="#add-unit-form"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add Plot / Unit</span>
          </a>
        </div>
      </div>

      {/* Concurrency Guarantee Notice */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Anti-Double-Booking Concurrency Lock Active</h4>
            <p className="text-xs text-slate-500">
              Database optimistic locking prevents simultaneous reservation attempts for the same plot or apartment.
            </p>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-mono">Status: Enforced</span>
      </div>

      {/* Project Selector Bar */}
      {projects.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider shrink-0">
            Select Development:
          </span>
          {projects.map((proj) => (
            <Link
              key={proj.id}
              href={`/app/${slug}/inventory?project=${proj.id}&view=${currentView}`}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold shrink-0 transition-all border ${
                selectedProject?.id === proj.id
                  ? 'bg-brand-50 border-brand-300 text-brand-700 shadow-xs'
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {proj.name} ({proj.code})
            </Link>
          ))}
        </div>
      )}

      {/* 1. MASTER LAYOUT VIEW (SVG MAP) */}
      {currentView === 'layout' && (
        <InteractiveMasterLayout
          units={units}
          projectName={selectedProject?.name || 'Skyline Meadows Villa Plots'}
          projectCode={selectedProject?.code || 'SK-MDW'}
          projectLocation={selectedProject?.location || 'Mokila, Shankarpally Road, Hyderabad'}
          companySlug={slug}
          companyId={company.id}
          companyName={company.name}
          leads={leads}
          channelPartners={channelPartners}
        />
      )}

      {/* 2. VISUAL UNIT MATRIX GRID */}
      {(currentView === 'grid' || currentView === 'layout') && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="font-bold text-base text-slate-900">Interactive Unit Layout Grid</h3>
              <p className="text-xs text-slate-500">Color-coded real-time availability</p>
            </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-emerald-500" />
              Available
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-amber-500" />
              On Hold (48h)
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-brand-600" />
              Booked
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded bg-slate-400" />
              Sold Out
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {units.map((unit) => {
            let bgClass = 'border-emerald-200 bg-emerald-50/60 hover:bg-emerald-100/60 text-emerald-950';
            let statusText = 'Available';

            if (unit.status === 'on_hold') {
              bgClass = 'border-amber-200 bg-amber-50/80 hover:bg-amber-100/80 text-amber-950';
              statusText = 'On Hold';
            } else if (unit.status === 'booked') {
              bgClass = 'border-blue-200 bg-blue-50 text-blue-950';
              statusText = 'Booked';
            } else if (unit.status === 'sold') {
              bgClass = 'border-slate-200 bg-slate-100 text-slate-500';
              statusText = 'Sold';
            }

            return (
              <div
                key={unit.id}
                className={`p-3 rounded-lg border flex flex-col justify-between transition-all ${bgClass}`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sm">{unit.unit_number}</span>
                    <span className="text-[10px] font-bold uppercase">{statusText}</span>
                  </div>
                  <div className="text-[11px] mt-1 font-medium text-slate-600 truncate">
                    {unit.facing || 'East'} • {unit.plot_area || unit.super_builtup_area} {unit.area_unit}
                  </div>
                  <div className="text-xs font-bold mt-2 text-slate-900">{formatINR(unit.total_price)}</div>
                </div>

                {unit.status === 'available' && (
                  <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between">
                    <a
                      href={`#hold-unit-${unit.id}`}
                      className="text-[11px] font-bold text-amber-700 hover:underline"
                    >
                      Hold
                    </a>
                    <a
                      href={`#book-unit-${unit.id}`}
                      className="text-[11px] font-bold text-brand-700 hover:underline"
                    >
                      Book →
                    </a>
                  </div>
                )}

                {unit.status === 'on_hold' && unit.hold_expires_at && (
                  <div className="mt-2 pt-1 border-t border-amber-200 text-[10px] text-amber-800 font-semibold flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>Expires: {new Date(unit.hold_expires_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    )}

      {/* Detailed Inventory Table */}
      {(currentView === 'table' || currentView === 'layout') && (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-900">Inventory Directory</h3>
            <p className="text-xs text-slate-500">Complete specifications, areas, prices, and status</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-3.5">Unit / Plot #</th>
                  <th className="px-6 py-3.5">Project & Block</th>
                  <th className="px-6 py-3.5">Type & Area</th>
                  <th className="px-6 py-3.5">Facing</th>
                  <th className="px-6 py-3.5">Base Price</th>
                  <th className="px-6 py-3.5">Total Price</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {units.map((unit) => {
                  const project = projects.find((p) => p.id === unit.project_id);

                  return (
                    <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-slate-900">{unit.unit_number}</td>
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-800">{project?.name || 'Project'}</div>
                        <div className="text-xs text-slate-500">{unit.tower_block || 'Standard Block'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <div>{unit.plot_or_unit_type}</div>
                        <div className="text-slate-500">
                          {unit.plot_area || unit.super_builtup_area} {unit.area_unit}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-xs">{unit.facing || 'East'}</td>
                      <td className="px-6 py-4 text-xs">{formatINR(unit.base_price)}</td>
                      <td className="px-6 py-4 font-bold text-slate-900">{formatINR(unit.total_price)}</td>
                      <td className="px-6 py-4">
                        <StatusBadge status={unit.status} />
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        {unit.status === 'available' ? (
                          <>
                            <a
                              href={`#hold-unit-${unit.id}`}
                              className="text-xs font-semibold text-amber-600 hover:text-amber-800 hover:underline"
                            >
                              Hold
                            </a>
                            <a
                              href={`#book-unit-${unit.id}`}
                              className="text-xs font-semibold text-brand-600 hover:text-brand-800 hover:underline"
                            >
                              Book Unit
                            </a>
                          </>
                        ) : (
                          <span className="text-xs text-slate-400 italic">Locked</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Hold Modals for Available Units */}
      {units.filter((u) => u.status === 'available').map((unit) => (
        <div key={`hold-modal-${unit.id}`} id={`hold-unit-${unit.id}`} className="rounded-xl border border-amber-200 bg-amber-50/50 p-6 shadow-sm">
          <h3 className="text-base font-bold text-amber-950 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-amber-700" />
            <span>Place Expiring Hold on {unit.unit_number} (48 Hours Lock)</span>
          </h3>

          <form action={handleHoldUnit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <input type="hidden" name="company_slug" value={slug} />
            <input type="hidden" name="unit_id" value={unit.id} />

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Select Interested Lead *
              </label>
              <select
                name="lead_id"
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                {leads.map((l) => (
                  <option key={l.id} value={l.id}>
                    {l.first_name} {l.last_name || ''} ({l.phone})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Hold Token Amount (₹)
              </label>
              <input
                type="number"
                name="hold_amount"
                defaultValue={50000}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Hold Duration (Hours)
              </label>
              <select
                name="duration_hours"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="24">24 Hours (1 Day)</option>
                <option value="48">48 Hours (2 Days)</option>
                <option value="72">72 Hours (3 Days)</option>
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <a href="#" className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg">
                Cancel
              </a>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Lock Unit on Hold
              </button>
            </div>
          </form>
        </div>
      ))}

      {/* Booking Modals for Available Units */}
      {units.filter((u) => u.status === 'available').map((unit) => (
        <div key={`book-modal-${unit.id}`} id={`book-unit-${unit.id}`} className="rounded-xl border border-brand-200 bg-brand-50/50 p-6 shadow-sm">
          <h3 className="text-base font-bold text-brand-950 mb-3 flex items-center gap-2">
            <Lock className="w-5 h-5 text-brand-700" />
            <span>Confirm Property Booking for {unit.unit_number}</span>
          </h3>

          <form action={handleBookUnit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <input type="hidden" name="company_slug" value={slug} />
            <input type="hidden" name="unit_id" value={unit.id} />
            <input type="hidden" name="base_quoted_amount" value={unit.total_price} />

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Buyer / Customer Full Name *
              </label>
              <input
                type="text"
                name="customer_name"
                required
                placeholder="e.g. Manish Agarwal"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Buyer Phone Number *
              </label>
              <input
                type="text"
                name="customer_phone"
                required
                placeholder="+91 98480 11223"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Approved Discount (₹)
              </label>
              <input
                type="number"
                name="discount_amount"
                defaultValue={0}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Initial Booking Advance Paid (₹) *
              </label>
              <input
                type="number"
                name="booking_amount"
                defaultValue={500000}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1">
                Referring Channel Partner
              </label>
              <select
                name="channel_partner_id"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="">None / Direct Sale</option>
                {channelPartners.map((cp) => (
                  <option key={cp.id} value={cp.id}>
                    {cp.name} ({cp.company_name || 'Broker'}) - {cp.default_commission_rate}% Comm
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-3 flex justify-end gap-2">
              <a href="#" className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200/50 rounded-lg">
                Cancel
              </a>
              <button
                type="submit"
                className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-xs transition-colors shadow-sm"
              >
                Execute Atomic Booking Lock
              </button>
            </div>
          </form>
        </div>
      ))}

      {/* Add Unit Form */}
      <div id="add-unit-form" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-600" />
          <span>Add Plot or Apartment Unit to Inventory</span>
        </h3>

        <form action={handleAddUnit} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <input type="hidden" name="company_slug" value={slug} />

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Select Project *
            </label>
            <select
              name="project_id"
              required
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Plot / Unit Number *
            </label>
            <input
              type="text"
              name="unit_number"
              required
              placeholder="e.g. Plot-106 or Flat A-1402"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Tower / Block / Phase
            </label>
            <input
              type="text"
              name="tower_block"
              placeholder="Phase 1 - Alpha"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Property Category *
            </label>
            <select
              name="category"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="villa_plots">Villa Plot</option>
              <option value="apartments">Apartment</option>
              <option value="villas">Independent Villa</option>
              <option value="farm_plots">Farmland Plot</option>
              <option value="commercial">Commercial Unit</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Type Description
            </label>
            <input
              type="text"
              name="plot_or_unit_type"
              required
              placeholder="e.g. 250 sq.yd Premium Villa Plot"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Area Dimension & Unit *
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="plot_area"
                required
                placeholder="250"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                name="area_unit"
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="sqyd">Sq. Yd.</option>
                <option value="sqft">Sq. Ft.</option>
                <option value="cents">Cents</option>
                <option value="acres">Acres</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Facing Orientation
            </label>
            <select
              name="facing"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="East">East Facing</option>
              <option value="North">North Facing</option>
              <option value="North-East">North-East Facing</option>
              <option value="West">West Facing</option>
              <option value="South">South Facing</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Base Price (₹) *
            </label>
            <input
              type="number"
              name="base_price"
              required
              placeholder="6250000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Total Quoted Price (₹) *
            </label>
            <input
              type="number"
              name="total_price"
              required
              placeholder="6600000"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Save Unit to Inventory
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
