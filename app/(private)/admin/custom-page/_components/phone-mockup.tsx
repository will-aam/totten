"use client";

import { cn } from "@/lib/utils";
import { RefreshCw } from "lucide-react";
import { useState } from "react";

interface PhoneMockupProps {
  profile: any;
  theme: any;
  socials: any;
  links: any;
  activeTab: "global" | "link-bio" | "professional-site" | "booking-site";
  proSiteConfig: any;
  previewKey?: number;
}

export function PhoneMockup({
  profile,
  activeTab,
  previewKey = 0,
}: PhoneMockupProps) {
  const [localKey, setLocalKey] = useState(0);

  if (!profile?.slug) {
    return (
      <div className="relative mx-auto flex items-center justify-center bg-black rounded-[3rem] border-8 border-black shadow-2xl ring-1 ring-border/20" style={{ width: "320px", height: "650px" }}>
        <p className="text-white/50 text-sm">Carregando prévia...</p>
      </div>
    );
  }

  let url = `/${profile.slug}`;
  if (activeTab === "professional-site") {
    url = `/${profile.slug}/site`;
  } else if (activeTab === "booking-site") {
    url = `/${profile.slug}/agendar`;
  }

  // Append cache-busting param so iframe reloads on save
  const iframeSrc = `${url}?t=${previewKey + localKey}`;

  return (
    <div className="relative mx-auto" style={{ width: "320px", height: "650px" }}>
      {/* Fake Notch */}
      <div className="absolute top-0 inset-x-0 h-6 bg-black z-30 rounded-b-2xl w-40 mx-auto" />

      {/* Refresh button */}
      <button
        onClick={() => setLocalKey(k => k + 1)}
        className="absolute bottom-3 right-3 z-30 bg-black/60 hover:bg-black/80 text-white rounded-full p-2 transition-colors"
        title="Atualizar prévia"
      >
        <RefreshCw className="h-4 w-4" />
      </button>

      <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto flex">
        <iframe
          key={iframeSrc}
          src={iframeSrc}
          className="w-full h-full border-none bg-white"
          title="Prévia do Site"
        />
      </div>
    </div>
  );
}
