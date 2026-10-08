import { describe, expect, it } from "vitest";
import { computeQuote, EMPTY_SELECTION, roundTo, type Selection } from "./compute";
import { decodeQuote, encodeQuote, newQuoteMeta } from "./share";

const sel = (over: Partial<Selection>): Selection => ({ ...EMPTY_SELECTION, ...over });

describe("computeQuote", () => {
  it("is zero for an empty selection", () => {
    const q = computeQuote(EMPTY_SELECTION);
    expect(q.total).toBe(0);
    expect(q.lines).toHaveLength(0);
  });

  it("uses the core rates", () => {
    const q = computeQuote(sel({ items: { website: 1, chatbot: 1, gis: 1 } }));
    expect(q.subtotal).toBe(4000 + 2000 + 3000);
    expect(q.total).toBe(9000);
  });

  it("multiplies qty items and treats flat items as qty 1", () => {
    const q = computeQuote(sel({ items: { website: 5, feature: 3 } }));
    expect(q.subtotal).toBe(4000 + 3 * 1500);
  });

  it("applies complexity, then rush, then discount", () => {
    // 10,000 → ×1.2 = +2,000 → rush 25% of 12,000 = +3,000 → student 10% of 15,000 = −1,500
    const q = computeQuote(
      sel({ items: { website: 1, gis: 1, feature: 2 }, complexity: "standard", rush: true, discount: "student" }),
    );
    expect(q.subtotal).toBe(10000);
    expect(q.complexityAdj).toBe(2000);
    expect(q.rushAdj).toBe(3000);
    expect(q.discount).toBe(1500);
    expect(q.total).toBe(13500);
    expect(q.downPayment + q.balance).toBe(q.total);
  });

  it("rounds adjustments to the nearest ₱50", () => {
    // 4,500 × 0.2 = 900; rush 25% of 5,400 = 1,350; returning 5% of 6,750 = 337.5 → 350
    const q = computeQuote(
      sel({ items: { website: 1, "extra-page": 1 }, complexity: "standard", rush: true, discount: "returning" }),
    );
    expect(q.discount).toBe(350);
    expect(q.total % 50).toBe(0);
    expect(roundTo(1234)).toBe(1250);
  });

  it("caps a custom discount at the total", () => {
    expect(computeQuote(sel({ items: { chatbot: 1 }, discount: "custom", customDiscount: 500 })).total).toBe(1500);
    expect(computeQuote(sel({ items: { chatbot: 1 }, discount: "custom", customDiscount: 99999 })).total).toBe(0);
  });

  it("blocks upgrades whose requirement is missing", () => {
    const q = computeQuote(sel({ items: { "ai-upgrade": 1, "gis-layer": 2 } }));
    expect(q.total).toBe(0);
    expect(q.blocked.map((b) => b.item.id)).toEqual(["ai-upgrade", "gis-layer"]);

    const ok = computeQuote(sel({ items: { chatbot: 1, "ai-upgrade": 1, gis: 1, "gis-layer": 2 } }));
    expect(ok.blocked).toHaveLength(0);
    expect(ok.subtotal).toBe(2000 + 2500 + 3000 + 2000);
  });

  it("keeps recurring maintenance out of the one-time total and modifiers", () => {
    const q = computeQuote(sel({ items: { website: 1, maintenance: 1 }, complexity: "complex", rush: true }));
    expect(q.monthly).toBe(1000);
    expect(q.subtotal).toBe(4000);
    expect(q.recurringLines).toHaveLength(1);
  });
});

describe("share link", () => {
  it("round-trips selection, client info and quote meta", () => {
    const original = {
      selection: sel({
        items: { website: 1, feature: 4, "gis-layer": 2 },
        complexity: "complex" as const,
        rush: true,
        discount: "custom" as const,
        customDiscount: 750,
      }),
      info: { client: "Juan & Co.", project: "Barangay map", notes: "Phase 1 only, 3 weeks" },
      meta: { number: "Q-261009-ABCD", date: "2026-10-09" },
    };
    expect(decodeQuote(encodeQuote(original))).toEqual(original);
  });

  it("ignores unknown or invalid params", () => {
    const d = decodeQuote("i=website,hack:9,feature:-2,api:abc&c=insane&d=free&dt=nope&q=X");
    expect(d.selection.items).toEqual({ website: 1 });
    expect(d.selection.complexity).toBe("simple");
    expect(d.selection.discount).toBe("none");
    expect(d.meta).toBeNull();
  });

  it("generates a dated quote number", () => {
    const m = newQuoteMeta(new Date(2026, 9, 9));
    expect(m.date).toBe("2026-10-09");
    expect(m.number).toMatch(/^Q-261009-[0-9A-F]{4}$/);
  });
});
