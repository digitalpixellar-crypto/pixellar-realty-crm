'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { ProjectUnit, UnitStatus, UnitFacing } from '@/types';
import { formatINR } from '@/components/ui/StatCard';
import {
  Search,
  Filter,
  Clock,
  CheckCircle2,
  Lock,
  Compass,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  ChevronRight,
  X,
  Share2,
  Phone,
  ShieldCheck,
  AlertCircle,
  Building,
  TreePine,
  Waves,
  MapPin,
} from 'lucide-react';
import { WhatsAppActionModal } from '@/components/leads/WhatsAppActionModal';

interface InteractiveMasterLayoutProps {
  units: ProjectUnit[];
  projectName: string;
  projectCode: string;
  projectLocation: string;
  companySlug: string;
  companyId: string;
  companyName: string;
  leads: { id: string; first_name: string; last_name?: string; phone: string }[];
  channelPartners: { id: string; name: string; company_name?: string; default_commission_rate: number }[];
  onHoldSuccess?: (unit: ProjectUnit) => void;
  onBookSuccess?: (unit: ProjectUnit) => void;
}

// Master plot coordinate definitions on a 1200x780 architectural grid
interface PlotCoord {
  unitNumber: string;
  x: number;
  y: number;
  width: number;
  height: number;
  sector: string;
  roadAccess: string;
  isCorner?: boolean;
}

const PLOT_COORDINATES: Record<string, PlotCoord> = {
  // Boulevard Row West (North sector)
  'Plot-101': { unitNumber: 'Plot-101', x: 120, y: 130, width: 95, height: 85, sector: 'Phase 1 - Alpha', roadAccess: '40ft Boulevard & North Ave', isCorner: true },
  'Plot-102': { unitNumber: 'Plot-102', x: 225, y: 130, width: 85, height: 85, sector: 'Phase 1 - Alpha', roadAccess: '40ft Main Boulevard' },
  'Plot-103': { unitNumber: 'Plot-103', x: 320, y: 130, width: 85, height: 85, sector: 'Phase 1 - Alpha', roadAccess: '40ft Main Boulevard' },
  'Plot-104': { unitNumber: 'Plot-104', x: 415, y: 130, width: 85, height: 85, sector: 'Phase 1 - Alpha', roadAccess: '40ft Main Boulevard' },
  'Plot-105': { unitNumber: 'Plot-105', x: 510, y: 130, width: 105, height: 85, sector: 'Phase 1 - Alpha', roadAccess: '40ft Boulevard & Central Loop', isCorner: true },

  // Park Sector West (South of Central Park)
  'Plot-106': { unitNumber: 'Plot-106', x: 120, y: 255, width: 95, height: 85, sector: 'Phase 1 - Park Sector', roadAccess: 'Park Avenue West', isCorner: true },
  'Plot-107': { unitNumber: 'Plot-107', x: 120, y: 350, width: 95, height: 80, sector: 'Phase 1 - Park Sector', roadAccess: 'Park Avenue West' },
  'Plot-108': { unitNumber: 'Plot-108', x: 120, y: 440, width: 95, height: 80, sector: 'Phase 1 - Park Sector', roadAccess: 'Park Avenue West' },
  'Plot-109': { unitNumber: 'Plot-109', x: 120, y: 530, width: 95, height: 85, sector: 'Phase 1 - Boulevard', roadAccess: 'West Avenue & Boulevard', isCorner: true },

  // Boulevard Row Center
  'Plot-110': { unitNumber: 'Plot-110', x: 520, y: 255, width: 95, height: 85, sector: 'Phase 1 - Boulevard', roadAccess: '40ft Main Boulevard' },
  'Plot-111': { unitNumber: 'Plot-111', x: 520, y: 350, width: 95, height: 80, sector: 'Phase 1 - Boulevard', roadAccess: '40ft Main Boulevard' },
  'Plot-112': { unitNumber: 'Plot-112', x: 520, y: 440, width: 95, height: 80, sector: 'Phase 2 - Club Avenue', roadAccess: '40ft Main Boulevard' },
  'Plot-113': { unitNumber: 'Plot-113', x: 520, y: 530, width: 95, height: 85, sector: 'Phase 2 - Club Avenue', roadAccess: 'Club Avenue & Boulevard', isCorner: true },

  // Club & Lake View Sector East
  'Plot-114': { unitNumber: 'Plot-114', x: 975, y: 130, width: 110, height: 85, sector: 'Phase 2 - Club Avenue', roadAccess: 'Club Avenue East', isCorner: true },
  'Plot-115': { unitNumber: 'Plot-115', x: 975, y: 225, width: 110, height: 85, sector: 'Phase 2 - Club Avenue', roadAccess: 'Club Avenue East' },
  'Plot-116': { unitNumber: 'Plot-116', x: 975, y: 320, width: 110, height: 85, sector: 'Phase 2 - Lake View', roadAccess: 'Lake View Promenade', isCorner: true },
  'Plot-117': { unitNumber: 'Plot-117', x: 975, y: 415, width: 110, height: 80, sector: 'Phase 2 - Lake View', roadAccess: 'Lake View Promenade' },
  'Plot-118': { unitNumber: 'Plot-118', x: 975, y: 505, width: 110, height: 110, sector: 'Phase 2 - Lake View', roadAccess: 'Lake View & Grand South Loop', isCorner: true },
};

