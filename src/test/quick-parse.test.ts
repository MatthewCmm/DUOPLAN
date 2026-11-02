import { describe, expect, it } from "vitest";
import { quickParse } from "@/lib/quick-parse";

const now = new Date(2026, 9, 25, 10, 0); // Sunday Oct 25 2026

describe("quickParse", () => {
  it("reads 'mañana 8pm' in Spanish", () => {
    expect(quickParse("Cena mañana 8pm", now)).toEqual({ title: "Cena", date: "2026-10-26", time: "20:00" });
  });
  it("reads a weekday in English", () => {
    expect(quickParse("pay rent friday", now)).toEqual({ title: "Pay rent", date: "2026-10-30", time: undefined });
  });
  it("keeps plain text without a date", () => {
    expect(quickParse("comprar leche", now).date).toBeUndefined();
  });
});
