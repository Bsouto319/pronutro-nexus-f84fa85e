export const N8N_WEBHOOK_STORAGE_KEY = "nexus_n8n_webhook_url";

const WEBHOOK_PATH_REGEX = /\/webhook(?:-test)?\//i;

type UploadArgs = {
  file: File;
  organizationId: string;
  webhookUrl: string;
};

export function getStoredWebhookUrl(): string | null {
  if (typeof window === "undefined") return null;

  const value = window.localStorage.getItem(N8N_WEBHOOK_STORAGE_KEY)?.trim();
  return value ? value : null;
}

export function saveWebhookUrl(url: string) {
  const normalizedUrl = url.trim();

  window.localStorage.setItem(N8N_WEBHOOK_STORAGE_KEY, normalizedUrl);
  window.dispatchEvent(new Event("n8n_url_updated"));
}

export function getInvalidWebhookReason(url: string): string | null {
  try {
    const parsedUrl = new URL(url.trim());

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return "A URL precisa começar com http:// ou https://.";
    }

    if (parsedUrl.pathname.includes("/rest/oauth2-credential/callback")) {
      return "Use a URL publicada do webhook do n8n, não a URL de callback OAuth.";
    }

    if (parsedUrl.pathname.includes("/workflow/")) {
      return "Use a URL final no formato /webhook/...; a rota /workflow/ é apenas do editor do n8n.";
    }

    if (!WEBHOOK_PATH_REGEX.test(parsedUrl.pathname)) {
      return "Informe a URL publicada do n8n no formato /webhook/... ou /webhook-test/...";
    }

    return null;
  } catch {
    return "URL inválida.";
  }
}

function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error("Não foi possível ler o arquivo selecionado."));

    reader.readAsDataURL(file);
  });
}

async function parseWebhookResponse(response: Response) {
  const responseText = await response.text();

  if (!response.ok) {
    throw new Error(responseText || `Webhook retornou status ${response.status}.`);
  }

  if (!responseText) return null;

  try {
    return JSON.parse(responseText);
  } catch {
    return responseText;
  }
}

async function postMultipartToWebhook({ file, organizationId, webhookUrl }: UploadArgs) {
  const formData = new FormData();
  const messageId = `DASH_${Date.now()}`;

  formData.append("action", "processReceipt");
  formData.append("source", "dashboard");
  formData.append("origin", "financeiro");
  formData.append("organizationId", organizationId);
  formData.append("messageType", file.type.includes("pdf") ? "document" : "image");
  formData.append("senderName", "Usuário Dashboard");
  formData.append("messageid", messageId);
  formData.append("content", "Upload via Dashboard");
  formData.append("fileName", file.name);
  formData.append("mimeType", file.type || "application/octet-stream");
  formData.append("file", file, file.name);
  formData.append("upload", file, file.name);
  formData.append("receipt", file, file.name);

  const response = await fetch(webhookUrl, {
    method: "POST",
    body: formData,
  });

  return parseWebhookResponse(response);
}

async function postJsonToWebhook({ file, organizationId, webhookUrl }: UploadArgs) {
  const dataUrl = await fileToDataUrl(file);
  const base64 = dataUrl.includes(",") ? dataUrl.split(",")[1] : dataUrl;

  const response = await fetch(webhookUrl, {
    method: "POST",
    headers: {
      Accept: "application/json, text/plain, */*",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      action: "processReceipt",
      source: "dashboard",
      origin: "financeiro",
      messageType: file.type.includes("pdf") ? "document" : "image",
      senderName: "Usuário Dashboard",
      organizationId,
      fileURL: dataUrl,
      fileDataUrl: dataUrl,
      fileBase64: base64,
      base64,
      fileName: file.name,
      filename: file.name,
      mimeType: file.type || "application/octet-stream",
      contentType: file.type || "application/octet-stream",
      fileSize: file.size,
      messageid: `DASH_${Date.now()}`,
      content: "Upload via Dashboard",
    }),
  });

  return parseWebhookResponse(response);
}

export async function postFileToN8nWebhook(args: UploadArgs) {
  try {
    return await postMultipartToWebhook(args);
  } catch (multipartError) {
    try {
      return await postJsonToWebhook(args);
    } catch (jsonError) {
      const multipartMessage = multipartError instanceof Error ? multipartError.message : "Falha no envio multipart.";
      const jsonMessage = jsonError instanceof Error ? jsonError.message : "Falha no envio JSON.";

      throw new Error(`${multipartMessage} ${jsonMessage}`.trim());
    }
  }
}