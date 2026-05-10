"use client";

import { useEffect, useState } from "react";
import { AdminHeader } from "@/components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { User, UserPlus, Shield, LoaderDots, Group } from "@boxicons/react";
import { toast } from "sonner";
import { getTeam, createCollaborator } from "@/app/actions/team";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

type TeamMember = {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
};

export default function TeamPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    // Bloqueia se a própria funcionária tentar acessar a URL diretamente
    if (session?.user?.role === "COLLABORATOR") {
      router.replace("/admin/agenda");
      return;
    }

    loadTeam();
  }, [session, router]);

  const loadTeam = async () => {
    setLoading(true);
    const result = await getTeam();
    if (result.success && result.data) {
      setTeam(result.data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    setSaving(true);
    const result = await createCollaborator(formData);

    if (result.success) {
      toast.success("Colaboradora adicionada com sucesso!");
      setIsModalOpen(false);
      setFormData({ name: "", email: "", password: "" });
      loadTeam();
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  return (
    <>
      <AdminHeader title="Equipe" />

      <div className="flex flex-col gap-6 p-4 md:p-6 max-w-400 mx-auto w-full animate-in fade-in duration-500 min-h-[calc(100vh-100px)]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/50 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Group size="sm" className="text-primary" /> Minha Equipe
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie os acessos das suas funcionárias e parceiras.
            </p>
          </div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="h-11 rounded-xl font-bold shrink-0 shadow-sm"
          >
            <UserPlus size="sm" className="mr-2" />
            Novo Acesso
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-12">
            <LoaderDots className="h-8 w-8 text-primary animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4">
            {team.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4 rounded-2xl border border-border/50 bg-card shadow-sm"
              >
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User size="sm" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base">
                      {member.display_name || "Sem nome"}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {member.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-muted/50 border border-border/50">
                  {member.role === "OWNER" ? (
                    <>
                      <Shield size="xs" className="text-amber-500" />
                      <span className="text-xs font-bold text-amber-600">
                        Dona
                      </span>
                    </>
                  ) : (
                    <span className="text-xs font-bold text-muted-foreground">
                      Colaboradora
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>Adicionar Colaboradora</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Nome</Label>
              <Input
                placeholder="Ex: Patrícia Silva"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>E-mail (Login)</Label>
              <Input
                type="email"
                placeholder="patricia@email.com"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div className="grid gap-2">
              <Label>Senha Temporária</Label>
              <Input
                type="text"
                placeholder="Ex: patricia123"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <span className="text-[10px] text-muted-foreground">
                Ela poderá alterar a senha depois se quiser.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsModalOpen(false)}
              disabled={saving}
            >
              Cancelar
            </Button>
            <Button onClick={handleCreate} disabled={saving}>
              {saving ? <LoaderDots className="animate-spin mr-2" /> : null}
              Salvar Acesso
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
