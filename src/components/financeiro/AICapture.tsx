import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Camera, FileUp, Sparkles, Loader2, CheckCircle2, AlertCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useOrganization } from "@/hooks/useOrganization";
import { supabase } from "@/integrations/supabase/client";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

export function AICapture() {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const { refetch } = useFinanceData();
  const { organizationId } = useOrganization();
  const cameraRef = useRef<HTMLInputElement>(null);
  const uploadRef = useRef<HTMLInputElement>(null);

  const resetSelection = () => {
    setPreview(null);
    setPendingFile(null);
    if (cameraRef.current) cameraRef.current.value = "";
    if (uploadRef.current) uploadRef.current.value = "";
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Tipo de arquivo não suportado", { description: "Aceitos: JPEG, PNG, WebP ou PDF." });
      event.target.value = "";
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("Arquivo muito grande", { description: "O limite é 10 MB por arquivo." });
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
    setPendingFile(file);
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleSend = async () => {
    if (!pendingFile || !organizationId) return;

    setIsUploading(true);
    try {
      const imageBase64 = await fileToBase64(pendingFile);

      const { data, error } = await supabase.functions.invoke("analyze-receipt", {
        body: { imageBase64, fileName: pendingFile.name, organizationId },
      });

      if (error) throw error;

      if (data?.success) {
        const { extracted } = data;
        const valorFormatado = (extracted.valor || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
        toast.success("Recibo processado com IA!", {
          description: `${extracted.descricao} — ${valorFormatado} (${extracted.categoria})`,
          icon: <CheckCircle2 className="w-5 h-5 text-success" />,
          duration: 6000,
        });
      } else {
        toast.warning("IA não conseguiu extrair todos os dados", {
          description: data?.error || "O recibo foi salvo para revisão manual.",
          icon: <AlertCircle className="w-5 h-5 text-yellow-500" />,
        });
      }

      resetSelection();
      await refetch();
    } catch (err) {
      if (import.meta.env.DEV) console.error("Analyze receipt error:", err);
      toast.error("Erro ao processar recibo", {
        description: "Tente novamente ou insira os dados manualmente.",
        icon: <AlertCircle className="w-5 h-5 text-destructive" />,
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass border border-primary/20 bg-primary/5 rounded-xl px-4 py-3 flex flex-wrap items-center gap-3"
    >
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-display font-bold text-foreground leading-tight">Analista de Insumos IA</p>
          <p className="text-[11px] text-muted-foreground truncate">
            {pendingFile ? `${pendingFile.name} pronto para análise` : "Envie nota, lista ou boleto — IA extrai e categoriza"}
          </p>
        </div>
      </div>

      {preview && pendingFile && !pendingFile.type.includes("pdf") && (
        <img src={preview} alt="" className="w-10 h-10 rounded-md object-cover border border-border/40" />
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Button
          size="sm"
          onClick={() => cameraRef.current?.click()}
          disabled={isUploading}
          className="gradient-primary hover:opacity-90 h-9"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          <span className="ml-1.5">Capturar</span>
        </Button>
        <input ref={cameraRef} type="file" accept="image/jpeg,image/png,image/webp" capture="environment" className="hidden" onChange={handleFileSelect} />

        <Button
          size="sm"
          variant="outline"
          className="bg-muted/50 h-9"
          onClick={() => uploadRef.current?.click()}
          disabled={isUploading}
        >
          <FileUp className="w-4 h-4 mr-1.5" />
          Upload
        </Button>
        <input ref={uploadRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" className="hidden" onChange={handleFileSelect} />

        {pendingFile && !isUploading && (
          <>
            <Button size="sm" onClick={handleSend} className="gradient-primary h-9">
              <Send className="w-4 h-4 mr-1.5" />
              Analisar
            </Button>
            <Button size="sm" variant="ghost" onClick={resetSelection} className="h-9 w-9 p-0">
              <X className="w-4 h-4" />
            </Button>
          </>
        )}

        {isUploading && (
          <span className="text-xs text-primary flex items-center gap-1.5">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            IA analisando…
          </span>
        )}
      </div>
    </motion.div>
  );
}
