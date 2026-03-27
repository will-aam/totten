// app/admin/clients/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { AdminHeader } from "@/components/admin-header";
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
  Plus,
  Search,
  Users,
  ChevronRight,
  Trash2,
  UserMinus,
  UserCheck,
  ArrowUp,
} from "lucide-react";

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
import { cn } from "@/lib/utils";

type Client = {
  id: string;
  name: string;
  cpf: string;
  phone_whatsapp: string;
  activePackageName?: string | null;
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
}: {
  client: Client;
  onClick: () => void;
  onActionClick: (c: Client, e: React.MouseEvent) => void;
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
        {/* Avatar com borda azul se tiver anamnese */}
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold shadow-sm border-2",
            client.active && client.hasAnamnesis
              ? "border-blue-500 bg-none-500/10 text-blue-600"
              : client.active
                ? "bg-primary/10 text-primary border-primary/20"
                : "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
          )}
        >
          {initial}
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
      <div className="flex items-center gap-2 text-muted-foreground/50">
        {client.activePackageName && client.active && (
          <span className="text-[10px] font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-md truncate max-w-25">
            {client.activePackageName}
          </span>
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
            <UserCheck className="h-4 w-4" />
          ) : client.hasHistory ? (
            <UserMinus className="h-4 w-4" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </button>
        <ChevronRight
          className={cn("h-5 w-5 shrink-0", !client.active && "hidden")}
        />
      </div>
    </div>
  );
}

export default function AdminClientsPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 500);

  // Estado para o botão de Scroll
  const [showScrollTop, setShowScrollTop] = useState(false);

  // 🔥 OTIMIZAÇÃO: Só envia o parâmetro 'q' se a busca tiver 3 ou mais caracteres
  let apiUrl = `/api/clients?page=${page}&limit=${ITEMS_PER_PAGE}`;
  if (debouncedSearch && debouncedSearch.trim().length >= 3) {
    apiUrl += `&q=${encodeURIComponent(debouncedSearch.trim())}`;
  }

  const {
    data: apiResponse,
    isLoading,
    mutate,
  } = useSWR<ApiResponse>(apiUrl, fetcher);

  const clients = apiResponse?.data || [];
  const totalPages = apiResponse?.totalPages || 1;
  const totalClients = apiResponse?.total || 0;

  const [clientToProcess, setClientToProcess] = useState<Client | null>(null);

  // Efeito para resetar a página se a busca mudar e atingir os 3 caracteres
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Efeito para controlar a visibilidade do botão ArrowUp
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 200);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleActionClick = (client: Client, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setClientToProcess(client);
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
      } catch (error) {
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
    } catch (error) {
      toast.error(`Erro ao ${actionText} o cliente.`);
    } finally {
      setClientToProcess(null);
    }
  };

  return (
    <>
      <AdminHeader title="Clientes" />
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6 relative">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                // Não precisamos mais resetar a página aqui pois o useEffect com debouncedSearch já faz isso
              }}
              className="bg-card pl-10 text-foreground rounded-full md:rounded-md shadow-sm border-border"
            />
          </div>
          <Button
            asChild
            className="rounded-full md:rounded-md shadow-sm w-full sm:w-auto"
          >
            <Link href="/admin/clients/new">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Link>
          </Button>
        </div>

        {/* Área de Conteúdo sem Card envoltório */}
        <div className="flex flex-col gap-4">
          {/* Título da Seção */}
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
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
              <Users className="h-10 w-10 text-muted-foreground/40" />
              <p className="mt-4 text-sm font-medium text-muted-foreground">
                {search.length >= 3
                  ? "Nenhum cliente encontrado para essa busca."
                  : "Nenhum cliente cadastrado ainda."}
              </p>
              {search.length < 3 && (
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
              {/* Visualização Mobile */}
              <div className="flex flex-col md:hidden">
                {clients.map((client) => (
                  <ClientMobileItem
                    key={client.id}
                    client={client}
                    onClick={() => router.push(`/admin/clients/${client.id}`)}
                    onActionClick={handleActionClick}
                  />
                ))}
              </div>

              {/* Visualização Desktop */}
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
                        Plano / Pacote
                      </TableHead>
                      <TableHead className="text-center text-muted-foreground font-semibold w-24">
                        Ações
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clients.map((client) => (
                      <TableRow
                        key={client.id}
                        onClick={() => {
                          if (client.active) {
                            router.push(`/admin/clients/${client.id}`);
                          }
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
                            {/* Avatar com borda azul se tiver anamnese */}
                            <div
                              className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full font-bold text-xs border-2",
                                client.active && client.hasAnamnesis
                                  ? "border-blue-500 bg-blue-500/10 text-blue-600"
                                  : client.active
                                    ? "bg-primary/10 text-primary border-primary/20"
                                    : "bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20",
                              )}
                            >
                              {client.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex flex-col">
                              <span className="font-semibold">
                                {client.name}
                              </span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <span>{client.cpf}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {client.phone_whatsapp}
                        </TableCell>
                        <TableCell className="text-center">
                          {client.activePackageName && client.active ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                              {client.activePackageName}
                            </span>
                          ) : (
                            <span className="text-muted-foreground/50">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-center">
                          <button
                            onClick={(e) => handleActionClick(client, e)}
                            className={cn(
                              "inline-flex p-2 rounded-full transition-all active:scale-95",
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
                              <UserCheck className="h-5 w-5" />
                            ) : client.hasHistory ? (
                              <UserMinus className="h-5 w-5" />
                            ) : (
                              <Trash2 className="h-5 w-5" />
                            )}
                          </button>
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
                    {`Mostrando ${(page - 1) * ITEMS_PER_PAGE + 1}-${Math.min(
                      page * ITEMS_PER_PAGE,
                      totalClients,
                    )} de ${totalClients}`}
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

      {/* Botão ArrowUp */}
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
        <ArrowUp className="h-5 w-5" strokeWidth={2.5} />
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
