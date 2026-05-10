"use client";

import { useEffect, useState, useCallback, memo } from "react";
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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  User,
  UserPlus,
  Shield,
  LoaderDots,
  Group,
  Pencil,
  Trash,
  Block,
} from "@boxicons/react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";

// 🔥 Importando todas as suas actions
import {
  getTeam,
  createCollaborator,
  updateCollaborator,
  toggleCollaboratorStatus,
  deleteCollaborator,
} from "@/app/actions/team";

// 🔥 Atualizamos o tipo com os novos campos
type TeamMember = {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
  active: boolean;
  permissions: string[];
};

export default function TeamPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // ⚡ Controle Centralizado de Modais (Alta Performance)
  const [modalView, setModalView] = useState<
    "create" | "edit" | "toggle" | "delete" | null
  >(null);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
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

  // --------------------------------------------------------
  // HANDLERS DE ABERTURA DOS MODAIS
  // --------------------------------------------------------
  const openCreate = () => {
    setFormData({ name: "", email: "", password: "" });
    setSelectedMember(null);
    setModalView("create");
  };

  const openEdit = useCallback((member: TeamMember) => {
    setFormData({
      name: member.display_name || "",
      email: member.email,
      password: "",
    });
    setSelectedMember(member);
    setModalView("edit");
  }, []);

  const openToggle = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setModalView("toggle");
  }, []);

  const openDelete = useCallback((member: TeamMember) => {
    setSelectedMember(member);
    setModalView("delete");
  }, []);

  const closeModal = () => {
    setModalView(null);
    setSelectedMember(null);
  };

  // --------------------------------------------------------
  // HANDLERS DE SUBMISSÃO (Ações no Banco)
  // --------------------------------------------------------
  const handleSave = async () => {
    setSaving(true);

    let result;
    if (modalView === "create") {
      result = await createCollaborator(formData);
    } else if (modalView === "edit" && selectedMember) {
      result = await updateCollaborator(selectedMember.id, formData);
    }

    if (result?.success) {
      toast.success(
        modalView === "create"
          ? "Colaboradora adicionada!"
          : "Dados atualizados!",
      );
      closeModal();
      loadTeam();
    } else {
      toast.error(result?.error || "Ocorreu um erro.");
    }
    setSaving(false);
  };

  const handleToggleStatus = async () => {
    if (!selectedMember) return;
    setSaving(true);
    const result = await toggleCollaboratorStatus(
      selectedMember.id,
      selectedMember.active,
    );

    if (result.success) {
      toast.success(
        `Acesso ${selectedMember.active ? "desativado" : "ativado"} com sucesso!`,
      );
      closeModal();
      loadTeam();
    } else {
      toast.error(result.error);
    }
    setSaving(false);
  };

  const handleDelete = async () => {
    if (!selectedMember) return;
    setSaving(true);
    const result = await deleteCollaborator(selectedMember.id);

    if (result.success) {
      toast.success("Colaboradora excluída com sucesso!");
      closeModal();
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
            onClick={openCreate}
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
              <TeamMemberCard
                key={member.id}
                member={member}
                onEdit={openEdit}
                onToggle={openToggle}
                onDelete={openDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* ⚡ MODAL REUTILIZÁVEL (CRIAR E EDITAR) */}
      <Dialog
        open={modalView === "create" || modalView === "edit"}
        onOpenChange={closeModal}
      >
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {modalView === "create"
                ? "Adicionar Colaboradora"
                : "Editar Colaboradora"}
            </DialogTitle>
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
              <Label>
                {modalView === "create"
                  ? "Senha Temporária"
                  : "Nova Senha (opcional)"}
              </Label>
              <Input
                type="text"
                placeholder={
                  modalView === "create"
                    ? "Ex: patricia123"
                    : "Deixe em branco para não alterar"
                }
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
              />
              <span className="text-[10px] text-muted-foreground">
                Ela poderá alterar a senha depois se quiser. Min. 6 caracteres.
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? <LoaderDots className="animate-spin mr-2" /> : null}
              {modalView === "create" ? "Salvar Acesso" : "Atualizar Dados"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ⚡ MODAL DE CONFIRMAÇÃO (DESATIVAR/ATIVAR) */}
      <Dialog open={modalView === "toggle"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle>
              {selectedMember?.active
                ? "Desativar Acesso?"
                : "Reativar Acesso?"}
            </DialogTitle>
            <DialogDescription>
              {selectedMember?.active
                ? "Essa pessoa perderá o acesso ao sistema imediatamente, mas o histórico dela continuará salvo."
                : "Essa pessoa poderá voltar a fazer login no sistema usando a última senha configurada."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant={selectedMember?.active ? "destructive" : "default"}
              onClick={handleToggleStatus}
              disabled={saving}
            >
              {saving ? <LoaderDots className="animate-spin mr-2" /> : null}
              {selectedMember?.active ? "Sim, desativar" : "Sim, reativar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ⚡ MODAL DE EXCLUSÃO DEFINITIVA */}
      <Dialog open={modalView === "delete"} onOpenChange={closeModal}>
        <DialogContent className="sm:max-w-md rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-red-600">
              Excluir Permanentemente?
            </DialogTitle>
            <DialogDescription>
              Você está prestes a excluir <b>{selectedMember?.display_name}</b>.
              O histórico financeiro dela será mantido (os caixas não quebram),
              mas o nome não aparecerá mais nos atendimentos antigos.
              <br />
              <br />
              Esta ação não pode ser desfeita.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={closeModal} disabled={saving}>
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={saving}
            >
              {saving ? <LoaderDots className="animate-spin mr-2" /> : null}
              Sim, excluir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// -----------------------------------------------------------------------------------
// ⚡ COMPONENTE DE CARD OTIMIZADO
// Usando `memo` para impedir re-renderizações desnecessárias em telas pesadas
// -----------------------------------------------------------------------------------
const TeamMemberCard = memo(
  ({
    member,
    onEdit,
    onToggle,
    onDelete,
  }: {
    member: TeamMember;
    onEdit: (m: TeamMember) => void;
    onToggle: (m: TeamMember) => void;
    onDelete: (m: TeamMember) => void;
  }) => {
    const isOwner = member.role === "OWNER";

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/50 bg-card shadow-sm gap-4 transition-all hover:border-border">
        {/* INFO DO USUÁRIO */}
        <div className="flex items-center gap-4">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${member.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
          >
            <User size="sm" />
          </div>
          <div>
            <h3
              className={`font-bold text-base flex items-center gap-2 ${!member.active && "opacity-60"}`}
            >
              {member.display_name || "Sem nome"}

              {/* Badge Status */}
              {!isOwner && (
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${member.active ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"}`}
                >
                  {member.active ? "Ativo" : "Inativo"}
                </span>
              )}
            </h3>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>

        {/* AÇÕES E TAGS */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-0">
          {isOwner ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
              <Shield
                size="xs"
                className="text-amber-600 dark:text-amber-500"
              />
              <span className="text-xs font-bold text-amber-700 dark:text-amber-500">
                Admin
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1 border border-border/50">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => onEdit(member)}
                title="Editar"
              >
                <Pencil size="xs" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className={`h-8 w-8 ${member.active ? "text-amber-600 hover:text-amber-700 hover:bg-amber-100" : "text-green-600 hover:text-green-700 hover:bg-green-100"}`}
                onClick={() => onToggle(member)}
                title={member.active ? "Desativar" : "Ativar"}
              >
                <Block size="xs" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-100"
                onClick={() => onDelete(member)}
                title="Excluir"
              >
                <Trash size="xs" />
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  },
);

TeamMemberCard.displayName = "TeamMemberCard";
