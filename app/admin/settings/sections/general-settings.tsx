// app/admin/settings/sections/general-settings.tsx
"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Building, Info, Repeat, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useIsMobile } from "@/hooks/use-mobile";

export function GeneralSettings() {
  const { data: session } = useSession();
  const isMobile = useIsMobile();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState<"CNPJ" | "CPF">("CNPJ");

  const [formData, setFormData] = useState({
    companyName: "",
    tradeName: "",
    document: "",
    contactPhone: "",
    whatsapp: "",
  });

  const [cpfCache, setCpfCache] = useState("");
  const [cnpjCache, setCnpjCache] = useState("");

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            companyName: data.companyName || "",
            tradeName: data.tradeName || "",
            document: data.document || "",
            contactPhone: data.contactPhone || "",
            whatsapp: data.whatsapp || "",
          });
          const cleanDoc = data.document?.replace(/\D/g, "") || "";
          if (cleanDoc.length > 0) {
            if (cleanDoc.length <= 11) {
              setDocType("CPF");
              setCpfCache(data.document);
            } else {
              setDocType("CNPJ");
              setCnpjCache(data.document);
            }
          }
        } else {
          toast.error("Erro ao carregar configurações");
        }
      } catch (error) {
        console.error("Erro ao buscar configurações:", error);
        toast.error("Erro de conexão");
      } finally {
        setLoading(false);
      }
    };

    fetchSettings();
  }, [session]);

  // 🔥 MÁSCARA INTELIGENTE PARA TELEFONE (BR)
  const formatPhone = (value: string) => {
    let v = value.replace(/\D/g, "");
    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{4})(\d)/g, "$1-$2");
    } else {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{5})(\d)/g, "$1-$2");
    }
    return v.slice(0, 15); // Limita ao tamanho máximo de (XX) XXXXX-XXXX
  };

  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (docType === "CPF") {
      v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setFormData({ ...formData, document: v });
      setCpfCache(v);
    } else {
      v = v.slice(0, 14);
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
      setFormData({ ...formData, document: v });
      setCnpjCache(v);
    }
  };

  // Aplica a máscara nos inputs
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, contactPhone: formatPhone(e.target.value) });
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, whatsapp: formatPhone(e.target.value) });
  };

  const toggleDocType = () => {
    if (docType === "CNPJ") {
      setDocType("CPF");
      setFormData({ ...formData, document: cpfCache });
    } else {
      setDocType("CNPJ");
      setFormData({ ...formData, document: cnpjCache });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Configurações salvas com sucesso!");
      } else {
        toast.error(data.error || "Erro ao salvar");
      }
    } catch (error) {
      console.error("Erro ao salvar:", error);
      toast.error("Erro de conexão");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="border-none shadow-none py-0 sm:py-6">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-none shadow-none py-0 sm:py-6">
      <CardHeader className="px-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-card-foreground mb-2">
              <Building className="h-5 w-5 text-primary" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Configure as informações principais da sua empresa.
            </CardDescription>
          </div>
          <div
            className={`flex ${isMobile ? "hidden" : "justify-end items-center gap-2 shrink-0"}`}
          >
            <Button onClick={handleSave} disabled={saving} className="min-w-32">
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="grid gap-6 px-0 pb-0 md:pb-6 md:px-6">
        <div className="grid gap-2">
          <Label htmlFor="tradeName" className="font-medium">
            Nome de Exibição (Visível para os clientes)
          </Label>
          <Input
            id="tradeName"
            value={formData.tradeName}
            onChange={(e) =>
              setFormData({ ...formData, tradeName: e.target.value })
            }
            placeholder="Ex: Clínica Bem-Estar"
          />
          <p className="text-xs text-muted-foreground">
            Este nome aparece na sidebar, totem e mensagens para os clientes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="grid gap-2">
            <Label htmlFor="companyName">
              {docType === "CNPJ" ? "Razão Social" : "Nome Completo"}
            </Label>
            <Input
              id="companyName"
              value={formData.companyName}
              onChange={(e) =>
                setFormData({ ...formData, companyName: e.target.value })
              }
              placeholder={
                docType === "CNPJ"
                  ? "Ex: Clínica Bem-Estar LTDA"
                  : "Ex: Maria da Silva"
              }
            />
          </div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="document">{docType}</Label>
              <button
                type="button"
                onClick={toggleDocType}
                className="text-[10px] text-primary flex items-center gap-1 hover:underline font-medium uppercase tracking-wider"
              >
                <Repeat className="h-3 w-3" />
                Mudar para {docType === "CNPJ" ? "CPF" : "CNPJ"}
              </button>
            </div>
            <Input
              id="document"
              value={formData.document}
              onChange={handleDocumentChange}
              placeholder={
                docType === "CNPJ" ? "00.000.000/0001-00" : "000.000.000-00"
              }
            />
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          {/* Telefone Fixo/Contato Secundário */}
          <div className="grid gap-2">
            <Label htmlFor="contactPhone">Telefone Fixo / Outro</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={handlePhoneChange}
              placeholder="(00) 0000-0000"
              maxLength={15}
            />
          </div>

          {/* WhatsApp Principal com Prefixo Visual */}
          <div className="grid gap-2">
            <Label htmlFor="whatsapp">WhatsApp Principal</Label>
            <div className="flex gap-2">
              <Input
                id="whatsapp"
                value={formData.whatsapp}
                onChange={handleWhatsappChange}
                placeholder="(00) 00000-0000"
                maxLength={15}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </CardContent>
      <button
        onClick={handleSave}
        disabled={loading}
        className={`${!isMobile ? "hidden" : "fixed bottom-0 right-4 md:bottom-8 md:right-8 h-14 w-14 flex items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all duration-300 z-50 translate-y-16 opacity-100 hover:scale-110"} `}
      >
        <Save className="h-6 w-6" strokeWidth={2.5} />
      </button>
    </Card>
  );
}
