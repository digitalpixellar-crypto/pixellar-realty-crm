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
