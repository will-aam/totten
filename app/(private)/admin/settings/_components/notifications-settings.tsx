"use client";

import { useState } from "react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Volume, Devices, Envelope } from "@boxicons/react";

export function NotificationsSettings() {
  const [soundAlert, setSoundAlert] = useState(true);
  const [pushAlert, setPushAlert] = useState(true);
  const [emailSummary, setEmailSummary] = useState(false);

  return (
    <Card className="border-none shadow-none bg-transparent rounded-none md:rounded-3xl md:border md:border-border/60 md:bg-card md:shadow-xs overflow-hidden">
      <CardHeader className="px-0 pt-0 pb-4 md:p-6 md:pb-2">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          Alertas do Sistema
        </CardTitle>
        <CardDescription className="text-sm text-muted-foreground mt-1">
          Escolha como você quer ser avisada quando houver atividades no Totten.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-0 pb-0 md:p-6 md:pt-4 grid gap-4">
        {/* Alerta Sonoro */}
        <div className="flex items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 md:p-5 bg-background/60 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Volume className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Aviso Sonoro (Campainha)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Toca um &quot;Plim!&quot; no seu computador ou tablet quando um cliente fizer check-in.
              </p>
            </div>
          </div>
          <Switch checked={soundAlert} onCheckedChange={setSoundAlert} />
        </div>

        {/* Notificações no Navegador/Celular */}
        <div className="flex items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 md:p-5 bg-background/60 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Devices className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Notificações na Tela (Push)
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Mostra um alerta no canto da tela do seu dispositivo mesmo se o sistema estiver minimizado.
              </p>
            </div>
          </div>
          <Switch checked={pushAlert} onCheckedChange={setPushAlert} />
        </div>

        {/* Resumo por E-mail */}
        <div className="flex items-start sm:items-center justify-between gap-4 rounded-2xl border border-border/50 p-4 md:p-5 bg-background/60 hover:bg-muted/20 transition-colors">
          <div className="flex items-center gap-3.5">
            <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center shrink-0">
              <Envelope className="h-5 w-5 text-primary" />
            </div>
            <div>
              <Label className="text-sm font-semibold text-foreground">
                Resumo Diário por E-mail
              </Label>
              <p className="text-xs text-muted-foreground mt-1">
                Receba um e-mail no final do dia com a lista de todos os clientes que compareceram.
              </p>
            </div>
          </div>
          <Switch checked={emailSummary} onCheckedChange={setEmailSummary} />
        </div>
      </CardContent>
    </Card>
  );
}
