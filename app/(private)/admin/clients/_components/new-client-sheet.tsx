import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ClientForm } from "./client-form";

interface NewClientSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewClientSheet({ isOpen, onClose, onSuccess }: NewClientSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-xl flex flex-col p-0 gap-0 border-none shadow-2xl bg-background overflow-y-auto">
        <SheetHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-border/40">
          <SheetTitle className="text-xl sm:text-2xl font-black text-foreground leading-tight">
            Cadastrar Cliente
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-tight">
            Crie uma ficha básica ou preencha as opções avançadas.
          </SheetDescription>
        </SheetHeader>
        
        <div className="p-4 sm:p-8">
          <ClientForm onSuccess={onSuccess} onCancel={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
