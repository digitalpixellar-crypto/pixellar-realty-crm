export type CompanyStatus = 'trial' | 'active' | 'suspended' | 'past_due' | 'cancelled';

export type MemberRole =
  | 'company_owner'
  | 'company_admin'
  | 'sales_manager'
  | 'sales_executive'
  | 'telecaller'
  | 'accounts'
  | 'viewer';

export type PlatformAdminRole = 'superadmin' | 'support';

export type PlanTier = 'Starter' | 'Growth' | 'Business' | 'Enterprise';
export type BillingCycle = 'monthly' | 'annual';

export interface SubscriptionPlan {
  id: string;
  name: PlanTier;
  slug: string;
  description: string;
  monthly_price_inr: number;
  annual_price_inr: number;
  max_users: number;
  max_projects: number;
  max_leads_per_month: number;
  storage_limit_mb: number;
  features: {
    custom_pipeline: boolean;
    bulk_import_export: boolean;
    round_robin_allocation: boolean;
    site_visits_mgmt: boolean;
    customer_payments: boolean;
    channel_partners: boolean;
    advanced_reports: boolean;
    webhooks_api: boolean;
    whatsapp_integration: boolean;
  };
  is_active: boolean;
  created_at: string;
}

export interface Company {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  phone?: string;
  email: string;
  address?: string;
  city?: string;
  state?: string;
  country: string;
  postal_code?: string;
  timezone: string; // default 'Asia/Kolkata'
  currency: string; // default 'INR'
  status: CompanyStatus;
  plan_id: string;
  trial_ends_at?: string;
  settings?: {
    hold_duration_hours?: number; // default 48
    enable_round_robin?: boolean;
    tax_identifier?: string;
    website?: string;
  };
  created_at: string;
  updated_at: string;
}

export interface PlatformAdmin {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  role: PlatformAdminRole;
  is_active: boolean;
  created_at: string;
}

export interface CompanySubscription {
  id: string;
  company_id: string;
  plan_id: string;
  billing_cycle: BillingCycle;
  razorpay_subscription_id?: string;
  razorpay_customer_id?: string;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'paused';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  grace_period_ends_at?: string;
  created_at: string;
}

export interface SubscriptionInvoice {
  id: string;
  company_id: string;
  subscription_id: string;
  razorpay_payment_id?: string;
  razorpay_order_id?: string;
  amount_inr: number;
  currency: string;
  status: 'paid' | 'failed' | 'refunded';
  invoice_number: string;
  invoice_pdf_url?: string;
  period_start: string;
  period_end: string;
  paid_at?: string;
  created_at: string;
}

