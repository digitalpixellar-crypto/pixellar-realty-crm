import React from 'react';
import { db } from '@/lib/db';
import { ShieldCheck, History } from 'lucide-react';

export default async function PlatformAuditLogsPage() {
  const auditLogs = db.getAuditLogs();

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="border-b border-slate-800 pb-6">
        <h1 className="text-2xl font-bold text-white tracking-tight">Platform Audit Trail</h1>
        <p className="text-sm text-slate-400 mt-1">
          Immutable system events, security state changes, company suspensions, and administrative actions.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-slate-900 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-semibold text-white">Security & Audit Event Stream</h3>
          </div>
          <span className="text-xs text-slate-400">Total Events: {auditLogs.length}</span>
        </div>

        {auditLogs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <ShieldCheck className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p>No critical administrative audit events recorded yet.</p>
            <p className="text-xs text-slate-600 mt-1">All tenant updates, plan alterations, and superadmin sessions are logged automatically.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {auditLogs.map((log) => (
              <div key={log.id} className="p-4 hover:bg-slate-800/20 text-sm">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-white">{log.action}</span>
                  <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString('en-IN')}</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Target Entity: {log.entity_type} ({log.entity_id})
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
