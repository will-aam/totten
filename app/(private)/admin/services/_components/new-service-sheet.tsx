import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ServiceForm } from "./service-form";

interface NewServiceSheetProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function NewServiceSheet({ isOpen, onClose, onSuccess }: NewServiceSheetProps) {
  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="w-full sm:max-w-2xl flex flex-col p-0 gap-0 border-none shadow-2xl bg-background overflow-y-auto">
        <SheetHeader className="p-6 sm:p-8 pb-4 sm:pb-6 border-b border-border/40">
          <SheetTitle className="text-xl sm:text-2xl font-black text-foreground leading-tight">
            Cadastrar Serviço
          </SheetTitle>
          <SheetDescription className="text-xs sm:text-sm font-bold text-muted-foreground uppercase tracking-tight">
            Configure as informações do seu novo serviço.
          </SheetDescription>
        </SheetHeader>

        <div className="p-4 sm:p-8">
          <ServiceForm onSuccess={onSuccess} onCancel={onClose} />
        </div>
      </SheetContent>
    </Sheet>
  );
}
