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

export function GeneralSettings() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [docType, setDocType] = useState<"CNPJ" | "CPF">("CNPJ");

  const [formData, setFormData] = useState({
    companyName: "",
    tradeName: "",
    document: "",
    contactPhone: "",
  });

  // 🔥 CACHE: Armazena CPF e CNPJ separadamente
  const [cpfCache, setCpfCache] = useState("");
  const [cnpjCache, setCnpjCache] = useState("");

  const [whatsappFromMessages, setWhatsappFromMessages] = useState("");
  const [emailFromSecurity, setEmailFromSecurity] = useState("");

  // Busca os dados do banco quando o componente carrega
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
          });
          setWhatsappFromMessages(data.whatsapp || "");
          setEmailFromSecurity(session?.user?.email || "");

          // 🔥 Detecta automaticamente se é CPF ou CNPJ
          const cleanDoc = data.document?.replace(/\D/g, "") || "";
          if (cleanDoc.length > 0) {
            if (cleanDoc.length <= 11) {
              setDocType("CPF");
              setCpfCache(data.document); // Salva no cache
            } else {
              setDocType("CNPJ");
              setCnpjCache(data.document); // Salva no cache
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

  // Função para formatar CPF e CNPJ enquanto digita
  const handleDocumentChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");

    if (docType === "CPF") {
      v = v.slice(0, 11);
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d)/, "$1.$2");
      v = v.replace(/(\d{3})(\d{1,2})$/, "$1-$2");
      setFormData({ ...formData, document: v });
      setCpfCache(v); // 🔥 Salva no cache enquanto digita
    } else {
      v = v.slice(0, 14);
      v = v.replace(/^(\d{2})(\d)/, "$1.$2");
      v = v.replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3");
      v = v.replace(/\.(\d{3})(\d)/, ".$1/$2");
      v = v.replace(/(\d{4})(\d)/, "$1-$2");
      setFormData({ ...formData, document: v });
      setCnpjCache(v); // 🔥 Salva no cache enquanto digita
    }
  };

  // Função para formatar Telefone enquanto digita
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");

    if (v.length <= 10) {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{4})(\d)/g, "$1-$2");
    } else {
      v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
      v = v.replace(/(\d{5})(\d)/g, "$1-$2");
    }
    setFormData({ ...formData, contactPhone: v.slice(0, 15) });
  };

  // 🔥 ALTERNAR ENTRE CPF E CNPJ (COM CACHE INTELIGENTE)
  const toggleDocType = () => {
    if (docType === "CNPJ") {
      // Mudando de CNPJ → CPF
      setDocType("CPF");
      // Restaura o CPF do cache (se existir)
      setFormData({ ...formData, document: cpfCache });
    } else {
      // Mudando de CPF → CNPJ
      setDocType("CNPJ");
      // Restaura o CNPJ do cache (se existir)
      setFormData({ ...formData, document: cnpjCache });
    }
  };

  // Salva as alterações no banco
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

  // Loading state
  if (loading) {
    return (
      <Card className="border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-sm">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 bg-transparent shadow-none md:border md:bg-card md:shadow-sm">
      <CardHeader className="px-0 pt-0 md:pt-6 md:px-6">
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Building className="h-5 w-5 text-primary" />
          Dados da Empresa
        </CardTitle>
        <CardDescription>
          Configure as informações principais da sua empresa.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-6 px-0 pb-0 md:pb-6 md:px-6">
        {/* 🔥 NOME DE EXIBIÇÃO (VISÍVEL PARA CLIENTES) */}
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

        {/* RAZÃO SOCIAL / NOME COMPLETO + DOCUMENTO */}
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

        {/* Informações de Contato */}
        <div className="grid sm:grid-cols-3 gap-4 pt-6 mt-2 border-t border-border">
          {/* Telefone Fixo */}
          <div className="grid gap-2">
            <Label htmlFor="contactPhone">Contato</Label>
            <Input
              id="contactPhone"
              value={formData.contactPhone}
              onChange={handlePhoneChange}
              placeholder="(00) 00000-0000"
            />
          </div>

          {/* WhatsApp (Apenas Leitura) */}
          <div className="grid gap-2">
            <Label htmlFor="whatsapp" className="text-muted-foreground">
              WhatsApp Principal
            </Label>
            <Input
              id="whatsapp"
              value={whatsappFromMessages}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0" />
              Altere na aba "Mensagens"
            </p>
          </div>

          {/* E-mail (Apenas Leitura) */}
          <div className="grid gap-2">
            <Label htmlFor="email" className="text-muted-foreground">
              E-mail Administrativo
            </Label>
            <Input
              id="email"
              value={emailFromSecurity}
              disabled
              className="bg-muted text-muted-foreground cursor-not-allowed"
            />
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3 shrink-0" />
              Altere na aba "Acesso"
            </p>
          </div>
        </div>

        {/* 🔥 BOTÃO DE SALVAR */}
        <div className="flex justify-end pt-4 border-t border-border">
          <Button onClick={handleSave} disabled={saving} className="min-w-32">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Salvar Alterações
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
