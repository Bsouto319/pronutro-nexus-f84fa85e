import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPER_ADMIN_EMAIL = "brunosouto1108@gmail.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Apenas o super admin pode usar
    if ((user.email || "").toLowerCase() !== SUPER_ADMIN_EMAIL) {
      return new Response(JSON.stringify({ error: "Apenas o super admin pode promover donos." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, organization_id, create_org_name } = await req.json();
    if (!email || (!organization_id && !create_org_name)) {
      return new Response(JSON.stringify({ error: "Informe email e organização (ou nome para criar)." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // 1) Encontrar usuário pelo email
    const { data: { users } } = await adminClient.auth.admin.listUsers();
    const target = users?.find((u: any) => (u.email || "").toLowerCase() === String(email).toLowerCase());
    if (!target) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado. Peça ao dono para criar conta primeiro." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2) Resolver organização (existente ou nova)
    let orgId = organization_id as string | undefined;
    if (!orgId && create_org_name) {
      const { data: newOrg, error: orgErr } = await adminClient
        .from("organizations")
        .insert({ name: String(create_org_name).trim() })
        .select("id")
        .single();
      if (orgErr) throw orgErr;
      orgId = newOrg.id;
    }

    // 3) Garantir membership
    const { data: existing } = await adminClient
      .from("organization_members")
      .select("id")
      .eq("user_id", target.id)
      .eq("organization_id", orgId!)
      .maybeSingle();

    if (!existing) {
      const { error: memErr } = await adminClient
        .from("organization_members")
        .insert({ user_id: target.id, organization_id: orgId! });
      if (memErr) throw memErr;
    }

    // 4) Garantir papel admin (sem duplicar)
    const { data: hasAdmin } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", target.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!hasAdmin) {
      const { error: roleErr } = await adminClient
        .from("user_roles")
        .insert({ user_id: target.id, role: "admin" });
      if (roleErr) throw roleErr;
    }

    return new Response(JSON.stringify({ success: true, organization_id: orgId, user_id: target.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err?.message || "Erro interno" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
