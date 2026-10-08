"use client";

import { useSyncExternalStore } from "react";
import Calculator, { DRAFT_KEY } from "@/components/Calculator";
import Hero from "@/components/Hero";
import { EMPTY_SELECTION } from "@/lib/compute";
import { decodeQuote, EMPTY_INFO } from "@/lib/share";

// Starting state comes from a shared link (?i=...) first, else the saved draft.
// Read once per page load: later draft writes must not reset the form.
let startSource: string | null = null;

function readStartSource() {
  if (startSource === null) {
    const search = window.location.search;
    let source = search.length > 1 ? search : "";
    if (!source) {
      try {
        source = localStorage.getItem(DRAFT_KEY) ?? "";
      } catch {}
    }
    startSource = source;
  }
  return startSource;
}

const noopSubscribe = () => () => {};

export default function CalculatorPage() {
  // null on the server and during hydration; the stored source after.
  const source = useSyncExternalStore(noopSubscribe, readStartSource, () => null);

  return (
    <>
      <Hero />
      {source === null ? (
        <Calculator key="placeholder" persist={false} initial={{ selection: EMPTY_SELECTION, info: EMPTY_INFO, meta: null }} />
      ) : (
        <Calculator key="client" persist initial={decodeQuote(source)} />
      )}
    </>
  );
}
