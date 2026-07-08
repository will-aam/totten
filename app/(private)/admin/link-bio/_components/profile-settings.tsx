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
import { Textarea } from "@/components/ui/textarea";
import { Camera, User } from "@boxicons/react";

// Aqui dizemos que o componente aceita as PROPS que o page.tsx enviou
export function ProfileSettings({ data, onChange }: any) {
  const handleSlugChange = (val: string) => {
    const formatted = val
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();

    // Atualiza o dado lá no Cérebro (page.tsx)
    onChange({ ...data, slug: formatted });
  };

  return (
    <Card className="border-0 shadow-none bg-transparent md:border md:shadow-sm md:bg-card">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6 pb-4">
        <CardTitle className="text-lg flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-primary" />
          Perfil e Link
        </CardTitle>
        <CardDescription>
          Defina como você aparecerá na sua página pública.
        </CardDescription>
      </CardHeader>

      <CardContent className="px-0 pb-0 md:pb-6 md:px-6 flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="slug" className="text-foreground font-medium">
            Seu Link Exclusivo
          </Label>
          <div className="flex items-center">
            <span className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center">
              totten.app/
            </span>
            <Input
              id="slug"
              value={data.slug} // Lê do pai
              onChange={(e) => handleSlugChange(e.target.value)}
              className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="seunome"
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Apenas letras minúsculas. Sem espaços ou números.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors">
            <Camera className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary transition-colors" />
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-foreground">
              Foto de Perfil
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Recomendado: 500x500px (PNG ou JPG)
            </p>
            <button className="text-xs font-semibold text-primary hover:underline w-fit">
              Fazer upload
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-foreground font-medium">
            Nome de Exibição
          </Label>
          <Input
            id="name"
            value={data.name} // Lê do pai
            onChange={(e) => onChange({ ...data, name: e.target.value })} // Atualiza o pai
            className="bg-muted/50 border-border/50 h-11"
            placeholder="Ex: Clínica Totten"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-end">
            <Label htmlFor="bio" className="text-foreground font-medium">
              Biografia
            </Label>
            <span
              className={`text-[11px] font-medium ${data.bio.length > 160 ? "text-destructive" : "text-muted-foreground"}`}
            >
              {data.bio.length} / 160
            </span>
          </div>
          <Textarea
            id="bio"
            value={data.bio} // Lê do pai
            onChange={(e) => onChange({ ...data, bio: e.target.value })} // Atualiza o pai
            maxLength={160}
            className="bg-muted/50 border-border/50 min-h-25 resize-none"
            placeholder="Descreva seu negócio em poucas palavras..."
          />
        </div>
      </CardContent>
    </Card>
  );
}
