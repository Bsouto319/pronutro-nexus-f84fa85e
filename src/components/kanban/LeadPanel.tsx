import { useState, useEffect, useRef } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Send, Bot, UserRound, MessageSquare, User, StickyNote, Phone, Mail } from "lucide-react";
import { useWebhook, WebhookMessage } from "@/hooks/useWebhook";
import { toast } from "sonner";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LeadPanelProps {
  lead: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    source?: string | null;
    channel?: string | null;
    last_message?: string | null;
    last_message_at?: string | null;
    status: string;
    created_at: string;
  } | null;
  open: boolean;
  onClose: () => void;
}

export function LeadPanel({ lead, open, onClose }: LeadPanelProps) {
  const [messages, setMessages] = useState<WebhookMessage[]>([]);
  const [input, setInput] = useState("");
  const [noteInput, setNoteInput] = useState("");
  const [notes, setNotes] = useState<{ text: string; at: string }[]>([]);
  const [botActive, setBotActive] = useState(true);
  const [humanTakeover, setHumanTakeover] = useState(false);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getMessages, sendMessage, toggleBot, takeOver, addNote } = useWebhook();

  useEffect(() => {
    if (!lead || !open) return;
    setLoading(true);
    getMessages(lead.id).then(msgs => {
      setMessages(msgs);
      setLoading(false);
    });
    // Poll every 30s
    const interval = setInterval(() => {
      getMessages(lead.id).then(setMessages);
    }, 30000);
    return () => clearInterval(interval);
  }, [lead?.id, open, getMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || !lead) return;
    const newMsg: WebhookMessage = {
      id: `local-${Date.now()}`,
      leadId: lead.id,
      direction: "sent",
      content: input,
      timestamp: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    await sendMessage(lead.id, input);
  };

  const handleToggleBot = async (active: boolean) => {
    setBotActive(active);
    await toggleBot(lead?.id || "", active);
    toast.success(active ? "Bot ativado" : "Bot pausado");
  };

  const handleTakeOver = () => {
    if (!lead) return;
    const phone = lead.phone?.replace(/\D/g, "") || "";
    if (!phone) {
      toast.error("Este lead não possui telefone cadastrado.");
      return;
    }
    const msg = encodeURIComponent(`Olá ${lead.name}, tudo bem? Estou entrando em contato pela clínica.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, "_blank");
    toast.success("WhatsApp aberto!");
  };

  const handleAddNote = async () => {
    if (!noteInput.trim() || !lead) return;
    setNotes(prev => [...prev, { text: noteInput, at: new Date().toISOString() }]);
    await addNote(lead.id, noteInput);
    setNoteInput("");
    toast.success("Nota adicionada");
  };

  if (!lead) return null;

  const initials = lead.name?.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase() || "NL";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full sm:max-w-lg p-0 flex flex-col h-full bg-background border-l border-border">
        <SheetHeader className="p-4 pb-2 border-b border-border/50">
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <SheetTitle className="text-base">{lead.name || "Lead"}</SheetTitle>
              <p className="text-xs text-muted-foreground font-mono">{lead.phone || "Sem telefone"}</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[10px]">
                <Bot className="w-3.5 h-3.5 text-muted-foreground" />
                <Switch checked={botActive} onCheckedChange={handleToggleBot} className="scale-75" />
                <span className={botActive ? "text-emerald-500 font-bold" : "text-muted-foreground"}>
                  {botActive ? "Ativo" : "Pausado"}
                </span>
              </div>
            </div>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="w-full mt-2 text-xs h-8 border-green-500/30 text-green-600 hover:bg-green-500/10"
            onClick={handleTakeOver}
          >
            <Phone className="w-3.5 h-3.5 mr-1.5" /> Abrir no WhatsApp
          </Button>
        </SheetHeader>

        <Tabs defaultValue="conversa" className="flex-1 flex flex-col min-h-0">
          <TabsList className="mx-4 mt-2 grid grid-cols-3 h-9">
            <TabsTrigger value="conversa" className="text-xs gap-1"><MessageSquare className="w-3.5 h-3.5" /> Conversa</TabsTrigger>
            <TabsTrigger value="info" className="text-xs gap-1"><User className="w-3.5 h-3.5" /> Lead Info</TabsTrigger>
            <TabsTrigger value="notas" className="text-xs gap-1"><StickyNote className="w-3.5 h-3.5" /> Notas</TabsTrigger>
          </TabsList>

          <TabsContent value="conversa" className="flex-1 flex flex-col min-h-0 mt-0">
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {loading && <p className="text-xs text-muted-foreground text-center py-8">Carregando mensagens...</p>}
                {!loading && messages.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">
                    Nenhuma conversa registrada para este lead ainda.
                  </p>
                )}
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.direction === "sent" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] px-3 py-2 rounded-2xl text-sm ${
                        msg.direction === "sent"
                          ? "bg-emerald-600 text-white rounded-br-md"
                          : "bg-muted text-foreground rounded-bl-md"
                      }`}
                    >
                      <p>{msg.content}</p>
                      <p className={`text-[9px] mt-1 ${msg.direction === "sent" ? "text-emerald-200" : "text-muted-foreground"}`}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            <div className="p-3 border-t border-border/50 flex gap-2">
              <Input
                placeholder="Digite uma mensagem..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                className="flex-1 h-9 text-sm"
              />
              <Button size="sm" className="h-9 px-3 gradient-primary" onClick={handleSend}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="info" className="flex-1 mt-0">
            <ScrollArea className="h-full px-4 py-3">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                  <Avatar className="h-14 w-14">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">{initials}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-foreground">{lead.name}</p>
                    <Badge variant="outline" className="text-[10px] mt-1">{lead.status}</Badge>
                  </div>
                </div>
                {lead.phone && (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="font-mono">{lead.phone}</span>
                  </div>
                )}
                {lead.email && (
                  <div className="flex items-center gap-2 text-sm text-foreground">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{lead.email}</span>
                  </div>
                )}
                {(lead.channel || lead.source) && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Canal:</span>{" "}
                    <span className="text-foreground font-medium">{lead.channel || lead.source}</span>
                  </div>
                )}
                {lead.last_message && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Última interação:</span>{" "}
                    <span className="text-foreground font-medium">{lead.last_message}</span>
                  </div>
                )}
                {lead.last_message_at && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Atualizado em:</span>{" "}
                    <span className="text-foreground">{new Date(lead.last_message_at).toLocaleString("pt-BR")}</span>
                  </div>
                )}
                <div className="text-sm">
                  <span className="text-muted-foreground">Criado em:</span>{" "}
                  <span className="text-foreground">{new Date(lead.created_at).toLocaleDateString("pt-BR")}</span>
                </div>
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="notas" className="flex-1 flex flex-col min-h-0 mt-0">
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="space-y-3">
                {notes.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-8">Nenhuma nota interna ainda.</p>
                )}
                {notes.map((n, i) => (
                  <div key={i} className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                    <p className="text-sm text-foreground">{n.text}</p>
                    <p className="text-[9px] text-muted-foreground mt-1">
                      {new Date(n.at).toLocaleString("pt-BR")}
                    </p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-3 border-t border-border/50 flex gap-2">
              <Textarea
                placeholder="Nota interna (não será enviada ao paciente)..."
                value={noteInput}
                onChange={(e) => setNoteInput(e.target.value)}
                className="flex-1 min-h-[60px] text-sm"
              />
              <Button size="sm" className="self-end h-9" onClick={handleAddNote}>
                <StickyNote className="w-4 h-4" />
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}
