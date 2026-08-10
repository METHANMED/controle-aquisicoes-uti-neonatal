import { STAGE_DEFINITIONS, STAGE_STATUSES, type StageKey, type StageStatus } from "@shared/procurement";

export { STAGE_DEFINITIONS, STAGE_STATUSES };
export type { StageKey, StageStatus };

export function formatCurrency(cents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  }).format(cents / 100);
}

export function formatDate(timestamp: number | null | undefined) {
  if (!timestamp) return "Sem data";
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

export function toDateInput(timestamp: number | null | undefined) {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function fromDateInput(value: string) {
  if (!value) return null;
  const [year, month, day] = value.split("-").map(Number);
  return Date.UTC(year, month - 1, day, 12, 0, 0, 0);
}

export function stageLabel(key: StageKey) {
  return STAGE_DEFINITIONS.find(stage => stage.key === key)?.label ?? key;
}

export function statusLabel(key: StageStatus) {
  return STAGE_STATUSES.find(status => status.key === key)?.label ?? key;
}

