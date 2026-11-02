import { getLang } from "./lang";
import { useSyncExternalStore } from "react";

export type Person = "mateo" | "allison" | "both";
export type Priority = "baja" | "media" | "alta";

export interface Subtask { id: string; title: string; done: boolean }
export interface Task {
  id: string; title: string; notes?: string; assignee: Person; due?: string; // yyyy-mm-dd
  time?: string; done: boolean; doneAt?: string; category: string; minutes?: number;
  priority: Priority; subtasks: Subtask[];
}
export interface EventItem {
  id: string; title: string; date: string; start?: string; end?: string; allDay?: boolean;
  location?: string; notes?: string; who: Person; category: string;
  repeat: "none" | "daily" | "weekly" | "biweekly" | "monthly";
}
export interface Movement {
  id: string; title: string; amount: number; type: "gasto" | "ingreso"; category: string;
  paidBy: Person; date: string;
}
export interface Habit { id: string; title: string; who: Person; days: number[]; log: string[]; emoji: string }
export interface Meal { id: string; day: number; slot: "desayuno" | "almuerzo" | "cena"; title: string; notes?: string }
export interface Goal { id: string; title: string; notes?: string; target: number; current: number; reward?: string; unit: string }
export interface Recurring { id: string; title: string; days: number[]; assignee: Person; category: string }
export interface Avatar { kind: "icon" | "emoji"; value: string; color?: string }
export interface Profile { name: string; emoji: string; avatar?: Avatar }
export interface Settings {
  mateo: Profile; allison: Profile; budget: number; currency: string; weekStart: 0 | 1;
  wake: string; sleep: string; workStart: string; workEnd: string; h24: boolean; lang: "es" | "en";
}
export interface DB {
  version: 1; tasks: Task[]; events: EventItem[]; movements: Movement[]; habits: Habit[];
  meals: Meal[]; goals: Goal[]; recurring: Recurring[]; settings: Settings; lastAuto?: string;
}

