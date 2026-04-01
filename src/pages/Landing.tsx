import { useState, useEffect } from "react";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  MessageSquare, Calendar, Bell, Brain, Users, Monitor,
  ArrowRight, Check, Clock, XCircle, UserX, ChevronRight,
  Smartphone, BarChart3, Shield, Zap, Instagram, Facebook,
  Mail, Phone
} from "lucide-react";
import { Button } from "@/components/ui/button";

const WHATSAPP_LINK = "https://wa.me/5561982025951?text=Ol%C3%A1!%20Vi%20o%20Atendent-AI%20e%20quero%20saber%20mais%20sobre%20o%20atendente%20IA%20para%20meu%20neg%C3%B3cio.";

function AnimatedSection({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className={className}
      id={id}
    >
      {children}
    </motion.div>
  );
}

function WhatsAppMockup() {
  const [visibleMessages, setVisibleMessages] = useState(0);
  const messages = [
    { from: "patient", text: "Olá! Gostaria de agendar uma consulta de nutrição." },
    { from: "bot", text: "Olá! 😊 Sou a assistente virtual da clínica. Vou te ajudar a agendar! Qual a melhor data para você?" },
    { from: "patient", text: "Pode ser quinta-feira à tarde?" },
    { from: "bot", text: "Perfeito! Temos horário às 14h ou 16h na quinta. Qual prefere?" },
    { from: "patient", text: "16h está ótimo!" },
    { from: "bot", text: "✅ Consulta agendada! Quinta-feira às 16h com a Dra. Ana. Enviarei um lembrete na véspera!" },
  ];

  useEffect(() => {
    if (visibleMessages < messages.length) {
      const timer = setTimeout(() => setVisibleMessages((v) => v + 1), 1200);
      return () => clearTimeout(timer);
    }
  }, [visibleMessages, messages.length]);

  return (
    <div className="w-full max-w-[360px] mx-auto">
      <div className="rounded-2xl overflow-hidden shadow-2xl shadow-[#00F5A0]/10 border border-[#1a2f25]">
        {/* Header */}
        <div className="bg-[#075E54] px-4 py-3 flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#0D9373] flex items-center justify-center text-white text-sm font-bold">IA</div>
          <div>
            <p className="text-white text-sm font-semibold">Clínica NutriVida</p>
            <p className="text-[#8DCCB8] text-xs">online • Atendente IA</p>
          </div>
        </div>
        {/* Messages */}
        <div className="bg-[#0B1512] p-4 space-y-3 min-h-[320px]">
          {messages.slice(0, visibleMessages).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.3 }}
              className={`flex ${msg.from === "patient" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                  msg.from === "patient"
                    ? "bg-[#005C4B] text-white rounded-br-sm"
                    : "bg-[#1A2F25] text-[#C8D6CF] rounded-bl-sm"
                }`}
              >
                {msg.text}
              </div>
            </motion.div>
          ))}
          {visibleMessages < messages.length && (
            <motion.div animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1.2 }} className="flex justify-start">
              <div className="bg-[#1A2F25] px-4 py-2 rounded-xl text-[#8DCCB8] text-sm">digitando...</div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#0A0F0D] text-white font-['Inter',sans-serif] overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-[#0A0F0D]/80 backdrop-blur-lg border-b border-[#1a2f25]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#0D9373] to-[#00F5A0] flex items-center justify-center">
              <Brain className="w-5 h-5 text-[#0A0F0D]" />
            </div>
            <span className="text-xl font-bold font-['Plus_Jakarta_Sans',sans-serif] tracking-tight">
              Atendent<span className="text-[#00F5A0]">-AI</span>
            </span>
          </div>
          <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
            <Button className="bg-gradient-to-r from-[#0D9373] to-[#00E5CC] text-[#0A0F0D] font-semibold hover:opacity-90 rounded-full px-6">
              Falar Conosco
            </Button>
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-20 sm:pt-36 sm:pb-28 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(13,147,115,0.15)_0%,_transparent_60%)]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
               <span className="inline-flex items-center gap-2 bg-[#0D9373]/20 text-[#00F5A0] text-sm font-medium px-4 py-1.5 rounded-full border border-[#0D9373]/30 mb-6">
                <Zap className="w-4 h-4" /> Automação com IA • White-Label para seu negócio
              </span>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] leading-[1.1] mb-6">
                Sua clínica, salão ou consultório atendendo no WhatsApp{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9373] to-[#00F5A0]">
                  — mesmo enquanto você dorme
                </span>
              </h1>
              <p className="text-lg text-[#C8D6CF] mb-8 max-w-xl">
                Atendente virtual com IA que responde, agenda e confirma 24h pelo WhatsApp do seu negócio. Personalizamos para qualquer segmento.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
                  <Button className="w-full sm:w-auto bg-gradient-to-r from-[#0D9373] to-[#00F5A0] text-[#0A0F0D] font-bold text-lg px-8 py-6 rounded-full hover:shadow-lg hover:shadow-[#00F5A0]/20 transition-all">
                    Quero meu Atendente IA <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </a>
                <a href="#como-funciona">
                  <Button variant="outline" className="w-full sm:w-auto border-[#1a2f25] text-[#C8D6CF] hover:bg-[#1a2f25]/50 rounded-full px-8 py-6 text-lg bg-transparent">
                    Como funciona?
                  </Button>
                </a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.8, delay: 0.3 }}>
              <WhatsAppMockup />
            </motion.div>
          </div>
        </div>
      </section>

      {/* PROBLEMA */}
      <AnimatedSection className="py-20 bg-[#080C0A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] mb-4">
            Isso acontece na <span className="text-[#00F5A0]">sua clínica?</span>
          </h2>
          <p className="text-[#C8D6CF] mb-12 max-w-2xl mx-auto">
            A maioria das clínicas perde pacientes todos os dias por problemas simples de atendimento.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: UserX, title: "Recepcionista sobrecarregada", desc: "Não consegue responder todos a tempo" },
              { icon: Clock, title: "Mensagens fora do horário", desc: "Pacientes sem resposta à noite e fins de semana" },
              { icon: XCircle, title: "Faltas por falta de lembrete", desc: "Consultas perdidas que custam dinheiro" },
              { icon: Users, title: "Perdendo para a concorrência", desc: "Quem responde primeiro, agenda primeiro" },
            ].map((item, i) => (
              <div key={i} className="bg-[#0F1A15] border border-[#1a2f25] rounded-2xl p-6 text-left hover:border-[#0D9373]/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mb-4">
                  <item.icon className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#8DCCB8]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* COMO FUNCIONA */}
      <AnimatedSection className="py-20" id="como-funciona">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] mb-4">
            Como <span className="text-[#00F5A0]">funciona?</span>
          </h2>
          <p className="text-[#C8D6CF] mb-16 max-w-2xl mx-auto">Simples assim: 3 passos e sua clínica nunca mais perde um agendamento.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: "01", icon: MessageSquare, title: "Paciente manda mensagem", desc: "No WhatsApp da sua clínica, como já faz hoje." },
              { step: "02", icon: Brain, title: "IA responde e agenda", desc: "Atende, tira dúvidas e marca a consulta no Google Calendar." },
              { step: "03", icon: Monitor, title: "Você vê tudo no dashboard", desc: "Leads, agendamentos e conversas em tempo real." },
            ].map((item, i) => (
              <div key={i} className="relative">
                <div className="bg-[#0F1A15] border border-[#1a2f25] rounded-2xl p-8 hover:border-[#0D9373]/50 transition-colors">
                  <span className="text-5xl font-extrabold text-[#0D9373]/30 font-['Plus_Jakarta_Sans',sans-serif] absolute top-4 right-6">{item.step}</span>
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#0D9373]/20 to-[#00F5A0]/10 flex items-center justify-center mb-5">
                    <item.icon className="w-7 h-7 text-[#00F5A0]" />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-[#8DCCB8]">{item.desc}</p>
                </div>
                {i < 2 && <ChevronRight className="hidden md:block absolute -right-5 top-1/2 -translate-y-1/2 w-6 h-6 text-[#0D9373]" />}
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* FUNCIONALIDADES */}
      <AnimatedSection className="py-20 bg-[#080C0A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] mb-4">
            Tudo que sua clínica <span className="text-[#00F5A0]">precisa</span>
          </h2>
          <p className="text-[#C8D6CF] mb-12 max-w-2xl mx-auto">Funcionalidades pensadas para clínicas que querem crescer sem aumentar a equipe.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Brain, title: "IA 24 horas", desc: "Atendimento automático que nunca tira folga, feriado ou férias." },
              { icon: Calendar, title: "Agendamento automático", desc: "Agenda direto no Google Calendar sem intervenção humana." },
              { icon: Bell, title: "Lembretes inteligentes", desc: "Reduz faltas com lembretes automáticos antes da consulta." },
              { icon: Monitor, title: "Dashboard em tempo real", desc: "Veja leads, agendamentos e conversas num painel web." },
              { icon: Users, title: "Handoff para humano", desc: "Transfere para a recepcionista quando necessário." },
              { icon: Shield, title: "Personalização total", desc: "Com o nome, tom e identidade visual da sua clínica." },
            ].map((item, i) => (
              <div key={i} className="bg-[#0F1A15] border border-[#1a2f25] rounded-2xl p-6 text-left group hover:border-[#00F5A0]/30 transition-all hover:shadow-lg hover:shadow-[#00F5A0]/5">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#0D9373]/20 to-[#00F5A0]/10 flex items-center justify-center mb-4 group-hover:from-[#0D9373]/30 group-hover:to-[#00F5A0]/20 transition-colors">
                  <item.icon className="w-6 h-6 text-[#00F5A0]" />
                </div>
                <h3 className="font-bold text-white mb-2">{item.title}</h3>
                <p className="text-sm text-[#8DCCB8]">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* DASHBOARD PREVIEW */}
      <AnimatedSection className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] mb-4">
              Veja tudo em <span className="text-[#00F5A0]">tempo real</span>
            </h2>
            <p className="text-[#C8D6CF] max-w-2xl mx-auto">Acompanhe leads, agendamentos e conversas num painel web moderno e intuitivo.</p>
          </div>
          <div className="bg-[#0F1A15] border border-[#1a2f25] rounded-2xl p-4 sm:p-8 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#0D9373]/5 to-transparent" />
            <div className="relative z-10">
              {/* Mock Dashboard */}
              <div className="grid grid-cols-3 gap-4 mb-6">
                {[
                  { label: "Leads Hoje", value: "12", color: "text-[#00F5A0]" },
                  { label: "Agendamentos", value: "8", color: "text-[#00E5CC]" },
                  { label: "Taxa de Conversão", value: "67%", color: "text-[#0D9373]" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-[#0A0F0D] rounded-xl p-4 border border-[#1a2f25]">
                    <p className="text-xs text-[#8DCCB8] mb-1">{kpi.label}</p>
                    <p className={`text-2xl sm:text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-[#0A0F0D] rounded-xl border border-[#1a2f25] overflow-hidden">
                <div className="px-4 py-3 border-b border-[#1a2f25] flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-[#0D9373]" />
                  <span className="text-sm font-medium text-[#C8D6CF]">Últimos agendamentos</span>
                </div>
                <div className="divide-y divide-[#1a2f25]">
                  {[
                    { name: "Maria Silva", time: "14:00", status: "Confirmado" },
                    { name: "João Santos", time: "15:30", status: "Agendado" },
                    { name: "Ana Costa", time: "16:00", status: "Confirmado" },
                  ].map((a, i) => (
                    <div key={i} className="px-4 py-3 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#0D9373]/20 flex items-center justify-center text-[#00F5A0] text-xs font-bold">
                          {a.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                        <span className="text-sm text-white">{a.name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-xs text-[#8DCCB8]">{a.time}</span>
                        <span className="text-xs bg-[#0D9373]/20 text-[#00F5A0] px-2 py-0.5 rounded-full">{a.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </AnimatedSection>

      {/* PROVA SOCIAL */}
      <AnimatedSection className="py-20 bg-[#080C0A]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] mb-12">
            Quem está <span className="text-[#00F5A0]">por trás</span>
          </h2>
          <div className="bg-[#0F1A15] border border-[#1a2f25] rounded-2xl p-8 sm:p-12">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#0D9373] to-[#00F5A0] flex items-center justify-center text-[#0A0F0D] text-2xl font-bold mx-auto mb-6">BS</div>
            <blockquote className="text-lg sm:text-xl text-[#C8D6CF] italic mb-6 max-w-2xl mx-auto">
              "Construí o ProNutro porque vi clínicas perdendo pacientes por não conseguirem responder a tempo. A IA resolve isso — atende, agenda e confirma, 24 horas."
            </blockquote>
            <p className="font-bold text-white text-lg">Bruno Souto</p>
            <p className="text-sm text-[#8DCCB8]">Especialista em automação com IA para negócios de saúde — Brasília/DF</p>
            <p className="text-sm text-[#0D9373] mt-1">BTechSouto</p>
          </div>
          {/* Future testimonials */}
          <div className="mt-12 grid sm:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-[#0F1A15] border border-dashed border-[#1a2f25] rounded-2xl p-6 flex items-center justify-center min-h-[140px]">
                <p className="text-sm text-[#8DCCB8]/50 italic">Depoimento em breve...</p>
              </div>
            ))}
          </div>
        </div>
      </AnimatedSection>

      {/* CTA FINAL */}
      <AnimatedSection className="py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(13,147,115,0.2)_0%,_transparent_60%)]" />
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold font-['Plus_Jakarta_Sans',sans-serif] mb-6">
            Pronto para sua clínica{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#0D9373] to-[#00F5A0]">nunca mais perder um paciente?</span>
          </h2>
          <p className="text-lg text-[#C8D6CF] mb-4">Valores sob consulta — cada clínica tem necessidades únicas.</p>
          <p className="text-sm text-[#8DCCB8] mb-8">Fale com nosso especialista e descubra como o ProNutro pode transformar seu atendimento.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-[#0D9373] to-[#00F5A0] text-[#0A0F0D] font-bold text-lg px-10 py-7 rounded-full hover:shadow-xl hover:shadow-[#00F5A0]/20 transition-all">
                <Phone className="w-5 h-5 mr-2" /> Falar com o especialista agora
              </Button>
            </a>
          </div>
          <p className="text-sm text-[#8DCCB8] mt-6">
            <Mail className="w-4 h-4 inline mr-1" /> brunosouto1108@gmail.com
          </p>
        </div>
      </AnimatedSection>

      {/* FOOTER */}
      <footer className="border-t border-[#1a2f25] py-10 bg-[#080C0A]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#0D9373] to-[#00F5A0] flex items-center justify-center">
                <Brain className="w-4 h-4 text-[#0A0F0D]" />
              </div>
              <span className="font-bold font-['Plus_Jakarta_Sans',sans-serif]">Pro<span className="text-[#00F5A0]">Nutro</span></span>
            </div>
            <div className="flex items-center gap-6 text-sm text-[#8DCCB8]">
              <span>brunosouto1108@gmail.com</span>
              <span>(61) 98202-5951</span>
            </div>
            <div className="flex items-center gap-4">
              <a href="#" className="text-[#8DCCB8] hover:text-[#00F5A0] transition-colors"><Instagram className="w-5 h-5" /></a>
              <a href="#" className="text-[#8DCCB8] hover:text-[#00F5A0] transition-colors"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="text-[#8DCCB8] hover:text-[#00F5A0] transition-colors">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.8a8.19 8.19 0 0 0 4.76 1.52v-3.4a4.85 4.85 0 0 1-1-.23z"/></svg>
              </a>
            </div>
          </div>
          <div className="text-center mt-8 text-xs text-[#8DCCB8]/50">
            BTechSouto © {new Date().getFullYear()} — Todos os direitos reservados
          </div>
        </div>
      </footer>
    </div>
  );
}
