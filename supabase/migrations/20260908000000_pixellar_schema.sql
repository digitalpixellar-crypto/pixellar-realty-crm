-- =========================================================================
-- PIXELLAR REALTY CRM - CORE MULTI-TENANT DATABASE SCHEMA WITH RLS
-- Product Owner: K. Yeswanth Kumar Reddy
-- Organization: Digital Pixellar
-- =========================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. SUBSCRIPTION PLANS (Platform Level)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(50) NOT NULL UNIQUE,
  slug VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  monthly_price_inr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  annual_price_inr NUMERIC(12, 2) NOT NULL DEFAULT 0,
  max_users INTEGER NOT NULL DEFAULT 5,
  max_projects INTEGER NOT NULL DEFAULT 2,
  max_leads_per_month INTEGER NOT NULL DEFAULT 500,
  storage_limit_mb INTEGER NOT NULL DEFAULT 2048,
  features JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed Default Plans
INSERT INTO subscription_plans (name, slug, description, monthly_price_inr, annual_price_inr, max_users, max_projects, max_leads_per_month, storage_limit_mb, features)
VALUES 
  ('Starter', 'starter', 'For boutique agencies and individual property developers.', 4999.00, 49990.00, 5, 2, 500, 2048, '{"custom_pipeline": false, "bulk_import_export": true, "round_robin_allocation": false, "site_visits_mgmt": true, "customer_payments": true, "channel_partners": false, "advanced_reports": false, "webhooks_api": false, "whatsapp_integration": false}'::jsonb),
  ('Growth', 'growth', 'For expanding real estate firms with active sales teams.', 9999.00, 99990.00, 15, 5, 2500, 10240, '{"custom_pipeline": true, "bulk_import_export": true, "round_robin_allocation": true, "site_visits_mgmt": true, "customer_payments": true, "channel_partners": true, "advanced_reports": true, "webhooks_api": true, "whatsapp_integration": true}'::jsonb),
  ('Business', 'business', 'For multi-project developers and high-volume sales networks.', 19999.00, 199990.00, 50, 15, 10000, 51200, '{"custom_pipeline": true, "bulk_import_export": true, "round_robin_allocation": true, "site_visits_mgmt": true, "customer_payments": true, "channel_partners": true, "advanced_reports": true, "webhooks_api": true, "whatsapp_integration": true}'::jsonb),
  ('Enterprise', 'enterprise', 'Unlimited scale with custom limits and dedicated SLA.', 39999.00, 399990.00, 200, 50, 50000, 204800, '{"custom_pipeline": true, "bulk_import_export": true, "round_robin_allocation": true, "site_visits_mgmt": true, "customer_payments": true, "channel_partners": true, "advanced_reports": true, "webhooks_api": true, "whatsapp_integration": true}'::jsonb)
ON CONFLICT (slug) DO NOTHING;

-- 2. PLATFORM ADMINS (Platform Owner Level - Superadmins)
CREATE TABLE IF NOT EXISTS platform_admins (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'superadmin',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. COMPANIES (Tenants)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  logo_url TEXT,
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  country VARCHAR(100) NOT NULL DEFAULT 'India',
  postal_code VARCHAR(20),
  timezone VARCHAR(100) NOT NULL DEFAULT 'Asia/Kolkata',
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL DEFAULT 'trial',
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '14 days'),
  settings JSONB NOT NULL DEFAULT '{"hold_duration_hours": 48, "enable_round_robin": true}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. COMPANY SUBSCRIPTIONS (Razorpay Lifecycle)
CREATE TABLE IF NOT EXISTS company_subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES subscription_plans(id),
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly',
  razorpay_subscription_id VARCHAR(100),
  razorpay_customer_id VARCHAR(100),
  status VARCHAR(50) NOT NULL DEFAULT 'trialing',
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '14 days'),
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  grace_period_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. SUBSCRIPTION INVOICES (SaaS Platform Revenue)
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  subscription_id UUID NOT NULL REFERENCES company_subscriptions(id) ON DELETE CASCADE,
  razorpay_payment_id VARCHAR(100),
  razorpay_order_id VARCHAR(100),
  amount_inr NUMERIC(12, 2) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'INR',
  status VARCHAR(50) NOT NULL DEFAULT 'paid',
  invoice_number VARCHAR(100) NOT NULL UNIQUE,
  invoice_pdf_url TEXT,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. BRANCHES & TEAMS
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  address TEXT,
  phone VARCHAR(50),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. COMPANY MEMBERS (RBAC & Multi-Tenant Membership)
