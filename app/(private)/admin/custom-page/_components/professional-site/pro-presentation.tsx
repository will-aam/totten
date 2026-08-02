"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Camera } from "@boxicons/react";

export function ProPresentation({ data, onChange }: any) {
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange({ ...data, [key]: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <User className="h-5 w-5 text-primary" />
          Apresentação
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          A primeira impressão do seu site profissional. Configure sua apresentação principal.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="headline" className="text-foreground font-medium">
            Título / Chamada Principal (Headline)
          </Label>
          <Input
            id="headline"
            value={data.headline || ""}
            onChange={(e) => onChange({ ...data, headline: e.target.value })}
            className="bg-background border-border/50 h-11 focus-visible:ring-1"
            placeholder="Ex: Transformando vidas com Estética Avançada"
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="subheadline" className="text-foreground font-medium">
            Subtítulo (Opcional)
          </Label>
          <Textarea
            id="subheadline"
            value={data.subheadline || ""}
            onChange={(e) => onChange({ ...data, subheadline: e.target.value })}
            className="bg-background border-border/50 focus-visible:ring-1 min-h-[80px]"
            placeholder="Um breve resumo do que você faz ou sua missão principal."
          />
        </div>

        {/* Imagem de Capa (Hero) */}
        <div className="flex flex-col gap-2">
          <Label className="text-foreground font-medium">Imagem de Capa (Banner)</Label>
          <div className="w-full h-32 rounded-xl bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors">
            {data.heroImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.heroImage} alt="Capa" className="w-full h-full object-cover" />
            ) : (
              <div className="flex flex-col items-center gap-2 text-muted-foreground/50 group-hover:text-primary transition-colors">
                <Camera className="h-6 w-6" />
                <span className="text-xs font-medium">Capa / Hero (16:9)</span>
              </div>
            )}
            <input 
              type="file" 
              accept="image/png, image/jpeg" 
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
              onChange={(e) => handleImageUpload(e, 'heroImage')}
            />
          </div>
          {data.heroImage && (
            <button 
              onClick={() => onChange({ ...data, heroImage: "" })} 
              className="text-xs font-semibold text-destructive hover:underline w-fit mt-1"
            >
              Remover capa
            </button>
          )}
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* Biografia Detalhada */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="bio" className="text-foreground font-medium">
            Biografia / Sobre mim
          </Label>
          <Textarea
            id="bio"
            value={data.bio || ""}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            className="bg-background border-border/50 focus-visible:ring-1 min-h-[120px]"
            placeholder="Conte sua história, especializações e o que torna o seu trabalho único..."
          />
        </div>
      </div>
    </div>
  );
}
