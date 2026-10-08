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

function Row({ label, value, tone = "mist" }: { label: string; value: string; tone?: "mist" | "frost" }) {
  return (
    <div className={`flex items-baseline justify-between gap-4 text-sm ${tone === "frost" ? "text-frost" : "text-mist"}`}>
      <span>{label}</span>
      <span className="tnum whitespace-nowrap">{value}</span>
    </div>
  );
}

/** The reference's chart line with a glowing point, used as a quiet backdrop for the total. */
function TotalCurve() {
  return (
    <div aria-hidden className="pointer-events-none relative -mx-6 mb-4 mt-5 h-20">
      <div className="dot-grid absolute inset-0 [mask-image:linear-gradient(to_top,black,transparent)]" />
      <svg viewBox="0 0 300 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        <path
          d="M0 92 C 40 88, 55 70, 80 72 S 110 30, 130 40 S 160 85, 190 70 S 230 20, 255 18 S 290 14, 300 16"
          fill="none"
          stroke="rgba(237,243,248,0.55)"
          strokeWidth="1.2"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span className="absolute right-[15%] top-[14%] grid h-10 w-10 -translate-y-1/2 translate-x-1/2 place-items-center rounded-full bg-frost/10">
        <span className="grid h-6 w-6 place-items-center rounded-full bg-frost/20">
          <span className="h-2.5 w-2.5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.9)]" />
        </span>
      </span>
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

      <TotalCurve />

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
