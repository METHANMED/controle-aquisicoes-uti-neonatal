import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";
import { BadgeDollarSign, Boxes, ChevronUp, LayoutDashboard, LogOut, MapPin, Scale, ShieldCheck, UserCog } from "lucide-react";
import { useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from "./DashboardLayoutSkeleton";

function getActivePath(location: string, paths: string[]) {
  if (location.startsWith("/equipamentos")) return "/equipamentos";
  return paths.find(path => path !== "/" && location.startsWith(path)) ?? "/";
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { loading, user } = useAuth();

  if (loading) return <DashboardLayoutSkeleton />;
  if (!user) return <LoginExperience />;

  return (
    <SidebarProvider
      style={{ "--sidebar-width": "17.5rem" } as CSSProperties}
    >
      <AuthenticatedLayout>{children}</AuthenticatedLayout>
    </SidebarProvider>
  );
}

function LoginForm() {
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async () => {
      setError(null);
      await utils.auth.me.invalidate();
    },
    onError: err => {
      setError(
        err instanceof TRPCClientError
          ? err.message
          : "Não foi possível entrar. Tente novamente."
      );
    },
  });

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    loginMutation.mutate({ email, password });
  };

  return (
    <form onSubmit={handleSubmit} className="mt-9 space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">Email</Label>
        <Input
          id="login-email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={event => setEmail(event.target.value)}
          placeholder="seu.email@exemplo.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">Senha</Label>
        <Input
          id="login-password"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={event => setPassword(event.target.value)}
          placeholder="••••••••"
        />
      </div>
      {error ? <p className="text-sm font-medium text-destructive">{error}</p> : null}
      <Button
        type="submit"
        size="lg"
        disabled={loginMutation.isPending}
        className="h-12 w-full rounded-xl text-sm font-bold shadow-lg shadow-primary/15"
      >
        {loginMutation.isPending ? "Entrando..." : "Entrar no sistema"}
      </Button>
    </form>
  );
}

