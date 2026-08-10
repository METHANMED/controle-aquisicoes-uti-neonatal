import type { ReactNode } from "react";

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow: string; title: string; description: string; actions?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
      <div className="max-w-3xl">
        <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.18em] text-primary">{eyebrow}</p>
        <h1 className="text-2xl font-bold tracking-[-0.035em] text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p>
      </div>
      {actions ? <div className="shrink-0">{actions}</div> : null}
    </div>
  );
}

