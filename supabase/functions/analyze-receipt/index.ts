import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { imageBase64, fileName, organizationId } = await req.json();

    if (!imageBase64 || !organizationId) {
      return new Response(JSON.stringify({ error: "Dados incompletos" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "Chave de IA não configurada" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Determine mime type
    const mimeType = fileName?.toLowerCase().endsWith(".pdf") ? "application/pdf" : "image/jpeg";

    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Você é um analista financeiro especializado em extrair dados de notas fiscais, recibos e boletos brasileiros.
Analise a imagem e extraia os dados financeiros. Responda APENAS com um JSON válido, sem markdown, sem texto adicional.

Formato exato do JSON:
{
  "descricao": "descrição clara e concisa do gasto/compra",
  "valor": 0.00,
  "categoria": "uma das categorias: materiais, medicamentos, equipamentos, alimentacao, transporte, servicos, impostos, aluguel, utilidades, marketing, outros",
  "fornecedor": "nome do fornecedor/estabelecimento ou null",
  "metodo_pagamento": "dinheiro, pix, cartao_credito, cartao_debito, boleto, transferencia ou null",
  "data_gasto": "YYYY-MM-DD ou null se não identificável",
  "itens": [{"nome": "item", "quantidade": 1, "valor_unitario": 0.00}]
}

Regras:
- O valor DEVE ser numérico (ex: 150.50), nunca string
- Se houver múltiplos itens, some todos para o valor total
- Se não conseguir ler o valor, retorne valor: 0 e adicione "(valor ilegível)" na descrição
- A data deve estar em formato YYYY-MM-DD
- Seja preciso nos valores, não arredonde`
          },
          {
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: {
                  url: `data:${mimeType};base64,${imageBase64}`,
                },
              },
              {
                type: "text",
                text: "Extraia todos os dados financeiros desta nota/recibo/boleto.",
              },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 2000,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI Gateway error:", errText);
      return new Response(JSON.stringify({ error: "Erro ao processar imagem com IA" }), { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const aiData = await aiResponse.json();
    const content = aiData.choices?.[0]?.message?.content || "";

    // Parse AI response - strip markdown code blocks if present
    let parsed;
    try {
      const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", content);
      return new Response(JSON.stringify({ error: "IA não conseguiu extrair dados", raw: content }), { status: 422, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate and sanitize
    const valor = typeof parsed.valor === "number" ? parsed.valor : parseFloat(parsed.valor) || 0;
    const descricao = (typeof parsed.descricao === "string" ? parsed.descricao : `Recibo: ${fileName || "upload"}`).slice(0, 500);
    const categoria = (parsed.categoria || "outros").slice(0, 100);
    const fornecedor = parsed.fornecedor ? String(parsed.fornecedor).slice(0, 255) : null;
    const metodo_pagamento = parsed.metodo_pagamento ? String(parsed.metodo_pagamento).slice(0, 50) : null;
    const data_gasto = /^\d{4}-\d{2}-\d{2}$/.test(parsed.data_gasto) ? parsed.data_gasto : new Date().toISOString().slice(0, 10);

    // Save to gastos table
    const { data: insertedData, error: insertError } = await supabase.from("gastos").insert([{
      organization_id: organizationId,
      descricao,
      valor,
      categoria,
      fornecedor,
      metodo_pagamento,
      data_gasto,
    }]).select().single();

    if (insertError) {
      console.error("Insert error:", insertError);
      return new Response(JSON.stringify({ error: "Erro ao salvar no banco" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    return new Response(JSON.stringify({
      success: true,
      data: insertedData,
      extracted: { descricao, valor, categoria, fornecedor, metodo_pagamento, data_gasto, itens: parsed.itens || [] },
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(JSON.stringify({ error: "Erro interno" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
