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
    const patient_name = body.patient_name || body.paciente || body.nome || body.summary || "Paciente não identificado";
    const doctor_name = body.doctor_name || body.medico || body.doctor || null;
    const date = body.date || body.data || new Date().toISOString().split("T")[0];
    const time = body.time || body.horario || body.hora || null;
    const status = body.status || "confirmado";
    const source = body.source || "google_calendar";
    const notes = body.notes || body.observacoes || body.description || null;

    const { data, error } = await supabase.from("agendamentos").insert({
      organization_id: ORG_ID,
      patient_name,
      doctor_name,
      date,
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
