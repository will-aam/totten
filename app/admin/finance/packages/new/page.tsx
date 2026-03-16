// app/admin/packages/new/page.tsx
import Link from "next/link";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PackageForm } from "@/components/packages/package-form";

export default function NewPackagePage() {
  return (
    <>
      <AdminHeader title="Novo Pacote" />

      <div className="flex flex-col gap-4 md:gap-6 p-4 md:p-6 max-w-4xl mx-auto w-full pb-24 md:pb-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 border-b border-border/50 pb-4 md:pb-6">
          <Button
            asChild
            variant="outline"
            size="icon"
            className="rounded-full h-10 w-10 shrink-0"
          >
            {/* O botão voltar aponta para a aba de pacotes */}
            <Link href="/admin/services?tab=packages">
              <ArrowLeft className="h-5 w-5 text-muted-foreground" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Cadastrar Pacote
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Monte um plano com múltiplas sessões para vender.
            </p>
          </div>
        </div>

        {/* COMPONENTE DO FORMULÁRIO INJETADO AQUI */}
        <PackageForm />
      </div>
    </>
  );
}