function LoginExperience() {
  return (
    <main className="min-h-screen bg-[#ecf2ef] p-3 sm:p-5 lg:p-7">
      <div className="mx-auto grid min-h-[calc(100vh-1.5rem)] max-w-[1500px] overflow-hidden rounded-[1.75rem] bg-white shadow-[0_30px_90px_rgba(16,49,61,0.15)] sm:min-h-[calc(100vh-2.5rem)] lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden lg:block">
          <img
            src="/manus-storage/uti-neonatal-acesso_5b68c6ad.jpg"
            alt="Ambiente moderno de unidade neonatal"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-[#123745]/70" />
          <div className="absolute left-14 top-12 rounded-2xl bg-white px-5 py-3 shadow-xl shadow-black/10">
            <img src="/manus-storage/logo-methanmed-web_dd944cd7.png" alt="MethanMed" className="h-11 w-auto object-contain" />
          </div>
          <div className="absolute inset-x-0 bottom-0 p-14 text-white">
            <Badge className="mb-6 border-white/25 bg-white/10 text-white hover:bg-white/10">
              PNE-2025-001
            </Badge>
            <h2 className="font-display max-w-2xl text-5xl leading-[1.04] tracking-[-0.025em] text-balance">
              Cada etapa visível. Cada entrega sob controle.
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-white/75">
              Acompanhamento centralizado dos equipamentos fornecidos pela MethanMed à UTI Neonatal do Hospital CASSEMS de Corumbá.
            </p>
          </div>
        </section>

        <section className="subtle-grid flex items-center justify-center px-6 py-14 sm:px-12 lg:px-16">
          <div className="w-full max-w-md enter-soft">
            <div className="mb-12">
              <img src="/manus-storage/logo-methanmed-web_dd944cd7.png" alt="MethanMed" className="h-12 w-auto max-w-[240px] object-contain" />
              <p className="mt-3 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Portal de fornecimento</p>
            </div>

            <p className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-primary">Acesso seguro</p>
            <h1 className="font-display text-4xl leading-tight tracking-[-0.025em] text-balance sm:text-5xl">
              Bem-vindo ao painel de acompanhamento.
            </h1>
            <p className="mt-5 text-sm leading-7 text-muted-foreground">
              Acompanhe os itens adquiridos pela CASSEMS, gerencie permissões de acesso ou informe propostas comerciais pelo perfil Fornecedor.
            </p>

            <LoginForm />

            <div className="mt-8 grid grid-cols-[0.85fr_1.15fr] gap-3 text-xs text-muted-foreground">
              <div className="rounded-xl border bg-white/70 p-3">
                <ShieldCheck className="mb-2 h-4 w-4 text-primary" />
                Acesso por perfil
              </div>
              <div className="flex items-center gap-3 rounded-xl border bg-white/70 p-3">
                <img src="/manus-storage/logo-cassems-web_0e1632b8.png" alt="CASSEMS" className="h-10 w-16 shrink-0 object-contain" />
                <div><p className="font-semibold text-foreground">CASSEMS</p><p className="mt-0.5 text-[10px]">Adquirente</p></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function AuthenticatedLayout({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const access = trpc.access.me.useQuery();
  const [location, setLocation] = useLocation();
  const permissions = access.data?.permissions;
  const navigation = [
    permissions?.canViewDashboard ? { icon: LayoutDashboard, label: "Visão geral", path: "/" } : null,
    permissions?.canViewItems ? { icon: Boxes, label: "Equipamentos", path: "/equipamentos" } : null,
    user?.role === "supplier" && permissions?.canSubmitQuotes ? { icon: BadgeDollarSign, label: "Minhas cotações", path: "/cotacoes" } : null,
    permissions?.canViewSupplierQuotes ? { icon: Scale, label: "Comparar propostas", path: "/fornecedores" } : null,
    user?.role === "admin" ? { icon: UserCog, label: "Acessos", path: "/acessos" } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));
  const activePath = getActivePath(location, navigation.map(item => item.path));
  const activeItem = navigation.find(item => item.path === activePath);
  const isAdmin = user?.role === "admin";
  const roleLabel = isAdmin ? "Gerenciamento" : user?.role === "supplier" ? "Fornecedor" : "Acompanhamento";
  const initials = (user?.name || user?.email || "U")
    .split(" ")
    .slice(0, 2)
    .map(part => part.charAt(0).toUpperCase())
    .join("");

  return (
    <>
      <Sidebar collapsible="icon" className="border-r-0">
        <SidebarHeader className="border-b border-sidebar-border/70 p-4 group-data-[collapsible=icon]:p-3">
          <div className="overflow-hidden rounded-xl bg-white px-3 py-2 shadow-lg shadow-black/10 group-data-[collapsible=icon]:grid group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:place-items-center group-data-[collapsible=icon]:p-1.5">
            <img src="/manus-storage/logo-methanmed-web_dd944cd7.png" alt="MethanMed" className="h-8 w-full object-contain group-data-[collapsible=icon]:h-7" />
          </div>
        </SidebarHeader>

        <SidebarContent className="px-3 py-5">
          <p className="mb-2 px-2 text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden">
            Navegação
          </p>
          <SidebarMenu className="gap-1.5">
            {navigation.map(item => {
              const active = activePath === item.path;
              return (
                <SidebarMenuItem key={item.path}>
                  <SidebarMenuButton
                    isActive={active}
                    onClick={() => setLocation(item.path)}
                    tooltip={item.label}
                    className="h-11 rounded-xl px-3 text-sidebar-foreground/70 data-[active=true]:bg-sidebar-accent data-[active=true]:font-semibold data-[active=true]:text-sidebar-accent-foreground"
                  >
                    <item.icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>

          <div className="mx-1 mt-8 rounded-2xl border border-sidebar-border/80 bg-white/[0.045] p-4 group-data-[collapsible=icon]:hidden">
            <div className="mb-3 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-sidebar-foreground/40">Adquirente</span>
              <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
            </div>
            <div className="rounded-xl bg-white px-3 py-2"><img src="/manus-storage/logo-cassems-web_0e1632b8.png" alt="CASSEMS" className="h-10 w-full object-contain" /></div>
            <p className="mt-3 text-xs font-semibold">Projeto UTI Neonatal</p>
            <div className="mt-2 flex items-center gap-1.5 text-[11px] leading-5 text-sidebar-foreground/50">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              Hospital CASSEMS · Corumbá/MS
            </div>
          </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border/70 p-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-left hover:bg-sidebar-accent focus-visible:ring-2 focus-visible:ring-sidebar-ring">
                <Avatar className="h-9 w-9 shrink-0 border border-white/10 bg-sidebar-accent">
                  <AvatarFallback className="bg-sidebar-accent text-xs font-bold text-sidebar-accent-foreground">{initials}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
                  <p className="truncate text-xs font-semibold">{user?.name || "Usuário"}</p>
                  <p className="truncate text-[10px] text-sidebar-foreground/50">{roleLabel}</p>
                </div>
                <ChevronUp className="h-3.5 w-3.5 text-sidebar-foreground/40 group-data-[collapsible=icon]:hidden" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" side="top" className="w-60 rounded-xl p-2">
              <div className="px-2 py-2">
                <p className="truncate text-sm font-semibold">{user?.name || "Usuário"}</p>
                <p className="truncate text-xs text-muted-foreground">{user?.email || "Sem e-mail informado"}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="cursor-pointer rounded-lg text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Sair do sistema
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="min-w-0 bg-background">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border/70 bg-background/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-9 w-9 rounded-xl border bg-card lg:hidden" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground">MethanMed · fornecimento</p>
              <p className="text-sm font-semibold tracking-[-0.01em]">{activeItem?.label || "Painel"}</p>
            </div>
          </div>
          <Badge variant="outline" className="gap-1.5 rounded-full bg-card px-3 py-1.5 text-[11px] font-semibold shadow-sm">
            <span className={`h-1.5 w-1.5 rounded-full ${isAdmin ? "bg-emerald-500" : "bg-sky-500"}`} />
            {roleLabel}
          </Badge>
        </header>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </>
  );
}
