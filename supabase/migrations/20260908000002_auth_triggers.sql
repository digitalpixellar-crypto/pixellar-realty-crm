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
