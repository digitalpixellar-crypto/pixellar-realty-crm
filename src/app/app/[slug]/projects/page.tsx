import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { StatusBadge, Badge } from '@/components/ui/Badge';
import {
  Building2,
  Plus,
  MapPin,
  FileCheck,
  CheckCircle,
  ExternalLink,
  Layers,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';

interface ProjectsPageProps {
  params: Promise<{ slug: string }>;
}

async function handleCreateProject(formData: FormData) {
  'use server';
  const companySlug = formData.get('company_slug') as string;
  const company = db.getCompany(companySlug);
  if (!company) return;

  const name = formData.get('name') as string;
  const code = formData.get('code') as string;
  const category = formData.get('category') as any;
  const location = formData.get('location') as string;
  const city = formData.get('city') as string;
  const state = formData.get('state') as string;
  const developerName = formData.get('developer_name') as string;
  const approvalAuthority = formData.get('approval_authority') as string;
  const approvalNumber = formData.get('approval_number') as string;
  const totalArea = parseFloat(formData.get('total_area') as string) || undefined;
  const areaUnit = formData.get('area_unit') as string || 'acres';
  const description = formData.get('description') as string;

  db.createProject(company.id, {
    name,
    code,
    category,
    location,
    city,
    state,
    developer_name: developerName,
    approval_authority: approvalAuthority,
    approval_number: approvalNumber,
    total_area: totalArea,
    area_unit: areaUnit,
    amenities: ['Clubhouse', '24/7 Security', 'Paved Roads', 'Water Supply'],
    status: 'active',
    description,
  });

  revalidatePath(`/app/${companySlug}/projects`);
  revalidatePath(`/app/${companySlug}/dashboard`);
}

export default async function TenantProjectsPage({ params }: ProjectsPageProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);
  if (!context) notFound();

  const company = context.company;
  const projects = db.getProjects(company.id);
  const units = db.getUnits(company.id);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Real Estate Projects</h1>
            <Badge variant="primary">{projects.length} Active</Badge>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Gated communities, villa plots, luxury towers, farmland, and commercial developments.
          </p>
        </div>

        <a
          href="#add-project-form"
          className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </a>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {projects.map((proj) => {
          const projectUnits = units.filter((u) => u.project_id === proj.id);
          const availableUnits = projectUnits.filter((u) => u.status === 'available').length;
          const onHoldUnits = projectUnits.filter((u) => u.status === 'on_hold').length;
          const bookedUnits = projectUnits.filter((u) => u.status === 'booked' || u.status === 'sold').length;

          return (
            <div
              key={proj.id}
              className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              <div className="p-6">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-brand-50 text-brand-700 border border-brand-200">
                      {proj.category.replace('_', ' ')}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 mt-2">{proj.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-slate-500 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{proj.location}, {proj.city}, {proj.state}</span>
                    </div>
                  </div>

                  <span className="text-xs font-mono font-bold px-2 py-1 bg-slate-100 rounded text-slate-700">
                    {proj.code}
                  </span>
                </div>

                {proj.description && (
                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {proj.description}
                  </p>
                )}

                {/* Regulatory & Approvals */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center gap-4 text-xs">
                  {proj.approval_authority && (
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <FileCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Authority: <strong>{proj.approval_authority}</strong></span>
                    </div>
                  )}
                  {proj.approval_number && (
                    <div className="text-slate-500">
                      RERA / Reg #: <strong className="text-slate-700">{proj.approval_number}</strong>
                    </div>
                  )}
                  {proj.total_area && (
                    <div className="text-slate-500">
                      Area: <strong>{proj.total_area} {proj.area_unit}</strong>
                    </div>
                  )}
                </div>

                {/* Inventory Overview */}
                <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded bg-emerald-50 text-emerald-800 font-medium">
                    <span className="font-bold text-sm block text-emerald-900">{availableUnits}</span>
                    Available
                  </div>
                  <div className="p-2 rounded bg-amber-50 text-amber-800 font-medium">
                    <span className="font-bold text-sm block text-amber-900">{onHoldUnits}</span>
                    On Hold
                  </div>
                  <div className="p-2 rounded bg-indigo-50 text-indigo-800 font-medium">
                    <span className="font-bold text-sm block text-indigo-900">{bookedUnits}</span>
                    Booked / Sold
                  </div>
                </div>

                {/* Amenities Tags */}
                {proj.amenities && proj.amenities.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-1.5">
                    {proj.amenities.map((am) => (
                      <span key={am} className="text-[11px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                        {am}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Link */}
              <div className="px-6 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <span className="text-xs text-slate-500">Developer: {proj.developer_name}</span>
                <Link
                  href={`/app/${slug}/inventory?project=${proj.id}`}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-800"
                >
                  <span>View Units & Plots ({projectUnits.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Project Form */}
      <div id="add-project-form" className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Plus className="w-5 h-5 text-brand-600" />
          <span>Launch New Real Estate Project</span>
        </h3>

        <form action={handleCreateProject} className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <input type="hidden" name="company_slug" value={slug} />

          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Project Name *
            </label>
            <input
              type="text"
              name="name"
              required
              placeholder="e.g. Skyline Signature Villas"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Project Code *
            </label>
            <input
              type="text"
              name="code"
              required
              placeholder="e.g. SK-SIG"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Category *
            </label>
            <select
              name="category"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="villa_plots">Villa Plots</option>
              <option value="apartments">Apartments / High-rise</option>
              <option value="villas">Independent Luxury Villas</option>
              <option value="farm_plots">Farmland / Agro Plots</option>
              <option value="commercial">Commercial / Retail Spaces</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Developer Entity *
            </label>
            <input
              type="text"
              name="developer_name"
              required
              defaultValue={company.name}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Location / Landmark *
            </label>
            <input
              type="text"
              name="location"
              required
              placeholder="e.g. Shankarpally Road"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">City</label>
            <input
              type="text"
              name="city"
              required
              defaultValue={company.city || 'Hyderabad'}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">State</label>
            <input
              type="text"
              name="state"
              required
              defaultValue={company.state || 'Telangana'}
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Approval Authority (e.g. HMDA, DTCP, RERA)
            </label>
            <input
              type="text"
              name="approval_authority"
              placeholder="e.g. HMDA & RERA"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              RERA / Approval Number
            </label>
            <input
              type="text"
              name="approval_number"
              placeholder="e.g. P02400009981"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Total Area & Unit
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                name="total_area"
                placeholder="45"
                step="0.1"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <select
                name="area_unit"
                className="px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="acres">Acres</option>
                <option value="sqft">Sq. Ft.</option>
                <option value="sqyd">Sq. Yd.</option>
              </select>
            </div>
          </div>

          <div className="md:col-span-3">
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Project Description & Highlights
            </label>
            <textarea
              name="description"
              rows={2}
              placeholder="Enter master plan highlights, highway connectivity, and amenities..."
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          <div className="md:col-span-3 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-semibold text-sm shadow-sm transition-all"
            >
              Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