export interface Branch {
  id: string;
  company_id: string;
  name: string;
  city?: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Team {
  id: string;
  company_id: string;
  branch_id?: string;
  name: string;
  manager_member_id?: string;
  created_at: string;
}

export interface CompanyMember {
  id: string;
  company_id: string;
  user_id: string;
  role: MemberRole;
  branch_id?: string;
  team_id?: string;
  name: string;
  email: string;
  phone?: string;
  title?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Invitation {
  id: string;
  company_id: string;
  invited_by_member_id: string;
  email: string;
  role: MemberRole;
  token: string;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  expires_at: string;
  accepted_at?: string;
  created_at: string;
}

export type ProjectCategory =
  | 'villa_plots'
  | 'apartments'
  | 'villas'
  | 'farm_plots'
  | 'commercial';

export type ProjectStatus = 'planning' | 'active' | 'sold_out' | 'completed';

export interface Project {
  id: string;
  company_id: string;
  name: string;
  code: string;
  description?: string;
  location: string;
  city: string;
  state: string;
  developer_name: string;
  category: ProjectCategory;
  approval_authority?: string; // e.g. DTCP, HMDA, RERA, BDA
  approval_number?: string;
  total_area?: number;
  area_unit?: string;
  amenities: string[];
  brochure_url?: string;
  layout_image_url?: string;
  status: ProjectStatus;
  created_at: string;
  updated_at: string;
}

export type UnitStatus = 'available' | 'on_hold' | 'booked' | 'sold' | 'blocked';
export type UnitFacing = 'East' | 'West' | 'North' | 'South' | 'North-East' | 'North-West' | 'South-East' | 'South-West';
export type AreaUnit = 'sqft' | 'sqyd' | 'sqm' | 'cents' | 'acres';

export interface ProjectUnit {
  id: string;
  company_id: string;
  project_id: string;
  unit_number: string;
  tower_block?: string;
  floor?: number;
  category: ProjectCategory;
  plot_or_unit_type: string; // e.g. "3BHK Luxury", "200 sq.yd Villa Plot"
  super_builtup_area?: number;
  carpet_area?: number;
  plot_area?: number;
  area_unit: AreaUnit;
  facing?: UnitFacing;
  base_price: number;
  additional_charges: { name: string; amount: number }[];
  total_price: number;
  status: UnitStatus;
  hold_expires_at?: string;
  held_by_lead_id?: string;
  booked_by_customer_id?: string;
  lock_version: number;
  created_at: string;
  updated_at: string;
}

export interface UnitHold {
  id: string;
  company_id: string;
  unit_id: string;
  lead_id: string;
  member_id: string;
  hold_amount: number;
  hold_expires_at: string;
  status: 'active' | 'converted' | 'expired' | 'released';
  notes?: string;
  created_at: string;
}

export type StageType =
  | 'new'
  | 'assigned'
  | 'contacted'
  | 'qualified'
  | 'site_visit_scheduled'
  | 'site_visit_completed'
  | 'negotiation'
  | 'booking'
  | 'won'
  | 'lost'
  | 'unqualified';

export interface PipelineStage {
  id: string;
  company_id: string;
  name: string;
  order_index: number;
  stage_type: StageType;
  color_hex: string;
  is_protected: boolean;
}

export type LeadPriority = 'low' | 'medium' | 'high' | 'urgent';
export type LeadTemperature = 'hot' | 'warm' | 'cold';
export type BuyingTimeline = 'immediate' | '1_month' | '3_months' | '6_months' | 'exploring';

export interface Lead {
  id: string;
  company_id: string;
  lead_number: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  alternate_phone?: string;
  normalized_phone: string;
  source: string; // e.g. "Website", "Meta Ads", "Walk-in", "Channel Partner", "Referral"
  campaign?: string;
  medium?: string;
  interested_project_id?: string;
  interested_property_type?: ProjectCategory;
  budget_min?: number;
  budget_max?: number;
  preferred_location?: string;
  assigned_member_id?: string;
  assigned_team_id?: string;
  stage_id: string;
  priority: LeadPriority;
  temperature: LeadTemperature;
  buying_timeline: BuyingTimeline;
  last_contacted_at?: string;
  next_followup_at?: string;
  lost_reason?: string;
  lost_notes?: string;
  tags: string[];
  custom_fields: Record<string, any>;
  is_duplicate: boolean;
  merged_into_lead_id?: string;
  created_at: string;
  updated_at: string;
}

export type ActivityType =
  | 'call'
  | 'meeting'
  | 'note'
  | 'stage_change'
  | 'assignment'
  | 'site_visit'
  | 'whatsapp'
  | 'email'
  | 'task';

export interface LeadActivity {
  id: string;
  company_id: string;
  lead_id: string;
  actor_member_id: string;
  activity_type: ActivityType;
  title: string;
  description?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

export type TaskType = 'call' | 'follow_up' | 'meeting' | 'site_visit_prep' | 'document_collection' | 'other';
export type TaskStatus = 'pending' | 'completed' | 'overdue' | 'cancelled';

export interface Task {
  id: string;
  company_id: string;
  lead_id?: string;
  project_id?: string;
  assigned_member_id: string;
  creator_member_id: string;
  task_type: TaskType;
  title: string;
  description?: string;
  priority: LeadPriority;
  due_date: string;
  status: TaskStatus;
  outcome?: string;
  completed_at?: string;
  created_at: string;
}

export type SiteVisitStatus = 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';

export interface SiteVisit {
  id: string;
  company_id: string;
  lead_id: string;
  project_id: string;
  assigned_member_id: string;
  scheduled_at: string;
  pickup_location?: string;
  transport_required: boolean;
  status: SiteVisitStatus;
  feedback?: string;
  objections?: string;
  rating?: number; // 1 to 5
  next_action?: string;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_id: string;
  lead_id?: string;
  first_name: string;
  last_name?: string;
  email?: string;
  phone: string;
  pan_number?: string;
  aadhar_number?: string;
  address?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  kyc_documents?: { name: string; url: string; type: string }[];
  created_at: string;
}

export type BookingStatus = 'draft' | 'confirmed' | 'cancellation_requested' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  company_id: string;
  booking_number: string;
  customer_id: string;
  unit_id: string;
  project_id: string;
  sales_member_id: string;
  channel_partner_id?: string;
  base_quoted_amount: number;
  discount_amount: number;
  net_sale_amount: number;
  booking_amount: number;
  status: BookingStatus;
  booking_date: string;
  agreement_date?: string;
  possession_date?: string;
  cancellation_reason?: string;
  cancellation_approved_by?: string;
  created_at: string;
  updated_at: string;
}

export interface BookingPaymentSchedule {
  id: string;
  company_id: string;
  booking_id: string;
  milestone_name: string;
  percentage: number;
  amount: number;
  due_date: string;
  status: 'pending' | 'partially_paid' | 'paid' | 'overdue';
  paid_amount: number;
  created_at: string;
}

export type PaymentMode = 'cheque' | 'neft_rtgs' | 'upi' | 'bank_transfer' | 'cash' | 'card';
export type PaymentStatus = 'recorded' | 'reconciled' | 'bounced' | 'rejected';

export interface CustomerPayment {
  id: string;
  company_id: string;
  booking_id: string;
  customer_id: string;
  schedule_id?: string;
  payment_number: string;
  amount: number;
  payment_mode: PaymentMode;
  transaction_reference?: string;
  bank_name?: string;
  payment_date: string;
  status: PaymentStatus;
  receipt_url?: string;
  notes?: string;
  recorded_by_member_id: string;
  reconciled_by_member_id?: string;
  reconciled_at?: string;
  created_at: string;
}

export interface ChannelPartner {
  id: string;
  company_id: string;
  name: string;
  company_name?: string;
  rera_registration_number?: string;
  phone: string;
  email?: string;
  pan_number?: string;
  bank_details?: {
    account_number?: string;
    ifsc_code?: string;
    bank_name?: string;
    beneficiary_name?: string;
  };
  commission_type: 'percentage' | 'fixed';
  default_commission_rate: number;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface Commission {
  id: string;
  company_id: string;
  channel_partner_id: string;
  booking_id: string;
  commission_type: 'percentage' | 'fixed';
  applied_rate: number; // captured snapshot at booking time
  total_commission_amount: number;
  status: 'pending' | 'approved' | 'paid' | 'cancelled';
  approved_by_member_id?: string;
  paid_at?: string;
  payment_reference?: string;
  created_at: string;
}

export interface Integration {
  id: string;
  company_id: string;
  provider: 'webhook' | 'meta_leads' | 'whatsapp_cloud' | 'sendgrid_smtp' | 'exotel_telephony';
  name: string;
  is_active: boolean;
  webhook_secret?: string;
  config: Record<string, any>;
  last_synced_at?: string;
  error_log?: { timestamp: string; message: string }[];
  created_at: string;
}

export interface AuditLog {
  id: string;
  company_id?: string;
  actor_member_id?: string;
  platform_admin_id?: string;
  action: string;
  entity_type: string;
  entity_id: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  created_at: string;
}

export interface Notification {
  id: string;
  company_id: string;
  recipient_member_id: string;
  title: string;
  message: string;
  type: 'lead_assigned' | 'followup_due' | 'site_visit_scheduled' | 'booking_created' | 'payment_recorded' | 'system';
  link?: string;
  is_read: boolean;
  read_at?: string;
  created_at: string;
}

export interface SupportAccessSession {
  id: string;
  platform_admin_id: string;
  company_id: string;
  reason: string;
  expires_at: string;
  created_at: string;
}

export interface RazorpayWebhookEvent {
  id: string;
  event_id: string;
  event_name: string;
  payload: Record<string, any>;
  processed: boolean;
  processed_at?: string;
  created_at: string;
}
