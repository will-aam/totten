import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { compressImage } from "@/lib/image-utils";
import { Link as LinkIcon, Upload, BookOpen, Loader2 } from "lucide-react";
import { useState } from "react";
import { uploadImageAction } from "@/app/actions/upload-image";
import { toast } from "sonner";

export function ProHistory({ data, onChange }: { data: any, onChange: (data: any) => void }) {
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="historyText" className="text-foreground font-medium">
              Descrição / Texto
            </Label>
            <Textarea
              id="historyText"
              value={data.historyText || ""}
              onChange={(e) => onChange({ ...data, historyText: e.target.value })}
              className="bg-background border-border/50 min-h-[120px] resize-none focus-visible:ring-1"
              placeholder="Conte um pouco sobre sua trajetória, missão e valores..."
            />
          </div>

          {/* Imagem da História */}
          <div className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-muted/10">
            <Label className="text-foreground font-medium">Imagem (Opcional)</Label>
            <p className="text-xs text-muted-foreground -mt-1">Uma foto sua, da sua equipe ou do seu espaço para acompanhar o texto.</p>
            
            <div className="flex flex-col gap-4 mt-2">
              <div className="flex flex-col gap-2">
                <Label htmlFor="historyImageUrl" className="text-xs text-muted-foreground">URL da Imagem (Opção 1)</Label>
                <div className="relative">
                  <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="historyImageUrl"
                    value={data.historyImage || ""}
                    onChange={(e) => onChange({ ...data, historyImage: e.target.value })}
                    className="bg-background border-border/50 h-10 pl-9 focus-visible:ring-1"
                    placeholder="Cole o link da imagem aqui..."
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="historyImageUpload" className="text-xs text-muted-foreground">Fazer Upload (Opção 2)</Label>
                <div className="relative">
                  <Input
                    id="historyImageUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleHistoryImageUpload}
                    disabled={isUploading}
                    className="sr-only"
                  />
                  <Label
                    htmlFor="historyImageUpload"
                    className="flex items-center justify-center gap-2 w-full h-10 px-4 rounded-md border border-border/50 bg-background hover:bg-muted/50 cursor-pointer transition-colors text-sm font-medium"
                  >
                    {isUploading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Upload className="h-4 w-4 text-muted-foreground" />}
                    {isUploading ? "Enviando..." : "Escolher arquivo do computador"}
                  </Label>
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
                    onChange={handleHistoryImageUpload} 
                  />
                  {data.historyImage && data.historyImage.startsWith('data:image') ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={data.historyImage} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-50" />
                  ) : null}
                  <div className="flex flex-col items-center gap-1 text-muted-foreground relative z-0">
                    <Upload className="h-5 w-5" />
                    <span className="text-xs font-medium">Clique para enviar imagem</span>
                  </div>
                </div>
              </div>
            </div>
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
