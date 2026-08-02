"use client";

import { Label } from "@/components/ui/label";
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
          <Label className="text-foreground font-medium">Fotos (Até 6 imagens)</Label>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {/* Grid didático - Quadrados Menores */}
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div 
                key={i} 
                className="aspect-square w-full rounded-xl bg-muted border-2 border-dashed border-border flex flex-col items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors"
              >
                <Camera className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                <span className="text-[9px] text-muted-foreground mt-1.5 font-medium">Upload</span>
                <input 
                  type="file" 
                  accept="image/png, image/jpeg" 
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
