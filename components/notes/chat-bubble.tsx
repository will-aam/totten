"use client";

import { useState } from "react";
import { Calendar, MoveVertical, Pencil, Trash } from "@boxicons/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Novos Imports do Shadcn UI para substituir o navegador
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

export interface Note {
  id: string;
  text: string;
  date: string;
}

interface ChatBubbleProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (id: string) => void;
}

export function ChatBubble({ note, onEdit, onDelete }: ChatBubbleProps) {
  // Estados locais para controlar a abertura dos Diálogos
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Estado local para segurar o texto enquanto edita (para não alterar a bolha original no fundo)
  const [editText, setEditText] = useState(note.text);

  const formattedTime = new Intl.DateTimeFormat("pt-BR", {
    timeStyle: "short",
  }).format(new Date(note.date));

  // Função para salvar a edição finalizada
  const handleSaveEdit = () => {
    if (!editText.trim() || editText === note.text) {
      setIsEditDialogOpen(false);
      return;
    }
    onEdit({ ...note, text: editText });
    setIsEditDialogOpen(false);
  };

  // Função para confirmar a exclusão
  const handleConfirmDelete = () => {
    onDelete(note.id);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      {/* --- A BOLHA DE MENSAGEM --- */}
      <div className="flex w-full justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
        {/* Mantendo o visual tail-less (sem cauda) e alinhamento */}
        <div className="relative flex w-fit max-w-[85%] md:max-w-[75%] flex-col gap-1 rounded-2xl rounded-tl-none bg-background border border-border shadow-sm p-3 md:p-4 hover:shadow-md transition-shadow">
          <div className="flex justify-between items-start gap-3 md:gap-4">
            <p className="text-sm text-foreground whitespace-pre-wrap leading-relaxed wrap-break-word flex-1">
              {note.text}
            </p>

            {/* Menu de Ações (Sempre Visível, cor suave text-muted-foreground/50) */}
            <DropdownMenu>
              <DropdownMenuTrigger className="p-1.5 -mt-1 -mr-2 shrink-0 rounded-full text-muted-foreground/50 hover:text-foreground hover:bg-muted outline-none transition-colors data-[state=open]:text-foreground data-[state=open]:bg-muted">
                <MoveVertical className="h-4 w-4" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem
                  onClick={() => {
                    setEditText(note.text); // Preenche o textarea com o texto atual
                    setIsEditDialogOpen(true); // Abre o modal
                  }}
                  className="cursor-pointer"
                >
                  <Pencil className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => setIsDeleteDialogOpen(true)} // Abre o modal de confirmação
                  className="text-destructive focus:bg-destructive/10 focus:text-destructive cursor-pointer"
                >
                  <Trash className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center justify-end gap-1.5 mt-0.5 opacity-60">
            <Calendar className="h-3 w-3" />
            <span className="text-[10px] md:text-xs font-medium">
              {formattedTime}
            </span>
          </div>
        </div>
      </div>

      {/* --- 1. DIÁLOGO DE EDIÇÃO (MODAL) --- */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-125 w-[95%] rounded-2xl md:rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-lg">
              Editar Anotação Interna
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              Faça as alterações necessárias no texto abaixo.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label
                htmlFor={`noteText-${note.id}`}
                className="text-sm font-medium"
              >
                Anotação
              </Label>
              <Textarea
                id={`noteText-${note.id}`}
                name={`noteText-${note.id}`}
                value={editText}
                onChange={(e) => setEditText(e.target.value)}
                placeholder="Digite sua anotação..."
                className="min-h-30 resize-none"
              />
            </div>
          </div>
          <DialogFooter className="flex-row justify-end gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setIsEditDialogOpen(false)}
              className="rounded-full md:rounded-md"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveEdit}
              disabled={!editText.trim() || editText === note.text}
              className="rounded-full md:rounded-md"
            >
              Salvar Alterações
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* --- 2. DIÁLOGO DE CONFIRMAÇÃO DE EXCLUSÃO (ALERT DIALOG) --- */}
      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
      >
        <AlertDialogContent className="w-[95%] rounded-2xl md:rounded-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg text-foreground">
              Excluir Anotação?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-sm text-muted-foreground pt-1">
              Tem certeza que deseja apagar esta anotação interna? Esta ação não
              poderá ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row justify-end gap-2 pt-4">
            <AlertDialogCancel className="rounded-full md:rounded-md mt-0">
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full md:rounded-md"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
