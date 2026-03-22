// components/client/client-package.tsx
"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Package, Plus, Award, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { PackageVoucher } from "./package-voucher";
import { cn } from "@/lib/utils";

export type PackageType = {
  id: string;
  name: string;
  total_sessions: number;
  used_sessions: number;
  price: number | string;
  active: boolean;
};

interface PackageTemplate {
  id: string;
  name: string;
  total_sessions: number;
  price: number;
  service_id: string;
  active: boolean;
}

interface ClientPackageProps {
  clientId: string;
  clientName: string;
  clientActive: boolean;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function ClientPackage({
  clientId,
  clientName,
  clientActive,
}: ClientPackageProps) {
  const { data: packages, isLoading: isLoadingPackages } = useSWR<
    PackageType[]
  >(`/api/admin/clients/${clientId}/packages`, fetcher);

  const activePackage =
    packages?.find(
      (pkg) => pkg.active && pkg.used_sessions < pkg.total_sessions,
    ) || null;

  const [addPkgOpen, setAddPkgOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadTemplates = async () => {
      try {
        const res = await fetch("/api/package-templates?active=true");
        if (res.ok) {
          const data = await res.json();
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
      const res = await fetch("/api/packages/templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: clientId,
          service_id: selectedTemplate.service_id,
          total_sessions: Number(selectedTemplate.total_sessions),
          price: Number(selectedTemplate.price),
        }),
      });

      if (res.ok) {
        toast.success("Pacote vinculado com sucesso!");
        mutate(`/api/admin/clients/${clientId}/packages`);
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
      {/* Mobile: Transparente e colado na tela. Desktop: Card padrão */}
      <Card className="md:col-span-1 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
        <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 md:pb-6 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" /> Plano Ativo
          </CardTitle>

          <Dialog open={addPkgOpen} onOpenChange={setAddPkgOpen}>
            <DialogTrigger asChild>
              {/* Botão Novo: Estilo outline, sem hover, efeito click ativo */}
              <Button
                size="sm"
                variant="outline"
                disabled={!clientActive}
                className="h-8 rounded-full border-primary/20 text-primary select-none transition-transform duration-100 ease-out hover:bg-transparent hover:text-primary active:scale-95 active:bg-primary/10 text-xs font-medium px-3"
              >
                <Plus className="h-3.5 w-3.5 mr-1" strokeWidth={2} /> Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md rounded-2xl">
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
                  <Select
                    value={templateId}
                    onValueChange={setTemplateId}
                    disabled={templates.length === 0 || loading}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/30">
                      <SelectValue
                        placeholder={
                          templates.length === 0
                            ? "Nenhum pacote ativo no catálogo"
                            : "Selecione um plano"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((tpl) => (
                        <SelectItem key={tpl.id} value={tpl.id}>
                          {tpl.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {currentTemplate && (
                  // Resumo: Cores neutras/muted ao invés de amber
                  <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2 mt-2">
                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wider">
                      Resumo do Plano
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
                  disabled={loading || templates.length === 0 || !templateId}
                  className="w-full h-14 sm:h-12 text-lg sm:text-base rounded-xl transition-all hover:scale-[1.02] shadow-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />{" "}
                      Processando...
                    </>
                  ) : (
                    "Confirmar Venda"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>

        <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-5">
          {isLoadingPackages ? (
            <div className="space-y-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-4 w-32 rounded" />
            </div>
          ) : activePackage ? (
            // Conteúdo do pacote ativo: visual limpo, sem fundo colorido excessivo
            <div className="flex flex-col gap-5 p-5 rounded-xl border border-border/40 md:bg-muted/10">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  <Award className="h-3 w-3" /> Sessões Realizadas
                </span>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-4xl font-black text-primary leading-none">
                    {activePackage.used_sessions}
                  </span>
                  <span className="text-lg font-medium text-muted-foreground leading-none">
                    / {activePackage.total_sessions}
                  </span>
                </div>
              </div>

              <div className="space-y-2">
                {/* Progress: Cor primária */}
                <Progress
                  value={progress}
                  className="h-2.5 bg-primary/10 [&>div]:bg-primary"
                />
                <p className="text-xs font-medium text-muted-foreground">
                  {!isCompleted
                    ? `Restam ${activePackage.total_sessions - activePackage.used_sessions} sessões para concluir.`
                    : "🎉 Todas as sessões foram finalizadas!"}
                </p>
              </div>

              {isCompleted && (
                <Button
                  onClick={() => setVoucherOpen(true)}
                  variant="outline"
                  className="w-full rounded-xl border-primary/20 text-primary select-none transition-transform duration-100 ease-out hover:bg-transparent active:scale-95 active:bg-primary/10 h-10"
                >
                  <Award className="mr-2 h-4 w-4" /> Comprovante Final
                </Button>
              )}
            </div>
          ) : (
            // Estado vazio: visual limpo e integrado
            <div className="flex flex-col items-center justify-center text-center bg-muted/20 rounded-xl border border-dashed border-border p-6 py-10">
              <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-3">
                <Package
                  className="h-6 w-6 text-muted-foreground/50"
                  strokeWidth={1.5}
                />
              </div>
              <p className="text-sm text-muted-foreground font-medium">
                Sem plano ativo
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1 max-w-50">
                Clique em "Novo" para vender um pacote.
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
