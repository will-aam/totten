"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronDown, Camera, Image as ImageIcon, LoaderLines } from "@boxicons/react";
import { toast } from "sonner";
import { compressImage } from "@/lib/image-utils";
import { uploadImageAction } from "@/app/actions/upload-image";

interface GlobalImagesBlockProps {
  profile: any;
  setProfile: (profile: any) => void;
}

export function GlobalImagesBlock({ profile, setProfile }: GlobalImagesBlockProps) {
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

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
    <div className="flex flex-col p-5 border border-border/50 bg-card rounded-xl w-full max-w-[1600px] mx-auto shadow-sm">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <ImageIcon className="w-4 h-4 text-primary" />
          <h3 className="font-semibold text-foreground text-sm">
            Imagens Globais da Marca
          </h3>
        </div>
        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {isExpanded && (
        <div className="flex flex-col mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
          <p className="text-xs text-muted-foreground mb-4">
            Defina seu Avatar e Banner. Eles podem ser exibidos no seu Link na Bio ou Site Profissional dependendo do layout escolhido.
          </p>
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
      )}
    </div>
  );
}
