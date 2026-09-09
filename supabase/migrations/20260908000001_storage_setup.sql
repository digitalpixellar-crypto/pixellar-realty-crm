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