function formatCountdown(targetIso: string | undefined): { text: string; isUrgent: boolean } {
  if (!targetIso) return { text: 'No expiration', isUrgent: false };
  const diffMs = new Date(targetIso).getTime() - Date.now();
  if (diffMs <= 0) return { text: 'Expired', isUrgent: true };

  const totalSecs = Math.floor(diffMs / 1000);
  const hrs = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  const secs = totalSecs % 60;

  return {
    text: `${hrs}h ${mins}m ${secs}s remaining`,
    isUrgent: hrs < 12,
  };
}

export function InteractiveMasterLayout({
  units: initialUnits,
  projectName,
  projectCode,
  projectLocation,
  companySlug,
  companyId,
  companyName,
  leads,
  channelPartners,
}: InteractiveMasterLayoutProps) {
  const [units, setUnits] = useState<ProjectUnit[]>(initialUnits);
  const [selectedUnit, setSelectedUnit] = useState<ProjectUnit | null>(null);
  const [hoveredUnit, setHoveredUnit] = useState<ProjectUnit | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [facingFilter, setFacingFilter] = useState<string>('all');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [activeTab, setActiveTab] = useState<'details' | 'hold' | 'book'>('details');

  // Form states for in-drawer action execution
  const [holdLeadId, setHoldLeadId] = useState(leads[0]?.id || '');
  const [holdAmount, setHoldAmount] = useState(50000);
  const [holdHours, setHoldHours] = useState(48);
  const [holdNotes, setHoldNotes] = useState('');
  const [isSubmittingHold, setIsSubmittingHold] = useState(false);
  const [holdError, setHoldError] = useState<string | null>(null);

  const [bookCustomerName, setBookCustomerName] = useState('');
  const [bookCustomerPhone, setBookCustomerPhone] = useState('');
  const [bookAdvanceAmount, setBookAdvanceAmount] = useState(500000);
  const [bookDiscount, setBookDiscount] = useState(0);
  const [bookChannelPartnerId, setBookChannelPartnerId] = useState('');
  const [isSubmittingBook, setIsSubmittingBook] = useState(false);
  const [bookError, setBookError] = useState<string | null>(null);

  // Live countdown timer ticking every second
  const [, setClockTick] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setClockTick((t) => t + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  // Update units when prop changes
  useEffect(() => {
    setUnits(initialUnits);
  }, [initialUnits]);

  // When selectedUnit changes, update if refreshed
  useEffect(() => {
    if (selectedUnit) {
      const refreshed = units.find((u) => u.id === selectedUnit.id);
      if (refreshed) setSelectedUnit(refreshed);
    }
  }, [units, selectedUnit]);

  // Statistics
  const stats = useMemo(() => {
    const available = units.filter((u) => u.status === 'available');
    const onHold = units.filter((u) => u.status === 'on_hold');
    const booked = units.filter((u) => u.status === 'booked');
    const sold = units.filter((u) => u.status === 'sold');
    const totalVal = units.reduce((acc, u) => acc + (u.total_price || 0), 0);
    return {
      total: units.length,
      availableCount: available.length,
      onHoldCount: onHold.length,
      bookedCount: booked.length,
      soldCount: sold.length,
      totalValue: totalVal,
      claimedPercent: Math.round(((booked.length + sold.length) / (units.length || 1)) * 100),
    };
  }, [units]);

  // Filtered unit numbers
  const matchedUnitNumbers = useMemo(() => {
    return new Set(
      units
        .filter((u) => {
          if (searchQuery) {
            const q = searchQuery.toLowerCase().replace(/plot-?/i, '');
            const num = u.unit_number.toLowerCase().replace(/plot-?/i, '');
            if (!num.includes(q)) return false;
          }
          if (statusFilter !== 'all' && u.status !== statusFilter) return false;
          if (facingFilter !== 'all' && u.facing !== facingFilter) return false;
          return true;
        })
        .map((u) => u.unit_number)
    );
  }, [units, searchQuery, statusFilter, facingFilter]);

  // Submit Hold
  const handleExecuteHold = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setIsSubmittingHold(true);
    setHoldError(null);

    try {
      const res = await fetch('/api/v1/units/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          unit_id: selectedUnit.id,
          lead_id: holdLeadId,
          hold_amount: holdAmount,
          duration_hours: holdHours,
          notes: holdNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to place hold');
      }

      // Update state
      setUnits((prev) => prev.map((u) => (u.id === data.unit.id ? data.unit : u)));
      setSelectedUnit(data.unit);
      setActiveTab('details');
    } catch (err: any) {
      setHoldError(err.message || 'Error occurred while placing hold');
    } finally {
      setIsSubmittingHold(false);
    }
  };

  // Submit Booking
  const handleExecuteBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUnit) return;
    setIsSubmittingBook(true);
    setBookError(null);

    try {
      const res = await fetch('/api/v1/units/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_id: companyId,
          unit_id: selectedUnit.id,
          customer_name: bookCustomerName,
          customer_phone: bookCustomerPhone,
          base_quoted_amount: selectedUnit.total_price,
          discount_amount: bookDiscount,
          booking_amount: bookAdvanceAmount,
          channel_partner_id: bookChannelPartnerId || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Booking failed');
      }

      setUnits((prev) => prev.map((u) => (u.id === data.unit.id ? data.unit : u)));
      setSelectedUnit(data.unit);
      setActiveTab('details');
    } catch (err: any) {
      setBookError(err.message || 'Error occurred during booking');
    } finally {
      setIsSubmittingBook(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Master Plan Top Toolbar & Metrics */}
      <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Compass className="w-5 h-5 animate-spin-slow" />
              </span>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                {projectName} • Interactive Master Layout
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 text-slate-700">
                {projectCode}
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              {projectLocation} • 45 Acres Luxury Gated Villa Community • HMDA & RERA Approved
            </p>
          </div>

          {/* Quick Metrics Bar */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <div className="px-3.5 py-2 rounded-xl bg-emerald-50/70 border border-emerald-200/80 text-center">
              <div className="text-[10px] uppercase font-bold text-emerald-700 tracking-wider">Available</div>
              <div className="text-base font-extrabold text-emerald-900">{stats.availableCount} Plots</div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-amber-50/80 border border-amber-200/80 text-center relative">
              <div className="text-[10px] uppercase font-bold text-amber-700 tracking-wider flex items-center justify-center gap-1">
                <span>On Hold</span>
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              </div>
              <div className="text-base font-extrabold text-amber-900">{stats.onHoldCount} Plots</div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-indigo-50/70 border border-indigo-200/80 text-center">
              <div className="text-[10px] uppercase font-bold text-indigo-700 tracking-wider">Booked</div>
              <div className="text-base font-extrabold text-indigo-900">{stats.bookedCount} Plots</div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-100 border border-slate-200 text-center">
              <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Sold</div>
              <div className="text-base font-extrabold text-slate-800">{stats.soldCount} Plots</div>
            </div>
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative min-w-[220px]">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search plot # (e.g. 105, 114)..."
                className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50/60"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
              <button
                onClick={() => setStatusFilter('all')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all ${
                  statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All ({stats.total})
              </button>
              <button
                onClick={() => setStatusFilter('available')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  statusFilter === 'available' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Available ({stats.availableCount})
              </button>
              <button
                onClick={() => setStatusFilter('on_hold')}
                className={`px-2.5 py-1 rounded-md font-semibold transition-all flex items-center gap-1 ${
                  statusFilter === 'on_hold' ? 'bg-amber-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-amber-200" />
                On Hold ({stats.onHoldCount})
              </button>
            </div>

            {/* Facing Filter */}
            <select
              value={facingFilter}
              onChange={(e) => setFacingFilter(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 bg-slate-50/60 focus:outline-none"
            >
              <option value="all">All Facings</option>
              <option value="East">East (Vastu Prime)</option>
              <option value="North">North Facing</option>
              <option value="North-East">North-East (Corner)</option>
              <option value="West">West Facing</option>
            </select>
          </div>

          {/* Zoom & View Controls */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <span className="text-xs text-slate-400 font-medium">Zoom: {Math.round(zoomLevel * 100)}%</span>
            <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white shadow-xs">
              <button
                onClick={() => setZoomLevel((z) => Math.max(0.7, z - 0.15))}
                className="p-1.5 text-slate-600 hover:bg-slate-100"
                title="Zoom Out"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setZoomLevel(1)}
                className="p-1.5 text-slate-600 hover:bg-slate-100 border-x border-slate-200"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setZoomLevel((z) => Math.min(1.6, z + 0.15))}
                className="p-1.5 text-slate-600 hover:bg-slate-100"
                title="Zoom In"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SVG Canvas Container */}
      <div className="relative rounded-2xl border border-slate-300/80 bg-slate-950 overflow-hidden shadow-xl select-none">
        {/* Architectural HUD Overlay */}
        <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-2 rounded-xl border border-slate-700/60 text-white shadow-lg text-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-semibold text-slate-200">Interactive Master Blueprint</span>
          <span className="text-slate-500">•</span>
          <span className="text-slate-400">Click any plot to hold, book or share</span>
        </div>

        {/* North Arrow Compass HUD */}
        <div className="absolute top-4 right-4 z-10 bg-slate-900/85 backdrop-blur-md p-2.5 rounded-xl border border-slate-700/60 text-center shadow-lg pointer-events-none">
          <div className="text-[10px] font-black tracking-widest text-rose-400">▲ NORTH</div>
          <div className="text-[9px] text-slate-400 mt-0.5 font-mono">{"18° 12' N"}</div>
        </div>

        {/* Scrollable / Zoomable SVG Viewport */}
        <div className="overflow-auto max-h-[640px] p-4 flex items-center justify-center">
          <div
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            }}
          >
            <svg
              viewBox="0 0 1200 740"
              className="w-[1160px] h-[716px] drop-shadow-2xl"
              style={{ minWidth: '1160px', minHeight: '716px' }}
            >
              <defs>
                {/* Available Plot Gradient */}
                <linearGradient id="grad-available" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#059669" />
                </linearGradient>

                {/* Available Hover Glow */}
                <filter id="glow-available" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="0" stdDeviation="6" floodColor="#34d399" floodOpacity="0.8" />
                </filter>

                {/* Hold Plot Gradient */}
                <linearGradient id="grad-hold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fbbf24" />
                  <stop offset="100%" stopColor="#d97706" />
                </linearGradient>

                {/* Booked Plot Gradient */}
                <linearGradient id="grad-booked" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#60a5fa" />
                  <stop offset="100%" stopColor="#2563eb" />
                </linearGradient>

                {/* Sold Plot Gradient */}
                <linearGradient id="grad-sold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#334155" />
                </linearGradient>

                {/* Grass & Landscape Pattern */}
                <radialGradient id="grad-park" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#15803d" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#166534" stopOpacity="0.6" />
                </radialGradient>

                {/* Pool Gradient */}
                <linearGradient id="grad-pool" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#38bdf8" />
                  <stop offset="100%" stopColor="#0284c7" />
                </linearGradient>
              </defs>

              {/* Master Ground Layer */}
              <rect x="0" y="0" width="1200" height="740" fill="#0f172a" rx="16" />

              {/* Gated Community Perimeter Boundary Wall */}
              <rect
                x="30"
                y="30"
                width="1140"
                height="680"
                fill="#1e293b"
                stroke="#334155"
                strokeWidth="4"
                rx="14"
              />

              {/* Decorative Landscaping Grass Verge */}
              <rect
                x="40"
                y="40"
                width="1120"
                height="660"
                fill="#064e3b"
                fillOpacity="0.3"
                rx="10"
              />

              {/* ROAD NETWORK */}
              {/* 40ft Main Boulevard (Central Spine) */}
              <rect x="235" y="40" width="80" height="660" fill="#334155" />
              {/* Boulevard Center Dashed Line */}
              <line
                x1="275"
                y1="45"
                x2="275"
                y2="695"
                stroke="#f8fafc"
                strokeWidth="2"
                strokeDasharray="12 10"
                strokeOpacity="0.6"
              />
              <text x="275" y="80" fill="#94a3b8" fontSize="11" fontWeight="700" letterSpacing="2" textAnchor="middle">
                40FT MAIN BOULEVARD
              </text>

              {/* Cross Avenue 1 (Top / North Ring) */}
              <rect x="40" y="70" width="1120" height="46" fill="#334155" />
              <line x1="40" y1="93" x2="1160" y2="93" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="8 8" strokeOpacity="0.4" />
              <text x="170" y="97" fill="#94a3b8" fontSize="10" fontWeight="600">NORTH AVENUE (30FT)</text>

              {/* Cross Avenue 2 (Mid / Park Ring) */}
              <rect x="40" y="220" width="1120" height="30" fill="#334155" />
              <line x1="40" y1="235" x2="1160" y2="235" stroke="#f8fafc" strokeWidth="1" strokeDasharray="6 6" strokeOpacity="0.3" />

              {/* Cross Avenue 3 (Lower Avenue) */}
              <rect x="40" y="620" width="1120" height="42" fill="#334155" />
              <line x1="40" y1="641" x2="1160" y2="641" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="8 8" strokeOpacity="0.4" />
              <text x="640" y="645" fill="#94a3b8" fontSize="10" fontWeight="600">SOUTH PROMENADE (30FT)</text>

              {/* East Avenue Spine */}
              <rect x="915" y="70" width="45" height="570" fill="#334155" />
              <line x1="937" y1="70" x2="937" y2="640" stroke="#f8fafc" strokeWidth="1.5" strokeDasharray="8 8" strokeOpacity="0.4" />

              {/* GRAND ENTRANCE ARCH & SECURITY CHECKPOINT (Bottom Center) */}
              <g transform="translate(200, 665)">
                <rect x="0" y="0" width="150" height="35" fill="#0f172a" stroke="#e2e8f0" strokeWidth="2" rx="6" />
                <rect x="15" y="5" width="20" height="25" fill="#f59e0b" rx="2" />
                <text x="25" y="21" fill="#78350f" fontSize="9" fontWeight="900" textAnchor="middle">SEC</text>
                <text x="85" y="22" fill="#f8fafc" fontSize="11" fontWeight="800" textAnchor="middle">
                  MAIN ENTRANCE
                </text>
              </g>

              {/* CENTRAL LANDSCAPED PARK (Sector Alpha) */}
              <g transform="translate(635, 130)">
                {/* Park Grounds */}
                <rect
                  x="0"
                  y="0"
                  width="265"
                  height="260"
                  fill="url(#grad-park)"
                  stroke="#22c55e"
                  strokeWidth="2"
                  strokeDasharray="4 2"
                  rx="16"
                />
                {/* Walking Jogging Track */}
                <rect
                  x="15"
                  y="15"
                  width="235"
                  height="230"
                  fill="none"
                  stroke="#ca8a04"
                  strokeWidth="3"
                  strokeDasharray="5 3"
                  rx="12"
                />
                {/* Central Lawn Circle */}
                <circle cx="132" cy="130" r="45" fill="#15803d" stroke="#86efac" strokeWidth="2" />
                <text x="132" y="126" fill="#f0fdf4" fontSize="12" fontWeight="800" textAnchor="middle">
                  CENTRAL PARK
                </text>
                <text x="132" y="142" fill="#bbf7d0" fontSize="10" fontWeight="600" textAnchor="middle">
                  2.5 Acres Green Lawn
                </text>

                {/* Tree Icons */}
                <circle cx="45" cy="45" r="12" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
                <circle cx="220" cy="45" r="12" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
                <circle cx="45" cy="215" r="12" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
                <circle cx="220" cy="215" r="12" fill="#166534" stroke="#4ade80" strokeWidth="1.5" />
              </g>

              {/* GRAND CLUBHOUSE & SWIMMING POOL (Sector Beta) */}
              <g transform="translate(635, 410)">
                <rect
                  x="0"
                  y="0"
                  width="265"
                  height="195"
                  fill="#1e1b4b"
                  stroke="#6366f1"
                  strokeWidth="2"
                  rx="14"
                />
                {/* Clubhouse Facility Building */}
                <rect x="15" y="15" width="130" height="90" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" rx="6" />
                <text x="80" y="55" fill="#e0e7ff" fontSize="11" fontWeight="800" textAnchor="middle">
                  MEADOWS CLUB
                </text>
                <text x="80" y="70" fill="#a5b4fc" fontSize="9" textAnchor="middle">
                  Gym • Banquet • Spa
                </text>

                {/* Infinity Swimming Pool */}
                <rect
                  x="160"
                  y="15"
                  width="90"
                  height="90"
                  fill="url(#grad-pool)"
                  stroke="#38bdf8"
                  strokeWidth="2"
                  rx="8"
                />
                <text x="205" y="55" fill="#f0f9ff" fontSize="10" fontWeight="800" textAnchor="middle">
                  SWIMMING
                </text>
                <text x="205" y="70" fill="#bae6fd" fontSize="9" textAnchor="middle">
                  POOL
                </text>

                {/* Tennis / Pickleball Court */}
                <rect x="15" y="115" width="235" height="65" fill="#065f46" stroke="#34d399" strokeWidth="1.5" rx="6" />
                <line x1="132" y1="115" x2="132" y2="180" stroke="#f8fafc" strokeWidth="1.5" />
                <text x="132" y="152" fill="#ecfdf5" fontSize="10" fontWeight="700" textAnchor="middle">
                  TENNIS & PICKLEBALL ARENA
                </text>
              </g>

              {/* PLOTS RENDERING */}
              {Object.entries(PLOT_COORDINATES).map(([unitNum, coord]) => {
                const unit = units.find((u) => u.unit_number === unitNum);
                const isMatched = matchedUnitNumbers.has(unitNum);
                const isSelected = selectedUnit?.unit_number === unitNum;
                const isHovered = hoveredUnit?.unit_number === unitNum;

                // Color definition based on unit status
                let fillGradient = 'url(#grad-available)';
                let strokeColor = '#34d399';
                let statusLabel = 'AVAILABLE';
                let statusBg = '#065f46';

                if (unit) {
                  if (unit.status === 'on_hold') {
                    fillGradient = 'url(#grad-hold)';
                    strokeColor = '#f59e0b';
                    statusLabel = 'ON HOLD';
                    statusBg = '#78350f';
                  } else if (unit.status === 'booked') {
                    fillGradient = 'url(#grad-booked)';
                    strokeColor = '#60a5fa';
                    statusLabel = 'BOOKED';
                    statusBg = '#1e3a8a';
                  } else if (unit.status === 'sold') {
                    fillGradient = 'url(#grad-sold)';
                    strokeColor = '#94a3b8';
                    statusLabel = 'SOLD';
                    statusBg = '#0f172a';
                  }
                }

                const opacity = isMatched ? 1 : 0.25;

                return (
                  <g
                    key={unitNum}
                    transform={`translate(${coord.x}, ${coord.y})`}
                    onClick={() => unit && setSelectedUnit(unit)}
                    onMouseEnter={() => unit && setHoveredUnit(unit)}
                    onMouseLeave={() => setHoveredUnit(null)}
                    className="cursor-pointer transition-all duration-150"
                    opacity={opacity}
                  >
                    {/* Plot Box */}
                    <rect
                      x="0"
                      y="0"
                      width={coord.width}
                      height={coord.height}
                      fill={fillGradient}
                      stroke={isSelected ? '#ffffff' : isHovered ? '#ffffff' : strokeColor}
                      strokeWidth={isSelected ? 3.5 : isHovered ? 2.5 : 1.5}
                      rx="8"
                      filter={isHovered ? 'url(#glow-available)' : undefined}
                    />

                    {/* Corner Plot Badge Indicator */}
                    {coord.isCorner && (
                      <polygon
                        points={`0,0 24,0 0,24`}
                        fill="#fbbf24"
                      />
                    )}

                    {/* Plot Unit Number */}
                    <text
                      x={coord.width / 2}
                      y={26}
                      fill="#ffffff"
                      fontSize="14"
                      fontWeight="900"
                      letterSpacing="0.5"
                      textAnchor="middle"
                      className="drop-shadow-sm font-mono"
                    >
                      {unitNum.replace('Plot-', '#')}
                    </text>

                    {/* Area Badge */}
                    <text
                      x={coord.width / 2}
                      y={44}
                      fill="#f8fafc"
                      fontSize="10"
                      fontWeight="600"
                      textAnchor="middle"
                      opacity="0.9"
                    >
                      {unit?.plot_area || 250} sq.yd
                    </text>

                    {/* Facing Badge Pill */}
                    <rect
                      x={coord.width / 2 - 22}
                      y={50}
                      width="44"
                      height="15"
                      fill={statusBg}
                      rx="4"
                      opacity="0.9"
                    />
                    <text
                      x={coord.width / 2}
                      y={61}
                      fill="#ffffff"
                      fontSize="9"
                      fontWeight="800"
                      textAnchor="middle"
                    >
                      {unit?.facing ? `${unit.facing.slice(0, 5)}` : 'EAST'}
                    </text>

                    {/* On-Hold Pulsing Icon */}
                    {unit?.status === 'on_hold' && (
                      <g transform={`translate(${coord.width - 20}, 6)`}>
                        <circle cx="8" cy="8" r="6" fill="#fef08a" />
                        <circle cx="8" cy="8" r="3" fill="#b45309" />
                      </g>
                    )}

                    {/* Price Pill on bottom */}
                    {coord.height >= 85 && unit && (
                      <text
                        x={coord.width / 2}
                        y={coord.height - 7}
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="700"
                        textAnchor="middle"
                        opacity="0.9"
                      >
                        {formatINR(unit.total_price)}
                      </text>
                    )}
                  </g>
                );
              })}
            </svg>
          </div>
        </div>

        {/* Hover Floating HUD Tooltip */}
        {hoveredUnit && !selectedUnit && (
          <div className="absolute bottom-4 left-4 z-20 bg-slate-900/95 backdrop-blur-md p-4 rounded-xl border border-slate-700 text-white shadow-2xl min-w-[260px] animate-fadeIn pointer-events-none">
            <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-2">
              <span className="font-mono font-bold text-base text-emerald-400">{hoveredUnit.unit_number}</span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                  hoveredUnit.status === 'available'
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                    : hoveredUnit.status === 'on_hold'
                    ? 'bg-amber-950 text-amber-300 border border-amber-800'
                    : hoveredUnit.status === 'booked'
                    ? 'bg-blue-950 text-blue-300 border border-blue-800'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hoveredUnit.status.replace('_', ' ')}
              </span>
            </div>

            <div className="mt-2 space-y-1 text-xs text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Dimensions:</span>
                <span className="font-semibold">{hoveredUnit.plot_area} Sq. Yards</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Facing:</span>
                <span className="font-semibold">{hoveredUnit.facing || 'East'} Facing</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Price:</span>
                <span className="font-bold text-white">{formatINR(hoveredUnit.total_price)}</span>
              </div>
              {hoveredUnit.status === 'on_hold' && hoveredUnit.hold_expires_at && (
                <div className="pt-2 border-t border-slate-800 text-amber-400 text-[11px] font-bold flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatCountdown(hoveredUnit.hold_expires_at).text}</span>
                </div>
              )}
            </div>
            <div className="mt-2 text-[10px] text-emerald-400/80 italic text-center font-medium">
              Click plot to open dossier & actions →
            </div>
          </div>
        )}
      </div>

      {/* Selected Plot Drawer / Modal */}
      {selectedUnit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-slate-800 text-emerald-400 font-mono font-bold text-lg">
                  {selectedUnit.unit_number}
                </div>
                <div>
                  <h3 className="font-bold text-base text-white flex items-center gap-2">
                    <span>{selectedUnit.plot_or_unit_type}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        selectedUnit.status === 'available'
                          ? 'bg-emerald-500 text-white'
                          : selectedUnit.status === 'on_hold'
                          ? 'bg-amber-500 text-white'
                          : selectedUnit.status === 'booked'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {selectedUnit.status.replace('_', ' ')}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    {selectedUnit.tower_block || 'Phase 1'} • {projectName}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedUnit(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Hold Alert Banner if On Hold */}
            {selectedUnit.status === 'on_hold' && selectedUnit.hold_expires_at && (
              <div className="px-6 py-3 bg-amber-500 text-amber-950 flex items-center justify-between text-xs font-bold">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 animate-pulse" />
                  <span>48-HOUR HOLD ACTIVE:</span>
                  <span>{formatCountdown(selectedUnit.hold_expires_at).text}</span>
                </div>
                <span className="text-[11px] font-mono bg-amber-600/30 px-2 py-0.5 rounded">
                  Lock Ver: {selectedUnit.lock_version}
                </span>
              </div>
            )}

            {/* Navigation Tabs if Available */}
            {selectedUnit.status === 'available' && (
              <div className="flex border-b border-slate-200 bg-slate-50 px-6">
                <button
                  onClick={() => setActiveTab('details')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all ${
                    activeTab === 'details'
                      ? 'border-emerald-600 text-emerald-800 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Unit Dossier & Pricing
                </button>
                <button
                  onClick={() => setActiveTab('hold')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'hold'
                      ? 'border-amber-500 text-amber-800 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-600" />
                  <span>Place 48h Hold</span>
                </button>
                <button
                  onClick={() => setActiveTab('book')}
                  className={`py-3 px-4 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
                    activeTab === 'book'
                      ? 'border-brand-600 text-brand-800 bg-white'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5 text-brand-600" />
                  <span>Book Unit</span>
                </button>
              </div>
            )}

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {activeTab === 'details' && (
                <>
                  {/* Key Specifications Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Plot Area</span>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">
                        {selectedUnit.plot_area} <span className="text-xs font-normal text-slate-500">sq.yd</span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">
                        ~{(selectedUnit.plot_area || 0) * 9} sq.ft
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Orientation</span>
                      <div className="text-base font-extrabold text-slate-900 mt-0.5">
                        {selectedUnit.facing || 'East'}
                      </div>
                      <div className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        <span>Vastu Compliant</span>
                      </div>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <span className="text-[10px] uppercase font-bold text-slate-400">Road Frontage</span>
                      <div className="text-sm font-bold text-slate-900 mt-0.5 truncate">
                        {PLOT_COORDINATES[selectedUnit.unit_number]?.roadAccess || '40ft Boulevard'}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">Blacktop Paved</div>
                    </div>

                    <div className="p-3 rounded-xl bg-emerald-50/60 border border-emerald-200/70">
                      <span className="text-[10px] uppercase font-bold text-emerald-700">Total Price</span>
                      <div className="text-base font-extrabold text-emerald-950 mt-0.5">
                        {formatINR(selectedUnit.total_price)}
                      </div>
                      <div className="text-[11px] text-emerald-700 font-semibold mt-0.5">All Inclusive</div>
                    </div>
                  </div>

                  {/* Financial Breakdown Table */}
                  <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 space-y-2.5">
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Price Breakdown & Cost Sheet
                    </h4>

                    <div className="flex justify-between text-xs text-slate-600 pt-2 border-t border-slate-200/80">
                      <span>Base Land Cost ({formatINR(selectedUnit.base_price / (selectedUnit.plot_area || 250))}/sq.yd):</span>
                      <span className="font-semibold text-slate-800">{formatINR(selectedUnit.base_price)}</span>
                    </div>

                    {selectedUnit.additional_charges?.map((charge, idx) => (
                      <div key={idx} className="flex justify-between text-xs text-slate-600">
                        <span>{charge.name}:</span>
                        <span className="font-semibold text-slate-800">{formatINR(charge.amount)}</span>
                      </div>
                    ))}

                    <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-2.5 border-t border-slate-300">
                      <span>Total Quoted Investment:</span>
                      <span className="text-emerald-700">{formatINR(selectedUnit.total_price)}</span>
                    </div>
                  </div>

                  {/* Quick Action Buttons for Available Unit */}
                  {selectedUnit.status === 'available' && (
                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                      <button
                        onClick={() => setActiveTab('hold')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Clock className="w-4 h-4" />
                        <span>Place 48-Hour Hold (₹50k Token)</span>
                      </button>

                      <button
                        onClick={() => setActiveTab('book')}
                        className="flex-1 py-2.5 px-4 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                      >
                        <Lock className="w-4 h-4" />
                        <span>Execute Atomic Booking</span>
                      </button>

                      {/* WhatsApp Share Action Modal Trigger */}
                      {leads[0] && (
                        <WhatsAppActionModal
                          lead={leads[0]}
                          company={{ id: companyId, name: companyName, slug: companySlug }}
                          project={{ name: `${projectName} (${selectedUnit.unit_number})`, location: projectLocation }}
                          triggerButtonClass="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                        />
                      )}
                    </div>
                  )}
                </>
              )}

              {/* Hold Form Tab */}
              {activeTab === 'hold' && selectedUnit.status === 'available' && (
                <form onSubmit={handleExecuteHold} className="space-y-4">
                  {holdError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{holdError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Assign Hold to Inquiring Lead *
                    </label>
                    <select
                      value={holdLeadId}
                      onChange={(e) => setHoldLeadId(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    >
                      {leads.map((l) => (
                        <option key={l.id} value={l.id}>
                          {l.first_name} {l.last_name || ''} • {l.phone}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Hold Token Deposit (₹)
                      </label>
                      <input
                        type="number"
                        value={holdAmount}
                        onChange={(e) => setHoldAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Lock Duration
                      </label>
                      <select
                        value={holdHours}
                        onChange={(e) => setHoldHours(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        <option value={24}>24 Hours (1 Day)</option>
                        <option value={48}>48 Hours (Standard 2 Days)</option>
                        <option value={72}>72 Hours (Weekend Extension)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Internal Notes
                    </label>
                    <input
                      type="text"
                      value={holdNotes}
                      onChange={(e) => setHoldNotes(e.target.value)}
                      placeholder="e.g. Buyer visited site on Sunday, reviewing loan eligibility with HDFC"
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingHold}
                      className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                    >
                      {isSubmittingHold ? 'Locking Plot...' : 'Confirm 48-Hour Hold'}
                    </button>
                  </div>
                </form>
              )}

              {/* Booking Form Tab */}
              {activeTab === 'book' && selectedUnit.status === 'available' && (
                <form onSubmit={handleExecuteBook} className="space-y-4">
                  {bookError && (
                    <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                      <span>{bookError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Buyer Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={bookCustomerName}
                        onChange={(e) => setBookCustomerName(e.target.value)}
                        placeholder="e.g. Sridhar Reddy"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Buyer Phone Number *
                      </label>
                      <input
                        type="tel"
                        required
                        value={bookCustomerPhone}
                        onChange={(e) => setBookCustomerPhone(e.target.value)}
                        placeholder="+91 98490 55443"
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Advance Booking Deposit (₹) *
                      </label>
                      <input
                        type="number"
                        required
                        value={bookAdvanceAmount}
                        onChange={(e) => setBookAdvanceAmount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Approved Discount (₹)
                      </label>
                      <input
                        type="number"
                        value={bookDiscount}
                        onChange={(e) => setBookDiscount(Number(e.target.value))}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                      Referring Channel Partner / Broker
                    </label>
                    <select
                      value={bookChannelPartnerId}
                      onChange={(e) => setBookChannelPartnerId(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                    >
                      <option value="">Direct Company Sale (0% Brokerage)</option>
                      {channelPartners.map((cp) => (
                        <option key={cp.id} value={cp.id}>
                          {cp.name} ({cp.company_name || 'Partner'}) • {cp.default_commission_rate}% Commission
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setActiveTab('details')}
                      className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingBook}
                      className="px-5 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs shadow-sm disabled:opacity-50"
                    >
                      {isSubmittingBook ? 'Executing Concurrency Lock...' : 'Execute Atomic Booking Lock'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
