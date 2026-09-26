// app/(private)/admin/vouchers/page.tsx
"use client";

import { useState, useEffect, Suspense } from "react";
import useSWR from "swr";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { apiClient } from "@/lib/api-client";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageVoucher } from "@/app/(private)/admin/clients/_components/package-voucher";
import {
  Search,
  CheckCircle,
} from "@boxicons/react";
import { useDebounce } from "@/hooks/use-debounce";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
type CompletedPackage = {
  id: string;
  clientId: string;
  clientName: string;
  packageName: string;
  serviceName: string;
  totalSessions: number;
  completionDate: string;
  hasVoucher: boolean;
  lastVoucherDate?: Date;
  sessionDates?: string[];
};

type VouchersResponse = {
  data: CompletedPackage[];
  total: number;
  page: number;
  totalPages: number;
};

export default function AdminVouchersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col gap-4 p-4 md:p-6 w-full max-w-400 mx-auto mt-10">
          <Skeleton className="h-10 w-full rounded-2xl" />
          <Skeleton className="h-[400px] w-full rounded-2xl" />
        </div>
      }
    >
      <AdminVouchersPageContent />
    </Suspense>
  );
}

function AdminVouchersPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const pageParam = searchParams.get("page");
  const page = pageParam ? parseInt(pageParam, 10) : 1;

  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500);

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] =
    useState<CompletedPackage | null>(null);

  const createPageUrl = (pageNumber: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", pageNumber.toString());
    return `${pathname}?${params.toString()}`;
  };

  const setPage = (newPage: number) => {
    router.push(createPageUrl(newPage), { scroll: false });
  };

  useEffect(() => {
    if (page !== 1) setPage(1);
  }, [debouncedSearch]);

  const query = new URLSearchParams({
    page: page.toString(),
    limit: "10",
  });

  if (debouncedSearch && debouncedSearch.trim().length >= 3) {
    query.append("q", debouncedSearch.trim());
  }

  const { data: response, isLoading } = useSWR<VouchersResponse>(
    `vouchers?${query.toString()}`,
    apiClient,
  );

  const vouchers = response?.data || [];
  const total = response?.total || 0;
  const totalPages = response?.totalPages || 1;

  const handleOpenVoucher = (voucherData: CompletedPackage) => {
    setSelectedVoucher(voucherData);
    setVoucherOpen(true);
  };

  return (
    <>
      <AdminHeader title="Central de Comprovantes" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex flex-col">
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Comprovantes Emitidos
            </h1>
            <p className="text-xs md:text-sm font-medium text-muted-foreground mt-0.5">
              Gere e compartilhe os comprovantes de pacotes concluídos.
            </p>
          </div>

          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente (mín. 3 letras)..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-full bg-card border-border/50 h-11 md:h-12 shadow-sm font-medium focus-visible:ring-primary/20 text-sm"
            />
          </div>
        </div>

        <div className="flex items-center justify-between pt-1 pb-1">
          <h2 className="text-lg md:text-xl font-black text-foreground flex items-center gap-1.5 whitespace-nowrap">
            Prontos para Envio
          </h2>
          {!isLoading && (
            <span className="text-[10px] md:text-[11px] font-bold bg-muted/60 text-muted-foreground px-2.5 py-1.5 rounded-full uppercase tracking-wide whitespace-nowrap leading-none shrink-0">
              {total} {total === 1 ? "Comprovante" : "Comprovantes"}
            </span>
          )}
        </div>

        <div>
          {isLoading ? (
            <div className="flex flex-col gap-3 bg-card p-4 md:p-6 rounded-3xl border border-border/50 shadow-sm">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-2xl shrink-0 bg-muted/50" />
                  <div className="flex flex-col gap-1.5 w-full">
                    <Skeleton className="h-4 w-40 md:w-48 bg-muted/50" />
                    <Skeleton className="h-3 w-24 md:w-32 bg-muted/50" />
                  </div>
                  <Skeleton className="h-9 w-28 md:h-10 md:w-32 rounded-full shrink-0 bg-muted/50 hidden md:block" />
                </div>
              ))}
            </div>
          ) : vouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-4xl border border-dashed border-border/60 shadow-sm mt-1 p-5">
              <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mb-3.5">
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {search.length >= 3
                  ? "Nenhum comprovante encontrado"
                  : "Nenhum pacote concluído"}
              </h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground max-w-sm px-4">
                {search.length >= 3
                  ? "Tente buscar por outro nome de cliente ou nome de pacote."
                  : "Quando um cliente concluir todas as sessões do pacote, o comprovante aparecerá aqui."}
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {/* MOBILE LAYOUT (Cards) */}
              <div className="grid gap-3 md:hidden">
                {vouchers.map((item, index) => (
                  <div
                    key={item.id}
                    className="group flex flex-col justify-between p-4 bg-card rounded-2xl border border-border/50 shadow-sm gap-3 animate-in slide-in-from-bottom-2"
                    style={{ animationDelay: `${index * 40}ms` }}
                  >
                    <div className="flex flex-col w-full">
                      <span className="font-black text-foreground text-sm leading-tight">
                        {item.clientName}
                      </span>
                      <span className="text-xs font-medium text-muted-foreground mt-0.5 leading-tight">
                        {item.packageName} • {item.totalSessions} Sessões
                      </span>

                      {item.hasVoucher && (
                        <Badge
                          variant="outline"
                          className="mt-2 w-fit text-[9px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2.5 py-1 whitespace-nowrap"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Comprovante já emitido
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between w-full mt-2 pt-3 border-t border-border/40 shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full whitespace-nowrap leading-none shrink-0">
                        {item.completionDate}
                      </span>

                      <Button
                        onClick={() => handleOpenVoucher(item)}
                        className="h-10 px-4 text-xs font-bold shadow-sm bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all shrink-0 rounded-full"
                      >
                        {item.hasVoucher ? "Reenviar" : "Gerar Comprovante"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* DESKTOP LAYOUT (Tabela) */}
              <div className="hidden md:block border border-border/50 rounded-2xl bg-card overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30 hover:bg-muted/30 border-b-border/50">
                      <TableHead className="font-semibold text-foreground h-12 w-12 text-center">#</TableHead>
                      <TableHead className="font-semibold text-foreground h-12">Cliente</TableHead>
                      <TableHead className="font-semibold text-foreground h-12">Pacote</TableHead>
                      <TableHead className="font-semibold text-foreground h-12">Data de Conclusão</TableHead>
                      <TableHead className="font-semibold text-foreground h-12">Status</TableHead>
                      <TableHead className="text-right font-semibold text-foreground h-12">Ação</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {vouchers.map((item, index) => (
                      <TableRow
                        key={item.id}
                        className="group hover:bg-muted/20 transition-colors border-b-border/50 animate-in slide-in-from-bottom-2"
                        style={{ animationDelay: `${index * 40}ms` }}
                      >
                        <TableCell className="text-center font-medium text-muted-foreground align-middle">
                          {(page - 1) * 10 + index + 1}
                        </TableCell>
                        <TableCell className="font-bold text-foreground align-middle">
                          {item.clientName}
                        </TableCell>
                        <TableCell className="align-middle">
                          <span className="font-medium text-foreground">{item.packageName}</span>
                          <span className="text-muted-foreground text-xs block mt-0.5">{item.totalSessions} Sessões</span>
                        </TableCell>
                        <TableCell className="text-muted-foreground font-medium text-sm align-middle">
                          {item.completionDate}
                        </TableCell>
                        <TableCell className="align-middle">
                          {item.hasVoucher ? (
                            <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/20 gap-1 rounded-full whitespace-nowrap font-bold">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Emitido
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20 rounded-full whitespace-nowrap font-bold">
                              Disponível
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right align-middle">
                          <Button
                            onClick={() => handleOpenVoucher(item)}
                            className="h-9 px-5 text-xs font-bold shadow-sm bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all shrink-0 rounded-full"
                          >
                            {item.hasVoucher ? "Reenviar" : "Gerar Comprovante"}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {totalPages > 1 && (
                <div className="mt-8">
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href={page > 1 ? createPageUrl(page - 1) : "#"}
                          className={
                            page === 1 ? "pointer-events-none opacity-50" : ""
                          }
                        />
                      </PaginationItem>

                      {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                        (p) => {
                          if (
                            p === 1 ||
                            p === totalPages ||
                            (p >= page - 1 && p <= page + 1)
                          ) {
                            return (
                              <PaginationItem key={p}>
                                <PaginationLink
                                  href={createPageUrl(p)}
                                  isActive={page === p}
                                >
                                  {p}
                                </PaginationLink>
                              </PaginationItem>
                            );
                          }

                          if (p === page - 2 || p === page + 2) {
                            return (
                              <PaginationItem key={p}>
                                <PaginationEllipsis />
                              </PaginationItem>
                            );
                          }
                          return null;
                        },
                      )}

                      <PaginationItem>
                        <PaginationNext
                          href={
                            page < totalPages ? createPageUrl(page + 1) : "#"
                          }
                          className={
                            page === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL DO COMPROVANTE */}
      {selectedVoucher && (
        <PackageVoucher
          open={voucherOpen}
          onOpenChange={setVoucherOpen}
          packageId={selectedVoucher.id}
          clientName={selectedVoucher.clientName}
          packageName={selectedVoucher.packageName}
          totalSessions={selectedVoucher.totalSessions}
          sessionDates={selectedVoucher.sessionDates || []} // Mapeado no passo anterior
        />
      )}
    </>
  );
}
