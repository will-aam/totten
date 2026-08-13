// app/(private)/admin/custom-page/_components/theme-settings.tsx
"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Palette, Check, Plus, Image as ImageIcon } from "@boxicons/react";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

const SYSTEM_THEMES = [
  {
    id: "solid",
    name: "Cor Sólida",
    css: "bg-slate-200",
    txt: "#0f172a",
    btnBg: "#ffffff",
    btnTxt: "#0f172a",
  },
  {
    id: "aurora",
    name: "Aurora",
    css: "bg-gradient-to-r from-emerald-200 via-teal-300 to-cyan-400",
    txt: "#064e3b",
    btnBg: "#ffffff",
    btnTxt: "#0f766e",
  },
  {
    id: "twilight",
    name: "Crepúsculo",
    css: "bg-gradient-to-tr from-fuchsia-300 via-purple-400 to-violet-500",
    txt: "#ffffff",
    btnBg: "#ffffff",
    btnTxt: "#6b21a8",
  },
  {
    id: "blush",
    name: "Blush",
    css: "bg-gradient-to-br from-rose-100 to-teal-100",
    txt: "#831843",
    btnBg: "#ffffff",
    btnTxt: "#be123c",
  },
  {
    id: "citrus",
    name: "Cítrico",
    css: "bg-gradient-to-r from-amber-200 via-orange-300 to-rose-300",
    txt: "#78350f",
    btnBg: "#ffffff",
    btnTxt: "#c2410c",
  },
];

const SOLID_COLORS = ["#000000", "#FFFFFF", "#2563EB", "#DB2777", "#16A34A"];



