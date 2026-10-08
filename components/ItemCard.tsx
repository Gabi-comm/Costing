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
    <span className="tnum font-display text-lg text-frost">
      {peso(item.price)}
      <span className="font-sans text-sm text-mist">
        {item.unit === "qty" ? ` / ${item.unitLabel}` : item.recurring ? " / month" : ""}
      </span>
    </span>
  );

  const shell = `group relative flex h-full flex-col gap-3 overflow-hidden rounded-2xl border p-5 text-left backdrop-blur-xl transition-[border-color,background-color,box-shadow,transform] duration-300 ease-[cubic-bezier(0.2,0.8,0.2,1)] active:scale-[0.985] ${
    selected
      ? "border-mist/70 bg-[linear-gradient(160deg,rgba(75,112,141,0.38),rgba(32,58,83,0.22))] shadow-[0_0_0_1px_rgba(144,176,199,0.35),0_18px_40px_-18px_rgba(144,176,199,0.55)]"
      : "border-line bg-[linear-gradient(180deg,rgba(144,176,199,0.07),rgba(144,176,199,0.02))] hover:border-mist/40 hover:bg-surface-2"
  }`;

  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-lg leading-snug text-ink">{item.name}</h3>
        {item.unit === "flat" && (
          <span
            aria-hidden
            className={`mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full border text-xs transition ${
              selected ? "animate-pop border-frost bg-frost text-night shadow-[0_0_14px_rgba(202,220,234,0.6)]" : "border-line bg-night/40 text-transparent"
            }`}
          >
            ✓
          </span>
        )}
      </div>
      <p className="text-sm leading-relaxed text-mist">{item.description}</p>
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
