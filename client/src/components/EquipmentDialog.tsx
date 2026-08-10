import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

type EditableEquipment = {
  id: number;
  itemNumber: number;
  name: string;
  brand: string | null;
  model: string | null;
  quantity: number;
  unitValueCents?: number;
  invoiceUrl?: string | null;
};

export function EquipmentDialog({ open, onOpenChange, item, canViewBudgetValues = true, canManageInvoices = true }: { open: boolean; onOpenChange: (open: boolean) => void; item?: EditableEquipment | null; canViewBudgetValues?: boolean; canManageInvoices?: boolean }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unitValue, setUnitValue] = useState("0.00");
  const [invoiceUrl, setInvoiceUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(item?.name ?? "");
    setBrand(item?.brand ?? "");
    setModel(item?.model ?? "");
    setQuantity(String(item?.quantity ?? 1));
    setUnitValue(((item?.unitValueCents ?? 0) / 100).toFixed(2));
    setInvoiceUrl(item?.invoiceUrl ?? "");
  }, [item, open]);

  const refresh = async () => {
    await Promise.all([
      utils.procurement.list.invalidate(),
      utils.procurement.dashboard.invalidate(),
      item ? utils.procurement.detail.invalidate({ id: item.id }) : Promise.resolve(),
    ]);
  };

  const createMutation = trpc.procurement.create.useMutation({ onSuccess: refresh });
  const updateMutation = trpc.procurement.update.useMutation({ onSuccess: refresh });
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    const parsedQuantity = Number(quantity);
    const unitValueCents = Math.round(Number(unitValue) * 100);
    if (!name.trim() || !Number.isInteger(parsedQuantity) || parsedQuantity < 1 || !Number.isFinite(unitValueCents) || unitValueCents < 0) {
      toast.error("Revise o nome, a quantidade e o valor unitário.");
      return;
    }

    const payload = {
      name: name.trim(),
      brand: brand.trim() || null,
      model: model.trim() || null,
      quantity: parsedQuantity,
      unitValueCents,
      invoiceUrl: invoiceUrl.trim() || null,
    };

    try {
      if (item) await updateMutation.mutateAsync({ id: item.id, ...payload });
      else await createMutation.mutateAsync(payload);
      toast.success(item ? "Equipamento atualizado." : "Equipamento incluído.");
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o equipamento.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto rounded-2xl sm:max-w-2xl">
        <form onSubmit={submit}>
          <DialogHeader>
            <DialogTitle className="text-xl tracking-[-0.025em]">{item ? `Editar item ${String(item.itemNumber).padStart(2, "0")}` : "Incluir equipamento"}</DialogTitle>
            <DialogDescription>Modelo, marca e dados comerciais podem ser ajustados pelo perfil Gerenciamento.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-5 py-6 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="equipment-name">Equipamento</Label>
              <Input id="equipment-name" value={name} onChange={event => setName(event.target.value)} placeholder="Nome do equipamento" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment-brand">Marca</Label>
              <Input id="equipment-brand" value={brand} onChange={event => setBrand(event.target.value)} placeholder="Marca ou fabricante" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="equipment-quantity">Quantidade</Label>
              <Input id="equipment-quantity" type="number" min="1" step="1" value={quantity} onChange={event => setQuantity(event.target.value)} required />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="equipment-model">Modelo / especificação</Label>
              <Textarea id="equipment-model" value={model} onChange={event => setModel(event.target.value)} placeholder="Modelo e especificações principais" className="min-h-24 resize-y" />
            </div>
            {canViewBudgetValues ? <div className="space-y-2">
              <Label htmlFor="equipment-value">Valor unitário (R$)</Label>
              <Input id="equipment-value" type="number" min="0" step="0.01" value={unitValue} onChange={event => setUnitValue(event.target.value)} />
            </div> : null}
            {canManageInvoices ? <div className="space-y-2">
              <Label htmlFor="equipment-invoice">Link da nota fiscal</Label>
              <Input id="equipment-invoice" type="url" value={invoiceUrl} onChange={event => setInvoiceUrl(event.target.value)} placeholder="https://..." />
            </div> : null}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancelar</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {item ? "Salvar alterações" : "Incluir equipamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
