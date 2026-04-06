import { NavLink as RouterNavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Stethoscope,
  FileText,
  Settings,
  Zap,
  TrendingUp,
  ChevronLeft,
  ChevronRight,
  Columns,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";

const navItems = [
  { title: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { title: "Kanban Leads", path: "/kanban", icon: Columns },
  { title: "Pacientes", path: "/pacientes", icon: Users },
  { title: "Agenda", path: "/agenda", icon: Calendar },
  { title: "Médicos", path: "/medicos", icon: Stethoscope },
  { title: "Procedimentos", path: "/procedimentos", icon: FileText },
  { title: "Financeiro", path: "/financeiro", icon: TrendingUp },
  { title: "Integrações", path: "/integracoes", icon: Zap },
  { title: "Configurações", path: "/configuracoes", icon: Settings },
];

export function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Toggle Button */}
      {!collapsed && (
        <button
          onClick={() => setCollapsed(true)}
          className="md:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-primary text-white shadow-lg"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
      )}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="md:hidden fixed top-4 left-4 z-[60] p-2 rounded-lg bg-primary text-white shadow-lg"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      )}

      {/* Sidebar background overlay for mobile */}
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setCollapsed(true)}
            className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{
          width: collapsed ? (window.innerWidth < 768 ? 0 : 72) : 260,
          x: collapsed && window.innerWidth < 768 ? -260 : 0
        }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className={cn(
          "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-50 flex flex-col shadow-2xl md:shadow-none",
          collapsed && "md:w-[72px]"
        )}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-4 border-b border-sidebar-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center flex-shrink-0">
              <span className="text-sidebar-primary-foreground font-display font-bold text-sm">PN</span>
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="flex flex-col"
                >
                  <span className="font-display font-bold text-sidebar-accent-foreground text-sm leading-tight">
                    Atendent-AI
                  </span>
                  <span className="text-[10px] text-sidebar-foreground leading-tight">Nexus CRM</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-2 space-y-1 overflow-y-auto custom-scrollbar">
          {navItems.map((item) => (
            <RouterNavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => { if (window.innerWidth < 768) setCollapsed(true); }}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group",
                  isActive
                    ? "bg-sidebar-accent text-sidebar-primary"
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50"
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className="relative flex-shrink-0">
                    <item.icon className="w-5 h-5" />
                    {isActive && (
                      <motion.div
                        layoutId="sidebar-glow"
                        className="absolute -inset-1 rounded-lg bg-primary/20 blur-sm"
                        transition={{ duration: 0.3 }}
                      />
                    )}
                  </div>
                  <AnimatePresence mode="wait">
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0, x: -5 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -5 }}
                        transition={{ duration: 0.15 }}
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </RouterNavLink>
          ))}
        </nav>

        {/* Support Box */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-4 mx-2 mb-4 rounded-xl bg-primary/5 border border-primary/10"
            >
              <p className="text-[11px] text-muted-foreground leading-snug mb-2">
                Dificuldade técnica? 😔
              </p>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] uppercase font-bold text-primary tracking-wider">Agendamento Manual:</span>
                <a
                  href="tel:61999548881"
                  className="text-xs font-semibold text-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                >
                  📞 (61) 99954-8881
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse toggle (Desktop only) */}
        <div className="hidden md:block p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center py-2 rounded-lg text-sidebar-foreground hover:text-sidebar-accent-foreground hover:bg-sidebar-accent/50 transition-colors"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>
      </motion.aside>
    </>
  );
}
