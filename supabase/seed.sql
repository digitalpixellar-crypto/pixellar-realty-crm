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
  INSERT INTO pipeline_stages (company_id, name, slug, order_index, color, is_won, is_lost)
  VALUES
    (v_co_skyline, 'New Inquiry', 'new-inquiry', 1, '#3B82F6', false, false),
    (v_co_skyline, 'Contacted', 'contacted', 2, '#6366F1', false, false),
    (v_co_skyline, 'Site Visit Scheduled', 'site-visit-scheduled', 3, '#8B5CF6', false, false),
    (v_co_skyline, 'Site Visit Completed', 'site-visit-completed', 4, '#EC4899', false, false),
    (v_co_skyline, 'Negotiation / Token', 'negotiation', 5, '#F59E0B', false, false),
    (v_co_skyline, 'Booked (Won)', 'booked', 6, '#10B981', true, false),
    (v_co_skyline, 'Lost / Dropped', 'lost', 7, '#EF4444', false, true)
  ON CONFLICT (company_id, slug) DO NOTHING;

  -- Pipeline stages for Greenfield
  INSERT INTO pipeline_stages (company_id, name, slug, order_index, color, is_won, is_lost)
  VALUES
    (v_co_greenfield, 'New Lead', 'new-lead', 1, '#3B82F6', false, false),
    (v_co_greenfield, 'Follow Up', 'follow-up', 2, '#6366F1', false, false),
    (v_co_greenfield, 'Site Visit Done', 'visit-done', 3, '#8B5CF6', false, false),
    (v_co_greenfield, 'Closed Won', 'closed-won', 4, '#10B981', true, false),
    (v_co_greenfield, 'Closed Lost', 'closed-lost', 5, '#EF4444', false, true)
  ON CONFLICT (company_id, slug) DO NOTHING;

  -- 3. Projects for Skyline
  INSERT INTO projects (id, company_id, name, code, project_type, location, city, state, total_units, available_units, booked_units, sold_units, rera_registration_number, status)
  VALUES 
    (v_proj_meadows, v_co_skyline, 'Skyline Meadows', 'SKM', 'villa_plots', 'Whitefield Extension', 'Bengaluru', 'Karnataka', 120, 85, 20, 15, 'PRM/KA/RERA/1251/446/PR/2026/001122', 'ongoing'),
    (v_proj_heights, v_co_skyline, 'Skyline Heights', 'SKH', 'apartments', 'Outer Ring Road, Bellandur', 'Bengaluru', 'Karnataka', 240, 140, 60, 40, 'PRM/KA/RERA/1251/446/PR/2026/003344', 'ongoing')
  ON CONFLICT (company_id, code) DO NOTHING;

  -- Projects for Greenfield
  INSERT INTO projects (id, company_id, name, code, project_type, location, city, state, total_units, available_units, booked_units, sold_units, rera_registration_number, status)
  VALUES 
    (v_proj_serenity, v_co_greenfield, 'Greenfield Serenity', 'GFS', 'villa_plots', 'Mokila, Shankarpally Road', 'Hyderabad', 'Telangana', 90, 62, 18, 10, 'P02400005512', 'ongoing')
  ON CONFLICT (company_id, code) DO NOTHING;

  -- 4. Sample Units for Skyline Meadows
  INSERT INTO project_units (project_id, unit_number, unit_type, block_sector, plot_area_sqft, base_price_inr, status)
  VALUES
    (v_proj_meadows, 'Plot-101', 'villa_plot', 'Phase 1 - East Avenue', 1500, 7500000.00, 'available'),
    (v_proj_meadows, 'Plot-102', 'villa_plot', 'Phase 1 - East Avenue', 1500, 7500000.00, 'available'),
    (v_proj_meadows, 'Plot-103', 'villa_plot', 'Phase 1 - East Avenue', 2400, 12000000.00, 'booked'),
    (v_proj_meadows, 'Plot-104', 'villa_plot', 'Phase 1 - East Avenue', 2400, 12000000.00, 'sold')
  ON CONFLICT (project_id, unit_number) DO NOTHING;

  -- Sample Units for Skyline Heights
  INSERT INTO project_units (project_id, unit_number, unit_type, block_sector, super_builtup_sqft, base_price_inr, status)
  VALUES
    (v_proj_heights, 'A-302', 'apartment_3bhk', 'Tower A - 3rd Floor', 1650, 12500000.00, 'available'),
    (v_proj_heights, 'A-303', 'apartment_3bhk', 'Tower A - 3rd Floor', 1650, 12500000.00, 'booked'),
    (v_proj_heights, 'B-501', 'apartment_2bhk', 'Tower B - 5th Floor', 1250, 9200000.00, 'available')
  ON CONFLICT (project_id, unit_number) DO NOTHING;

  -- 5. Sample Leads for Skyline
  INSERT INTO leads (company_id, project_id, first_name, last_name, email, phone, stage, priority, lead_source, budget_min_inr, budget_max_inr, property_type_interested)
  VALUES
    (v_co_skyline, v_proj_meadows, 'Vikram', 'Malhotra', 'vikram.m@corporate.in', '+91 98200 12345', 'negotiation', 'hot', 'meta_ads', 7000000, 8500000, 'villa_plots'),
    (v_co_skyline, v_proj_heights, 'Ananya', 'Deshmukh', 'ananya.d@gmail.com', '+91 99300 67890', 'site_visit_scheduled', 'warm', 'google_ads', 11000000, 13000000, 'apartments'),
    (v_co_skyline, v_proj_meadows, 'Rajesh', 'Koothrappali', 'rajesh.k@gmail.com', '+91 98450 33445', 'new_inquiry', 'cold', 'website', 6000000, 7500000, 'villa_plots')
  ON CONFLICT DO NOTHING;

  -- Sample Leads for Greenfield
  INSERT INTO leads (company_id, project_id, first_name, last_name, email, phone, stage, priority, lead_source, budget_min_inr, budget_max_inr, property_type_interested)
  VALUES
    (v_co_greenfield, v_proj_serenity, 'Suresh', 'Rao', 'suresh.rao@techhub.in', '+91 99887 76655', 'site_visit_done', 'hot', 'channel_partner', 8000000, 10000000, 'villa_plots'),
    (v_co_greenfield, v_proj_serenity, 'Pooja', 'Nair', 'pooja.nair@corp.com', '+91 99112 23344', 'new_lead', 'warm', 'walk_in', 7500000, 9000000, 'villa_plots')
  ON CONFLICT DO NOTHING;

END $$;
