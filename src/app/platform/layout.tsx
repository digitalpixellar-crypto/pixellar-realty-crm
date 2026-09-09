import React from 'react';
import { PlatformSidebar } from '@/components/layout/PlatformSidebar';
import { PlatformHeader } from '@/components/layout/PlatformHeader';
import { getPlatformAdminSession } from '@/lib/auth/session';

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  const admin = await getPlatformAdminSession();

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
      <PlatformSidebar />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <PlatformHeader />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-900/50">
          {children}
        </main>
      </div>
    </div>
  );
}
