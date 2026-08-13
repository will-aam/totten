"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Phone, ArrowLeft, ArrowRight } from "@boxicons/react";

export function ClientLoginView({ org, theme }: { org: any, theme: any }) {
  const [phone, setPhone] = useState("");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.replace(/\D/g, "");
    
    if (cleanPhone.length >= 10) {
      // Mock login: save state to localStorage to simulate being logged in
      if (typeof window !== "undefined") {
        localStorage.setItem(`totten_client_logged_in_${org.slug}`, "true");
        localStorage.setItem(`totten_client_phone_${org.slug}`, cleanPhone);
      }
      
      // Redirect to the cliente page
      router.push(`/${org.slug}/cliente`);
    } else {
      alert("Por favor, digite um número de WhatsApp válido.");
    }
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, "");
    if (value.length > 11) value = value.slice(0, 11);

    if (value.length > 2) {
      value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
    }
    if (value.length > 9) {
      value = `${value.slice(0, 10)}-${value.slice(10)}`;
    }

    setPhone(value);
  };

  const isDark = theme.css?.includes("900") || theme.css?.includes("black") || theme.css?.includes("slate-950");

  return (
    <div 
      className={cn("min-h-screen flex flex-col items-center justify-center p-4 relative font-sans", theme.css)}
      style={{ color: theme.textColor }}
    >
      <button 
        onClick={() => router.back()}
        className="absolute top-6 left-6 p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="h-6 w-6" />
      </button>

      <div className={cn(
        "w-full max-w-md p-8 rounded-3xl shadow-xl flex flex-col items-center text-center",
        isDark ? "bg-white/5 border border-white/10" : "bg-white border border-black/5"
      )}>
        {/* Logo / Header */}
        <div className="h-16 w-16 rounded-2xl bg-black/5 dark:bg-white/10 flex items-center justify-center mb-6">
          <Phone className="h-8 w-8 opacity-70" />
        </div>
        
        <h1 className="text-2xl font-bold mb-2">Área do Cliente</h1>
        <p className="text-sm opacity-70 mb-8 max-w-[280px]">
          Para acessar seus agendamentos, pacotes e fazer avaliações em {org.name}, digite seu WhatsApp.
        </p>

        <form onSubmit={handleSubmit} className="w-full space-y-6">
          <div className="space-y-2 text-left">
            <Label htmlFor="phone" className="font-medium opacity-80">WhatsApp</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50 text-sm font-medium">
                +55
              </span>
              <Input
                id="phone"
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={handlePhoneChange}
                className={cn(
                  "pl-11 h-12 text-lg rounded-xl focus-visible:ring-1",
                  isDark ? "bg-black/20 border-white/10" : "bg-black/5 border-black/10"
                )}
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={phone.replace(/\D/g, "").length < 10}
            className="w-full h-12 rounded-xl font-bold flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:pointer-events-none disabled:hover:scale-100"
            style={{ 
              backgroundColor: theme.primaryColor, 
              color: isDark ? "#000" : "#fff" // Simplification for now, we can use a better contrast checker if needed
            }}
          >
            Entrar <ArrowRight className="h-5 w-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
