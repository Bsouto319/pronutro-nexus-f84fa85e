-- Create the organization first
INSERT INTO public.organizations (id, name)
VALUES ('65777d18-1126-481d-93d9-169237388d7f', 'ProNutro Clinic')
ON CONFLICT (id) DO NOTHING;

-- Link user to organization
INSERT INTO public.organization_members (user_id, organization_id)
VALUES ('66b3a39e-e09d-4dca-9a09-9e129361df6a', '65777d18-1126-481d-93d9-169237388d7f')
ON CONFLICT DO NOTHING;

-- Give admin role
INSERT INTO public.user_roles (user_id, role)
VALUES ('66b3a39e-e09d-4dca-9a09-9e129361df6a', 'admin')
ON CONFLICT DO NOTHING;