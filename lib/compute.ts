import {
  COMPLEXITY,
  DISCOUNTS,
  DOWN_PAYMENT_RATE,
  ITEM_BY_ID,
  ITEMS,
  ROUND_TO,
  RUSH_RATE,
  type Complexity,
  type DiscountKind,
  type PriceItem,
} from "./pricing";

export interface Selection {
  /** item id → quantity (flat items use 1). Missing or 0 = not selected. */
  items: Record<string, number>;
  complexity: Complexity;
  rush: boolean;
  discount: DiscountKind;
  /** Peso amount, used when discount is "custom". */
  customDiscount: number;
}

export const EMPTY_SELECTION: Selection = {
  items: {},
  complexity: "simple",
  rush: false,
  discount: "none",
  customDiscount: 0,
};

export interface QuoteLine {
  item: PriceItem;
  qty: number;
  amount: number;
}

export interface Quote {
  lines: QuoteLine[];
  recurringLines: QuoteLine[];
  /** Items selected but not billed because their requirement is missing. */
  blocked: { item: PriceItem; requires: PriceItem }[];
  subtotal: number;
  complexityAdj: number;
  rushAdj: number;
  discount: number;
  total: number;
  downPayment: number;
  balance: number;
  monthly: number;
}

export const roundTo = (n: number, step = ROUND_TO) => Math.round(n / step) * step;

const qtyOf = (sel: Selection, item: PriceItem) => {
  const raw = Math.floor(sel.items[item.id] ?? 0);
  if (raw <= 0) return 0;
  return item.unit === "flat" ? 1 : raw;
};

export function computeQuote(sel: Selection): Quote {
  const lines: QuoteLine[] = [];
  const recurringLines: QuoteLine[] = [];
  const blocked: Quote["blocked"] = [];

  for (const item of ITEMS) {
    const qty = qtyOf(sel, item);
    if (!qty) continue;
    if (item.requires && !qtyOf(sel, ITEM_BY_ID[item.requires])) {
      blocked.push({ item, requires: ITEM_BY_ID[item.requires] });
      continue;
    }
    const line = { item, qty, amount: item.price * qty };
    (item.recurring ? recurringLines : lines).push(line);
  }

  const subtotal = lines.reduce((s, l) => s + l.amount, 0);
  const complexityAdj = roundTo(subtotal * (COMPLEXITY[sel.complexity].multiplier - 1));
  const rushAdj = sel.rush ? roundTo((subtotal + complexityAdj) * RUSH_RATE) : 0;
  const beforeDiscount = subtotal + complexityAdj + rushAdj;

  const rawDiscount =
    sel.discount === "custom"
      ? Math.max(0, Math.floor(sel.customDiscount || 0))
      : roundTo(beforeDiscount * DISCOUNTS[sel.discount].rate);
  const discount = Math.min(rawDiscount, beforeDiscount);

  const total = beforeDiscount - discount;
  const downPayment = Math.round(total * DOWN_PAYMENT_RATE);

  return {
    lines,
    recurringLines,
    blocked,
    subtotal,
    complexityAdj,
    rushAdj,
    discount,
    total,
    downPayment,
    balance: total - downPayment,
    monthly: recurringLines.reduce((s, l) => s + l.amount, 0),
  };
}

export const peso = (n: number) =>
  "₱" + n.toLocaleString("en-PH", { minimumFractionDigits: 0, maximumFractionDigits: 0 });
