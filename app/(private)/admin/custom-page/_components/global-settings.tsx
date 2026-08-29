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
import { GlobalImagesBlock } from "./global-images-block";
import { ChevronRight, ChevronLeft } from "lucide-react";

const StepBadge = ({ step, required }: { step: number; required?: boolean }) => (
  <div className="flex items-center gap-2 mb-2">
    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shadow-sm">
      {step}
    </span>
    {required ? (
      <span className="text-[10px] uppercase font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Obrigatório</span>
    ) : (
      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Opcional</span>
    )}
  </div>
);

const SocialVisibilityToggles = ({ platformId, socials, setSocials, hasValue }: { platformId: string; socials: any; setSocials: any; hasValue: boolean }) => {
  const vis = socials?.visibility?.[platformId] || { site: false, booking: false, bio: false };
  const updateVis = (field: string, val: boolean) => {
    if (!setSocials || !hasValue) return;
    setSocials({
      ...socials,
      visibility: {
        ...(socials.visibility || {}),
        [platformId]: { ...vis, [field]: val }
      }
    });
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-5 mt-2 pl-1">
      <div className="flex items-center gap-2.5">
        <Switch disabled={!hasValue} checked={hasValue && vis.site === true} onCheckedChange={(c) => updateVis('site', c)} className="scale-90 origin-left" />
        <span className="text-xs text-foreground font-medium -ml-1">Site</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch disabled={!hasValue} checked={hasValue && vis.bio === true} onCheckedChange={(c) => updateVis('bio', c)} className="scale-90 origin-left" />
        <span className="text-xs text-foreground font-medium -ml-1">Link Bio</span>
      </div>
      <div className="flex items-center gap-2.5">
        <Switch disabled={!hasValue} checked={hasValue && vis.booking === true} onCheckedChange={(c) => updateVis('booking', c)} className="scale-90 origin-left" />
        <span className="text-xs text-foreground font-medium -ml-1">Agenda</span>
      </div>
    </div>
  );
};

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
          Editar em Grades de Horários
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

  const [cep, setCep] = useState("");
  const [isSearchingCep, setIsSearchingCep] = useState(false);



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
  const handleSave = () => {
    if (!profile.name || profile.name.trim().length < 3) {
      toast.error("O Nome da Empresa é obrigatório e deve ter no mínimo 3 caracteres.");
      document.getElementById("step-1")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    if (!profile.image || !profile.bannerImage || !profile.logo) {
      toast.error("As Imagens Globais (Avatar, Banner e Logomarca) são obrigatórias.");
      document.getElementById("step-2")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }

    onSave();
  };

  return (
    <div className="flex flex-col animate-in fade-in duration-300 relative pb-16">
      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-2 border-b border-border/50 pb-4">
          <h3 className="text-2xl font-bold flex items-center gap-2 text-foreground">
            Configurações Globais
          </h3>
          <p className="text-sm text-muted-foreground">
            Siga as etapas abaixo para configurar as informações essenciais que representarão sua marca.
          </p>
        </div>

        <div className="flex flex-col gap-10 mt-2">
          {/* STEP 1 */}
          <div id="step-1" className="flex flex-col gap-2 scroll-m-20 p-5 border border-border/50 rounded-xl bg-card shadow-sm">
            <StepBadge step={1} required />
            <Label htmlFor="name" className="text-foreground font-semibold text-base mb-2">
              Nome da Empresa
            </Label>
            <Input
              id="name"
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="bg-background h-11 max-w-md"
              placeholder="Ex: Clínica Totten"
              required
              minLength={3}
              maxLength={30}
            />
            <p className="text-xs text-muted-foreground mt-1">Este nome aparecerá em todos os seus canais (de 3 a 30 caracteres).</p>
          </div>

          {/* STEP 2 */}
          <div id="step-2" className="flex flex-col scroll-m-20">
            <GlobalImagesBlock profile={profile} setProfile={setProfile}>
              <StepBadge step={2} required />
            </GlobalImagesBlock>
          </div>

          {/* STEP 3 - TIPOGRAFIA */}
          {theme && setTheme && (
            <div id="step-3" className="flex flex-col scroll-m-20 p-5 border border-border/50 rounded-xl bg-card shadow-sm">
              <StepBadge step={3} />
              <h4 className="text-base font-semibold text-foreground mb-4">Tipografia</h4>
              <div className="flex flex-col gap-3 max-w-md">
                <Label className="text-foreground font-medium flex items-center gap-2">
                  <Capitalize className="h-4 w-4" /> Fonte do Texto Principal
                </Label>
                <Select
                  value={theme.fontFamily || "Inter, sans-serif"}
                  onValueChange={(val) => setTheme({ ...theme, fontFamily: val })}
                >
                  <SelectTrigger className="h-11 bg-background">
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

          {/* STEP 4 - LOCALIZAÇÃO */}
          {globalLocation && setGlobalLocation && (
            <div id="step-4" className="flex flex-col scroll-m-20 p-5 border border-border/50 rounded-xl bg-card shadow-sm">
              <StepBadge step={4} />
              <h4 className="text-base font-semibold flex items-center gap-2 text-foreground mb-4">
                Localização
              </h4>

              <div className="flex flex-col gap-4 max-w-md">
                <div className="flex flex-col gap-2">
                  <Label htmlFor="mapUrl" className="text-foreground font-medium flex items-center gap-2">
                    <Pin className="h-4 w-4" /> Link do Google Maps
                  </Label>
                  <Input
                    id="mapUrl"
                    value={globalLocation.mapUrl || ""}
                    onChange={(e) => setGlobalLocation({ ...globalLocation, mapUrl: e.target.value })}
                    className="bg-background border-border/50 h-11 focus-visible:ring-1"
                    placeholder="Ex: https://goo.gl/maps/..."
                  />
                </div>

                {!globalLocation.address?.trim() ? (
                  <div className="flex flex-col gap-2 p-4 mt-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                    <p className="text-sm text-amber-800 dark:text-amber-400/90 font-medium">
                      Você ainda não definiu um endereço.
                    </p>
                    <Link href="/admin/settings" className="text-sm font-semibold text-amber-600 dark:text-amber-300 hover:underline flex items-center gap-1">
                      Configurar endereço <ChevronRight className="h-4 w-4" />
                    </Link>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1 p-4 mt-2 bg-muted/20 border border-border/50 rounded-xl">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Endereço atual</p>
                    <p className="text-sm text-foreground mb-1">{globalLocation.address}</p>
                    <Link href="/admin/settings" className="text-[11px] font-semibold text-primary hover:underline">
                      Alterar em Configurações
                    </Link>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* STEP 5 - HORÁRIO DE FUNCIONAMENTO */}
          {globalLocation && setGlobalLocation && (
            <div id="step-5" className="flex flex-col scroll-m-20 p-5 border border-border/50 rounded-xl bg-card shadow-sm">
              <StepBadge step={5} />
              <h4 className="text-base font-semibold flex items-center gap-2 text-foreground mb-4">
                Horário de Funcionamento
              </h4>

              <div className="flex flex-col gap-4 max-w-lg">
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

          {/* STEP 6 - REDES SOCIAIS */}
          {socials && setSocials && (
            <div id="step-6" className="flex flex-col scroll-m-20 p-5 border border-border/50 rounded-xl bg-card shadow-sm">
              <StepBadge step={6} />
              <h4 className="text-base font-semibold text-foreground mb-4">Redes Sociais</h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl">
                <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border/50 bg-muted/10">
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
                  <SocialVisibilityToggles platformId="whatsapp" socials={socials} setSocials={setSocials} hasValue={!!globalContact?.whatsapp} />
                </div>

                <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border/50 bg-muted/10">
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
                  <SocialVisibilityToggles platformId="instagram" socials={socials} setSocials={setSocials} hasValue={!!socials.values.instagram} />
                </div>

                <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border/50 bg-muted/10">
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
                  <SocialVisibilityToggles platformId="facebook" socials={socials} setSocials={setSocials} hasValue={!!socials.values.facebook} />
                </div>

                <div className="flex flex-col gap-1.5 p-4 rounded-xl border border-border/50 bg-muted/10">
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
                  <SocialVisibilityToggles platformId="youtube" socials={socials} setSocials={setSocials} hasValue={!!socials.values.youtube} />
                </div>

                <div className="flex flex-col gap-1.5 md:col-span-2 p-4 rounded-xl border border-border/50 bg-muted/10">
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
                  <SocialVisibilityToggles platformId="website" socials={socials} setSocials={setSocials} hasValue={!!socials.values.website} />
                </div>
              </div>
            </div>
          )}

        </div>
      </div>

      <div className="flex justify-end mt-10 sticky bottom-4 z-50 bg-background/80 backdrop-blur-md p-4 rounded-xl border border-border/50 shadow-md">
        <Button onClick={handleSave} disabled={isSaving} className="min-w-32 shadow-sm font-semibold">
          {isSaving ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </div>
  );
}
