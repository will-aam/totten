// components/finance/payment-method-modal.tsx
"use client";

import { useEffect, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { OrganizationPaymentMethod, PaymentMethod } from "@/types/finance";
import {
  Check,
  ChevronsUpDown,
  LoaderDots,
  PlusCircle,
  Trash,
} from "@boxicons/react";
import { cn } from "@/lib/utils";
import {
  upsertPaymentMethod,
  deletePaymentMethod,
} from "@/app/actions/payment-methods";
import { useToast } from "@/hooks/use-toast";

interface PaymentMethodModalProps {
  isOpen: boolean;
  onClose: () => void;
  method?: OrganizationPaymentMethod | null;
}

export function PaymentMethodModal({
  isOpen,
  onClose,
  method,
}: PaymentMethodModalProps) {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();

  const [selectedName, setSelectedName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [feePercentage, setFeePercentage] = useState<number | "">("");
  const [feeFixed, setFeeFixed] = useState<number | "">("");
  const [daysToReceive, setDaysToReceive] = useState<number | "">("");

  const [openCombobox, setOpenCombobox] = useState(false);
  const [search, setSearch] = useState("");

  const defaultNames = [
    "Pix",
    "Cartão de Crédito",
    "Cartão de Débito",
    "Dinheiro",
  ];
  const [customNames, setCustomNames] = useState<string[]>([]);

  const allNames = [...defaultNames, ...customNames];
  const filteredNames = allNames.filter((n) =>
    n.toLowerCase().includes(search.toLowerCase()),
  );

  useEffect(() => {
    if (isOpen) {
      if (method) {
        setSelectedName(method.name);
        setIsActive(method.isActive);
        setFeePercentage(Number(method.feePercentage));
        setFeeFixed(Number(method.feeFixed));
        setDaysToReceive(method.daysToReceive);

        if (
          !defaultNames.includes(method.name) &&
          !customNames.includes(method.name)
        ) {
          setCustomNames((prev) => [...prev, method.name]);
        }
      } else {
        setSelectedName("");
        setIsActive(true);
        setFeePercentage(0);
        setFeeFixed(0);
        setDaysToReceive(0);
      }
    }
  }, [isOpen, method]);

  const deriveBaseType = (name: string): PaymentMethod => {
    const lower = name.toLowerCase();
    if (lower.includes("pix")) return "PIX";
    if (lower.includes("crédito") || lower.includes("credito"))
      return "CARTAO_CREDITO";
    if (lower.includes("débito") || lower.includes("debito"))
      return "CARTAO_DEBITO";
    if (lower.includes("dinheiro") || lower.includes("espécie"))
      return "DINHEIRO";
    return "OUTRO";
  };

  const handleSave = () => {
    if (!selectedName) return;

    startTransition(async () => {
      const result = await upsertPaymentMethod({
        id: method?.id,
        name: selectedName,
        type: deriveBaseType(selectedName),
        isActive,
        feePercentage: Number(feePercentage) || 0,
        feeFixed: Number(feeFixed) || 0,
        daysToReceive: Number(daysToReceive) || 0,
      });

      if (result.success) {
        toast({
          title: "Sucesso",
          description: "Configuração salva com sucesso!",
        });
        onClose();
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleDelete = () => {
    if (!method?.id) return;

    if (!confirm("Tem certeza que deseja excluir este meio de pagamento?"))
      return;

    startTransition(async () => {
      const result = await deletePaymentMethod(method.id);
      if (result.success) {
        toast({
          title: "Excluído",
          description: "Meio de pagamento removido.",
        });
        onClose();
      } else {
        toast({
          title: "Erro",
          description: result.error,
          variant: "destructive",
        });
      }
    });
  };

  const handleClearSelection = () => {
    if (customNames.includes(selectedName)) {
      setCustomNames((prev) => prev.filter((n) => n !== selectedName));
    }
    setSelectedName("");
  };

  const isEditing = !!method;
  const isSaveDisabled = !selectedName || isPending;
  const hideNumberArrows =
    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => !open && !isPending && onClose()}
    >
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 overflow-hidden sm:rounded-l-4xl border-l-0">
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          <SheetHeader className="text-left mt-2">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <SheetTitle className="text-2xl font-black text-foreground">
                  {isEditing ? "Editar Pagamento" : "Novo Pagamento"}
                </SheetTitle>
                <SheetDescription className="font-medium text-muted-foreground">
                  Configure as taxas e prazos.
                </SheetDescription>
              </div>
              {isEditing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-2xl shrink-0"
                  onClick={handleDelete}
                  disabled={isPending}
                >
                  <Trash className="h-5 w-5" />
                </Button>
              )}
            </div>
          </SheetHeader>

          <div className="flex flex-col gap-6 py-2">
            <div className="flex items-center justify-between p-5 bg-card border border-border/50 rounded-3xl">
              <div className="space-y-0.5">
                <Label className="text-sm font-black uppercase tracking-widest text-foreground">
                  Status do Método
                </Label>
                <p className="text-xs font-medium text-muted-foreground">
                  Se desativado, não aparece nas vendas.
                </p>
              </div>
              <Switch
                checked={isActive}
                onCheckedChange={setIsActive}
                disabled={isPending}
                className="data-[state=checked]:bg-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Meio de Pagamento *
              </Label>
              <div className="flex items-center gap-2">
                <Popover
                  open={openCombobox}
                  onOpenChange={(open) => !isPending && setOpenCombobox(open)}
                >
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      disabled={isPending}
                      className={cn(
                        "flex-1 justify-between h-12 rounded-2xl text-left font-bold border-border/50 bg-card hover:bg-muted/50",
                        !selectedName && "text-muted-foreground font-medium",
                      )}
                    >
                      <span className="truncate">
                        {selectedName || "Selecione ou digite um novo..."}
                      </span>
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent
                    className="w-[calc(100vw-3rem)] sm:w-80 p-0 rounded-2xl border-border/50 shadow-xl"
                    align="start"
                  >
                    <Command shouldFilter={false}>
                      <CommandInput
                        placeholder="Buscar ou digitar..."
                        value={search}
                        onValueChange={setSearch}
                        className="h-11"
                      />
                      <CommandList>
                        <CommandGroup>
                          {filteredNames.map((name) => (
                            <CommandItem
                              key={name}
                              value={name}
                              onSelect={() => {
                                setSelectedName(name);
                                setOpenCombobox(false);
                              }}
                              className="font-medium"
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4 text-primary",
                                  selectedName === name
                                    ? "opacity-100"
                                    : "opacity-0",
                                )}
                              />
                              {name}
                            </CommandItem>
                          ))}
                          {search.length > 0 &&
                            !allNames.some(
                              (n) => n.toLowerCase() === search.toLowerCase(),
                            ) && (
                              <CommandItem
                                onSelect={() => {
                                  setCustomNames((prev) => [...prev, search]);
                                  setSelectedName(search);
                                  setSearch("");
                                  setOpenCombobox(false);
                                }}
                                className="font-bold text-primary"
                              >
                                <PlusCircle className="mr-2 h-4 w-4" /> Criar "
                                {search}"
                              </CommandItem>
                            )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>

                {!isEditing && (
                  <Button
                    variant="outline"
                    size="icon"
                    disabled={!selectedName || isPending}
                    onClick={handleClearSelection}
                    className="h-12 w-12 shrink-0 rounded-2xl border-border/50 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 bg-card"
                  >
                    <Trash className="h-5 w-5" />
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Taxa (%)
                </Label>
                <div className="relative">
                  <Input
                    type="number"
                    value={feePercentage}
                    onChange={(e) =>
                      setFeePercentage(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={isPending}
                    className={cn(
                      "h-12 rounded-2xl pr-8 bg-card border-border/50 font-bold focus-visible:ring-primary/20",
                      hideNumberArrows,
                    )}
                    placeholder="0.00"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                    %
                  </span>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                  Taxa Fixa
                </Label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-bold">
                    R$
                  </span>
                  <Input
                    type="number"
                    value={feeFixed}
                    onChange={(e) =>
                      setFeeFixed(
                        e.target.value === "" ? "" : Number(e.target.value),
                      )
                    }
                    disabled={isPending}
                    className={cn(
                      "h-12 rounded-2xl pl-10 bg-card border-border/50 font-bold focus-visible:ring-primary/20",
                      hideNumberArrows,
                    )}
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground ml-1">
                Dias para receber
              </Label>
              <Input
                type="number"
                value={daysToReceive}
                onChange={(e) =>
                  setDaysToReceive(
                    e.target.value === "" ? "" : Number(e.target.value),
                  )
                }
                disabled={isPending}
                className={cn(
                  "h-12 rounded-2xl bg-card border-border/50 font-bold focus-visible:ring-primary/20",
                  hideNumberArrows,
                )}
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 border-t border-border/40 bg-background">
          <SheetFooter className="flex-row gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 rounded-2xl font-bold border-border/50 hover:bg-muted/50"
              onClick={onClose}
              disabled={isPending}
            >
              Cancelar
            </Button>
            <Button
              className="flex-1 h-12 rounded-2xl font-bold shadow-md shadow-primary/20"
              onClick={handleSave}
              disabled={isSaveDisabled}
            >
              {isPending ? (
                <LoaderDots className="h-5 w-5 animate-spin" />
              ) : (
                "Salvar"
              )}
            </Button>
          </SheetFooter>
        </div>
      </SheetContent>
    </Sheet>
  );
}
