import { useAccess } from "@/hooks/useAccess";
import { EquipmentDialog } from "@/components/EquipmentDialog";
import { PageHeader } from "@/components/PageHeader";
import { StatusBadge } from "@/components/StatusBadge";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { STAGE_DEFINITIONS, STAGE_STATUSES, type StageKey, type StageStatus } from "@/lib/procurement";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, FileText, Filter, PackageSearch, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { useLocation } from "wouter";

type StageRecord = { stageKey: StageKey; status: StageStatus };
type EquipmentRecord = {
  id: number;
  itemNumber: number;
  name: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  unitValueCents?: number;
  totalValueCents?: number;
  invoiceUrl?: string | null;
  stages: StageRecord[];
};

function itemStatus(item: EquipmentRecord): StageStatus {
  if (item.stages.some(stage => stage.status === "blocked")) return "blocked";
  if (item.stages.length === STAGE_DEFINITIONS.length && item.stages.every(stage => stage.status === "completed")) return "completed";
  if (item.stages.some(stage => stage.status === "in_progress" || stage.status === "completed")) return "in_progress";
  return "pending";
}

function currentStage(item: EquipmentRecord) {
  const stage = STAGE_DEFINITIONS.find(definition => item.stages.find(record => record.stageKey === definition.key)?.status !== "completed");
  return stage?.label ?? "Instalação";
}

function currentStageKey(item: EquipmentRecord): StageKey {
  const stage = STAGE_DEFINITIONS.find(definition => item.stages.find(record => record.stageKey === definition.key)?.status !== "completed");
  return stage?.key ?? "installation";
}

