import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { compressImage } from "@/lib/image-utils";

import { LoaderLines, Link, BookOpen, ArrowInUpSquareHalf } from "@boxicons/react"
import { useState } from "react";
import { uploadImageAction } from "@/app/actions/upload-image";
import { toast } from "sonner";

export function ProHistory({ data, onChange, profile }: { data: any, onChange: (data: any) => void, profile?: any }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleHistoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      try {
        const compressedBase64 = await compressImage(file, 1200);
        const res = await uploadImageAction(compressedBase64, "history");
        if (res.success && res.url) {
          onChange({ ...data, historyImage: res.url });
        } else {
          toast.error(res.error || "Erro ao fazer upload da imagem");
        }
      } catch (error) {
        console.error("Erro ao processar imagem da história:", error);
        toast.error("Erro inesperado ao processar imagem");
      } finally {
        setIsUploading(false);
      }
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <BookOpen className="h-5 w-5 text-primary" />
          Nossa História (Sobre)
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Compartilhe sua trajetória, experiência e números de destaque.
        </p>
      </div>

      <div className="flex items-center gap-3 bg-muted/20 p-4 rounded-xl border border-border/50">
        <Switch
          checked={data.showHistory !== false}
          onCheckedChange={(checked) => onChange({ ...data, showHistory: checked })}
        />
        <div className="flex flex-col">
          <span className="text-sm font-medium">Exibir seção "Nossa História"</span>
          <span className="text-xs text-muted-foreground">Mostra ou esconde esta seção no seu site.</span>
        </div>
      </div>

      {data.showHistory !== false && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <Label htmlFor="historyOverline" className="text-foreground font-medium">
              Texto Menor (Acima do Título)
            </Label>
            <Input
              id="historyOverline"
              value={data.historyOverline ?? "NOSSA HISTÓRIA"}
              onChange={(e) => onChange({ ...data, historyOverline: e.target.value })}
              className="bg-background border-border/50 h-11 focus-visible:ring-1 uppercase"
              placeholder="Ex: NOSSA HISTÓRIA"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="historyTitle" className="text-foreground font-medium">
              Título Principal
            </Label>
            <Input
              id="historyTitle"
              value={data.historyTitle || ""}
              onChange={(e) => onChange({ ...data, historyTitle: e.target.value })}
              className="bg-background border-border/50 h-11 focus-visible:ring-1"
              placeholder="Ex: Cuidado que vai além do toque..."
            />
          </div>

          <div className="flex flex-col gap-3">
            <Label className="text-foreground font-medium">
              Descrição / Texto
            </Label>
            
            <RadioGroup 
              value={data.useGlobalBio !== false ? "global" : "custom"} 
              onValueChange={(val) => onChange({ ...data, useGlobalBio: val === "global" })}
              className="flex gap-6 mb-1"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="global" id="bio-global" />
                <Label htmlFor="bio-global" className="cursor-pointer text-sm font-normal">Usar o da configuração global</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="custom" id="bio-custom" />
                <Label htmlFor="bio-custom" className="cursor-pointer text-sm font-normal">Customizar um diferente</Label>
              </div>
            </RadioGroup>

            {data.useGlobalBio !== false ? (
              <div className="bg-muted/30 border border-border/50 rounded-md p-4 text-sm text-muted-foreground italic whitespace-pre-wrap">
                {profile?.bio || "Nenhuma descrição configurada no painel global."}
              </div>
            ) : (
              <Textarea
                id="historyText"
                value={data.historyText || ""}
                onChange={(e) => onChange({ ...data, historyText: e.target.value })}
                className="bg-background border-border/50 min-h-[120px] resize-none focus-visible:ring-1"
                placeholder="Conte um pouco sobre sua trajetória, missão e valores..."
              />
            )}
          </div>

          {/* History Image Notice */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
            <p className="text-sm text-primary font-medium text-center">
              A Imagem da História (Capa) agora é gerenciada na aba <strong>Galeria de Imagens</strong>.
            </p>
          </div>

          {/* Métricas / Estatísticas */}
          <div className="flex flex-col gap-4 p-4 border border-border/50 rounded-xl bg-muted/10">
            <Label className="text-foreground font-medium">Métricas / Estatísticas (Opcional)</Label>
            <p className="text-xs text-muted-foreground -mt-2">Números que trazem autoridade para sua história.</p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Métrica 1 */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Anos de experiência</Label>
                <div className="flex gap-2">
                  <Input
                    value={data.historyStat1Value || ""}
                    onChange={(e) => onChange({ ...data, historyStat1Value: e.target.value })}
                    className="w-20 bg-background border-border/50 h-10 focus-visible:ring-1"
                    placeholder="Ex: 10+"
                  />
                  <Input
                    value={data.historyStat1Label || "Anos de experiência"}
                    onChange={(e) => onChange({ ...data, historyStat1Label: e.target.value })}
                    className="flex-1 bg-background border-border/50 h-10 focus-visible:ring-1"
                    placeholder="Texto principal"
                  />
                </div>
              </div>

              {/* Métrica 2 */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Clientes atendidos</Label>
                <div className="flex gap-2">
                  <Input
                    value={data.historyStat2Value || ""}
                    onChange={(e) => onChange({ ...data, historyStat2Value: e.target.value })}
                    className="w-20 bg-background border-border/50 h-10 focus-visible:ring-1"
                    placeholder="Ex: 5k+"
                  />
                  <Input
                    value={data.historyStat2Label || "Clientes atendidos"}
                    onChange={(e) => onChange({ ...data, historyStat2Label: e.target.value })}
                    className="flex-1 bg-background border-border/50 h-10 focus-visible:ring-1"
                    placeholder="Texto principal"
                  />
                </div>
              </div>

              {/* Métrica 3 */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">3ª Métrica (Opcional)</Label>
                <div className="flex gap-2">
                  <Input
                    value={data.historyStat3Value || ""}
                    onChange={(e) => onChange({ ...data, historyStat3Value: e.target.value })}
                    className="w-20 bg-background border-border/50 h-10 focus-visible:ring-1"
                    placeholder="Ex: 5.0"
                  />
                  <Input
                    value={data.historyStat3Label || ""}
                    onChange={(e) => onChange({ ...data, historyStat3Label: e.target.value })}
                    className="flex-1 bg-background border-border/50 h-10 focus-visible:ring-1"
                    placeholder="Ex: Avaliação Média"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
