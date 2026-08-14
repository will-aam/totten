"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { compressImage } from "@/lib/image-utils";
import { User, Link, ArrowInUpSquareHalf, X } from "@boxicons/react"
import { useState, useEffect } from "react";
import { uploadImageAction } from "@/app/actions/upload-image";
import { toast } from "sonner";

export function ProPresentation({ data, onChange, hasServices }: { data: any, onChange: (val: any) => void, hasServices?: boolean }) {
  const [isUploading, setIsUploading] = useState(false);
  const [newUrl, setNewUrl] = useState("");

  useEffect(() => {
    if (data.proHeroImage && (!data.proHeroImages || data.proHeroImages.length === 0)) {
      onChange({ ...data, proHeroImages: [data.proHeroImage] });
    }
  }, [data.proHeroImage]);

  const heroImages: string[] = data.proHeroImages || (data.proHeroImage ? [data.proHeroImage] : []);

  const handleProHeroImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (heroImages.length >= 5) {
        toast.error("Você pode adicionar no máximo 5 imagens.");
        return;
      }
      setIsUploading(true);
      try {
        const compressedBase64 = await compressImage(file, 1200);
        const res = await uploadImageAction(compressedBase64, "professional");
        if (res.success && res.url) {
          onChange({
            ...data,
            proHeroImages: [...heroImages, res.url],
            proHeroImage: heroImages.length === 0 ? res.url : data.proHeroImage
          });
        } else {
          toast.error(res.error || "Erro ao fazer upload da imagem");
        }
      } catch (error) {
        console.error("Erro ao processar imagem:", error);
        toast.error("Erro inesperado ao processar imagem");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddUrl = () => {
    if (!newUrl.trim()) return;
    if (heroImages.length >= 5) {
      toast.error("Você pode adicionar no máximo 5 imagens.");
      return;
    }
    onChange({
      ...data,
      proHeroImages: [...heroImages, newUrl.trim()],
      proHeroImage: heroImages.length === 0 ? newUrl.trim() : data.proHeroImage
    });
    setNewUrl("");
  };

  const handleRemoveImage = (index: number) => {
    const newImages = [...heroImages];
    newImages.splice(index, 1);
    onChange({
      ...data,
      proHeroImages: newImages,
      proHeroImage: newImages.length > 0 ? newImages[0] : ""
    });
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


        {/* Upload de Imagens para Layout de Blog/Lateral (Slider) */}
        <div className="flex flex-col gap-4 pt-2">
          <div>
              <Label className="text-foreground font-medium">Imagens do Slider / Banner Lateral</Label>
              <p className="text-xs text-muted-foreground mt-1">
                Adicione até 5 fotos para criar um slide automático. Se adicionar apenas 1, será uma imagem estática.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              {heroImages.map((img, idx) => (
                <div key={idx} className="relative h-24 w-24 rounded-lg border border-border/50 overflow-hidden group">
                  <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remover imagem"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}

              {heroImages.length < 5 && (
                <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/30 transition-colors cursor-pointer">
                  <input
                    type="file"
                    accept="image/png, image/jpeg, image/webp"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                    onChange={handleProHeroImageUpload}
                    disabled={isUploading}
                  />
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ArrowInUpSquareHalf className="h-5 w-5" />
                    <span className="text-[10px] font-medium text-center px-1">Upload</span>
                  </div>
                </div>
              )}
            </div>

            {heroImages.length < 5 && (
              <div className="flex gap-2 items-center">
                <div className="relative flex-1">
                  <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={newUrl}
                    onChange={(e) => setNewUrl(e.target.value)}
                    className="bg-background border-border/50 h-9 pl-9 text-xs focus-visible:ring-1"
                    placeholder="Ou cole a URL da imagem aqui..."
                    onKeyDown={(e) => e.key === "Enter" && handleAddUrl()}
                  />
                </div>
                <button
                  onClick={handleAddUrl}
                  disabled={!newUrl.trim()}
                  className="bg-muted hover:bg-muted/80 text-foreground text-xs font-medium px-3 h-9 rounded-md border border-border/50 disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            )}
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

        {/* CTAs do Hero */}
        <div className="flex flex-col gap-4 pt-2">
          <Label className="text-foreground font-medium">Botões de Ação (CTAs)</Label>
          
          <div className="flex items-center justify-between border rounded-lg p-3">
            <div className="flex flex-col gap-1">
              <Label htmlFor="ctaPrimary" className="text-sm font-medium">Botão Primário ("Agendar Sessão")</Label>
              <p className="text-xs text-muted-foreground">Leva o cliente para a página de agendamento.</p>
            </div>
            <Switch 
              id="ctaPrimary"
              checked={data.ctaPrimaryText !== false}
              onCheckedChange={(checked) => onChange({ ...data, ctaPrimaryText: checked })}
            />
          </div>

          <div className="flex flex-col border rounded-lg p-3 gap-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <Label htmlFor="ctaSecondary" className="text-sm font-medium">Botão Secundário</Label>
                <p className="text-xs text-muted-foreground">Adiciona um botão extra ao lado de "Agendar Sessão".</p>
              </div>
              <Switch 
                id="ctaSecondary"
                checked={data.ctaSecondaryText !== false} 
                onCheckedChange={(checked) => onChange({ ...data, ctaSecondaryText: checked })}
              />
            </div>
            {data.ctaSecondaryText !== false && (
              <div className="flex flex-col gap-2 pt-2 border-t">
                <Label className="text-xs font-medium text-muted-foreground">Ação do Botão</Label>
                <Select
                  value={data.ctaSecondaryType || "services"}
                  onValueChange={(val) => onChange({ ...data, ctaSecondaryType: val })}
                >
                  <SelectTrigger className="bg-background border-border/50 h-9 w-full">
                    <SelectValue placeholder="Selecione a ação" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="services">Conhecer Serviços</SelectItem>
                    <SelectItem value="packages">Planos e Pacotes</SelectItem>
                    <SelectItem value="team">Nossa Equipe</SelectItem>
                    <SelectItem value="contact">Fale Conosco</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
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
        <div className="flex flex-col gap-4 pt-2">
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


      </div>
    </div>
  );
}
