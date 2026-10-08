"use client";

import { peso, type Quote } from "@/lib/compute";
import { COMPLEXITY, type Complexity } from "@/lib/pricing";

interface Props {
  quote: Quote;
  complexity: Complexity;
  copied: boolean;
  onCopy: () => void;
  onOpen: () => void;
  onReset: () => void;
}

function Row({ label, value, tone = "ink" }: { label: string; value: string; tone?: "ink" | "muted" | "accent" }) {
  const color = tone === "accent" ? "text-accent" : tone === "muted" ? "text-muted" : "text-ink";
  return (
    <div className={`flex items-baseline justify-between gap-4 text-sm ${color}`}>
      <span>{label}</span>
      <span className="tnum whitespace-nowrap">{value}</span>
    </div>
  );
}

export default function SummaryPanel({ quote, complexity, copied, onCopy, onOpen, onReset }: Props) {
  const empty = quote.lines.length === 0 && quote.recurringLines.length === 0;

  return (
    <section id="summary" className="rounded-2xl border border-line bg-surface/90 p-5 backdrop-blur" aria-label="Quote summary">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Summary</h2>
        {!empty && (
          <button type="button" onClick={onReset} className="text-xs text-muted underline-offset-4 hover:text-accent hover:underline">
            Clear all
          </button>
        )}
      </div>

      {empty ? (
        <p className="mt-6 mb-2 text-sm text-muted">Pick services on the left to build a quote.</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {quote.lines.map((l) => (
            <li key={l.item.id} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-ink">
                {l.item.name}
                {l.item.unit === "qty" && <span className="text-muted"> × {l.qty}</span>}
              </span>
              <span className="tnum whitespace-nowrap text-muted">{peso(l.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {quote.blocked.length > 0 && (
        <p className="mt-3 rounded-lg border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
          Not billed:{" "}
          {quote.blocked.map((b) => `${b.item.name} (needs ${b.requires.name})`).join(", ")}
        </p>
      )}

      <div className="mt-5 space-y-1.5 border-t border-line pt-4">
        <Row label="Subtotal" value={peso(quote.subtotal)} tone="muted" />
        {quote.complexityAdj > 0 && (
          <Row label={`${COMPLEXITY[complexity].label} complexity (×${COMPLEXITY[complexity].multiplier})`} value={`+${peso(quote.complexityAdj)}`} tone="muted" />
        )}
        {quote.rushAdj > 0 && <Row label="Rush delivery (+25%)" value={`+${peso(quote.rushAdj)}`} tone="muted" />}
        {quote.discount > 0 && <Row label="Discount" value={`−${peso(quote.discount)}`} tone="accent" />}
      </div>

      <div className="mt-4 flex items-end justify-between gap-4">
        <span className="text-sm font-medium text-muted">Total</span>
        <span className="tnum text-4xl font-bold tracking-tight text-ink">{peso(quote.total)}</span>
      </div>
      {quote.total > 0 && (
        <p className="tnum mt-1 text-right text-xs text-muted">
          {peso(quote.downPayment)} down · {peso(quote.balance)} on delivery
        </p>
      )}
      {quote.monthly > 0 && (
        <p className="tnum mt-3 rounded-lg bg-surface-2 px-3 py-2 text-sm text-ink">
          + {peso(quote.monthly)} <span className="text-muted">/ month maintenance</span>
        </p>
      )}

      <div className="mt-5 grid gap-2">
        <button
          type="button"
          onClick={onOpen}
          disabled={empty}
          className="rounded-lg bg-primary px-4 py-3 text-sm font-semibold text-white transition hover:bg-primary-hi disabled:cursor-not-allowed disabled:opacity-40"
        >
          Open quotation
        </button>
        <button
          type="button"
          onClick={onCopy}
          disabled={empty}
          className="rounded-lg border border-line bg-surface-2 px-4 py-3 text-sm font-semibold text-ink transition hover:border-primary-hi hover:text-accent disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "Link copied ✓" : "Copy client link"}
        </button>
      </div>
    </section>
  );
}
