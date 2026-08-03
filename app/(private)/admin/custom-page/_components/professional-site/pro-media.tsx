"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Image as ImageIcon, Camera } from "@boxicons/react";

export function ProMedia({ data, onChange }: any) {
  // Como é apenas visual estático no momento, não precisamos implementar lógica complexa de array de arquivos
  // Apenas a estrutura visual de uma galeria.

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
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Label className="text-foreground font-medium">Fotos (Até 4 imagens)</Label>
            <span className="text-[10px] bg-muted px-2 py-1 rounded-md text-muted-foreground font-bold uppercase tracking-wider">Em breve</span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 opacity-60">
            {/* Grid didático - Quadrados Menores estáticos */}
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
        
        <div className="flex flex-col gap-2">
          <Label htmlFor="videoUrl" className="text-foreground font-medium">
            Vídeo em Destaque (Link do YouTube)
          </Label>
          <Input
            id="videoUrl"
            value={data.videoUrl || ""}
            onChange={(e: any) => onChange({ ...data, videoUrl: e.target.value })}
            className="bg-background border-border/50 h-11 focus-visible:ring-1"
            placeholder="Ex: https://www.youtube.com/watch?v=..."
          />
        </div>
      </div>
    </div>
  );
}
