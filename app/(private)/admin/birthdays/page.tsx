"use client";

import { useState, useMemo, useEffect } from "react";
import useSWR from "swr";
import {
  format,
  isThisMonth,
  isThisWeek,
  addMonths,
  subMonths,
  isSameMonth,
  startOfDay,
  isBefore,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Gift, Whatsapp, LoaderDots } from "@boxicons/react";
import { AdminHeader } from "@/components/admin-header";
import Link from "next/link";
import { cn } from "@/lib/utils";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function BirthdaysPage() {
  const { data: clients, isLoading } = useSWR("/api/birthdays", fetcher);
  const [messageTemplate, setMessageTemplate] = useState("");

  useEffect(() => {
    const saved = localStorage.getItem("totten_birthday_msg");
    if (saved) {
      setMessageTemplate(saved);
    } else {
      setMessageTemplate(
        "Olá {nome}! 🎉 Passando para te desejar um Feliz Aniversário! Que seu novo ciclo seja repleto de alegrias e muito bem-estar. Um abraço com carinho de toda a nossa equipe! 🥰",
      );
    }
  }, []);

  const handleSaveMessage = (value: string) => {
    setMessageTemplate(value);
    localStorage.setItem("totten_birthday_msg", value);
  };

  const { lastMonth, thisWeek, thisMonth, nextMonth, upcoming } =
    useMemo(() => {
      if (!clients || !Array.isArray(clients)) {
        return {
          lastMonth: [],
          thisWeek: [],
          thisMonth: [],
          nextMonth: [],
          upcoming: [],
        };
      }

      const today = startOfDay(new Date());
      const currentYear = today.getFullYear();
      const targetNextMonth = addMonths(today, 1);
      const targetLastMonth = subMonths(today, 1);

      const processed = clients.map((client: any) => {
        const dateStr = client.birth_date.split("T")[0];
        const [, bMonth, bDay] = dateStr.split("-");

        const normalizedDate = new Date(
          currentYear,
          parseInt(bMonth) - 1,
          parseInt(bDay),
        );

        let nextBirthday = new Date(normalizedDate);
        if (isBefore(normalizedDate, today) && !isThisMonth(normalizedDate)) {
          nextBirthday.setFullYear(currentYear + 1);
        }

        return {
          ...client,
          normalizedDate,
          nextBirthday,
          formattedDate: format(normalizedDate, "dd 'de' MMMM", {
            locale: ptBR,
          }),
        };
      });

      const sortedByUpcoming = [...processed].sort(
        (a, b) => a.nextBirthday.getTime() - b.nextBirthday.getTime(),
      );

      const lastMonth = processed
        .filter((c) => isSameMonth(c.normalizedDate, targetLastMonth))
        .sort(
          (a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime(),
        );

      const thisWeek = processed
        .filter((c) => isThisWeek(c.normalizedDate, { weekStartsOn: 0 }))
        .sort(
          (a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime(),
        );

      const thisMonth = processed
        .filter((c) => isThisMonth(c.normalizedDate))
        .sort(
          (a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime(),
        );

      const nextMonth = processed
        .filter((c) => isSameMonth(c.normalizedDate, targetNextMonth))
        .sort(
          (a, b) => a.normalizedDate.getTime() - b.normalizedDate.getTime(),
        );

      const upcoming = sortedByUpcoming.slice(0, 15);

      return { lastMonth, thisWeek, thisMonth, nextMonth, upcoming };
    }, [clients]);

  const handleWhatsApp = (e: React.MouseEvent, client: any) => {
    e.preventDefault();

    if (!client.phone_whatsapp) {
      toast.error("Este cliente não possui WhatsApp cadastrado.");
      return;
    }

    const firstName = client.name.split(" ")[0];
    const finalMessage = messageTemplate.replace(/{nome}/g, firstName);
    const phone = client.phone_whatsapp.replace(/\D/g, "");

    //  Agora usando a API direta do WhatsApp igual à página de Lembretes!
    window.open(
      `https://api.whatsapp.com/send?phone=55${phone}&text=${encodeURIComponent(
        finalMessage,
      )}`,
      "_blank",
    );
  };
  const renderClientList = (list: any[], emptyText: string) => {
    if (list.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/30 rounded-lg border border-dashed border-border mt-4">
          <Gift className="h-8 w-8 text-muted-foreground/40 mb-3" />
          <p className="text-sm font-medium text-muted-foreground">
            {emptyText}
          </p>
        </div>
      );
    }

    return (
      <div className="flex flex-col mt-2">
        {list.map((client) => {
          const initial = client.name
            ? client.name.charAt(0).toUpperCase()
            : "?";

          return (
            <Link
              key={client.id}
              href={`/admin/clients/${client.id}`}
              className="flex items-center justify-between py-3 md:py-4 border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors px-2 -mx-2 rounded-lg group"
            >
              <div className="flex items-center gap-3 md:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold shadow-sm border border-primary/20 transition-transform group-hover:scale-105">
                  {initial}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-foreground leading-none mb-1.5 group-hover:text-primary group-hover:underline transition-colors">
                    {client.name}
                  </span>
                  <span className="text-xs text-muted-foreground leading-none">
                    {client.formattedDate}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={(e) => handleWhatsApp(e, client)}
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-full bg-green-50 text-green-600 hover:bg-green-500 hover:text-white transition-colors"
                  title="Enviar WhatsApp"
                >
                  <Whatsapp className="h-4 w-4" />
                </Button>
              </div>
            </Link>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <AdminHeader title="Aniversariantes" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6">
        <div className="flex flex-col gap-2 bg-muted/10 p-4 rounded-xl border border-border/50">
          <Label className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Gift className="text-primary" />
            Mensagem Automática
          </Label>
          <Textarea
            rows={3}
            value={messageTemplate}
            onChange={(e) => handleSaveMessage(e.target.value)}
            className="resize-none bg-background focus-visible:ring-primary/50 text-sm leading-relaxed border-border/50 mt-1"
            placeholder="Digite a mensagem de feliz aniversário..."
          />
          <p className="text-[11px] text-muted-foreground uppercase tracking-wider">
            Use <code className="text-primary lowercase">{"{nome}"}</code> para
            citar o cliente. Salva automaticamente.
          </p>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoaderDots className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="month" className="w-full">
            <TabsList className="flex w-full overflow-x-auto bg-transparent border-b border-border/50 rounded-none p-0 h-auto gap-2 md:gap-4 justify-start [&::-webkit-scrollbar]:hidden">
              <TabsTrigger
                value="last"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
                  "rounded-none px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap",
                )}
              >
                Mês Passado
              </TabsTrigger>
              <TabsTrigger
                value="week"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
                  "rounded-none px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap",
                )}
              >
                Esta Semana
              </TabsTrigger>
              <TabsTrigger
                value="month"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
                  "rounded-none px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap",
                )}
              >
                Este Mês
              </TabsTrigger>
              <TabsTrigger
                value="next"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
                  "rounded-none px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap",
                )}
              >
                Próximo Mês
              </TabsTrigger>
              <TabsTrigger
                value="upcoming"
                className={cn(
                  "data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary data-[state=active]:shadow-none",
                  "rounded-none px-1 py-3 text-sm font-medium text-muted-foreground data-[state=active]:text-foreground whitespace-nowrap",
                )}
              >
                Próximos
              </TabsTrigger>
            </TabsList>

            <TabsContent
              value="last"
              className="m-0 pt-2 focus-visible:outline-none"
            >
              {renderClientList(
                lastMonth,
                "Nenhum aniversário no mês passado.",
              )}
            </TabsContent>
            <TabsContent
              value="week"
              className="m-0 pt-2 focus-visible:outline-none"
            >
              {renderClientList(thisWeek, "Nenhum aniversário nesta semana.")}
            </TabsContent>
            <TabsContent
              value="month"
              className="m-0 pt-2 focus-visible:outline-none"
            >
              {renderClientList(thisMonth, "Nenhum aniversário neste mês.")}
            </TabsContent>
            <TabsContent
              value="next"
              className="m-0 pt-2 focus-visible:outline-none"
            >
              {renderClientList(
                nextMonth,
                "Nenhum aniversário no próximo mês.",
              )}
            </TabsContent>
            <TabsContent
              value="upcoming"
              className="m-0 pt-2 focus-visible:outline-none"
            >
              {renderClientList(
                upcoming,
                "Nenhum cliente com data de nascimento cadastrada.",
              )}
            </TabsContent>
          </Tabs>
        )}
      </div>
    </>
  );
}
