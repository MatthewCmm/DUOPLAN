import { addDays, ymd } from "./store";

const DAYS: Record<string, number> = {
  domingo: 0, lunes: 1, martes: 2, miercoles: 3, miércoles: 3, jueves: 4, viernes: 5, sabado: 6, sábado: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
};

export interface Parsed { title: string; date?: string; time?: string }

/** Detects date/time words in Spanish or English: "cena mañana 8pm", "pay rent friday". */
export function quickParse(input: string, now = new Date()): Parsed {
  let text = ` ${input.trim()} `;
  let date: string | undefined;
  let time: string | undefined;

  const tm = text.match(/\s(?:a las\s|at\s)?(\d{1,2})(?::(\d{2}))?\s?(am|pm|hrs|h)?(?=\s)/i);
  if (tm && (tm[3] || tm[2] || /a las|at/i.test(tm[0]))) {
    let h = Number(tm[1]);
    const m = Number(tm[2] ?? 0);
    const ap = tm[3]?.toLowerCase();
    if (ap === "pm" && h < 12) h += 12;
    if (ap === "am" && h === 12) h = 0;
    if (h < 24 && m < 60) {
      time = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
      text = text.replace(tm[0], " ");
    }
  }

  const rules: [RegExp, () => Date][] = [
    [/\s(pasado mañana|pasado manana)(?=\s)/i, () => addDays(now, 2)],
    [/\s(hoy|today|tonight|esta noche)(?=\s)/i, () => now],
    [/\s(mañana|manana|tomorrow)(?=\s)/i, () => addDays(now, 1)],
  ];
  for (const [re, fn] of rules) {
    const m = text.match(re);
    if (m) { date = ymd(fn()); text = text.replace(m[0], " "); break; }
  }
  if (!date) {
    const m = text.match(/\s(?:el\s|on\s)?(domingo|lunes|martes|miércoles|miercoles|jueves|viernes|sábado|sabado|sunday|monday|tuesday|wednesday|thursday|friday|saturday)(?=\s)/i);
    if (m) {
      const target = DAYS[m[1].toLowerCase()];
      let diff = (target - now.getDay() + 7) % 7;
      if (diff === 0) diff = 7;
      date = ymd(addDays(now, diff));
      text = text.replace(m[0], " ");
    }
  }
  if (time && !date) date = ymd(now);
  const title = text.replace(/\s+/g, " ").trim();
  return { title: title.charAt(0).toUpperCase() + title.slice(1), date, time };
}
