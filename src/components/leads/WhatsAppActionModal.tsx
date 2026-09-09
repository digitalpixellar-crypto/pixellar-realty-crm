'use client';

import React, { useState } from 'react';
import {
  MessageCircle,
  Send,
  FileText,
  Compass,
  CreditCard,
  Copy,
  Check,
  X,
  ExternalLink,
} from 'lucide-react';

interface WhatsAppModalProps {
  lead: {
    id: string;
    first_name: string;
    last_name?: string;
    phone: string;
    normalized_phone?: string;
  };
  company: {
    id: string;
    name: string;
    slug: string;
  };
  project?: {
    name: string;
    location?: string;
    brochure_url?: string;
  } | null;
  agentName?: string;
  triggerButtonClass?: string;
  compact?: boolean;
}

export function WhatsAppActionModal({
  lead,
  company,
  project,
  agentName = 'Sales Specialist',
  triggerButtonClass,
  compact = false,
}: WhatsAppModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<'brochure' | 'visit' | 'pricing' | 'custom'>('brochure');

  const fullName = `${lead.first_name} ${lead.last_name || ''}`.trim();
  const projectName = project?.name || 'our flagship project';
  const cleanPhone = (lead.normalized_phone || lead.phone).replace(/\D/g, '');

  const templates = {
    brochure: `Hello ${fullName},\n\nThis is ${agentName} from ${company.name}. Thank you for your inquiry regarding *${projectName}*.\n\n📁 I am sharing our official digital brochure, master plan, and available inventory layout with you.\n\nWould you be available for a brief 5-minute call today to discuss preferred plot/apartment dimensions?\n\nBest regards,\n${agentName}\n${company.name}`,
    visit: `Hello ${fullName},\n\nGreetings from ${company.name}!\n\n🚗 We would be delighted to host you for a private site tour of *${projectName}*.\n\n📍 Location: ${project?.location || 'Direct Highway Access'}\n🚘 Pick-up facility can be arranged upon request.\n\nPlease let me know your preferred day and time (Saturday/Sunday or Weekday), and I will reserve an executive vehicle for you.\n\nBest regards,\n${agentName}`,
    pricing: `Hello ${fullName},\n\nFollowing up on your inquiry for *${projectName}* with ${company.name}.\n\n💰 Here is our current pricing & milestone payment breakdown:\n• Initial Token: ₹1,00,000 (Refundable within 48 hours)\n• 20% on Agreement Execution\n• Milestone-based installments linked to project demarcation & development\n\nShall I reserve a 48-hour complimentary hold on your preferred unit?\n\nBest regards,\n${agentName}`,
    custom: `Hello ${fullName},\n\nThis is ${agentName} from ${company.name} regarding *${projectName}*.\n\n`,
  };

  const [message, setMessage] = useState(templates.brochure);

  const handleSelectTemplate = (type: 'brochure' | 'visit' | 'pricing' | 'custom') => {
    setSelectedTemplate(type);
    setMessage(templates[type]);
  };

  const handleSendWhatsApp = async () => {
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    // Auto-log to Lead Activity History
    try {
      await fetch('/api/v1/log-lead-activity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: company.id,
          lead_id: lead.id,
          actor_name: agentName,
          activity_type: 'whatsapp',
          title: `WhatsApp Sent (${selectedTemplate.toUpperCase()})`,
          description: message,
        }),
      });
    } catch (e) {
      console.error('Failed to auto-log WhatsApp activity', e);
    }

    setIsOpen(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Trigger Button */}
      {compact ? (
        <button
          onClick={() => setIsOpen(true)}
          className={
            triggerButtonClass ||
            'p-1.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 active:scale-95 transition-all'
          }
          title="Send WhatsApp Message"
          aria-label="Send WhatsApp"
        >
          <MessageCircle className="w-4 h-4 fill-emerald-600/20" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className={
            triggerButtonClass ||
            'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm shadow-emerald-700/20 active:scale-95 transition-all'
          }
        >
          <MessageCircle className="w-4 h-4 fill-white/20" />
          <span>WhatsApp</span>
        </button>
      )}

      {/* Modal Dialog */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center gap-2.5">
                <div className="h-9 w-9 rounded-xl bg-white/20 flex items-center justify-center">
                  <MessageCircle className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold leading-tight">Send WhatsApp to {fullName}</h3>
                  <p className="text-xs text-emerald-100 font-mono mt-0.5">{lead.phone}</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Template Selector */}
            <div className="p-5 border-b border-slate-100 bg-slate-50/50">
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2.5">
                Choose Real Estate Template:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => handleSelectTemplate('brochure')}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    selectedTemplate === 'brochure'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                  <span className="truncate">Brochure</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('visit')}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    selectedTemplate === 'visit'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-teal-600 flex-shrink-0" />
                  <span className="truncate">Site Visit</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('pricing')}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    selectedTemplate === 'pricing'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
                  <span className="truncate">Cost Sheet</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSelectTemplate('custom')}
                  className={`flex items-center gap-1.5 p-2 rounded-xl text-xs font-semibold border transition-all text-left ${
                    selectedTemplate === 'custom'
                      ? 'border-emerald-500 bg-emerald-50/80 text-emerald-900 shadow-sm ring-1 ring-emerald-500'
                      : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-slate-600 flex-shrink-0" />
                  <span className="truncate">Custom</span>
                </button>
              </div>
            </div>

            {/* Editable Message Box */}
            <div className="p-5 flex-1 flex flex-col min-h-0 overflow-y-auto">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                  Message Preview & Edit:
                </label>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy Text'}</span>
                </button>
              </div>

              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={8}
                className="w-full rounded-xl border border-slate-200 p-3.5 text-xs text-slate-800 font-sans leading-relaxed focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none resize-none bg-slate-50/30"
              />

              <p className="text-[11px] text-slate-400 mt-2">
                💡 Clicking &quot;Launch WhatsApp&quot; opens WhatsApp Web or your phone&apos;s WhatsApp app and automatically logs an activity entry in the CRM audit ledger.
              </p>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-200 transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendWhatsApp}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 active:scale-95 transition-all"
              >
                <span>Launch WhatsApp</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
