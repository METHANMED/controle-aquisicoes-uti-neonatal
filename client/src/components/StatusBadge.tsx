import { Badge } from "@/components/ui/badge";
import { statusLabel, type StageStatus } from "@/lib/procurement";
import { AlertTriangle, Check, CircleDashed, Clock3 } from "lucide-react";

const styles: Record<StageStatus, string> = {
  pending: "border-slate-200 bg-slate-50 text-slate-600",
  in_progress: "border-sky-200 bg-sky-50 text-sky-700",
  completed: "border-emerald-200 bg-emerald-50 text-emerald-700",
  blocked: "border-amber-200 bg-amber-50 text-amber-800",
};

const icons = {
  pending: CircleDashed,
  in_progress: Clock3,
  completed: Check,
  blocked: AlertTriangle,
};

export function StatusBadge({ status, compact = false }: { status: StageStatus; compact?: boolean }) {
  const Icon = icons[status];
  return (
    <Badge variant="outline" className={`w-fit gap-1.5 rounded-full font-semibold ${compact ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-[11px]"} ${styles[status]}`}>
      <Icon className={compact ? "h-3 w-3" : "h-3.5 w-3.5"} />
      {statusLabel(status)}
    </Badge>
  );
}

