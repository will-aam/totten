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

      <div className="flex flex-col items-center justify-center p-12 border border-dashed border-border rounded-xl bg-muted/10 text-center">
        <ImageIcon className="h-10 w-10 text-muted-foreground/50 mb-3" />
        <h4 className="font-medium text-foreground mb-1">Recurso em Desenvolvimento</h4>
        <p className="text-sm text-muted-foreground max-w-sm">
          A seção de galeria e portfólio está sendo aprimorada e será liberada em breve. Por questões de segurança e melhorias, ela está temporariamente indisponível.
        </p>
      </div>
    </div>
  );
}
