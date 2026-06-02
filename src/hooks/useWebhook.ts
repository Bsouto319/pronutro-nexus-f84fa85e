import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  channel?: string | null;
  botActive?: boolean;
  tags?: string[];
}

const leadMessagesTable = "lead_messages" as any;

function normalizeDirection(value: unknown): WebhookMessage["direction"] {
  const normalized = typeof value === "string" ? value.toLowerCase() : "";

  if (["sent", "outgoing", "assistant", "bot", "agent"].includes(normalized)) {
    return "sent";
  }

  return "received";
}

function normalizeTimestamp(value: unknown) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value))
    ? value
    : new Date().toISOString();
}

function normalizeMessage(raw: any, leadId: string): WebhookMessage | null {
  const content = raw?.content ?? raw?.message ?? raw?.text ?? raw?.body;

  if (typeof content !== "string" || !content.trim()) {
    return null;
  }

  return {
    id: String(raw?.id ?? raw?.message_id ?? `${leadId}-${Date.now()}-${Math.random()}`),
    leadId,
    direction: normalizeDirection(raw?.direction ?? raw?.sender ?? raw?.role),
    content: content.trim(),
    timestamp: normalizeTimestamp(raw?.timestamp ?? raw?.created_at ?? raw?.at ?? raw?.date),
    channel: typeof raw?.channel === "string" ? raw.channel : undefined,
  };
}

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
    const { data: storedMessages, error } = await supabase
      .from(leadMessagesTable)
      .select("id, content, direction, channel, created_at")
      .eq("lead_id", leadId)
      .order("created_at", { ascending: true });

    if (!error && storedMessages?.length) {
      return storedMessages.map((message: any) => ({
        id: String(message.id),
        leadId,
        direction: normalizeDirection(message.direction),
        content: String(message.content ?? ""),
        timestamp: normalizeTimestamp(message.created_at),
        channel: typeof message.channel === "string" ? message.channel : undefined,
      }));
    }

    const data = await fetchFromWebhook({ action: "getMessages", leadId });

    const rawMessages = Array.isArray(data)
      ? data
      : Array.isArray(data?.messages)
        ? data.messages
        : [];

    return rawMessages
      .map((message) => normalizeMessage(message, leadId))
      .filter((message): message is WebhookMessage => message !== null);
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

  // Send a file directly to UAZAPI (base64) — no n8n, no Storage needed.
  const sendFile = useCallback(async (
    _leadId: string,
    phone: string,
    file: File,
    _organizationId: string,
    caption?: string,
  ) => {
    const uazapiUrl   = import.meta.env.VITE_UAZAPI_URL   || "https://btechsoutoshop.uazapi.com";
    const uazapiToken = import.meta.env.VITE_UAZAPI_TOKEN || "066d2ebd-dca0-4b92-a9d4-f2b2e1506584";

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror   = () => reject(new Error("Erro ao ler o arquivo."));
      reader.readAsDataURL(file);
    });

    const ext     = (file.name.split(".").pop() || "").toLowerCase();
    const isDoc   = /pdf|doc|docx|xls|xlsx|csv|txt/.test(ext);
    const cleanPhone = phone.replace(/\D/g, "");

    const res = await fetch(`${uazapiUrl}/message/sendMedia/${uazapiToken}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone:     cleanPhone,
        base64,
        mediatype: isDoc ? "document" : "image",
        filename:  file.name,
        caption:   caption || file.name,
      }),
    });

    if (!res.ok) {
      const txt = await res.text().catch(() => "");
      throw new Error(`UAZAPI ${res.status}: ${txt.slice(0, 120)}`);
    }
    return res.json().catch(() => null);
  }, []);

  return { webhookUrl, fetchFromWebhook, postToWebhook, getMessages, sendMessage, sendFile, toggleBot, takeOver, addNote };
}
