CREATE INDEX IF NOT EXISTS idx_agendamentos_org_data_inicio ON public.agendamentos(organization_id, data_inicio DESC);
CREATE INDEX IF NOT EXISTS idx_agendamentos_google_event ON public.agendamentos(google_event_id) WHERE google_event_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_org_phone ON public.leads(organization_id, phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_leads_org_status ON public.leads(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_gastos_org_data ON public.gastos(organization_id, data_gasto DESC);
CREATE INDEX IF NOT EXISTS idx_financial_tx_org_date ON public.financial_transactions(organization_id, date DESC);