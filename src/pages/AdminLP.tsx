import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Copy, Check, Brain, ExternalLink, LogOut } from "lucide-react";
import { toast } from "sonner";

const ADMIN_PASSWORD = "pronutro2025";
const LP_URL = "https://atendent-ai.lovable.app/landing";

interface Note {
  id: string;
  text: string;
  createdAt: string;
}

export default function AdminLP() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    const auth = sessionStorage.getItem("admin_lp_auth");
    if (auth === "true") setAuthenticated(true);
    const saved = localStorage.getItem("admin_lp_notes");
    if (saved) setNotes(JSON.parse(saved));
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setAuthenticated(true);
      sessionStorage.setItem("admin_lp_auth", "true");
    } else {
      toast.error("Senha incorreta");
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("admin_lp_auth");
    setAuthenticated(false);
  };

  const addNote = () => {
    if (!newNote.trim()) return;
    const updated = [{ id: Date.now().toString(), text: newNote, createdAt: new Date().toLocaleString("pt-BR") }, ...notes];
    setNotes(updated);
    localStorage.setItem("admin_lp_notes", JSON.stringify(updated));
    setNewNote("");
    toast.success("Nota salva!");
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    localStorage.setItem("admin_lp_notes", JSON.stringify(updated));
  };

  const copyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    toast.success("Copiado!");
    setTimeout(() => setCopied(null), 2000);
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-[#0A0F0D] flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <div className="flex items-center gap-2 justify-center mb-8">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0D9373] to-[#00F5A0] flex items-center justify-center">
              <Brain className="w-6 h-6 text-[#0A0F0D]" />
            </div>
            <span className="text-2xl font-bold text-white font-['Plus_Jakarta_Sans',sans-serif]">
              Atendent<span className="text-[#00F5A0]">-AI</span> Admin
            </span>
          </div>
          <Input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="bg-[#0F1A15] border-[#1a2f25] text-white placeholder:text-[#8DCCB8]/50"
          />
          <Button type="submit" className="w-full bg-gradient-to-r from-[#0D9373] to-[#00F5A0] text-[#0A0F0D] font-bold">
            Entrar
          </Button>
        </form>
      </div>
    );
  }

  const socialLinks = [
    { name: "Instagram Bio", text: `🤖 Sua clínica atendendo 24h no WhatsApp com IA\n👇 Saiba mais:\n${LP_URL}` },
    { name: "Facebook", text: `Conheça o ProNutro — atendente IA para clínicas de nutrição e saúde. Sua clínica nunca mais perde um paciente! ${LP_URL}` },
    { name: "TikTok Bio", text: `Automação com IA para clínicas 🏥🤖\n${LP_URL}` },
  ];

  return (
    <div className="min-h-screen bg-[#0A0F0D] text-white p-4 sm:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D9373] to-[#00F5A0] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#0A0F0D]" />
            </div>
            <span className="text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif]">
              Pro<span className="text-[#00F5A0]">Nutro</span> Admin
            </span>
          </div>
          <div className="flex gap-2">
            <a href="/landing" target="_blank">
              <Button variant="outline" className="border-[#1a2f25] text-[#C8D6CF] hover:bg-[#1a2f25]/50 bg-transparent">
                <ExternalLink className="w-4 h-4 mr-2" /> Ver LP
              </Button>
            </a>
            <Button variant="outline" onClick={handleLogout} className="border-[#1a2f25] text-[#C8D6CF] hover:bg-[#1a2f25]/50 bg-transparent">
              <LogOut className="w-4 h-4 mr-2" /> Sair
            </Button>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Links para redes sociais */}
          <Card className="bg-[#0F1A15] border-[#1a2f25] text-white">
            <CardHeader><CardTitle className="text-lg text-[#00F5A0]">Links para Redes Sociais</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm text-[#8DCCB8]">Link da LP</label>
                <div className="flex gap-2">
                  <Input value={LP_URL} readOnly className="bg-[#0A0F0D] border-[#1a2f25] text-white text-sm" />
                  <Button size="icon" onClick={() => copyText(LP_URL, "lp")} className="bg-[#0D9373] hover:bg-[#0D9373]/80 shrink-0">
                    {copied === "lp" ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              {socialLinks.map((link) => (
                <div key={link.name} className="space-y-1">
                  <label className="text-sm text-[#8DCCB8]">{link.name}</label>
                  <div className="flex gap-2">
                    <div className="bg-[#0A0F0D] border border-[#1a2f25] rounded-md p-2 text-xs text-[#C8D6CF] flex-1 whitespace-pre-line">{link.text}</div>
                    <Button size="icon" onClick={() => copyText(link.text, link.name)} className="bg-[#0D9373] hover:bg-[#0D9373]/80 shrink-0 self-start">
                      {copied === link.name ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Notas internas */}
          <Card className="bg-[#0F1A15] border-[#1a2f25] text-white">
            <CardHeader><CardTitle className="text-lg text-[#00F5A0]">Notas Internas</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Textarea
                  placeholder="Anotar cliente, status de venda..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="bg-[#0A0F0D] border-[#1a2f25] text-white placeholder:text-[#8DCCB8]/50 min-h-[60px]"
                />
              </div>
              <Button onClick={addNote} className="w-full bg-[#0D9373] hover:bg-[#0D9373]/80">Salvar Nota</Button>
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                {notes.map((note) => (
                  <div key={note.id} className="bg-[#0A0F0D] border border-[#1a2f25] rounded-lg p-3">
                    <p className="text-sm text-[#C8D6CF] whitespace-pre-line">{note.text}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-[#8DCCB8]/50">{note.createdAt}</span>
                      <button onClick={() => deleteNote(note.id)} className="text-xs text-red-400 hover:text-red-300">Excluir</button>
                    </div>
                  </div>
                ))}
                {notes.length === 0 && <p className="text-sm text-[#8DCCB8]/50 text-center py-4">Nenhuma nota ainda</p>}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
