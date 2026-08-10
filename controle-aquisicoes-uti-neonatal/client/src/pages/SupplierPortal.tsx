import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/procurement";
import { trpc } from "@/lib/trpc";
import { Building2, CheckCircle2, Clock3, FileEdit, Loader2, Pencil, Search, Send, Store } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Quote = { id: number; unitValueCents: number; offeredBrand: string | null; offeredModel: string | null; leadTimeDays: number | null; notes: string | null; status: "draft" | "submitted" };
type PortalItem = { id: number; itemNumber: number; name: string; brand: string | null; model: string | null; quantity: number; quote: Quote | null };

export default function SupplierPortal() {
  const query = trpc.suppliers.portal.useQuery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [editing, setEditing] = useState<PortalItem | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const items = (query.data?.items ?? []) as PortalItem[];
  const filtered = useMemo(() => items.filter(item => {
    const matchesSearch = [item.name, item.brand, item.model, String(item.itemNumber)].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"));
    const matchesStatus = statusFilter === "all" || (statusFilter === "missing" && !item.quote) || item.quote?.status === statusFilter;
    return matchesSearch && matchesStatus;
  }), [items, search, statusFilter]);
  const submitted = items.filter(item => item.quote?.status === "submitted").length;
  const drafts = items.filter(item => item.quote?.status === "draft").length;

  if (query.isLoading) return <SupplierSkeleton />;
  if (query.error) return <div className="panel-surface rounded-2xl p-10 text-center"><Store className="mx-auto mb-3 h-6 w-6 text-muted-foreground" /><p className="font-semibold">O portal de cotações não está liberado para este acesso.</p></div>;

  return (
    <div className="enter-soft">
      <PageHeader eyebrow="Portal do fornecedor" title="Valores para compra" description="Informe sua proposta por equipamento. Os valores-base da MethanMed e as propostas de outros fornecedores permanecem confidenciais." actions={<Button variant="outline" className="rounded-xl bg-card" onClick={() => setProfileOpen(true)}><Building2 className="mr-2 h-4 w-4" />Dados da empresa</Button>} />

      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        {[{ label: "Itens disponíveis", value: items.length, icon: Store }, { label: "Propostas enviadas", value: submitted, icon: CheckCircle2 }, { label: "Rascunhos", value: drafts, icon: FileEdit }].map(stat => <Card key={stat.label} className="panel-surface rounded-2xl border-0"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{stat.label}</p><p className="mt-2 text-3xl font-extrabold tracking-[-0.045em]">{stat.value}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary"><stat.icon className="h-4 w-4" /></div></CardContent></Card>)}
      </div>

      <Card className="panel-surface mb-4 rounded-2xl border-0"><CardContent className="flex flex-col gap-3 p-4 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar item, marca ou modelo..." className="h-11 rounded-xl bg-background pl-10" /></div><Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="h-11 rounded-xl bg-background sm:w-52"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Todas as situações</SelectItem><SelectItem value="missing">Sem cotação</SelectItem><SelectItem value="draft">Rascunho</SelectItem><SelectItem value="submitted">Enviada</SelectItem></SelectContent></Select></CardContent></Card>

      <div className="grid gap-3">
        {filtered.map(item => <Card key={item.id} className="panel-surface rounded-2xl border-0"><CardContent className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1.4fr)_0.8fr_0.55fr_auto] lg:items-center"><div className="flex min-w-0 items-start gap-3"><span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-muted text-xs font-bold text-muted-foreground">{String(item.itemNumber).padStart(2, "0")}</span><div className="min-w-0"><p className="text-sm font-bold">{item.name}</p><p className="mt-1 truncate text-xs text-muted-foreground">Referência: {item.brand || "Sem marca"} · {item.model || "Sem modelo"} · Qtd. {item.quantity}</p></div></div><div>{item.quote ? <><p className="text-[10px] font-bold uppercase tracking-[0.13em] text-muted-foreground">Sua proposta unitária</p><p className="mt-1 text-lg font-extrabold tracking-[-0.035em]">{formatCurrency(item.quote.unitValueCents)}</p></> : <p className="text-xs text-muted-foreground">Nenhum valor informado</p>}</div><div>{item.quote ? <Badge className={`rounded-full ${item.quote.status === "submitted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{item.quote.status === "submitted" ? "Enviada" : "Rascunho"}</Badge> : <Badge variant="outline" className="rounded-full">Pendente</Badge>}</div><Button variant={item.quote ? "outline" : "default"} className="rounded-xl" onClick={() => setEditing(item)}>{item.quote ? <Pencil className="mr-2 h-4 w-4" /> : <Send className="mr-2 h-4 w-4" />}{item.quote ? "Editar" : "Informar valor"}</Button></CardContent></Card>)}
      </div>

      <QuoteDialog item={editing} onOpenChange={open => !open && setEditing(null)} />
      <ProfileDialog open={profileOpen} onOpenChange={setProfileOpen} profile={query.data?.profile ?? null} />
    </div>
  );
}

function QuoteDialog({ item, onOpenChange }: { item: PortalItem | null; onOpenChange: (open: boolean) => void }) {
  const utils = trpc.useUtils();
  const [unitValue, setUnitValue] = useState(""); const [brand, setBrand] = useState(""); const [model, setModel] = useState(""); const [leadTime, setLeadTime] = useState(""); const [notes, setNotes] = useState("");
  useEffect(() => { if (!item) return; setUnitValue(item.quote ? (item.quote.unitValueCents / 100).toFixed(2) : ""); setBrand(item.quote?.offeredBrand ?? item.brand ?? ""); setModel(item.quote?.offeredModel ?? item.model ?? ""); setLeadTime(item.quote?.leadTimeDays == null ? "" : String(item.quote.leadTimeDays)); setNotes(item.quote?.notes ?? ""); }, [item]);
  const mutation = trpc.suppliers.saveQuote.useMutation({ onSuccess: async () => { await utils.suppliers.portal.invalidate(); } });
  const save = async (status: "draft" | "submitted") => { if (!item) return; const cents = Math.round(Number(unitValue) * 100); if (!Number.isFinite(cents) || cents < 1) { toast.error("Informe um valor unitário válido."); return; } try { await mutation.mutateAsync({ equipmentId: item.id, unitValueCents: cents, offeredBrand: brand.trim() || null, offeredModel: model.trim() || null, leadTimeDays: leadTime ? Number(leadTime) : null, notes: notes.trim() || null, status }); toast.success(status === "submitted" ? "Proposta enviada." : "Rascunho salvo."); onOpenChange(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar a proposta."); } };
  return <Dialog open={Boolean(item)} onOpenChange={onOpenChange}><DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-2xl"><DialogHeader><DialogTitle>{item?.name}</DialogTitle><DialogDescription>Quantidade solicitada: {item?.quantity}. Informe os dados da sua proposta comercial.</DialogDescription></DialogHeader><div className="grid gap-5 py-5 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="quote-value">Valor unitário (R$)</Label><Input id="quote-value" type="number" min="0.01" step="0.01" value={unitValue} onChange={event => setUnitValue(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="quote-lead">Prazo de entrega (dias)</Label><Input id="quote-lead" type="number" min="0" step="1" value={leadTime} onChange={event => setLeadTime(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="quote-brand">Marca ofertada</Label><Input id="quote-brand" value={brand} onChange={event => setBrand(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="quote-model">Modelo ofertado</Label><Input id="quote-model" value={model} onChange={event => setModel(event.target.value)} /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="quote-notes">Observações</Label><Textarea id="quote-notes" value={notes} onChange={event => setNotes(event.target.value)} className="min-h-24" placeholder="Validade da proposta, condições comerciais ou informações técnicas..." /></div></div><DialogFooter className="gap-2"><Button variant="outline" onClick={() => save("draft")} disabled={mutation.isPending}><FileEdit className="mr-2 h-4 w-4" />Salvar rascunho</Button><Button onClick={() => save("submitted")} disabled={mutation.isPending}>{mutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}Enviar proposta</Button></DialogFooter></DialogContent></Dialog>;
}

function ProfileDialog({ open, onOpenChange, profile }: { open: boolean; onOpenChange: (open: boolean) => void; profile: { companyName: string | null; cnpj: string | null; contactPhone: string | null } | null }) {
  const utils = trpc.useUtils(); const [company, setCompany] = useState(""); const [cnpj, setCnpj] = useState(""); const [phone, setPhone] = useState("");
  useEffect(() => { if (!open) return; setCompany(profile?.companyName ?? ""); setCnpj(profile?.cnpj ?? ""); setPhone(profile?.contactPhone ?? ""); }, [open, profile]);
  const mutation = trpc.suppliers.updateProfile.useMutation({ onSuccess: async () => { await Promise.all([utils.suppliers.portal.invalidate(), utils.access.me.invalidate()]); } });
  const save = async () => { try { await mutation.mutateAsync({ companyName: company.trim() || null, cnpj: cnpj.trim() || null, contactPhone: phone.trim() || null }); toast.success("Dados da empresa atualizados."); onOpenChange(false); } catch (error) { toast.error(error instanceof Error ? error.message : "Não foi possível salvar os dados."); } };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="rounded-2xl sm:max-w-lg"><DialogHeader><DialogTitle>Dados da empresa</DialogTitle><DialogDescription>Informações exibidas ao administrador junto às suas propostas.</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="profile-company">Empresa</Label><Input id="profile-company" value={company} onChange={event => setCompany(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="profile-cnpj">CNPJ</Label><Input id="profile-cnpj" value={cnpj} onChange={event => setCnpj(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="profile-phone">Telefone</Label><Input id="profile-phone" value={phone} onChange={event => setPhone(event.target.value)} /></div></div><DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button onClick={save} disabled={mutation.isPending}>{mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Salvar</Button></DialogFooter></DialogContent></Dialog>;
}

function SupplierSkeleton() { return <div className="space-y-4"><Skeleton className="h-10 w-80 max-w-full" /><div className="grid gap-3 sm:grid-cols-3">{Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-28 rounded-2xl" />)}</div>{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-24 rounded-2xl" />)}</div>; }

