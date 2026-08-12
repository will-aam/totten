"use client";

import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Save } from "lucide-react";

export default function TermsPage() {
  return (
    <>
      <AdminHeader title="Termos e Condições do Autoatendimento" />

      <div className="flex flex-col gap-6 p-6 md:p-8 max-w-4xl">
        <Card>
          <CardHeader>
            <CardTitle>Termos e Condições</CardTitle>
            <CardDescription>
              Defina aqui as regras e os termos que seus clientes deverão aceitar antes de concluir um agendamento online.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="terms-content">Texto dos Termos e Condições</Label>
              <Textarea
                id="terms-content"
                className="min-h-[400px] resize-y"
                placeholder="Ex: Ao realizar o agendamento, você concorda com nossa política de cancelamento..."
                defaultValue={`1. Política de Cancelamento\nCancelamentos devem ser feitos com no mínimo 24h de antecedência.\n\n2. Atrasos\nA tolerância para atrasos é de 15 minutos. Após este período, o agendamento poderá ser cancelado.\n\n3. Pagamentos\nServiços que exigem pagamento antecipado não serão reembolsados em caso de não comparecimento.`}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => alert("Função em desenvolvimento.")}>
                <Save className="w-4 h-4 mr-2" />
                Salvar Termos
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
