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
-- =========================================================================
-- PIXELLAR REALTY CRM - STORAGE BUCKET & MULTI-TENANT ACCESS POLICIES
-- Organization: Digital Pixellar
-- Product Owner: K. Yeswanth Kumar Reddy
-- =========================================================================

-- 1. Create Storage Bucket for Tenant Assets
-- Used for: Project floor plans, brochures, company logos, payment receipts
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tenant-assets',
  'tenant-assets',
  true,
  52428800, -- 50MB limit per file
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf'];

-- 2. Storage Security: Enable RLS on storage.objects (enabled by default in Supabase)
-- Pattern: /{company_id}/{resource_type}/{filename}

-- Drop existing policies if re-running
DROP POLICY IF EXISTS "Public Read Tenant Assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Members Can Upload Assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Members Can Update Assets" ON storage.objects;
DROP POLICY IF EXISTS "Tenant Admins Can Delete Assets" ON storage.objects;

-- Allow public viewing of project brochures and logos
CREATE POLICY "Public Read Tenant Assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'tenant-assets');

-- Multi-Tenant Upload Isolation:
-- Users can only upload to paths prefixed with their active company ID
CREATE POLICY "Tenant Members Can Upload Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'tenant-assets' AND
  (storage.foldername(name))[1]::uuid IN (SELECT get_user_company_ids())
);

-- Multi-Tenant Update Isolation:
CREATE POLICY "Tenant Members Can Update Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'tenant-assets' AND
  (storage.foldername(name))[1]::uuid IN (SELECT get_user_company_ids())
);

-- Multi-Tenant Deletion Isolation:
-- Only company owners and company admins can delete uploaded assets
CREATE POLICY "Tenant Admins Can Delete Assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'tenant-assets' AND
  (storage.foldername(name))[1]::uuid IN (
    SELECT company_id FROM company_members 
    WHERE user_id = auth.uid() AND role IN ('company_owner', 'company_admin') AND is_active = true
  )
);
-- =========================================================================
-- PIXELLAR REALTY CRM - AUTH TRIGGERS & AUTO-PROVISIONING
-- Organization: Digital Pixellar
-- Product Owner: K. Yeswanth Kumar Reddy
-- =========================================================================

-- Function to handle new user registration in Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
  invitation_record RECORD;
BEGIN
  -- 1. Auto-provision Platform Owner superadmin if matching owner email
  IF LOWER(NEW.email) = 'owner@digitalpixellar.com' THEN
    INSERT INTO public.platform_admins (user_id, email, full_name, role, is_active)
    VALUES (NEW.id, NEW.email, 'K. Yeswanth Kumar Reddy', 'superadmin', true)
    ON CONFLICT (email) DO UPDATE 
    SET user_id = NEW.id, is_active = true;
  END IF;

  -- 2. Check for pending company invitations matching this email
  FOR invitation_record IN 
    SELECT * FROM public.invitations 
    WHERE LOWER(email) = LOWER(NEW.email) AND accepted_at IS NULL AND expires_at > NOW()
  LOOP
    -- Add to company members
    INSERT INTO public.company_members (company_id, user_id, email, full_name, role, branch_id, is_active)
    VALUES (
      invitation_record.company_id, 
      NEW.id, 
      NEW.email, 
      COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)), 
      invitation_record.role, 
      invitation_record.branch_id, 
      true
    )
    ON CONFLICT (company_id, user_id) DO NOTHING;

    -- Mark invitation accepted
    UPDATE public.invitations 
    SET accepted_at = NOW() 
    WHERE id = invitation_record.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger execution on auth.users table
DROP TRIGGER IF EXISTS trg_on_auth_user_created ON auth.users;
CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();
-- =========================================================================
-- PIXELLAR REALTY CRM - SEED DEMO DATA FOR SUPABASE POSTGRESQL
-- Organization: Digital Pixellar
-- Product Owner: K. Yeswanth Kumar Reddy
-- =========================================================================

