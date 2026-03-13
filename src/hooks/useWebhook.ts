import { useState, useEffect, useCallback } from "react";

export interface WebhookMessage {
  id: string;
  leadId: string;
  direction: "sent" | "received";
  content: string;
  timestamp: string;
  channel?: string;
}

export interface WebhookLead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source?: string;
  status: string;
  lastMessage?: string;
  lastMessageAt?: string;
  assignedTo?: string;
  channel?: string;
  botActive?: boolean;
  tags?: string[];
}

const MOCK_MESSAGES: WebhookMessage[] = [
  { id: "m1", leadId: "mock1", direction: "received", content: "Olá, gostaria de agendar uma consulta", timestamp: new Date(Date.now() - 3600000).toISOString(), channel: "whatsapp" },
  { id: "m2", leadId: "mock1", direction: "sent", content: "Olá! Claro, temos horários disponíveis amanhã às 14h ou 16h. Qual prefere?", timestamp: new Date(Date.now() - 3500000).toISOString(), channel: "whatsapp" },
  { id: "m3", leadId: "mock1", direction: "received", content: "14h seria perfeito!", timestamp: new Date(Date.now() - 3400000).toISOString(), channel: "whatsapp" },
  { id: "m4", leadId: "mock1", direction: "sent", content: "Perfeito! Agendado para amanhã às 14h. Enviaremos um lembrete. 😊", timestamp: new Date(Date.now() - 3300000).toISOString(), channel: "whatsapp" },
];

function getWebhookUrl(): string | null {
  return localStorage.getItem("nexus_n8n_webhook_url");
}

export function useWebhook() {
  const [webhookUrl, setWebhookUrl] = useState<string | null>(getWebhookUrl());

  useEffect(() => {
    const handler = () => setWebhookUrl(getWebhookUrl());
    window.addEventListener("n8n_url_updated", handler);
    return () => window.removeEventListener("n8n_url_updated", handler);
  }, []);

  const fetchFromWebhook = useCallback(async (params: Record<string, string>) => {
    if (!webhookUrl) return null;
    try {
      const url = new URL(webhookUrl);
      Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
      const res = await fetch(url.toString(), { method: "GET" });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, [webhookUrl]);

  const postToWebhook = useCallback(async (body: Record<string, any>) => {
    if (!webhookUrl) return null;
    try {
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }, [webhookUrl]);

  const getMessages = useCallback(async (leadId: string): Promise<WebhookMessage[]> => {
    const data = await fetchFromWebhook({ action: "getMessages", leadId });
    if (Array.isArray(data)) return data;
    return MOCK_MESSAGES.map(m => ({ ...m, leadId }));
  }, [fetchFromWebhook]);

  const sendMessage = useCallback(async (leadId: string, message: string) => {
    return postToWebhook({ action: "sendMessage", leadId, message });
  }, [postToWebhook]);

  const toggleBot = useCallback(async (leadId: string, active: boolean) => {
    return postToWebhook({ action: "toggleBot", leadId, botStatus: active });
  }, [postToWebhook]);

  const takeOver = useCallback(async (leadId: string, handOver: boolean) => {
    return postToWebhook({ action: handOver ? "handOverToBot" : "takeOver", leadId });
  }, [postToWebhook]);

  const addNote = useCallback(async (leadId: string, note: string) => {
    return postToWebhook({ action: "addNote", leadId, note });
  }, [postToWebhook]);

  return { webhookUrl, fetchFromWebhook, postToWebhook, getMessages, sendMessage, toggleBot, takeOver, addNote };
}
