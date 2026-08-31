import type { ReactNode } from "react";

export const nodeBase =
  "min-w-[240px] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-sm";

export const headerBase =
  "flex items-center gap-3 border-b border-border px-4 py-3";

export const iconBase =
  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg";

export const contentBase =
  "space-y-2 px-4 py-3";

export const labelBase =
  "text-[11px] font-medium uppercase tracking-wide text-muted-foreground";

export const valueBase =
  "truncate rounded-md border border-border bg-muted/40 px-2.5 py-2 text-xs text-foreground";

export function NodeHeader({
  icon,
  title,
  description,
  iconClass = "bg-primary/10 text-primary",
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  iconClass?: string;
}) {
  return (
    <div className={headerBase}>
      <div className={`${iconBase} ${iconClass}`}>
        {icon}
      </div>

      <div className="min-w-0">
        <div className="truncate text-sm font-semibold">
          {title}
        </div>

        {description && (
          <div className="truncate text-xs text-muted-foreground">
            {description}
          </div>
        )}
      </div>
    </div>
  );
}

export function NodeField({
  label,
  value,
}: {
  label: string;
  value?: string | number;
}) {
  if (value === undefined || value === "") {
    return null;
  }

  return (
    <div className="space-y-1">
      <div className={labelBase}>{label}</div>

      <div className={valueBase}>
        {String(value)}
      </div>
    </div>
  );
}
