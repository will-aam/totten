"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { LoaderDots, Check, CheckCircle, Timer, Play, User } from "@boxicons/react";
import { getWaitingRoomData, completeCheckIn } from "@/app/actions/waiting-room";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function WaitingRoomPage() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoom = async () => {
    const res = await getWaitingRoomData();
    if (res.success && res.data) {
      setData(res.data);
    } else {
      toast.error(res.error || "Erro ao buscar sala de espera.");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRoom();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchRoom, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleComplete = async (id: string) => {
    const toastId = toast.loading("Finalizando...");
    const res = await completeCheckIn(id);
    if (res.success) {
      toast.success("Paciente atendido!", { id: toastId });
      fetchRoom();
    } else {
      toast.error(res.error || "Erro ao finalizar.", { id: toastId });
    }
  };

  return (
    <>
      <AdminHeader title="Sala de Espera (Live)" />
      <div className="p-4 md:p-6 max-w-400 mx-auto w-full min-h-[calc(100vh-100px)] animate-in fade-in duration-500">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-black text-foreground">Aguardando Atendimento</h2>
          <span className="text-sm font-bold bg-primary/10 text-primary px-4 py-1.5 rounded-full">
            {data.length} na fila
          </span>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <LoaderDots className="animate-spin h-8 w-8 text-primary" />
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-card rounded-4xl border border-dashed border-border/60 shadow-sm">
            <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
              <CheckCircle size="lg" className="text-muted-foreground" />
            </div>
            <p className="text-xl font-bold text-foreground">Sala Vazia</p>
            <p className="text-sm font-medium text-muted-foreground mt-2 max-w-sm">
              Não há nenhum paciente aguardando atendimento no momento.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.map((item) => (
              <div key={item.id} className="bg-card border border-border/50 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight">{item.clientName}</h3>
                        <p className="text-xs font-bold text-muted-foreground">{item.clientPhone}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-full">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Serviço</span>
                      <span className="text-sm font-bold">{item.serviceName}</span>
                    </div>
                    <div className="flex items-center justify-between bg-muted/40 p-2.5 rounded-full">
                      <span className="text-[10px] font-black uppercase text-muted-foreground">Profissional</span>
                      <span className="text-sm font-bold">{item.professionalName}</span>
                    </div>
                    <div className="flex items-center justify-between bg-amber-500/10 p-2.5 rounded-full text-amber-600 dark:text-amber-500">
                      <span className="text-[10px] font-black uppercase flex items-center gap-1">
                        <Timer className="h-3 w-3" /> Espera
                      </span>
                      <span className="text-sm font-bold">
                        {formatDistanceToNow(new Date(item.date_time), { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => handleComplete(item.id)}
                  className="w-full h-12 bg-primary text-primary-foreground font-black rounded-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  Iniciar Atendimento
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
