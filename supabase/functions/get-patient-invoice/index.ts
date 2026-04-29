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

function normalizePhone(p: string | null | undefined): string | null {
  if (!p) return null;
  const digits = p.replace(/\D/g, "");
  return digits || null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  // Webhook auth
  const expected = Deno.env.get("WEBHOOK_SECRET");
  const provided = req.headers.get("x-webhook-secret") ?? new URL(req.url).searchParams.get("secret");
  if (!expected || provided !== expected) {
    return json({ error: "unauthorized" }, 401);
  }

  const url = new URL(req.url);
  let params: Record<string, any> = Object.fromEntries(url.searchParams.entries());
  if (req.method === "POST") {
    try {
      const body = await req.json();
      params = { ...params, ...body };
    } catch { /* ignore */ }
  }

  const patientId = params.patient_id as string | undefined;
  const phone = params.phone as string | undefined;
  const name = params.name as string | undefined;
  const invoiceNumber = params.invoice_number as string | undefined;
  const latest = String(params.latest ?? "true").toLowerCase() === "true";
  const list = String(params.list ?? "false").toLowerCase() === "true";
  const expiresIn = Math.min(Math.max(Number(params.expires_in) || 600, 60), 3600);

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  // Find patient
  let patient: any = null;
  if (patientId) {
    const { data } = await supabase.from("clinic_patients").select("*").eq("id", patientId).maybeSingle();
    patient = data;
  } else if (phone) {
    const digits = normalizePhone(phone)!;
    // Match by trailing digits to ignore country code / formatting
    const { data } = await supabase.from("clinic_patients").select("*");
    patient = (data || []).find((p: any) => normalizePhone(p.phone)?.endsWith(digits.slice(-8))) || null;
  } else if (name) {
    const { data } = await supabase
      .from("clinic_patients")
      .select("*")
      .ilike("name", `%${name}%`)
      .limit(1);
    patient = data?.[0] || null;
  } else {
    return json({ error: "Missing identifier: provide patient_id, phone, or name" }, 400);
  }

  if (!patient) return json({ error: "patient_not_found" }, 404);

  // Query invoices
  let q = supabase
    .from("patient_invoices")
    .select("*")
    .eq("patient_id", patient.id)
    .eq("organization_id", patient.organization_id)
    .order("created_at", { ascending: false });

  if (invoiceNumber) q = q.eq("invoice_number", invoiceNumber);
  if (!list && latest) q = q.limit(1);

  const { data: invoices, error } = await q;
  if (error) return json({ error: error.message }, 500);
  if (!invoices?.length) return json({ error: "invoice_not_found", patient: { id: patient.id, name: patient.name } }, 404);

  // Generate signed URLs
  const enriched = await Promise.all(
    invoices.map(async (inv: any) => {
      const { data: signed } = await supabase.storage
        .from("patient-invoices")
        .createSignedUrl(inv.file_path, expiresIn);
      return {
        id: inv.id,
        file_name: inv.file_name,
        mime_type: inv.mime_type,
        file_size: inv.file_size,
        invoice_number: inv.invoice_number,
        issue_date: inv.issue_date,
        value: inv.value,
        notes: inv.notes,
        download_url: signed?.signedUrl ?? null,
        expires_in: expiresIn,
        created_at: inv.created_at,
      };
    })
  );

  const response: any = {
    patient: { id: patient.id, name: patient.name, phone: patient.phone },
    expires_in: expiresIn,
  };
  if (list) response.invoices = enriched;
  else response.invoice = enriched[0];

  return json(response);
});
