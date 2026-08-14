"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Link as LinkIcon, Plus, Trash, Globe, Calendar } from "@boxicons/react";

export function AdditionalLinks({ data, onChange }: any) {
  const maxLinks = 4; // Including system default links

  const handleAddCustomLink = () => {
    if (data.length < maxLinks)
      onChange([...data, { id: Math.random().toString(), type: "custom", title: "", url: "" }]);
  };

  const handleAddSystemLink = (type: "system-site" | "system-booking") => {
    if (data.length < maxLinks) {
      const defaultTitle = type === "system-site" ? "Acessar Site" : "Agendar Agora";
      onChange([...data, { id: type, type, title: defaultTitle, url: "" }]);
    }
  };

  const handleRemoveLink = (idToRemove: string) =>
    onChange(data.filter((link: any) => link.id !== idToRemove));

  const handleChange = (id: string, field: "title" | "url", value: string) =>
    onChange(
      data.map((link: any) =>
        link.id === id ? { ...link, [field]: value } : link,
      ),
    );

  const hasSystemSite = data.some((l: any) => l.id === "system-site" || l.type === "system-site");
  const hasSystemBooking = data.some((l: any) => l.id === "system-booking" || l.type === "system-booking");

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-row items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground mb-1">
            <LinkIcon className="h-5 w-5 text-primary" /> Links Adicionais
          </h3>
          <p className="text-sm text-muted-foreground">
            Adicione até {maxLinks} botões (incluindo atalhos para seu site e agenda).
          </p>
        </div>
        <div className="bg-muted px-2.5 py-1 rounded-full text-xs font-semibold text-muted-foreground border border-border/50">
          {data.length} / {maxLinks}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        {data.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Nenhum link configurado. Adicione atalhos abaixo!
            </p>
          </div>
        ) : (
          data.map((link: any, index: number) => {
            const isSystemSite = link.id === "system-site" || link.type === "system-site";
            const isSystemBooking = link.id === "system-booking" || link.type === "system-booking";
            const isSystem = isSystemSite || isSystemBooking;

            return (
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
                  <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                    {isSystemSite ? <><Globe className="h-4 w-4" /> Botão do Site</> : 
                     isSystemBooking ? <><Calendar className="h-4 w-4" /> Botão da Agenda</> : 
                     <><LinkIcon className="h-4 w-4" /> Botão Personalizado</>}
                  </h4>
                </div>
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-sm font-medium">Nome do Botão</Label>
                    <Input
                      placeholder={isSystem ? "Ex: Acessar" : "Ex: Tabela de Preços"}
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
                      {isSystem ? (
                        <Input
                          disabled
                          value={isSystemSite ? "Redireciona automaticamente para o seu Site" : "Redireciona automaticamente para a Agenda"}
                          className="bg-muted text-muted-foreground cursor-not-allowed italic"
                        />
                      ) : (
                        <>
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
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
        
        {data.length < maxLinks && (
          <div className="flex flex-col gap-2 mt-2">
            {!hasSystemSite && (
              <Button
                variant="outline"
                onClick={() => handleAddSystemLink("system-site")}
                className="w-full border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground transition-colors h-11 rounded-xl justify-start"
              >
                <Globe className="mr-2 h-4 w-4 text-primary" /> Adicionar Botão do Site
              </Button>
            )}
            {!hasSystemBooking && (
              <Button
                variant="outline"
                onClick={() => handleAddSystemLink("system-booking")}
                className="w-full border-primary/20 hover:bg-primary/5 hover:border-primary/50 text-foreground transition-colors h-11 rounded-xl justify-start"
              >
                <Calendar className="mr-2 h-4 w-4 text-primary" /> Adicionar Botão da Agenda
              </Button>
            )}
            <Button
              variant="outline"
              onClick={handleAddCustomLink}
              className="w-full border-dashed border-2 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors h-11 rounded-xl justify-start"
            >
              <Plus className="mr-2 h-4 w-4" /> Adicionar Link Personalizado
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

