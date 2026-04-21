import { AppLayout } from "@/components/AppLayout";
import { TopBar } from "@/components/TopBar";
import { Settings, Building2, Bell, Save, Zap, Download, FileJson, FileSpreadsheet, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InviteTeamDialog } from "@/components/InviteTeamDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getInvalidWebhookReason, getStoredWebhookUrl, saveWebhookUrl } from "@/lib/n8n-webhook";
import { TeamManagement } from "@/components/TeamManagement";
const Configuracoes = () => {
  const { organizationId } = useOrganization();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Org data
  const { data: org } = useQuery({
    queryKey: ["organization", organizationId],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data } = await supabase
        .from("organizations")
        .select("*")
        .eq("id", organizationId!)
        .single();
      return data;
    },
  });

  const [orgName, setOrgName] = useState("");
  const [n8nUrl, setN8nUrl] = useState("");
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: "json" | "csv") => {
    if (!organizationId) return;
    setIsExporting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão inválida");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const url = `https://${projectId}.supabase.co/functions/v1/export-org-data?org_id=${organizationId}&format=${format}`;
      
      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!res.ok) throw new Error("Erro na exportação");

      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `export_${organizationId.slice(0, 8)}_${new Date().toISOString().slice(0, 10)}.${format}`;
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success(`Dados exportados em ${format.toUpperCase()}!`);
    } catch (err) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao exportar dados.");
    } finally {
      setIsExporting(false);
    }
  };

  useEffect(() => {
    if (org) setOrgName(org.name);
    const saved = getStoredWebhookUrl();
    if (saved) setN8nUrl(saved);
  }, [org]);

  const handleSaveOrg = async () => {
    if (!organizationId || !orgName) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName })
        .eq("id", organizationId);
      if (error) throw error;
      toast.success("Nome da organização atualizado!");
      queryClient.invalidateQueries({ queryKey: ["organization"] });
    } catch (err: any) {
      if (import.meta.env.DEV) console.error(err);
      toast.error("Erro ao salvar configurações.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWebhook = () => {
    const invalidReason = n8nUrl ? getInvalidWebhookReason(n8nUrl) : null;

    if (invalidReason) {
      toast.error("URL inválida", {
        description: invalidReason,
      });
      return;
    }

    saveWebhookUrl(n8nUrl);
    toast.success("URL do Webhook salva!");
  };

  return (
    <AppLayout>
      <TopBar title="Configurações" subtitle="Gerencie as configurações do sistema" />
      <div className="p-4 md:p-6 max-w-[900px] mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Settings className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Personalize o sistema</p>
          </div>
        </div>

        <Tabs defaultValue="org" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5 glass">
            <TabsTrigger value="org" className="gap-2"><Building2 className="w-4 h-4" /> Organização</TabsTrigger>
            <TabsTrigger value="team" className="gap-2"><Settings className="w-4 h-4" /> Equipe</TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2"><Zap className="w-4 h-4" /> Integrações</TabsTrigger>
            <TabsTrigger value="export" className="gap-2"><Download className="w-4 h-4" /> Exportar</TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2"><Bell className="w-4 h-4" /> Notificações</TabsTrigger>
          </TabsList>

          <TabsContent value="org">
            <div className="glass rounded-2xl p-6 border border-border/40 space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground mb-1">Dados da Organização</h2>
                <p className="text-sm text-muted-foreground">Informações básicas da sua clínica.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Clínica</Label>
                  <Input value={orgName} onChange={(e) => setOrgName(e.target.value)} placeholder="Nome da organização" />
                </div>
                <div className="space-y-2">
                  <Label>E-mail do Administrador</Label>
                  <Input value={user?.email || ""} disabled className="opacity-60" />
                </div>
                <div className="space-y-2">
                  <Label>ID da Organização</Label>
                  <Input value={organizationId || ""} disabled className="opacity-60 font-mono text-xs" />
                </div>
              </div>
              <Button onClick={handleSaveOrg} disabled={isSaving} className="gradient-primary">
                <Save className="w-4 h-4 mr-2" /> {isSaving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="team">
            <div className="glass rounded-2xl p-6 border border-border/40 space-y-6">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <h2 className="text-lg font-display font-bold text-foreground mb-1">Gerenciar Equipe</h2>
                  <p className="text-sm text-muted-foreground">Convide membros e defina o nível de acesso de cada um.</p>
                </div>
                <InviteTeamDialog />
              </div>

              <div className="grid sm:grid-cols-3 gap-2 text-xs">
                <div className="p-3 rounded-lg border border-amber-500/30 bg-amber-500/5">
                  <p className="font-semibold text-amber-700 mb-1">👤 Atendente</p>
                  <p className="text-muted-foreground">Agenda, pacientes, leads. <strong>Sem Financeiro.</strong></p>
                </div>
                <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5">
                  <p className="font-semibold text-blue-600 mb-1">💼 Gerente</p>
                  <p className="text-muted-foreground">Tudo + Financeiro completo.</p>
                </div>
                <div className="p-3 rounded-lg border border-primary/30 bg-primary/5">
                  <p className="font-semibold text-primary mb-1">👑 Administrador</p>
                  <p className="text-muted-foreground">Tudo + gestão de equipe e clínica.</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border/30">
                <h3 className="font-semibold text-foreground mb-3">Membros da clínica</h3>
                <TeamManagement />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations">
            <div className="glass rounded-2xl p-6 border border-border/40 space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground mb-1">Webhook n8n</h2>
                <p className="text-sm text-muted-foreground">Configure a URL do seu workflow de automação.</p>
              </div>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>URL do Webhook</Label>
                  <Input
                    value={n8nUrl}
                    onChange={(e) => setN8nUrl(e.target.value)}
                    placeholder="https://n8n.seudominio.com/webhook/..."
                    className="font-mono text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button onClick={handleSaveWebhook} className="gradient-primary">
                  <Save className="w-4 h-4 mr-2" /> Salvar URL
                </Button>
                <Button
                  variant="outline"
                  onClick={async () => {
                    if (!n8nUrl) return toast.error("Insira a URL primeiro");

                    const invalidReason = getInvalidWebhookReason(n8nUrl);
                    if (invalidReason) {
                      return toast.error("URL inválida", {
                        description: invalidReason,
                      });
                    }

                    try {
                      const res = await fetch(n8nUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ action: 'test', timestamp: Date.now() })
                      });
                      if (res.ok) toast.success("Conexão OK!");
                      else toast.error("Erro: " + res.status);
                    } catch {
                      toast.error("Erro ao conectar ao webhook.");
                    }
                  }}
                >
                  <Zap className="w-4 h-4 mr-2" /> Testar Conexão
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Esta URL é usada pela IA de captura de insumos e pelo Kanban de leads.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="export">
            <div className="glass rounded-2xl p-6 border border-border/40 space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground mb-1">Exportar Dados da Organização</h2>
                <p className="text-sm text-muted-foreground">
                  Exporte todos os dados da sua organização (pacientes, consultas, financeiro, leads, agenda).
                  Ideal para atender solicitações de clientes ou para backup.
                </p>
              </div>
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-start gap-3">
                <Shield className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                <div className="text-sm text-foreground">
                  <p className="font-medium mb-1">Segurança Multi-Tenant</p>
                  <p className="text-muted-foreground">
                    A exportação retorna apenas os dados da <strong>sua organização</strong>. 
                    Cada cliente opera em um ambiente isolado — nenhum dado de outras organizações é acessível.
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <button
                  onClick={() => handleExport("json")}
                  disabled={isExporting}
                  className="flex items-center gap-4 p-5 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                    <FileJson className="w-6 h-6 text-blue-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Exportar JSON</p>
                    <p className="text-xs text-muted-foreground">Formato completo para integração com outros sistemas</p>
                  </div>
                </button>
                <button
                  onClick={() => handleExport("csv")}
                  disabled={isExporting}
                  className="flex items-center gap-4 p-5 rounded-xl bg-muted/20 border border-border/30 hover:bg-muted/40 transition-colors text-left disabled:opacity-50"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-6 h-6 text-green-500" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">Exportar CSV</p>
                    <p className="text-xs text-muted-foreground">Compatível com Excel e Google Sheets</p>
                  </div>
                </button>
              </div>
              {isExporting && (
                <p className="text-sm text-muted-foreground animate-pulse">Exportando dados...</p>
              )}
              <p className="text-xs text-muted-foreground">
                Tabelas incluídas: Pacientes, Médicos, Consultas, Transações Financeiras, Gastos, Agendamentos, Leads, Follow-ups e Procedimentos.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="notifications">
            <div className="glass rounded-2xl p-6 border border-border/40 space-y-6">
              <div>
                <h2 className="text-lg font-display font-bold text-foreground mb-1">Preferências de Notificação</h2>
                <p className="text-sm text-muted-foreground">Configure como você deseja ser notificado.</p>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30">
                  <div>
                    <p className="font-medium text-foreground">Notificações por E-mail</p>
                    <p className="text-sm text-muted-foreground">Receba atualizações no seu e-mail.</p>
                  </div>
                  <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} />
                </div>
                <div className="flex items-center justify-between p-4 rounded-xl bg-muted/20 border border-border/30">
                  <div>
                    <p className="font-medium text-foreground">Notificações WhatsApp</p>
                    <p className="text-sm text-muted-foreground">Alertas via WhatsApp para novos leads.</p>
                  </div>
                  <Switch checked={notifyWhatsApp} onCheckedChange={setNotifyWhatsApp} />
                </div>
              </div>
              <Button onClick={() => toast.success("Preferências salvas!")} className="gradient-primary">
                <Save className="w-4 h-4 mr-2" /> Salvar Preferências
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
};

export default Configuracoes;