export function ThemeSettings({ data, onChange }: any) {
  const handleThemeChange = (theme: (typeof SYSTEM_THEMES)[0]) => {
    onChange({
      ...data,
      id: theme.id,
      css: theme.css,
      textColor: theme.txt,
      buttonBg: theme.btnBg,
      buttonText: theme.btnTxt,
    });
  };

  const setCustomTheme = () => {
    onChange({
      ...data,
      id: "custom",
      css: "",
      textColor: "#ffffff",
      buttonBg: "#ffffff",
      buttonText: "#000000",
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
          <Palette className="h-5 w-5 text-primary" />
          Aparência e Temas
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Escolha um fundo para a sua página e personalize as cores.
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* TEMAS DO SISTEMA */}
        <div className="flex flex-col gap-3">
          <Label className="text-foreground font-medium">
            Temas do Sistema
          </Label>
          <div className="flex overflow-x-auto sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 pb-2 no-scrollbar">
            {SYSTEM_THEMES.map((theme) => (
              <button
                key={theme.id}
                onClick={() => handleThemeChange(theme)}
                className={cn(
                  "relative flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all outline-none shrink-0 w-[120px] sm:w-auto",
                  data.id === theme.id
                    ? "border-primary bg-primary/5"
                    : "border-border/50 bg-card hover:border-primary/50",
                )}
              >
                <div
                  className={cn(
                    "w-full h-24 rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden",
                    theme.id === "solid" && data.id === "solid"
                      ? ""
                      : theme.css,
                  )}
                  style={
                    theme.id === "solid" && data.id === "solid"
                      ? { backgroundColor: data.color }
                      : {}
                  }
                >
                  {data.id === theme.id && (
                    <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                      <div className="bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
                        <Check className="h-4 w-4 text-foreground" />
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-xs font-medium text-foreground">
                  {theme.name}
                </span>
              </button>
            ))}

            {/* BOTÃO TEMA PERSONALIZADO */}
            <button
              onClick={setCustomTheme}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border-2 p-2 transition-all outline-none shrink-0 w-[120px] sm:w-auto",
                data.id === "custom"
                  ? "border-primary bg-primary/5"
                  : "border-border/50 bg-card hover:border-primary/50",
              )}
            >
              <div
                className={cn(
                  "w-full h-24 rounded-lg shadow-sm flex items-center justify-center relative overflow-hidden bg-muted border-2 border-dashed border-border transition-colors",
                  data.id === "custom" && data.backgroundImage ? "bg-cover bg-center border-none" : ""
                )}
                style={
                  data.id === "custom" && data.backgroundImage ? { backgroundImage: `url(${data.backgroundImage})` } : {}
                }
              >
                {(!data.backgroundImage || data.id !== "custom") && (
                  <Plus className="h-6 w-6 text-muted-foreground" />
                )}
                {data.id === "custom" && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                    <div className="bg-background/80 backdrop-blur-sm rounded-full p-1 shadow-sm">
                      <Check className="h-4 w-4 text-foreground" />
                    </div>
                  </div>
                )}
              </div>
              <span className="text-xs font-medium text-foreground">
                Sua Imagem
              </span>
            </button>
          </div>
        </div>

        {/* OPÇÕES DE CUSTOMIZAÇÃO DO WALLPAPER */}
        {data.id === "custom" && (
          <div className="flex flex-col gap-6 pt-2 animate-in fade-in slide-in-from-top-2">
            <Label className="text-foreground font-medium">Seu Wallpaper Personalizado</Label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {/* Upload Didático */}
              <div className="flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl p-6 bg-muted/20 hover:bg-muted/50 transition-colors cursor-pointer group">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <ImageIcon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-medium text-foreground text-center">Fazer Upload</p>
                <p className="text-xs text-muted-foreground text-center mt-1">PNG ou JPG (Máximo 5MB)</p>
              </div>

              {/* Inserção por Link */}
              <div className="flex flex-col gap-3 justify-center">
                <Label className="text-sm font-medium text-foreground">Ou use um Link (URL)</Label>
                <Input
                  placeholder="https://exemplo.com/imagem.jpg"
                  value={data.backgroundImage || ""}
                  onChange={(e) => onChange({ ...data, backgroundImage: e.target.value })}
                  className="bg-background h-11"
                />
                <p className="text-[11px] text-muted-foreground">O preview será atualizado automaticamente ao colar um link de imagem válido.</p>
              </div>
            </div>

            {/* Efeitos de Fundo (Wallpaper) */}
            <div className="flex flex-col gap-5 mt-2">
              <Label className="text-sm font-medium text-foreground">Efeitos Adicionais</Label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-border/50">
                  <Label className="text-xs font-medium cursor-pointer" htmlFor="bg-noise-custom">Textura Granulada</Label>
                  <Switch id="bg-noise-custom" checked={!!data.bgNoise} onCheckedChange={(checked) => onChange({ ...data, bgNoise: checked })} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground font-medium">Intensidade do Borrão (Blur)</Label>
                  <Select
                    value={data.bgBlur === true ? "3xl" : (data.bgBlur || "none")}
                    onValueChange={(val) => onChange({ ...data, bgBlur: val })}
                  >
                    <SelectTrigger className="bg-background h-10 w-full text-xs">
                      <SelectValue placeholder="Selecione o desfoque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="sm">Leve</SelectItem>
                      <SelectItem value="md">Médio</SelectItem>
                      <SelectItem value="xl">Intenso</SelectItem>
                      <SelectItem value="3xl">Extremo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* COR DO FUNDO SÓLIDO (Só aparece se o tema for Sólido) */}
        {data.id === "solid" && (
          <div className="flex flex-col gap-6 pt-2 animate-in fade-in slide-in-from-top-2">
            <Label className="text-foreground font-medium">Estilo de Papel de Parede</Label>

            {/* Preenchimento: Sólido ou Gradiente e Direção */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground font-medium">Preenchimento</Label>
                <Select
                  value={data.bgStyle || "solid"}
                  onValueChange={(val) => onChange({ ...data, bgStyle: val })}
                >
                  <SelectTrigger className="bg-background h-10 w-full text-xs">
                    <SelectValue placeholder="Selecione o preenchimento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solid">Sólido</SelectItem>
                    <SelectItem value="gradient">Gradiente</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {(data.bgStyle || "solid") === "gradient" && (
                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground font-medium">Direção do Gradiente</Label>
                  <Select
                    value={data.bgGradientDirection || "to-b"}
                    onValueChange={(val) => onChange({ ...data, bgGradientDirection: val })}
                  >
                    <SelectTrigger className="bg-background h-10 w-full text-xs">
                      <SelectValue placeholder="Selecione a direção" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="to-b">Descendente</SelectItem>
                      <SelectItem value="to-t">Ascendente</SelectItem>
                      <SelectItem value="radial">Radial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>

            {/* Cores */}
            <div className="flex flex-col gap-3">
              <Label className="text-xs text-muted-foreground">Cores</Label>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-border/50 shadow-sm cursor-pointer hover:scale-110 transition-transform">
                    <input
                      type="color"
                      value={data.color || "#ffffff"}
                      onChange={(e) => onChange({ ...data, color: e.target.value })}
                      className="absolute -top-2 -left-2 h-16 w-16 cursor-pointer"
                    />
                  </div>
                  <span className="text-xs text-muted-foreground uppercase">{data.color}</span>
                </div>

                {(data.bgStyle || "solid") === "gradient" && (
                  <div className="flex items-center gap-2">
                    <div className="relative h-10 w-10 rounded-full overflow-hidden border-2 border-border/50 shadow-sm cursor-pointer hover:scale-110 transition-transform">
                      <input
                        type="color"
                        value={data.bgGradientColor2 || "#000000"}
                        onChange={(e) => onChange({ ...data, bgGradientColor2: e.target.value })}
                        className="absolute -top-2 -left-2 h-16 w-16 cursor-pointer"
                      />
                    </div>
                    <span className="text-xs text-muted-foreground uppercase">{data.bgGradientColor2}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Efeitos de Fundo */}
            <div className="flex flex-col gap-5 mt-2">
              <Label className="text-sm font-medium text-foreground">Efeitos Adicionais</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="flex items-center justify-between bg-muted/20 p-3 rounded-lg border border-border/50">
                  <Label className="text-xs font-medium cursor-pointer" htmlFor="bg-noise-solid">Textura Granulada</Label>
                  <Switch id="bg-noise-solid" checked={!!data.bgNoise} onCheckedChange={(checked) => onChange({ ...data, bgNoise: checked })} />
                </div>

                <div className="flex flex-col gap-2">
                  <Label className="text-xs text-muted-foreground font-medium">Intensidade do Borrão (Blur)</Label>
                  <Select
                    value={data.bgBlur === true ? "3xl" : (data.bgBlur || "none")}
                    onValueChange={(val) => onChange({ ...data, bgBlur: val })}
                  >
                    <SelectTrigger className="bg-background h-10 w-full text-xs">
                      <SelectValue placeholder="Selecione o desfoque" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="sm">Leve</SelectItem>
                      <SelectItem value="md">Médio</SelectItem>
                      <SelectItem value="xl">Intenso</SelectItem>
                      <SelectItem value="3xl">Extremo</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* CORES AVANÇADAS */}
        <div className="flex flex-col gap-5 pt-2">


          <div className="flex flex-wrap gap-6">
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">
                Cor do Texto Geral
              </Label>
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border/50 shadow-sm cursor-pointer">
                  <input
                    type="color"
                    value={data.textColor}
                    onChange={(e) =>
                      onChange({ ...data, textColor: e.target.value })
                    }
                    className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer"
                  />
                </div>
                <span className="text-xs uppercase text-muted-foreground">
                  {data.textColor}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ESTILO DOS BOTÕES */}
        <div className="flex flex-col gap-5 pt-2">
          <Label className="text-foreground font-medium flex items-center gap-2">
            Estilo dos Botões
          </Label>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* ESTILO (Sólido, Vidro, Contorno) */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground font-medium">Aparência</Label>
              <Select
                value={data.buttonStyle || "solid"}
                onValueChange={(val) => onChange({ ...data, buttonStyle: val })}
              >
                <SelectTrigger className="bg-background h-10 w-full text-xs">
                  <SelectValue placeholder="Selecione a aparência" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólido</SelectItem>
                  <SelectItem value="glass">Vidro</SelectItem>
                  <SelectItem value="outline">Contorno</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* ARREDONDAMENTO */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground font-medium">Arredondamento de Canto</Label>
              <Select
                value={data.buttonRounding || "pill"}
                onValueChange={(val) => onChange({ ...data, buttonRounding: val })}
              >
                <SelectTrigger className="bg-background h-10 w-full text-xs">
                  <SelectValue placeholder="Selecione o arredondamento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="square">Quadrado</SelectItem>
                  <SelectItem value="round">Redondo</SelectItem>
                  <SelectItem value="more-round">Mais Arredondado</SelectItem>
                  <SelectItem value="pill">Completamente</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* SOMBRA (Somente para Sólido) */}
            {(data.buttonStyle || "solid") === "solid" && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground font-medium">Sombra do Botão</Label>
                <Select
                  value={data.buttonShadow || "none"}
                  onValueChange={(val) => onChange({ ...data, buttonShadow: val })}
                >
                  <SelectTrigger className="bg-background h-10 w-full text-xs">
                    <SelectValue placeholder="Selecione a sombra" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nenhum</SelectItem>
                    <SelectItem value="soft">Macio</SelectItem>
                    <SelectItem value="strong">Forte</SelectItem>
                    <SelectItem value="hard">Duro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* CORES DOS BOTÕES (Dinâmicas) */}
          <div className="flex flex-wrap gap-6 pt-2">
            {/* COR DO FUNDO / CONTORNO (Não aparece no Vidro) */}
            {(data.buttonStyle || "solid") !== "glass" && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">
                  {(data.buttonStyle || "solid") === "outline" ? "Cor do Contorno" : "Cor do Botão"}
                </Label>
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border/50 shadow-sm cursor-pointer">
                    <input
                      type="color"
                      value={data.buttonBg || "#ffffff"}
                      onChange={(e) => onChange({ ...data, buttonBg: e.target.value })}
                      className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer"
                    />
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">
                    {data.buttonBg || "#ffffff"}
                  </span>
                </div>
              </div>
            )}

            {/* COR DO TEXTO */}
            <div className="flex flex-col gap-2">
              <Label className="text-xs text-muted-foreground">Cor do Texto</Label>
              <div className="flex items-center gap-2">
                <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border/50 shadow-sm cursor-pointer">
                  <input
                    type="color"
                    value={data.buttonText || "#000000"}
                    onChange={(e) => onChange({ ...data, buttonText: e.target.value })}
                    className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer"
                  />
                </div>
                <span className="text-xs uppercase text-muted-foreground">
                  {data.buttonText || "#000000"}
                </span>
              </div>
            </div>

            {/* COR DA SOMBRA (Apenas se Sólido e Sombra != none) */}
            {(data.buttonStyle || "solid") === "solid" && (data.buttonShadow || "none") !== "none" && (
              <div className="flex flex-col gap-2">
                <Label className="text-xs text-muted-foreground">Cor da Sombra</Label>
                <div className="flex items-center gap-2">
                  <div className="relative h-8 w-8 rounded-full overflow-hidden border border-border/50 shadow-sm cursor-pointer">
                    <input
                      type="color"
                      value={data.buttonShadowColor || "#000000"}
                      onChange={(e) => onChange({ ...data, buttonShadowColor: e.target.value })}
                      className="absolute -top-2 -left-2 h-12 w-12 cursor-pointer"
                    />
                  </div>
                  <span className="text-xs uppercase text-muted-foreground">
                    {data.buttonShadowColor || "#000000"}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
