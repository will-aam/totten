"use client";

import { useState } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, ExternalLink } from "lucide-react";
import {
  Trophy,
  UserCircle,
  Cog,
  Plus,
  Search,
  Gift,
  Star,
  InfoCircle,
} from "@boxicons/react";

// Dados estáticos de exemplo
const MOCK_CLIENTS = [
  { id: 1, name: "Maria Silva", points: 150, lastCheckIn: "24/09/2026", tier: "Ouro" },
  { id: 2, name: "João Pedro", points: 85, lastCheckIn: "20/09/2026", tier: "Prata" },
  { id: 3, name: "Ana Beatriz", points: 45, lastCheckIn: "15/09/2026", tier: "Bronze" },
  { id: 4, name: "Carlos Souza", points: 12, lastCheckIn: "01/09/2026", tier: "Bronze" },
];

const MOCK_REWARDS = [
  { id: 1, title: "Desconto de 10% no pacote", pointsCost: 50 },
  { id: 2, title: "1 Sessão Extra Grátis", pointsCost: 100 },
  { id: 3, title: "Cesta de Produtos", pointsCost: 300 },
];

export function LoyaltyView() {
  const [activeTab, setActiveTab] = useState("overview");
  const [programScope, setProgramScope] = useState<"global" | "specific">("global");
  const [pendingScope, setPendingScope] = useState<"global" | "specific" | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const handleScopeChange = (value: "global" | "specific") => {
    if (value !== programScope) {
      setPendingScope(value);
      setIsAlertOpen(true);
    }
  };

  const confirmScopeChange = () => {
    if (pendingScope) {
      setProgramScope(pendingScope);
    }
    setIsAlertOpen(false);
  };

  return (
    <>
      <AdminHeader title="Programa de Fidelidade" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* Banner Simples Estático */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold flex items-center gap-2 text-primary">
              <Trophy size="md" />
              Fidelize seus clientes
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Configure regras de pontos para cada check-in realizado e ofereça
              recompensas incríveis para quem mais frequenta o seu espaço.
            </p>
          </div>
          <Button variant="default" className="rounded-full shrink-0">
            Ativar Programa
          </Button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto mb-6 rounded-full bg-muted/50 p-1">
            <TabsTrigger value="overview" className="rounded-full flex items-center gap-2">
              <UserCircle size="sm" />
              Visão Geral
            </TabsTrigger>
            <TabsTrigger value="settings" className="rounded-full flex items-center gap-2">
              <Cog size="sm" />
              Configurações
            </TabsTrigger>
          </TabsList>

          {/* TAB 1: VISÃO GERAL */}
          <TabsContent value="overview" className="space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
              <div className="relative w-full sm:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size="sm" />
                <Input
                  placeholder="Buscar cliente por nome..."
                  className="pl-10 rounded-full bg-card"
                />
              </div>

              {programScope === "specific" && (
                <Button className="rounded-full w-full sm:w-auto flex items-center gap-2">
                  <Plus size="xs" />
                  Incluir Cliente
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {MOCK_CLIENTS.map((client) => (
                <Card key={client.id} className="rounded-2xl shadow-sm border-border/50 relative overflow-hidden">
                  {/* Ícones de fundo (design do dashboard) */}
                  <Star
                    aria-hidden="true"
                    type="solid"
                    width={100}
                    height={100}
                    rotate={-15}
                    className="pointer-events-none absolute -right-6 top-1/2 -translate-y-1/2 text-foreground/5"
                  />
                  <Star
                    aria-hidden="true"
                    type="solid"
                    width={40}
                    height={40}
                    rotate={20}
                    className="pointer-events-none absolute right-12 -bottom-4 text-foreground/5"
                  />

                  <CardContent className="relative z-10 p-5 flex flex-col items-center text-center gap-2">
                    <div className="space-y-1 mt-2">
                      <h3 className="font-semibold text-lg">{client.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Último Check-in: {client.lastCheckIn}
                      </p>
                    </div>
                    <div className="mt-2 inline-flex items-center gap-1.5 bg-secondary/50 px-3 py-1 rounded-full text-sm font-medium">
                      <span className="text-primary font-bold">{client.points}</span> 
                      <span>pts</span>
                    </div>

                    <div className="flex items-center gap-2 mt-4 w-full pt-4 border-t border-border/50">
                      <Button variant="outline" className="rounded-xl flex-1 flex flex-col gap-1 h-auto py-2 text-xs text-muted-foreground hover:text-foreground">
                        <Download size={16} />
                        Baixar
                      </Button>
                      <Button variant="outline" className="rounded-xl flex-1 flex flex-col gap-1 h-auto py-2 text-xs text-muted-foreground hover:text-foreground">
                        <ExternalLink size={16} />
                        Perfil
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* TAB 2: CONFIGURAÇÕES */}
          <TabsContent value="settings" className="space-y-6">
            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Abrangência do Programa</CardTitle>
                <CardDescription>
                  Defina se o sistema de pontos será aplicado a todos os clientes ou apenas a clientes selecionados.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                  <Select value={programScope} onValueChange={handleScopeChange}>
                    <SelectTrigger className="w-full sm:w-80 rounded-2xl">
                      <SelectValue placeholder="Selecione a abrangência" />
                    </SelectTrigger>
                    <SelectContent className="rounded-2xl">
                      <SelectItem value="global" className="rounded-xl">Global (Todos os clientes participam)</SelectItem>
                      <SelectItem value="specific" className="rounded-xl">Específico (Apenas clientes adicionados)</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/30 p-2 rounded-xl">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button className="text-primary hover:bg-primary/10 p-1 rounded-full transition-colors">
                          <InfoCircle size="sm" />
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-80 rounded-2xl text-sm leading-relaxed shadow-xl">
                        <div className="space-y-2">
                          <p><strong>Global:</strong> Todos os clientes começam a acumular pontos automaticamente a partir do momento em que o programa é ativado.</p>
                          <p><strong>Específico:</strong> Apenas os clientes que você adicionar manualmente irão acumular pontos.</p>
                          <p className="text-xs text-muted-foreground mt-2 border-t pt-2 border-border/50">
                            Nota: Pontos não são retroativos. Eles só passam a contar a partir da data de ativação ou adição do cliente no programa.
                          </p>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <span className="hidden sm:inline">Como isso funciona?</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle>Tem certeza que deseja mudar a abrangência?</AlertDialogTitle>
                  <AlertDialogDescription className="space-y-2" asChild>
                    <div>
                      <div>
                        Mudar de <strong>{programScope === "global" ? "Global" : "Específico"}</strong> para <strong>{pendingScope === "global" ? "Global" : "Específico"}</strong> pode alterar quem recebe pontos.
                      </div>
                      <div className="text-destructive font-medium">
                        Atenção: Os pontos começam a ser contabilizados apenas a partir de agora. Se você estiver restringindo o programa, clientes removidos poderão perder o acesso aos pontos atuais.
                      </div>
                    </div>
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-full">Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="rounded-full" onClick={confirmScopeChange}>
                    Confirmar Mudança
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>

            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Regras de Ganho</CardTitle>
                <CardDescription>
                  Defina quantos pontos o cliente ganha ao realizar ações no sistema.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/50 pb-4">
                  <div>
                    <Label className="text-base font-medium">Pontos por Check-in</Label>
                    <p className="text-sm text-muted-foreground">
                      Quantidade recebida cada vez que o status mudar para "Atendido".
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input type="number" defaultValue={10} className="w-20 text-center rounded-2xl" />
                    <Switch defaultChecked />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-base font-medium">Pontos por Agendamento Online</Label>
                    <p className="text-sm text-muted-foreground">
                      Bônus extra para clientes que agendam pelo link.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Input type="number" defaultValue={5} className="w-20 text-center rounded-2xl" />
                    <Switch defaultChecked />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border/50 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle className="text-lg">Recompensas e Resgates</CardTitle>
                  <CardDescription>
                    O que o cliente pode fazer com os pontos acumulados.
                  </CardDescription>
                </div>
                <Button size="sm" className="rounded-full flex items-center gap-1">
                  <Plus size="xs" />
                  Nova Recompensa
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {MOCK_REWARDS.map((reward) => (
                    <div key={reward.id} className="flex items-center justify-between p-4 rounded-2xl border border-border bg-card">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-full text-primary">
                          <Gift size="sm" />
                        </div>
                        <span className="font-medium">{reward.title}</span>
                      </div>
                      <div className="font-bold text-primary">
                        {reward.pointsCost} pts
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
