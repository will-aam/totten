"use client";

import { cn } from "@/lib/utils";

interface PhoneMockupProps {
  profile: any;
  theme: any;
  socials: any;
  links: any;
  activeTab: "global" | "link-bio" | "professional-site" | "booking-site";
  proSiteConfig: any;
}

export function PhoneMockup({
  profile,
  activeTab,
}: PhoneMockupProps) {
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

  return (
    <div className="relative mx-auto" style={{ width: "320px", height: "650px" }}>
      {/* Fake Notch */}
      <div className="absolute top-0 inset-x-0 h-6 bg-black z-30 rounded-b-2xl w-40 mx-auto" />
      
      <div className="w-[320px] h-[650px] bg-black rounded-[3rem] border-8 border-black shadow-2xl relative overflow-hidden ring-1 ring-border/20 mx-auto flex">
        <iframe 
          src={url} 
          className="w-full h-full border-none bg-white" 
          title="Prévia do Site"
        />
      </div>
    </div>
  );
}
