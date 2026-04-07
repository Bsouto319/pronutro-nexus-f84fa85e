import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const orgId = url.searchParams.get("org_id");
    const tables = url.searchParams.get("tables")?.split(",") || [
      "clinic_patients",
      "clinic_doctors",
      "financial_transactions",
      "patient_consultations",
      "agendamentos",
      "leads",
      "gastos",
      "follow_ups",
    ];
    const format = url.searchParams.get("format") || "json";

    if (!orgId) {
      return new Response(JSON.stringify({ error: "org_id obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify membership via RLS - if user isn't a member, queries return empty
    const allowedTables = [
      "clinic_patients", "clinic_doctors", "financial_transactions",
      "patient_consultations", "agendamentos", "leads", "gastos",
      "follow_ups", "procedures", "bank_accounts",
    ];

    const result: Record<string, unknown[]> = {};

    for (const table of tables) {
      if (!allowedTables.includes(table)) continue;

      const { data, error } = await supabase
        .from(table)
        .select("*")
        .eq("organization_id", orgId)
        .limit(5000);

      if (error) {
        result[table] = [];
      } else {
        result[table] = data || [];
      }
    }

    if (format === "csv") {
      let csv = "";
      for (const [tableName, rows] of Object.entries(result)) {
        if (rows.length === 0) continue;
        csv += `\n--- ${tableName} ---\n`;
        const headers = Object.keys(rows[0] as Record<string, unknown>);
        csv += headers.join(",") + "\n";
        for (const row of rows) {
          const r = row as Record<string, unknown>;
          csv += headers.map((h) => {
            const val = r[h];
            const str = val === null ? "" : String(val);
            return str.includes(",") || str.includes('"') || str.includes("\n")
              ? `"${str.replace(/"/g, '""')}"`
              : str;
          }).join(",") + "\n";
        }
      }

      return new Response(csv, {
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="export_${orgId.slice(0, 8)}.csv"`,
        },
      });
    }

    return new Response(JSON.stringify(result, null, 2), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: "Erro interno" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
