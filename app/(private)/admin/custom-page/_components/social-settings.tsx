"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Share,
  Instagram,
  Facebook,
  Youtube,
  Whatsapp,
  Globe,
  Circle,
  ArrowUp,
  ArrowDown,
  Grid
} from "@boxicons/react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: Whatsapp,
    prefix: "+55",
    placeholder: "DDD + Número",
  },
  {
    id: "instagram",
    label: "Instagram",
    icon: Instagram,
    prefix: "@",
    placeholder: "seuusuario",
  },
  {
    id: "facebook",
    label: "Facebook",
    icon: Facebook,
    prefix: "facebook.com/",
    placeholder: "suapagina",
  },
  {
    id: "youtube",
    label: "YouTube",
    icon: Youtube,
    prefix: "youtube.com/@",
    placeholder: "seucanal",
  },
  {
    id: "website",
    label: "Meu Site",
    icon: Globe,
    prefix: "https://",
    placeholder: "www.seusite.com.br",
  },
];

export function SocialSettings({ data, onChange, globalContact }: any) {
  // Configurações padrão caso não existam no estado
  const position = data.position || "top";
  const size = data.size || "medium";

  const togglePlatform = (id: string) => {
    const newActive = data.activePlatforms.includes(id)
      ? data.activePlatforms.filter((p: string) => p !== id)
      : [...data.activePlatforms, id];
    onChange({ ...data, activePlatforms: newActive });
  };

  const handleValueChange = (id: string, text: string) => {
    onChange({ ...data, values: { ...data.values, [id]: text } });
  };

  const updateSetting = (key: string, value: string) => {
    onChange({ ...data, [key]: value });
  };

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground mb-1">
          <Share className="h-5 w-5 text-primary" /> Redes Sociais
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure a exibição das suas redes sociais e métodos de contato.
        </p>
      </div>

      {/* SEÇÃO DE EXIBIÇÃO (Posição, Estilo e Tamanho) */}
      <div className="flex flex-col gap-5 p-5 border border-border/50 rounded-xl bg-muted/10">
        <h4 className="font-medium text-sm">Opções de Exibição</h4>

        <div className="flex flex-wrap md:flex-nowrap gap-6">
          {/* POSIÇÃO */}
          <div className="flex flex-col gap-3 flex-1">
            <Label className="text-xs text-muted-foreground">Posição na Tela</Label>
            <div className="flex bg-muted p-1 rounded-lg border border-border/50">
              <button
                onClick={() => updateSetting("position", "top")}
                className={cn(
                  "flex-1 text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium",
                  position === "top"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:bg-background/50",
                )}
              >
                <ArrowUp className="h-4 w-4" /> Acima dos Botões
              </button>
              <button
                onClick={() => updateSetting("position", "bottom")}
                className={cn(
                  "flex-1 text-xs py-2 rounded-md transition-colors flex items-center justify-center gap-1.5 font-medium",
                  position === "bottom"
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:bg-background/50",
                )}
              >
                <ArrowDown className="h-4 w-4" /> No Rodapé
              </button>
            </div>
          </div>
        </div>

        {/* TAMANHO */}
        <div className="flex flex-col gap-3 mt-1">
          <Label className="text-xs text-muted-foreground">Tamanho</Label>
          <div className="flex bg-muted p-1 rounded-lg border border-border/50 w-full md:w-1/2">
            {["medium", "large"].map((s) => (
              <button
                key={s}
                onClick={() => updateSetting("size", s)}
                className={cn(
                  "flex-1 text-xs py-2 rounded-md transition-colors font-medium",
                  size === s
                    ? "bg-background shadow-sm text-foreground"
                    : "text-muted-foreground hover:bg-background/50",
                )}
              >
                {s === "medium" ? "Médio" : "Grande"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-border/50" />

      {/* SEÇÃO DE PLATAFORMAS E LINKS */}
      <div className="flex flex-col gap-6">
        <div>
          <h4 className="font-medium text-sm mb-3">Plataformas Ativas</h4>
          <div className="flex flex-wrap gap-3">
            {PLATFORMS.map((platform) => {
              const isActive = data.activePlatforms.includes(platform.id);
              return (
                <button
                  key={platform.id}
                  onClick={() => togglePlatform(platform.id)}
                  className={cn(
                    "h-12 w-12 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110",
                    isActive
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border/50 bg-card text-muted-foreground hover:border-primary/50",
                  )}
                >
                  <platform.icon className="h-5 w-5" />
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300 mt-2">
          {data.activePlatforms.length === 0 ? (
            <div className="text-center py-6 border-2 border-dashed border-border/50 rounded-xl bg-muted/20">
              <p className="text-sm text-muted-foreground">
                Nenhuma rede selecionada.
              </p>
            </div>
          ) : (
            PLATFORMS.filter((p) => data.activePlatforms.includes(p.id)).map(
              (platform) => (
                <div key={platform.id} className="flex flex-col gap-1.5 group">
                  <div className="flex items-center justify-between">
                    <Label
                      htmlFor={platform.id}
                      className="text-foreground font-medium flex items-center gap-2 text-sm"
                    >
                      <platform.icon className="h-4 w-4 text-muted-foreground" />{" "}
                      {platform.label}
                    </Label>
                  </div>
                  <div className="flex items-center">
                    <span className="bg-muted text-muted-foreground px-3 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
                      {platform.prefix}
                    </span>
                    <Input
                      id={platform.id}
                      value={platform.id === "whatsapp" ? globalContact?.whatsapp || "" : data.values[platform.id] || ""}
                      onChange={(e) =>
                        handleValueChange(platform.id, e.target.value)
                      }
                      disabled={platform.id === "whatsapp"}
                      className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
                      placeholder={platform.placeholder}
                    />
                  </div>
                  {platform.id === "whatsapp" && (
                    <p className="text-[11px] text-muted-foreground mt-1">
                      Editado em Configurações &gt; Dados da Empresa
                    </p>
                  )}
                </div>
              ),
            )
          )}
        </div>
      </div>
    </div>
  );
}