export default function EquipmentList() {
  const { permissions } = useAccess();
  const canEditItems = Boolean(permissions?.canEditItems);
  const canViewStages = Boolean(permissions?.canViewStages);
  const canViewInvoices = Boolean(permissions?.canViewInvoices);
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [stageFilter, setStageFilter] = useState<StageKey | "all">("all");
  const [statusFilter, setStatusFilter] = useState<StageStatus | "all">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data, isLoading, error } = trpc.procurement.list.useQuery();

  const items = (data ?? []) as EquipmentRecord[];
  const filteredItems = useMemo(() => {
    const query = search.trim().toLocaleLowerCase("pt-BR");
    return items.filter(item => {
      const searchable = [item.name, item.brand, item.model, String(item.itemNumber)].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR");
      if (query && !searchable.includes(query)) return false;
      if (canViewStages && statusFilter !== "all") {
        if (stageFilter === "all" && itemStatus(item) !== statusFilter) return false;
        if (stageFilter !== "all" && item.stages.find(stage => stage.stageKey === stageFilter)?.status !== statusFilter) return false;
      }
      if (canViewStages && stageFilter !== "all" && statusFilter === "all" && currentStageKey(item) !== stageFilter) return false;
      return true;
    });
  }, [canViewStages, items, search, stageFilter, statusFilter]);

  return (
    <div className="enter-soft">
      <PageHeader
        eyebrow="MethanMed · relação do fornecimento"
        title="Equipamentos"
        description="Consulte os itens fornecidos pela MethanMed e adquiridos pela CASSEMS, com marcas, modelos, quantidades e andamento completo."
        actions={canEditItems ? <Button className="h-10 rounded-xl shadow-md shadow-primary/10" onClick={() => setDialogOpen(true)}><Plus className="mr-2 h-4 w-4" />Incluir equipamento</Button> : undefined}
      />

      <Card className="panel-surface mb-4 rounded-2xl border-0">
        <CardContent className="p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar por equipamento, marca ou modelo..." className="h-11 rounded-xl bg-background pl-10" />
            </div>
            {canViewStages ? <div className="grid grid-cols-2 gap-3 sm:flex">
              <Select value={stageFilter} onValueChange={value => setStageFilter(value as StageKey | "all")}>
                <SelectTrigger className="h-11 min-w-0 rounded-xl bg-background sm:w-52"><Filter className="mr-2 h-3.5 w-3.5 text-muted-foreground" /><SelectValue placeholder="Etapa" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as etapas</SelectItem>
                  {STAGE_DEFINITIONS.map(stage => <SelectItem key={stage.key} value={stage.key}>{stage.label}</SelectItem>)}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={value => setStatusFilter(value as StageStatus | "all")}>
                <SelectTrigger className="h-11 min-w-0 rounded-xl bg-background sm:w-48"><SlidersHorizontal className="mr-2 h-3.5 w-3.5 text-muted-foreground" /><SelectValue placeholder="Status" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {STAGE_STATUSES.map(status => <SelectItem key={status.key} value={status.key}>{status.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div> : null}
          </div>
        </CardContent>
      </Card>

      {isLoading ? <EquipmentSkeleton /> : error ? (
        <div className="panel-surface rounded-2xl p-9 text-center"><PackageSearch className="mx-auto mb-3 h-6 w-6 text-muted-foreground" /><p className="font-semibold">Não foi possível carregar os equipamentos.</p></div>
      ) : filteredItems.length === 0 ? (
        <div className="panel-surface rounded-2xl p-12 text-center"><PackageSearch className="mx-auto mb-3 h-7 w-7 text-muted-foreground/60" /><p className="font-semibold">Nenhum equipamento encontrado</p><p className="mt-1 text-sm text-muted-foreground">Ajuste os filtros ou o termo de busca.</p></div>
      ) : (
        <>
          <div className="panel-surface hidden overflow-hidden rounded-2xl lg:block">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/55 hover:bg-muted/55">
                  <TableHead className="w-16 pl-5 text-[10px] font-bold uppercase tracking-[0.13em]">Item</TableHead>
                  <TableHead className="text-[10px] font-bold uppercase tracking-[0.13em]">Equipamento</TableHead>
                  <TableHead className="w-24 text-[10px] font-bold uppercase tracking-[0.13em]">Qtd.</TableHead>
                  {canViewStages ? <><TableHead className="w-44 text-[10px] font-bold uppercase tracking-[0.13em]">Etapa atual</TableHead><TableHead className="w-52 text-[10px] font-bold uppercase tracking-[0.13em]">Progresso</TableHead></> : null}
                  {canViewInvoices ? <TableHead className="w-28 text-[10px] font-bold uppercase tracking-[0.13em]">Nota fiscal</TableHead> : null}
                  <TableHead className="w-16" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map(item => {
                  const completed = item.stages.filter(stage => stage.status === "completed").length;
                  const progress = Math.round((completed / STAGE_DEFINITIONS.length) * 100);
                  const status = itemStatus(item);
                  return (
                    <TableRow
                      key={item.id}
                      role="link"
                      tabIndex={0}
                      aria-label={`Abrir detalhes do item ${item.itemNumber}: ${item.name}`}
                      onClick={() => setLocation(`/equipamentos/${item.id}`)}
                      onKeyDown={event => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setLocation(`/equipamentos/${item.id}`);
                        }
                      }}
                      className="cursor-pointer border-border/65 hover:bg-primary/[0.035] focus-visible:bg-primary/[0.055] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring"
                    >
                      <TableCell className="pl-5"><span className="grid h-8 w-8 place-items-center rounded-lg bg-muted text-xs font-bold text-muted-foreground">{String(item.itemNumber).padStart(2, "0")}</span></TableCell>
                      <TableCell>
                        <p className="max-w-[26rem] truncate text-sm font-semibold tracking-[-0.01em]">{item.name}</p>
                        <p className="mt-1 max-w-[26rem] truncate text-[11px] text-muted-foreground">{item.brand || "Marca não informada"} · {item.model || "Modelo não informado"}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="rounded-lg bg-card font-semibold">{item.quantity}</Badge></TableCell>
                      {canViewStages ? <><TableCell><p className="mb-1.5 text-xs font-semibold">{currentStage(item)}</p><StatusBadge status={status} compact /></TableCell>
                      <TableCell>
                        <div className="mb-2 flex items-center justify-between text-[10px]"><span className="text-muted-foreground">{completed}/6 etapas</span><span className="font-bold text-primary">{progress}%</span></div>
                        <div className="flex gap-1">
                          {STAGE_DEFINITIONS.map(stage => {
                            const stageStatus = item.stages.find(record => record.stageKey === stage.key)?.status ?? "pending";
                            return <span key={stage.key} title={`${stage.label}: ${stageStatus}`} className={`h-1.5 flex-1 rounded-full ${stageStatus === "completed" ? "bg-emerald-500" : stageStatus === "in_progress" ? "bg-sky-500" : stageStatus === "blocked" ? "bg-amber-500" : "bg-muted"}`} />;
                          })}
                        </div>
                      </TableCell></> : null}
                      {canViewInvoices ? <TableCell>
                        {item.invoiceUrl ? (
                          <a href={item.invoiceUrl} target="_blank" rel="noreferrer" onClick={event => event.stopPropagation()} className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"><FileText className="h-3.5 w-3.5" />Abrir</a>
                        ) : <span className="text-xs text-muted-foreground">Pendente</span>}
                      </TableCell> : null}
                      <TableCell><ArrowUpRight className="h-4 w-4 text-muted-foreground" /></TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 lg:hidden">
            {filteredItems.map(item => {
              const completed = item.stages.filter(stage => stage.status === "completed").length;
              const progress = Math.round((completed / STAGE_DEFINITIONS.length) * 100);
              return (
                <button key={item.id} onClick={() => setLocation(`/equipamentos/${item.id}`)} className="panel-surface w-full rounded-2xl p-4 text-left">
                  <div className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-xs font-bold text-muted-foreground">{String(item.itemNumber).padStart(2, "0")}</span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-3"><p className="text-sm font-semibold">{item.name}</p>{canViewStages ? <StatusBadge status={itemStatus(item)} compact /> : null}</div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">{item.brand || "Sem marca"} · {item.model || "Sem modelo"}</p>
                      {canViewStages ? <><div className="mt-4 flex items-center justify-between text-[11px]"><span>{currentStage(item)}</span><span className="font-bold text-primary">{progress}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${progress}%` }} /></div></> : null}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="mt-4 flex items-center justify-between px-1 text-xs text-muted-foreground"><span>{filteredItems.length} de {items.length} itens</span><span>{items.reduce((sum, item) => sum + item.quantity, 0)} unidades no projeto</span></div>
      <EquipmentDialog open={dialogOpen} onOpenChange={setDialogOpen} canViewBudgetValues={permissions?.canViewBudgetValues} canManageInvoices={permissions?.canManageInvoices} />
    </div>
  );
}

function EquipmentSkeleton() {
  return <div className="panel-surface space-y-3 rounded-2xl p-5">{Array.from({ length: 7 }).map((_, index) => <Skeleton key={index} className="h-14 w-full rounded-xl" />)}</div>;
}
