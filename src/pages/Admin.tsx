import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSuperAdmin } from "@/hooks/useSuperAdmin";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Shield, Users, Building2, DollarSign, AlertCircle, CheckCircle2, Ban, Clock, Search, LogOut, UserPlus, Plus, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { format } from "date-fns";

type Status = "trial" | "active" | "overdue" | "blocked";

interface OrgRow {
  id: string;
  name: string;
  created_at: string;
  members_count: number;
  status: Status;
  monthly_value: number;
  due_date: string | null;
  last_payment_date: string | null;
  last_payment_value: number | null;
  notes: string | null;
  sub_id: string | null;
}

const STATUS_META: Record<Status, { label: string; color: string; icon: any }> = {
  trial: { label: "Trial", color: "bg-blue-500/10 text-blue-600 border-blue-500/20", icon: Clock },
  active: { label: "Em dia", color: "bg-success/10 text-success border-success/20", icon: CheckCircle2 },
  overdue: { label: "Atrasado", color: "bg-warning/10 text-warning border-warning/20", icon: AlertCircle },
  blocked: { label: "Bloqueado", color: "bg-destructive/10 text-destructive border-destructive/20", icon: Ban },
};

export default function Admin() {
  const { isSuperAdmin, loading } = useSuperAdmin();
  const { signOut } = useAuth();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<OrgRow | null>(null);
  const [ownerOrg, setOwnerOrg] = useState<OrgRow | null>(null);
  const [newClientOpen, setNewClientOpen] = useState(false);

  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ["admin-orgs"],
    enabled: isSuperAdmin,
    queryFn: async () => {
      const [orgsRes, subsRes, membersRes] = await Promise.all([
        supabase.from("organizations").select("id, name, created_at").order("created_at", { ascending: false }),
        supabase.from("org_subscriptions").select("*"),
        supabase.from("organization_members").select("organization_id"),
      ]);
      if (orgsRes.error) throw orgsRes.error;
      const subs = subsRes.data ?? [];
      const members = membersRes.data ?? [];
      return (orgsRes.data ?? []).map((o): OrgRow => {
        const sub = subs.find((s: any) => s.organization_id === o.id);
        const count = members.filter((m: any) => m.organization_id === o.id).length;
        return {
          id: o.id,
          name: o.name,
          created_at: o.created_at,
          members_count: count,
          status: (sub?.status ?? "trial") as Status,
          monthly_value: Number(sub?.monthly_value ?? 0),
          due_date: sub?.due_date ?? null,
          last_payment_date: sub?.last_payment_date ?? null,
          last_payment_value: sub?.last_payment_value ?? null,
          notes: sub?.notes ?? null,
          sub_id: sub?.id ?? null,
        };
      });
    },
  });

  const filtered = useMemo(
    () => orgs.filter(o => o.name.toLowerCase().includes(search.toLowerCase())),
    [orgs, search]
  );

  const metrics = useMemo(() => {
    const mrr = orgs.filter(o => o.status === "active").reduce((s, o) => s + o.monthly_value, 0);
    return {
      total: orgs.length,
      active: orgs.filter(o => o.status === "active").length,
      overdue: orgs.filter(o => o.status === "overdue").length,
      blocked: orgs.filter(o => o.status === "blocked").length,
      mrr,
      members: orgs.reduce((s, o) => s + o.members_count, 0),
    };
  }, [orgs]);

  const quickStatus = async (org: OrgRow, status: Status) => {
    const payload: any = { organization_id: org.id, status };
    if (status === "active") {
      payload.last_payment_date = format(new Date(), "yyyy-MM-dd");
      payload.last_payment_value = org.monthly_value;
    }
    const { error } = await supabase
      .from("org_subscriptions")
      .upsert(payload, { onConflict: "organization_id" });
    if (error) return toast.error(error.message);
    toast.success(`Status atualizado: ${STATUS_META[status].label}`);
    qc.invalidateQueries({ queryKey: ["admin-orgs"] });
  };

  const exportOrg = async (org: OrgRow) => {
    try {
      toast.info(`Exportando dados de ${org.name}...`);
      const { data, error } = await supabase.functions.invoke("export-org-data", {
        body: { org_id: org.id },
      });
      if (error) throw error;
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${org.name.replace(/[^a-z0-9]/gi, "_")}_${format(new Date(), "yyyy-MM-dd")}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("Dados exportados!");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao exportar");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }
  if (!isSuperAdmin) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold">Painel Super Admin</h1>
              <p className="text-sm text-muted-foreground">Gestão de clientes e cobrança</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setNewClientOpen(true)}><Plus className="w-4 h-4 mr-2" />Nova clínica + dono</Button>
            <Button variant="outline" onClick={signOut}><LogOut className="w-4 h-4 mr-2" />Sair</Button>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <KPI icon={Building2} label="Total Orgs" value={String(metrics.total)} />
          <KPI icon={CheckCircle2} label="Em dia" value={String(metrics.active)} tone="success" />
          <KPI icon={AlertCircle} label="Atrasados" value={String(metrics.overdue)} tone="warning" />
          <KPI icon={Ban} label="Bloqueados" value={String(metrics.blocked)} tone="destructive" />
          <KPI icon={Users} label="Usuários" value={String(metrics.members)} />
          <KPI icon={DollarSign} label="MRR" value={`R$ ${metrics.mrr.toFixed(2)}`} tone="success" />
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Buscar organização..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>

        {/* Orgs */}
        {isLoading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3">
            {filtered.map(org => {
              const meta = STATUS_META[org.status];
              const Icon = meta.icon;
              return (
                <Card key={org.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{org.name}</h3>
                        <Badge variant="outline" className={meta.color}>
                          <Icon className="w-3 h-3 mr-1" />{meta.label}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        <span>👥 {org.members_count} usuário(s)</span>
                        <span>💰 R$ {org.monthly_value.toFixed(2)}/mês</span>
                        {org.due_date && <span>📅 Vence {format(new Date(org.due_date), "dd/MM/yyyy")}</span>}
                        {org.last_payment_date && <span>✅ Pago em {format(new Date(org.last_payment_date), "dd/MM/yyyy")}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => quickStatus(org, "active")} disabled={org.status === "active"}>
                        <CheckCircle2 className="w-4 h-4 mr-1" />Marcar pago
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => quickStatus(org, "blocked")} disabled={org.status === "blocked"}>
                        <Ban className="w-4 h-4 mr-1" />Bloquear
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => setOwnerOrg(org)}>
                        <UserPlus className="w-4 h-4 mr-1" />Promover dono
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => exportOrg(org)}>
                        <Download className="w-4 h-4 mr-1" />Exportar dados
                      </Button>
                      <Button size="sm" onClick={() => setEditing(org)}>Editar</Button>
                    </div>
                  </div>
                </Card>
              );
            })}
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground py-12">Nenhuma organização encontrada</p>
            )}
          </div>
        )}

        <EditDialog org={editing} onClose={() => setEditing(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-orgs"] })} />
        <AssignOwnerDialog org={ownerOrg} onClose={() => setOwnerOrg(null)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-orgs"] })} />
        <NewClientDialog open={newClientOpen} onClose={() => setNewClientOpen(false)} onSaved={() => qc.invalidateQueries({ queryKey: ["admin-orgs"] })} />
      </div>
    </div>
  );
}

function AssignOwnerDialog({ org, onClose, onSaved }: { org: OrgRow | null; onClose: () => void; onSaved: () => void }) {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { setEmail(""); }, [org]);

  const submit = async () => {
    if (!org || !email.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-org-owner", {
        body: { email: email.trim(), organization_id: org.id },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success(`${email} agora é admin de ${org.name}`);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao promover dono");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!org} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Promover dono — {org?.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Informe o e-mail do cliente. Ele precisa ter <strong>criado conta</strong> no app antes.
            Será adicionado à organização e receberá o papel <strong>Admin</strong>.
          </p>
          <div>
            <Label>E-mail do dono</Label>
            <Input type="email" placeholder="cliente@email.com" value={email} onChange={e => setEmail(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !email.trim()}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Promover a Admin
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewClientDialog({ open, onClose, onSaved }: { open: boolean; onClose: () => void; onSaved: () => void }) {
  const [clinicName, setClinicName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (!open) { setClinicName(""); setEmail(""); } }, [open]);

  const submit = async () => {
    if (!clinicName.trim() || !email.trim()) return;
    setBusy(true);
    try {
      const { data, error } = await supabase.functions.invoke("assign-org-owner", {
        body: { email: email.trim(), create_org_name: clinicName.trim() },
      });
      if (error || (data as any)?.error) throw new Error((data as any)?.error || error?.message);
      toast.success(`Clínica "${clinicName}" criada e ${email} promovido a Admin`);
      onSaved();
      onClose();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar cliente");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nova clínica + dono</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Cria a organização e já vincula o dono como Admin. O e-mail informado precisa ter conta criada no app.
          </p>
          <div>
            <Label>Nome da clínica</Label>
            <Input value={clinicName} onChange={e => setClinicName(e.target.value)} placeholder="Ex: Clínica Estética Beleza" />
          </div>
          <div>
            <Label>E-mail do dono</Label>
            <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="cliente@email.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>Cancelar</Button>
          <Button onClick={submit} disabled={busy || !clinicName.trim() || !email.trim()}>
            {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Criar e promover
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function KPI({ icon: Icon, label, value, tone = "neutral" }: any) {
  const toneClass = tone === "success" ? "text-success bg-success/10" : tone === "warning" ? "text-warning bg-warning/10" : tone === "destructive" ? "text-destructive bg-destructive/10" : "text-primary bg-primary/10";
  return (
    <Card className="p-4">
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center mb-2 ${toneClass}`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-lg font-display font-bold">{value}</p>
    </Card>
  );
}

function EditDialog({ org, onClose, onSaved }: { org: OrgRow | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState<any>({});
  useEffect(() => {
    if (org) setForm({
      status: org.status,
      monthly_value: org.monthly_value,
      due_date: org.due_date ?? "",
      last_payment_date: org.last_payment_date ?? "",
      last_payment_value: org.last_payment_value ?? "",
      notes: org.notes ?? "",
    });
  }, [org]);

  const save = async () => {
    if (!org) return;
    const { error } = await supabase.from("org_subscriptions").upsert({
      organization_id: org.id,
      status: form.status,
      monthly_value: Number(form.monthly_value) || 0,
      due_date: form.due_date || null,
      last_payment_date: form.last_payment_date || null,
      last_payment_value: form.last_payment_value === "" ? null : Number(form.last_payment_value),
      notes: form.notes || null,
    }, { onConflict: "organization_id" });
    if (error) return toast.error(error.message);
    toast.success("Atualizado!");
    onSaved();
    onClose();
  };

  const remove = async () => {
    if (!org) return;
    if (!confirm(`Excluir PERMANENTEMENTE a organização "${org.name}" e todos os dados?`)) return;
    const { error } = await supabase.from("organizations").delete().eq("id", org.id);
    if (error) return toast.error(error.message);
    toast.success("Organização excluída");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={!!org} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>{org?.name}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Status</Label>
            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="trial">Trial</SelectItem>
                <SelectItem value="active">Em dia</SelectItem>
                <SelectItem value="overdue">Atrasado</SelectItem>
                <SelectItem value="blocked">Bloqueado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Valor mensal (R$)</Label><Input type="number" step="0.01" value={form.monthly_value} onChange={e => setForm({ ...form, monthly_value: e.target.value })} /></div>
            <div><Label>Vencimento</Label><Input type="date" value={form.due_date} onChange={e => setForm({ ...form, due_date: e.target.value })} /></div>
            <div><Label>Último pagamento</Label><Input type="date" value={form.last_payment_date} onChange={e => setForm({ ...form, last_payment_date: e.target.value })} /></div>
            <div><Label>Valor pago (R$)</Label><Input type="number" step="0.01" value={form.last_payment_value} onChange={e => setForm({ ...form, last_payment_value: e.target.value })} /></div>
          </div>
          <div><Label>Notas</Label><Input value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Observações internas" /></div>
        </div>
        <DialogFooter className="gap-2">
          <Button variant="destructive" onClick={remove}>Excluir org</Button>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={save}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