CREATE TABLE IF NOT EXISTS company_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL,
  branch_id UUID REFERENCES branches(id) ON DELETE SET NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  title VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_company_user UNIQUE(company_id, user_id)
);

-- 8. INVITATIONS (Single-use expiring tokens)
CREATE TABLE IF NOT EXISTS invitations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  invited_by_member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '7 days'),
  accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 9. PIPELINE STAGES (Customizable per company)
CREATE TABLE IF NOT EXISTS pipeline_stages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  stage_type VARCHAR(50) NOT NULL,
  color_hex VARCHAR(20) NOT NULL DEFAULT '#3B82F6',
  is_protected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. REAL ESTATE PROJECTS
CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  code VARCHAR(50) NOT NULL,
  description TEXT,
  location VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  developer_name VARCHAR(255) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'villa_plots', 'apartments', 'villas', 'farm_plots', 'commercial'
  approval_authority VARCHAR(100),
  approval_number VARCHAR(100),
  total_area NUMERIC(12, 2),
  area_unit VARCHAR(20) DEFAULT 'sqft',
  amenities JSONB NOT NULL DEFAULT '[]'::jsonb,
  brochure_url TEXT,
  layout_image_url TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_project_code_per_company UNIQUE(company_id, code)
);

-- 11. PROJECT UNITS (Anti-Double-Booking Protection)
CREATE TABLE IF NOT EXISTS project_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  unit_number VARCHAR(100) NOT NULL,
  tower_block VARCHAR(100),
  floor INTEGER,
  category VARCHAR(50) NOT NULL,
  plot_or_unit_type VARCHAR(100) NOT NULL,
  super_builtup_area NUMERIC(10, 2),
  carpet_area NUMERIC(10, 2),
  plot_area NUMERIC(10, 2),
  area_unit VARCHAR(20) NOT NULL DEFAULT 'sqft',
  facing VARCHAR(50),
  base_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  additional_charges JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_price NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'available', -- 'available', 'on_hold', 'booked', 'sold', 'blocked'
  hold_expires_at TIMESTAMPTZ,
  held_by_lead_id UUID,
  booked_by_customer_id UUID,
  lock_version INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_unit_in_project UNIQUE(project_id, unit_number)
);

