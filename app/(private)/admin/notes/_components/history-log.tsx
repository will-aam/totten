"use client";

import { Calendar, History } from "@boxicons/react";
import { cn } from "@/lib/utils";

export interface Note {
  id: string;
  text: string;
  date: string;
}

interface HistoryLogProps {
  note: Note;
}

export function HistoryLog({ note }: HistoryLogProps) {
  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
  }).format(new Date(note.date));

  // Simples heurística para ver se é uma ação do sistema
  const isSystemAction = note.text.startsWith("Ação:");

  return (
    <div className="flex w-full justify-start relative animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* Indicador de linha do tempo (timeline marker) */}
      <div className="absolute left-4 top-4 h-4 w-4 rounded-full border-2 border-background bg-muted-foreground/30 shadow-sm z-10 hidden md:block"></div>

      <div className="relative flex w-full md:ml-12 flex-col gap-1 rounded-lg bg-background border border-border shadow-sm p-3 md:p-4 hover:shadow-md transition-shadow">
        <div className="flex items-start gap-3">
          {/* Icon based on action type */}
          <div className="mt-0.5 shrink-0">
             {isSystemAction ? (
                <div className="bg-primary/10 text-primary p-1.5 rounded-md">
                  <History className="h-4 w-4" />
                </div>
             ) : (
                <div className="bg-muted text-muted-foreground p-1.5 rounded-md">
                  <History className="h-4 w-4" />
                </div>
             )}
          </div>

          <div className="flex flex-col flex-1 gap-1 pt-0.5">
            <p className={cn("text-sm whitespace-pre-wrap leading-relaxed break-words", isSystemAction ? "text-foreground font-medium" : "text-muted-foreground")}>
              {isSystemAction ? note.text.replace("Ação:", "").trim() : note.text}
            </p>
            
            <div className="flex items-center justify-end gap-1.5 mt-2 opacity-60">
              <Calendar className="h-3 w-3" />
              <span className="text-[10px] md:text-xs font-medium">
                {formattedTime}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
