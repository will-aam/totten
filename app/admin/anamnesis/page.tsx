// app/admin/anamnesis/page.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  Plus,
  Edit,
  FileText,
  Loader2,
  Archive,
  ArchiveRestore,
} from "lucide-react";

import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

// 🔥 Importando as novas funções que criamos no Passo 1
import {
  getAllAnamnesisTemplates,
  toggleAnamnesisTemplateStatus,
} from "@/app/actions/anamnesis";

export default function AnamnesisListPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadTemplates();
  }, [session]);

  const loadTemplates = async () => {
    if (session?.user?.organizationId) {
      setIsLoading(true);
      const result = await getAllAnamnesisTemplates(
        session.user.organizationId,
      );
      if (result.success && result.data) {
        setTemplates(result.data);
      }
      setIsLoading(false);
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const actionText = currentStatus ? "arquivar" : "reativar";

    if (
      !confirm(
        `Tem certeza que deseja ${actionText} este modelo? ${currentStatus ? "Ele não aparecerá mais para preenchimento de novas fichas." : "Ele voltará a aparecer na lista de novas fichas."}`,
      )
    )
      return;

    const result = await toggleAnamnesisTemplateStatus(id, currentStatus);
    if (result.success) {
      toast({
        title: "Sucesso",
        description: `Modelo ${currentStatus ? "arquivado" : "reativado"} com sucesso.`,
      });
      loadTemplates(); // Recarrega a lista para atualizar a UI
    } else {
      toast({
        title: "Erro",
        description: result.error,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <AdminHeader title="Fichas de Anamnese" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-5xl mx-auto w-full pb-24">
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Modelos de Anamnese
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Crie e gerencie os formulários que suas clientes precisarão
              assinar.
            </p>
          </div>
          <Button
            asChild
            className="h-11 rounded-xl font-bold shrink-0 shadow-sm"
          >
            <Link href="/admin/anamnesis/new">
              <Plus className="w-5 h-5 mr-2" />
              Novo Modelo
            </Link>
          </Button>
        </div>

        {/* Lista de Templates */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Carregando modelos...</p>
          </div>
        ) : templates.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center bg-muted/20 rounded-2xl border-2 border-dashed border-border">
            <FileText className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-bold text-foreground">
              Nenhum modelo encontrado
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-md">
              Você ainda não criou nenhum formulário de anamnese. Clique no
              botão abaixo para criar o seu primeiro.
            </p>
            <Button
              asChild
              variant="outline"
              className="rounded-xl h-11 shadow-sm"
            >
              <Link href="/admin/anamnesis/new">
                <Plus className="w-4 h-4 mr-2" /> Criar Primeiro Modelo
              </Link>
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template) => (
              <Card
                key={template.id}
                // 🔥 Se estiver inativo, deixamos o card visualmente mais apagado
                className={`group overflow-hidden rounded-2xl border-border/50 transition-all ${
                  template.active
                    ? "bg-muted/10 hover:bg-muted/30 hover:border-primary/30"
                    : "bg-muted/5 opacity-70 grayscale-[0.5]"
                }`}
              >
                <CardContent className="p-5 flex flex-col h-full relative">
                  {/* Etiqueta (Badge) de Status */}
                  <div className="absolute top-4 right-4">
                    {template.active ? (
                      <Badge
                        variant="default"
                        className="bg-primary/10 text-primary hover:bg-primary/20 pointer-events-none"
                      >
                        Ativo
                      </Badge>
                    ) : (
                      <Badge
                        variant="secondary"
                        className="pointer-events-none"
                      >
                        Arquivado
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-start justify-between mb-4 mt-2">
                    <div
                      className={`p-2.5 rounded-lg ${template.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>

                  <h3 className="font-bold text-lg text-foreground line-clamp-1 mb-1 pr-16">
                    {template.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-6">
                    {template.fields ? template.fields.length : 0} perguntas
                  </p>

                  {/* Ações */}
                  <div className="mt-auto flex items-center gap-2 pt-4 border-t border-border/50">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 rounded-lg h-9 text-xs font-medium"
                      asChild
                    >
                      <Link href={`/admin/anamnesis/${template.id}/edit`}>
                        <Edit className="w-3.5 h-3.5 mr-2" />
                        Editar
                      </Link>
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      // Muda a cor e o ícone dependendo do status atual
                      className={`flex-1 rounded-lg h-9 text-xs font-medium ${
                        template.active
                          ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50 hover:border-amber-200"
                          : "text-muted-foreground hover:text-green-600 hover:bg-green-50 hover:border-green-200"
                      }`}
                      onClick={() =>
                        handleToggleStatus(template.id, template.active)
                      }
                    >
                      {template.active ? (
                        <>
                          <Archive className="w-3.5 h-3.5 mr-2" />
                          Arquivar
                        </>
                      ) : (
                        <>
                          <ArchiveRestore className="w-3.5 h-3.5 mr-2" />
                          Reativar
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
