import { useAccess } from "@/hooks/useAccess";
import { EquipmentDialog } from "@/components/EquipmentDialog";
import { StatusBadge } from "@/components/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate, fromDateInput, STAGE_DEFINITIONS, STAGE_STATUSES, toDateInput, type StageKey, type StageStatus } from "@/lib/procurement";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ArrowUpRight, Building2, CalendarDays, Check, ClipboardList, FileText, Loader2, Pencil, Package, Tag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useLocation } from "wouter";

type StageRecord = {
  id: number;
  stageKey: StageKey;
  status: StageStatus;
  stageDate: number | null;
  notes: string | null;
};

export default function EquipmentDetail({ id }: { id: number }) {
  const { permissions } = useAccess();
  const canEditItems = Boolean(permissions?.canEditItems);
  const [, setLocation] = useLocation();
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<StageRecord | null>(null);
  const query = trpc.procurement.detail.useQuery({ id }, { enabled: Number.isFinite(id) && id > 0 });

  const orderedStages = useMemo(() => {
    if (!query.data || !permissions?.canViewStages) return [];
    return STAGE_DEFINITIONS.map(definition => query.data.stages.find(stage => stage.stageKey === definition.key) ?? {
      id: 0,
      equipmentId: id,
      stageKey: definition.key,
      status: "pending" as const,
      stageDate: null,
      notes: null,
      updatedBy: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }, [id, permissions?.canViewStages, query.data]);

  if (query.isLoading) return <DetailSkeleton />;
  if (query.error || !query.data) {
    return <div className="panel-surface rounded-2xl p-10 text-center"><p className="font-semibold">Equipamento não encontrado.</p><Button variant="outline" className="mt-4" onClick={() => setLocation("/equipamentos")}>Voltar aos equipamentos</Button></div>;
  }

  const item = query.data;
  const completed = orderedStages.filter(stage => stage.status === "completed").length;
  const progress = Math.round((completed / STAGE_DEFINITIONS.length) * 100);
  const totalValue = typeof item.totalValueCents === "number" ? item.totalValueCents : null;

  return (
    <div className="enter-soft">
      <button onClick={() => setLocation("/equipamentos")} className="mb-6 inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />Voltar aos equipamentos</button>

      <div className="mb-6 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
        <div className="max-w-4xl">
          <div className="mb-3 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-xs font-extrabold text-primary">{String(item.itemNumber).padStart(2, "0")}</span><p className="text-[11px] font-bold uppercase tracking-[0.17em] text-primary">Detalhes do equipamento</p></div>
          <h1 className="text-2xl font-bold tracking-[-0.035em] sm:text-3xl">{item.name}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{item.brand || "Marca não informada"} · {item.model || "Modelo não informado"} <span className="mx-1.5 text-border">|</span> Adquirente: <span className="font-semibold text-foreground">CASSEMS</span></p>
        </div>
        {canEditItems ? <Button variant="outline" className="h-10 rounded-xl bg-card" onClick={() => setEquipmentDialogOpen(true)}><Pencil className="mr-2 h-4 w-4" />Editar equipamento</Button> : null}
      </div>

      {permissions?.canViewStages || permissions?.canViewInvoices ? <section className={`grid gap-4 ${permissions?.canViewStages && permissions?.canViewInvoices ? "xl:grid-cols-[1fr_0.68fr]" : "grid-cols-1"}`}>
        {permissions?.canViewStages ? <Card className="panel-surface rounded-[1.35rem] border-0">
          <CardContent className="p-6">
            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Andamento geral</p><p className="mt-1 text-2xl font-extrabold tracking-[-0.045em]">{progress}% concluído</p></div>
              <p className="text-xs text-muted-foreground">{completed} de 6 etapas concluídas</p>
            </div>
            <div className="flex gap-2">
              {STAGE_DEFINITIONS.map((definition, index) => {
                const stage = orderedStages[index];
                return (
                  <div key={definition.key} className="min-w-0 flex-1">
                    <div className={`grid h-8 w-8 place-items-center rounded-full text-xs font-bold ${stage.status === "completed" ? "bg-emerald-600 text-white" : stage.status === "in_progress" ? "bg-sky-600 text-white" : stage.status === "blocked" ? "bg-amber-500 text-white" : "bg-muted text-muted-foreground"}`}>{stage.status === "completed" ? <Check className="h-4 w-4" /> : index + 1}</div>
                    <div className={`mt-2 h-1 rounded-full ${stage.status === "completed" ? "bg-emerald-500" : stage.status === "in_progress" ? "bg-sky-500" : stage.status === "blocked" ? "bg-amber-500" : "bg-muted"}`} />
                    <p className="mt-2 hidden truncate text-[10px] font-semibold text-muted-foreground md:block">{definition.label}</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card> : null}

        {permissions?.canViewInvoices ? <Card className="panel-surface rounded-[1.35rem] border-0">
          <CardHeader className="pb-3"><div className="flex items-center justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Documento</p><CardTitle className="mt-1 text-lg tracking-[-0.025em]">Nota fiscal</CardTitle></div><FileText className="h-5 w-5 text-muted-foreground" /></div></CardHeader>
          <CardContent>
            {item.invoiceUrl ? (
              <a href={item.invoiceUrl} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border bg-muted/45 p-4 text-sm font-semibold text-primary hover:bg-muted"><span className="truncate">Abrir documento vinculado</span><ArrowUpRight className="ml-3 h-4 w-4 shrink-0" /></a>
            ) : (
              <div className="rounded-xl border border-dashed p-4"><p className="text-sm font-semibold">Link ainda não informado</p><p className="mt-1 text-xs leading-5 text-muted-foreground">O perfil Gerenciamento pode inserir o endereço na edição do equipamento.</p></div>
            )}
          </CardContent>
        </Card> : null}
      </section> : null}

      <section className="mt-4 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Building2, label: "Marca", value: item.brand || "Não informada" },
          { icon: Tag, label: "Modelo", value: item.model || "Não informado" },
          { icon: Package, label: "Quantidade", value: `${item.quantity} ${item.quantity === 1 ? "unidade" : "unidades"}` },
          ...(permissions?.canViewBudgetValues && totalValue !== null ? [{ icon: ClipboardList, label: "Valor total", value: formatCurrency(totalValue) }] : []),
        ].map(detail => (
          <Card key={detail.label} className="panel-surface rounded-2xl border-0"><CardContent className="flex items-start gap-3 p-4"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-primary/8 text-primary"><detail.icon className="h-4 w-4" /></div><div className="min-w-0"><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">{detail.label}</p><p className="mt-1 line-clamp-2 text-sm font-semibold">{detail.value}</p></div></CardContent></Card>
        ))}
      </section>

      {permissions?.canViewStages ? <section className="mt-8">
        <div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[0.16em] text-primary">Fluxo de execução</p><h2 className="mt-1 text-xl font-bold tracking-[-0.03em]">Etapas do item</h2></div>
        <div className="grid gap-3 lg:grid-cols-2">
          {STAGE_DEFINITIONS.map((definition, index) => {
            const stage = orderedStages[index];
            return (
              <Card key={definition.key} className="panel-surface rounded-2xl border-0">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-sm font-bold ${stage.status === "completed" ? "bg-emerald-100 text-emerald-700" : stage.status === "in_progress" ? "bg-sky-100 text-sky-700" : stage.status === "blocked" ? "bg-amber-100 text-amber-800" : "bg-muted text-muted-foreground"}`}>{index + 1}</div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="text-sm font-bold">{definition.label}</h3><p className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarDays className="h-3.5 w-3.5" />{formatDate(stage.stageDate)}</p></div><StatusBadge status={stage.status as StageStatus} /></div>
                      <div className="mt-4 min-h-12 rounded-xl bg-muted/55 p-3 text-xs leading-5 text-muted-foreground">{stage.notes || "Nenhuma observação registrada nesta etapa."}</div>
                      {permissions?.canEditStages ? <Button variant="ghost" size="sm" className="mt-3 h-8 px-2 text-xs text-primary" onClick={() => setEditingStage(stage as StageRecord)}><Pencil className="mr-1.5 h-3.5 w-3.5" />Atualizar etapa</Button> : null}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section> : null}

      <EquipmentDialog open={equipmentDialogOpen} onOpenChange={setEquipmentDialogOpen} item={item} canViewBudgetValues={permissions?.canViewBudgetValues} canManageInvoices={permissions?.canManageInvoices} />
      {permissions?.canEditStages ? <StageEditDialog equipmentId={item.id} stage={editingStage} onOpenChange={open => !open && setEditingStage(null)} /> : null}
    </div>
  );
}

function StageEditDialog({ equipmentId, stage, onOpenChange }: { equipmentId: number; stage: StageRecord | null; onOpenChange: (open: boolean) => void }) {
  const utils = trpc.useUtils();
  const [status, setStatus] = useState<StageStatus>("pending");
  const [date, setDate] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!stage) return;
    setStatus(stage.status);
    setDate(toDateInput(stage.stageDate));
    setNotes(stage.notes ?? "");
  }, [stage]);

  const mutation = trpc.procurement.updateStage.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.procurement.detail.invalidate({ id: equipmentId }),
        utils.procurement.list.invalidate(),
        utils.procurement.dashboard.invalidate(),
      ]);
    },
  });

  const save = async () => {
    if (!stage) return;
    try {
      await mutation.mutateAsync({ equipmentId, stageKey: stage.stageKey, status, stageDate: fromDateInput(date), notes: notes.trim() || null });
      toast.success("Etapa atualizada.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível atualizar a etapa.");
    }
  };

  const title = STAGE_DEFINITIONS.find(definition => definition.key === stage?.stageKey)?.label ?? "Etapa";
  return (
    <Dialog open={Boolean(stage)} onOpenChange={onOpenChange}>
      <DialogContent className="rounded-2xl sm:max-w-lg">
        <DialogHeader><DialogTitle className="text-xl tracking-[-0.025em]">{title}</DialogTitle><DialogDescription>Atualize a situação, a data e as observações desta etapa.</DialogDescription></DialogHeader>
        <div className="space-y-5 py-5">
          <div className="space-y-2"><Label>Situação</Label><Select value={status} onValueChange={value => setStatus(value as StageStatus)}><SelectTrigger className="h-11 rounded-xl"><SelectValue /></SelectTrigger><SelectContent>{STAGE_STATUSES.map(option => <SelectItem key={option.key} value={option.key}>{option.label}</SelectItem>)}</SelectContent></Select></div>
          <div className="space-y-2"><Label htmlFor="stage-date">Data da etapa</Label><Input id="stage-date" type="date" value={date} onChange={event => setDate(event.target.value)} className="h-11 rounded-xl" /></div>
          <div className="space-y-2"><Label htmlFor="stage-notes">Observações</Label><Textarea id="stage-notes" value={notes} onChange={event => setNotes(event.target.value)} placeholder="Registre detalhes relevantes, responsáveis ou pendências..." className="min-h-28 resize-y rounded-xl" /></div>
        </div>
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)} disabled={mutation.isPending}>Cancelar</Button><Button onClick={save} disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar etapa</Button></DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function DetailSkeleton() {
  return <div className="space-y-5"><Skeleton className="h-4 w-36" /><Skeleton className="h-10 w-96 max-w-full" /><div className="grid gap-4 xl:grid-cols-[1fr_0.68fr]"><Skeleton className="h-56 rounded-[1.35rem]" /><Skeleton className="h-56 rounded-[1.35rem]" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}</div></div>;
}
