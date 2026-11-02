import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { CloudSun, Flame, Sparkles, Wand2 } from "lucide-react";
import mountains from "@/assets/paint-mountains.jpg";
import night from "@/assets/paint-night.jpg";
import { Card, Empty, PaintHeader, PersonDot, Progress } from "@/components/duo/ui";
import { TaskRow, TaskSheet } from "@/components/duo/tasks";
import { SuggestionsSheet } from "@/components/duo/suggestions";
import { useT } from "@/lib/i18n";
import { type Task, fmtTime, setDB, uid, useDB, useMe, ymd } from "@/lib/store";
import { quickParse } from "@/lib/quick-parse";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Hoy · DuoPlan" },
      { name: "description", content: "El día de Mateo y Allison: agenda, tareas y hábitos en un vistazo." },
      { property: "og:title", content: "Hoy · DuoPlan" },
      { property: "og:description", content: "El día de Mateo y Allison: agenda, tareas y hábitos en un vistazo." },
    ],
  }),
  component: Today,
});

function greeting(h: number) { return h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches"; }

function Weather() {
  const [w, setW] = useState<{ t: number; code: number } | null>(null);
  useEffect(() => {
    const fetchAt = (lat: number, lon: number) =>
      fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code`)
        .then((r) => r.json()).then((j) => setW({ t: Math.round(j.current.temperature_2m), code: j.current.weather_code })).catch(() => {});
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition((p) => fetchAt(p.coords.latitude, p.coords.longitude), () => {}, { timeout: 5000 });
  }, []);
  if (!w) return null;
  const label = w.code === 0 ? "Despejado" : w.code < 4 ? "Parcialmente nublado" : w.code < 60 ? "Nublado" : w.code < 80 ? "Lluvia" : "Tormenta";
  return <span className="inline-flex items-center gap-1.5 rounded-full bg-foreground/30 px-3 py-1 text-xs font-semibold text-on-paint backdrop-blur-md"><CloudSun className="h-4 w-4" />{w.t}° · {label}</span>;
}

function Today() {
  const db = useDB();
  const me = useMe();
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const today = ymd(now ?? new Date());
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Task | null>(null);
  const [sheet, setSheet] = useState(false);
  const [sugg, setSugg] = useState(false);
  const t = useT();

  const tasks = db.tasks.filter((t) => t.due && t.due <= today && (!t.done || t.doneAt === today));
  const events = db.events.filter((e) => e.date === today).sort((a, b) => (a.start ?? "").localeCompare(b.start ?? ""));
  const dow = (now ?? new Date()).getDay();
  const habits = db.habits.filter((h) => h.days.includes(dow));
  const done = tasks.filter((t) => t.done).length + habits.filter((h) => h.log.includes(today)).length;
  const total = tasks.length + habits.length;
  const score = total ? Math.round((done / total) * 100) : 100;
  const pending = tasks.filter((t) => !t.done);

  const suggestion = useMemo(() => {
    const busy = events.reduce((m, e) => {
      if (!e.start || !e.end) return m;
      const [a, b] = [e.start, e.end].map((x) => { const [h, mm] = x.split(":").map(Number); return h * 60 + mm; });
      return m + Math.max(0, b - a);
    }, 0);
    const toMin = (x: string) => { const [h, m] = x.split(":").map(Number); return h * 60 + m; };
    const awake = toMin(db.settings.sleep) - toMin(db.settings.wake) - (toMin(db.settings.workEnd) - toMin(db.settings.workStart));
    const free = Math.max(0, Math.round((awake - busy) / 60));
    const first = pending.sort((a, b) => (a.priority === "alta" ? -1 : 0) - (b.priority === "alta" ? -1 : 0))[0];
    return first ? `Tienen ${free} h libres hoy. ¿Empezamos con "${first.title}"?` : "Todo está al día. Disfruten su tiempo libre.";
  }, [events, pending, db.settings]);

  const add = () => {
    if (!q.trim()) return;
    const p = quickParse(q);
    setDB((d) => ({ ...d, tasks: [{ id: uid(), title: p.title, due: p.date ?? today, time: p.time, assignee: me ?? "both", done: false, category: "Otro", priority: "media", subtasks: [] }, ...d.tasks] }));
    toast.success(`Agregado: "${p.title}"`);
    setQ("");
  };

  const name = me ? db.settings[me].name : "";
  return (
    <>
      <PaintHeader image={mountains} night={night}
        title={<>{now ? greeting(now.getHours()) : "Hola"}{name && <>,<br /><em className="font-normal">{name}</em></>}</>}
        subtitle={(now ?? new Date()).toLocaleDateString("es", { weekday: "long", day: "numeric", month: "long" })}>
        <div className="mt-3"><Weather /></div>
      </PaintHeader>

      <div className="space-y-4">
        <div className="paint-card rise flex items-center gap-2 p-2 pl-4">
          <Wand2 className="h-5 w-5 shrink-0 text-primary" />
          <input value={q} onChange={(e) => setQ(e.target.value)} onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder='"cena mañana 8pm", "pagar renta viernes"…' className="min-w-0 flex-1 bg-transparent py-2 text-[15px] outline-none placeholder:text-muted-foreground" />
          <button onClick={add} className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">Añadir</button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card className="!p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Puntaje diario</div>
            <div className="mt-1 font-display text-4xl font-semibold">{score}<span className="text-lg">%</span></div>
            <Progress value={score} className="mt-2" />
          </Card>
          <Card className="!p-4">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Pendiente hoy</div>
            <div className="mt-1 font-display text-4xl font-semibold">{pending.length}</div>
            <div className="mt-1 text-xs text-muted-foreground">{events.length} planes en agenda</div>
          </Card>
        </div>

        <button onClick={() => setSugg(true)} className="block w-full text-left transition active:scale-[.98]" aria-label={t("Sugerencias para hoy")}>
        <Card className="border-gold/40">
          <div className="flex gap-3">
            <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-gold" />
            <div><div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Sugerencia para hoy</div><p className="mt-0.5 text-[15px] font-medium">{suggestion}</p></div>
          </div>
        </Card>
        </button>

        <Card title="Agenda de hoy" action={<Link to="/calendario" className="text-xs font-bold text-primary">Ver todo</Link>}>
          {events.length === 0 ? <Empty>Día despejado. Momento perfecto para descansar.</Empty> : (
            <ol className="relative space-y-3 border-l-2 border-dashed border-border pl-4">
              {events.map((e) => (
                <li key={e.id} className="relative">
                  <PersonDot p={e.who} className="absolute -left-[1.4rem] top-1.5 h-3 w-3 ring-4 ring-card" />
                  <div className="text-xs font-bold text-muted-foreground">{e.allDay ? "Todo el día" : `${fmtTime(e.start, db.settings.h24)} – ${fmtTime(e.end, db.settings.h24)}`}</div>
                  <div className="font-semibold">{e.title}</div>
                  {e.location && <div className="text-xs text-muted-foreground">{e.location}</div>}
                </li>
              ))}
            </ol>
          )}
        </Card>

        <Card title="Tareas de hoy" action={<button onClick={() => { setOpen(null); setSheet(true); }} className="text-xs font-bold text-primary">+ Nueva</button>}>
          {tasks.length === 0 ? <Empty>No hay tareas pendientes para hoy.</Empty> : (
            <div className="divide-y divide-border">{tasks.map((t) => <TaskRow key={t.id} t={t} onOpen={(x) => { setOpen(x); setSheet(true); }} />)}</div>
          )}
        </Card>

        <Card title="Hábitos de hoy" action={<Link to="/mas" search={{ s: "habitos" }} className="text-xs font-bold text-primary">Editar</Link>}>
          {habits.length === 0 ? <Empty>No hay hábitos configurados.</Empty> : (
            <div className="no-scrollbar -mx-1 flex gap-3 overflow-x-auto px-1 py-1">
              {habits.map((h) => {
                const on = h.log.includes(today);
                let streak = 0; for (let i = on ? 0 : 1; i < 365; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (h.log.includes(ymd(d))) streak++; else break; }
                return (
                  <button key={h.id} onClick={() => { setDB((d) => ({ ...d, habits: d.habits.map((x) => x.id === h.id ? { ...x, log: on ? x.log.filter((l) => l !== today) : [...x.log, today] } : x) })); if (!on) toast.success("¡Hábito completado!"); }}
                    className={cn("w-32 shrink-0 rounded-2xl border p-3 text-left transition active:scale-95", on ? "border-allison bg-allison/15" : "border-border bg-background/40")}>
                    <div className="text-2xl">{h.emoji}</div>
                    <div className="mt-1 line-clamp-2 text-sm font-semibold">{h.title}</div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] text-muted-foreground"><PersonDot p={h.who} className="h-2 w-2" />{streak > 0 && <><Flame className="h-3 w-3 text-primary" />{streak}</>}</div>
                  </button>
                );
              })}
            </div>
          )}
        </Card>
      </div>
      <TaskSheet task={open} open={sheet} onClose={() => setSheet(false)} />
      <SuggestionsSheet open={sugg} onClose={() => setSugg(false)} />
    </>
  );
}
