import { EMPTY_SELECTION, type Selection } from "./compute";
import { COMPLEXITY, DISCOUNTS, ITEM_BY_ID, type Complexity, type DiscountKind } from "./pricing";

export interface ClientInfo {
  client: string;
  project: string;
  notes: string;
}

export interface QuoteMeta {
  number: string;
  /** ISO date (YYYY-MM-DD) the quote was issued. */
  date: string;
}

export interface SharedQuote {
  selection: Selection;
  info: ClientInfo;
  meta: QuoteMeta | null;
}

export const EMPTY_INFO: ClientInfo = { client: "", project: "", notes: "" };

/** Items are packed as `id` (flat / qty 1) or `id:qty`, comma-separated. */
export function encodeQuote({ selection, info, meta }: SharedQuote): string {
  const p = new URLSearchParams();
  const items = Object.entries(selection.items)
    .filter(([id, q]) => ITEM_BY_ID[id] && q > 0)
    .map(([id, q]) => (q === 1 ? id : `${id}:${Math.floor(q)}`));
  if (items.length) p.set("i", items.join(","));
  if (selection.complexity !== "simple") p.set("c", selection.complexity);
  if (selection.rush) p.set("r", "1");
  if (selection.discount !== "none") p.set("d", selection.discount);
  if (selection.discount === "custom" && selection.customDiscount > 0)
    p.set("cd", String(Math.floor(selection.customDiscount)));
  if (info.client) p.set("client", info.client);
  if (info.project) p.set("project", info.project);
  if (info.notes) p.set("notes", info.notes);
  if (meta) {
    p.set("q", meta.number);
    p.set("dt", meta.date);
  }
  return p.toString();
}

export function decodeQuote(search: string | URLSearchParams): SharedQuote {
  const p = typeof search === "string" ? new URLSearchParams(search) : search;
  const items: Record<string, number> = {};
  for (const token of (p.get("i") ?? "").split(",")) {
    const [id, q] = token.split(":");
    if (!ITEM_BY_ID[id]) continue;
    const qty = q === undefined ? 1 : Math.floor(Number(q));
    if (Number.isFinite(qty) && qty > 0) items[id] = Math.min(qty, 999);
  }

  const c = p.get("c") as Complexity | null;
  const d = p.get("d") as DiscountKind | null;
  const cd = Math.floor(Number(p.get("cd") ?? 0));

  const selection: Selection = {
    ...EMPTY_SELECTION,
    items,
    complexity: c && c in COMPLEXITY ? c : "simple",
    rush: p.get("r") === "1",
    discount: d && (d === "custom" || d in DISCOUNTS) ? d : "none",
    customDiscount: Number.isFinite(cd) && cd > 0 ? cd : 0,
  };

  const number = p.get("q");
  const date = p.get("dt");
  return {
    selection,
    info: {
      client: p.get("client") ?? "",
      project: p.get("project") ?? "",
      notes: p.get("notes") ?? "",
    },
    meta: number && date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? { number, date } : null,
  };
}

/** e.g. Q-251009-4F2A */
export function newQuoteMeta(now = new Date()): QuoteMeta {
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const suffix = Math.floor(Math.random() * 0xffff)
    .toString(16)
    .toUpperCase()
    .padStart(4, "0");
  return { number: `Q-${date.slice(2).replaceAll("-", "")}-${suffix}`, date };
}
