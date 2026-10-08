"use client";

import { useEffect, useMemo, useState } from "react";
import ItemCard from "@/components/ItemCard";
import ModifierGroup from "@/components/ModifierGroup";
import { useTweenedNumber } from "@/components/motion";
import SummaryPanel from "@/components/SummaryPanel";
import { computeQuote, EMPTY_SELECTION, peso, type Selection } from "@/lib/compute";
import { CATEGORIES, COMPLEXITY, DISCOUNTS, ITEM_BY_ID, ITEMS, type Complexity, type DiscountKind } from "@/lib/pricing";
import { EMPTY_INFO, encodeQuote, newQuoteMeta, type ClientInfo, type QuoteMeta, type SharedQuote } from "@/lib/share";

export const DRAFT_KEY = "cost-calculator:draft";

const fieldCls =
  "w-full rounded-xl border border-line bg-night/60 px-3.5 py-3 text-sm text-ink placeholder:text-mist/50 outline-none transition focus:border-mist focus:bg-night/80";

interface Props {
  initial: SharedQuote;
  /** False for the server-rendered placeholder, so it never overwrites the saved draft. */
  persist: boolean;
}

export default function Calculator({ initial, persist }: Props) {
  const [selection, setSelection] = useState<Selection>(initial.selection);
  const [info, setInfo] = useState<ClientInfo>(initial.info);
  const [meta, setMeta] = useState<QuoteMeta | null>(initial.meta);
  const [copied, setCopied] = useState(false);

  const encoded = encodeQuote({ selection, info, meta });

  useEffect(() => {
    if (!persist) return;
    try {
      localStorage.setItem(DRAFT_KEY, encoded);
    } catch {}
  }, [encoded, persist]);

  const quote = useMemo(() => computeQuote(selection), [selection]);
  const shownTotal = useTweenedNumber(quote.total);

  const setQty = (id: string, qty: number) =>
    setSelection((s) => {
      const items = { ...s.items };
      if (qty > 0) items[id] = qty;
      else delete items[id];
      return { ...s, items };
    });

  const quoteUrl = () => {
    const m = meta ?? newQuoteMeta();
    if (!meta) setMeta(m);
    return `${window.location.origin}/quote?${encodeQuote({ selection, info, meta: m })}`;
  };

  const copyLink = async () => {
    const url = quoteUrl();
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      window.prompt("Copy this link:", url);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const reset = () => {
    setSelection(EMPTY_SELECTION);
    setInfo(EMPTY_INFO);
    setMeta(null);
    if (window.location.search) window.history.replaceState(null, "", "/");
  };

  const blockedIds = new Set(quote.blocked.map((b) => b.item.id));

  return (
    <div id="calculator" className="mx-auto max-w-7xl scroll-mt-4 px-4 pb-10 pt-16 sm:px-6 lg:pb-12 lg:pt-24">
      <header className="mb-12 flex flex-wrap items-end justify-between gap-6">
        <div>
          <h2 className="headline font-display text-5xl font-normal leading-[0.95] tracking-tight sm:text-7xl">
            Build your <span className="font-serif italic text-frost">quote</span>
          </h2>
          <p className="mt-4 max-w-md text-base text-mist">
            Select services, set complexity and timeline, then send the client a quotation link or PDF.
          </p>
        </div>
        {meta && <p className="tnum rounded-full border border-line px-3 py-1 text-xs text-mist">Quote {meta.number}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
        <main className="space-y-12">
          <section aria-labelledby="client-h" className="glass rounded-3xl p-5 sm:p-6">
            <h2 id="client-h" className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-mist">
              Client details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={fieldCls} name="client" placeholder="Client name" value={info.client} onChange={(e) => setInfo({ ...info, client: e.target.value })} aria-label="Client name" />
              <input className={fieldCls} name="project" placeholder="Project name" value={info.project} onChange={(e) => setInfo({ ...info, project: e.target.value })} aria-label="Project name" />
              <textarea
                className={`${fieldCls} min-h-20 sm:col-span-2`}
                name="notes" placeholder="Notes / scope (shown on the quotation)"
                value={info.notes}
                onChange={(e) => setInfo({ ...info, notes: e.target.value })}
                aria-label="Notes"
              />
            </div>
          </section>

          {CATEGORIES.map((cat) => (
            <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
              <div className="mb-5 flex flex-wrap items-baseline gap-x-4 gap-y-1 border-b border-line pb-3">
                <h2 id={`cat-${cat.id}`} className="font-display text-2xl font-normal tracking-tight text-ink">
                  {cat.title}
                </h2>
                <p className="text-sm text-mist">{cat.blurb}</p>
              </div>
              <div className={`grid gap-3 sm:grid-cols-2 ${cat.id === "core" ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
                {ITEMS.filter((i) => i.category === cat.id).map((item) => (
                  <ItemCard
                    key={item.id}
                    item={item}
                    qty={selection.items[item.id] ?? 0}
                    onChange={(q) => setQty(item.id, q)}
                    blockedBy={blockedIds.has(item.id) && item.requires ? ITEM_BY_ID[item.requires].name : undefined}
                  />
                ))}
              </div>
            </section>
          ))}

          <section aria-labelledby="mod-h" className="glass space-y-6 rounded-3xl p-5 sm:p-6">
            <h2 id="mod-h" className="font-display text-2xl font-normal tracking-tight text-ink">
              Adjustments
            </h2>
            <ModifierGroup<Complexity>
              label="Complexity"
              value={selection.complexity}
              onChange={(complexity) => setSelection((s) => ({ ...s, complexity }))}
              options={(Object.keys(COMPLEXITY) as Complexity[]).map((k) => ({
                value: k,
                label: `${COMPLEXITY[k].label} ×${COMPLEXITY[k].multiplier}`,
                hint: COMPLEXITY[k].hint,
              }))}
            />
            <ModifierGroup<"no" | "yes">
              label="Timeline"
              value={selection.rush ? "yes" : "no"}
              onChange={(v) => setSelection((s) => ({ ...s, rush: v === "yes" }))}
              options={[
                { value: "no", label: "Regular", hint: "Standard schedule" },
                { value: "yes", label: "Rush +25%", hint: "Delivery in under a week" },
              ]}
            />
            <ModifierGroup<DiscountKind>
              label="Discount"
              value={selection.discount}
              onChange={(discount) => setSelection((s) => ({ ...s, discount }))}
              options={[
                ...(Object.keys(DISCOUNTS) as Exclude<DiscountKind, "custom">[]).map((k) => ({ value: k, label: DISCOUNTS[k].label })),
                { value: "custom" as const, label: "Custom amount" },
              ]}
            />
            {selection.discount === "custom" && (
              <label className="flex max-w-xs items-center gap-2 text-sm text-mist">
                ₱
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={`${fieldCls} tnum`}
                  value={selection.customDiscount || ""}
                  placeholder="0"
                  onChange={(e) => setSelection((s) => ({ ...s, customDiscount: Math.max(0, Number(e.target.value) || 0) }))}
                  name="customDiscount" aria-label="Custom discount in pesos"
                />
              </label>
            )}
          </section>
        </main>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          <SummaryPanel
            quote={quote}
            complexity={selection.complexity}
            copied={copied}
            onCopy={copyLink}
            onOpen={() => window.open(quoteUrl(), "_blank", "noopener")}
            onReset={reset}
          />
        </aside>
      </div>

      {/* Mobile total bar */}
      <a
        href="#summary"
        className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t border-line bg-night/85 px-4 py-3 backdrop-blur-xl lg:hidden"
      >
        <span className="text-sm text-mist">
          Total{quote.monthly > 0 && <span className="tnum"> · +{peso(quote.monthly)}/mo</span>}
        </span>
        <span className="flex items-center gap-3">
          <span className="tnum font-display text-2xl text-ink">{peso(shownTotal)}</span>
          <span className="rounded-full bg-frost px-3.5 py-1.5 text-xs font-semibold text-night">Review</span>
        </span>
      </a>
    </div>
  );
}
