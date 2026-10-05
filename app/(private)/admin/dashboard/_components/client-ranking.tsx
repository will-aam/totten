// app/(private)/admin/dashboard/_components/client-ranking.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Star, Crown } from "@boxicons/react";
import Link from "next/link";

const topClients = [
  { id: "1", name: "Ana Silva", visits: 12, spent: 1850.00, rank: 1 },
  { id: "2", name: "Carlos Oliveira", visits: 9, spent: 1240.50, rank: 2 },
  { id: "3", name: "Mariana Costa", visits: 8, spent: 1100.00, rank: 3 },
  { id: "4", name: "Juliana Santos", visits: 7, spent: 950.00, rank: 4 },
  { id: "5", name: "Roberto Almeida", visits: 5, spent: 820.00, rank: 5 },
];

export function ClientRanking({ data: backendData }: { data?: { id: string, name: string, spent: number, visits?: number, rank?: number }[] }) {
  const topClientsData = backendData || topClients;

  return (
    <Card className="border-border/50 shadow-md bg-card flex flex-col w-full h-full rounded-2xl dark:border-white/10 dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] transition-all">
      <CardHeader className="py-3 px-4">
        <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
          <div className="bg-amber-500/10 p-1.5 rounded-lg text-amber-600 dark:text-amber-400">
            <Trophy size="sm" />
          </div>
          Ranking de Clientes
        </CardTitle>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto px-4 custom-scrollbar min-h-0">
          <div className="flex flex-col gap-1 pb-4">
            {topClientsData.map((client, index) => {
              const rank = client.rank ?? index + 1;
              return (
              <Link 
                key={client.id} 
                href={`/admin/clients/${client.id}`}
                className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-colors group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shrink-0
                    ${rank === 1 ? 'bg-amber-100 text-amber-600 ring-2 ring-amber-400 shadow-sm' : 
                      rank === 2 ? 'bg-slate-100 text-slate-500 ring-2 ring-slate-300' : 
                      rank === 3 ? 'bg-orange-100 text-orange-700 ring-2 ring-orange-300' : 
                      'bg-muted text-muted-foreground'}`}
                  >
                    {rank === 1 ? <Crown size="xs" /> : rank}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors truncate">
                      {client.name}
                    </span>
                    {client.visits !== undefined && (
                      <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                        {client.visits} transações
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col items-end shrink-0 ml-2">
                  <span className="text-sm font-bold text-foreground">
                    R$ {client.spent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </Link>
            )})}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
