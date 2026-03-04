import { motion } from "framer-motion";
import { Search, Bell, Plus, RefreshCw } from "lucide-react";

interface TopBarProps {
  title?: string;
  subtitle?: string;
  onRefresh?: () => void;
}

export function TopBar({ title = "Dashboard", subtitle = "Bem-vindo de volta!", onRefresh }: TopBarProps) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="h-16 border-b border-border flex items-center justify-between px-6"
    >
      <div>
        <h1 className="text-lg font-display font-bold text-foreground">{title}</h1>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>

      <div className="flex items-center gap-3">
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors"
            title="Atualizar dados"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        )}

        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar paciente, médico..."
            className="pl-9 pr-4 py-2 text-sm bg-muted/50 border border-border rounded-lg focus:outline-none focus:ring-1 focus:ring-primary/50 text-foreground placeholder:text-muted-foreground w-64 transition-all"
          />
        </div>

        <button className="relative p-2 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full gradient-primary" />
        </button>
      </div>
    </motion.header>
  );
}
