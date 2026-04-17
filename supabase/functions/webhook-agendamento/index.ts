import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const secret = req.headers.get("x-webhook-secret");
    const expectedSecret = Deno.env.get("WEBHOOK_SECRET");
    if (!expectedSecret || secret !== expectedSecret) {
      return new Response(JSON.stringify({ success: false, error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    console.log("Webhook received:", JSON.stringify(body));

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const ORG_ID = "65777d18-1126-481d-93d9-169237388d7f";

    const safe = (s: unknown, max = 255): string | null =>
      typeof s === "string" && s.trim() ? s.trim().slice(0, max) : null;

    const patient_name = safe(body.paciente_nome) || safe(body.patient_name) || safe(body.name) || safe(body.paciente) || safe(body.nome) || safe(body.summary) || "Paciente não identificado";
    const doctor_name = safe(body.profissional) || safe(body.doctor_name) || safe(body.medico) || safe(body.doctor);
    const rawDate = body.date || body.data || new Date().toISOString().split("T")[0];
    const time = safe(body.time || body.horario || body.hora);
    const rawStatus = body.status || "confirmado";
    const source = safe(body.source || body.channel || "google_calendar");
    const notes = safe(body.notes || body.observacoes || body.description || body.last_message, 2000);
    const phone = safe(body.paciente_telefone) || safe(body.patient_phone) || safe(body.phone) || safe(body.telefone) || safe(body.whatsapp) || safe(body.numero);
    const channel = safe(body.channel) || (phone ? "whatsapp" : null);
    const data_inicio = body.data_inicio || null;
    const data_fim = body.data_fim || null;
    const titulo = safe(body.titulo || body.title, 500);
    const valor = typeof body.valor === "number" ? body.valor : (parseFloat(body.valor) || 0);
    const google_event_id = safe(body.google_event_id || body.event_id, 255);

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(rawDate) && !data_inicio) {
      return new Response(JSON.stringify({ success: false, error: "Invalid date format. Expected YYYY-MM-DD." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const VALID_STATUSES = ["confirmado", "pendente", "cancelado"];
    const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : "pendente";

    const { data, error } = await supabase.from("agendamentos").insert({
      organization_id: ORG_ID,
      patient_name,
      paciente_nome: patient_name,
      doctor_name,
      profissional: doctor_name,
      date: data_inicio ? new Date(data_inicio).toISOString().split("T")[0] : rawDate,
      time,
      data_inicio: data_inicio || `${rawDate}T12:00:00-03:00`,
      data_fim,
      titulo,
      valor,
      google_event_id,
      paciente_telefone: phone,
      status,
      source,
      notes,
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
      throw new Error(`Failed to insert: ${error.message}`);
    }

    console.log("Agendamento created:", data.id);

    // Always upsert lead - find by phone first, then by name
    const leadStatus = status === "cancelado" ? "perdido" : "agendado";
    let existingLead = null;

    if (phone) {
      const { data: byPhone } = await supabase
        .from("leads")
        .select("id, phone")
        .eq("organization_id", ORG_ID)
        .eq("phone", phone)
        .limit(1)
        .maybeSingle();
      existingLead = byPhone;
    }

    if (!existingLead && patient_name !== "Paciente não identificado") {
      const { data: byName } = await supabase
        .from("leads")
        .select("id, phone")
        .eq("organization_id", ORG_ID)
        .ilike("name", patient_name)
        .limit(1)
        .maybeSingle();
      existingLead = byName;
    }

    const leadMessage = titulo || notes || `Agendamento para ${rawDate}${time ? ` às ${time}` : ""}`;

    if (existingLead) {
      await supabase
        .from("leads")
        .update({
          name: patient_name !== "Paciente não identificado" ? patient_name : undefined,
          phone: phone || existingLead.phone,
          source,
          channel,
          status: leadStatus,
          last_message: leadMessage,
          last_message_at: new Date().toISOString(),
        })
        .eq("id", existingLead.id);
    } else if (patient_name !== "Paciente não identificado") {
      // CREATE new lead
      await supabase.from("leads").insert({
        organization_id: ORG_ID,
        name: patient_name,
        phone,
        source: source || "google_calendar",
        channel,
        status: leadStatus,
        last_message: leadMessage,
        last_message_at: new Date().toISOString(),
      });
    }

    return new Response(JSON.stringify({ success: true, id: data.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
