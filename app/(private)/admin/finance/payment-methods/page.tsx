// app/(private)/admin/finance/payment-methods/page.tsx
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PaymentMethodsRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/finance/settings");
  }, [router]);

  return null;
}
