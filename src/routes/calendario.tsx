import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ChevronLeft, ChevronRight, MapPin, Plus } from "lucide-react";
import ocean from "@/assets/paint-ocean.jpg";
import { BottomSheet, Card, Chips, Empty, Field, GhostButton, PaintHeader, PersonDot, PersonPicker, PrimaryButton, inputCls } from "@/components/duo/ui";
import { EVENT_CATEGORIES, type EventItem, addDays, fmtTime, parseYmd, setDB, uid, useDB, ymd } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendario")({
  head: () => ({
    meta: [
      { title: "Agenda · DuoPlan" },
      { name: "description", content: "Calendario compartido para coordinar el tiempo de los dos." },
      { property: "og:title", content: "Agenda · DuoPlan" },
      { property: "og:description", content: "Calendario compartido para coordinar el tiempo de los dos." },
    ],
  }),
  component: CalendarPage,
});

/** Does event e occur on date d (handles repeats)? */
function occurs(e: EventItem, d: string) {
  if (e.date === d) return true;
  if (e.repeat === "none" || d < e.date) return false;
  const a = parseYmd(e.date), b = parseYmd(d);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000);
  if (e.repeat === "daily") return true;
  if (e.repeat === "weekly") return diff % 7 === 0;
  if (e.repeat === "biweekly") return diff % 14 === 0;
  return a.getDate() === b.getDate();
}

const REPEATS = { none: "No repetir", daily: "Todos los días", weekly: "Cada semana", biweekly: "Cada 2 semanas", monthly: "Cada mes" } as const;