DO $$
DECLARE
  v_plan_starter UUID;
  v_plan_growth UUID;
  v_plan_biz UUID;
  v_plan_ent UUID;
  v_co_skyline UUID := '11111111-1111-1111-1111-111111111111';
  v_co_greenfield UUID := '22222222-2222-2222-2222-222222222222';
  
  v_stage_inquiry UUID := '55555555-5555-5555-5555-555555555551';
  v_stage_contacted UUID := '55555555-5555-5555-5555-555555555552';
  v_stage_scheduled UUID := '55555555-5555-5555-5555-555555555553';
  v_stage_completed UUID := '55555555-5555-5555-5555-555555555554';
  v_stage_negotiation UUID := '55555555-5555-5555-5555-555555555555';
  v_stage_booked UUID := '55555555-5555-5555-5555-555555555556';
  v_stage_lost UUID := '55555555-5555-5555-5555-555555555557';

  v_stage_gf_lead UUID := '66666666-6666-6666-6666-666666666661';
  v_stage_gf_followup UUID := '66666666-6666-6666-6666-666666666662';
  v_stage_gf_visit UUID := '66666666-6666-6666-6666-666666666663';
  v_stage_gf_won UUID := '66666666-6666-6666-6666-666666666664';
  v_stage_gf_lost UUID := '66666666-6666-6666-6666-666666666665';

  v_proj_meadows UUID := '33333333-3333-3333-3333-333333333331';
  v_proj_heights UUID := '33333333-3333-3333-3333-333333333332';
  v_proj_serenity UUID := '44444444-4444-4444-4444-444444444441';
