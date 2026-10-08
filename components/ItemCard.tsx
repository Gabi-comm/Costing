"use client";

import { peso } from "@/lib/compute";
import type { PriceItem } from "@/lib/pricing";
import QtyStepper from "./QtyStepper";

interface Props {
  item: PriceItem;
  qty: number;
  onChange: (qty: number) => void;
  /** Name of the missing required item, when this one can't be billed yet. */
  blockedBy?: string;
}

export default function ItemCard({ item, qty, onChange, blockedBy }: Props) {
  const selected = qty > 0;
  const priceLabel = (
    <span className="tnum text-sm font-semibold text-accent">
      {peso(item.price)}
      <span className="font-normal text-muted">
        {item.unit === "qty" ? ` / ${item.unitLabel}` : item.recurring ? " / month" : ""}
      </span>
    </span>
  );

  const shell = `group relative flex h-full flex-col gap-3 rounded-xl border p-4 text-left transition ${
    selected
      ? "border-primary-hi bg-primary/10 shadow-[0_0_0_1px_var(--primary-hi),0_8px_30px_-12px_rgba(37,99,235,0.7)]"
      : "border-line bg-surface hover:border-primary/60"
  }`;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-semibold leading-snug text-ink">{item.name}</h3>
        {item.unit === "flat" && (
          <span
            aria-hidden
            className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md border text-xs transition ${
              selected ? "border-primary-hi bg-primary text-white" : "border-line bg-bg text-transparent"
            }`}
          >
            ✓
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-muted">{item.description}</p>
      {selected && blockedBy && (
        <p className="text-xs font-medium text-warn">Add {blockedBy} to include this.</p>
      )}
    </>
  );

  if (item.unit === "flat") {
    return (
      <button type="button" aria-pressed={selected} onClick={() => onChange(selected ? 0 : 1)} className={shell}>
        {body}
        <div className="mt-auto">{priceLabel}</div>
      </button>
    );
  }

  return (
    <div className={shell}>
      {body}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        {priceLabel}
        <QtyStepper value={qty} onChange={onChange} label={item.unitLabel ?? item.name} />
      </div>
    </div>
  );
}