function CalendarPage() {
  const db = useDB();
  const [sel, setSel] = useState(ymd(new Date()));
  const [month, setMonth] = useState(() => { const d = new Date(); d.setDate(1); return d; });
  const [edit, setEdit] = useState<EventItem | null>(null);

  const days = useMemo(() => {
    const first = new Date(month);
    const offset = (first.getDay() - db.settings.weekStart + 7) % 7;
    return Array.from({ length: 42 }, (_, i) => addDays(first, i - offset));
  }, [month, db.settings.weekStart]);
  const labels = db.settings.weekStart === 1 ? ["L", "M", "X", "J", "V", "S", "D"] : ["D", "L", "M", "X", "J", "V", "S"];
  const dayEvents = db.events.filter((e) => occurs(e, sel)).sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  const overlap = dayEvents.some((e, i) => dayEvents.slice(i + 1).some((o) => e.start && e.end && o.start && o.start < e.end && (o.end ?? o.start) > e.start));

  const newEvent = (): EventItem => ({ id: "", title: "", date: sel, start: "19:00", end: "20:00", who: "both", category: EVENT_CATEGORIES[0], repeat: "none" });

  return (
    <>
      <PaintHeader image={ocean} title="Agenda compartida" subtitle="Espacio para coordinar su tiempo." />
      <div className="space-y-4">
        <Card>
          <div className="mb-3 flex items-center justify-between">
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} aria-label="Mes anterior" className="rounded-full p-2 hover:bg-muted"><ChevronLeft className="h-5 w-5" /></button>
            <h2 className="text-xl font-semibold capitalize">{month.toLocaleDateString("es", { month: "long", year: "numeric" })}</h2>
            <button onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} aria-label="Mes siguiente" className="rounded-full p-2 hover:bg-muted"><ChevronRight className="h-5 w-5" /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-bold text-muted-foreground">{labels.map((l, i) => <div key={i}>{l}</div>)}</div>
          <div className="mt-1 grid grid-cols-7 gap-1">
            {days.map((d) => {
              const k = ymd(d);
              const evs = db.events.filter((e) => occurs(e, k));
              const isSel = k === sel, isToday = k === ymd(new Date()), inMonth = d.getMonth() === month.getMonth();
              return (
                <button key={k} onClick={() => setSel(k)} className={cn("flex aspect-square flex-col items-center justify-center rounded-xl text-sm font-semibold transition",
                  isSel ? "bg-primary text-primary-foreground" : isToday ? "bg-accent text-accent-foreground" : "hover:bg-muted", !inMonth && "opacity-35")}>
                  {d.getDate()}
                  <span className="mt-0.5 flex h-1.5 gap-0.5">{evs.slice(0, 3).map((e) => <PersonDot key={e.id} p={e.who} className="h-1.5 w-1.5" />)}</span>
                </button>
              );
            })}
          </div>
        </Card>

        <Card title={<span className="capitalize">{parseYmd(sel).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}</span>}
          action={<button onClick={() => setEdit(newEvent())} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-4 w-4" />Nuevo plan</button>}>
          {overlap && <div className="mb-3 flex items-center gap-2 rounded-xl bg-gold/15 p-2.5 text-xs font-semibold"><AlertTriangle className="h-4 w-4 text-gold" />Hay planes superpuestos en este día.</div>}
          {dayEvents.length === 0 ? <Empty>Sin planes este día. Toca "+" para agregar uno.</Empty> : (
            <div className="space-y-2">
              {dayEvents.map((e) => (
                <button key={e.id} onClick={() => setEdit(e)} className="flex w-full gap-3 rounded-2xl border border-border bg-background/40 p-3 text-left">
                  <div className={cn("w-1 rounded-full", e.who === "mateo" ? "bg-mateo" : e.who === "allison" ? "bg-allison" : "bg-both")} />
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-muted-foreground">{e.allDay ? "Todo el día" : `${fmtTime(e.start, db.settings.h24)} – ${fmtTime(e.end, db.settings.h24)}`} · {e.category}</div>
                    <div className="font-semibold">{e.title}</div>
                    {e.location && <div className="flex items-center gap-1 text-xs text-muted-foreground"><MapPin className="h-3 w-3" />{e.location}</div>}
                  </div>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>
      <EventSheet ev={edit} onClose={() => setEdit(null)} />
    </>
  );
}

function EventSheet({ ev, onClose }: { ev: EventItem | null; onClose: () => void }) {
  const [e, setE] = useState<EventItem | null>(ev);
  const [last, setLast] = useState(ev);
  if (ev !== last) { setLast(ev); setE(ev); }
  if (!e) return null;
  const isNew = !e.id;
  const save = () => {
    if (!e.title.trim()) return;
    setDB((db) => ({ ...db, events: isNew ? [...db.events, { ...e, id: uid() }] : db.events.map((x) => x.id === e.id ? e : x) }));
    toast.success(isNew ? "Plan programado" : "Guardado");
    onClose();
  };
  return (
    <BottomSheet open={!!ev} onClose={onClose} title={isNew ? "Nuevo plan" : "Editar plan"}>
      <div className="space-y-4">
        <Field label="¿Qué están planeando?"><input autoFocus className={inputCls} value={e.title} onChange={(x) => setE({ ...e, title: x.target.value })} /></Field>
        <Field label="¿Para quién?"><PersonPicker value={e.who} onChange={(w) => setE({ ...e, who: w })} /></Field>
        <Field label="Fecha"><input type="date" className={inputCls} value={e.date} onChange={(x) => setE({ ...e, date: x.target.value })} /></Field>
        <label className="flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={!!e.allDay} onChange={(x) => setE({ ...e, allDay: x.target.checked })} className="h-4 w-4" />Todo el día</label>
        {!e.allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Inicio"><input type="time" className={inputCls} value={e.start ?? ""} onChange={(x) => setE({ ...e, start: x.target.value })} /></Field>
            <Field label="Fin"><input type="time" className={inputCls} value={e.end ?? ""} onChange={(x) => setE({ ...e, end: x.target.value })} /></Field>
          </div>
        )}
        <Field label="Categoría"><Chips options={EVENT_CATEGORIES} value={e.category} onChange={(c) => setE({ ...e, category: c })} /></Field>
        <Field label="Repetir"><Chips options={Object.values(REPEATS)} value={REPEATS[e.repeat]} onChange={(v) => setE({ ...e, repeat: (Object.keys(REPEATS) as (keyof typeof REPEATS)[]).find((k) => REPEATS[k] === v)! })} /></Field>
        <Field label="Lugar (opcional)"><input className={inputCls} value={e.location ?? ""} onChange={(x) => setE({ ...e, location: x.target.value })} /></Field>
        <Field label="Notas"><textarea rows={2} className={inputCls} value={e.notes ?? ""} onChange={(x) => setE({ ...e, notes: x.target.value })} /></Field>
        <PrimaryButton onClick={save}>Guardar plan</PrimaryButton>
        {!isNew && <GhostButton className="w-full text-destructive" onClick={() => { setDB((db) => ({ ...db, events: db.events.filter((x) => x.id !== e.id) })); toast("Evento eliminado"); onClose(); }}>Eliminar evento</GhostButton>}
      </div>
    </BottomSheet>
  );
}
