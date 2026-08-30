"use client";

import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { updateAppointment } from "@/app/actions/appointments";
import { User, Calendar, Clock, Briefcase, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

export function RequestsClientView({ initialRequests }: { initialRequests: any[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleStatusChange = async (id: string, newStatus: string) => {
    setLoadingId(id);
    try {
      const res = await updateAppointment(id, {
        status: newStatus,
        paymentMethod: null,
        observations: "",
        hasCharge: false,
      });

      if (res.success) {
        toast.success(`Solicitação ${newStatus === "confirmado" ? "aprovada" : "recusada"} com sucesso.`);
        router.refresh();
      } else {
        toast.error(res.error || "Erro ao processar solicitação.");
      }
    } catch (e) {
      toast.error("Ocorreu um erro ao processar a solicitação.");
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Solicitações Pendentes</h1>
          <p className="text-slate-500 mt-1">Aprove ou recuse agendamentos solicitados pelos clientes.</p>
        </div>

        {initialRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border shadow-sm">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Tudo em dia!</h3>
            <p className="text-slate-500 mt-1">Não há solicitações de agendamento pendentes no momento.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {initialRequests.map((req) => (
              <div key={req.id} className="bg-white rounded-2xl p-5 border shadow-sm flex flex-col hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                      <User className="w-5 h-5 text-slate-600" />
                    </div>
                    <div>
                      <p className="font-bold text-sm leading-tight text-slate-900">{req.client?.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{req.client?.phone}</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 mb-6 flex-1">
                  <div className="flex items-start gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-sm font-medium leading-tight">{req.snapshot_service_name || req.service?.name}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                    <p className="text-sm">{format(new Date(req.date_time), "dd 'de' MMMM, yyyy", { locale: ptBR })}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                    <p className="text-sm font-bold text-slate-700">{format(new Date(req.date_time), "HH:mm")}</p>
                  </div>
                  
                  {req.observations && (
                    <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs text-slate-600">
                      <span className="font-semibold block mb-1">Observações do Cliente:</span>
                      <p className="italic line-clamp-3">{req.observations}</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 mt-auto">
                  <Button 
                    variant="outline" 
                    className="w-full text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 font-bold h-10"
                    disabled={loadingId === req.id}
                    onClick={() => handleStatusChange(req.id, "cancelado")}
                  >
                    {loadingId === req.id ? "Processando..." : <><X className="w-4 h-4 mr-1.5" /> Recusar</>}
                  </Button>
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-10"
                    disabled={loadingId === req.id}
                    onClick={() => handleStatusChange(req.id, "confirmado")}
                  >
                    {loadingId === req.id ? "Processando..." : <><Check className="w-4 h-4 mr-1.5" /> Aprovar</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
