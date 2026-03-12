// app/totem/idle/page.tsx
"use client";

import { Suspense } from "react";
import TotemIdleContent from "./totem-idle-content";

export default function TotemIdlePage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <TotemIdleContent />
    </Suspense>
  );
}
