// /app/(private)/admin/team/page.tsx


"use client";

import { useEffect, useState, useCallback, memo } from "react";
import { AdminHeader } from "@/app/(private)/admin/_components/admin-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  User,
  UserPlus,
  Shield,
  LoaderDots,
  Group,
  Pencil,
  Trash,
  Block,
  Wallet,
  ClipboardDetail, //  Importado para o Histórico
  Camera,
  Image as ImageIcon,
  ChevronDown
} from "@boxicons/react";
import { toast } from "sonner";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { uploadImageAction } from "@/app/actions/upload-image";
import { compressImage } from "@/lib/image-utils";

//  Importando todas as suas actions
import {
  getTeam,
  createCollaborator,
  updateCollaborator,
  toggleCollaboratorStatus,
  deleteCollaborator,
  getCatalogOptions,
} from "@/app/actions/team";

//  Atualizamos o tipo com os novos campos
type TeamMember = {
  id: string;
  display_name: string | null;
  email: string;
  role: string;
  active: boolean;
  permissions: string[];
  instagram_url?: string | null;
  show_instagram?: boolean;
  profile_image_url?: string | null;
  profession?: string | null;
  bio?: string | null;
  show_on_site?: boolean;
  services?: { id: string; name: string }[];
  package_templates?: { id: string; name: string }[];
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
  
  const [catalogOptions, setCatalogOptions] = useState<{ services: { id: string; name: string }[]; packages: { id: string; name: string }[] }>({ services: [], packages: [] });

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    permissions: [] as string[],
    instagram_url: "",
    show_instagram: true,
    profile_image_url: "",
    profession: "",
    bio: "",
    show_on_site: true,
    service_ids: [] as string[],
    package_template_ids: [] as string[],
  });

  useEffect(() => {
    if (session?.user?.role === "COLLABORATOR") {
      router.replace("/admin/agenda");
      return;
    }
    loadTeam();
    loadOptions();
  }, [session, router]);

  const loadOptions = async () => {
    const res = await getCatalogOptions();
    if (res.success) {
      setCatalogOptions({ services: res.services || [], packages: res.packages || [] });
    }
  };

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
    setFormData({ name: "", email: "", password: "", permissions: [], instagram_url: "", show_instagram: true, profile_image_url: "", profession: "", bio: "", show_on_site: true, service_ids: [], package_template_ids: [] });
    setSelectedMember(null);
    setModalView("create");
  };

  const openEdit = useCallback((member: TeamMember) => {
    setFormData({
      name: member.display_name || "",
      email: member.email,
      password: "",
      permissions: member.permissions || [],
      instagram_url: member.instagram_url || "",
      show_instagram: member.show_instagram !== false,
      profile_image_url: member.profile_image_url || "",
      profession: member.profession || "",
      bio: member.bio || "",
      show_on_site: member.show_on_site !== false,
      service_ids: member.services?.map((s) => s.id) || [],
      package_template_ids: member.package_templates?.map((p) => p.id) || [],
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

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    try {
      const compressedBase64 = await compressImage(file, 400);
      const res = await uploadImageAction(compressedBase64, "team");
      if (res.success && res.url) {
        setFormData({ ...formData, profile_image_url: res.url });
        toast.success("Foto carregada com sucesso!");
      } else {
        toast.error(res.error || "Erro ao fazer upload da imagem.");
      }
    } catch (err) {
      toast.error("Falha ao processar a imagem.");
    } finally {
      setSaving(false);
    }
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
              <Group size="sm" className="text-primary" /> Profissionais
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Gerencie os acessos das suas funcionárias e parceiras.
            </p>
          </div>
          <Button
            onClick={openCreate}
            className="h-12 px-8 rounded-xl font-medium shadow-sm"
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
        <DialogContent className="w-screen h-[100dvh] max-w-none max-h-none rounded-none p-6 sm:w-full sm:h-auto sm:max-w-md sm:max-h-[90vh] sm:rounded-3xl overflow-y-auto border-0 sm:border">
          <DialogHeader>
            <DialogTitle>
              {modalView === "create"
                ? "Adicionar Colaborador(a)"
                : "Editar Colaborador(a)"}
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">

            {/* FOTO DO PROFISSIONAL */}
            <div className="flex flex-col items-center justify-center gap-3">
              <div className="relative group w-24 h-24">
                {formData.profile_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.profile_image_url}
                    alt="Foto do profissional"
                    className="w-24 h-24 rounded-full object-cover border-2 border-border"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-full bg-muted flex items-center justify-center border-2 border-dashed border-border group-hover:border-primary transition-colors">
                    <User className="h-8 w-8 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                )}

                <label className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground p-2 rounded-full cursor-pointer shadow-md hover:bg-primary/90 transition-transform hover:scale-105 active:scale-95 flex items-center justify-center z-10">
                  {saving ? (
                    <LoaderDots className="h-4 w-4 animate-spin" />
                  ) : (
                    <Camera className="h-4 w-4" />
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageUpload}
                    disabled={saving}
                  />
                </label>
              </div>
              <span className="text-xs text-muted-foreground font-medium">Foto do Perfil (Opcional)</span>
            </div>

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
              <Label>Profissão / Especialidade (Opcional)</Label>
              <Input
                placeholder="Ex: Médica Dermatologista"
                value={formData.profession}
                onChange={(e) =>
                  setFormData({ ...formData, profession: e.target.value })
                }
              />
            </div>
            
            <div className="grid gap-2">
              <div className="flex items-center justify-between">
                <Label>Sobre o Profissional (Opcional)</Label>
                <span className="text-[10px] text-muted-foreground">
                  {formData.bio.length}/300
                </span>
              </div>
              <Textarea
                placeholder="Breve biografia, especialidades ou frase de destaque..."
                value={formData.bio}
                onChange={(e) =>
                  setFormData({ ...formData, bio: e.target.value })
                }
                className="resize-none h-20 text-sm"
                maxLength={300}
              />
            </div>
            {selectedMember?.role !== "OWNER" && (
              <>
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
                    {modalView === "create" ? "Senha Temporária" : "Nova Senha"}
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
              </>
            )}

            <div className="grid gap-2 mt-2">
              <Label>Instagram (Opcional)</Label>
              <Input
                type="url"
                placeholder="Ex: https://instagram.com/patricia"
                value={formData.instagram_url}
                onChange={(e) =>
                  setFormData({ ...formData, instagram_url: e.target.value })
                }
              />
              <div className="flex items-center space-x-2 mt-1">
                <Switch
                  id="show_instagram"
                  checked={formData.show_instagram}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, show_instagram: checked })
                  }
                />
                <Label htmlFor="show_instagram" className="text-xs font-normal text-muted-foreground">
                  Exibir link do Instagram no perfil desta colaboradora no Site da Clínica
                </Label>
              </div>
            </div>

            <div className="grid gap-2 mt-2">
              <Label>Visibilidade no Site</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Switch
                  id="show_on_site"
                  checked={formData.show_on_site}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, show_on_site: checked })
                  }
                />
                <Label htmlFor="show_on_site" className="text-xs font-normal text-muted-foreground">
                  Exibir este profissional na seção da equipe do Site
                </Label>
              </div>
            </div>

            {/* ⚡ GERENCIAMENTO DE PERMISSÕES */}
            {selectedMember?.role !== "OWNER" && (
              <div className="grid gap-2 mt-2 pt-2 border-t border-border/50">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Permissões de Acesso
                </p>

                {/* Padrão (Sempre Ativo) */}
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Agenda & Dashboard
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Acesso padrão para visualizar a rotina da empresa.
                    </p>
                  </div>
                  <Switch checked={true} disabled />
                </div>

                {/* Permissão: Histórico */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <ClipboardDetail
                        size="xs"
                        className="text-muted-foreground"
                      />{" "}
                      Histórico de Check-in
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Pode visualizar todos os atendimentos passados.
                    </p>
                  </div>
                  <Switch
                    checked={formData.permissions.includes("HISTORY")}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        permissions: checked
                          ? [...prev.permissions, "HISTORY"]
                          : prev.permissions.filter((p) => p !== "HISTORY"),
                      }));
                    }}
                  />
                </div>

                {/* Permissão: Financeiro */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium flex items-center gap-1.5">
                      <Wallet size="xs" className="text-muted-foreground" />{" "}
                      Financeiro
                    </Label>
                    <p className="text-[10px] text-muted-foreground">
                      Pode visualizar caixa, extrato e métricas de lucro.
                    </p>
                  </div>
                  <Switch
                    checked={formData.permissions.includes("FINANCE")}
                    onCheckedChange={(checked) => {
                      setFormData((prev) => ({
                        ...prev,
                        permissions: checked
                          ? [...prev.permissions, "FINANCE"]
                          : prev.permissions.filter((p) => p !== "FINANCE"),
                      }));
                    }}
                  />
                </div>
              </div>
            )}

            {/* ⚡ SERVIÇOS E PACOTES */}
            <div className="grid gap-2 mt-2 pt-2 border-t border-border/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Serviços que Realiza
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal bg-background">
                    {formData.service_ids.length > 0
                      ? `${formData.service_ids.length} selecionado(s)`
                      : "Selecionar serviços..."}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 max-h-60 overflow-y-auto">
                  <DropdownMenuLabel>Serviços Disponíveis</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {catalogOptions.services.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Nenhum serviço.</div>
                  ) : (
                    catalogOptions.services.map((service) => (
                      <DropdownMenuCheckboxItem
                        key={service.id}
                        checked={formData.service_ids.includes(service.id)}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            service_ids: checked 
                              ? [...prev.service_ids, service.id] 
                              : prev.service_ids.filter(id => id !== service.id)
                          }));
                        }}
                      >
                        {service.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <div className="grid gap-2 mt-2 pt-2 border-t border-border/50">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Pacotes que Realiza
              </p>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="w-full justify-between font-normal bg-background">
                    {formData.package_template_ids.length > 0
                      ? `${formData.package_template_ids.length} selecionado(s)`
                      : "Selecionar pacotes..."}
                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[--radix-dropdown-menu-trigger-width] min-w-56 max-h-60 overflow-y-auto">
                  <DropdownMenuLabel>Pacotes Disponíveis</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {catalogOptions.packages.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground text-center">Nenhum pacote.</div>
                  ) : (
                    catalogOptions.packages.map((pkg) => (
                      <DropdownMenuCheckboxItem
                        key={pkg.id}
                        checked={formData.package_template_ids.includes(pkg.id)}
                        onSelect={(e) => e.preventDefault()}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            package_template_ids: checked 
                              ? [...prev.package_template_ids, pkg.id] 
                              : prev.package_template_ids.filter(id => id !== pkg.id)
                          }));
                        }}
                      >
                        {pkg.name}
                      </DropdownMenuCheckboxItem>
                    ))
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
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
    const hasFinance = member.permissions.includes("FINANCE");
    const hasHistory = member.permissions.includes("HISTORY"); //  Checando permissão de histórico

    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border border-border/50 bg-card shadow-sm gap-4 transition-all hover:border-border">
        {/* INFO DO USUÁRIO */}
        <div className="flex items-center gap-4">
          <div
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 overflow-hidden border ${member.active ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-transparent"}`}
          >
            {member.profile_image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={member.profile_image_url} alt={member.display_name || "Foto"} className="w-full h-full object-cover" />
            ) : (
              <User size="sm" />
            )}
          </div>
          <div className="flex flex-col items-start gap-1.5">
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

            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm text-muted-foreground">{member.email}</p>

              {/* Badges de Permissão Dinâmicos */}
              {!isOwner && (
                <div className="flex flex-wrap items-center gap-1.5">
                  {hasHistory && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 flex items-center gap-1">
                      <ClipboardDetail size="xs" /> Histórico
                    </span>
                  )}
                  {hasFinance && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 flex items-center gap-1">
                      <Wallet size="xs" /> Financeiro
                    </span>
                  )}
                </div>
              )}
              
              <div className="flex flex-wrap items-center gap-1.5 ml-1 sm:ml-2 sm:border-l sm:border-border/50 sm:pl-2">
                {member.services && member.services.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                    {member.services.length} serviço{member.services.length > 1 ? "s" : ""}
                  </span>
                )}
                {member.package_templates && member.package_templates.length > 0 && (
                  <span className="text-[10px] text-muted-foreground font-medium bg-muted px-2 py-0.5 rounded-full">
                    {member.package_templates.length} pacote{member.package_templates.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* AÇÕES E TAGS */}
        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto mt-2 sm:mt-0 pt-2 sm:pt-0 border-t border-border/40 sm:border-0 shrink-0">
          {isOwner ? (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                <Shield
                  size="xs"
                  className="text-amber-600 dark:text-amber-500"
                />
                <span className="text-xs font-bold text-amber-700 dark:text-amber-500">
                  Admin
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 bg-muted/50 rounded-xl border border-border/50"
                onClick={() => onEdit(member)}
                title="Editar Perfil"
              >
                <Pencil size="xs" />
              </Button>
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
