import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const expected = Deno.env.get("WEBHOOK_SECRET");
  const provided = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("secret");
  if (!expected || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    if (req.method === "POST") {
      const body = await req.json().catch(() => ({}));
      const { id, action } = body ?? {};
      if (action !== "mark_sent" || typeof id !== "string") {
        return json({ error: "invalid_body", expected: { id: "uuid", action: "mark_sent" } }, 400);
      }
      const { error } = await supabase
        .from("agendamentos")
        .update({ lembrete_enviado: true })
        .eq("id", id);
      if (error) return json({ error: error.message }, 500);
      return json({ success: true, id });
    }

    // GET: list pending reminders in window
    const url = new URL(req.url);
    const fromIso = url.searchParams.get("from_iso");
    const toIso = url.searchParams.get("to_iso");

    if (!fromIso || !toIso) {
      return json({ error: "missing_params", required: ["from_iso", "to_iso"] }, 400);
    }

    const { data, error } = await supabase
      .from("agendamentos")
      .select("id, paciente_nome, paciente_telefone, profissional, data_inicio, status, lembrete_enviado")
      .gte("data_inicio", fromIso)
      .lte("data_inicio", toIso)
      .eq("lembrete_enviado", false)
      .neq("status", "cancelado")
      .order("data_inicio", { ascending: true });

    if (error) return json({ error: error.message }, 500);

    return json({
      count: data?.length ?? 0,
      from_iso: fromIso,
      to_iso: toIso,
      agendamentos: (data ?? []).map((a) => ({
        id: a.id,
        paciente_nome: a.paciente_nome,
        paciente_telefone: a.paciente_telefone,
        profissional: a.profissional,
        data_inicio: a.data_inicio,
        status: a.status,
      })),
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "unknown_error";
    return json({ error: msg }, 500);
  }
});
