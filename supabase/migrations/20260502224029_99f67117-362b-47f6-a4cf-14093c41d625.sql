
INSERT INTO storage.buckets (id, name, public) VALUES ('org-logos', 'org-logos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read org logos"
ON storage.objects FOR SELECT
USING (bucket_id = 'org-logos');

CREATE POLICY "Org members upload logos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'org-logos'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Org members update logos"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'org-logos'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);

CREATE POLICY "Org members delete logos"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'org-logos'
  AND public.is_org_member(auth.uid(), (storage.foldername(name))[1]::uuid)
);
