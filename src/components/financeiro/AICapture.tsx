import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, FileUp, Sparkles, Loader2, CheckCircle2, AlertCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function AICapture() {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { refetch } = useFinanceData();
  const { organizationId } = useOrganization();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado", {
        description: "Aceitos: JPEG, PNG, WebP ou PDF.",
      });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande", {
        description: "O limite é 10 MB por arquivo.",
      });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  const handleSend = async () => {
    if (!pendingFile || !organizationId) return;

    const webhookUrl = localStorage.getItem("nexus_n8n_webhook_url");
    if (!webhookUrl) {
      toast.error("Webhook não configurado", {
        description: "Vá em Configurações > Integrações e salve a URL do webhook n8n.",
      });
      return;
    }

    setIsUploading(true);
    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(pendingFile);
      });

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "dashboard",
          messageType: pendingFile.type.includes("pdf") ? "document" : "image",
          senderName: "Usuário Dashboard",
          organizationId,
          fileURL: base64,
          messageid: `DASH_${Date.now()}`,
          content: "Upload via Dashboard",
        }),
      });

      if (response.ok) {
        toast.success("Enviado com sucesso para análise IA!", {
          description: "Os dados serão processados e aparecerão no dashboard em breve.",
          icon: <CheckCircle2 className="w-5 h-5 text-success" />,
        });
        setPendingFile(null);
        setPreview(null);
        setTimeout(() => refetch(), 4000);
      } else {
        throw new Error("Erro ao enviar");
      }
    } catch (error) {
      console.error(error);
      toast.error("Erro no processamento", {
        description: "Não foi possível conectar ao analista de insumos.",
        icon: <AlertCircle className="w-5 h-5 text-destructive" />,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const clearPreview = () => {
    setPreview(null);
    setPendingFile(null);
  };

  return (
    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="col-span-full">
      <Card className="glass border-primary/20 bg-primary/5 overflow-hidden relative">
        <div className="absolute top-0 right-0 p-8 opacity-10 pointer-events-none">
          <Sparkles className="w-24 h-24 text-primary" />
        </div>

        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl font-display font-bold text-foreground">Analista de Insumos IA</CardTitle>
              <CardDescription className="text-muted-foreground">
                Envie fotos de notas, listas de materiais ou boletos para processamento automático.
              </CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3">
                <Button
                  onClick={() => cameraRef.current?.click()}
                  disabled={isUploading}
                  className="flex-1 h-12 text-md font-medium gradient-primary hover:opacity-90 flex items-center justify-center gap-2"
                >
                  {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                  Capturar Nota/Lista
                </Button>
                <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={handleFileSelect} />

                <Button
                  variant="outline"
                  className="flex-1 bg-muted/50 border-border hover:bg-muted"
                  onClick={() => uploadRef.current?.click()}
                  disabled={isUploading}
                >
                  <FileUp className="w-4 h-4 mr-2" />
                  Upload (Imagem/PDF)
                </Button>
                <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelect} />

                {pendingFile && !isUploading && (
                  <div className="flex gap-2">
                    <Button onClick={handleSend} className="flex-1 gradient-primary">
                      <Send className="w-4 h-4 mr-2" />
                      Enviar para Análise
                    </Button>
                    <Button variant="outline" size="icon" onClick={clearPreview}>
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div className="text-[10px] text-muted-foreground bg-muted/30 p-2 rounded border border-border/20">
                <p>💡 Fotos nítidas e bem iluminadas garantem 99.8% de precisão na extração. Máx 10 MB.</p>
              </div>
            </div>

            <div className="relative aspect-video lg:aspect-square xl:aspect-video rounded-xl border-2 border-dashed border-primary/30 flex items-center justify-center bg-black/20 overflow-hidden min-h-[160px]">
              {preview ? (
                pendingFile?.type.includes("pdf") ? (
                  <div className="text-center p-6">
                    <FileUp className="w-10 h-10 text-primary/50 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">{pendingFile.name}</p>
                  </div>
                ) : (
                  <img src={preview} alt="Preview" className="w-full h-full object-contain" />
                )
              ) : (
                <div className="text-center p-6">
                  <Camera className="w-10 h-10 text-primary/20 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Preview da imagem</p>
                </div>
              )}

              {isUploading && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center text-white">
                  <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
                  <p className="text-sm font-medium animate-pulse">Analisando insumos...</p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
