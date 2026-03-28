-- Fix: Change RLS policies from 'public' role to 'authenticated' role

ALTER POLICY "Members can view their orgs" ON organizations TO authenticated;
ALTER POLICY "Admins can insert orgs" ON organizations TO authenticated;
ALTER POLICY "Admins can update their orgs" ON organizations TO authenticated;

ALTER POLICY "Members can view co-members" ON organization_members TO authenticated;
ALTER POLICY "Admins can manage members" ON organization_members TO authenticated;
ALTER POLICY "Admins can delete members" ON organization_members TO authenticated;

ALTER POLICY "Users can view own roles" ON user_roles TO authenticated;
ALTER POLICY "Admins can manage roles" ON user_roles TO authenticated;
ALTER POLICY "Admins can delete roles" ON user_roles TO authenticated;

ALTER POLICY "Members can view doctors" ON clinic_doctors TO authenticated;
ALTER POLICY "Managers can insert doctors" ON clinic_doctors TO authenticated;
ALTER POLICY "Managers can update doctors" ON clinic_doctors TO authenticated;
ALTER POLICY "Managers can delete doctors" ON clinic_doctors TO authenticated;

ALTER POLICY "Members can view patients" ON clinic_patients TO authenticated;
ALTER POLICY "Members can insert patients" ON clinic_patients TO authenticated;
ALTER POLICY "Members can update patients" ON clinic_patients TO authenticated;
ALTER POLICY "Members can delete patients" ON clinic_patients TO authenticated;

ALTER POLICY "Members can view bank accounts" ON bank_accounts TO authenticated;
ALTER POLICY "Managers can manage bank accounts" ON bank_accounts TO authenticated;
ALTER POLICY "Managers can update bank accounts" ON bank_accounts TO authenticated;

ALTER POLICY "Members can view transactions" ON financial_transactions TO authenticated;
ALTER POLICY "Members can insert transactions" ON financial_transactions TO authenticated;
ALTER POLICY "Members can update transactions" ON financial_transactions TO authenticated;
ALTER POLICY "Members can delete transactions" ON financial_transactions TO authenticated;