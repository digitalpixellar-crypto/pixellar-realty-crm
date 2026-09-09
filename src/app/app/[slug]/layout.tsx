import React from 'react';
import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { getTenantContext } from '@/lib/auth/session';
import { AppSidebar } from '@/components/layout/AppSidebar';
import { AppHeader } from '@/components/layout/AppHeader';
import { MobileBottomNav } from '@/components/layout/MobileBottomNav';

interface TenantLayoutProps {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}

export default async function TenantLayout({ children, params }: TenantLayoutProps) {
  const { slug } = await params;
  const context = await getTenantContext(slug);

  if (!context) {
    notFound();
  }

  const allCompanies = db.getCompanies();
  const companyMembers = db.getCompanyMembers(context.company.id);

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans antialiased">
      {/* Sidebar (Desktop) */}
      <AppSidebar company={context.company} member={context.member} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <AppHeader
          company={context.company}
          member={context.member}
          allCompanies={allCompanies}
          companyMembers={companyMembers}
        />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 pb-24 md:pb-8">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Phones) */}
      <MobileBottomNav slug={context.company.slug} />
    </div>
  );
}
