"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { compressImage } from "@/lib/image-utils";
import { User, Image as ImageIcon, Link as LinkIcon, Upload } from "lucide-react";

export function ProPresentation({ data, onChange }: { data: any, onChange: (data: any) => void }) {
  const handleProHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const compressedBase64 = await compressImage(file, 1200);
        onChange({ ...data, proHeroImage: compressedBase64 });
      } catch (error) {
        console.error("Erro ao processar imagem da lateral:", error);
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
            value={data.heroLayout || "avatar-cover"}
            onValueChange={(val) => onChange({ ...data, heroLayout: val })}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
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
              <div className="w-full h-12 bg-muted/20 rounded-md border border-border/50 flex mb-1 overflow-hidden p-1 gap-1">
                <div className="w-1/2 h-full bg-muted/60 rounded-sm" />
                <div className="w-1/2 h-full bg-muted/30 rounded-sm" />
              </div>
              <span className="font-semibold text-[13px] text-center">Site Profissional (Imagem Lateral)</span>
            </Label>
          </RadioGroup>
        </div>

        {/* Upload de Imagem Específica para Layout de Blog/Lateral */}
        {data.heroLayout === "classic-blog" && (
          <div className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-muted/10">
            <Label className="text-foreground font-medium">Imagem Lateral (Banner do Site Profissional)</Label>
            <p className="text-xs text-muted-foreground -mt-1">Essa imagem aparecerá ao lado do texto (no computador) ou acima dele (no celular).</p>
            
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="proHeroImageUrl" className="text-xs text-muted-foreground">URL da Imagem (Opção 1)</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="proHeroImageUrl"
                    value={data.proHeroImage || ""}
                    onChange={(e) => onChange({ ...data, proHeroImage: e.target.value })}
                    className="bg-background border-border/50 h-10 pl-9 focus-visible:ring-1"
                    placeholder="Cole o link da imagem aqui..."
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center" aria-hidden="true">
                  <div className="w-full border-t border-border/50" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-muted/10 px-2 text-muted-foreground">OU</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Fazer Upload de Foto (Opção 2)</Label>
                <div className="relative h-24 w-full rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/30 transition-colors">
                  <input 
                    type="file" 
                    accept="image/png, image/jpeg, image/webp" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
                    onChange={handleProHeroImageUpload} 
                  />
                  {data.proHeroImage && data.proHeroImage.startsWith('data:image') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.proHeroImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  ) : null}
                  <div className="flex flex-col items-center gap-1 text-muted-foreground relative z-0">
                    <Upload className="h-5 w-5" />
                    <span className="text-xs font-medium">Clique para enviar imagem</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

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

        {/* CTAs do Hero */}
        <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-xl bg-muted/10">
          <Label className="text-foreground font-medium">Botões de Ação (CTAs)</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="ctaPrimary" className="text-xs text-muted-foreground">Botão Principal (texto)</Label>
              <Input
                id="ctaPrimary"
                value={data.ctaPrimaryText || ""}
                onChange={(e) => onChange({ ...data, ctaPrimaryText: e.target.value })}
                className="bg-background border-border/50 h-10 focus-visible:ring-1"
                placeholder="Ex: Agendar Agora"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="ctaSecondary" className="text-xs text-muted-foreground">Botão Secundário (texto)</Label>
              <Input
                id="ctaSecondary"
                value={data.ctaSecondaryText || ""}
                onChange={(e) => onChange({ ...data, ctaSecondaryText: e.target.value })}
                className="bg-background border-border/50 h-10 focus-visible:ring-1"
                placeholder="Ex: Conhecer Serviços"
              />
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground">O botão principal leva ao agendamento. O secundário rola até a seção de serviços.</p>
        </div>

        {/* Biografia Detalhada */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="bio" className="text-foreground font-medium">
            Biografia / Sobre nós
          </Label>
          <Textarea
            id="bio"
            value={data.bio || ""}
            onChange={(e) => onChange({ ...data, bio: e.target.value })}
            className="bg-background border-border/50 focus-visible:ring-1 min-h-[120px]"
            placeholder="Conte sua história, especializações e o que torna o seu trabalho único..."
          />
        </div>

        {/* Título da seção Sobre */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="aboutTitle" className="text-foreground font-medium">
            Título da seção "Sobre" (Opcional)
          </Label>
          <Input
            id="aboutTitle"
            value={data.aboutTitle || ""}
            onChange={(e) => onChange({ ...data, aboutTitle: e.target.value })}
            className="bg-background border-border/50 h-11 focus-visible:ring-1"
            placeholder="Ex: Nossa História, Quem Somos, Sobre a Clínica..."
          />
        </div>

        {/* Categoria / Badge de Destaque */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="badgeText" className="text-foreground font-medium">
            Tag de Categoria (Badge de Destaque)
          </Label>
          <Input
            id="badgeText"
            value={data.badgeText || ""}
            onChange={(e) => onChange({ ...data, badgeText: e.target.value })}
            className="bg-background border-border/50 h-11 focus-visible:ring-1 uppercase"
            placeholder="Ex: BEM-ESTAR & TERAPIA"
          />
          <p className="text-[11px] text-muted-foreground">Fica posicionado acima do título principal no seu site.</p>
        </div>

        {/* Destaques (Highlights) */}
        <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-xl bg-muted/10">
          <Label className="text-foreground font-medium">Destaques (Checkmarks)</Label>
          <p className="text-xs text-muted-foreground -mt-2">Pequenos textos com ícone de "check" que ficam abaixo dos botões.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Input
              value={data.highlight1 || ""}
              onChange={(e) => onChange({ ...data, highlight1: e.target.value })}
              className="bg-background border-border/50 h-10 focus-visible:ring-1"
              placeholder="Ex: Atendimento personalizado"
            />
            <Input
              value={data.highlight2 || ""}
              onChange={(e) => onChange({ ...data, highlight2: e.target.value })}
              className="bg-background border-border/50 h-10 focus-visible:ring-1"
              placeholder="Ex: Ambiente acolhedor"
            />
            <Input
              value={data.highlight3 || ""}
              onChange={(e) => onChange({ ...data, highlight3: e.target.value })}
              className="bg-background border-border/50 h-10 focus-visible:ring-1"
              placeholder="Ex: Profissionais qualificados"
            />
          </div>
        </div>

        {/* Floating Box (Caixa flutuante na imagem) */}
        {data.heroLayout === "classic-blog" && (
          <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-xl bg-muted/10">
            <Label className="text-foreground font-medium">Caixa flutuante na imagem (Apenas layout Site Profissional)</Label>
            <p className="text-xs text-muted-foreground -mt-2">Uma pequena caixa que fica sobreposta à imagem.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="floatingBoxTitle" className="text-xs text-muted-foreground">Título Principal</Label>
                <Input
                  id="floatingBoxTitle"
                  value={data.floatingBoxTitle || ""}
                  onChange={(e) => onChange({ ...data, floatingBoxTitle: e.target.value })}
                  className="bg-background border-border/50 h-10 focus-visible:ring-1"
                  placeholder="Ex: Agende hoje"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="floatingBoxSubtitle" className="text-xs text-muted-foreground">Subtítulo</Label>
                <Input
                  id="floatingBoxSubtitle"
                  value={data.floatingBoxSubtitle || ""}
                  onChange={(e) => onChange({ ...data, floatingBoxSubtitle: e.target.value })}
                  className="bg-background border-border/50 h-10 focus-visible:ring-1"
                  placeholder="Ex: Vagas para esta semana"
                />
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="floatingBoxLink" className="text-xs text-muted-foreground">Link ao clicar</Label>
                <Input
                  id="floatingBoxLink"
                  value={data.floatingBoxLink || ""}
                  onChange={(e) => onChange({ ...data, floatingBoxLink: e.target.value })}
                  className="bg-background border-border/50 h-10 focus-visible:ring-1"
                  placeholder="Ex: https://wa.me/..."
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
