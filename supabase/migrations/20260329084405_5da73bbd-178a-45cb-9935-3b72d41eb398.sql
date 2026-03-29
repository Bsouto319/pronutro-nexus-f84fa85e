
CREATE TRIGGER trg_auto_create_lead_from_agendamento
AFTER INSERT ON public.agendamentos
FOR EACH ROW
EXECUTE FUNCTION public.auto_create_lead_from_agendamento();
