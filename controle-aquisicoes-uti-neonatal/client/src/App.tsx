import { Skeleton } from "@/components/ui/skeleton";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc";
import NotFound from "@/pages/NotFound";
import { lazy, Suspense } from "react";
import { Route, Switch } from "wouter";
import DashboardLayout from "./components/DashboardLayout";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";

const Dashboard = lazy(() => import("@/pages/Dashboard"));
const EquipmentList = lazy(() => import("@/pages/EquipmentList"));
const EquipmentDetail = lazy(() => import("@/pages/EquipmentDetail"));
const AdminAccess = lazy(() => import("@/pages/AdminAccess"));
const SupplierPortal = lazy(() => import("@/pages/SupplierPortal"));
const QuoteComparison = lazy(() => import("@/pages/QuoteComparison"));

function PageLoading() {
  return (
    <div className="space-y-5" aria-label="Carregando página">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-9 w-96 max-w-full" />
      <Skeleton className="h-64 w-full rounded-[1.35rem]" />
    </div>
  );
}

function HomeByAccess() {
  const access = trpc.access.me.useQuery();
  if (access.isLoading) return <PageLoading />;
  if (access.data?.permissions.canViewDashboard) return <Dashboard />;
  if (access.data?.permissions.canSubmitQuotes) return <SupplierPortal />;
  return (
    <div className="panel-surface rounded-2xl p-10 text-center">
      <p className="font-semibold">Nenhum módulo foi liberado para este acesso.</p>
      <p className="mt-2 text-sm text-muted-foreground">Solicite ao administrador a habilitação das visualizações necessárias.</p>
    </div>
  );
}

function Router() {
  return (
    <DashboardLayout>
      <Suspense fallback={<PageLoading />}>
        <Switch>
          <Route path="/" component={HomeByAccess} />
          <Route path="/equipamentos" component={EquipmentList} />
          <Route path="/equipamentos/:id">{params => <EquipmentDetail id={Number(params.id)} />}</Route>
          <Route path="/cotacoes" component={SupplierPortal} />
          <Route path="/fornecedores" component={QuoteComparison} />
          <Route path="/acessos" component={AdminAccess} />
          <Route path="/404" component={NotFound} />
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </DashboardLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster richColors position="top-right" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

