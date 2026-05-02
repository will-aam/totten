"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Plus, Trash } from "@boxicons/react";

export function AdditionalLinks({ data, onChange }: any) {
  const maxLinks = 3;

  const handleAddLink = () => {
    if (data.length < maxLinks)
      onChange([...data, { id: Math.random().toString(), title: "", url: "" }]);
  };
  const handleRemoveLink = (idToRemove: string) =>
    onChange(data.filter((link: any) => link.id !== idToRemove));
  const handleChange = (id: string, field: "title" | "url", value: string) =>
    onChange(
      data.map((link: any) =>
        link.id === id ? { ...link, [field]: value } : link,
      ),
    );

  return (
    <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2 text-foreground mb-1">
            <LinkIcon className="h-5 w-5 text-primary" /> Links Adicionais
          </CardTitle>
          <CardDescription>
            Adicione até {maxLinks} botões extras.
          </CardDescription>
        </div>
        <div className="bg-muted px-2.5 py-1 rounded-full text-xs font-semibold text-muted-foreground border border-border/50">
          {data.length} / {maxLinks}
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-4">
        {data.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Nenhum link adicional configurado.
            </p>
          </div>
        ) : (
          data.map((link: any, index: number) => (
            <div
              key={link.id}
              className="p-4 border border-border/50 bg-muted/10 rounded-xl relative group transition-all hover:border-primary/30"
            >
              <button
                onClick={() => handleRemoveLink(link.id)}
                className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors p-1"
              >
                <Trash className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2 mb-4">
                <div className="bg-primary/10 text-primary h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold">
                  {index + 1}
                </div>
                <h4 className="font-medium text-sm text-foreground">
                  Configuração do Botão
                </h4>
              </div>
              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium">Nome do Botão</Label>
                  <Input
                    placeholder="Ex: Tabela de Preços"
                    value={link.title}
                    onChange={(e) =>
                      handleChange(link.id, "title", e.target.value)
                    }
                    className="bg-background"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <Label className="text-sm font-medium">
                    URL (Link de Destino)
                  </Label>
                  <div className="flex items-center">
                    <span className="bg-muted text-muted-foreground px-3 border border-border/50 border-r-0 rounded-l-md text-sm h-10 flex items-center shrink-0">
                      https://
                    </span>
                    <Input
                      placeholder="www.site.com.br/promo"
                      value={link.url}
                      onChange={(e) =>
                        handleChange(link.id, "url", e.target.value)
                      }
                      className="rounded-l-none bg-background focus-visible:ring-1"
                    />
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
        {data.length < maxLinks && (
          <Button
            variant="outline"
            onClick={handleAddLink}
            className="w-full mt-2 border-dashed border-2 hover:bg-primary/5 hover:text-primary transition-colors h-12 rounded-xl"
          >
            <Plus className="mr-2 h-4 w-4" /> Adicionar Novo Link
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
