"use client";

import { useEffect, useState } from "react";
import { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Package, Plus, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { Package as PackageType } from "@/lib/data";
import { PackageVoucher } from "./package-voucher";

interface PackageTemplate {
  id: string;
  name: string;
  total_sessions: number;
  price: number;
  service_id: string; // 🔥 Adicionado para a amarração automática
  active: boolean; // 🔥 Corrigido de is_active para active
}

interface ClientPackageProps {
  clientId: string;
  clientName: string;
  activePackage: PackageType | null;
}

export function ClientPackage({
  clientId,
  clientName,
  activePackage,
}: ClientPackageProps) {
  const [addPkgOpen, setAddPkgOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 1. Carrega apenas os templates ativos do catálogo
  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await fetch("/api/package-templates?active=true");
        if (res.ok) {
          const data = await res.json();
          // 🔥 Filtro corrigido para 'active'
          setTemplates(data);
          if (data.length > 0) setTemplateId(data[0].id);
        }
      } catch (e) {
        console.error("Erro ao carregar templates:", e);
      }
    };
    if (addPkgOpen) loadTemplates();
  }, [addPkgOpen]);

  const progress = activePackage
    ? Math.round(
        (activePackage.used_sessions / activePackage.total_sessions) * 100,
      )
    : 0;

  const isCompleted = activePackage
    ? activePackage.used_sessions >= activePackage.total_sessions
    : false;

  const handleAddPackage = async () => {
    if (!templateId) {
      toast.error("Selecione um pacote do catálogo");
      return;
    }

    const selectedTemplate = templates.find((t) => t.id === templateId);
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      // 🔥 Rota correta conforme o contrato da sua API
      const res = await fetch("/api/packages/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          service_id: selectedTemplate.service_id, // Vem automático do template
          total_sessions: Number(selectedTemplate.total_sessions),
          price: Number(selectedTemplate.price),
        }),
      });

      if (res.ok) {
        toast.success("Pacote vinculado com sucesso!");
        mutate(`/api/clients/${clientId}`); // Atualiza os dados da tela
        setAddPkgOpen(false);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao vincular pacote");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  const currentTemplate = templates.find((t) => t.id === templateId);

  return (
    <>
      <Card className="md:col-span-1 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
        <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" />
            Pacote Ativo
          </CardTitle>

          <Dialog open={addPkgOpen} onOpenChange={setAddPkgOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="rounded-full h-8 px-3 border-primary/20 text-primary hover:bg-primary/5"
              >
                <Plus className="h-3.5 w-3.5 mr-1" /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-100">
              <DialogHeader>
                <DialogTitle>Vender Novo Pacote</DialogTitle>
                <DialogDescription>
                  Selecione um plano do seu catálogo para aplicar a este
                  cliente.
                </DialogDescription>
              </DialogHeader>

              <div className="flex flex-col gap-4 py-4">
                <div className="flex flex-col gap-2">
                  <Label>Plano Disponível</Label>
                  <select
                    className="h-11 rounded-xl border border-input bg-background px-3 text-sm focus:ring-2 focus:ring-primary"
                    value={templateId}
                    onChange={(e) => setTemplateId(e.target.value)}
                  >
                    {templates.length === 0 && (
                      <option>Nenhum pacote ativo no catálogo</option>
                    )}
                    {templates.map((tpl) => (
                      <option key={tpl.id} value={tpl.id}>
                        {tpl.name}
                      </option>
                    ))}
                  </select>
                </div>

                {currentTemplate && (
                  <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 space-y-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs">
                      <Sparkles className="h-3.5 w-3.5" /> RESUMO DO PLANO
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Sessões:</span>
                      <span className="font-bold text-foreground">
                        {currentTemplate.total_sessions}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Preço:</span>
                      <span className="font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(currentTemplate.price)}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button
                  onClick={handleAddPackage}
                  disabled={loading || templates.length === 0}
                  className="w-full rounded-xl h-11"
                >
                  {loading ? "Processando..." : "Confirmar Venda"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="px-0 pb-0 md:pb-6 md:px-6">
          {activePackage ? (
            <div className="flex flex-col gap-4 bg-primary/5 p-4 md:p-5 rounded-xl border border-primary/10">
              <div className="flex justify-between items-end mb-1">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Progresso
                </span>
                <span className="text-2xl font-black text-foreground">
                  {activePackage.used_sessions}
                  <span className="text-sm text-muted-foreground font-normal ml-1">
                    / {activePackage.total_sessions}
                  </span>
                </span>
              </div>

              <Progress value={progress} className="h-2.5 bg-primary/20" />

              <p className="text-xs font-medium text-muted-foreground">
                {!isCompleted
                  ? `Faltam ${activePackage.total_sessions - activePackage.used_sessions} sessões.`
                  : "Todas as sessões foram realizadas! 🎉"}
              </p>

              {isCompleted && (
                <Button
                  onClick={() => setVoucherOpen(true)}
                  className="w-full rounded-xl bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all"
                >
                  <Award className="mr-2 h-4 w-4" /> Gerar Comprovante Final
                </Button>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center bg-muted/20 rounded-xl border border-dashed border-border/60">
              <Package className="h-8 w-8 text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground px-4">
                Este cliente não possui pacotes ativos no momento.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {activePackage && (
        <PackageVoucher
          open={voucherOpen}
          onOpenChange={setVoucherOpen}
          clientName={clientName}
          packageName={activePackage.name}
          totalSessions={activePackage.total_sessions}
          packageId={activePackage.id}
        />
      )}
    </>
  );
}
