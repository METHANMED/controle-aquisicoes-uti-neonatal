import { useAuth } from "@/_core/hooks/useAuth";
import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { Building2, Loader2, LockKeyhole, Pencil, ShieldCheck, Store, UserCheck, UserCog, UserPlus, UserX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Role = "user" | "admin" | "supplier";
type PermissionKey = "canViewDashboard" | "canViewItems" | "canEditItems" | "canViewStages" | "canEditStages" | "canViewInvoices" | "canManageInvoices" | "canViewBudgetValues" | "canViewSupplierQuotes" | "canSubmitQuotes";
type Permissions = Record<PermissionKey, boolean>;

type AccessUser = {
  id: number;
  name: string | null;
  email: string | null;
  role: Role;
  isActive: boolean;
  lastSignedIn: Date;
  permissions: Permissions;
  supplierProfile: { companyName: string | null; cnpj: string | null; contactPhone: string | null } | null;
};

const permissionCatalog: { key: PermissionKey; label: string; description: string }[] = [
  { key: "canViewDashboard", label: "Ver painel", description: "Indicadores consolidados e situação das etapas." },
  { key: "canViewItems", label: "Ver equipamentos", description: "Relação e detalhes dos itens do projeto." },
  { key: "canEditItems", label: "Editar equipamentos", description: "Inclusão e alteração de marca, modelo e quantidade." },
  { key: "canViewStages", label: "Ver etapas", description: "Aquisição, envio, entrega e instalação." },
  { key: "canEditStages", label: "Editar etapas", description: "Status, datas e observações do fluxo." },
  { key: "canViewInvoices", label: "Ver notas fiscais", description: "Acesso aos links dos documentos fiscais." },
  { key: "canManageInvoices", label: "Gerenciar notas fiscais", description: "Inclusão e alteração dos links fiscais." },
  { key: "canViewBudgetValues", label: "Ver valores do orçamento", description: "Valores-base unitários e totais da MethanMed." },
  { key: "canViewSupplierQuotes", label: "Comparar propostas", description: "Valores enviados por todos os fornecedores." },
  { key: "canSubmitQuotes", label: "Enviar cotações", description: "Lançamento de valores próprios como fornecedor." },
];

const roleLabels: Record<Role, string> = { admin: "Gerenciamento", user: "Acompanhamento", supplier: "Fornecedor" };

const defaults: Record<Role, Permissions> = {
  admin: Object.fromEntries(permissionCatalog.map(item => [item.key, true])) as Permissions,
  user: {
    canViewDashboard: true, canViewItems: true, canEditItems: false, canViewStages: true, canEditStages: false,
    canViewInvoices: true, canManageInvoices: false, canViewBudgetValues: false, canViewSupplierQuotes: false, canSubmitQuotes: false,
  },
  supplier: {
    canViewDashboard: false, canViewItems: true, canEditItems: false, canViewStages: false, canEditStages: false,
    canViewInvoices: false, canManageInvoices: false, canViewBudgetValues: false, canViewSupplierQuotes: false, canSubmitQuotes: true,
  },
};

export default function AdminAccess() {
  const { user: currentUser } = useAuth();
  const query = trpc.access.listUsers.useQuery();
  const [editing, setEditing] = useState<AccessUser | null>(null);
  const [creating, setCreating] = useState(false);
  const users = (query.data ?? []) as AccessUser[];
  const stats = useMemo(() => ({
    total: users.length,
    suppliers: users.filter(user => user.role === "supplier").length,
    managers: users.filter(user => user.role === "admin").length,
    inactive: users.filter(user => !user.isActive).length,
  }), [users]);

  return (
    <div className="enter-soft">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <PageHeader eyebrow="Administração do sistema" title="Pessoas e permissões" description="Defina, para cada pessoa, o perfil e exatamente quais módulos, documentos e valores poderão ser visualizados ou alterados." />
        <Button onClick={() => setCreating(true)} className="rounded-xl"><UserPlus className="mr-2 h-4 w-4" />Novo acesso</Button>
      </div>

      <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: "Pessoas cadastradas", value: stats.total, icon: UserCog },
          { label: "Gerenciamento", value: stats.managers, icon: ShieldCheck },
          { label: "Fornecedores", value: stats.suppliers, icon: Store },
          { label: "Acessos inativos", value: stats.inactive, icon: UserX },
        ].map(stat => <Card key={stat.label} className="panel-surface rounded-2xl border-0"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{stat.label}</p><p className="mt-2 text-3xl font-extrabold tracking-[-0.045em]">{stat.value}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary"><stat.icon className="h-4 w-4" /></div></CardContent></Card>)}
      </div>

      {query.isLoading ? <AccessSkeleton /> : query.error ? (
        <div className="panel-surface rounded-2xl p-10 text-center"><LockKeyhole className="mx-auto mb-3 h-6 w-6 text-muted-foreground" /><p className="font-semibold">Não foi possível carregar os acessos.</p></div>
      ) : (
        <div className="grid gap-3">
          {users.map(user => {
            const enabled = Object.values(user.permissions).filter(Boolean).length;
            return (
              <Card key={user.id} className={`panel-surface rounded-2xl border-0 ${!user.isActive ? "opacity-65" : ""}`}>
                <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-center">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/8 text-sm font-bold text-primary">{(user.name || user.email || "U").charAt(0).toUpperCase()}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-bold">{user.name || "Usuário sem nome"}</p>{currentUser?.id === user.id ? <Badge variant="outline" className="rounded-full text-[10px]">Você</Badge> : null}</div>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{user.email || "E-mail não informado"}{user.supplierProfile?.companyName ? ` · ${user.supplierProfile.companyName}` : ""}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className={`rounded-full ${user.role === "admin" ? "bg-emerald-100 text-emerald-800" : user.role === "supplier" ? "bg-sky-100 text-sky-800" : "bg-slate-100 text-slate-700"}`}>{roleLabels[user.role]}</Badge>
                    <Badge variant="outline" className="rounded-full">{enabled} permissões</Badge>
                    <Badge variant="outline" className={`rounded-full ${user.isActive ? "text-emerald-700" : "text-destructive"}`}>{user.isActive ? "Ativo" : "Inativo"}</Badge>
                  </div>
                  <Button variant="outline" className="rounded-xl" onClick={() => setEditing(user)}><Pencil className="mr-2 h-4 w-4" />Configurar</Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <AccessDialog user={editing} currentUserId={currentUser?.id} onOpenChange={open => !open && setEditing(null)} />
      <CreateUserDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}

function CreateUserDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<Role>("user");

  const mutation = trpc.access.createUser.useMutation({
    onSuccess: async () => {
      await Promise.all([utils.access.listUsers.invalidate(), utils.access.me.invalidate()]);
    },
  });

  const reset = () => { setEmail(""); setPassword(""); setName(""); setRole("user"); };

  const save = async () => {
    try {
      await mutation.mutateAsync({ email: email.trim(), password, name: name.trim() || null, role });
      toast.success("Acesso criado. Compartilhe o email e a senha com a pessoa.");
      reset();
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível criar o acesso.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={next => { onOpenChange(next); if (!next) reset(); }}>
      <DialogContent className="rounded-2xl sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl">Novo acesso</DialogTitle>
          <DialogDescription>Cria um login por email e senha. Depois de criado, defina as permissões clicando em "Configurar".</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-2">
          <div className="space-y-2"><Label htmlFor="new-user-name">Nome</Label><Input id="new-user-name" value={name} onChange={event => setName(event.target.value)} placeholder="Nome da pessoa" /></div>
          <div className="space-y-2"><Label htmlFor="new-user-email">Email</Label><Input id="new-user-email" type="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="pessoa@exemplo.com" /></div>
          <div className="space-y-2"><Label htmlFor="new-user-password">Senha</Label><Input id="new-user-password" type="password" value={password} onChange={event => setPassword(event.target.value)} placeholder="Mínimo 6 caracteres" /></div>
          <div className="space-y-2">
            <Label>Perfil</Label>
            <Select value={role} onValueChange={value => setRole(value as Role)}>
              <SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Gerenciamento</SelectItem>
                <SelectItem value="user">Acompanhamento</SelectItem>
                <SelectItem value="supplier">Fornecedor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button>
          <Button onClick={save} disabled={mutation.isPending || !email.trim() || password.length < 6}>
            {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Criar acesso
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccessDialog({ user, currentUserId, onOpenChange }: { user: AccessUser | null; currentUserId?: number; onOpenChange: (open: boolean) => void }) {
  const utils = trpc.useUtils();
  const [role, setRole] = useState<Role>("user");
  const [isActive, setIsActive] = useState(true);
  const [permissions, setPermissions] = useState<Permissions>(defaults.user);
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  useEffect(() => {
    if (!user) return;
    setRole(user.role); setIsActive(user.isActive); setPermissions(user.permissions);
    setCompanyName(user.supplierProfile?.companyName ?? ""); setCnpj(user.supplierProfile?.cnpj ?? ""); setContactPhone(user.supplierProfile?.contactPhone ?? "");
  }, [user]);

  const mutation = trpc.access.updateUser.useMutation({
    onSuccess: async () => { await Promise.all([utils.access.listUsers.invalidate(), utils.access.me.invalidate()]); },
  });

  const changeRole = (next: Role) => { setRole(next); setPermissions(defaults[next]); };
  const save = async () => {
    if (!user) return;
    try {
      await mutation.mutateAsync({ userId: user.id, role, isActive, permissions, companyName: companyName.trim() || null, cnpj: cnpj.trim() || null, contactPhone: contactPhone.trim() || null });
      toast.success("Acesso atualizado."); onOpenChange(false);
    } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível atualizar o acesso."); }
  };

  const ownAccess = user?.id === currentUserId;
  return (
    <Dialog open={Boolean(user)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-3xl">
        <DialogHeader><DialogTitle className="text-xl">Configurar acesso</DialogTitle><DialogDescription>{user?.name || user?.email} · as alterações passam a valer nas próximas consultas.</DialogDescription></DialogHeader>
        <div className="grid gap-5 py-5 sm:grid-cols-2">
          <div className="space-y-2"><Label>Perfil</Label><Select value={role} onValueChange={value => changeRole(value as Role)} disabled={ownAccess}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="admin">Gerenciamento</SelectItem><SelectItem value="user">Acompanhamento</SelectItem><SelectItem value="supplier">Fornecedor</SelectItem></SelectContent></Select></div>
          <div className="flex items-center justify-between rounded-xl border p-4"><div><Label>Acesso ativo</Label><p className="mt-1 text-xs text-muted-foreground">Permitir login e consultas.</p></div><Switch checked={isActive} onCheckedChange={setIsActive} disabled={ownAccess} /></div>
          {role === "supplier" ? <>
            <div className="space-y-2"><Label htmlFor="company-name">Empresa</Label><Input id="company-name" value={companyName} onChange={event => setCompanyName(event.target.value)} placeholder="Razão social ou nome fantasia" /></div>
            <div className="space-y-2"><Label htmlFor="company-cnpj">CNPJ</Label><Input id="company-cnpj" value={cnpj} onChange={event => setCnpj(event.target.value)} placeholder="00.000.000/0000-00" /></div>
            <div className="space-y-2 sm:col-span-2"><Label htmlFor="company-phone">Telefone de contato</Label><Input id="company-phone" value={contactPhone} onChange={event => setContactPhone(event.target.value)} placeholder="(00) 00000-0000" /></div>
          </> : null}
        </div>
        <div className="border-t pt-5">
          <div className="mb-3"><p className="text-sm font-bold">Visualizações e ações</p><p className="mt-1 text-xs text-muted-foreground">O perfil Gerenciamento sempre possui acesso integral.</p></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {permissionCatalog.map(permission => {
              const budgetRestricted = permission.key === "canViewBudgetValues" && role !== "admin";
              return <div key={permission.key} className="flex items-center justify-between gap-4 rounded-xl border p-3"><div><div className="flex items-center gap-2"><p className="text-xs font-semibold">{permission.label}</p>{permission.key === "canViewBudgetValues" ? <Badge variant="outline" className="rounded-full text-[9px]">Exclusivo Gerenciamento</Badge> : null}</div><p className="mt-1 text-[10px] leading-4 text-muted-foreground">{permission.description}</p></div><Switch checked={budgetRestricted ? false : permissions[permission.key]} onCheckedChange={checked => setPermissions(current => ({ ...current, [permission.key]: checked }))} disabled={role === "admin" || budgetRestricted} /></div>;
            })}
          </div>
        </div>
        <DialogFooter className="mt-6"><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={save} disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar acesso</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AccessSkeleton() { return <div className="space-y-3">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}</div>; }
