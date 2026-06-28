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
import {
  Share,
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
  Globe,
} from "@boxicons/react";
import { cn } from "@/lib/utils";

const PLATFORMS = [
  {
    id: "whatsapp",
    label: "WhatsApp",
    icon: MessageCircle,
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

export function SocialSettings({ data, onChange }: any) {
  const togglePlatform = (id: string) => {
    const newActive = data.activePlatforms.includes(id)
      ? data.activePlatforms.filter((p: string) => p !== id)
      : [...data.activePlatforms, id];
    onChange({ ...data, activePlatforms: newActive });
  };

  const handleValueChange = (id: string, text: string) => {
    onChange({ ...data, values: { ...data.values, [id]: text } });
  };

  return (
    <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4 flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-lg flex items-center gap-2 text-foreground mb-1">
            <Share className="h-5 w-5 text-primary" /> Redes Sociais
          </CardTitle>
          <CardDescription>
            Toque nos ícones abaixo para adicionar as redes.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-6">
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
        <div className="w-full h-px bg-border/50 my-1" />
        <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
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
                      value={data.values[platform.id] || ""}
                      onChange={(e) =>
                        handleValueChange(platform.id, e.target.value)
                      }
                      className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
                      placeholder={platform.placeholder}
                    />
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </CardContent>
    </Card>
  );
}
