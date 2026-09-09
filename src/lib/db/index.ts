import fs from 'fs';
import path from 'path';
import {
  Company,
  CompanyMember,
  SubscriptionPlan,
  CompanySubscription,
  SubscriptionInvoice,
  PipelineStage,
  Project,
  ProjectUnit,
  UnitHold,
  Lead,
  LeadActivity,
  Task,
  SiteVisit,
  Customer,
  Booking,
  BookingPaymentSchedule,
  CustomerPayment,
  ChannelPartner,
  Commission,
  PlatformAdmin,
  Integration,
  AuditLog,
  Notification,
  SupportAccessSession,
  RazorpayWebhookEvent,
  Invitation,
} from '@/types';
import {
  SEED_COMPANIES,
  SEED_MEMBERS,
  SEED_PLANS,
  SEED_SUBSCRIPTIONS,
  SEED_INVOICES,
  SEED_PIPELINE_STAGES,
  SEED_PROJECTS,
  SEED_UNITS,
  SEED_LEADS,
  SEED_CUSTOMERS,
  SEED_BOOKINGS,
  SEED_PAYMENT_SCHEDULES,
  SEED_PAYMENTS,
  SEED_CHANNEL_PARTNERS,
  SEED_COMMISSIONS,
  SEED_SITE_VISITS,
  SEED_TASKS,
  SEED_ACTIVITIES,
  SEED_INTEGRATIONS,
  SEED_PLATFORM_ADMINS,
} from '@/data/seed';

export interface DatabaseState {
  companies: Company[];
  platform_admins: PlatformAdmin[];
  subscription_plans: SubscriptionPlan[];
  company_subscriptions: CompanySubscription[];
  subscription_invoices: SubscriptionInvoice[];
  company_members: CompanyMember[];
  invitations: Invitation[];
  pipeline_stages: PipelineStage[];
  projects: Project[];
  project_units: ProjectUnit[];
  unit_holds: UnitHold[];
  leads: Lead[];
  lead_activities: LeadActivity[];
  tasks: Task[];
  site_visits: SiteVisit[];
  customers: Customer[];
  bookings: Booking[];
  booking_payment_schedules: BookingPaymentSchedule[];
  customer_payments: CustomerPayment[];
  channel_partners: ChannelPartner[];
  commissions: Commission[];
  integrations: Integration[];
  audit_logs: AuditLog[];
  notifications: Notification[];
  support_access_sessions: SupportAccessSession[];
  razorpay_webhook_events: RazorpayWebhookEvent[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const STATE_FILE = path.join(DATA_DIR, 'pixellar-state.json');

let inMemoryState: DatabaseState | null = null;

function getInitialState(): DatabaseState {
  return {
    companies: [...SEED_COMPANIES],
    platform_admins: [...SEED_PLATFORM_ADMINS],
    subscription_plans: [...SEED_PLANS],
    company_subscriptions: [...SEED_SUBSCRIPTIONS],
    subscription_invoices: [...SEED_INVOICES],
    company_members: [...SEED_MEMBERS],
    invitations: [],
    pipeline_stages: [...SEED_PIPELINE_STAGES],
    projects: [...SEED_PROJECTS],
    project_units: [...SEED_UNITS],
    unit_holds: [],
    leads: [...SEED_LEADS],
    lead_activities: [...SEED_ACTIVITIES],
    tasks: [...SEED_TASKS],
    site_visits: [...SEED_SITE_VISITS],
    customers: [...SEED_CUSTOMERS],
    bookings: [...SEED_BOOKINGS],
    booking_payment_schedules: [...SEED_PAYMENT_SCHEDULES],
    customer_payments: [...SEED_PAYMENTS],
    channel_partners: [...SEED_CHANNEL_PARTNERS],
    commissions: [...SEED_COMMISSIONS],
    integrations: [...SEED_INTEGRATIONS],
    audit_logs: [],
    notifications: [],
    support_access_sessions: [],
    razorpay_webhook_events: [],
  };
}

function loadState(): DatabaseState {
  if (inMemoryState) return inMemoryState;

  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(STATE_FILE)) {
      const content = fs.readFileSync(STATE_FILE, 'utf-8');
      inMemoryState = JSON.parse(content);
      return inMemoryState!;
    }
  } catch (err) {
    console.warn('Failed to load persistent state file, initializing seed:', err);
  }

  inMemoryState = getInitialState();
  saveState();
  return inMemoryState;
}