-- 12. UNIT HOLDS
CREATE TABLE IF NOT EXISTS unit_holds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  unit_id UUID NOT NULL REFERENCES project_units(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL,
  member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  hold_amount NUMERIC(12, 2) NOT NULL DEFAULT 0,
  hold_expires_at TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. LEADS
CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_number VARCHAR(50) NOT NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  alternate_phone VARCHAR(50),
  normalized_phone VARCHAR(50) NOT NULL,
  source VARCHAR(100) NOT NULL DEFAULT 'Website',
  campaign VARCHAR(100),
  medium VARCHAR(100),
  interested_project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  interested_property_type VARCHAR(50),
  budget_min NUMERIC(14, 2),
  budget_max NUMERIC(14, 2),
  preferred_location VARCHAR(255),
  assigned_member_id UUID REFERENCES company_members(id) ON DELETE SET NULL,
  assigned_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  stage_id UUID NOT NULL REFERENCES pipeline_stages(id),
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  temperature VARCHAR(50) NOT NULL DEFAULT 'warm',
  buying_timeline VARCHAR(50) NOT NULL DEFAULT '1_month',
  last_contacted_at TIMESTAMPTZ,
  next_followup_at TIMESTAMPTZ,
  lost_reason VARCHAR(255),
  lost_notes TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  custom_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_duplicate BOOLEAN NOT NULL DEFAULT false,
  merged_into_lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for duplicate detection within company
CREATE INDEX IF NOT EXISTS idx_leads_company_normalized_phone ON leads(company_id, normalized_phone);
CREATE INDEX IF NOT EXISTS idx_leads_company_email ON leads(company_id, email);
CREATE INDEX IF NOT EXISTS idx_leads_company_assigned ON leads(company_id, assigned_member_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_stage ON leads(company_id, stage_id);

-- 14. LEAD ACTIVITIES
CREATE TABLE IF NOT EXISTS lead_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  actor_member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. TASKS & FOLLOW-UPS
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  assigned_member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  creator_member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  task_type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  priority VARCHAR(50) NOT NULL DEFAULT 'medium',
  due_date TIMESTAMPTZ NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  outcome TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. SITE VISITS
CREATE TABLE IF NOT EXISTS site_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  assigned_member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  pickup_location VARCHAR(255),
  transport_required BOOLEAN NOT NULL DEFAULT false,
  status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  feedback TEXT,
  objections TEXT,
  rating INTEGER,
  next_action VARCHAR(255),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. CUSTOMERS
CREATE TABLE IF NOT EXISTS customers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50) NOT NULL,
  pan_number VARCHAR(50),
  aadhar_number VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(100),
  postal_code VARCHAR(20),
  kyc_status VARCHAR(50) NOT NULL DEFAULT 'pending',
  kyc_documents JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 18. CHANNEL PARTNERS & BROKERS
CREATE TABLE IF NOT EXISTS channel_partners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  company_name VARCHAR(255),
  rera_registration_number VARCHAR(100),
  phone VARCHAR(50) NOT NULL,
  email VARCHAR(255),
  pan_number VARCHAR(50),
  bank_details JSONB NOT NULL DEFAULT '{}'::jsonb,
  commission_type VARCHAR(20) NOT NULL DEFAULT 'percentage',
  default_commission_rate NUMERIC(6, 2) NOT NULL DEFAULT 2.00,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 19. PROPERTY BOOKINGS
CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  booking_number VARCHAR(50) NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  unit_id UUID NOT NULL REFERENCES project_units(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE RESTRICT,
  sales_member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE RESTRICT,
  channel_partner_id UUID REFERENCES channel_partners(id) ON DELETE SET NULL,
  base_quoted_amount NUMERIC(14, 2) NOT NULL,
  discount_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  net_sale_amount NUMERIC(14, 2) NOT NULL,
  booking_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  status VARCHAR(50) NOT NULL DEFAULT 'confirmed',
  booking_date DATE NOT NULL DEFAULT CURRENT_DATE,
  agreement_date DATE,
  possession_date DATE,
  cancellation_reason TEXT,
  cancellation_approved_by UUID REFERENCES company_members(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT unique_booking_number_per_company UNIQUE(company_id, booking_number)
);

-- 20. BOOKING PAYMENT SCHEDULES (Milestones)
CREATE TABLE IF NOT EXISTS booking_payment_schedules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  milestone_name VARCHAR(255) NOT NULL,
  percentage NUMERIC(6, 2) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  due_date DATE NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  paid_amount NUMERIC(14, 2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 21. CUSTOMER PAYMENTS (Property Collections Ledger)
CREATE TABLE IF NOT EXISTS customer_payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  schedule_id UUID REFERENCES booking_payment_schedules(id) ON DELETE SET NULL,
  payment_number VARCHAR(50) NOT NULL,
  amount NUMERIC(14, 2) NOT NULL,
  payment_mode VARCHAR(50) NOT NULL,
  transaction_reference VARCHAR(100),
  bank_name VARCHAR(100),
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'recorded',
  receipt_url TEXT,
  notes TEXT,
  recorded_by_member_id UUID NOT NULL REFERENCES company_members(id),
  reconciled_by_member_id UUID REFERENCES company_members(id),
  reconciled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 22. BROKER COMMISSIONS
CREATE TABLE IF NOT EXISTS commissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  channel_partner_id UUID NOT NULL REFERENCES channel_partners(id) ON DELETE RESTRICT,
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  commission_type VARCHAR(20) NOT NULL,
  applied_rate NUMERIC(6, 2) NOT NULL,
  total_commission_amount NUMERIC(12, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  approved_by_member_id UUID REFERENCES company_members(id),
  paid_at TIMESTAMPTZ,
  payment_reference VARCHAR(100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 23. INTEGRATIONS & WEBHOOKS
CREATE TABLE IF NOT EXISTS integrations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  provider VARCHAR(50) NOT NULL,
  name VARCHAR(100) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT false,
  webhook_secret VARCHAR(255),
  config JSONB NOT NULL DEFAULT '{}'::jsonb,
  last_synced_at TIMESTAMPTZ,
  error_log JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inbound_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  integration_id UUID REFERENCES integrations(id) ON DELETE SET NULL,
  source VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  status VARCHAR(50) NOT NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 24. AUDIT LOGS
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  actor_member_id UUID REFERENCES company_members(id) ON DELETE SET NULL,
  platform_admin_id UUID REFERENCES platform_admins(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address VARCHAR(50),
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 25. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  recipient_member_id UUID NOT NULL REFERENCES company_members(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  link TEXT,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 26. SUPPORT ACCESS SESSIONS (Platform Owner Time-Limited Support)
CREATE TABLE IF NOT EXISTS support_access_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  platform_admin_id UUID NOT NULL REFERENCES platform_admins(id) ON DELETE CASCADE,
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 27. RAZORPAY WEBHOOK EVENTS (Idempotency Ledger)
CREATE TABLE IF NOT EXISTS razorpay_webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_id VARCHAR(100) NOT NULL UNIQUE,
  event_name VARCHAR(100) NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- DATABASE CONSTRAINTS & TRIGGERS
-- =========================================================================

-- Trigger to prevent deleting or deactivating the last active Company Owner
CREATE OR REPLACE FUNCTION check_last_company_owner()
RETURNS TRIGGER AS $$
DECLARE
  active_owners_count INTEGER;
BEGIN
  IF (OLD.role = 'company_owner' AND OLD.is_active = true) AND 
     (TG_OP = 'DELETE' OR (TG_OP = 'UPDATE' AND (NEW.is_active = false OR NEW.role != 'company_owner'))) THEN
     
    SELECT COUNT(*) INTO active_owners_count
    FROM company_members
    WHERE company_id = OLD.company_id
      AND role = 'company_owner'
      AND is_active = true
      AND id != OLD.id;
      
    IF active_owners_count = 0 THEN
      RAISE EXCEPTION 'Cannot remove or deactivate the final active Company Owner for this workspace.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prevent_last_owner ON company_members;
CREATE TRIGGER trg_prevent_last_owner
BEFORE UPDATE OR DELETE ON company_members
FOR EACH ROW EXECUTE FUNCTION check_last_company_owner();

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================

ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE pipeline_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE unit_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE site_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_payment_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Helper SQL functions
CREATE OR REPLACE FUNCTION get_user_company_ids()
RETURNS SETOF UUID AS $$
  SELECT company_id FROM company_members WHERE user_id = auth.uid() AND is_active = true;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Tenant Isolation Policies for Companies
CREATE POLICY "Users can view companies they are members of"
  ON companies FOR SELECT
  USING (id IN (SELECT get_user_company_ids()));

-- Tenant Isolation Policies for Company Members
CREATE POLICY "Users can view members within their company"
  ON company_members FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

-- Tenant Isolation Policies for Projects
CREATE POLICY "Members can view projects in their company"
  ON projects FOR SELECT
  USING (company_id IN (SELECT get_user_company_ids()));

CREATE POLICY "Admins can manage projects in their company"
  ON projects FOR ALL
  USING (company_id IN (
    SELECT company_id FROM company_members 
    WHERE user_id = auth.uid() AND role IN ('company_owner', 'company_admin') AND is_active = true
  ));

-- Tenant Isolation Policies for Leads
CREATE POLICY "Users can access leads within their company"
  ON leads FOR ALL
  USING (company_id IN (SELECT get_user_company_ids()));

-- Tenant Isolation Policies for Bookings
CREATE POLICY "Users can access bookings within their company"
  ON bookings FOR ALL
  USING (company_id IN (SELECT get_user_company_ids()));

-- Tenant Isolation Policies for Customer Payments
CREATE POLICY "Users can access payments within their company"
  ON customer_payments FOR ALL
  USING (company_id IN (SELECT get_user_company_ids()));
