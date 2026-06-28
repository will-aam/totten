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
import { Bell, BellRing, Devices, Envelope } from "@boxicons/react";
import { Volume } from "lucide-react";

export function NotificationsSettings() {
  const [soundAlert, setSoundAlert] = useState(true);
  const [pushAlert, setPushAlert] = useState(true);
  const [emailSummary, setEmailSummary] = useState(false);

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-none shadow-none py-0 sm:py-6">
        <CardHeader className="px-0">
          <CardTitle className="flex items-center gap-2 text-card-foreground">
            <Bell className="h-5 w-5 text-primary" />
            Alertas do Sistema
          </CardTitle>
          <CardDescription>
            Escolha como você quer ser avisada quando houver atividades no
            Totten.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 px-0">
          {/* Alerta Sonoro */}
          <div className="flex items-start sm:items-center justify-between gap-4 rounded-lg border p-4 bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full hidden sm:block">
                <Volume className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium text-foreground">
                  Aviso Sonoro (Campainha)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Toca um "Plim!" no seu computador ou tablet quando um cliente
                  fizer check-in.
                </p>
              </div>
            </div>
            <Switch checked={soundAlert} onCheckedChange={setSoundAlert} />
          </div>

          {/* Notificações no Navegador/Celular */}
          <div className="flex items-start sm:items-center justify-between gap-4 rounded-lg border p-4 bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full hidden sm:block">
                <Devices className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium text-foreground">
                  Notificações na Tela (Push)
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Mostra um alerta no canto da tela do seu dispositivo mesmo se
                  o sistema estiver minimizado.
                </p>
              </div>
            </div>
            <Switch checked={pushAlert} onCheckedChange={setPushAlert} />
          </div>

          {/* Resumo por E-mail */}
          <div className="flex items-start sm:items-center justify-between gap-4 rounded-lg border p-4 bg-card">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-full hidden sm:block">
                <Envelope className="h-5 w-5 text-primary" />
              </div>
              <div>
                <Label className="text-base font-medium text-foreground">
                  Resumo Diário por E-mail
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  Receba um e-mail no final do dia com a lista de todos os
                  clientes que compareceram.
                </p>
              </div>
            </div>
            <Switch checked={emailSummary} onCheckedChange={setEmailSummary} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
