import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Building2, User, MapPin, Image as ImageIcon, Save, Loader2, Upload } from "lucide-react";
import { useRef } from "react";
import { useOrganization } from "@/hooks/useOrganization";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Props { open: boolean; onOpenChange: (o: boolean) => void; }

export function ClinicProfileDialog({ open, onOpenChange }: Props) {
  const { organization, organizationId, refresh } = useOrganization();
  const { isAdmin } = useUserRole();
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (organization) setForm(organization);
  }, [organization, open]);

  const set = (k: string, v: any) => setForm((p: any) => ({ ...p, [k]: v }));

  const save = async () => {
    if (!organizationId) return;
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({
        name: form.name?.trim() || organization?.name,
        logo_url: form.logo_url || null,
        legal_name: form.legal_name || null,
        cnpj: form.cnpj || null,
        phone: form.phone || null,
        whatsapp: form.whatsapp || null,
        contact_email: form.contact_email || null,
        address_cep: form.address_cep || null,
        address_street: form.address_street || null,
        address_number: form.address_number || null,
        address_complement: form.address_complement || null,
        address_neighborhood: form.address_neighborhood || null,
        address_city: form.address_city || null,
        address_state: form.address_state || null,
        owner_name: form.owner_name || null,
        owner_cpf: form.owner_cpf || null,
        owner_role: form.owner_role || null,
      })
      .eq("id", organizationId);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success("Dados da clínica atualizados!");
    await refresh();
    onOpenChange(false);
  };

  const readOnly = !isAdmin;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary" />
            {organization?.name || "Minha Clínica"}
          </DialogTitle>
          <DialogDescription>
            {isAdmin ? "Edite as informações da sua clínica." : "Apenas administradores podem editar."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="identity">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="identity"><Building2 className="w-3.5 h-3.5 mr-1" />Identidade</TabsTrigger>
            <TabsTrigger value="brand"><ImageIcon className="w-3.5 h-3.5 mr-1" />Logo</TabsTrigger>
            <TabsTrigger value="address"><MapPin className="w-3.5 h-3.5 mr-1" />Endereço</TabsTrigger>
            <TabsTrigger value="owner"><User className="w-3.5 h-3.5 mr-1" />Responsável</TabsTrigger>
          </TabsList>

          <TabsContent value="identity" className="space-y-3 pt-4">
            <Field label="Nome fantasia" value={form.name} onChange={(v) => set("name", v)} ro={readOnly} />
            <Field label="Razão social" value={form.legal_name} onChange={(v) => set("legal_name", v)} ro={readOnly} />
            <Field label="CNPJ" value={form.cnpj} onChange={(v) => set("cnpj", v)} placeholder="00.000.000/0000-00" ro={readOnly} />
            <div className="grid grid-cols-2 gap-3">
              <Field label="Telefone" value={form.phone} onChange={(v) => set("phone", v)} ro={readOnly} />
              <Field label="WhatsApp" value={form.whatsapp} onChange={(v) => set("whatsapp", v)} ro={readOnly} />
            </div>
            <Field label="E-mail de contato" value={form.contact_email} onChange={(v) => set("contact_email", v)} type="email" ro={readOnly} />
          </TabsContent>

          <TabsContent value="brand" className="space-y-3 pt-4">
            <Field label="URL do logo" value={form.logo_url} onChange={(v) => set("logo_url", v)} placeholder="https://..." ro={readOnly} />
            {form.logo_url && (
              <div className="p-4 rounded-lg border bg-muted/20 flex items-center gap-3">
                <img src={form.logo_url} alt="Preview do logo" className="w-16 h-16 rounded-lg object-cover bg-background" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} />
                <p className="text-xs text-muted-foreground">Pré-visualização — assim aparecerá no menu lateral.</p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">Cole o link de uma imagem PNG ou JPG quadrada (recomendado 256×256).</p>
          </TabsContent>

          <TabsContent value="address" className="space-y-3 pt-4">
            <div className="grid grid-cols-3 gap-3">
              <Field label="CEP" value={form.address_cep} onChange={(v) => set("address_cep", v)} ro={readOnly} />
              <div className="col-span-2"><Field label="Rua" value={form.address_street} onChange={(v) => set("address_street", v)} ro={readOnly} /></div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Número" value={form.address_number} onChange={(v) => set("address_number", v)} ro={readOnly} />
              <div className="col-span-2"><Field label="Complemento" value={form.address_complement} onChange={(v) => set("address_complement", v)} ro={readOnly} /></div>
            </div>
            <Field label="Bairro" value={form.address_neighborhood} onChange={(v) => set("address_neighborhood", v)} ro={readOnly} />
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2"><Field label="Cidade" value={form.address_city} onChange={(v) => set("address_city", v)} ro={readOnly} /></div>
              <Field label="UF" value={form.address_state} onChange={(v) => set("address_state", v)} ro={readOnly} />
            </div>
          </TabsContent>

          <TabsContent value="owner" className="space-y-3 pt-4">
            <p className="text-xs text-muted-foreground">Pessoa que adquiriu/contratou o sistema.</p>
            <Field label="Nome completo" value={form.owner_name} onChange={(v) => set("owner_name", v)} ro={readOnly} />
            <Field label="CPF" value={form.owner_cpf} onChange={(v) => set("owner_cpf", v)} placeholder="000.000.000-00" ro={readOnly} />
            <Field label="Cargo / Função" value={form.owner_role} onChange={(v) => set("owner_role", v)} placeholder="Ex: Diretor(a), Proprietário(a)" ro={readOnly} />
          </TabsContent>
        </Tabs>

        {isAdmin && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button onClick={save} disabled={saving} className="gradient-primary">
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value, onChange, placeholder, type = "text", ro }: any) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      <Input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} type={type} disabled={ro} />
    </div>
  );
}
