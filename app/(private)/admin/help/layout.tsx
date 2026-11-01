import React from "react";
import { FloatingWhatsAppButton } from "./_components/floating-whatsapp-button";

export default function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <FloatingWhatsAppButton />
    </>
  );
}

