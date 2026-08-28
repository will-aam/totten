// app/(private)/admin/custom-page/_components/global-settings.tsx
"use client";

import { useState, useEffect } from "react";
import { Camera, Image as ImageIcon, LoaderLines, Instagram, Facebook, Youtube, Whatsapp, Globe, Capitalize, Pin, Search, Clock } from "@boxicons/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { getSelfServiceSettingsAction } from "@/app/actions/settings";
import { ImageGalleryForm } from "./image-gallery-form";
import { ChevronRight, ChevronLeft } from "lucide-react";

function RulesSummaryPreview({ data, onChange }: any) {
  const [rulesData, setRulesData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchRules() {
      const response = await getSelfServiceSettingsAction();
      if (response.success) {
        setRulesData(response.data);
      }
      setIsLoading(false);
    }
    fetchRules();
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderLines className="h-4 w-4 animate-spin" /> Carregando horários...
      </div>
    );
  }

  const defaultRule = rulesData?.scheduleRules?.find((r: any) => r.isDefault) || rulesData?.scheduleRules?.[0];
  const schedule = defaultRule?.schedule;

  if (!schedule || schedule.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Nenhum horário configurado em Regras e Horários.
      </div>
    );
  }

  const referenceValues = schedule.find((s: any) => s.isOpen);
  const openDays = schedule.filter((s: any) => s.isOpen).map((s: any) => s.dayOfWeek);

  if (openDays.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        Fechado todos os dias configurado em Regras e Horários.
      </div>
    );
  }

  const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];
  const summaryDays = openDays.map((d: number) => dayNames[d]).join(", ");
  const hasBreak = !!referenceValues?.breakStart;

  const summaryString = referenceValues
    ? `Das ${referenceValues.openTime || "--:--"} às ${referenceValues.closeTime || "--:--"}${hasBreak && referenceValues.breakStart ? `, intervalo de ${referenceValues.breakStart} às ${referenceValues.breakEnd}` : ""}, funcionando de ${summaryDays}.`
    : "Fechado todos os dias.";

  if (data?.businessHours !== summaryString && summaryString) {
    setTimeout(() => {
      onChange({ ...data, businessHours: summaryString });
    }, 0);
  }

  return (
    <div className="bg-background border rounded-lg p-3 text-sm flex flex-col gap-2">
      <p className="font-semibold text-foreground/80">Resumo configurado:</p>
      <p className="text-muted-foreground leading-snug">
        {summaryString}
      </p>
      <div className="mt-2">
        <Link href="/admin/self-service" className="text-primary hover:underline text-xs font-medium">
          Editar em Regras e Horários
        </Link>
      </div>
    </div>
  );
}


const FONTS = [
  { id: "font-sans", name: "Inter (Padrão)", value: "Inter, sans-serif" },
  { id: "philosopher", name: "Philosopher", value: "Philosopher, serif" },
  { id: "sora", name: "Sora", value: "Sora, sans-serif" },
  { id: "notosans", name: "Noto Sans", value: "'Noto Sans', sans-serif" },
  { id: "epilogue", name: "Epilogue", value: "Epilogue, sans-serif" },
  { id: "oxanium", name: "Oxanium", value: "Oxanium, cursive" },
  { id: "roboto", name: "Roboto", value: "Roboto, sans-serif" },
  { id: "lora", name: "Lora", value: "Lora, serif" },
];
import { compressImage } from "@/lib/image-utils";
import { uploadImageAction } from "@/app/actions/upload-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";


