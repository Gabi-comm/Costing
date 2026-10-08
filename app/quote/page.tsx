"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import QuoteDocument from "@/components/QuoteDocument";
import { decodeQuote } from "@/lib/share";

function QuoteView() {
  const params = useSearchParams();
  const shared = decodeQuote(params.toString());
  const hasItems = Object.keys(shared.selection.items).length > 0;

  return (
    <div className="quote-page min-h-screen px-4 py-8 sm:py-12">
      <div className="no-print mx-auto mb-5 flex max-w-3xl flex-wrap items-center justify-between gap-3">
        <Link href={`/?${params.toString()}`} className="text-sm font-medium text-[#203a53] hover:underline">
          ← Edit in calculator
        </Link>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-full bg-[#091525] px-5 py-2.5 text-sm font-semibold text-[#cadcea] transition hover:bg-[#203a53]"
        >
          Print / Save as PDF
        </button>
      </div>
      {hasItems ? (
        <QuoteDocument {...shared} />
      ) : (
        <p className="mx-auto max-w-3xl rounded-xl bg-white p-8 text-center text-[#5b6677]">
          This quotation link is empty or invalid.
        </p>
      )}
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense>
      <QuoteView />
    </Suspense>
  );
}
