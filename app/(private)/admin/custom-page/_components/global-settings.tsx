// app/(private)/admin/custom-page/_components/global-settings.tsx
"use client";

import { useState } from "react";
import { Camera, Image as ImageIcon, LoaderLines, Instagram, Facebook, Youtube, Whatsapp, Globe, Capitalize } from "@boxicons/react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const FONTS = [
  { id: "font-sans", name: "Inter (Padrão)", value: "Inter, sans-serif" },
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

interface GlobalSettingsProps {
  profile: any;
  setProfile: (profile: any) => void;
  socials?: any;
  setSocials?: (socials: any) => void;
  globalContact?: any;
  theme?: any;
  setTheme?: (theme: any) => void;
}

export function GlobalSettings({ profile, setProfile, socials, setSocials, globalContact, theme, setTheme }: GlobalSettingsProps) {
  const handleValueChange = (id: string, text: string) => {
    if (setSocials && socials) {
      setSocials({ ...socials, values: { ...socials.values, [id]: text } });
    }
  };
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);

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
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
          Configurações Globais
        </h3>
        <p className="text-sm text-muted-foreground">
          Estas informações são o coração da sua marca. Elas aparecerão no Link na Bio, Site Profissional e Autoagendamento.
        </p>
      </div>

      <div className="flex flex-col gap-8 mt-4">

        {/* IMAGENS */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-foreground">Imagens Principais</h4>
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Avatar */}
            <div className="flex items-center gap-4 flex-1 border border-border/50 p-4 rounded-lg bg-muted/20">
              <div className="h-16 w-16 rounded-full bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
                {profile.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.image} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                )}
                {isUploadingAvatar && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-full z-20">
                    <LoaderLines className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={handleAvatarUpload} disabled={isUploadingAvatar} />
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-xs text-foreground">Avatar (Perfil)</p>
                <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer mt-1">
                  Fazer upload
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleAvatarUpload} />
                </label>
                {profile.image && (
                  <button onClick={() => setProfile({ ...profile, image: "" })} className="text-[11px] font-semibold text-destructive hover:underline w-fit mt-1">
                    Remover
                  </button>
                )}
              </div>
            </div>

            {/* Banner */}
            <div className="flex items-center gap-4 flex-1 border border-border/50 p-4 rounded-lg bg-muted/20">
              <div className="h-16 w-24 rounded-md bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
                {profile.bannerImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.bannerImage} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                )}
                {isUploadingBanner && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-20">
                    <LoaderLines className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <input type="file" accept="image/png, image/jpeg" className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" onChange={handleBannerUpload} disabled={isUploadingBanner} />
              </div>
              <div className="flex flex-col">
                <p className="font-medium text-xs text-foreground">Imagem de Capa (Banner)</p>
                <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer mt-1">
                  Fazer upload
                  <input type="file" accept="image/png, image/jpeg" className="hidden" onChange={handleBannerUpload} />
                </label>
                {profile.bannerImage && (
                  <button onClick={() => setProfile({ ...profile, bannerImage: "" })} className="text-[11px] font-semibold text-destructive hover:underline w-fit mt-1">
                    Remover
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* TEXTOS */}
        <div className="flex flex-col gap-6">
          <h4 className="text-sm font-semibold text-foreground">Informações de Texto</h4>

          <div className="flex flex-col gap-2">
            <Label htmlFor="name" className="text-foreground font-medium">
              Nome de Exibição
            </Label>
            <Input
              id="name"
              value={profile.name || ""}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              className="bg-background h-11"
              placeholder="Ex: Clínica Totten"
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end">
              <Label htmlFor="bio" className="text-foreground font-medium">
                Descreva brevemente seu negócio
              </Label>
              <span
                className={`text-[11px] font-medium ${(profile.bio?.length || 0) > 300 ? "text-destructive" : "text-muted-foreground"}`}
              >
                {profile.bio?.length || 0} caracteres
              </span>
            </div>
            <Textarea
              id="bio"
              value={profile.bio || ""}
              onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
              className="bg-background min-h-32 resize-none"
              placeholder="Descreva seu negócio, sua história ou missão. Este texto será adaptado para o Link na Bio e para a seção Sobre do Site Profissional."
            />
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    disabled
                    className="rounded-l-none bg-background border-border/50 h-11 focus-visible:ring-1"
                    placeholder="DDD + Número"
                  />
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">
                  Editado em Configurações &gt; Dados da Empresa
                </p>
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

      </div>
    </div>
  );
}
