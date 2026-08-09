"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { User, Camera } from "@boxicons/react";
import { compressImage } from "@/lib/image-utils";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export function ProPresentation({ data, onChange }: any) {
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 800);
        onChange({ ...data, [key]: compressedBase64 });
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
      }
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
          As informações principais que aparecerão no topo da sua página.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        
        {/* OPÇÃO DE LAYOUT DO HERO */}
        <div className="flex flex-col gap-3">
          <Label className="text-foreground font-medium">Estilo do Cabeçalho</Label>
          <RadioGroup 
            value={data.heroLayout || "fade-cover"} 
            onValueChange={(val) => onChange({ ...data, heroLayout: val })}
            className="grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <Label
              htmlFor="layout-fade"
              className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 [&:has([data-state=checked])]:border-primary cursor-pointer gap-2"
            >
              <RadioGroupItem value="fade-cover" id="layout-fade" className="sr-only" />
              <div className="w-full h-12 bg-gradient-to-t from-background to-muted/80 rounded-md border border-border/50 flex items-center justify-center mb-1">
                <span className="text-[10px] text-muted-foreground font-medium">Capa Inteira</span>
              </div>
              <span className="font-semibold text-[13px] text-center">Capa Infinita (Degradê)</span>
            </Label>

            <Label
              htmlFor="layout-avatar"
              className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 [&:has([data-state=checked])]:border-primary cursor-pointer gap-2"
            >
              <RadioGroupItem value="avatar-cover" id="layout-avatar" className="sr-only" />
              <div className="w-full h-12 bg-muted/40 rounded-md border border-border/50 relative flex items-end justify-center mb-1">
                <div className="w-6 h-6 rounded-full bg-primary/20 absolute -bottom-3 border-2 border-background" />
              </div>
              <span className="font-semibold text-[13px] text-center">Capa Quadrada + Perfil</span>
            </Label>

            <Label
              htmlFor="layout-blog"
              className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-muted/50 [&:has([data-state=checked])]:border-primary cursor-pointer gap-2"
            >
              <RadioGroupItem value="classic-blog" id="layout-blog" className="sr-only" />
              <div className="w-full h-12 bg-muted/20 rounded-md border border-border/50 flex flex-col mb-1 overflow-hidden">
                <div className="w-full h-3 bg-muted/60 border-b border-border/50" />
                <div className="w-full flex-1 bg-muted/30 flex items-center justify-center">
                  <span className="text-[10px] text-muted-foreground font-medium">Banner</span>
                </div>
              </div>
              <span className="font-semibold text-[13px] text-center">Site Profissional (Banner)</span>
            </Label>
          </RadioGroup>
        </div>

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
