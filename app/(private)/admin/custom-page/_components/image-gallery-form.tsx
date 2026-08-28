"use client";

import { useState } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Camera, Image as ImageIcon, LoaderLines, X, ArrowInUpSquareHalf, Link as LinkIcon } from "@boxicons/react";
import { compressImage } from "@/lib/image-utils";
import { uploadImageAction } from "@/app/actions/upload-image";
import { toast } from "sonner";

export function ImageGalleryForm({
  profile, setProfile,
  theme, setTheme,
  proSiteConfig, setProSiteConfig
}: any) {

  // Local loading states
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const [isUploadingWallpaper, setIsUploadingWallpaper] = useState(false);
  const [isUploadingSlide, setIsUploadingSlide] = useState(false);
  const [isUploadingHistory, setIsUploadingHistory] = useState(false);

  // New URL state for slide
  const [newSlideUrl, setNewSlideUrl] = useState("");

  const heroImages: string[] = proSiteConfig?.presentation?.proHeroImages || (proSiteConfig?.presentation?.proHeroImage ? [proSiteConfig.presentation.proHeroImage] : []);

  // Upload Handlers
  const handleUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    setLoading: (val: boolean) => void,
    onSuccess: (url: string) => void,
    type: "avatar" | "logo" | "banner" | "wallpaper" | "professional" | "history",
    size: number = 1200
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setLoading(true);
      try {
        const compressedBase64 = await compressImage(file, size);
        const res = await uploadImageAction(compressedBase64, type);
        if (res.success && res.url) {
          onSuccess(res.url);
        } else {
          toast.error(res.error || "Erro ao fazer upload da imagem");
        }
      } catch (error) {
        console.error(`Erro ao processar imagem para ${type}:`, error);
        toast.error("Erro inesperado ao processar imagem.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleAddSlideUrl = () => {
    if (!newSlideUrl.trim()) return;
    if (heroImages.length >= 5) {
      toast.error("Você pode adicionar no máximo 5 imagens.");
      return;
    }
    const newImages = [...heroImages, newSlideUrl.trim()];
    setProSiteConfig((prev: any) => ({
      ...prev,
      presentation: {
        ...prev?.presentation,
        proHeroImages: newImages,
        proHeroImage: newImages.length > 0 ? newImages[0] : ""
      }
    }));
    setNewSlideUrl("");
  };

  const handleRemoveSlideImage = (index: number) => {
    const newImages = [...heroImages];
    newImages.splice(index, 1);
    setProSiteConfig((prev: any) => ({
      ...prev,
      presentation: {
        ...prev?.presentation,
        proHeroImages: newImages,
        proHeroImage: newImages.length > 0 ? newImages[0] : ""
      }
    }));
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      <div className="flex flex-col gap-2">
        <h3 className="text-xl font-bold flex items-center gap-2 text-foreground">
          Galeria de Imagens
        </h3>
        <p className="text-sm text-muted-foreground">
          Gerencie todas as imagens da sua página em um só lugar. Fazer upload de arquivos ou colar links (URLs) permite economizar espaço de armazenamento.
        </p>
      </div>

      <div className="flex flex-col gap-8 mt-4">

        {/* IDENTIDADE GLOBAL */}
        <div className="flex flex-col gap-4">
          <h4 className="text-sm font-semibold text-foreground">Identidade Global</h4>
          <p className="text-xs text-muted-foreground -mt-3">
            Estas imagens representam a sua marca principal e aparecem em várias telas, como agendamento e topo do site.
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
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  onChange={(e) => handleUpload(e, setIsUploadingAvatar, (url) => setProfile((p: any) => ({ ...p, image: url })), "avatar", 500)}
                  disabled={isUploadingAvatar}
                />
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <p className="font-medium text-xs text-foreground">Avatar (Perfil)</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer">
                      Fazer upload
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={(e) => handleUpload(e, setIsUploadingAvatar, (url) => setProfile((p: any) => ({ ...p, image: url })), "avatar", 500)}
                      />
                    </label>
                    {profile.image && (
                      <button onClick={() => setProfile((p: any) => ({ ...p, image: "" }))} className="text-[11px] font-semibold text-destructive hover:underline w-fit">
                        Remover
                      </button>
                    )}
                  </div>
                  <Input
                    value={profile.image || ""}
                    onChange={(e) => setProfile((p: any) => ({ ...p, image: e.target.value }))}
                    className="bg-background h-8 text-xs focus-visible:ring-1"
                    placeholder="Ou cole a URL da imagem aqui..."
                  />
                </div>
              </div>
            </div>

            {/* Logo */}
            <div className="flex items-center gap-4 flex-1 border border-border/50 p-4 rounded-lg bg-muted/20">
              <div className="h-16 w-24 rounded-md bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
                {profile.logo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.logo} alt="Logo" className="w-full h-full object-contain" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                )}
                {isUploadingLogo && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-20">
                    <LoaderLines className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  onChange={(e) => handleUpload(e, setIsUploadingLogo, (url) => setProfile((p: any) => ({ ...p, logo: url })), "logo")}
                  disabled={isUploadingLogo}
                />
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <p className="font-medium text-xs text-foreground">Logo (Marca)</p>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer">
                      Fazer upload
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={(e) => handleUpload(e, setIsUploadingLogo, (url) => setProfile((p: any) => ({ ...p, logo: url })), "logo")}
                      />
                    </label>
                    {profile.logo && (
                      <button onClick={() => setProfile((p: any) => ({ ...p, logo: "" }))} className="text-[11px] font-semibold text-destructive hover:underline w-fit">
                        Remover
                      </button>
                    )}
                  </div>
                  <Input
                    value={profile.logo || ""}
                    onChange={(e) => setProfile((p: any) => ({ ...p, logo: e.target.value }))}
                    className="bg-background h-8 text-xs focus-visible:ring-1"
                    placeholder="Ou cole a URL do logo aqui..."
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Banner */}
          <div className="flex items-center gap-4 border border-border/50 p-4 rounded-lg bg-muted/20">
            <div className="h-20 w-48 rounded-md bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
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
              <input
                type="file"
                accept="image/png, image/jpeg"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                onChange={(e) => handleUpload(e, setIsUploadingBanner, (url) => setProfile((p: any) => ({ ...p, bannerImage: url })), "banner")}
                disabled={isUploadingBanner}
              />
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <p className="font-medium text-xs text-foreground">Imagem de Capa (Banner)</p>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer">
                    Fazer upload
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={(e) => handleUpload(e, setIsUploadingBanner, (url) => setProfile((p: any) => ({ ...p, bannerImage: url })), "banner")}
                    />
                  </label>
                  {profile.bannerImage && (
                    <button onClick={() => setProfile((p: any) => ({ ...p, bannerImage: "" }))} className="text-[11px] font-semibold text-destructive hover:underline w-fit">
                      Remover
                    </button>
                  )}
                </div>
                <Input
                  value={profile.bannerImage || ""}
                  onChange={(e) => setProfile((p: any) => ({ ...p, bannerImage: e.target.value }))}
                  className="bg-background h-8 text-xs focus-visible:ring-1"
                  placeholder="Ou cole a URL do banner aqui..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* LINK NA BIO E TEMA */}
        <div className="flex flex-col gap-4 pt-4 border-t">
          <h4 className="text-sm font-semibold text-foreground">Wallpaper do Link na Bio</h4>
          <p className="text-xs text-muted-foreground -mt-3">
            O fundo que aparecerá caso você opte por usar uma imagem customizada de Wallpaper.
          </p>

          <div className="flex items-center gap-4 border border-border/50 p-4 rounded-lg bg-muted/20">
            <div className="h-32 w-24 rounded-md bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
              {theme.backgroundImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={theme.backgroundImage} alt="Wallpaper" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
              )}
              {isUploadingWallpaper && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-20">
                  <LoaderLines className="w-6 h-6 text-white animate-spin" />
                </div>
              )}
              <input
                type="file"
                accept="image/png, image/jpeg"
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                onChange={(e) => handleUpload(e, setIsUploadingWallpaper, (url) => setTheme((p: any) => ({ ...p, backgroundImage: url })), "wallpaper")}
                disabled={isUploadingWallpaper}
              />
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              <div className="flex flex-col gap-2">
                <div className="flex gap-2 items-center">
                  <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer">
                    Fazer upload
                    <input
                      type="file"
                      accept="image/png, image/jpeg"
                      className="hidden"
                      onChange={(e) => handleUpload(e, setIsUploadingWallpaper, (url) => setTheme((p: any) => ({ ...p, backgroundImage: url })), "wallpaper")}
                    />
                  </label>
                  {theme.backgroundImage && (
                    <button onClick={() => setTheme((p: any) => ({ ...p, backgroundImage: "" }))} className="text-[11px] font-semibold text-destructive hover:underline w-fit">
                      Remover
                    </button>
                  )}
                </div>
                <Input
                  value={theme.backgroundImage || ""}
                  onChange={(e) => setTheme((p: any) => ({ ...p, backgroundImage: e.target.value }))}
                  className="bg-background h-8 text-xs focus-visible:ring-1"
                  placeholder="Ou cole a URL do wallpaper aqui..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* SITE INSTITUCIONAL */}
        <div className="flex flex-col gap-4 pt-4 border-t">
          <h4 className="text-sm font-semibold text-foreground">Site Institucional</h4>
          <p className="text-xs text-muted-foreground -mt-3">
            Imagens que compõem o layout e as seções da sua landing page profissional.
          </p>

          <div className="flex flex-col gap-4">

            {/* Slider Images */}
            <div className="flex flex-col gap-4 border border-border/50 p-4 rounded-lg bg-muted/20">
              <div className="flex flex-col">
                <p className="font-medium text-xs text-foreground">Imagens do Slider / Banner Lateral (Máx: 5)</p>
                <p className="text-[11px] text-muted-foreground">Adicione até 5 fotos para criar um slide automático no topo do site.</p>
              </div>

              <div className="flex flex-wrap gap-3">
                {heroImages.map((img, idx) => (
                  <div key={idx} className="relative h-24 w-24 rounded-lg border border-border/50 overflow-hidden group">
                    <img src={img} alt={`Slide ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => handleRemoveSlideImage(idx)}
                      className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Remover imagem"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}

                {heroImages.length < 5 && (
                  <div className="relative h-24 w-24 rounded-lg border-2 border-dashed border-border flex items-center justify-center overflow-hidden hover:bg-muted/30 transition-colors cursor-pointer">
                    <input
                      type="file"
                      accept="image/png, image/jpeg, image/webp"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      onChange={(e) => handleUpload(e, setIsUploadingSlide, (url) => {
                        const newImages = [...heroImages, url];
                        setProSiteConfig((prev: any) => ({
                          ...prev,
                          presentation: {
                            ...prev?.presentation,
                            proHeroImages: newImages,
                            proHeroImage: newImages.length > 0 ? newImages[0] : ""
                          }
                        }));
                      }, "professional")}
                      disabled={isUploadingSlide}
                    />
                    {isUploadingSlide ? (
                      <LoaderLines className="h-5 w-5 animate-spin text-muted-foreground" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-muted-foreground">
                        <ArrowInUpSquareHalf className="h-5 w-5" />
                        <span className="text-[10px] font-medium text-center px-1">Upload</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {heroImages.length < 5 && (
                <div className="flex gap-2 items-center max-w-sm mt-2">
                  <div className="relative flex-1">
                    <LinkIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      value={newSlideUrl}
                      onChange={(e) => setNewSlideUrl(e.target.value)}
                      className="bg-background border-border/50 h-8 pl-8 text-xs focus-visible:ring-1"
                      placeholder="Adicionar por Link URL..."
                      onKeyDown={(e) => e.key === "Enter" && handleAddSlideUrl()}
                    />
                  </div>
                  <button
                    onClick={handleAddSlideUrl}
                    disabled={!newSlideUrl.trim()}
                    className="bg-muted hover:bg-muted/80 text-foreground text-[11px] font-medium px-3 h-8 rounded-md border border-border/50 disabled:opacity-50"
                  >
                    Adicionar
                  </button>
                </div>
              )}
            </div>

            {/* History Image */}
            <div className="flex items-center gap-4 border border-border/50 p-4 rounded-lg bg-muted/20">
              <div className="h-20 w-32 rounded-md bg-muted border-2 border-dashed border-border flex items-center justify-center relative overflow-hidden group cursor-pointer hover:bg-muted/80 transition-colors shrink-0">
                {proSiteConfig?.history?.historyImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={proSiteConfig.history.historyImage} alt="História" className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-5 w-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                )}
                {isUploadingHistory && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center rounded-xl z-20">
                    <LoaderLines className="w-6 h-6 text-white animate-spin" />
                  </div>
                )}
                <input
                  type="file"
                  accept="image/png, image/jpeg"
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10"
                  onChange={(e) => handleUpload(e, setIsUploadingHistory, (url) => setProSiteConfig((prev: any) => ({ ...prev, history: { ...prev?.history, historyImage: url } })), "history")}
                  disabled={isUploadingHistory}
                />
              </div>
              <div className="flex flex-col gap-2 w-full max-w-sm">
                <div className="flex flex-col">
                  <p className="font-medium text-xs text-foreground">Imagem da História (Sobre)</p>
                  <p className="text-[11px] text-muted-foreground">Ilustra a seção sobre você ou seu espaço.</p>
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex gap-2 items-center">
                    <label className="text-[11px] font-semibold text-primary hover:underline w-fit cursor-pointer">
                      Fazer upload
                      <input
                        type="file"
                        accept="image/png, image/jpeg"
                        className="hidden"
                        onChange={(e) => handleUpload(e, setIsUploadingHistory, (url) => setProSiteConfig((prev: any) => ({ ...prev, history: { ...prev?.history, historyImage: url } })), "history")}
                      />
                    </label>
                    {proSiteConfig?.history?.historyImage && (
                      <button onClick={() => setProSiteConfig((prev: any) => ({ ...prev, history: { ...prev?.history, historyImage: "" } }))} className="text-[11px] font-semibold text-destructive hover:underline w-fit">
                        Remover
                      </button>
                    )}
                  </div>
                  <Input
                    value={proSiteConfig?.history?.historyImage || ""}
                    onChange={(e) => setProSiteConfig((prev: any) => ({ ...prev, history: { ...prev?.history, historyImage: e.target.value } }))}
                    className="bg-background h-8 text-xs focus-visible:ring-1"
                    placeholder="Ou cole a URL da imagem aqui..."
                  />
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