export function GlobalSettings({
  profile,
  setProfile,
  socials,
  setSocials,
  globalContact,
  setGlobalContact,
  theme,
  setTheme,
  globalLocation,
  setGlobalLocation,
  proSiteConfig,
  setProSiteConfig,
  onSave,
  isSaving,
}: any) {
  const handleValueChange = (id: string, text: string) => {
    if (setSocials && socials) {
      setSocials({ ...socials, values: { ...socials.values, [id]: text } });
    }
  };
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [showGallery, setShowGallery] = useState(false);

  const [cep, setCep] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);

  const getGalleryStatus = () => {
    let score = 0;
    
    // Nível 1: Identidade Global (Mais importante) - 75% total (25% cada)
    if (profile?.image) score += 25;
    if (profile?.logo) score += 25;
    if (profile?.bannerImage) score += 25;

    // Nível 2: Slide do Site (15%)
    const heroImages = proSiteConfig?.presentation?.proHeroImages || (proSiteConfig?.presentation?.proHeroImage ? [proSiteConfig.presentation.proHeroImage] : []);
    if (heroImages.length > 0) score += 15;

    // Nível 3: História (5%)
    if (proSiteConfig?.history?.historyImage) score += 5;

    // Nível 4: Wallpaper Link na Bio (5%)
    if (theme?.backgroundImage) score += 5;

    if (score === 100) return { label: "Completo", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", barColor: "bg-emerald-500", percentage: score };
    if (score >= 75) return { label: "Excelente", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20", barColor: "bg-emerald-500", percentage: score };
    if (score >= 40) return { label: "Bom", color: "bg-amber-500/10 text-amber-600 border-amber-500/20", barColor: "bg-amber-500", percentage: score };
    return { label: "Incompleto", color: "bg-rose-500/10 text-rose-600 border-rose-500/20", barColor: "bg-rose-500", percentage: score };
  };

  const galleryStatus = getGalleryStatus();

  const handleSearchCep = async () => {
    const cleanCep = cep.replace(/\D/g, "");
    if (cleanCep.length !== 8) return;

    setIsSearchingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const result = await response.json();

      if (!result.erro && setGlobalLocation && globalLocation) {
        const fullAddress = `${result.logradouro}, Número, ${result.bairro}, ${result.localidade} - ${result.uf}, ${result.cep}`;
        setGlobalLocation({ ...globalLocation, address: fullAddress });
      }
    } catch (error) {
      console.error("Erro ao buscar CEP", error);
    } finally {
      setIsSearchingCep(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingAvatar(true);
      try {
        const compressedBase64 = await compressImage(file, 500);
        const res = await uploadImageAction(compressedBase64, "avatar");
        if (res.success && res.url) {
          setProfile({ ...profile, image: res.url });
        } else {
          toast.error(res.error || "Erro ao fazer upload da imagem");
        }
      } catch (error) {
        console.error("Erro ao processar imagem de perfil:", error);
        toast.error("Erro inesperado ao processar imagem.");
      } finally {
        setIsUploadingAvatar(false);
      }
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploadingBanner(true);
      try {
        const compressedBase64 = await compressImage(file, 1200);
        const res = await uploadImageAction(compressedBase64, "banner");
        if (res.success && res.url) {
          setProfile({ ...profile, bannerImage: res.url });
        } else {
          toast.error(res.error || "Erro ao fazer upload da imagem");
        }
      } catch (error) {
        console.error("Erro ao processar imagem de banner:", error);
        toast.error("Erro inesperado ao processar banner.");
      } finally {
        setIsUploadingBanner(false);
      }
    }
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-300">

      {showGallery ? (
        <div className="w-full animate-in fade-in slide-in-from-right-4 duration-300 relative pb-16">
          <Button
            variant="ghost"
            onClick={() => setShowGallery(false)}
            className="mb-6 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-5 w-5 mr-1" /> Voltar para Configurações Globais
          </Button>

          <ImageGalleryForm
            profile={profile} setProfile={setProfile}
            theme={theme} setTheme={setTheme}
            proSiteConfig={proSiteConfig} setProSiteConfig={setProSiteConfig}
          />
          <div className="flex justify-end mt-6">
            <Button onClick={onSave} disabled={isSaving} className="min-w-32">
              {isSaving ? "Salvando..." : "Salvar Configurações"}
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-6 relative pb-16">
          <div className="flex flex-col gap-2">
            <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
              Configurações Globais
            </h3>
            <p className="text-sm text-muted-foreground">
              Estas informações são o coração da sua marca. Elas aparecerão no Link na Bio, Site Profissional e Autoagendamento.
            </p>
          </div>

          <div className="flex flex-col gap-8 mt-4">

            <div className="flex flex-col gap-2">
              <Label htmlFor="name" className="text-foreground font-medium">
                Nome da Empresa
              </Label>
              <Input
                id="name"
                value={profile.name || ""}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="bg-background h-11"
                placeholder="Ex: Clínica Totten"
                required
                minLength={3}
                maxLength={30}
              />
            </div>

            {/* Menu para Galeria de Imagens */}
            <div
              onClick={() => setShowGallery(true)}
              className="flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl cursor-pointer hover:bg-muted/50 hover:border-primary/50 transition-colors shadow-sm"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <ImageIcon className="h-5 w-5" />
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-foreground text-sm">Galeria de Imagens</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground hidden sm:block">
                      Logos, Avatares e Fotos
                    </span>
                    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${galleryStatus.color}`}>
                      {galleryStatus.label}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${galleryStatus.barColor}`} style={{ width: `${galleryStatus.percentage}%` }} />
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </div>
            </div>



            {/* TIPOGRAFIA */}
            {theme && setTheme && (
              <div className="flex flex-col gap-6">
                <h4 className="text-sm font-semibold text-foreground">Tipografia</h4>
                <div className="flex flex-col gap-3">
                  <Label className="text-foreground font-medium flex items-center gap-2">
                    <Capitalize className="h-4 w-4" /> Fonte do Texto Principal
                  </Label>
                  <Select
                    value={theme.fontFamily || "Inter, sans-serif"}
                    onValueChange={(val) => setTheme({ ...theme, fontFamily: val })}
                  >
                    <SelectTrigger className="h-11">
                      <SelectValue placeholder="Selecione uma fonte" />
                    </SelectTrigger>
                    <SelectContent>
                      {FONTS.map((font) => (
                        <SelectItem key={font.id} value={font.value} style={{ fontFamily: font.value }}>
                          {font.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}

            {/* REDES SOCIAIS E CONTATOS */}
            {socials && setSocials && (
              <div className="flex flex-col gap-6">
                <h4 className="text-sm font-semibold text-foreground">Redes Sociais e Contatos</h4>

                <div className="flex flex-col gap-4 max-w-md">
                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground font-medium flex items-center gap-2 text-sm">
                      <Whatsapp className="h-4 w-4 text-muted-foreground" /> WhatsApp
                    </Label>
                    <div className="flex items-center">
                      <span className="bg-muted text-muted-foreground px-3 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
                        +55
                      </span>
                      <Input
                        value={globalContact?.whatsapp || ""}
                        onChange={(e) => {
                          if (setGlobalContact) {
                            setGlobalContact({ ...globalContact, whatsapp: e.target.value });
                          }
                        }}
                        className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
                        placeholder="DDD + Número"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground font-medium flex items-center gap-2 text-sm">
                      <Instagram className="h-4 w-4 text-muted-foreground" /> Instagram
                    </Label>
                    <div className="flex items-center">
                      <span className="bg-muted text-muted-foreground px-3 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
                        @
                      </span>
                      <Input
                        value={socials.values.instagram || ""}
                        onChange={(e) => handleValueChange("instagram", e.target.value)}
                        className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
                        placeholder="seuusuario"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground font-medium flex items-center gap-2 text-sm">
                      <Facebook className="h-4 w-4 text-muted-foreground" /> Facebook
                    </Label>
                    <div className="flex items-center">
                      <span className="bg-muted text-muted-foreground px-3 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
                        facebook.com/
                      </span>
                      <Input
                        value={socials.values.facebook || ""}
                        onChange={(e) => handleValueChange("facebook", e.target.value)}
                        className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
                        placeholder="suapagina"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <Label className="text-foreground font-medium flex items-center gap-2 text-sm">
                      <Youtube className="h-4 w-4 text-muted-foreground" /> YouTube
                    </Label>
                    <div className="flex items-center">
                      <span className="bg-muted text-muted-foreground px-3 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
                        youtube.com/@
                      </span>
                      <Input
                        value={socials.values.youtube || ""}
                        onChange={(e) => handleValueChange("youtube", e.target.value)}
                        className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
                        placeholder="seucanal"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 md:col-span-2">
                    <Label className="text-foreground font-medium flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-muted-foreground" /> Meu Site
                    </Label>
                    <div className="flex items-center">
                      <span className="bg-muted text-muted-foreground px-3 border border-border/50 border-r-0 rounded-l-md text-sm h-11 flex items-center shrink-0">
                        https://
                      </span>
                      <Input
                        value={socials.values.website || ""}
                        onChange={(e) => handleValueChange("website", e.target.value)}
                        className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
                        placeholder="www.seusite.com.br"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LOCALIZAÇÃO E ENDEREÇO */}
            {globalLocation && setGlobalLocation && (
              <div className="flex flex-col gap-6 mt-4">
                <div>
                  <h4 className="text-sm font-semibold flex items-center gap-2 text-foreground">
                    Localização e Contato
                  </h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    Informe onde você atende e como os clientes podem te achar.
                  </p>
                </div>

                {/* CEP */}
                <div className="flex flex-col gap-3 p-4 border border-border/50 rounded-xl bg-muted/10">
                  <Label className="text-sm font-medium">Buscar Endereço (CEP)</Label>
                  <div className="flex gap-2">
                    <Input
                      value={cep}
                      onChange={(e) => setCep(e.target.value)}
                      placeholder="00000-000"
                      className="bg-background max-w-[200px]"
                      maxLength={9}
                    />
                    <Button
                      variant="secondary"
                      onClick={handleSearchCep}
                      disabled={isSearchingCep || cep.replace(/\D/g, "").length !== 8}
                    >
                      {isSearchingCep ? <LoaderLines className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                      <span className="ml-2 hidden sm:inline">Buscar</span>
                    </Button>
                  </div>
                  <p className="text-[11px] text-muted-foreground">O endereço será preenchido abaixo. Você pode editá-lo se necessário.</p>
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="address" className="text-foreground font-medium">
                    Endereço Completo
                  </Label>
                  <Textarea
                    id="address"
                    value={globalLocation.address || ""}
                    onChange={(e) => setGlobalLocation({ ...globalLocation, address: e.target.value })}
                    className="bg-background border-border/50 focus-visible:ring-1 min-h-[80px]"
                    placeholder="Rua, Número, Bairro, Cidade - Estado, CEP"
                  />
                </div>

                <div className="flex flex-col gap-2">
                  <Label htmlFor="mapUrl" className="text-foreground font-medium">
                    Link do Google Maps
                  </Label>
                  <Input
                    id="mapUrl"
                    value={globalLocation.mapUrl || ""}
                    onChange={(e) => setGlobalLocation({ ...globalLocation, mapUrl: e.target.value })}
                    className="bg-background border-border/50 h-11 focus-visible:ring-1"
                    placeholder="Ex: https://goo.gl/maps/..."
                  />
                </div>

                {/* HORÁRIO */}
                <div className="flex flex-col gap-4 p-5 border border-border/50 rounded-xl bg-muted/10 mt-2">
                  <Label className="text-foreground font-medium flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    Horário de Funcionamento
                  </Label>

                  <RulesSummaryPreview data={globalLocation} onChange={setGlobalLocation} />

                  <div className="flex flex-col sm:flex-row sm:items-center gap-6 pt-4 mt-2 border-t border-border/50">
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={globalLocation.showBusinessHoursSite !== false}
                        onCheckedChange={(c) => setGlobalLocation({ ...globalLocation, showBusinessHoursSite: c })}
                      />
                      <span className="text-xs text-foreground font-medium">Exibir no Site Profissional?</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={globalLocation.showBusinessHoursBooking !== false}
                        onCheckedChange={(c) => setGlobalLocation({ ...globalLocation, showBusinessHoursBooking: c })}
                      />
                      <span className="text-xs text-foreground font-medium">Exibir na Agenda?</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end mt-6">
              <Button onClick={onSave} disabled={isSaving} className="min-w-32">
                {isSaving ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
