import { type DB, parseYmd } from "./store";

export function dayScore(db: DB, today: string) {
  const dow = parseYmd(today).getDay();
  const tasks = db.tasks.filter((t) => t.due && t.due <= today && (!t.done || t.doneAt === today));
  const habits = db.habits.filter((h) => h.days.includes(dow));
  const done = tasks.filter((t) => t.done).length + habits.filter((h) => h.log.includes(today)).length;
  const total = tasks.length + habits.length;
  return { score: total ? Math.round((done / total) * 100) : 100, done, total };
}

export function monthBudget(db: DB, today: string) {
  const m = today.slice(0, 7);
  const spent = db.movements.filter((x) => x.type === "gasto" && x.date.startsWith(m)).reduce((s, x) => s + x.amount, 0);
  const budget = db.settings.budget || 0;
  const pct = budget ? (spent / budget) * 100 : 0;
  return { spent, budget, pct, left: Math.max(0, budget - spent) };
}
export const budgetColor = (pct: number) => (pct < 75 ? "#7A9A8B" : pct <= 100 ? "#D9A441" : "#C87D65");
