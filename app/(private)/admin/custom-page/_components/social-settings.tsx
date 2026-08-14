"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Community,
  Instagram,
  Facebook,
  Youtube,
  Whatsapp,
  Globe,
  ArrowUp,
  ArrowDown,
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
  const activePlatforms = data.activePlatforms || [];

  const togglePlatform = (id: string) => {
    // Only allow toggling ON if there is a configured value
    const isConfigured = id === "whatsapp" ? !!globalContact?.whatsapp : !!data.values?.[id];
    
    let newPlatforms = [...activePlatforms];
    if (newPlatforms.includes(id)) {
      newPlatforms = newPlatforms.filter((p) => p !== id);
    } else {
      if (!isConfigured) {
        // Optional: you could show a toast here
        return;
      }
      newPlatforms.push(id);
    }
    onChange({ ...data, activePlatforms: newPlatforms });
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
          <Community className="h-5 w-5 text-primary" /> Redes Sociais
        </h3>
        <p className="text-sm text-muted-foreground">
          Configure a exibição das suas redes sociais e métodos de contato.
        </p>
      </div>

      {/* SEÇÃO DE EXIBIÇÃO (Posição, Estilo e Tamanho) */}
      <div className="flex flex-col gap-5">
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



      {/* SEÇÃO DE PLATAFORMAS E LINKS */}
      <div className="flex flex-col gap-6">
        <div>
          <h4 className="font-medium text-sm mb-3">Plataformas Ativas</h4>
          <div className="flex flex-col gap-3">
            {PLATFORMS.map((platform) => {
              const isActive = activePlatforms.includes(platform.id);
              const isConfigured = platform.id === "whatsapp" ? !!globalContact?.whatsapp : !!data.values?.[platform.id];
              const Icon = platform.icon;
              
              return (
                <div
                  key={platform.id}
                  className="flex items-center justify-between p-4 border border-border/50 rounded-xl bg-card"
                >
                  <div className="flex items-center gap-3">
                    <div className="bg-muted p-2 rounded-md text-foreground">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-semibold text-foreground text-sm">{platform.label}</span>
                      <span className="text-[11px] text-muted-foreground">
                        {isConfigured ? "Configurado no Global" : "Não configurado no Global"}
                      </span>
                    </div>
                  </div>
                  <Switch
                    checked={isActive}
                    onCheckedChange={() => togglePlatform(platform.id)}
                    disabled={!isConfigured}
                  />
                </div>
              );
            })}
          </div>
        </div>


      </div>
    </div>
  );
}
