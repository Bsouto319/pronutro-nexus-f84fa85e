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
    // Validate shared secret
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

    // Accept flexible field names from n8n
    const safe = (s: unknown, max = 255): string | null =>
      typeof s === "string" ? s.slice(0, max) : null;

    const patient_name = safe(body.patient_name || body.paciente || body.nome || body.summary) || "Paciente não identificado";
    const doctor_name = safe(body.doctor_name || body.medico || body.doctor);
    const rawDate = body.date || body.data || new Date().toISOString().split("T")[0];
    const time = safe(body.time || body.horario || body.hora);
    const rawStatus = body.status || "confirmado";
    const source = safe(body.source || "google_calendar");
    const notes = safe(body.notes || body.observacoes || body.description, 2000);

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(rawDate)) {
      return new Response(JSON.stringify({ success: false, error: "Invalid date format. Expected YYYY-MM-DD." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate status enum
    const VALID_STATUSES = ["confirmado", "pendente", "cancelado"];
    const status = VALID_STATUSES.includes(rawStatus) ? rawStatus : "pendente";

    const { data, error } = await supabase.from("agendamentos").insert({
      organization_id: ORG_ID,
      patient_name,
      doctor_name,
      date: rawDate,
      time,
      status,
      source,
      notes,
    }).select().single();

    if (error) {
      console.error("Insert error:", error);
      throw new Error(`Failed to insert: ${error.message}`);
    }

    console.log("Agendamento created:", data.id);

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
