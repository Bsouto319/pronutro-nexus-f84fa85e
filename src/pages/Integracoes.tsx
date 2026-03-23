import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Zap, CheckCircle2, AlertCircle, RefreshCw, Smartphone, Database, Globe, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { getInvalidWebhookReason, getStoredWebhookUrl, saveWebhookUrl } from "@/lib/n8n-webhook";

const services = [
  {
    name: "n8n Workflow Core",
    status: "online",
    icon: Zap,
    lastSync: "2 min atrás",
    details: "Fluxos de automação ativos e processando.",
    color: "text-primary"
  },
  {
    name: "Supabase Database",
    status: "online",
    icon: Database,
    lastSync: "Agora",
    details: "Conexão estável com latência de 24ms.",
    color: "text-success"
  },
  {
    name: "Maria AI (WhatsApp)",
    status: "online",
    icon: Smartphone,
    lastSync: "5 min atrás",
    details: "Instância conectada e aguardando mensagens.",
    color: "text-info"
  },
];

const Integracoes = () => {
  const [n8nUrl, setN8nUrl] = useState("");

  useEffect(() => {
    // Load saved URL from localStorage
    const savedUrl = getStoredWebhookUrl();
    if (savedUrl) setN8nUrl(savedUrl);
  }, []);

  const handleSaveUrl = () => {
    const invalidReason = getInvalidWebhookReason(n8nUrl);

    if (invalidReason) {
      toast.error("URL inválida", {
        description: invalidReason,
      });
      return;
    }

    saveWebhookUrl(n8nUrl);
    toast.success("URL do Webhook salva com sucesso!");
  };

  return (
    <AppLayout>
      <TopBar title="Centro de Integrações" subtitle="Monitore e gerencie as conexões do sistema" />
      <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Zap className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Conexões</h1>
              <p className="text-sm text-muted-foreground">Status em tempo real dos serviços Nexus</p>
            </div>
          </div>
          <Button variant="outline" className="glass">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sincronizar Tudo
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <motion.div
              key={service.name}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="glass rounded-xl p-6 border border-border/50 hover:border-primary/30 transition-all group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2 rounded-lg bg-muted/50 ${service.color}`}>
                  <service.icon className="w-6 h-6" />
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-success/10 text-success text-[10px] font-bold uppercase ring-1 ring-success/20">
                  <CheckCircle2 className="w-3 h-3" />
                  {service.status}
                </div>
              </div>
              <h3 className="font-display font-semibold text-foreground mb-1">{service.name}</h3>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
                {service.details}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <span className="text-[10px] text-muted-foreground">Visto: {service.lastSync}</span>
                <button className="text-primary hover:underline text-[10px] font-bold uppercase transition-all">Configurar</button>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="glass rounded-xl p-8 border border-border/50 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
          <div className="max-w-2xl">
            <h2 className="text-xl font-display font-bold text-foreground mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Configurações do Webhook n8n
            </h2>
            <p className="text-sm text-muted-foreground mb-6">
              O Nexus utiliza um webhook exclusivo para processar capturas de IA e mensagens do WhatsApp.
              **Coloque abaixo a URL que você criou no n8n.**
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                placeholder="Ex: https://n8n.btechsouto.shop/webhook/nexus-ai..."
                className="flex-1 glass font-mono text-xs"
                value={n8nUrl}
                onChange={(e) => setN8nUrl(e.target.value)}
              />
              <Button className="gradient-primary whitespace-nowrap" onClick={handleSaveUrl}>
                <Save className="w-4 h-4 mr-2" />
                Salvar URL
              </Button>
              <Button
                variant="outline"
                className="glass whitespace-nowrap"
                onClick={async () => {
                  if (!n8nUrl) return toast.error("Insira a URL primeiro");

                  const invalidReason = getInvalidWebhookReason(n8nUrl);
                  if (invalidReason) {
                    return toast.error("URL inválida", {
                      description: invalidReason,
                    });
                  }

                  toast.loading("Testando conexão...");
                  try {
                    const res = await fetch(n8nUrl, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'test', timestamp: Date.now() })
                    });
                    if (res.ok) toast.success("Conexão estabelecida com sucesso!");
                    else toast.error("URL respondendo com erro: " + res.status);
                  } catch (e) {
                    toast.error("Erro ao conectar: Verifique se o n8n está online.");
                  }
                }}
              >
                <Zap className="w-4 h-4 mr-2 text-primary" />
                Testar
              </Button>
            </div>
            <p className="mt-4 text-[11px] text-muted-foreground">
              <span className="text-warning font-bold uppercase">Importante:</span> A IA de captura (faturas/recibos) só funcionará após salvar esta URL.
            </p>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default Integracoes;
