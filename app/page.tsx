"use client";

import { useEffect, useMemo, useState } from "react";
import ItemCard from "@/components/ItemCard";
import ModifierGroup from "@/components/ModifierGroup";
import SummaryPanel from "@/components/SummaryPanel";
import { computeQuote, EMPTY_SELECTION, peso, type Selection } from "@/lib/compute";
import { CATEGORIES, COMPLEXITY, DISCOUNTS, ITEM_BY_ID, ITEMS, type Complexity, type DiscountKind } from "@/lib/pricing";
import { decodeQuote, EMPTY_INFO, encodeQuote, newQuoteMeta, type ClientInfo, type QuoteMeta } from "@/lib/share";

const DRAFT_KEY = "cost-calculator:draft";

const fieldCls =
  "w-full rounded-lg border border-line bg-bg px-3 py-2.5 text-sm text-ink placeholder:text-muted/60 outline-none transition focus:border-primary-hi";

export default function CalculatorPage() {
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION);
  const [info, setInfo] = useState<ClientInfo>(EMPTY_INFO);
  const [meta, setMeta] = useState<QuoteMeta | null>(null);
  const [copied, setCopied] = useState(false);
  const [loaded, setLoaded] = useState(false);

  // Load from a shared link (?i=...) first, else the saved draft.
  useEffect(() => {
    const search = window.location.search;
    let source = search.length > 1 ? search : "";
    if (!source) {
      try {
        source = localStorage.getItem(DRAFT_KEY) ?? "";
      } catch {}
    }
    if (source) {
      const d = decodeQuote(source);
      setSelection(d.selection);
      setInfo(d.info);
      setMeta(d.meta);
    }
    setLoaded(true);
  }, []);

  const encoded = encodeQuote({ selection, info, meta });

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem(DRAFT_KEY, encoded);
    } catch {}
  }, [encoded, loaded]);

  const quote = useMemo(() => computeQuote(selection), [selection]);

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
    <div className="mx-auto max-w-7xl px-4 pb-32 pt-8 sm:px-6 lg:pb-16 lg:pt-12">
      <header className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-primary-hi" />
            Project cost calculator
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-ink sm:text-4xl">
            Gabi-<span className="text-accent">comm</span>
          </h1>
          <p className="mt-2 max-w-xl text-sm text-muted">
            Select services, set complexity and timeline, then send the client a quotation link or PDF.
          </p>
        </div>
        {meta && <p className="tnum text-xs text-muted">Quote {meta.number}</p>}
      </header>

      <div className="grid gap-8 lg:grid-cols-[1fr_22rem] xl:grid-cols-[1fr_24rem]">
        <main className="space-y-10">
          <section aria-labelledby="client-h" className="rounded-2xl border border-line bg-surface p-5">
            <h2 id="client-h" className="mb-4 text-xs font-semibold uppercase tracking-wider text-muted">
              Client details
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={fieldCls} placeholder="Client name" value={info.client} onChange={(e) => setInfo({ ...info, client: e.target.value })} aria-label="Client name" />
              <input className={fieldCls} placeholder="Project name" value={info.project} onChange={(e) => setInfo({ ...info, project: e.target.value })} aria-label="Project name" />
              <textarea
                className={`${fieldCls} min-h-20 sm:col-span-2`}
                placeholder="Notes / scope (shown on the quotation)"
                value={info.notes}
                onChange={(e) => setInfo({ ...info, notes: e.target.value })}
                aria-label="Notes"
              />
            </div>
          </section>

          {CATEGORIES.map((cat) => (
            <section key={cat.id} aria-labelledby={`cat-${cat.id}`}>
              <div className="mb-4 flex items-baseline gap-3">
                <h2 id={`cat-${cat.id}`} className="text-lg font-semibold text-ink">
                  {cat.title}
                </h2>
                <p className="text-sm text-muted">{cat.blurb}</p>
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

          <section aria-labelledby="mod-h" className="space-y-6 rounded-2xl border border-line bg-surface p-5">
            <h2 id="mod-h" className="text-lg font-semibold text-ink">
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
              <label className="flex max-w-xs items-center gap-2 text-sm text-muted">
                ₱
                <input
                  type="number"
                  inputMode="numeric"
                  min={0}
                  className={`${fieldCls} tnum`}
                  value={selection.customDiscount || ""}
                  placeholder="0"
                  onChange={(e) => setSelection((s) => ({ ...s, customDiscount: Math.max(0, Number(e.target.value) || 0) }))}
                  aria-label="Custom discount in pesos"
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
        className="fixed inset-x-0 bottom-0 z-10 flex items-center justify-between gap-4 border-t border-line bg-bg/95 px-4 py-3 backdrop-blur lg:hidden"
      >
        <span className="text-sm text-muted">
          Total{quote.monthly > 0 && <span className="tnum"> · +{peso(quote.monthly)}/mo</span>}
        </span>
        <span className="flex items-center gap-3">
          <span className="tnum text-xl font-bold text-ink">{peso(quote.total)}</span>
          <span className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-white">Review</span>
        </span>
      </a>
    </div>
  );
}
