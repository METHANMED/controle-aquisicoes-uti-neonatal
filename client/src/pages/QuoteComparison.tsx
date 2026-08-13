import { PageHeader } from "@/components/PageHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/procurement";
import { trpc } from "@/lib/trpc";
import { BadgeDollarSign, Boxes, Clock3, Download, Search, Store } from "lucide-react";
import { useMemo, useState } from "react";

type Comparison = { quoteId: number; equipmentId: number; itemNumber: number; equipmentName: string; quantity: number; supplierUserId: number; supplierName: string | null; supplierEmail: string | null; companyName: string | null; unitValueCents: number; offeredBrand: string | null; offeredModel: string | null; leadTimeDays: number | null; notes: string | null; status: "draft" | "submitted"; updatedAt: Date };

const CSV_COLUMNS = ["Item", "Equipamento", "Quantidade", "Fornecedor", "E-mail", "Empresa", "Marca ofertada", "Modelo ofertado", "Prazo (dias)", "Valor unitário (R$)", "Valor total (R$)", "Observações", "Atualizado em"] as const;

function csvCell(value: string) {
  const escaped = value.replace(/"/g, '""');
  return `"${escaped}"`;
}

function exportComparisonToCsv(quotes: Comparison[]) {
  const rows = quotes.map(quote => [
    String(quote.itemNumber).padStart(2, "0"),
    quote.equipmentName,
    String(quote.quantity),
    quote.supplierName ?? "",
    quote.supplierEmail ?? "",
    quote.companyName ?? "",
    quote.offeredBrand ?? "",
    quote.offeredModel ?? "",
    quote.leadTimeDays == null ? "" : String(quote.leadTimeDays),
    (quote.unitValueCents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    ((quote.unitValueCents * quote.quantity) / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    quote.notes ?? "",
    new Date(quote.updatedAt).toLocaleDateString("pt-BR"),
  ]);
  const lines = [CSV_COLUMNS.map(csvCell).join(";"), ...rows.map(row => row.map(csvCell).join(";"))];
  const csvContent = "﻿" + lines.join("\r\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  const today = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `comparacao-propostas-${today}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export default function QuoteComparison() {
  const query = trpc.suppliers.compare.useQuery();
  const [search, setSearch] = useState("");
  const quotes = (query.data ?? []) as Comparison[];
  const submitted = quotes.filter(quote => quote.status === "submitted");
  const filtered = useMemo(() => submitted.filter(quote => [quote.equipmentName, quote.companyName, quote.supplierName, quote.offeredBrand, quote.offeredModel, String(quote.itemNumber)].filter(Boolean).join(" ").toLocaleLowerCase("pt-BR").includes(search.toLocaleLowerCase("pt-BR"))), [submitted, search]);
  const lowestByItem = useMemo(() => { const map = new Map<number, number>(); submitted.forEach(quote => map.set(quote.equipmentId, Math.min(map.get(quote.equipmentId) ?? Number.MAX_SAFE_INTEGER, quote.unitValueCents))); return map; }, [submitted]);
  const suppliers = new Set(submitted.map(quote => quote.supplierUserId)).size;
  const items = new Set(submitted.map(quote => quote.equipmentId)).size;
  const totalQuoted = submitted.reduce((sum, quote) => sum + quote.unitValueCents * quote.quantity, 0);

  return <div className="enter-soft"><PageHeader eyebrow="Gerenciamento · fornecedores" title="Comparação de propostas" description="Visualize os valores enviados pelos fornecedores, identifique a menor proposta por item e compare prazos, marcas e modelos ofertados." actions={<Button variant="outline" className="rounded-xl bg-card" disabled={submitted.length === 0} onClick={() => exportComparisonToCsv(submitted)}><Download className="mr-2 h-4 w-4" />Exportar Excel</Button>} />
    <div className="mb-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Propostas enviadas", value: submitted.length, icon: BadgeDollarSign }, { label: "Fornecedores", value: suppliers, icon: Store }, { label: "Itens cotados", value: items, icon: Boxes }, { label: "Soma das propostas", value: formatCurrency(totalQuoted), icon: BadgeDollarSign }].map(stat => <Card key={stat.label} className="panel-surface rounded-2xl border-0"><CardContent className="flex items-center justify-between p-5"><div><p className="text-xs text-muted-foreground">{stat.label}</p><p className={`mt-2 font-extrabold tracking-[-0.045em] ${typeof stat.value === "string" ? "text-xl" : "text-3xl"}`}>{stat.value}</p></div><div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/8 text-primary"><stat.icon className="h-4 w-4" /></div></CardContent></Card>)}</div>
    <Card className="panel-surface mb-4 rounded-2xl border-0"><CardContent className="p-4"><div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={event => setSearch(event.target.value)} placeholder="Buscar item, fornecedor, marca ou modelo..." className="h-11 rounded-xl bg-background pl-10" /></div></CardContent></Card>
    {query.isLoading ? <Skeleton className="h-96 rounded-2xl" /> : query.error ? <div className="panel-surface rounded-2xl p-10 text-center"><p className="font-semibold">Comparação não liberada para este acesso.</p></div> : filtered.length === 0 ? <div className="panel-surface rounded-2xl p-10 text-center"><Store className="mx-auto mb-3 h-6 w-6 text-muted-foreground" /><p className="font-semibold">Nenhuma proposta enviada</p><p className="mt-1 text-sm text-muted-foreground">Rascunhos não aparecem na comparação.</p></div> : <div className="panel-surface overflow-hidden rounded-2xl"><Table><TableHeader><TableRow className="bg-muted/55 hover:bg-muted/55"><TableHead>Item</TableHead><TableHead>Fornecedor</TableHead><TableHead>Marca / modelo</TableHead><TableHead>Prazo</TableHead><TableHead className="text-right">Valor unitário</TableHead><TableHead className="text-right">Valor total</TableHead></TableRow></TableHeader><TableBody>{filtered.map(quote => { const lowest = lowestByItem.get(quote.equipmentId) === quote.unitValueCents; return <TableRow key={quote.quoteId}><TableCell><p className="text-xs font-bold">{String(quote.itemNumber).padStart(2, "0")}</p><p className="mt-1 max-w-64 text-xs text-muted-foreground">{quote.equipmentName}</p></TableCell><TableCell><p className="text-sm font-semibold">{quote.companyName || quote.supplierName || "Fornecedor"}</p><p className="mt-1 text-xs text-muted-foreground">{quote.supplierEmail}</p></TableCell><TableCell><p className="text-xs font-semibold">{quote.offeredBrand || "Não informada"}</p><p className="mt-1 text-xs text-muted-foreground">{quote.offeredModel || "Modelo não informado"}</p></TableCell><TableCell><span className="inline-flex items-center gap-1.5 text-xs"><Clock3 className="h-3.5 w-3.5 text-muted-foreground" />{quote.leadTimeDays == null ? "Não informado" : `${quote.leadTimeDays} dias`}</span></TableCell><TableCell className="text-right"><div className="flex items-center justify-end gap-2"><span className="font-bold">{formatCurrency(quote.unitValueCents)}</span>{lowest ? <Badge className="bg-emerald-100 text-emerald-800">Menor</Badge> : null}</div></TableCell><TableCell className="text-right font-bold">{formatCurrency(quote.unitValueCents * quote.quantity)}</TableCell></TableRow>; })}</TableBody></Table></div>}
  </div>;
}

