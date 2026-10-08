"use client";

import { peso, type Quote } from "@/lib/compute";
import { COMPLEXITY, type Complexity } from "@/lib/pricing";
import TotalCurve from "./TotalCurve";

interface Props {
  quote: Quote;
  complexity: Complexity;
  copied: boolean;
  onCopy: () => void;
  onOpen: () => void;
  onReset: () => void;
}

function Row({ label, value, tone = "mist" }: { label: string; value: string; tone?: "mist" | "frost" }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 text-sm ${tone === "frost" ? "text-frost" : "text-mist"}`}>
      <span>{label}</span>
      <span className="tnum whitespace-nowrap">{value}</span>
    </div>
  );
}

export default function SummaryPanel({ quote, complexity, copied, onCopy, onOpen, onReset }: Props) {
  const empty = quote.lines.length === 0 && quote.recurringLines.length === 0;

  return (
    <section id="summary" className="glass relative overflow-hidden rounded-3xl p-6" aria-label="Quote summary">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-mist">Summary</h2>
        {!empty && (
          <button type="button" onClick={onReset} className="text-xs text-mist underline-offset-4 hover:text-frost hover:underline">
            Clear all
          </button>
        )}
      </div>

      {empty ? (
        <p className="mb-2 mt-6 text-sm text-mist">Pick services to build a quote.</p>
      ) : (
        <ul className="mt-4 space-y-2.5">
          {quote.lines.map((l) => (
            <li key={l.item.id} className="flex items-baseline justify-between gap-4 text-sm">
              <span className="text-ink">
                {l.item.name}
                {l.item.unit === "qty" && <span className="text-mist"> × {l.qty}</span>}
              </span>
              <span className="tnum whitespace-nowrap text-mist">{peso(l.amount)}</span>
            </li>
          ))}
        </ul>
      )}

      {quote.blocked.length > 0 && (
        <p className="mt-3 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
          Not billed: {quote.blocked.map((b) => `${b.item.name} (needs ${b.requires.name})`).join(", ")}
        </p>
      )}

      <div className="mt-5 space-y-1.5 border-t border-line pt-4">
        <Row label="Subtotal" value={peso(quote.subtotal)} />
        {quote.complexityAdj > 0 && (
          <Row
            label={`${COMPLEXITY[complexity].label} complexity (×${COMPLEXITY[complexity].multiplier})`}
            value={`+${peso(quote.complexityAdj)}`}
          />
        )}
        {quote.rushAdj > 0 && <Row label="Rush delivery (+25%)" value={`+${peso(quote.rushAdj)}`} />}
        {quote.discount > 0 && <Row label="Discount" value={`−${peso(quote.discount)}`} tone="frost" />}
      </div>

      <div className="mt-5">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-mist">Total</span>
          <p className="headline tnum mt-1 font-display text-5xl tracking-tight">{peso(quote.total)}</p>
          {quote.total > 0 && (
            <p className="tnum mt-2 text-xs text-mist">
              {peso(quote.downPayment)} down · {peso(quote.balance)} on delivery
            </p>
          )}
          {quote.monthly > 0 && (
            <p className="tnum mt-3 inline-block rounded-full border border-line bg-night/50 px-3 py-1 text-xs text-ink">
              + {peso(quote.monthly)} <span className="text-mist">/ month maintenance</span>
            </p>
          )}
        </div>
      </div>

      <TotalCurve total={quote.total} />

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onOpen}
          disabled={empty}
          className="rounded-full bg-frost px-4 py-3 text-sm font-semibold text-night shadow-[0_10px_30px_-10px_rgba(202,220,234,0.6)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          Open quotation
        </button>
        <button
          type="button"
          onClick={onCopy}
          disabled={empty}
          className="rounded-full border border-line bg-night/40 px-4 py-3 text-sm font-semibold text-ink transition hover:border-mist hover:text-frost disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "Link copied ✓" : "Copy client link"}
        </button>
      </div>
    </section>
  );
}