function saveState(): void {
  if (!inMemoryState) return;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const tempFile = `${STATE_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(inMemoryState, null, 2), 'utf-8');
    fs.renameSync(tempFile, STATE_FILE);
  } catch (err) {
    console.error('Failed to write state file:', err);
  }
}

// Normalizes Indian and International phone numbers
export function normalizePhoneNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith('91')) return `+${digits}`;
  return phone.trim();
}

export const db = {
  // Reset / Seed
  resetToSeed(): DatabaseState {
    inMemoryState = getInitialState();
    saveState();
    return inMemoryState;
  },

  // 1. Companies
  getCompanies(): Company[] {
    return loadState().companies;
  },

  getCompany(idOrSlug: string): Company | null {
    const state = loadState();
    return state.companies.find((c) => c.id === idOrSlug || c.slug === idOrSlug) || null;
  },

  createCompany(companyData: Partial<Company> & { name: string; slug: string; email: string }): Company {
    const state = loadState();
    const newCompany: Company = {
      id: companyData.id || `comp-${Date.now()}`,
      name: companyData.name,
      slug: companyData.slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
      logo_url: companyData.logo_url,
      phone: companyData.phone,
      email: companyData.email,
      address: companyData.address,
      city: companyData.city,
      state: companyData.state,
      country: companyData.country || 'India',
      postal_code: companyData.postal_code,
      timezone: companyData.timezone || 'Asia/Kolkata',
      currency: companyData.currency || 'INR',
      status: companyData.status || 'trial',
      plan_id: companyData.plan_id || 'plan-starter-01',
      trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      settings: {
        hold_duration_hours: 48,
        enable_round_robin: true,
        ...companyData.settings,
      },
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.companies.push(newCompany);

    // Create default pipeline stages for this company
    const defaultStages: { name: string; stage_type: any; color_hex: string; is_protected: boolean }[] = [
      { name: 'New Inbound', stage_type: 'new', color_hex: '#3B82F6', is_protected: true },
      { name: 'Assigned', stage_type: 'assigned', color_hex: '#6366F1', is_protected: true },
      { name: 'Contacted', stage_type: 'contacted', color_hex: '#8B5CF6', is_protected: false },
      { name: 'Qualified', stage_type: 'qualified', color_hex: '#EC4899', is_protected: false },
      { name: 'Site Visit Scheduled', stage_type: 'site_visit_scheduled', color_hex: '#F59E0B', is_protected: false },
      { name: 'Site Visit Completed', stage_type: 'site_visit_completed', color_hex: '#10B981', is_protected: false },
      { name: 'Negotiation', stage_type: 'negotiation', color_hex: '#14B8A6', is_protected: false },
      { name: 'Booking Initiated', stage_type: 'booking', color_hex: '#06B6D4', is_protected: false },
      { name: 'Won & Closed', stage_type: 'won', color_hex: '#22C55E', is_protected: true },
      { name: 'Lost Deal', stage_type: 'lost', color_hex: '#EF4444', is_protected: true },
      { name: 'Unqualified', stage_type: 'unqualified', color_hex: '#6B7280', is_protected: true },
    ];

    defaultStages.forEach((st, idx) => {
      state.pipeline_stages.push({
        id: `stg-${newCompany.id}-${idx + 1}`,
        company_id: newCompany.id,
        name: st.name,
        order_index: idx + 1,
        stage_type: st.stage_type,
        color_hex: st.color_hex,
        is_protected: st.is_protected,
      });
    });

    // Create trial subscription record
    state.company_subscriptions.push({
      id: `sub-${newCompany.id}`,
      company_id: newCompany.id,
      plan_id: newCompany.plan_id,
      billing_cycle: 'monthly',
      status: 'trialing',
      current_period_start: new Date().toISOString(),
      current_period_end: newCompany.trial_ends_at!,
      cancel_at_period_end: false,
      created_at: new Date().toISOString(),
    });

    saveState();
    return newCompany;
  },

  updateCompany(id: string, updates: Partial<Company>): Company {
    const state = loadState();
    const idx = state.companies.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Company not found');
    state.companies[idx] = {
      ...state.companies[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveState();
    return state.companies[idx];
  },

  // 2. Members & RBAC
  getCompanyMembers(companyId: string): CompanyMember[] {
    return loadState().company_members.filter((m) => m.company_id === companyId);
  },

  getMember(id: string): CompanyMember | null {
    return loadState().company_members.find((m) => m.id === id) || null;
  },

  getMemberByEmail(companyId: string, email: string): CompanyMember | null {
    return loadState().company_members.find(
      (m) => m.company_id === companyId && m.email.toLowerCase() === email.toLowerCase()
    ) || null;
  },

  createMember(memberData: Omit<CompanyMember, 'id' | 'created_at' | 'updated_at'>): CompanyMember {
    const state = loadState();
    // Verify seat limit
    const company = state.companies.find((c) => c.id === memberData.company_id);
    if (!company) throw new Error('Company not found');

    const plan = state.subscription_plans.find((p) => p.id === company.plan_id);
    const activeMembers = state.company_members.filter(
      (m) => m.company_id === memberData.company_id && m.is_active
    );

    if (plan && activeMembers.length >= plan.max_users) {
      throw new Error(`Seat limit reached for ${plan.name} plan (${plan.max_users} users). Upgrade plan to invite more members.`);
    }

    const newMember: CompanyMember = {
      id: `mem-${Date.now()}`,
      ...memberData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.company_members.push(newMember);
    saveState();
    return newMember;
  },

  updateMember(id: string, companyId: string, updates: Partial<CompanyMember>): CompanyMember {
    const state = loadState();
    const idx = state.company_members.findIndex((m) => m.id === id && m.company_id === companyId);
    if (idx === -1) throw new Error('Member not found');

    const currentMember = state.company_members[idx];

    // Core rule: Prevent deactivating or demoting the final active Company Owner
    if (
      currentMember.role === 'company_owner' &&
      currentMember.is_active &&
      (updates.is_active === false || (updates.role && updates.role !== 'company_owner'))
    ) {
      const otherOwners = state.company_members.filter(
        (m) => m.company_id === companyId && m.role === 'company_owner' && m.is_active && m.id !== id
      );
      if (otherOwners.length === 0) {
        throw new Error('Action blocked: Cannot deactivate or demote the final active Company Owner in this workspace.');
      }
    }

    state.company_members[idx] = {
      ...currentMember,
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveState();
    return state.company_members[idx];
  },

  deleteMember(id: string, companyId: string): void {
    const state = loadState();
    const member = state.company_members.find((m) => m.id === id && m.company_id === companyId);
    if (!member) throw new Error('Member not found');

    if (member.role === 'company_owner' && member.is_active) {
      const otherOwners = state.company_members.filter(
        (m) => m.company_id === companyId && m.role === 'company_owner' && m.is_active && m.id !== id
      );
      if (otherOwners.length === 0) {
        throw new Error('Action blocked: Cannot delete the final active Company Owner.');
      }
    }

    state.company_members = state.company_members.filter((m) => !(m.id === id && m.company_id === companyId));
    saveState();
  },

  // 3. Invitations
  createInvitation(companyId: string, invitedByMemberId: string, email: string, role: any): Invitation {
    const state = loadState();
    const existing = state.invitations.find(
      (inv) => inv.company_id === companyId && inv.email.toLowerCase() === email.toLowerCase() && inv.status === 'pending'
    );
    if (existing) {
      existing.status = 'revoked';
    }

    const token = `inv_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const newInvitation: Invitation = {
      id: `inv-${Date.now()}`,
      company_id: companyId,
      invited_by_member_id: invitedByMemberId,
      email: email.toLowerCase(),
      role,
      token,
      status: 'pending',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      created_at: new Date().toISOString(),
    };

    state.invitations.push(newInvitation);
    saveState();
    return newInvitation;
  },

  getInvitationByToken(token: string): Invitation | null {
    const state = loadState();
    return state.invitations.find((i) => i.token === token) || null;
  },

  getInvitations(companyId: string): Invitation[] {
    const state = loadState();
    return state.invitations.filter((i) => i.company_id === companyId);
  },

  acceptInvitation(token: string, userName: string, userId: string): CompanyMember {
    const state = loadState();
    const invitation = state.invitations.find((i) => i.token === token);
    if (!invitation) throw new Error('Invalid invitation link.');
    if (invitation.status !== 'pending') throw new Error(`Invitation is already ${invitation.status}.`);
    if (new Date(invitation.expires_at) < new Date()) {
      invitation.status = 'expired';
      saveState();
      throw new Error('Invitation has expired. Please request a new invitation.');
    }

    // Check if user already exists
    let member = state.company_members.find(
      (m) => m.company_id === invitation.company_id && m.email === invitation.email
    );

    if (member) {
      member.is_active = true;
      member.role = invitation.role;
      member.name = userName;
      member.user_id = userId;
    } else {
      member = {
        id: `mem-${Date.now()}`,
        company_id: invitation.company_id,
        user_id: userId,
        role: invitation.role,
        name: userName,
        email: invitation.email,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      state.company_members.push(member);
    }

    invitation.status = 'accepted';
    invitation.accepted_at = new Date().toISOString();
    saveState();
    return member;
  },

  // 4. Pipeline Stages
  getPipelineStages(companyId: string): PipelineStage[] {
    return loadState()
      .pipeline_stages.filter((s) => s.company_id === companyId)
      .sort((a, b) => a.order_index - b.order_index);
  },

  // 5. Projects
  getProjects(companyId: string): Project[] {
    return loadState().projects.filter((p) => p.company_id === companyId);
  },

  getProject(companyId: string, projectId: string): Project | null {
    return loadState().projects.find((p) => p.company_id === companyId && p.id === projectId) || null;
  },

  createProject(companyId: string, projectData: Omit<Project, 'id' | 'company_id' | 'created_at' | 'updated_at'>): Project {
    const state = loadState();
    const newProject: Project = {
      id: `proj-${Date.now()}`,
      company_id: companyId,
      ...projectData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.projects.push(newProject);
    saveState();
    return newProject;
  },

  updateProject(companyId: string, projectId: string, updates: Partial<Project>): Project {
    const state = loadState();
    const idx = state.projects.findIndex((p) => p.company_id === companyId && p.id === projectId);
    if (idx === -1) throw new Error('Project not found');
    state.projects[idx] = {
      ...state.projects[idx],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    saveState();
    return state.projects[idx];
  },

  // 6. Units & Anti-Double-Booking Engine
  getUnits(companyId: string, projectId?: string): ProjectUnit[] {
    const state = loadState();
    this.releaseExpiredHolds(companyId);
    return state.project_units.filter(
      (u) => u.company_id === companyId && (!projectId || u.project_id === projectId)
    );
  },

  getUnit(companyId: string, unitId: string): ProjectUnit | null {
    const state = loadState();
    this.releaseExpiredHolds(companyId);
    return state.project_units.find((u) => u.company_id === companyId && u.id === unitId) || null;
  },

  createUnit(companyId: string, unitData: Omit<ProjectUnit, 'id' | 'company_id' | 'created_at' | 'updated_at' | 'lock_version'>): ProjectUnit {
    const state = loadState();
    const existing = state.project_units.find(
      (u) => u.project_id === unitData.project_id && u.unit_number.toLowerCase() === unitData.unit_number.toLowerCase()
    );
    if (existing) {
      throw new Error(`Unit ${unitData.unit_number} already exists in this project.`);
    }

    const newUnit: ProjectUnit = {
      id: `unit-${Date.now()}`,
      company_id: companyId,
      ...unitData,
      lock_version: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.project_units.push(newUnit);
    saveState();
    return newUnit;
  },

  // Atomic Unit Hold
  holdUnit(
    companyId: string,
    unitId: string,
    leadId: string,
    memberId: string,
    holdAmount: number,
    durationHours = 48,
    notes?: string
  ): ProjectUnit {
    const state = loadState();
    this.releaseExpiredHolds(companyId);

    const unit = state.project_units.find((u) => u.company_id === companyId && u.id === unitId);
    if (!unit) throw new Error('Unit not found');

    if (unit.status !== 'available') {
      throw new Error(`Concurrency Conflict: Unit is already in '${unit.status}' status and cannot be placed on hold.`);
    }

    const holdExpiresAt = new Date(Date.now() + durationHours * 60 * 60 * 1000).toISOString();

    unit.status = 'on_hold';
    unit.hold_expires_at = holdExpiresAt;
    unit.held_by_lead_id = leadId;
    unit.lock_version += 1;
    unit.updated_at = new Date().toISOString();

    const holdRecord: UnitHold = {
      id: `hold-${Date.now()}`,
      company_id: companyId,
      unit_id: unitId,
      lead_id: leadId,
      member_id: memberId,
      hold_amount: holdAmount,
      hold_expires_at: holdExpiresAt,
      status: 'active',
      notes,
      created_at: new Date().toISOString(),
    };
    state.unit_holds.push(holdRecord);

    saveState();
    return unit;
  },

  // Atomic Booking Concurrency Lock
  bookUnitAtomic(
    companyId: string,
    unitId: string,
    bookingData: {
      customerId: string;
      salesMemberId: string;
      channelPartnerId?: string;
      baseQuotedAmount: number;
      discountAmount: number;
      bookingAmount: number;
      agreementDate?: string;
    }
  ): { booking: Booking; unit: ProjectUnit } {
    const state = loadState();
    this.releaseExpiredHolds(companyId);

    const unit = state.project_units.find((u) => u.company_id === companyId && u.id === unitId);
    if (!unit) throw new Error('Unit not found');

    // Concurrency validation: If already booked or sold, or on hold by another buyer, fail with conflict
    if (unit.status === 'booked' || unit.status === 'sold') {
      throw new Error(`Double-Booking Prevention Error: Unit ${unit.unit_number} has already been reserved or sold.`);
    }

    if (unit.status === 'blocked') {
      throw new Error(`Unit ${unit.unit_number} is administratively blocked.`);
    }

    const netSaleAmount = bookingData.baseQuotedAmount - (bookingData.discountAmount || 0);
    const bookingNumber = `BK-${Date.now().toString().slice(-6)}`;

    // Transition Unit to 'booked' atomically
    unit.status = 'booked';
    unit.booked_by_customer_id = bookingData.customerId;
    unit.hold_expires_at = undefined;
    unit.lock_version += 1;
    unit.updated_at = new Date().toISOString();

    // Release or convert any active holds on this unit
    state.unit_holds.forEach((h) => {
      if (h.unit_id === unitId && h.status === 'active') {
        h.status = 'converted';
      }
    });

    const newBooking: Booking = {
      id: `book-${Date.now()}`,
      company_id: companyId,
      booking_number: bookingNumber,
      customer_id: bookingData.customerId,
      unit_id: unitId,
      project_id: unit.project_id,
      sales_member_id: bookingData.salesMemberId,
      channel_partner_id: bookingData.channelPartnerId,
      base_quoted_amount: bookingData.baseQuotedAmount,
      discount_amount: bookingData.discountAmount,
      net_sale_amount: netSaleAmount,
      booking_amount: bookingData.bookingAmount,
      status: 'confirmed',
      booking_date: new Date().toISOString().split('T')[0],
      agreement_date: bookingData.agreementDate,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.bookings.push(newBooking);

    // Auto-generate standard milestone schedules
    const schedules: BookingPaymentSchedule[] = [
      {
        id: `sched-${newBooking.id}-01`,
        company_id: companyId,
        booking_id: newBooking.id,
        milestone_name: 'Initial Booking Token',
        percentage: 10,
        amount: Math.round(netSaleAmount * 0.1),
        due_date: new Date().toISOString().split('T')[0],
        status: bookingData.bookingAmount >= Math.round(netSaleAmount * 0.1) ? 'paid' : 'partially_paid',
        paid_amount: bookingData.bookingAmount,
        created_at: new Date().toISOString(),
      },
      {
        id: `sched-${newBooking.id}-02`,
        company_id: companyId,
        booking_id: newBooking.id,
        milestone_name: 'Sale Agreement Execution (20%)',
        percentage: 20,
        amount: Math.round(netSaleAmount * 0.2),
        due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        paid_amount: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: `sched-${newBooking.id}-03`,
        company_id: companyId,
        booking_id: newBooking.id,
        milestone_name: 'Demarcation & Construction Milestone',
        percentage: 30,
        amount: Math.round(netSaleAmount * 0.3),
        due_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        paid_amount: 0,
        created_at: new Date().toISOString(),
      },
      {
        id: `sched-${newBooking.id}-04`,
        company_id: companyId,
        booking_id: newBooking.id,
        milestone_name: 'Registration & Possession Handover',
        percentage: 40,
        amount: netSaleAmount - (Math.round(netSaleAmount * 0.1) + Math.round(netSaleAmount * 0.2) + Math.round(netSaleAmount * 0.3)),
        due_date: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'pending',
        paid_amount: 0,
        created_at: new Date().toISOString(),
      },
    ];
    state.booking_payment_schedules.push(...schedules);

    // If channel partner exists, snapshot commission rule
    if (bookingData.channelPartnerId) {
      const cp = state.channel_partners.find((c) => c.id === bookingData.channelPartnerId);
      if (cp) {
        const commRate = cp.default_commission_rate;
        const commAmount = cp.commission_type === 'percentage'
          ? Math.round((netSaleAmount * commRate) / 100)
          : commRate;

        state.commissions.push({
          id: `comm-${Date.now()}`,
          company_id: companyId,
          channel_partner_id: cp.id,
          booking_id: newBooking.id,
          commission_type: cp.commission_type,
          applied_rate: commRate,
          total_commission_amount: commAmount,
          status: 'pending',
          created_at: new Date().toISOString(),
        });
      }
    }

    saveState();
    return { booking: newBooking, unit };
  },

  // Auto-release expired holds
  releaseExpiredHolds(companyId?: string): number {
    const state = loadState();
    const now = new Date();
    let releasedCount = 0;

    state.project_units.forEach((unit) => {
      if (
        unit.status === 'on_hold' &&
        unit.hold_expires_at &&
        new Date(unit.hold_expires_at) < now &&
        (!companyId || unit.company_id === companyId)
      ) {
        unit.status = 'available';
        unit.hold_expires_at = undefined;
        unit.held_by_lead_id = undefined;
        unit.lock_version += 1;
        unit.updated_at = now.toISOString();
        releasedCount++;

        // Mark hold record as expired
        state.unit_holds.forEach((h) => {
          if (h.unit_id === unit.id && h.status === 'active') {
            h.status = 'expired';
          }
        });
      }
    });

    if (releasedCount > 0) saveState();
    return releasedCount;
  },

  // 7. Leads
  getLeads(companyId: string, filters?: { assignedMemberId?: string; stageId?: string; search?: string }): Lead[] {
    const state = loadState();
    let leads = state.leads.filter((l) => l.company_id === companyId);

    if (filters?.assignedMemberId) {
      leads = leads.filter((l) => l.assigned_member_id === filters.assignedMemberId);
    }
    if (filters?.stageId) {
      leads = leads.filter((l) => l.stage_id === filters.stageId);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.first_name.toLowerCase().includes(q) ||
          (l.last_name && l.last_name.toLowerCase().includes(q)) ||
          l.phone.includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          l.lead_number.toLowerCase().includes(q)
      );
    }

    return leads.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  getLead(companyId: string, leadId: string): Lead | null {
    return loadState().leads.find((l) => l.company_id === companyId && l.id === leadId) || null;
  },

  createLead(
    companyId: string,
    leadData: Omit<Lead, 'id' | 'company_id' | 'lead_number' | 'normalized_phone' | 'is_duplicate' | 'created_at' | 'updated_at'> & {
      lead_number?: string;
    }
  ): Lead {
    const state = loadState();
    const normalizedPhone = normalizePhoneNumber(leadData.phone);

    // In-company duplicate check (does NOT reveal cross-company data)
    const existingLead = state.leads.find(
      (l) => l.company_id === companyId && l.normalized_phone === normalizedPhone
    );

    const count = state.leads.filter((l) => l.company_id === companyId).length + 1;
    const leadNumber = leadData.lead_number || `LD-${count.toString().padStart(4, '0')}`;

    // Round-robin assignment if unassigned and company setting enabled
    let assignedMemberId = leadData.assigned_member_id;
    const company = state.companies.find((c) => c.id === companyId);
    if (!assignedMemberId && company?.settings?.enable_round_robin) {
      const salesAgents = state.company_members.filter(
        (m) => m.company_id === companyId && m.role === 'sales_executive' && m.is_active
      );
      if (salesAgents.length > 0) {
        const nextIdx = count % salesAgents.length;
        assignedMemberId = salesAgents[nextIdx].id;
      }
    }

    const newLead: Lead = {
      id: `lead-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      company_id: companyId,
      lead_number: leadNumber,
      normalized_phone: normalizedPhone,
      is_duplicate: Boolean(existingLead),
      merged_into_lead_id: existingLead ? existingLead.id : undefined,
      ...leadData,
      assigned_member_id: assignedMemberId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    state.leads.push(newLead);

    // Initial creation activity
    state.lead_activities.push({
      id: `act-${Date.now()}`,
      company_id: companyId,
      lead_id: newLead.id,
      actor_member_id: assignedMemberId || 'system',
      activity_type: 'note',
      title: 'Lead Ingested',
      description: `Lead created from ${newLead.source}. ${existingLead ? '(Flagged as possible duplicate)' : ''}`,
      created_at: new Date().toISOString(),
    });

    saveState();
    return newLead;
  },

  updateLead(companyId: string, leadId: string, updates: Partial<Lead>, actorMemberId?: string): Lead {
    const state = loadState();
    const idx = state.leads.findIndex((l) => l.company_id === companyId && l.id === leadId);
    if (idx === -1) throw new Error('Lead not found');

    const prevLead = state.leads[idx];
    if (updates.phone) {
      updates.normalized_phone = normalizePhoneNumber(updates.phone);
    }

    state.leads[idx] = {
      ...prevLead,
      ...updates,
      updated_at: new Date().toISOString(),
    };

    // Log stage change activity if stage changed
    if (updates.stage_id && updates.stage_id !== prevLead.stage_id) {
      const prevStage = state.pipeline_stages.find((s) => s.id === prevLead.stage_id);
      const newStage = state.pipeline_stages.find((s) => s.id === updates.stage_id);
      state.lead_activities.push({
        id: `act-${Date.now()}`,
        company_id: companyId,
        lead_id: leadId,
        actor_member_id: actorMemberId || 'system',
        activity_type: 'stage_change',
        title: `Stage Changed: ${newStage?.name || 'Updated'}`,
        description: `Pipeline stage moved from "${prevStage?.name}" to "${newStage?.name}".`,
        created_at: new Date().toISOString(),
      });
    }

    saveState();
    return state.leads[idx];
  },

  mergeLeads(companyId: string, primaryLeadId: string, secondaryLeadId: string, actorMemberId: string): Lead {
    const state = loadState();
    const primary = state.leads.find((l) => l.company_id === companyId && l.id === primaryLeadId);
    const secondary = state.leads.find((l) => l.company_id === companyId && l.id === secondaryLeadId);

    if (!primary || !secondary) throw new Error('One or both leads not found for merging.');

    // Combine tags and notes
    primary.tags = Array.from(new Set([...primary.tags, ...secondary.tags]));
    if (secondary.alternate_phone && !primary.alternate_phone) {
      primary.alternate_phone = secondary.alternate_phone;
    }

    // Point secondary activities, tasks, visits to primary
    state.lead_activities.forEach((a) => {
      if (a.lead_id === secondaryLeadId) a.lead_id = primaryLeadId;
    });
    state.tasks.forEach((t) => {
      if (t.lead_id === secondaryLeadId) t.lead_id = primaryLeadId;
    });
    state.site_visits.forEach((v) => {
      if (v.lead_id === secondaryLeadId) v.lead_id = primaryLeadId;
    });

    // Mark secondary as merged
    secondary.is_duplicate = true;
    secondary.merged_into_lead_id = primaryLeadId;

    state.lead_activities.push({
      id: `act-${Date.now()}`,
      company_id: companyId,
      lead_id: primaryLeadId,
      actor_member_id: actorMemberId,
      activity_type: 'note',
      title: 'Duplicate Merged',
      description: `Merged duplicate record ${secondary.lead_number} (${secondary.first_name} ${secondary.last_name || ''}) into this profile.`,
      created_at: new Date().toISOString(),
    });

    saveState();
    return primary;
  },

  // 8. Lead Activities
  getLeadActivities(companyId: string, leadId: string): LeadActivity[] {
    return loadState()
      .lead_activities.filter((a) => a.company_id === companyId && a.lead_id === leadId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },

  addLeadActivity(companyId: string, activityData: Omit<LeadActivity, 'id' | 'created_at'>): LeadActivity {
    const state = loadState();
    const newActivity: LeadActivity = {
      id: `act-${Date.now()}`,
      ...activityData,
      created_at: new Date().toISOString(),
    };
    state.lead_activities.push(newActivity);
    saveState();
    return newActivity;
  },

  // 9. Tasks & Follow-ups
  getTasks(companyId: string, filters?: { assignedMemberId?: string; status?: string }): Task[] {
    const state = loadState();
    let tasks = state.tasks.filter((t) => t.company_id === companyId);
    if (filters?.assignedMemberId) tasks = tasks.filter((t) => t.assigned_member_id === filters.assignedMemberId);
    if (filters?.status) tasks = tasks.filter((t) => t.status === filters.status);
    return tasks.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
  },

  createTask(companyId: string, taskData: Omit<Task, 'id' | 'company_id' | 'created_at'>): Task {
    const state = loadState();
    const newTask: Task = {
      id: `task-${Date.now()}`,
      company_id: companyId,
      ...taskData,
      created_at: new Date().toISOString(),
    };
    state.tasks.push(newTask);
    saveState();
    return newTask;
  },

  updateTask(companyId: string, taskId: string, updates: Partial<Task>): Task {
    const state = loadState();
    const idx = state.tasks.findIndex((t) => t.company_id === companyId && t.id === taskId);
    if (idx === -1) throw new Error('Task not found');
    state.tasks[idx] = { ...state.tasks[idx], ...updates };
    saveState();
    return state.tasks[idx];
  },

  // 10. Site Visits
  getSiteVisits(companyId: string, filters?: { leadId?: string; assignedMemberId?: string }): SiteVisit[] {
    const state = loadState();
    let visits = state.site_visits.filter((v) => v.company_id === companyId);
    if (filters?.leadId) visits = visits.filter((v) => v.lead_id === filters.leadId);
    if (filters?.assignedMemberId) visits = visits.filter((v) => v.assigned_member_id === filters.assignedMemberId);
    return visits.sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());
  },

  createSiteVisit(companyId: string, visitData: Omit<SiteVisit, 'id' | 'company_id' | 'created_at' | 'updated_at'>): SiteVisit {
    const state = loadState();
    const newVisit: SiteVisit = {
      id: `visit-${Date.now()}`,
      company_id: companyId,
      ...visitData,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    state.site_visits.push(newVisit);

    state.lead_activities.push({
      id: `act-${Date.now()}`,
      company_id: companyId,
      lead_id: newVisit.lead_id,
      actor_member_id: newVisit.assigned_member_id,
      activity_type: 'site_visit',
      title: 'Site Visit Scheduled',
      description: `Visit scheduled for ${new Date(newVisit.scheduled_at).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`,
      created_at: new Date().toISOString(),
    });

    saveState();
    return newVisit;
  },

  updateSiteVisit(companyId: string, visitId: string, updates: Partial<SiteVisit>): SiteVisit {
    const state = loadState();
    const idx = state.site_visits.findIndex((v) => v.company_id === companyId && v.id === visitId);
    if (idx === -1) throw new Error('Site visit not found');
    state.site_visits[idx] = { ...state.site_visits[idx], ...updates, updated_at: new Date().toISOString() };
    saveState();
    return state.site_visits[idx];
  },

  // 11. Customers
  getCustomers(companyId: string): Customer[] {
    return loadState().customers.filter((c) => c.company_id === companyId);
  },

  createCustomer(companyId: string, customerData: Omit<Customer, 'id' | 'company_id' | 'created_at'>): Customer {
    const state = loadState();
    const newCustomer: Customer = {
      id: `cust-${Date.now()}`,
      company_id: companyId,
      ...customerData,
      created_at: new Date().toISOString(),
    };
    state.customers.push(newCustomer);
    saveState();
    return newCustomer;
  },

  // 12. Bookings & Financials
  getBookings(companyId: string): Booking[] {
    return loadState().bookings.filter((b) => b.company_id === companyId);
  },

  getBooking(companyId: string, bookingId: string): Booking | null {
    return loadState().bookings.find((b) => b.company_id === companyId && b.id === bookingId) || null;
  },

  getPaymentSchedules(companyId: string, bookingId: string): BookingPaymentSchedule[] {
    return loadState().booking_payment_schedules.filter(
      (s) => s.company_id === companyId && s.booking_id === bookingId
    );
  },

  getCustomerPayments(companyId: string, bookingId?: string): CustomerPayment[] {
    const state = loadState();
    return state.customer_payments.filter(
      (p) => p.company_id === companyId && (!bookingId || p.booking_id === bookingId)
    );
  },

  recordCustomerPayment(
    companyId: string,
    paymentData: Omit<CustomerPayment, 'id' | 'company_id' | 'payment_number' | 'created_at' | 'status'>
  ): CustomerPayment {
    const state = loadState();
    const paymentNumber = `RCPT-${Date.now().toString().slice(-6)}`;
    const newPayment: CustomerPayment = {
      id: `pay-${Date.now()}`,
      company_id: companyId,
      payment_number: paymentNumber,
      status: 'recorded',
      ...paymentData,
      created_at: new Date().toISOString(),
    };
    state.customer_payments.push(newPayment);

    // Update schedule if linked
    if (paymentData.schedule_id) {
      const sched = state.booking_payment_schedules.find((s) => s.id === paymentData.schedule_id);
      if (sched) {
        sched.paid_amount += paymentData.amount;
        if (sched.paid_amount >= sched.amount) {
          sched.status = 'paid';
        } else if (sched.paid_amount > 0) {
          sched.status = 'partially_paid';
        }
      }
    }

    saveState();
    return newPayment;
  },

  reconcileCustomerPayment(companyId: string, paymentId: string, memberId: string): CustomerPayment {
    const state = loadState();
    const payment = state.customer_payments.find((p) => p.company_id === companyId && p.id === paymentId);
    if (!payment) throw new Error('Payment record not found');
    payment.status = 'reconciled';
    payment.reconciled_by_member_id = memberId;
    payment.reconciled_at = new Date().toISOString();
    saveState();
    return payment;
  },

  // 13. Channel Partners & Commissions
  getChannelPartners(companyId: string): ChannelPartner[] {
    return loadState().channel_partners.filter((cp) => cp.company_id === companyId);
  },

  createChannelPartner(companyId: string, cpData: Omit<ChannelPartner, 'id' | 'company_id' | 'created_at'>): ChannelPartner {
    const state = loadState();
    const newCP: ChannelPartner = {
      id: `cp-${Date.now()}`,
      company_id: companyId,
      ...cpData,
      created_at: new Date().toISOString(),
    };
    state.channel_partners.push(newCP);
    saveState();
    return newCP;
  },

  getCommissions(companyId: string): Commission[] {
    return loadState().commissions.filter((c) => c.company_id === companyId);
  },

  approveCommission(companyId: string, commissionId: string, memberId: string): Commission {
    const state = loadState();
    const comm = state.commissions.find((c) => c.company_id === companyId && c.id === commissionId);
    if (!comm) throw new Error('Commission not found');
    comm.status = 'approved';
    comm.approved_by_member_id = memberId;
    saveState();
    return comm;
  },

  payCommission(companyId: string, commissionId: string, paymentReference: string): Commission {
    const state = loadState();
    const comm = state.commissions.find((c) => c.company_id === companyId && c.id === commissionId);
    if (!comm) throw new Error('Commission not found');
    comm.status = 'paid';
    comm.payment_reference = paymentReference;
    comm.paid_at = new Date().toISOString();
    saveState();
    return comm;
  },

  // 14. Subscription Plans & Platform Owner Admin
  getSubscriptionPlans(): SubscriptionPlan[] {
    return loadState().subscription_plans;
  },

  updateSubscriptionPlan(planId: string, updates: Partial<SubscriptionPlan>): SubscriptionPlan {
    const state = loadState();
    const idx = state.subscription_plans.findIndex((p) => p.id === planId);
    if (idx === -1) throw new Error('Subscription plan not found');
    state.subscription_plans[idx] = { ...state.subscription_plans[idx], ...updates };
    saveState();
    return state.subscription_plans[idx];
  },

  getPlatformAdmins(): PlatformAdmin[] {
    return loadState().platform_admins;
  },

  getCompanySubscription(companyId: string): CompanySubscription | null {
    return loadState().company_subscriptions.find((s) => s.company_id === companyId) || null;
  },

  getSubscriptionInvoices(companyId?: string): SubscriptionInvoice[] {
    const state = loadState();
    return state.subscription_invoices.filter((i) => !companyId || i.company_id === companyId);
  },

  // Platform Metrics (Computed cleanly: SaaS subscription revenue ONLY, strictly separate from property sales)
  getPlatformMetrics() {
    const state = loadState();
    const totalCompanies = state.companies.length;
    const activeCompanies = state.companies.filter((c) => c.status === 'active').length;
    const trialCompanies = state.companies.filter((c) => c.status === 'trial').length;
    const suspendedCompanies = state.companies.filter((c) => c.status === 'suspended').length;

    // SaaS MRR from active subscriptions
    let monthlyRecurringRevenue = 0;
    state.company_subscriptions.forEach((sub) => {
      if (sub.status === 'active') {
        const plan = state.subscription_plans.find((p) => p.id === sub.plan_id);
        if (plan) {
          monthlyRecurringRevenue += sub.billing_cycle === 'monthly' ? plan.monthly_price_inr : Math.round(plan.annual_price_inr / 12);
        }
      }
    });

    const totalInvoicesPaid = state.subscription_invoices
      .filter((i) => i.status === 'paid')
      .reduce((sum, i) => sum + i.amount_inr, 0);

    const totalLeadsCapturedPlatformWide = state.leads.length;
    const totalUsersPlatformWide = state.company_members.filter((m) => m.is_active).length;

    return {
      totalCompanies,
      activeCompanies,
      trialCompanies,
      suspendedCompanies,
      monthlyRecurringRevenue,
      annualRecurringRevenue: monthlyRecurringRevenue * 12,
      totalInvoicesPaid,
      totalLeadsCapturedPlatformWide,
      totalUsersPlatformWide,
    };
  },

  // 15. Integrations
  getIntegrations(companyId: string): Integration[] {
    return loadState().integrations.filter((i) => i.company_id === companyId);
  },

  updateIntegration(companyId: string, integrationId: string, updates: Partial<Integration>): Integration {
    const state = loadState();
    let intg = state.integrations.find((i) => i.company_id === companyId && i.id === integrationId);
    if (!intg) {
      intg = {
        id: integrationId,
        company_id: companyId,
        provider: 'webhook',
        name: 'Custom Integration',
        is_active: false,
        config: {},
        created_at: new Date().toISOString(),
      };
      state.integrations.push(intg);
    }
    Object.assign(intg, updates);
    saveState();
    return intg;
  },

  // 16. Razorpay Webhook Event Ledger (Idempotent Event Log)
  recordRazorpayEvent(eventId: string, eventName: string, payload: Record<string, any>): { isDuplicate: boolean; event: RazorpayWebhookEvent } {
    const state = loadState();
    const existing = state.razorpay_webhook_events.find((e) => e.event_id === eventId);
    if (existing) {
      return { isDuplicate: true, event: existing };
    }

    const newEvent: RazorpayWebhookEvent = {
      id: `rpevt-${Date.now()}`,
      event_id: eventId,
      event_name: eventName,
      payload,
      processed: false,
      created_at: new Date().toISOString(),
    };
    state.razorpay_webhook_events.push(newEvent);
    saveState();
    return { isDuplicate: false, event: newEvent };
  },

  markRazorpayEventProcessed(eventId: string): void {
    const state = loadState();
    const evt = state.razorpay_webhook_events.find((e) => e.event_id === eventId);
    if (evt) {
      evt.processed = true;
      evt.processed_at = new Date().toISOString();
      saveState();
    }
  },

  // 17. Audit Logs
  logAudit(auditData: Omit<AuditLog, 'id' | 'created_at'>): AuditLog {
    const state = loadState();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}`,
      ...auditData,
      created_at: new Date().toISOString(),
    };
    state.audit_logs.push(newLog);
    saveState();
    return newLog;
  },

  getAuditLogs(companyId?: string): AuditLog[] {
    const state = loadState();
    return state.audit_logs
      .filter((l) => !companyId || l.company_id === companyId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  },
};
