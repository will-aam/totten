"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Image as ImageIcon, Camera, Plus, X } from "@boxicons/react";

export function ProMedia({ data, onChange }: any) {
  const [featureInput, setFeatureInput] = useState("");

  const features: string[] = data.videoFeatures || [];

  const addFeature = () => {
    const trimmed = featureInput.trim();
    if (!trimmed) return;
    onChange({ ...data, videoFeatures: [...features, trimmed] });
    setFeatureInput("");
  };

  const removeFeature = (idx: number) => {
    onChange({ ...data, videoFeatures: features.filter((_: string, i: number) => i !== idx) });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <ImageIcon className="h-5 w-5 text-primary" />
          Galeria e Portfólio
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Mostre seu espaço, seus resultados e vídeos do seu trabalho.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* FOTOS (Em breve) */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium">Fotos (Até 4 imagens)</Label>
            <span className="text-[10px] bg-muted px-2 py-1 rounded-md text-muted-foreground font-bold uppercase tracking-wider">Em breve</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-60">
            {[1, 2, 3, 4].map((i) => (
              <div 
                key={i} 
                className="aspect-square w-full rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center relative overflow-hidden group cursor-not-allowed"
              >
                <Camera className="h-5 w-5 text-muted-foreground/50" />
              </div>
            ))}
          </div>
        </div>

        <div className="w-full h-px bg-border/50" />

        {/* VÍDEO DO YOUTUBE */}
        <div className="flex flex-col gap-4 p-5 border border-border/50 rounded-xl bg-muted/10">
          <Label className="text-foreground font-medium text-base">Vídeo em Destaque</Label>

          <div className="flex flex-col gap-2">
            <Label htmlFor="videoUrl" className="text-xs text-muted-foreground">Link do YouTube</Label>
            <Input
              id="videoUrl"
              value={data.videoUrl || ""}
              onChange={(e: any) => onChange({ ...data, videoUrl: e.target.value })}
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="Ex: https://www.youtube.com/watch?v=..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="videoTitle" className="text-xs text-muted-foreground">Título da seção (Opcional)</Label>
            <Input
              id="videoTitle"
              value={data.videoTitle || ""}
              onChange={(e: any) => onChange({ ...data, videoTitle: e.target.value })}
              className="bg-background border-border/50 h-10 focus-visible:ring-1"
              placeholder="Ex: Conheça nosso espaço, Tour virtual..."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="videoDescription" className="text-xs text-muted-foreground">Descrição (Opcional)</Label>
            <Textarea
              id="videoDescription"
              value={data.videoDescription || ""}
              onChange={(e: any) => onChange({ ...data, videoDescription: e.target.value })}
              className="bg-background border-border/50 focus-visible:ring-1 min-h-[80px]"
              placeholder="Descreva o que o cliente verá no vídeo ou tour virtual..."
            />
          </div>

          {/* FEATURES / BULLET POINTS */}
          <div className="flex flex-col gap-3">
            <Label className="text-xs text-muted-foreground">Destaques (bullet points ao lado do vídeo)</Label>
            
            <div className="flex gap-2">
              <Input
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addFeature(); } }}
                className="bg-background border-border/50 h-10 focus-visible:ring-1 flex-1"
                placeholder="Ex: Salas climatizadas com iluminação suave"
              />
              <button
                onClick={addFeature}
                className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors shrink-0"
                type="button"
              >
                <Plus className="h-5 w-5" />
              </button>
            </div>

            {features.length > 0 && (
              <div className="flex flex-col gap-2">
                {features.map((feat: string, i: number) => (
                  <div key={i} className="flex items-center justify-between px-3 py-2 rounded-lg bg-background border border-border/50 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feat}
                    </span>
                    <button
                      onClick={() => removeFeature(i)}
                      className="text-muted-foreground hover:text-destructive transition-colors"
                      type="button"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <p className="text-[11px] text-muted-foreground">Pressione Enter ou clique + para adicionar. Esses itens aparecem ao lado do vídeo na página.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
