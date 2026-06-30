// app/admin/clients/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin-header";
import { ImportClientsModal } from "./components/import-clients-modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Group,
  Plus,
  Search,
  ChevronUp,
  ChevronRight,
  Trash,
  UserMinus,
  UserCheck,
  Mobile,
  Table as TableIcon,
  File,
  Cloud,
  ArrowOutDownSquareHalf,
  Layers,
  Paperclip,
  Share,
} from "@boxicons/react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type Client = {
  id: string;
  name: string;
  cpf: string;
  phone_whatsapp: string;
  activePackageName?: string | null;
  activePackagesCount?: number;
  hasHistory?: boolean;
  hasAnamnesis?: boolean;
  active: boolean;
};

type ApiResponse = {
  data: Client[];
  total: number;
  page: number;
  totalPages: number;
};

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const ITEMS_PER_PAGE = 8;

function ClientMobileItem({
  client,
  onClick,
  onActionClick,
  onShareClick,
}: {
  client: Client;
  onClick: () => void;
  onActionClick: (c: Client, e: React.MouseEvent) => void;
  onShareClick: (c: Client, e: React.MouseEvent) => void;
}) {
  const initial = client.name.charAt(0).toUpperCase();

  return (
    <div
      onClick={client.active ? onClick : undefined}
      className={cn(
        "flex items-center justify-between py-3 px-2 -mx-2 border-b border-border/50 last:border-0 transition-colors",
        client.active
          ? "hover:bg-muted/30 active:scale-[0.98] cursor-pointer"
          : "opacity-60 bg-muted/10 cursor-not-allowed grayscale-[0.2]",
      )}
    >
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold shadow-sm border-2",
              client.active
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
            )}
          >
            {initial}
          </div>
          {client.active && client.hasAnamnesis && (
            <div
              className="absolute top-0 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-background z-10"
              title="Possui Ficha de Anamnese"
            >
              <Paperclip
                size="xs"
                className="text-blue-500 dark:text-blue-400 h-3 w-3"
              />
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-foreground leading-none mb-1.5">
            {client.name}
          </span>
          <span className="text-xs text-muted-foreground leading-none">
            {client.cpf}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-1 text-muted-foreground/50 shrink-0">
        {client.activePackageName && client.active && (
          <div className="flex items-center gap-1 mr-1">
            <span
              className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md truncate max-w-32.5"
              title={client.activePackageName}
            >
              {client.activePackageName.length > 18
                ? `${client.activePackageName.substring(0, 18)}...`
                : client.activePackageName}
            </span>
            {client.activePackagesCount && client.activePackagesCount > 1 ? (
              <span className="text-[9px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded-md h-full flex items-center">
                +{client.activePackagesCount - 1}
              </span>
            ) : null}
          </div>
        )}

        {/* 🔥 NOVO: Botão de Compartilhar Portal (Mobile) */}
        {client.active && (
          <button
            onClick={(e) => onShareClick(client, e)}
            className="p-2 rounded-full transition-all active:scale-95 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 active:bg-blue-500/20"
            title="Compartilhar Portal com a Cliente"
          >
            <Share size="sm" />
          </button>
        )}

        <button
          onClick={(e) => onActionClick(client, e)}
          className={cn(
            "p-2 rounded-full transition-all active:scale-95",
            client.active
              ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:bg-destructive/20"
              : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 active:bg-emerald-500/20",
          )}
          title={
            !client.active
              ? "Reativar Cliente"
              : client.hasHistory
                ? "Desativar Cliente"
                : "Excluir Cliente"
          }
        >
          {!client.active ? (
            <UserCheck size="sm" />
          ) : client.hasHistory ? (
            <UserMinus size="sm" />
          ) : (
            <Trash size="sm" />
          )}
        </button>
        <ChevronRight
          size="sm"
          className={cn("shrink-0 ml-1", !client.active && "hidden")}
        />
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const debouncedSearch = useDebounce(search, 500);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const hasMultiplePackagesFilter = debouncedSearch.includes("**");
  let cleanSearch = debouncedSearch.replace(/\*\*/g, "").trim();

  let apiUrl = `/api/clients?page=${page}&limit=${ITEMS_PER_PAGE}`;
  if (hasMultiplePackagesFilter) apiUrl += `&multiple_packages=true`;
  if (cleanSearch.length >= 3)
    apiUrl += `&q=${encodeURIComponent(cleanSearch)}`;

  const {
    data: apiResponse,
    isLoading,
    mutate,
  } = useSWR<ApiResponse>(apiUrl, fetcher);

  const clients = apiResponse?.data || [];
  const totalPages = apiResponse?.totalPages || 1;
  const totalClients = apiResponse?.total || 0;

  const [clientToProcess, setClientToProcess] = useState<Client | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 200);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  const handleActionClick = (client: Client, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClientToProcess(client);
  };

  // 🔥 NOVA FUNÇÃO: Gera o link seguro e envia pro WhatsApp
  const handleSharePortal = (client: Client, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const origin = window.location.origin;
    const shareLink = `${origin}/cliente/${client.id}`;

    let phone = client.phone_whatsapp?.replace(/\D/g, "") || "";
    // Adiciona o DDI (55) se a clínica salvou o número só com DDD
    if (phone && (phone.length === 10 || phone.length === 11)) {
      phone = `55${phone}`;
    }

    const firstName = client.name.split(" ")[0];
    const message = `Olá, ${firstName}! Acompanhe seu pacote de sessões e histórico no nosso portal exclusivo: ${shareLink}`;

    if (phone) {
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(message)}`,
        "_blank",
      );
    } else {
      // Fallback elegante caso a cliente não tenha telefone salvo
      navigator.clipboard.writeText(message);
      toast.success(
        "Cliente sem número. Link copiado para a área de transferência!",
      );
    }
  };

  const confirmProcess = async () => {
    if (!clientToProcess) return;

    if (!clientToProcess.active) {
      try {
        const res = await fetch(`/api/clients/${clientToProcess.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ active: true }),
        });
        if (!res.ok) throw new Error("Erro ao reativar");
        toast.success("Cliente reativado com sucesso!");
        mutate();
      } catch {
        toast.error("Erro ao reativar o cliente.");
      } finally {
        setClientToProcess(null);
      }
      return;
    }

    const actionText = clientToProcess.hasHistory ? "desativar" : "excluir";
    try {
      const res = await fetch(`/api/clients/${clientToProcess.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erro na requisição");
      toast.success(
        clientToProcess.hasHistory
          ? "Cliente desativado com sucesso!"
          : "Cliente excluído com sucesso!",
      );
      if (!clientToProcess.hasHistory && clients.length === 1 && page > 1) {
        setPage(page - 1);
      } else {
        mutate();
      }
    } catch {
      toast.error(`Erro ao ${actionText} o cliente.`);
    } finally {
      setClientToProcess(null);
    }
  };

  return (
    <>
      <AdminHeader title="Clientes" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="relative w-full lg:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={cn(
                "bg-card pl-10 text-foreground rounded-full md:rounded-md shadow-sm border-border transition-all duration-300",
                search.includes("**") && "pr-32 border-primary/50 bg-primary/5",
              )}
            />
            {search.includes("**") && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold bg-primary text-primary-foreground px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1 animate-in zoom-in duration-300 pointer-events-none">
                <Layers size="xs" /> Mais de 1 Pacote
              </span>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 w-full sm:w-auto px-6 rounded-xl font-medium shadow-sm border-border/60 hover:bg-muted/50 transition-colors"
                >
                  <ArrowOutDownSquareHalf
                    size="sm"
                    className="mr-2 text-muted-foreground"
                  />
                  Importar
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-64 z-100 rounded-xl shadow-lg"
              >
                <DropdownMenuLabel className="font-semibold text-muted-foreground text-xs">
                  Opções de importação (em breve)
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  disabled
                  className="cursor-not-allowed opacity-60 flex items-center py-2.5"
                >
                  <Mobile size="sm" className="mr-2.5" />
                  <span>Contatos do Celular</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled
                  className="cursor-not-allowed opacity-60 flex items-center py-2.5"
                >
                  <Cloud size="sm" className="mr-2.5" />
                  <span>Google Contatos</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setIsImportModalOpen(true)}
                  className="flex items-center py-2.5 cursor-pointer"
                >
                  <TableIcon size="sm" className="mr-2.5 text-emerald-600" />
                  <span className="font-medium text-foreground">
                    Planilha (Excel/CSV)
                  </span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled
                  className="cursor-not-allowed opacity-60 flex items-center py-2.5"
                >
                  <File size="sm" className="mr-2.5" />
                  <span>Arquivo TXT / vCard</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              asChild
              className="h-12 w-full sm:w-auto px-8 rounded-xl font-medium shadow-sm transition-all"
            >
              <Link href="/admin/clients/new">
                <Plus className="mr-2 h-4 w-4" />
                Novo Cliente
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <Group size="sm" className="text-primary" />
            <h2 className="text-xl font-semibold text-foreground tracking-tight">
              Todos os Clientes
            </h2>
          </div>

          {isLoading ? (
            <div className="flex flex-col gap-4">
              {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0 md:rounded-md" />
                  <div className="flex flex-col gap-2 w-full">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : clients.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed border-border">
              {search.includes("**") ? (
                <Layers size="lg" className="text-muted-foreground/40" />
              ) : (
                <Group size="lg" className="text-muted-foreground/40" />
              )}
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {search.includes("**")
                  ? "Nenhum cliente com mais de um pacote ativo."
                  : search.length >= 3
                    ? "Nenhum cliente encontrado para essa busca."
                    : "Nenhum cliente cadastrado ainda."}
              </p>
              {cleanSearch.length < 3 && !hasMultiplePackagesFilter && (
                <Button
                  asChild
                  className="mt-4 rounded-full md:rounded-md"
                  size="sm"
                >
                  <Link href="/admin/clients/new">
                    <Plus className="mr-2 h-4 w-4" />
                    Cadastrar Primeiro Cliente
                  </Link>
                </Button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile */}
              <div className="flex flex-col md:hidden">
                {clients.map((client) => (
                  <ClientMobileItem
                    key={client.id}
                    client={client}
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                    onActionClick={handleActionClick}
                    onShareClick={handleSharePortal}
                  />
                ))}
              </div>

              {/* Desktop */}
              <div className="hidden md:block overflow-x-auto rounded-md border border-border">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="text-muted-foreground font-semibold">
                        Cliente
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold">
                        CPF
                      </TableHead>
                      <TableHead className="text-muted-foreground font-semibold">
                        WhatsApp
                      </TableHead>
                      <TableHead className="text-center text-muted-foreground font-semibold">
                        Pacote
                      </TableHead>
                      <TableHead className="text-center text-muted-foreground font-semibold w-32">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow
                        key={client.id}
                        onClick={() => {
                          if (client.active)
                            router.push(`/admin/clients/${client.id}`);
                        }}
                        className={cn(
                          "transition-colors",
                          client.active
                            ? "hover:bg-muted/30 cursor-pointer"
                            : "opacity-60 bg-muted/10 cursor-not-allowed grayscale-[0.2]",
                        )}
                      >
                        <TableCell className="font-medium text-foreground">
                          <div className="flex items-center gap-3">
                            <div className="relative">
                              <div
                                className={cn(
                                  "flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs border-2",
                                  client.active
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
                                )}
                              >
                                {client.name.charAt(0).toUpperCase()}
                              </div>
                              {client.active && client.hasAnamnesis && (
                                <div
                                  className="absolute -top-0.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-background z-10"
                                  title="Possui Ficha de Anamnese"
                                >
                                  <Paperclip
                                    size="xs"
                                    className="text-foreground h-3 w-3"
                                  />
                                </div>
                              )}
                            </div>
                            <span className="font-semibold">{client.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.cpf}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.phone_whatsapp}
                        </TableCell>
                        <TableCell className="text-center">
                          {client.activePackageName && client.active ? (
                            <div className="flex items-center justify-center gap-1.5">
                              <span
                                className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold max-w-62.5 truncate"
                                title={client.activePackageName}
                              >
                                {client.activePackageName.length > 28
                                  ? `${client.activePackageName.substring(0, 28)}...`
                                  : client.activePackageName}
                              </span>
                              {client.activePackagesCount &&
                              client.activePackagesCount > 1 ? (
                                <span className="inline-flex items-center px-1.5 py-1 rounded-md bg-muted border border-border text-muted-foreground text-[10px] font-bold">
                                  +{client.activePackagesCount - 1}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center items-center gap-1">
                            {/* 🔥 NOVO: Botão de Compartilhar Portal (Desktop) */}
                            {client.active && (
                              <button
                                onClick={(e) => handleSharePortal(client, e)}
                                className="p-2 rounded-full transition-all active:scale-95 text-blue-600 hover:text-blue-700 hover:bg-blue-500/10 active:bg-blue-500/20"
                                title="Compartilhar Portal com a Cliente"
                              >
                                <Share size="sm" />
                              </button>
                            )}

                            <button
                              onClick={(e) => handleActionClick(client, e)}
                              className={cn(
                                "p-2 rounded-full transition-all active:scale-95",
                                client.active
                                  ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10 active:bg-destructive/20"
                                  : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 active:bg-emerald-500/20",
                              )}
                              title={
                                !client.active
                                  ? "Reativar Cliente"
                                  : client.hasHistory
                                    ? "Desativar Cliente"
                                    : "Excluir Cliente"
                              }
                            >
                              {!client.active ? (
                                <UserCheck size="sm" />
                              ) : client.hasHistory ? (
                                <UserMinus size="sm" />
                              ) : (
                                <Trash size="sm" />
                              )}
                            </button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Paginação */}
              {totalPages > 1 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border pt-4">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
                    {`Mostrando ${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(page * ITEMS_PER_PAGE, totalClients)} de ${totalClients}`}
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage((p) => p - 1)}
                      className="text-foreground w-full sm:w-auto rounded-full md:rounded-md"
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="text-foreground w-full sm:w-auto rounded-full md:rounded-md"
                    >
                      Próximo
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <ImportClientsModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => mutate()}
      />

      <button
        onClick={scrollToTop}
        className={cn(
          "fixed bottom-20 md:bottom-8 right-4 md:right-8 p-3 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 z-50",
          showScrollTop
            ? "translate-y-0 opacity-100"
            : "translate-y-10 opacity-0 pointer-events-none",
        )}
        aria-label="Voltar ao topo"
      >
        <ChevronUp removePadding size="sm" />
      </button>

      <AlertDialog
        open={!!clientToProcess}
        onOpenChange={(open) => !open && setClientToProcess(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {!clientToProcess?.active
                ? "Reativar Cliente"
                : clientToProcess?.hasHistory
                  ? "Desativar Cliente"
                  : "Excluir Cliente"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {!clientToProcess?.active
                ? `O cliente ${clientToProcess?.name} voltará a aparecer nas listas e poderá agendar sessões novamente.`
                : clientToProcess?.hasHistory
                  ? `Tem certeza que deseja desativar o cliente ${clientToProcess.name}? Ele não aparecerá mais nas listas, mas seu histórico será mantido.`
                  : `Tem certeza que deseja excluir o cliente ${clientToProcess?.name} definitivamente? Esta ação não pode ser desfeita.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmProcess}
              className={cn(
                "text-white",
                !clientToProcess?.active
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : clientToProcess?.hasHistory
                    ? "bg-orange-600 hover:bg-orange-700"
                    : "bg-destructive hover:bg-destructive/90",
              )}
            >
              {!clientToProcess?.active
                ? "Sim, reativar"
                : clientToProcess?.hasHistory
                  ? "Sim, desativar"
                  : "Sim, excluir"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
