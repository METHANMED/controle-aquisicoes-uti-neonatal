import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDate, stageLabel, type StageStatus } from "@/lib/procurement";
import { trpc } from "@/lib/trpc";
import { Activity, AlertTriangle, ArrowRight, Boxes, CalendarDays, CheckCircle2, CircleDollarSign, PackageCheck, Truck } from "lucide-react";
import { useLocation } from "wouter";

function ProgressRing({ value }: { value: number }) {
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <div className="relative grid h-32 w-32 place-items-center" aria-label={`${value}% concluído`}>
      <svg className="h-32 w-32 -rotate-90" viewBox="0 0 112 112" aria-hidden="true">
        <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-white/10" />
        <circle cx="56" cy="56" r={radius} fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} className="text-emerald-300 transition-all duration-500" />
      </svg>
      <div className="absolute text-center">
        <p className="text-3xl font-extrabold tracking-[-0.05em]">{value}%</p>
        <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-white/55">concluído</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data, isLoading, error } = trpc.procurement.dashboard.useQuery();
  const access = trpc.access.me.useQuery();

  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) {
    return (
      <div className="panel-surface rounded-2xl p-8 text-center">
        <AlertTriangle className="mx-auto mb-3 h-6 w-6 text-amber-600" />
        <p className="font-semibold">Não foi possível carregar o painel.</p>
        <p className="mt-1 text-sm text-muted-foreground">Atualize a página ou tente novamente em instantes.</p>
      </div>
    );
  }

  const totalBudget = "totalValueCents" in data ? data.totalValueCents : undefined;
  const metrics = [
    { label: "Itens do projeto", value: String(data.totalItems), detail: `${data.totalUnits} unidades previstas`, icon: Boxes },
    { label: "Em movimentação", value: String(data.activeItems), detail: `${data.completedItems} totalmente concluídos`, icon: Activity },
    { label: "Impedimentos", value: String(data.blockedStages), detail: data.blockedStages === 1 ? "etapa requer atenção" : "etapas requerem atenção", icon: AlertTriangle },
  ];
  if (access.data?.permissions.canViewBudgetValues && typeof totalBudget === "number") {
    metrics.splice(2, 0, { label: "Valor do orçamento", value: formatCurrency(totalBudget), detail: "Proposta comercial à vista", icon: CircleDollarSign });
  }

  return (
    <div className="enter-soft">
      <PageHeader
        eyebrow="MethanMed · controle operacional"
        title="Visão geral das aquisições"
        description="Acompanhe o fornecimento MethanMed dos equipamentos adquiridos pela CASSEMS, da aquisição à instalação no Hospital de Corumbá."
        actions={<Button variant="outline" className="h-10 rounded-xl bg-card" onClick={() => setLocation("/equipamentos")}>Ver todos os itens <ArrowRight className="ml-2 h-4 w-4" /></Button>}
      />

      <section className="grid gap-4 xl:grid-cols-[1.28fr_0.72fr]">
        <div className="relative overflow-hidden rounded-[1.35rem] bg-[#153b47] p-6 text-white shadow-[0_18px_50px_rgba(21,59,71,0.18)] sm:p-8">
          <div className="absolute -right-14 -top-20 h-64 w-64 rounded-full border border-white/10" />
          <div className="absolute -right-2 -top-9 h-40 w-40 rounded-full border border-white/10" />
          <div className="relative flex flex-col justify-between gap-8 sm:flex-row sm:items-center">
            <div className="max-w-xl">
              <div className="mb-5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.16em] text-emerald-200/80">
                <span className="h-2 w-2 rounded-full bg-emerald-300 shadow-[0_0_0_5px_rgba(110,231,183,0.1)]" />
                Progresso consolidado
              </div>
              <h2 className="font-display text-3xl leading-tight tracking-[-0.025em] sm:text-4xl">
                {data.completedStages} de {data.totalStages} etapas já foram concluídas.
              </h2>
              <p className="mt-4 max-w-lg text-sm leading-6 text-white/65">
                O indicador considera as seis etapas obrigatórias de cada item e atualiza automaticamente conforme a MethanMed registra o andamento do fornecimento.
              </p>
              <div className="mt-6 flex flex-wrap gap-x-7 gap-y-3 text-sm">
                <div><span className="font-bold text-white">{data.totalItems}</span><span className="ml-2 text-white/55">itens</span></div>
                <div><span className="font-bold text-white">{data.totalUnits}</span><span className="ml-2 text-white/55">unidades</span></div>
                <div><span className="font-bold text-white">{data.completedItems}</span><span className="ml-2 text-white/55">instalados</span></div>
              </div>
            </div>
            <ProgressRing value={data.overallProgress} />
          </div>
        </div>

        <Card className="panel-surface rounded-[1.35rem] border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Contratação CASSEMS</p>
                <CardTitle className="mt-1 text-lg tracking-[-0.025em]">UTI Neonatal · Corumbá</CardTitle>
              </div>
              <div className="grid h-14 w-24 place-items-center rounded-xl border bg-white px-2"><img src="/branding/logo-cassems.png" alt="CASSEMS" className="h-10 w-full object-contain" /></div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3 border-t pt-4 text-sm">
              <div><p className="text-xs text-muted-foreground">Proposta</p><p className="mt-1 font-semibold">PNE-2025-001</p></div>
              <div><p className="text-xs text-muted-foreground">Emissão</p><p className="mt-1 font-semibold">29 jul. 2026</p></div>
              <div><p className="text-xs text-muted-foreground">Fornecedor</p><p className="mt-1 font-semibold">MethanMed</p></div>
              <div><p className="text-xs text-muted-foreground">Adquirente</p><p className="mt-1 font-semibold">CASSEMS</p></div>
            </div>
            <div className="rounded-xl bg-muted/70 p-3 text-xs leading-5 text-muted-foreground">
              Destino: Hospital CASSEMS de Corumbá/MS. Marca e modelo permanecem editáveis conforme as definições da contratação.
            </div>
          </CardContent>
        </Card>
      </section>

      <section className={`mt-4 grid gap-4 sm:grid-cols-2 ${metrics.length === 4 ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
        {metrics.map(metric => (
          <Card key={metric.label} className="panel-surface rounded-2xl border-0">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground">{metric.label}</p>
                  <p className={`mt-2 font-extrabold tracking-[-0.045em] ${metric.label === "Valor do orçamento" ? "text-xl" : "text-3xl"}`}>{metric.value}</p>
                </div>
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary"><metric.icon className="h-4 w-4" /></div>
              </div>
              <p className="mt-3 text-[11px] text-muted-foreground">{metric.detail}</p>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-4 grid gap-4 xl:grid-cols-[1fr_0.72fr]">
        <Card className="panel-surface rounded-[1.35rem] border-0">
          <CardHeader className="flex-row items-center justify-between pb-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Etapas</p>
              <CardTitle className="mt-1 text-lg tracking-[-0.025em]">Situação por etapa</CardTitle>
            </div>
            <Truck className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-5">
            {data.stageSummary.map(stage => {
              const percentage = data.totalItems === 0 ? 0 : Math.round((stage.completed / data.totalItems) * 100);
              return (
                <div key={stage.key}>
                  <div className="mb-2.5 flex items-end justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold">{stage.label}</p>
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{stage.completed} concluídas · {stage.inProgress} em andamento{stage.blocked ? ` · ${stage.blocked} com impedimento` : ""}</p>
                    </div>
                    <p className="text-sm font-bold text-primary">{percentage}%</p>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentage}%` }} /></div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="panel-surface rounded-[1.35rem] border-0">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Atividade</p>
                <CardTitle className="mt-1 text-lg tracking-[-0.025em]">Atualizações recentes</CardTitle>
              </div>
              <CalendarDays className="h-5 w-5 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            {data.recentUpdates.length === 0 ? (
              <div className="rounded-xl border border-dashed px-4 py-9 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-5 w-5 text-muted-foreground/50" />
                <p className="text-sm font-semibold">Nenhuma atualização registrada</p>
                <p className="mt-1 text-xs text-muted-foreground">As movimentações aparecerão aqui.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {data.recentUpdates.map(update => (
                  <button key={update.id} onClick={() => setLocation(`/equipamentos/${update.equipmentId}`)} className="flex w-full items-center gap-3 rounded-xl px-2 py-3 text-left hover:bg-muted/70">
                    <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-xs font-bold text-primary">{String(update.itemNumber).padStart(2, "0")}</div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{update.equipmentName}</p>
                      <p className="mt-1 truncate text-[11px] text-muted-foreground">{stageLabel(update.stageKey)} · {formatDate(update.stageDate)}</p>
                    </div>
                    <StatusBadge status={update.status as StageStatus} compact />
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-5">
      <div className="space-y-2"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-80 max-w-full" /><Skeleton className="h-4 w-[34rem] max-w-full" /></div>
      <div className="grid gap-4 xl:grid-cols-[1.28fr_0.72fr]"><Skeleton className="h-72 rounded-[1.35rem]" /><Skeleton className="h-72 rounded-[1.35rem]" /></div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}</div>
    </div>
  );
}
