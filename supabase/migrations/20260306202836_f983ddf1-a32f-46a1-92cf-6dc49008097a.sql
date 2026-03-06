CREATE POLICY "Managers can delete bank accounts"
  ON public.bank_accounts
  FOR DELETE
  TO authenticated
  USING (public.is_org_member(auth.uid(), organization_id));