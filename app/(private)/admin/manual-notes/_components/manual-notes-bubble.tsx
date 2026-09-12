"use client";

import { Trash } from "@boxicons/react";
import { Button } from "@/components/ui/button";

export interface ManualNote {
  id: string;
  text: string;
  date: string;
}

interface ManualNotesBubbleProps {
  note: ManualNote;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function ManualNotesBubble({ note, onDelete, isDeleting }: ManualNotesBubbleProps) {
  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
  }).format(new Date(note.date));

  return (
    <div className="flex w-full justify-end relative animate-in fade-in slide-in-from-bottom-2 duration-300 group">
      <div className="relative flex max-w-[85%] md:max-w-[70%] flex-col gap-1 rounded-2xl rounded-tr-sm bg-primary/10 text-primary-foreground border border-primary/20 shadow-sm p-3 md:p-4">
        
        <p className="text-sm whitespace-pre-wrap leading-relaxed break-words text-foreground font-medium">
          {note.text}
        </p>

        <div className="flex items-center justify-end gap-2 mt-1">
          <span className="text-[10px] md:text-xs font-medium text-foreground/60">
            {formattedTime}
          </span>
        </div>
      </div>
      
      {/* Delete button appears on hover (desktop) or always (mobile) */}
      <div className="absolute top-2 -left-10 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={() => onDelete(note.id)}
          disabled={isDeleting}
        >
          <Trash className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
