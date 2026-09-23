// app/admin/clients/new/page.tsx
import Link from "next/link";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "@boxicons/react";
import { ClientForm } from "../_components/client-form";

export default function NewClientPage() {
  return (
    <>
      <AdminHeader title="Novo Cliente" />

      <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-400 mx-auto w-full pb-24 md:pb-6">
        <div className="flex flex-row items-center gap-4 border-b border-border/50 pb-4 md:pb-6">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="h-9 w-9 shrink-0"
          >
            <Link href="/admin/clients">
              <ChevronLeft
                removePadding
                className="h-9 w-9 text-muted-foreground scale-120"
              />
            </Link>
          </Button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-xl md:text-2xl font-bold tracking-tight text-foreground leading-tight truncate">
              Cadastrar Cliente
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5 hidden sm:block">
              Crie uma ficha básica ou preencha as opções avançadas.
            </p>
          </div>
        </div>

        <ClientForm />
      </div>
    </>
  );
}

