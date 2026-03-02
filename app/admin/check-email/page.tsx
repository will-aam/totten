import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function CheckEmailPage() {
  return (
    <div className="flex min-h-svh items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Mail className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-2xl">Verifique seu e-mail</CardTitle>
          <CardDescription className="text-base">
            Enviamos um link de confirmação para o e-mail cadastrado.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            Clique no link que enviamos para ativar sua conta e fazer login.
          </p>

          <div className="bg-muted/50 p-4 rounded-lg border border-border">
            <p className="text-xs text-muted-foreground">
              <strong>Não recebeu o e-mail?</strong>
              <br />
              Verifique sua caixa de spam ou entre em contato com o suporte.
            </p>
          </div>

          <Button asChild className="w-full" variant="outline">
            <Link href="/admin/login">Voltar para o Login</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
