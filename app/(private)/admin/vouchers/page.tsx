// app/(private)/admin/vouchers/page.tsx
"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { apiClient } from "@/lib/api-client";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PackageVoucher } from "@/app/(private)/admin/clients/_components/package-voucher";
import {
  Search,
  MedalStarAlt,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
} from "@boxicons/react";
import { useDebounce } from "@/hooks/use-debounce";

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
  sessionDates?: string[]; // Mapeado no passo anterior
};

type VouchersResponse = {
  data: CompletedPackage[];
  total: number;
  page: number;
  totalPages: number;
};

export default function VouchersPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 500); // Aguarda 500ms após parar de digitar

  const [voucherOpen, setVoucherOpen] = useState(false);
  const [selectedVoucher, setSelectedVoucher] =
    useState<CompletedPackage | null>(null);

  // Se a busca mudar, voltamos para a página 1 automaticamente
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch]);

  // Montamos a URL inteligente para o SWR
  const query = new URLSearchParams({
    page: page.toString(),
    limit: "15",
  });

  //  REGRA DE OURO: Só envia o parâmetro de busca se tiver 3 caracteres ou mais.
  // Se tiver 1 ou 2 caracteres, ignora a busca (evita consultas muito pesadas/amplas no banco)
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

      {/* PADRÃO DE LARGURA: max-w-400, reduzimos o padding lateral em mobile */}
      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-12 relative animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        {/* Cabeçalho e Busca - Responsivo com flex-col-reverse no mobile */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-border/40 pb-6">
          <div className="flex flex-col">
            {/*  Reduzimos o tamanho do título e descrição no mobile */}
            <h1 className="text-xl md:text-2xl font-black tracking-tight text-foreground">
              Vouchers Emitidos
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
              //  Reduzimos a altura do input no mobile
              className="pl-10 bg-card border-border/50 rounded-2xl h-11 md:h-12 shadow-sm font-medium focus-visible:ring-primary/20 text-sm"
            />
          </div>
        </div>

        {/* Título de Seção - Ajustado para alinhar perfeitamente */}
        <div className="flex items-center justify-between pt-1 pb-1">
          {/*  Reduzimos o tamanho da fonte e ícone do título no mobile */}
          <h2 className="text-lg md:text-xl font-black text-foreground flex items-center gap-1.5 whitespace-nowrap">
            <MedalStarAlt className="h-5 w-5 md:h-6 md:w-6 text-primary" />
            Prontos para Envio
          </h2>
          {!isLoading && (
            //  AJUSTE CRÍTICO: whitespace-nowrap para evitar quebra de texto, texto e padding menores
            <span className="text-[10px] md:text-[11px] font-bold bg-muted/60 text-muted-foreground px-2.5 py-1.5 rounded-full uppercase tracking-wide whitespace-nowrap leading-none shrink-0">
              {total} {total === 1 ? "Comprovante" : "Comprovantes"}
            </span>
          )}
        </div>

        {/* Área da Lista */}
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
                  <Skeleton className="h-9 w-28 md:h-10 md:w-32 rounded-xl shrink-0 bg-muted/50 hidden md:block" />
                </div>
              ))}
            </div>
          ) : vouchers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center bg-card rounded-4xl border border-dashed border-border/60 shadow-sm mt-1 p-5">
              <div className="h-14 w-14 bg-muted rounded-full flex items-center justify-center mb-3.5">
                <MedalStarAlt className="h-7 w-7 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-bold text-foreground">
                {search.length >= 3
                  ? "Nenhum voucher encontrado"
                  : "Nenhum pacote concluído"}
              </h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground max-w-sm px-4">
                {search.length >= 3
                  ? "Tente buscar por outro nome de cliente ou nome de pacote."
                  : "Quando um cliente concluir todas as sessões do pacote, o voucher aparecerá aqui."}
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5">
              {vouchers.map((item, index) => (
                <div
                  key={item.id}
                  //  Reduzimos padding e gap no mobile
                  className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 md:p-5 bg-card rounded-2xl md:rounded-3xl border border-border/50 shadow-sm hover:border-primary/40 hover:shadow-md transition-all gap-3 animate-in slide-in-from-bottom-2"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Info do Cliente */}
                  <div className="flex items-start gap-3.5 w-full sm:w-auto">
                    <div className="flex flex-col w-full">
                      {/*  Reduzimos fonte do nome do cliente */}
                      <span className="font-black text-foreground text-sm md:text-base leading-tight">
                        {item.clientName}
                      </span>
                      {/*  Reduzimos fonte do pacote */}
                      <span className="text-xs md:text-sm font-medium text-muted-foreground mt-0.5 leading-tight">
                        {item.packageName} • {item.totalSessions} Sessões
                      </span>
                      {item.hasVoucher && (
                        //  Reduzimos badge de já emitido e adicionamos whitespace-nowrap
                        <Badge
                          variant="outline"
                          className="mt-1.5 w-fit text-[9px] md:text-[10px] font-bold uppercase tracking-wide bg-emerald-500/10 text-emerald-600 border-emerald-500/20 px-2.5 py-1 whitespace-nowrap"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Voucher já emitido
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Data e Botão de Ação */}
                  {/*  Reduzimos gap e pt no mobile */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-0 border-border/40 shrink-0">
                    {/*  Reduzimos badge da data e adicionamos whitespace-nowrap para garantir linha única */}
                    <span className="text-[10px] md:text-[11px] font-bold uppercase tracking-wide text-muted-foreground px-3 py-1.5 bg-muted/50 rounded-full whitespace-nowrap leading-none shrink-0">
                      {item.completionDate}
                    </span>

                    <Button
                      onClick={() => handleOpenVoucher(item)}
                      //  Reduzimos altura e tamanho da fonte do botão no mobile
                      className="rounded-xl md:rounded-2xl h-10 md:h-11 px-4 md:px-5 text-xs md:text-sm font-bold shadow-sm bg-primary/10 text-primary hover:bg-primary hover:text-primary-foreground active:scale-95 transition-all shrink-0"
                    >
                      <MedalStarAlt className="mr-1.5 md:mr-2 h-4 w-4" />
                      {item.hasVoucher ? "Reenviar" : "Gerar Voucher"}
                    </Button>
                  </div>
                </div>
              ))}

              {/* CONTROLES DE PAGINAÇÃO - Otimizados */}
              {totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 md:gap-4 mt-5 bg-card p-3 md:p-4 rounded-xl md:rounded-2xl border border-border/50 shadow-sm">
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center sm:text-left w-full sm:w-auto">
                    Página {page} de {totalPages}
                  </p>

                  <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      //  Reduzimos tamanho do botão de paginação
                      className="rounded-xl h-9 md:h-10 text-xs md:text-sm font-bold bg-background shadow-sm hover:bg-muted shrink-0"
                    >
                      <ChevronLeft removePadding className="h-4 w-4 mr-1" />{" "}
                      Anterior
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() =>
                        setPage((p) => Math.min(totalPages, p + 1))
                      }
                      disabled={page === totalPages}
                      className="rounded-xl h-9 md:h-10 text-xs md:text-sm font-bold bg-background shadow-sm hover:bg-muted shrink-0"
                    >
                      Próxima{" "}
                      <ChevronRight removePadding className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
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
