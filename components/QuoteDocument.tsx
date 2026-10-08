import { computeQuote, peso } from "@/lib/compute";
import { COMPLEXITY, DOWN_PAYMENT_RATE, FREELANCER, QUOTE_VALID_DAYS } from "@/lib/pricing";
import type { SharedQuote } from "@/lib/share";

const fmtDate = (d: Date) => d.toLocaleDateString("en-PH", { year: "numeric", month: "long", day: "numeric" });

export default function QuoteDocument({ selection, info, meta }: SharedQuote) {
  const quote = computeQuote(selection);
  const issued = meta ? new Date(`${meta.date}T00:00:00`) : new Date();
  const validUntil = new Date(issued);
  validUntil.setDate(validUntil.getDate() + QUOTE_VALID_DAYS);
  const pct = Math.round(DOWN_PAYMENT_RATE * 100);

  return (
    <article className="quote-sheet mx-auto max-w-3xl overflow-hidden rounded-xl bg-white text-[#091525] shadow-[0_20px_60px_-20px_rgba(9,21,37,0.45)]">
      <header className="bg-[radial-gradient(80%_120%_at_0%_0%,#4b708d_0%,transparent_60%),linear-gradient(135deg,#203a53_0%,#091525_70%)] px-6 py-8 text-white sm:px-10">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div>
            <p className="font-serif text-xl italic text-[#cadcea]">Quotation</p>
            <h1 className="mt-1 font-display text-3xl tracking-tight">{info.project || "Project quotation"}</h1>
            {info.client && <p className="mt-1 text-sm text-[#cadcea]">Prepared for {info.client}</p>}
          </div>
          <dl className="tnum grid grid-cols-[auto_auto] gap-x-4 gap-y-1 text-sm">
            <dt className="text-[#90b0c7]">No.</dt>
            <dd className="font-semibold">{meta?.number ?? "Draft"}</dd>
            <dt className="text-[#90b0c7]">Date</dt>
            <dd>{fmtDate(issued)}</dd>
            <dt className="text-[#90b0c7]">Valid until</dt>
            <dd>{fmtDate(validUntil)}</dd>
          </dl>
        </div>
        <div className="mt-6 h-1 w-16 rounded-full bg-[#cadcea]" />
      </header>

      <div className="px-6 py-8 sm:px-10">
        <div className="mb-8 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-[#5b6677]">From</p>
            <p className="mt-1 font-semibold">{FREELANCER.name}</p>
            <p className="text-[#5b6677]">{FREELANCER.role}</p>
            <p className="text-[#4b708d]">{FREELANCER.email}</p>
          </div>
          {info.notes && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#5b6677]">Scope notes</p>
              <p className="mt-1 whitespace-pre-line text-[#2a3342]">{info.notes}</p>
            </div>
          )}
        </div>

        <table className="tnum w-full text-sm">
          <thead>
            <tr className="border-b-2 border-[#091525] text-left text-xs uppercase tracking-wider text-[#5b6677]">
              <th className="py-2 pr-3 font-semibold">Item</th>
              <th className="hidden py-2 pr-3 text-right font-semibold sm:table-cell">Rate</th>
              <th className="py-2 pr-3 text-right font-semibold">Qty</th>
              <th className="py-2 text-right font-semibold">Amount</th>
            </tr>
          </thead>
          <tbody>
            {quote.lines.map((l) => (
              <tr key={l.item.id} className="border-b border-[#e3e8ef] align-top">
                <td className="py-3 pr-3">
                  <p className="font-medium">{l.item.name}</p>
                  <p className="text-xs text-[#5b6677]">{l.item.description}</p>
                </td>
                <td className="hidden py-3 pr-3 text-right text-[#5b6677] sm:table-cell">{peso(l.item.price)}</td>
                <td className="py-3 pr-3 text-right">{l.qty}</td>
                <td className="py-3 text-right font-medium">{peso(l.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="tnum ml-auto mt-6 max-w-xs space-y-1.5 text-sm">
          <div className="flex justify-between text-[#5b6677]">
            <span>Subtotal</span>
            <span>{peso(quote.subtotal)}</span>
          </div>
          {quote.complexityAdj > 0 && (
            <div className="flex justify-between text-[#5b6677]">
              <span>{COMPLEXITY[selection.complexity].label} complexity</span>
              <span>+{peso(quote.complexityAdj)}</span>
            </div>
          )}
          {quote.rushAdj > 0 && (
            <div className="flex justify-between text-[#5b6677]">
              <span>Rush delivery</span>
              <span>+{peso(quote.rushAdj)}</span>
            </div>
          )}
          {quote.discount > 0 && (
            <div className="flex justify-between text-[#4b708d]">
              <span>Discount</span>
              <span>−{peso(quote.discount)}</span>
            </div>
          )}
        </div>

        <div className="tnum mt-4 flex items-center justify-between rounded-xl bg-[linear-gradient(135deg,#091525,#203a53_60%,#4b708d)] px-5 py-4 text-white">
          <span className="text-sm font-semibold uppercase tracking-wider">Total</span>
          <span className="font-display text-3xl">{peso(quote.total)}</span>
        </div>

        {quote.recurringLines.map((l) => (
          <div key={l.item.id} className="tnum mt-3 flex items-center justify-between rounded-lg border border-[#d6dde8] px-5 py-3 text-sm">
            <span>
              {l.item.name} <span className="text-[#5b6677]">(billed monthly, optional)</span>
            </span>
            <span className="font-semibold">{peso(l.amount)} / mo</span>
          </div>
        ))}

        <section className="mt-10 grid gap-6 border-t border-[#e3e8ef] pt-6 text-sm sm:grid-cols-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5b6677]">Payment terms</h2>
            <ul className="tnum mt-2 space-y-1 text-[#2a3342]">
              <li className="flex justify-between gap-4">
                <span>{pct}% down payment to start</span>
                <span className="font-semibold">{peso(quote.downPayment)}</span>
              </li>
              <li className="flex justify-between gap-4">
                <span>{100 - pct}% upon delivery</span>
                <span className="font-semibold">{peso(quote.balance)}</span>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#5b6677]">Notes</h2>
            <ul className="mt-2 list-disc space-y-1 pl-4 text-[#2a3342]">
              <li>Includes 2 revision rounds.</li>
              <li>Domain, hosting and third-party service fees are billed at cost.</li>
              <li>Valid for {QUOTE_VALID_DAYS} days from the date above.</li>
            </ul>
          </div>
        </section>
      </div>
    </article>
  );
}
