// app/(private)/admin/custom-page/_components/global-settings.tsx
"use client";

import { useState } from "react";
import { Camera, Image as ImageIcon, LoaderLines, Globe } from "@boxicons/react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import { uploadImageAction } from "@/app/actions/upload-image";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface GlobalSettingsProps {
  profile: any;
  setProfile: (profile: any) => void;
}

export function GlobalSettings({ profile, setProfile }: GlobalSettingsProps) {
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
          <Globe className="h-6 w-6 text-primary" />
          Configurações Globais
        </h3>
        <p className="text-sm text-muted-foreground">
          Estas informações são o coração da sua marca. Elas aparecerão no Link na Bio, Site Profissional e Autoagendamento.
        </p>
      </div>

      <div className="flex flex-col gap-8 mt-4">

        {/* IMAGENS */}
        <div className="flex flex-col gap-4 border border-border/50 p-6 rounded-xl bg-card shadow-sm">
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
        <div className="flex flex-col gap-6 border border-border/50 p-6 rounded-xl bg-card shadow-sm">
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
                Biografia / Sobre / Nossa História
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

      </div>
    </div>
  );
}
