import { motion } from "framer-motion";
import { MessageSquare, Instagram, Phone, Globe, Trash2 } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface LeadCardProps {
  lead: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    source?: string | null;
    status: string;
    created_at: string;
    lastMessage?: string;
    lastMessageAt?: string;
    assignedTo?: string;
    channel?: string;
  };
  onClick: () => void;
  statusOptions: { value: string; label: string }[];
  onStatusChange: (id: string, status: string) => void;
  onDelete?: (id: string) => void;
}

function getInitials(name: string) {
  return name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
}

function getChannelIcon(channel?: string) {
  switch (channel?.toLowerCase()) {
    case "whatsapp": return <MessageSquare className="w-3 h-3 text-emerald-500" />;
    case "instagram": return <Instagram className="w-3 h-3 text-pink-500" />;
    case "phone": return <Phone className="w-3 h-3 text-blue-500" />;
    default: return <Globe className="w-3 h-3 text-muted-foreground" />;
  }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  return `há ${days}d`;
}

function isHotLead(dateStr: string) {
  return Date.now() - new Date(dateStr).getTime() > 2 * 60 * 60 * 1000;
}

export function LeadCard({ lead, onClick, statusOptions, onStatusChange, onDelete }: LeadCardProps) {
  const lastActivity = lead.lastMessageAt || lead.created_at;
  const hot = isHotLead(lastActivity);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      onClick={onClick}
      className="glass p-4 rounded-xl border border-border/50 hover:border-primary/30 transition-all group cursor-pointer"
    >
      <div className="flex items-start gap-3 mb-2">
        <div className="relative">
          <Avatar className="h-9 w-9">
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
              {getInitials(lead.name || "NL")}
            </AvatarFallback>
          </Avatar>
          {hot && (
            <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-destructive animate-pulse ring-2 ring-card" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-foreground truncate">{lead.name || "Novo Lead"}</span>
            {getChannelIcon(lead.channel || lead.source)}
          </div>
          <p className="text-[11px] text-muted-foreground truncate mt-0.5">
            {lead.lastMessage || lead.phone || "Sem mensagens"}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-border/30">
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground">{timeAgo(lastActivity)}</span>
          {lead.assignedTo && (
            <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
              {lead.assignedTo}
            </span>
          )}
        </div>
        <select
          value={lead.status || "novo_lead"}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => { e.stopPropagation(); onStatusChange(lead.id, e.target.value); }}
          className="bg-transparent text-[10px] font-bold text-primary outline-none cursor-pointer hover:underline"
        >
          {statusOptions.map(c => (
            <option key={c.value} value={c.value} className="bg-background text-foreground">{c.label}</option>
          ))}
        </select>
      </div>
    </motion.div>
  );
}
