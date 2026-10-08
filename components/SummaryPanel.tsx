"use client";

import { useMemo } from "react";
import { peso, type Quote } from "@/lib/compute";
import { COMPLEXITY, ITEMS, type Complexity } from "@/lib/pricing";
import { Collapse, useLastDefined, usePresence, useTweenedNumber } from "./motion";
import TotalCurve from "./TotalCurve";

const ORDER = new Map(ITEMS.map((item, i) => [item.id, i]));
const orderOf = (key: string) => ORDER.get(key) ?? 0;

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
    <div className={`flex items-baseline justify-between gap-4 py-[3px] text-sm ${tone === "frost" ? "text-frost" : "text-mist"}`}>
      <span>{label}</span>
      <span className="tnum whitespace-nowrap">{value}</span>
    </div>
  );
}

/** An adjustment row that opens/closes smoothly and keeps its last figures while closing. */
function AdjustRow({ show, label, value, tone }: { show: boolean; label: string; value: string; tone?: "mist" | "frost" }) {
  const lastLabel = useLastDefined(show ? label : null) ?? label;
  const lastValue = useLastDefined(show ? value : null) ?? value;
  return (
    <Collapse open={show}>
      <Row label={lastLabel} value={lastValue} tone={tone} />
    </Collapse>
  );
}

export default function SummaryPanel({ quote, complexity, copied, onCopy, onOpen, onReset }: Props) {
  const empty = quote.lines.length === 0 && quote.recurringLines.length === 0;
  const lineItems = useMemo(() => quote.lines.map((l) => ({ key: l.item.id, line: l })), [quote.lines]);
  const rows = usePresence(lineItems, orderOf);
  const total = useTweenedNumber(quote.total);
  const subtotal = useTweenedNumber(quote.subtotal);
  const down = useTweenedNumber(quote.downPayment);
  const balance = useTweenedNumber(quote.balance);
  const monthly = useLastDefined(quote.monthly > 0 ? quote.monthly : null) ?? 0;

  return (
    <section id="summary" className="glass relative overflow-hidden rounded-3xl p-6" aria-label="Quote summary">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-medium uppercase tracking-[0.18em] text-mist">Summary</h2>
        <button
          type="button"
          onClick={onReset}
          tabIndex={empty ? -1 : 0}
          className={`text-xs text-mist underline-offset-4 transition-opacity duration-300 hover:text-frost hover:underline ${empty ? "pointer-events-none opacity-0" : "opacity-100"}`}
        >
          Clear all
        </button>
      </div>

      <Collapse open={empty && rows.length === 0}>
        <p className="pb-2 pt-6 text-sm text-mist">Pick services to build a quote.</p>
      </Collapse>
      <ul className="mt-3">
        {rows.map(({ item: { key, line: l }, leaving }) => (
          <li key={key} className={`grid ${leaving ? "animate-row-out" : "animate-row-in"}`}>
            <div className="min-h-0 overflow-hidden">
              <div className="flex items-baseline justify-between gap-4 py-[5px] text-sm">
                <span className="text-ink">
                  {l.item.name}
                  {l.item.unit === "qty" && <span className="tnum text-mist"> × {l.qty}</span>}
                </span>
                <span className="tnum whitespace-nowrap text-mist">{peso(l.amount)}</span>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Collapse open={quote.blocked.length > 0}>
        <p className="mt-3 rounded-xl border border-warn/30 bg-warn/10 px-3 py-2 text-xs text-warn">
          Not billed: {quote.blocked.map((b) => `${b.item.name} (needs ${b.requires.name})`).join(", ")}
        </p>
      </Collapse>

      <div className="mt-4 border-t border-line pt-3">
        <Row label="Subtotal" value={peso(subtotal)} />
        <AdjustRow
          show={quote.complexityAdj > 0}
          label={`${COMPLEXITY[complexity].label} complexity (×${COMPLEXITY[complexity].multiplier})`}
          value={`+${peso(quote.complexityAdj)}`}
        />
        <AdjustRow show={quote.rushAdj > 0} label="Rush delivery (+25%)" value={`+${peso(quote.rushAdj)}`} />
        <AdjustRow show={quote.discount > 0} label="Discount" value={`−${peso(quote.discount)}`} tone="frost" />
      </div>

      <div className="mt-5">
        <div>
          <span className="text-xs font-medium uppercase tracking-[0.18em] text-mist">Total</span>
          <p className="headline tnum mt-1 font-display text-5xl tracking-tight">{peso(total)}</p>
          <Collapse open={quote.total > 0}>
            <p className="tnum pt-2 text-xs text-mist">
              {peso(down)} down · {peso(balance)} on delivery
            </p>
          </Collapse>
          <Collapse open={quote.monthly > 0}>
            <p className="tnum mt-3 inline-block rounded-full border border-line bg-night/50 px-3 py-1 text-xs text-ink">
              + {peso(monthly)} <span className="text-mist">/ month maintenance</span>
            </p>
          </Collapse>
        </div>
      </div>

      <TotalCurve total={quote.total} />

      <div className="grid gap-2">
        <button
          type="button"
          onClick={onOpen}
          disabled={empty}
          className="rounded-full bg-frost px-4 py-3 text-sm font-semibold text-night shadow-[0_10px_30px_-10px_rgba(202,220,234,0.6)] transition hover:bg-white duration-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Open quotation
        </button>
        <button
          type="button"
          onClick={onCopy}
          disabled={empty}
          className="rounded-full border border-line bg-night/40 px-4 py-3 text-sm font-semibold text-ink transition hover:border-mist hover:text-frost duration-300 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {copied ? "Link copied ✓" : "Copy client link"}
        </button>
      </div>
    </section>
  );
}
