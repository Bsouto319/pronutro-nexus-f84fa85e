
ALTER TABLE public.gastos
ADD COLUMN doctor_id uuid REFERENCES public.clinic_doctors(id) ON DELETE SET NULL,
ADD COLUMN origem_pagamento text;
