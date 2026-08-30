"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { ArrowLeft, LogOut, Calendar, History, User, CheckCircle, Store } from "lucide-react";
import { Whatsapp } from "@boxicons/react";
import { logoutClientSession } from "@/app/actions/client-auth";
import { cancelPendingAppointment } from "@/app/actions/public-client";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";

type TabType = "upcoming" | "history" | "profile";

export function ClientAreaView({
  org,
  theme,
  dashboardData,
  error
}: {
  org: any;
  theme: any;
  dashboardData: any;
  error?: string;
}) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>("upcoming");
  const [isCancelling, setIsCancelling] = useState<string | null>(null);

  const handleLogout = async () => {
    await logoutClientSession(org.slug);
    if (typeof window !== "undefined") {
      localStorage.removeItem(`totten_client_logged_in_${org.slug}`);
      localStorage.removeItem(`totten_client_phone_${org.slug}`);
    }
    router.push(`/${org.slug}/agendar`);
    router.refresh();
  };

  const data = dashboardData || {};
  const client = data.client || {};
  const upcoming = data.upcoming || [];
  const historyPackages = data.historyPackages || [];
  const historyStandalone = data.historyStandalone || [];
  const clinicPhone = data.clinicPhone;

  let whatsappLink = "";
  if (clinicPhone) {
    let whatsappNumber = clinicPhone.replace(/\D/g, "");
    if (whatsappNumber.length === 10 || whatsappNumber.length === 11) {
      whatsappNumber = `55${whatsappNumber}`;
    }
    whatsappLink = `https://wa.me/${whatsappNumber}`;
  }

  const handleCancel = async (appointment: any) => {
    if (appointment.status === "PENDENTE") {
      // API call
      setIsCancelling(appointment.id);
      try {
        const res = await cancelPendingAppointment(org.slug, client.id, appointment.id);
        if (res.success) {
          toast.success("Agendamento cancelado com sucesso!");
          router.refresh();
        } else {
          toast.error(res.error || "Não foi possível cancelar.");
        }
      } catch (err) {
        toast.error("Erro de conexão ao cancelar.");
      } finally {
        setIsCancelling(null);
      }
    } else {
      // Redirect to whatsapp
      if (whatsappLink) {
        window.open(`${whatsappLink}?text=Olá! Gostaria de cancelar meu agendamento do dia ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(appointment.date_time))}.`, "_blank");
      }
    }
  };

  const handleReschedule = (appointment: any) => {
    if (appointment.status === "PENDENTE") {
      // Cancele e direcione pra agendar
      toast.info("Por favor, cancele o agendamento atual e realize um novo.");
    } else {
      // Redirect to whatsapp
      if (whatsappLink) {
        window.open(`${whatsappLink}?text=Olá! Gostaria de remarcar meu agendamento do dia ${new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(appointment.date_time))}.`, "_blank");
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-slate-50 text-slate-900 pb-20 md:pb-0">
      {/* Navbar Desktop / Cabeçalho */}
      <div className="shrink-0 z-50 px-4 py-4 flex items-center justify-between border-b backdrop-blur-md bg-white/80 border-black/10">
        <button
          onClick={() => router.push(`/${org.slug}/agendar`)}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-black/5 hover:bg-black/10"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="text-center">
          <h1 className="font-bold text-base leading-tight">{org.name}</h1>
          <p className="text-xs text-muted-foreground">Área do Cliente</p>
        </div>
        <button
          onClick={handleLogout}
          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-black/5 hover:bg-black/10 text-red-500"
          title="Sair"
        >
          <LogOut className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 w-full max-w-3xl mx-auto flex flex-col md:flex-row gap-6 p-4 md:p-8">
        
        {/* Navegação Desktop */}
        <div className="hidden md:flex flex-col w-64 gap-2 shrink-0">
          <Button 
            variant={activeTab === "upcoming" ? "default" : "ghost"} 
            className={cn("justify-start h-12 font-bold", activeTab === "upcoming" && "bg-primary text-primary-foreground")}
            onClick={() => setActiveTab("upcoming")}
          >
            <Calendar className="mr-2 h-5 w-5" /> Próximos
          </Button>
          <Button 
            variant={activeTab === "history" ? "default" : "ghost"} 
            className={cn("justify-start h-12 font-bold", activeTab === "history" && "bg-primary text-primary-foreground")}
            onClick={() => setActiveTab("history")}
          >
            <History className="mr-2 h-5 w-5" /> Histórico
          </Button>
          <Button 
            variant={activeTab === "profile" ? "default" : "ghost"} 
            className={cn("justify-start h-12 font-bold", activeTab === "profile" && "bg-primary text-primary-foreground")}
            onClick={() => setActiveTab("profile")}
          >
            <User className="mr-2 h-5 w-5" /> Meus Dados
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-6 w-full pb-8">
          <div className="space-y-2 mb-6">
            <h2 className="text-2xl font-black">Olá, {client.name?.split(" ")[0] || "Cliente"}</h2>
          </div>

          {error && (
            <div className="p-4 rounded-xl bg-red-500/10 text-red-600 text-sm font-medium text-center">
              {error}
            </div>
          )}

          {!error && activeTab === "upcoming" && (
            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Calendar className="h-5 w-5 opacity-70" /> Próximos Agendamentos
              </h3>

              {upcoming.length === 0 ? (
                <div className="p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4 bg-white/50">
                  <Calendar className="h-12 w-12 text-muted-foreground opacity-50" />
                  <p className="font-medium text-muted-foreground">Você não tem agendamentos futuros.</p>
                  <Button onClick={() => router.push(`/${org.slug}/agendar`)} className="rounded-full font-bold">
                    Agendar Novo
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {upcoming.map((appt: any) => {
                    const dateObj = new Date(appt.date_time);
                    const day = new Intl.DateTimeFormat("pt-BR", { day: "2-digit" }).format(dateObj);
                    const month = new Intl.DateTimeFormat("pt-BR", { month: "short" }).format(dateObj).toUpperCase();
                    const weekday = new Intl.DateTimeFormat("pt-BR", { weekday: "long" }).format(dateObj).split('-')[0];
                    const time = new Intl.DateTimeFormat("pt-BR", { hour: "2-digit", minute: "2-digit" }).format(dateObj);
                    
                    return (
                      <div key={appt.id} className="flex flex-col sm:flex-row overflow-hidden rounded-3xl bg-white border shadow-sm transition-all hover:shadow-md">
                        {/* Data Card (Left on Desktop, Top on Mobile) */}
                        <div className="bg-blue-500 text-white p-6 flex flex-col items-center justify-center sm:w-32 shrink-0">
                          <span className="text-4xl font-black leading-none">{day}</span>
                          <span className="text-sm font-bold tracking-widest mt-1">{month}</span>
                          <span className="text-xs font-medium capitalize opacity-90 mt-2 text-center">{weekday}</span>
                        </div>
                        
                        {/* Details */}
                        <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
                          <div className="flex justify-between items-start gap-4">
                            <div>
                              <span className={cn(
                                "inline-block px-2 py-1 rounded-md text-[10px] font-bold uppercase mb-2",
                                appt.status === "PENDENTE" ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
                              )}>
                                {appt.status === "PENDENTE" ? "Pendente" : "Agendado"}
                              </span>
                              <h4 className="font-black text-lg leading-tight text-slate-800">
                                {appt.service?.name}
                              </h4>
                              {appt.package && (
                                <p className="text-xs font-semibold text-blue-600 mt-1">
                                  Pacote: {appt.package.name}
                                </p>
                              )}
                              <div className="flex items-center gap-4 text-sm text-slate-500 mt-3 font-medium">
                                <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4"/> {time}</span>
                                {appt.professional?.display_name && (
                                  <span className="flex items-center gap-1.5"><User className="h-4 w-4"/> {appt.professional.display_name.split(" ")[0]}</span>
                                )}
                              </div>
                            </div>
                            
                            <div className="hidden sm:flex flex-col items-end gap-2 shrink-0">
                              <button className="text-sm font-bold text-blue-600 hover:text-blue-700 transition-colors">
                                Ver detalhes &gt;
                              </button>
                              <button onClick={() => handleReschedule(appt)} className="text-sm font-bold text-slate-600 flex items-center gap-1.5 hover:text-slate-800 transition-colors mt-2">
                                Remarcar
                              </button>
                              <button 
                                onClick={() => handleCancel(appt)} 
                                disabled={isCancelling === appt.id}
                                className="text-sm font-bold text-red-500 flex items-center gap-1.5 hover:text-red-600 transition-colors"
                              >
                                {isCancelling === appt.id ? "Cancelando..." : "Cancelar"}
                              </button>
                            </div>
                          </div>

                          {/* Mobile Actions */}
                          <div className="flex sm:hidden items-center justify-between mt-6 pt-4 border-t border-slate-100">
                            <button className="text-xs font-bold text-blue-600">Detalhes</button>
                            <div className="flex items-center gap-4">
                              <button onClick={() => handleReschedule(appt)} className="text-xs font-bold text-slate-600">Remarcar</button>
                              <button 
                                onClick={() => handleCancel(appt)} 
                                disabled={isCancelling === appt.id}
                                className="text-xs font-bold text-red-500"
                              >
                                {isCancelling === appt.id ? "..." : "Cancelar"}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {!error && activeTab === "history" && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <History className="h-5 w-5 opacity-70" /> Seu Histórico
              </h3>

              {historyPackages.length === 0 && historyStandalone.length === 0 ? (
                <div className="p-8 rounded-3xl border-2 border-dashed flex flex-col items-center justify-center text-center space-y-4 bg-white/50">
                  <p className="font-medium text-muted-foreground">Você não possui histórico na clínica.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Pacotes */}
                  {historyPackages.map((pkg: any) => {
                    const progress = Math.min(100, Math.round((pkg.used_sessions / pkg.total_sessions) * 100));
                    return (
                      <div key={pkg.id} className={cn("bg-white border p-6 rounded-3xl shadow-sm", !pkg.active && "opacity-70 grayscale")}>
                        <div className="mb-4">
                          <h4 className="font-black text-lg uppercase">{pkg.name}</h4>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1"><Store className="h-3 w-3"/> Pacote de Sessões</p>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border mb-4">
                          <div className="flex justify-between items-end mb-2">
                            <span className="text-xs font-bold text-slate-500 uppercase">Sessões Realizadas</span>
                            <span className="text-xl font-black text-slate-800">{pkg.used_sessions} <span className="text-sm font-normal text-slate-500">/ {pkg.total_sessions}</span></span>
                          </div>
                          <Progress value={progress} className="h-2 bg-slate-200" />
                        </div>

                        {pkg.appointments?.length > 0 && (
                          <div className="space-y-3 mt-4">
                            <span className="text-xs font-bold uppercase text-slate-400">Agendamentos do Pacote:</span>
                            {pkg.appointments.map((item: any, index: number) => {
                              const isRealizado = item.status === "REALIZADO";
                              const isCancelado = item.status === "CANCELADO";
                              const isFalta = isCancelado && item.observations?.includes("Falta");
                              
                              return (
                                <div key={item.id} className="flex items-center justify-between text-sm p-3 rounded-xl bg-slate-50 border">
                                  <div className="flex items-center gap-3">
                                    <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white", isRealizado ? "bg-emerald-500" : isFalta ? "bg-red-500" : "bg-slate-400")}>
                                      {isRealizado ? <CheckCircle className="h-3 w-3" /> : index + 1}
                                    </div>
                                    <span className="font-medium">
                                      {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.date_time))}
                                    </span>
                                  </div>
                                  <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded", isRealizado ? "bg-emerald-100 text-emerald-700" : isFalta ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600")}>
                                    {isRealizado ? "Realizada" : isFalta ? "Faltou" : item.status}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* Avulsos */}
                  {historyStandalone.length > 0 && (
                    <div className="space-y-3">
                      <span className="text-xs font-bold uppercase text-slate-400 pl-2">Sessões Avulsas:</span>
                      {historyStandalone.map((item: any) => {
                        const isRealizado = item.status === "REALIZADO";
                        const isCancelado = item.status === "CANCELADO";
                        const isFalta = isCancelado && item.observations?.includes("Falta");

                        return (
                          <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl bg-white border shadow-sm">
                            <div>
                              <p className="font-bold">{item.service?.name}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(item.date_time))}
                              </p>
                            </div>
                            <span className={cn("text-[10px] font-bold uppercase px-2 py-1 rounded", isRealizado ? "bg-emerald-100 text-emerald-700" : isFalta ? "bg-red-100 text-red-700" : "bg-slate-200 text-slate-600")}>
                              {isRealizado ? "Realizada" : isFalta ? "Faltou" : item.status}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!error && activeTab === "profile" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 max-w-md mx-auto md:max-w-none">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <User className="h-5 w-5 opacity-70" /> Meus Dados
              </h3>

              <div className="bg-white border rounded-3xl p-6 space-y-6 shadow-sm">
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Nome Completo</p>
                  <p className="font-medium text-lg">{client.name}</p>
                </div>
                
                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">CPF</p>
                  <p className="font-medium text-lg">{client.cpf}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Telefone (WhatsApp)</p>
                  <p className="font-medium text-lg">{client.phone}</p>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-100 rounded-3xl p-6 text-center space-y-4">
                <p className="text-sm text-blue-800 font-medium">
                  Para alterar seus dados cadastrais, por favor entre em contato com o atendimento da clínica.
                </p>
                {whatsappLink && (
                  <Button asChild className="w-full bg-[#25D366] hover:bg-[#1DA851] text-white font-bold rounded-xl h-12">
                    <a href={whatsappLink} target="_blank" rel="noopener noreferrer">
                      <Whatsapp className="mr-2 h-5 w-5" /> Falar no WhatsApp
                    </a>
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom Navigation Mobile */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 pb-safe z-40">
        <div className="flex items-center justify-around h-16 px-2">
          <button 
            onClick={() => setActiveTab("upcoming")}
            className={cn("flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold transition-colors", activeTab === "upcoming" ? "text-blue-600" : "text-slate-400")}
          >
            <Calendar className="h-5 w-5" />
            Próximos
          </button>
          <button 
            onClick={() => setActiveTab("history")}
            className={cn("flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold transition-colors", activeTab === "history" ? "text-blue-600" : "text-slate-400")}
          >
            <History className="h-5 w-5" />
            Histórico
          </button>
          <button 
            onClick={() => setActiveTab("profile")}
            className={cn("flex flex-col items-center justify-center w-full h-full gap-1 text-[10px] font-bold transition-colors", activeTab === "profile" ? "text-blue-600" : "text-slate-400")}
          >
            <User className="h-5 w-5" />
            Perfil
          </button>
        </div>
      </div>
    </div>
  );
}
