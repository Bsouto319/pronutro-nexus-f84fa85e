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
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Auth user client
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role, organization_id } = await req.json();

    if (!email || !organization_id) {
      return new Response(JSON.stringify({ error: "Dados obrigatórios faltando" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify caller is admin and member of org
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: callerRole } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["admin", "manager"])
      .limit(1)
      .maybeSingle();

    if (!callerRole) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    const targetUser = users?.find((u: any) => u.email === email.toLowerCase());

    if (!targetUser) {
      return new Response(JSON.stringify({ error: "Usuário não encontrado. Ele precisa criar uma conta primeiro." }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if already a member of THIS organization
    const { data: existing } = await adminClient
      .from("organization_members")
      .select("id")
      .eq("user_id", targetUser.id)
      .eq("organization_id", organization_id)
      .maybeSingle();

    // Add as member (only if not yet) — idempotent
    if (!existing) {
      const { error: memberError } = await adminClient
        .from("organization_members")
        .insert({ user_id: targetUser.id, organization_id });
      if (memberError) throw memberError;
    }

    // Assign role (idempotent): drop previous assignable roles, then insert
    const ASSIGNABLE = ["staff", "doctor", "manager"];
    if (role && ASSIGNABLE.includes(role)) {
      // Remove any existing assignable role to avoid duplicates / conflicts
      await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", targetUser.id)
        .in("role", ASSIGNABLE);

      const { error: roleError } = await adminClient
        .from("user_roles")
        .insert({ user_id: targetUser.id, role });
      if (roleError) throw roleError;
    }

    return new Response(
      JSON.stringify({ success: true, already_member: !!existing }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("invite-member error:", err);
    return new Response(
      JSON.stringify({ error: err?.message || "Erro interno ao convidar membro" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
