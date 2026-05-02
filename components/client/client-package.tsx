"use client";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
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
import { Package, Plus, LoaderDots, Archive } from "@boxicons/react";
import { toast } from "sonner";
import { PackageVoucher } from "./package-voucher";
import { cn } from "@/lib/utils";
import { getPaymentMethods } from "@/app/actions/payment-methods";
import { OrganizationPaymentMethod } from "@/types/finance";
import { archivePackage } from "@/app/actions/packages";

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

  // Encontra o pacote ativo atual
  const activePackage =
    packages?.find(
      (pkg) => pkg.active && pkg.used_sessions < pkg.total_sessions,
    ) || null;

  const [addPkgOpen, setAddPkgOpen] = useState(false);
  const [voucherOpen, setVoucherOpen] = useState(false);
  const [templates, setTemplates] = useState<PackageTemplate[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  // 🔥 ESTADOS PARA ENCAMINHAMENTO DO PACOTE
  const [isArchiving, setIsArchiving] = useState(false);
  const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);

  // 🔥 ESTADOS FINANCEIROS
  const [paymentMethods, setPaymentMethods] = useState<
    OrganizationPaymentMethod[]
  >([]);
  const [payUpfront, setPayUpfront] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<string>("");

  // 🔥 NOVOS ESTADOS PARA PARCELAMENTO
  const [generateInstallments, setGenerateInstallments] = useState(false);
  const [installmentsCount, setInstallmentsCount] = useState<number>(2);

  useEffect(() => {
    const loadData = async () => {
      try {
        const res = await fetch("/api/package-templates?active=true");
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
          if (data.length > 0) setTemplateId(data[0].id);
        }
        const methodsData = await getPaymentMethods();
        setPaymentMethods(methodsData as OrganizationPaymentMethod[]);
      } catch (e) {
        console.error("Erro ao carregar dados:", e);
      }
    };
    if (addPkgOpen) loadData();
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
    if (payUpfront && !selectedMethod) {
      toast.error("Selecione a forma de pagamento.");
      return;
    }
    if (
      !payUpfront &&
      generateInstallments &&
      (installmentsCount < 2 || installmentsCount > 24)
    ) {
      toast.error("O número de parcelas deve ser entre 2 e 24.");
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

          // Enviamos as decisões pro Back-end
          pay_upfront: payUpfront,
          payment_method: payUpfront ? selectedMethod : null,
          generate_installments: !payUpfront ? generateInstallments : false,
          installments_count: installmentsCount,
        }),
      });

      if (res.ok) {
        toast.success("Pacote vendido com sucesso!");
        mutate(`/api/admin/clients/${clientId}/packages`);
        setAddPkgOpen(false);
        // Reseta estados
        setPayUpfront(false);
        setGenerateInstallments(false);
        setInstallmentsCount(2);
      } else {
        const data = await res.json();
        toast.error(data.error || "Erro ao vender pacote");
      }
    } catch (error) {
      toast.error("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  // 🔥 FUNÇÃO ATUALIZADA: Lida com a confirmação e execução do encerramento
  const handleArchivePackage = async () => {
    if (!activePackage) return;

    // Nota: A confirmação visual agora é feita pelo Modal (Dialog) antes de chamar esta função.
    // Se preferir uma verificação extra de segurança no código (opcional), pode manter,
    // mas como solicitado, removemos o window.confirm.

    setIsArchiving(true);
    try {
      const result = await archivePackage(activePackage.id);
      if (result.success) {
        toast.success("Plano encerrado com sucesso!");
        mutate(`/api/admin/clients/${clientId}/packages`);
        setIsArchiveDialogOpen(false); // Fecha o modal de confirmação
      } else {
        toast.error(result.error || "Falha ao encerrar plano.");
      }
    } catch (error) {
      toast.error("Erro de comunicação com o servidor.");
    } finally {
      setIsArchiving(false);
    }
  };

  const currentTemplate = templates.find((t) => t.id === templateId);

  return (
    <>
      <Card className="md:col-span-1 border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
        <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-3 md:pb-6 flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground">
            <Package className="h-5 w-5 text-primary" /> Plano Ativo
          </CardTitle>

          <Dialog open={addPkgOpen} onOpenChange={setAddPkgOpen}>
            <DialogTrigger asChild>
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

              <div className="flex flex-col gap-4 py-4 max-h-[60vh] overflow-y-auto px-1">
                <div className="flex flex-col gap-2">
                  <Label>Plano Disponível</Label>
                  <Select
                    value={templateId}
                    onValueChange={(val) => {
                      setTemplateId(val);
                      const tpl = templates.find((t) => t.id === val);
                      if (tpl) setInstallmentsCount(tpl.total_sessions);
                    }}
                    disabled={templates.length === 0 || loading}
                  >
                    <SelectTrigger className="h-11 rounded-xl bg-muted/30">
                      <SelectValue
                        placeholder={
                          templates.length === 0
                            ? "Nenhum pacote ativo"
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
                      <span className="text-muted-foreground">
                        Preço Total:
                      </span>
                      <span className="font-bold text-primary">
                        {new Intl.NumberFormat("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        }).format(currentTemplate.price)}
                      </span>
                    </div>
                  </div>
                )}

                <div className="my-1 border-t border-border/50" />

                {/* 🔥 BLOCO FINANCEIRO */}
                <div className="flex flex-col gap-4">
                  <div className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-3 bg-muted/20">
                    <div className="space-y-0.5 pr-4">
                      <Label className="text-sm font-bold">
                        Pagar Pacote à Vista?
                      </Label>
                      <p className="text-[11px] text-muted-foreground leading-tight">
                        Registra o valor total no caixa agora. Desative para
                        pagamento parcelado.
                      </p>
                    </div>
                    <Switch
                      checked={payUpfront}
                      onCheckedChange={(val) => {
                        setPayUpfront(val);
                        if (val) setGenerateInstallments(false);
                      }}
                      disabled={loading}
                    />
                  </div>

                  {payUpfront && (
                    <div className="flex flex-col gap-2 animate-in fade-in zoom-in-95 duration-200">
                      <Label className="text-xs font-bold uppercase text-muted-foreground">
                        Forma de Pagamento
                      </Label>
                      <Select
                        value={selectedMethod}
                        onValueChange={setSelectedMethod}
                        disabled={loading}
                      >
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Como o cliente está pagando?" />
                        </SelectTrigger>
                        <SelectContent>
                          {paymentMethods
                            .filter((pm) => pm.isActive)
                            .map((pm) => (
                              <SelectItem key={pm.id} value={pm.type}>
                                {pm.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* 🔥 BLOCO DE PARCELAMENTO */}
                  {!payUpfront && (
                    <div className="flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex flex-row items-center justify-between rounded-xl border border-border/50 p-3 bg-amber-500/10 dark:bg-amber-500/5">
                        <div className="space-y-0.5 pr-4">
                          <Label className="text-sm font-bold text-amber-700 dark:text-amber-500">
                            Gerar Contas a Receber?
                          </Label>
                          <p className="text-[11px] text-amber-600/80 dark:text-amber-500/80 leading-tight">
                            Cria parcelas mensais pendentes automaticamente no
                            financeiro.
                          </p>
                        </div>
                        <Switch
                          checked={generateInstallments}
                          onCheckedChange={setGenerateInstallments}
                          disabled={loading}
                        />
                      </div>

                      {generateInstallments && (
                        <div className="flex flex-col gap-2">
                          <Label className="text-xs font-bold uppercase text-muted-foreground">
                            Quantidade de Parcelas
                          </Label>
                          <Input
                            type="number"
                            min={2}
                            max={24}
                            value={installmentsCount}
                            onChange={(e) =>
                              setInstallmentsCount(Number(e.target.value))
                            }
                            disabled={loading}
                            className="h-11 rounded-xl w-32"
                          />
                          {currentTemplate && installmentsCount > 0 && (
                            <p className="text-xs text-muted-foreground mt-1 font-medium">
                              Serão geradas {installmentsCount} parcelas de{" "}
                              {new Intl.NumberFormat("pt-BR", {
                                style: "currency",
                                currency: "BRL",
                              }).format(
                                currentTemplate.price / installmentsCount,
                              )}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter>
                <Button
                  onClick={handleAddPackage}
                  disabled={loading || templates.length === 0 || !templateId}
                  className="w-full h-14 sm:h-12 text-lg sm:text-base rounded-xl transition-all hover:scale-[1.02] shadow-md"
                >
                  {loading ? (
                    <>
                      <LoaderDots className="h-4 w-4 mr-2 animate-spin" />{" "}
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
            <div className="flex flex-col gap-5 p-5 rounded-xl border border-border/40 md:bg-muted/10">
              <div className="flex flex-col gap-1">
                <span className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
                  Sessões Realizadas
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

              {/* 🔥 AQUI FICAM OS BOTÕES */}
              <div className="flex flex-col gap-2 mt-2">
                {isCompleted && (
                  <Button
                    onClick={() => setVoucherOpen(true)}
                    variant="outline"
                    className="w-full rounded-xl border-primary/20 text-primary h-10"
                  >
                    Comprovante Final
                  </Button>
                )}

                {/* 🔥 MODAL DE CONFIRMAÇÃO PARA ENCERRAR PLANO */}
                <Dialog
                  open={isArchiveDialogOpen}
                  onOpenChange={setIsArchiveDialogOpen}
                >
                  <DialogTrigger asChild>
                    <Button
                      disabled={isArchiving}
                      variant="destructive"
                      className="w-full rounded-xl h-10 flex items-center justify-center"
                    >
                      {isArchiving ? (
                        <>
                          <LoaderDots className="h-4 w-4 mr-2 animate-spin" />{" "}
                          Processando...
                        </>
                      ) : (
                        <>
                          <Archive className="h-4 w-4 mr-2" />
                          Encerrar / Zerar Plano
                        </>
                      )}
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-100 rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-destructive">
                        Encerrar Plano Prematuramente?
                      </DialogTitle>
                      <DialogDescription className="text-base py-2">
                        Tem certeza que deseja encerrar este plano? O saldo
                        restante de sessões será perdido e esta ação não pode
                        ser desfeita.
                      </DialogDescription>
                    </DialogHeader>
                    <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsArchiveDialogOpen(false)}
                        disabled={isArchiving}
                        className="w-full sm:w-auto"
                      >
                        Cancelar
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        onClick={handleArchivePackage}
                        disabled={isArchiving}
                        className="w-full sm:w-auto"
                      >
                        {isArchiving ? (
                          <LoaderDots className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                          "Sim, encerrar plano"
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </div>
          ) : (
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
