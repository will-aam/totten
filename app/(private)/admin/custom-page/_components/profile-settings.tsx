"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Camera, User, Copy, Check } from "@boxicons/react";

export function ProfileSettings({ data, onChange }: any) {
  const [copied, setCopied] = useState(false);

  const handleSlugChange = (val: string) => {
    const formatted = val
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z]/g, "")
      .toLowerCase();
    onChange({ ...data, slug: formatted });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, image: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`totten.app/${data.slug}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-primary" />
          Perfil e Link
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Defina como você aparecerá na sua página pública.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="slug" className="text-foreground font-medium">
            Seu Link Exclusivo
          </Label>
          <div className="flex items-center">
            <span className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
              totten.app/
            </span>
            <Input
              id="slug"
              value={data.slug}
              onChange={(e) => handleSlugChange(e.target.value)}
              className="rounded-none bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="seunome"
            />
            <button
              onClick={handleCopyLink}
              className="bg-muted text-muted-foreground px-3 py-2 border border-border/50 border-l-0 rounded-r-md text-sm h-11 flex items-center hover:bg-muted/80 hover:text-foreground transition-colors shrink-0 outline-none"
              title="Copiar link"
            >
              {copied ? (
                <Check className="h-5 w-5 text-emerald-500" />
              ) : (
                <Copy className="h-5 w-5" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Apenas letras minúsculas. Sem espaços ou números.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="h-20 w-20 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors">
            {data.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.image} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <Camera className="h-6 w-6 text-muted-foreground/50 group-hover:text-primary transition-colors" />
            )}
            <input 
              type="file" 
              accept="image/png, image/jpeg" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              onChange={handleImageUpload}
            />
          </div>
          <div className="flex flex-col">
            <p className="font-medium text-sm text-foreground">
              Foto de Perfil
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              Recomendado: 500x500px (PNG ou JPG)
            </p>
            <label className="text-xs font-semibold text-primary hover:underline w-fit cursor-pointer">
              Fazer upload
              <input 
                type="file" 
                accept="image/png, image/jpeg" 
                className="hidden"
                onChange={handleImageUpload}
              />
            </label>
            {data.image && (
              <button 
                onClick={() => onChange({ ...data, image: "" })} 
                className="text-xs font-semibold text-destructive hover:underline w-fit mt-1"
              >
                Remover foto
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="name" className="text-foreground font-medium">
            Nome de Exibição
          </Label>
          <Input
            id="name"
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
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
            value={data.bio}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            maxLength={160}
            className="bg-muted/50 border-border/50 min-h-25 resize-none"
            placeholder="Descreva seu negócio em poucas palavras..."
          />
        </div>
      </div>
    </div>
  );
}
