/* app/totem/check-in/page.tsx */

"use client";

import { Suspense } from "react";
import TotemCheckInContent from "./totem-check-in-content";

export default function TotemCheckInPage() {
  return (
    <Suspense fallback={<div className="p-6">Carregando...</div>}>
      <TotemCheckInContent />
    </Suspense>
  );
}
