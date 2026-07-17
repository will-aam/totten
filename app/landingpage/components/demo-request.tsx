"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, CheckCircle2, Mail, MessageCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function DemoRequestSection() {
  const [channel, setChannel] = useState<"email" | "whatsapp">("email");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    company: "",
    contact: "",
    message: "",
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim() || !form.contact.trim()) {
      toast.error("Preencha nome e contato para continuar.");
      return;
    }
    if (channel === "email" && !/^\S+@\S+\.\S+$/.test(form.contact)) {
      toast.error("Informe um e-mail válido.");
      return;
    }
    if (channel === "whatsapp" && form.contact.replace(/\D/g, "").length < 10) {
      toast.error("Informe um WhatsApp válido com DDD.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success(
        "Solicitação recebida! Nossa equipe entrará em contato em breve.",
      );
      setForm({ name: "", company: "", contact: "", message: "" });
    }, 700);
  }

  return (
    <section
      id="demo"
      className="mx-auto w-full px-8 py-24 sm:px-28 lg:px-28 bg-zinc-900/10"
    >
      <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
        <div>
          <Badge
            variant="outline"
            className="border-totten bg-card-totten text-xs text-zinc-soft"
          >
            Demonstração
          </Badge>
          <h2 className="mt-4 bg-linear-to-b from-white to-zinc-400 bg-clip-text text-3xl font-semibold tracking-tight text-transparent sm:text-4xl pb-1">
            Veja o Totten funcionando na sua operação.
          </h2>
          <p className="mt-4 text-zinc-soft">
            Agende uma demonstração personalizada com um especialista. Mostramos
            como o Totten se adapta ao seu fluxo em menos de 30 minutos.
          </p>
          <ul className="mt-6 space-y-3 text-sm">
            {[
              "Diagnóstico da sua operação atual",
              "Demonstração ao vivo dos módulos",
              "Plano de implantação personalizado",
              "Sem compromisso, sem cartão",
            ].map((i) => (
              <li key={i} className="flex items-center gap-2 text-zinc-soft">
                <CheckCircle2 className="h-4 w-4 text-white" /> {i}
              </li>
            ))}
          </ul>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-totten bg-zinc-950 p-6 shadow-2xl shadow-black/40 sm:p-8"
        >
          <div className="grid grid-cols-2 gap-1 rounded-lg border border-totten bg-[#0c0c0e] p-1">
            <button
              type="button"
              onClick={() => setChannel("email")}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                channel === "email"
                  ? "bg-white text-black"
                  : "text-zinc-soft hover:text-white"
              }`}
            >
              <Mail className="h-3.5 w-3.5" /> E-mail
            </button>
            <button
              type="button"
              onClick={() => setChannel("whatsapp")}
              className={`flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-colors ${
                channel === "whatsapp"
                  ? "bg-white text-black"
                  : "text-zinc-soft hover:text-white"
              }`}
            >
              <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
            </button>
          </div>

          <div className="mt-5 grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="demo-name" className="text-xs text-zinc-soft">
                Nome completo
              </Label>
              <Input
                id="demo-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Seu nome"
                maxLength={100}
                required
                className="border-totten bg-[#0c0c0e]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="demo-company" className="text-xs text-zinc-soft">
                Empresa
              </Label>
              <Input
                id="demo-company"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
                placeholder="Nome do seu negócio"
                maxLength={100}
                className="border-totten bg-[#0c0c0e]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="demo-contact" className="text-xs text-zinc-soft">
                {channel === "email" ? "E-mail" : "WhatsApp"}
              </Label>
              <Input
                id="demo-contact"
                type={channel === "email" ? "email" : "tel"}
                inputMode={channel === "email" ? "email" : "tel"}
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                placeholder={
                  channel === "email" ? "voce@empresa.com" : "(11) 99999-9999"
                }
                maxLength={120}
                required
                className="border-totten bg-[#0c0c0e]"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="demo-message" className="text-xs text-zinc-soft">
                Conte um pouco sobre sua operação (opcional)
              </Label>
              <Textarea
                id="demo-message"
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder="Nº de profissionais, principais desafios..."
                maxLength={500}
                rows={3}
                className="border-totten bg-[#0c0c0e]"
              />
            </div>
          </div>

          <Button
            type="submit"
            size="lg"
            disabled={loading}
            className="mt-6 w-full bg-white text-black hover:bg-zinc-200"
          >
            {loading ? "Enviando..." : "Solicitar demonstração"}
            {!loading && <ArrowRight className="ml-1 h-4 w-4" />}
          </Button>
          <p className="mt-3 text-center text-[11px] text-zinc-soft">
            Ao enviar, você concorda com a nossa política de privacidade.
          </p>
        </form>
      </div>
    </section>
  );
}
