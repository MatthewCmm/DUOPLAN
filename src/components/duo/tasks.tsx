import { useState } from "react";
import { toast } from "sonner";
import { Check, ChevronRight, Clock, Trash2, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Person, type Priority, type Task, TASK_CATEGORIES, addDays, fmtTime, parseYmd, setDB, uid, useDB, ymd } from "@/lib/store";
import { BottomSheet, Chips, Field, GhostButton, PersonPicker, PersonTag, PrimaryButton, inputCls } from "./ui";

export function toggleTask(t: Task) {
  setDB((db) => ({ ...db, tasks: db.tasks.map((x) => x.id === t.id ? { ...x, done: !x.done, doneAt: !x.done ? ymd(new Date()) : undefined } : x) }));
  if (!t.done) toast.success(`Completado: "${t.title}"`);
}

export function TaskRow({ t, onOpen }: { t: Task; onOpen: (t: Task) => void }) {
  const db = useDB();
  const sub = t.subtasks.length;
  const subDone = t.subtasks.filter((s) => s.done).length;
  const overdue = !t.done && t.due && t.due < ymd(new Date());
  return (
    <div className={cn("flex items-center gap-3 py-2.5 transition", t.done && "opacity-55")}>
      <button onClick={() => toggleTask(t)} aria-label="Completar"
        className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition active:scale-90",
          t.done ? "border-allison bg-allison text-primary-foreground" : t.assignee === "mateo" ? "border-mateo" : t.assignee === "allison" ? "border-allison" : "border-both")}>
        {t.done && <Check className="h-4 w-4" strokeWidth={3} />}
      </button>
      <button onClick={() => onOpen(t)} className="min-w-0 flex-1 text-left">
        <div className={cn("truncate text-[15px] font-semibold", t.done && "line-through")}>{t.title}</div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          <PersonTag p={t.assignee} />
          {t.due && <span className={cn(overdue && "font-bold text-destructive")}>{labelDate(t.due)}</span>}
          {t.time && <span className="flex items-center gap-0.5"><Clock className="h-3 w-3" />{fmtTime(t.time, db.settings.h24)}</span>}
          {sub > 0 && <span>{subDone}/{sub}</span>}
          {t.priority === "alta" && <span className="font-bold text-primary">• Alta</span>}
        </div>
      </button>
      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </div>
  );
}

export function labelDate(s: string) {
  const today = ymd(new Date());
  if (s === today) return "Hoy";
  if (s === ymd(addDays(new Date(), 1))) return "Mañana";
  if (s === ymd(addDays(new Date(), -1))) return "Ayer";
  return parseYmd(s).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" });
}

const blank = (): Task => ({ id: "", title: "", assignee: "both", due: ymd(new Date()), done: false, category: "Hogar", priority: "media", subtasks: [] });

export function TaskSheet({ task, open, onClose }: { task: Task | null; open: boolean; onClose: () => void }) {
  const [t, setT] = useState<Task>(task ?? blank());
  const [sub, setSub] = useState("");
  const [lastKey, setLastKey] = useState<string | null>(null);
  const key = `${open}-${task?.id ?? "new"}`;
  if (key !== lastKey) { setLastKey(key); setT(task ?? blank()); }
  const isNew = !task?.id;

  const save = () => {
    if (!t.title.trim()) return;
    setDB((db) => ({ ...db, tasks: isNew ? [{ ...t, id: uid() }, ...db.tasks] : db.tasks.map((x) => x.id === t.id ? t : x) }));
    toast.success(isNew ? "Tarea agregada" : "Guardado");
    onClose();
  };
  const del = () => { setDB((db) => ({ ...db, tasks: db.tasks.filter((x) => x.id !== t.id) })); toast(`Eliminado: "${t.title}"`); onClose(); };
  const tomorrow = () => { setDB((db) => ({ ...db, tasks: db.tasks.map((x) => x.id === t.id ? { ...x, due: ymd(addDays(new Date(), 1)) } : x) })); toast("Tarea reprogramada para mañana"); onClose(); };

  return (
    <BottomSheet open={open} onClose={onClose} title={isNew ? "Nueva tarea" : "Editar tarea"}>
      <div className="space-y-4">
        <Field label="Nombre de la tarea"><input autoFocus className={inputCls} value={t.title} onChange={(e) => setT({ ...t, title: e.target.value })} /></Field>
        <Field label="Asignada a"><PersonPicker value={t.assignee} onChange={(a: Person) => setT({ ...t, assignee: a })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Fecha límite"><input type="date" className={inputCls} value={t.due ?? ""} onChange={(e) => setT({ ...t, due: e.target.value || undefined })} /></Field>
          <Field label="Hora"><input type="time" className={inputCls} value={t.time ?? ""} onChange={(e) => setT({ ...t, time: e.target.value || undefined })} /></Field>
        </div>
        <Field label="Categoría"><Chips options={TASK_CATEGORIES} value={t.category} onChange={(c) => setT({ ...t, category: c })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Prioridad"><Chips options={["baja", "media", "alta"] as Priority[]} value={t.priority} onChange={(p) => setT({ ...t, priority: p })} /></Field>
          <Field label="Minutos estimados"><input type="number" inputMode="numeric" className={inputCls} value={t.minutes ?? ""} onChange={(e) => setT({ ...t, minutes: e.target.value ? Number(e.target.value) : undefined })} /></Field>
        </div>
        <Field label="Subtareas">
          <div className="space-y-1.5">
            {t.subtasks.map((s) => (
              <div key={s.id} className="flex items-center gap-2">
                <input type="checkbox" className="h-4 w-4 accent-[var(--color-primary)]" checked={s.done} onChange={() => setT({ ...t, subtasks: t.subtasks.map((x) => x.id === s.id ? { ...x, done: !x.done } : x) })} />
                <span className={cn("flex-1 text-sm", s.done && "line-through opacity-60")}>{s.title}</span>
                <button onClick={() => setT({ ...t, subtasks: t.subtasks.filter((x) => x.id !== s.id) })} aria-label="Quitar"><Trash2 className="h-4 w-4 text-muted-foreground" /></button>
              </div>
            ))}
            <div className="flex gap-2">
              <input className={inputCls} placeholder="Añadir subtarea" value={sub} onChange={(e) => setSub(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter" && sub.trim()) { setT({ ...t, subtasks: [...t.subtasks, { id: uid(), title: sub.trim(), done: false }] }); setSub(""); } }} />
              <GhostButton onClick={() => { if (sub.trim()) { setT({ ...t, subtasks: [...t.subtasks, { id: uid(), title: sub.trim(), done: false }] }); setSub(""); } }}><Plus className="h-4 w-4" /></GhostButton>
            </div>
          </div>
        </Field>
        <Field label="Notas"><textarea rows={2} className={inputCls} value={t.notes ?? ""} onChange={(e) => setT({ ...t, notes: e.target.value })} /></Field>
        <PrimaryButton onClick={save}>Guardar tarea</PrimaryButton>
        {!isNew && (
          <div className="flex gap-2">
            <GhostButton className="flex-1" onClick={tomorrow}>Pasar a mañana</GhostButton>
            <GhostButton className="flex-1 text-destructive" onClick={del}>Eliminar</GhostButton>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