BEGIN
  SELECT id INTO v_plan_starter FROM subscription_plans WHERE slug = 'starter' LIMIT 1;
  SELECT id INTO v_plan_growth FROM subscription_plans WHERE slug = 'growth' LIMIT 1;
  SELECT id INTO v_plan_biz FROM subscription_plans WHERE slug = 'business' LIMIT 1;
  SELECT id INTO v_plan_ent FROM subscription_plans WHERE slug = 'enterprise' LIMIT 1;

  -- 1. Insert Companies
  INSERT INTO companies (id, name, slug, email, phone, city, state, country, plan_id, status)
  VALUES 
    (v_co_skyline, 'Skyline Developers & Builders', 'skyline-developers', 'contact@skylinedev.com', '+91 98450 11223', 'Bengaluru', 'Karnataka', 'India', v_plan_biz, 'active'),
    (v_co_greenfield, 'Greenfield Estates Pvt Ltd', 'greenfield-estates', 'sales@greenfieldestates.in', '+91 98800 44556', 'Hyderabad', 'Telangana', 'India', v_plan_growth, 'trial')
  ON CONFLICT (slug) DO UPDATE SET 
    name = EXCLUDED.name,
    email = EXCLUDED.email;

  -- 2. Insert Pipeline Stages for Skyline
  INSERT INTO pipeline_stages (id, company_id, name, order_index, stage_type, color_hex, is_protected)
  VALUES
    (v_stage_inquiry, v_co_skyline, 'New Inquiry', 1, 'new', '#3B82F6', true),
    (v_stage_contacted, v_co_skyline, 'Contacted', 2, 'contacted', '#6366F1', false),
    (v_stage_scheduled, v_co_skyline, 'Site Visit Scheduled', 3, 'site_visit_scheduled', '#8B5CF6', false),
    (v_stage_completed, v_co_skyline, 'Site Visit Completed', 4, 'site_visit_completed', '#EC4899', false),
    (v_stage_negotiation, v_co_skyline, 'Negotiation / Token', 5, 'negotiation', '#F59E0B', false),
    (v_stage_booked, v_co_skyline, 'Booked (Won)', 6, 'won', '#10B981', true),
    (v_stage_lost, v_co_skyline, 'Lost / Dropped', 7, 'lost', '#EF4444', true)
  ON CONFLICT (id) DO NOTHING;

  -- Pipeline stages for Greenfield
  INSERT INTO pipeline_stages (id, company_id, name, order_index, stage_type, color_hex, is_protected)
  VALUES
    (v_stage_gf_lead, v_co_greenfield, 'New Lead', 1, 'new', '#3B82F6', true),
    (v_stage_gf_followup, v_co_greenfield, 'Follow Up', 2, 'contacted', '#6366F1', false),
    (v_stage_gf_visit, v_co_greenfield, 'Site Visit Done', 3, 'site_visit_completed', '#8B5CF6', false),
    (v_stage_gf_won, v_co_greenfield, 'Closed Won', 4, 'won', '#10B981', true),
    (v_stage_gf_lost, v_co_greenfield, 'Closed Lost', 5, 'lost', '#EF4444', true)
  ON CONFLICT (id) DO NOTHING;

  -- 3. Projects for Skyline
  INSERT INTO projects (id, company_id, name, code, category, developer_name, location, city, state, status)
  VALUES 
    (v_proj_meadows, v_co_skyline, 'Skyline Meadows', 'SKM', 'villa_plots', 'Skyline Developers', 'Whitefield Extension', 'Bengaluru', 'Karnataka', 'active'),
    (v_proj_heights, v_co_skyline, 'Skyline Heights', 'SKH', 'apartments', 'Skyline Developers', 'Outer Ring Road, Bellandur', 'Bengaluru', 'Karnataka', 'active')
  ON CONFLICT (company_id, code) DO NOTHING;

  -- Projects for Greenfield
  INSERT INTO projects (id, company_id, name, code, category, developer_name, location, city, state, status)
  VALUES 
    (v_proj_serenity, v_co_greenfield, 'Greenfield Serenity', 'GFS', 'villa_plots', 'Greenfield Estates', 'Mokila, Shankarpally Road', 'Hyderabad', 'Telangana', 'active')
  ON CONFLICT (company_id, code) DO NOTHING;

  -- 4. Sample Units for Skyline Meadows
  INSERT INTO project_units (company_id, project_id, unit_number, category, plot_or_unit_type, tower_block, plot_area, base_price, total_price, status)
  VALUES
    (v_co_skyline, v_proj_meadows, 'Plot-101', 'villa_plots', 'Villa Plot', 'Phase 1 - East', 1500, 7500000.00, 7500000.00, 'available'),
    (v_co_skyline, v_proj_meadows, 'Plot-102', 'villa_plots', 'Villa Plot', 'Phase 1 - East', 1500, 7500000.00, 7500000.00, 'available'),
    (v_co_skyline, v_proj_meadows, 'Plot-103', 'villa_plots', 'Villa Plot', 'Phase 1 - East', 2400, 12000000.00, 12000000.00, 'booked'),
    (v_co_skyline, v_proj_meadows, 'Plot-104', 'villa_plots', 'Villa Plot', 'Phase 1 - East', 2400, 12000000.00, 12000000.00, 'sold')
  ON CONFLICT (project_id, unit_number) DO NOTHING;

  -- Sample Units for Skyline Heights
  INSERT INTO project_units (company_id, project_id, unit_number, category, plot_or_unit_type, tower_block, super_builtup_area, carpet_area, base_price, total_price, status)
  VALUES
    (v_co_skyline, v_proj_heights, 'A-302', 'apartments', '3 BHK Luxury', 'Tower A', 1650, 1320, 12500000.00, 12500000.00, 'available'),
    (v_co_skyline, v_proj_heights, 'A-303', 'apartments', '3 BHK Luxury', 'Tower A', 1650, 1320, 12500000.00, 12500000.00, 'booked'),
    (v_co_skyline, v_proj_heights, 'B-501', 'apartments', '2 BHK Premium', 'Tower B', 1250, 1000, 9200000.00, 9200000.00, 'available')
  ON CONFLICT (project_id, unit_number) DO NOTHING;

  -- 5. Sample Leads for Skyline
  INSERT INTO leads (company_id, interested_project_id, stage_id, lead_number, first_name, last_name, email, phone, normalized_phone, source, priority, temperature, budget_min, budget_max)
  VALUES
    (v_co_skyline, v_proj_meadows, v_stage_negotiation, 'LD-2026-001', 'Vikram', 'Malhotra', 'vikram.m@corporate.in', '+91 98200 12345', '9820012345', 'Meta Ads', 'high', 'hot', 7000000, 8500000),
    (v_co_skyline, v_proj_heights, v_stage_scheduled, 'LD-2026-002', 'Ananya', 'Deshmukh', 'ananya.d@gmail.com', '+91 99300 67890', '9930067890', 'Google Ads', 'medium', 'warm', 11000000, 13000000),
    (v_co_skyline, v_proj_meadows, v_stage_inquiry, 'LD-2026-003', 'Rajesh', 'Koothrappali', 'rajesh.k@gmail.com', '+91 98450 33445', '9845033445', 'Website Direct', 'low', 'cold', 6000000, 7500000)
  ON CONFLICT DO NOTHING;

  -- Sample Leads for Greenfield
  INSERT INTO leads (company_id, interested_project_id, stage_id, lead_number, first_name, last_name, email, phone, normalized_phone, source, priority, temperature, budget_min, budget_max)
  VALUES
    (v_co_greenfield, v_proj_serenity, v_stage_gf_visit, 'GF-2026-001', 'Suresh', 'Rao', 'suresh.rao@techhub.in', '+91 99887 76655', '9988776655', 'Channel Partner', 'high', 'hot', 8000000, 10000000),
    (v_co_greenfield, v_proj_serenity, v_stage_gf_lead, 'GF-2026-002', 'Pooja', 'Nair', 'pooja.nair@corp.com', '+91 99112 23344', '9911223344', 'Walk-in', 'medium', 'warm', 7500000, 9000000)
  ON CONFLICT DO NOTHING;

END $$;
