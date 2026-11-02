import { toast } from "sonner";
import { useState } from "react";
import { Plus } from "lucide-react";
import { type DB, type Task, setDB, uid, useDB, useMe, ymd } from "@/lib/store";
import { quickParse } from "@/lib/quick-parse";
import { useT } from "@/lib/i18n";
import { BottomSheet, inputCls } from "./ui";

export function SuggestionsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const db = useDB();
  const me = useMe();
  const [q, setQ] = useState("");
  const today = ymd(new Date());
  const tomorrow = ymd(new Date(Date.now() + 864e5));

  const undo = (fn: (d: DB) => DB) => ({ label: t("Deshacer"), onClick: () => setDB(fn) });
  const addTask = (title: string, due: string, time?: string, category = "Otro") => {
    const task: Task = { id: uid(), title, due, time, assignee: me ?? "both", done: false, category, priority: "media", subtasks: [] };
    setDB((d) => ({ ...d, tasks: [task, ...d.tasks] }));
    toast.success(`${t("Agregado:")} "${title}"`, { action: undo((d) => ({ ...d, tasks: d.tasks.filter((x) => x.id !== task.id) })) });
  };
  const addEvent = (title: string, start: string, end: string) => {
    const ev = { id: uid(), title, date: today, start, end, who: "both" as const, category: "Cita y tiempo juntos", repeat: "none" as const };
    setDB((d) => ({ ...d, events: [ev, ...d.events] }));
    toast.success(`${t("Agregado:")} "${title}"`, { action: undo((d) => ({ ...d, events: d.events.filter((x) => x.id !== ev.id) })) });
  };
  const addFree = () => {
    if (!q.trim()) return;
    const p = quickParse(q);
    addTask(p.title, p.date ?? today, p.time);
    setQ("");
  };
  const pending = db.tasks.filter((x) => !x.done && x.due && x.due <= today).length;
  const items = [
    { k: "evening", label: t("Tiempo juntos esta noche"), hint: "8:00 pm", run: () => addEvent(t("Tiempo juntos"), "20:00", "21:30") },
    { k: "walk", label: t("Caminata de 20 minutos"), hint: t("Hoy"), run: () => addTask(t("Caminata de 20 minutos"), today, undefined, "Bienestar") },
    { k: "plan", label: t("Planear mañana"), hint: t("Hoy"), run: () => addTask(t("Planear mañana"), today, undefined, "Hogar") },
    ...(pending === 0 ? [{ k: "first", label: t("Una tarea pequeña para mañana"), hint: t("Mañana"), run: () => addTask(t("Una tarea pequeña"), tomorrow) }] : []),
  ];
  return (
    <BottomSheet open={open} onClose={onClose} title={t("Sugerencias para hoy")}>
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addFree()} className={inputCls} placeholder={t('"cena mañana 8pm", "pagar renta viernes"…')} />
          <button onClick={addFree} className="min-h-11 rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground">{t("Añadir")}</button>
        </div>
        {items.map((s) => (
          <button key={s.k} onClick={s.run} className="flex min-h-12 w-full items-center gap-3 rounded-2xl border border-border bg-card/70 px-4 py-3 text-left transition active:scale-[.98]">
            <Plus className="h-5 w-5 shrink-0 text-primary" />
            <span className="flex-1 font-semibold">{s.label}</span>
            <span className="text-xs text-muted-foreground">{s.hint}</span>
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}