export const uid = () => Math.random().toString(36).slice(2, 10);
export const ymd = (d: Date) => {
  const z = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${z(d.getMonth() + 1)}-${z(d.getDate())}`;
};
export const addDays = (d: Date, n: number) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
export const parseYmd = (s: string) => { const [y, m, d] = s.split("-").map(Number); return new Date(y, m - 1, d); };

export const TASK_CATEGORIES = ["Hogar", "Compras", "Trabajo", "Comida", "Bienestar", "Estudio", "Pareja", "Otro"];
export const MONEY_CATEGORIES = ["Casa y servicios", "Supermercado", "Ocio y salidas", "Transporte", "Salud", "Ahorro", "Viajes", "Otro"];
export const EVENT_CATEGORIES = ["Cita y tiempo juntos", "Trabajo", "Bienestar", "Hogar", "Social", "Otro"];

function sample(): DB {
  const t = new Date();
  const d = (n: number) => ymd(addDays(t, n));
  return {
    version: 1,
    tasks: [
      { id: uid(), title: "Supermercado: albahaca, parmesano, limones", assignee: "mateo", due: d(0), done: false, category: "Compras", priority: "media", minutes: 40, subtasks: [{ id: uid(), title: "Albahaca fresca", done: false }, { id: uid(), title: "Parmesano", done: true }] },
      { id: uid(), title: "Regar plantas de la terraza", assignee: "allison", due: d(0), done: false, category: "Hogar", priority: "baja", minutes: 10, subtasks: [] },
      { id: uid(), title: "Pagar renta", assignee: "both", due: d(2), done: false, category: "Hogar", priority: "alta", subtasks: [] },
      { id: uid(), title: "Reservar mesa para el viernes", assignee: "mateo", due: d(1), done: false, category: "Pareja", priority: "media", subtasks: [] },
      { id: uid(), title: "Doblar ropa limpia", assignee: "allison", due: d(-1), done: true, doneAt: d(-1), category: "Hogar", priority: "baja", subtasks: [] },
    ],
    events: [
      { id: uid(), title: "Café y caminata matutina", date: d(0), start: "07:30", end: "08:15", who: "both", category: "Bienestar", repeat: "none" },
      { id: uid(), title: "Revisión de diseño", date: d(0), start: "10:00", end: "11:00", who: "allison", category: "Trabajo", repeat: "none", location: "Zoom" },
      { id: uid(), title: "Cena: pasta casera", date: d(0), start: "19:30", end: "21:00", who: "both", category: "Cita y tiempo juntos", repeat: "none", location: "Cocina" },
      { id: uid(), title: "Mercado del sábado", date: d(3), start: "09:00", end: "11:00", who: "both", category: "Social", repeat: "none" },
    ],
    movements: [
      { id: uid(), title: "Renta y servicios", amount: 1200, type: "gasto", category: "Casa y servicios", paidBy: "both", date: d(-6) },
      { id: uid(), title: "Supermercado semanal", amount: 145, type: "gasto", category: "Supermercado", paidBy: "mateo", date: d(-2) },
      { id: uid(), title: "Cine y palomitas", amount: 38, type: "gasto", category: "Ocio y salidas", paidBy: "allison", date: d(-1) },
      { id: uid(), title: "Ahorro viaje a Italia", amount: 300, type: "gasto", category: "Ahorro", paidBy: "both", date: d(-3) },
    ],
    habits: [
      { id: uid(), title: "Tomar 2 litros de agua", who: "both", days: [0, 1, 2, 3, 4, 5, 6], log: [d(-1), d(-2)], emoji: "💧" },
      { id: uid(), title: "Leer 20 páginas", who: "allison", days: [0, 1, 2, 3, 4, 5, 6], log: [d(-1)], emoji: "📖" },
      { id: uid(), title: "Estiramiento 20 min", who: "mateo", days: [1, 3, 5], log: [], emoji: "🧘" },
    ],
    meals: [
      { id: uid(), day: t.getDay(), slot: "cena", title: "Tagliatelle con mantequilla de limón" },
      { id: uid(), day: (t.getDay() + 1) % 7, slot: "cena", title: "Salmón al horno con espárragos" },
      { id: uid(), day: (t.getDay() + 2) % 7, slot: "almuerzo", title: "Curry de garbanzos" },
    ],
    goals: [
      { id: uid(), title: "Viaje al sur de Italia", notes: "Vuelos, casita de piedra y cenas en la costa", target: 3000, current: 1150, unit: "$", reward: "Atardecer frente al Adriático" },
      { id: uid(), title: "Caminatas juntos este mes", target: 8, current: 3, unit: "", reward: "Picnic en el mirador" },
    ],
    recurring: [
      { id: uid(), title: "Hacer la cama y ventilar", days: [0, 1, 2, 3, 4, 5, 6], assignee: "both", category: "Hogar" },
      { id: uid(), title: "Limpiar cocina", days: [1, 4], assignee: "mateo", category: "Hogar" },
    ],
    settings: {
      mateo: { name: "Mateo", emoji: "🏔️" }, allison: { name: "Allison", emoji: "🌊" },
      budget: 2500, currency: "$", weekStart: 1, wake: "07:00", sleep: "23:00", workStart: "09:00", workEnd: "17:00", h24: false, lang: "es",
    },
  };
}

const KEY = "duoplan_db_v2";
let state: DB = sample();
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      state = { ...sample(), ...parsed, settings: { ...sample().settings, ...(parsed.settings ?? {}) } };
    }
  } catch { /* ignore */ }
  runAutoTasks();
}
function persist() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

export function setDB(fn: (db: DB) => DB) { state = fn(state); persist(); }
export function getDB() { return state; }
export function replaceDB(db: DB) { state = { ...sample(), ...db }; persist(); }
export function resetDB() { state = sample(); persist(); }

const serverSnap = sample();
export function useDB(): DB {
  return useSyncExternalStore(
    (cb) => { load(); listeners.add(cb); cb(); return () => listeners.delete(cb); },
    () => state,
    () => serverSnap,
  );
}

/** Creates today's tasks from recurring templates once per day. */
export function runAutoTasks(force = false) {
  const today = ymd(new Date());
  if (!force && state.lastAuto === today) return 0;
  const dow = new Date().getDay();
  const fresh = state.recurring
    .filter((r) => r.days.includes(dow))
    .filter((r) => !state.tasks.some((t) => t.title === r.title && t.due === today))
    .map<Task>((r) => ({ id: uid(), title: r.title, assignee: r.assignee, due: today, done: false, category: r.category, priority: "media", subtasks: [] }));
  state = { ...state, tasks: [...fresh, ...state.tasks], lastAuto: today };
  persist();
  return fresh.length;
}

// ---------- Active user ----------
const UKEY = "duoplan_active_user";
let me: Exclude<Person, "both"> | null = null;
const meL = new Set<() => void>();
export function useMe() {
  return useSyncExternalStore(
    (cb) => { if (me === null) { const v = localStorage.getItem(UKEY); me = v === "allison" ? "allison" : v === "mateo" ? "mateo" : null; } meL.add(cb); cb(); return () => meL.delete(cb); },
    () => me,
    () => null,
  );
}
export function setMe(p: Exclude<Person, "both">) { me = p; localStorage.setItem(UKEY, p); meL.forEach((l) => l()); }

// ---------- Sync code ----------
export function exportCode(db: DB) { return "DUO1:" + btoa(unescape(encodeURIComponent(JSON.stringify(db)))); }
export function importCode(code: string): DB {
  const c = code.trim();
  if (!c.startsWith("DUO1:")) throw new Error("Formato de código inválido. Copia el código completo.");
  const db = JSON.parse(decodeURIComponent(escape(atob(c.slice(5)))));
  if (!db || !Array.isArray(db.tasks)) throw new Error("Estructura no válida.");
  return db;
}

export const personName = (db: DB, p: Person) => p === "both" ? (getLang() === "en" ? "Together" : "Juntos") : db.settings[p].name;
export const fmtTime = (t: string | undefined, h24: boolean) => {
  if (!t) return "";
  if (h24) return t;
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h < 12 ? "am" : "pm"}`;
};
export const money = (n: number, c = "$", lang: "es" | "en" = "es") => `${c}${n.toLocaleString(lang, { maximumFractionDigits: 0 })}`;
