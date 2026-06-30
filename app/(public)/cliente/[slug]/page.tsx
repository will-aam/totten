// app/(public)/cliente/[slug]/page.tsx
import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  Store,
  InfoCircle,
  Calendar,
  CheckCircle,
  Whatsapp,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

export default async function ClienteDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  if (!slug) return notFound();

  // 🔥 INTELIGÊNCIA DE ROTA: Descobre se o slug é um CPF (11 números) ou um ID do banco
  const isCpf = /^\d{11}$/.test(slug.replace(/\D/g, ""));

  // 🔥 SOLUÇÃO: Declaramos explicitamente como any[]
  let clientRecords: any[] = [];

  if (isCpf) {
    // BUSCA POR CPF
    const formattedCpf = slug.replace(
      /(\d{3})(\d{3})(\d{3})(\d{2})/,
      "$1.$2.$3-$4",
    );
    clientRecords = await prisma.client.findMany({
      where: { OR: [{ cpf: slug }, { cpf: formattedCpf }] },
      include: {
        organization: { include: { settings: true } },
        packages: {
          orderBy: { created_at: "desc" },
          include: { appointments: { orderBy: { date_time: "asc" } } },
        },
      },
    });
  } else {
    // BUSCA POR ID
    const record = await prisma.client.findUnique({
      where: { id: slug },
      include: {
        organization: { include: { settings: true } },
        packages: {
          orderBy: { created_at: "desc" },
          include: { appointments: { orderBy: { date_time: "asc" } } },
        },
      },
    });
    if (record) clientRecords = [record];
  }

  // 🔥 SOLUÇÃO: Adicionado tipo 'any' na função de map
  const allPackages = clientRecords.flatMap((record: any) => {
    const orgSettings = Array.isArray(record.organization?.settings)
      ? record.organization?.settings[0]
      : record.organization?.settings;

    const clinicPhone =
      orgSettings?.phone_whatsapp || orgSettings?.phone_landline || null;

    return (record.packages || []).map((pkg: any) => ({
      ...pkg,
      clinicName: record.organization?.name || "Clínica",
      clinicPhone: clinicPhone,
      appointments: pkg.appointments || [],
    }));
  });

  const activePackages = allPackages.filter((pkg: any) => pkg.active);
  const displayPackages =
    activePackages.length > 0 ? activePackages : allPackages.slice(0, 1);

  if (clientRecords.length === 0 || displayPackages.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-muted/40 p-4 space-y-6 text-center">
        <div className="bg-background p-8 rounded-3xl shadow-sm border max-w-md w-full flex flex-col items-center">
          <InfoCircle className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Nenhum histórico</h2>
          <p className="text-muted-foreground mb-6">
            Não encontramos pacotes ou sessões para este registro.
          </p>
          <Link href="/cliente" className="w-full">
            <button className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl">
              Voltar
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const fullName = clientRecords[0].name.split(" ");
  const maskedName =
    fullName.length > 1
      ? `${fullName[0]} ***`
      : `${fullName[0].substring(0, 3)}***`;

  let whatsappLink = "";
  const rawPhone = allPackages[0]?.clinicPhone;

  if (rawPhone) {
    let whatsappNumber = rawPhone.replace(/\D/g, "");
    if (whatsappNumber.length === 10 || whatsappNumber.length === 11) {
      whatsappNumber = `55${whatsappNumber}`;
    }
    whatsappLink = `https://wa.me/${whatsappNumber}?text=Olá! Estava acessando meu portal e gostaria de tirar uma dúvida sobre minhas sessões.`;
  }

  return (
    <div className="min-h-screen bg-muted/30 pb-24 relative">
      <header className="bg-background/95 backdrop-blur-sm border-b sticky top-0 z-50 px-4 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <Link
            href="/cliente"
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-muted-foreground" />
          </Link>
          <div>
            <h1 className="font-black text-xl tracking-tight">
              Olá, {maskedName}
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Seus pacotes atuais
            </p>
          </div>
        </div>

        {whatsappLink && (
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500/10 text-emerald-600 p-2 rounded-full hover:bg-emerald-500/20 transition-colors"
          >
            <Whatsapp className="h-6 w-6" />
          </a>
        )}
      </header>

      <main className="max-w-2xl mx-auto p-4 space-y-8 mt-4">
        <div className="space-y-10">
          {displayPackages.map((pkg: any) => {
            const progress = Math.min(
              100,
              Math.round((pkg.used_sessions / pkg.total_sessions) * 100),
            );

            return (
              <section key={pkg.id} className="space-y-4">
                <div
                  className={cn(
                    "bg-background border border-border/50 p-6 rounded-4xl shadow-sm",
                    !pkg.active && "opacity-60 grayscale",
                  )}
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-black text-lg leading-tight uppercase tracking-tight text-foreground">
                        {pkg.name}
                      </h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Store className="h-3 w-3" /> {pkg.clinicName}
                      </p>
                    </div>
                  </div>

                  <div className="bg-muted/30 p-4 rounded-3xl mt-4 border border-border/40">
                    <div className="flex justify-between items-end mb-3 px-1">
                      <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                        Sessões Realizadas
                      </span>
                      <span className="text-2xl font-black text-primary">
                        {pkg.used_sessions}{" "}
                        <span className="text-sm text-muted-foreground font-normal">
                          / {pkg.total_sessions}
                        </span>
                      </span>
                    </div>
                    <Progress
                      value={progress}
                      className="h-2.5 bg-muted rounded-full overflow-hidden"
                    />
                  </div>
                </div>

                <div className="px-2">
                  <h3 className="font-black text-xs uppercase tracking-widest flex items-center gap-2 text-muted-foreground mb-6 ml-1">
                    <Calendar className="h-4 w-4" /> Suas Sessões
                  </h3>

                  {pkg.appointments.length > 0 ? (
                    <div className="relative space-y-10 before:absolute before:inset-0 before:left-4.75 before:h-[95%] before:w-0.5 before:bg-border/60 pt-2 ml-1">
                      {pkg.appointments.map((item: any, index: number) => {
                        const isRealizado = item.status === "REALIZADO";
                        const isCancelado = item.status === "CANCELADO";
                        const isFalta =
                          isCancelado && item.observations?.includes("Falta");

                        return (
                          <div
                            key={item.id}
                            className="relative flex items-start group"
                          >
                            <div
                              className={cn(
                                "absolute left-0 w-10 h-10 rounded-2xl border-4 border-background flex items-center justify-center z-10 transition-all shadow-sm",
                                isRealizado
                                  ? "bg-primary text-primary-foreground"
                                  : isFalta
                                    ? "bg-destructive text-white"
                                    : "bg-muted text-muted-foreground",
                              )}
                            >
                              {isRealizado ? (
                                <CheckCircle className="h-5 w-5" />
                              ) : (
                                <span className="text-[11px] font-black">
                                  {index + 1}
                                </span>
                              )}
                            </div>

                            <div className="ml-14 flex flex-col gap-1 w-full pr-2 pt-1">
                              <div className="flex items-center justify-between">
                                <span
                                  className={cn(
                                    "font-black text-sm uppercase tracking-tight text-foreground",
                                    !pkg.active &&
                                      !isRealizado &&
                                      "line-through text-muted-foreground",
                                  )}
                                >
                                  Sessão {index + 1}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground font-medium flex items-center gap-2">
                                {item.date_time
                                  ? new Intl.DateTimeFormat("pt-BR", {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }).format(item.date_time)
                                  : "Aguardando Agendamento"}

                                {isRealizado && (
                                  <span className="text-[9px] font-bold uppercase text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                    Realizada
                                  </span>
                                )}
                                {isFalta && (
                                  <span className="text-[9px] font-bold uppercase text-destructive bg-destructive/10 px-1.5 py-0.5 rounded">
                                    Faltou
                                  </span>
                                )}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="py-12 text-center border-2 border-dashed border-muted rounded-4xl">
                      <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                        Aguardando primeiro agendamento
                      </p>
                    </div>
                  )}
                </div>
              </section>
            );
          })}
        </div>
      </main>

      {whatsappLink && (
        <div className="fixed bottom-6 left-0 right-0 flex justify-center z-50 pointer-events-none">
          <a
            href={whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="pointer-events-auto bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center gap-2 transition-transform hover:scale-105 active:scale-95"
          >
            <Whatsapp className="h-5 w-5" />
            Falar com a Clínica
          </a>
        </div>
      )}
    </div>
  );
}
