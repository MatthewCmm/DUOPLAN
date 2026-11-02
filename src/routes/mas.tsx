import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Copy, Download, Flame, Plus, RefreshCw, Trash2, Trophy, Upload } from "lucide-react";
import lake from "@/assets/paint-lake.jpg";
import mountains from "@/assets/paint-mountains.jpg";
import ocean from "@/assets/paint-ocean.jpg";
import night from "@/assets/paint-night.jpg";
import canyon from "@/assets/paint-canyon.jpg";
import { Avatar, AvatarPicker } from "@/components/duo/avatar";
import { BottomSheet, Card, Chips, Empty, Field, GhostButton, PaintHeader, PersonDot, PersonPicker, PersonTag, PrimaryButton, Progress, inputCls } from "@/components/duo/ui";
import { type Goal, type Habit, type Meal, type Recurring, TASK_CATEGORIES, exportCode, getDB, importCode, replaceDB, resetDB, runAutoTasks, setDB, uid, useDB, ymd } from "@/lib/store";
import { cn } from "@/lib/utils";

const SECTIONS = { habitos: "Hábitos", comidas: "Comidas", metas: "Metas", rutinas: "Rutinas", ajustes: "Ajustes" } as const;
type S = keyof typeof SECTIONS;

export const Route = createFileRoute("/mas")({
  validateSearch: (s: Record<string, unknown>): { s?: S } => ({ s: (s.s as S) in SECTIONS ? (s.s as S) : undefined }),
  head: () => ({
    meta: [
      { title: "Más · DuoPlan" },
      { name: "description", content: "Hábitos, menú semanal, metas, rutinas y ajustes de la pareja." },
      { property: "og:title", content: "Más · DuoPlan" },
      { property: "og:description", content: "Hábitos, menú semanal, metas, rutinas y ajustes de la pareja." },
    ],
  }),
  component: More,
});

const ART: Record<S, string> = { habitos: lake, comidas: canyon, metas: mountains, rutinas: ocean, ajustes: night };
const SUB: Record<S, string> = {
  habitos: "Pequeñas constancias que construyen su bienestar.",
  comidas: "Planifiquen lo que comerán juntos.",
  metas: "Celebrando el camino compartido.",
  rutinas: "Tareas que se crean solas cada mañana.",
  ajustes: "Perfiles, horarios y sincronización.",
};
const WD = ["D", "L", "M", "X", "J", "V", "S"];
const WDL = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];

function More() {
  const { s = "habitos" } = Route.useSearch();
  const nav = useNavigate({ from: "/mas" });
  return (
    <>
      <PaintHeader image={ART[s]} title={SECTIONS[s]} subtitle={SUB[s]} />
      <div className="space-y-4">
        <Chips options={Object.values(SECTIONS)} value={SECTIONS[s]} onChange={(v) => nav({ search: { s: (Object.keys(SECTIONS) as S[]).find((k) => SECTIONS[k] === v) } })} />
        {s === "habitos" && <Habits />}
        {s === "comidas" && <Meals />}
        {s === "metas" && <Goals />}
        {s === "rutinas" && <Routines />}
        {s === "ajustes" && <SettingsPanel />}
      </div>
    </>
  );
}

function DayPicker({ value, onChange }: { value: number[]; onChange: (v: number[]) => void }) {
  return (
    <div className="flex justify-between gap-1">
      {WD.map((d, i) => (
        <button key={i} type="button" onClick={() => onChange(value.includes(i) ? value.filter((x) => x !== i) : [...value, i])}
          className={cn("h-10 w-10 rounded-full border text-sm font-bold", value.includes(i) ? "border-primary bg-primary text-primary-foreground" : "border-border text-muted-foreground")}>{d}</button>
      ))}
    </div>
  );
}

function Habits() {
  const db = useDB();
  const [h, setH] = useState<Habit | null>(null);
  const today = new Date();
  const week = Array.from({ length: 7 }, (_, i) => { const d = new Date(today); d.setDate(d.getDate() - 6 + i); return d; });
  return (
    <>
      <Card title="Hábitos y ritmos" action={<button onClick={() => setH({ id: "", title: "", who: "both", days: [0, 1, 2, 3, 4, 5, 6], log: [], emoji: "🌱" })} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-4 w-4" />Nuevo</button>}>
        {db.habits.length === 0 ? <Empty>Añadan hábitos como caminar, leer o cocinar.</Empty> : (
          <div className="space-y-4">
            {db.habits.map((x) => (
              <div key={x.id}>
                <button onClick={() => setH(x)} className="flex w-full items-center gap-2 text-left">
                  <span className="text-xl">{x.emoji}</span><span className="flex-1 font-semibold">{x.title}</span><PersonTag p={x.who} />
                </button>
                <div className="mt-2 grid grid-cols-7 gap-1.5">
                  {week.map((d) => {
                    const k = ymd(d), on = x.log.includes(k);
                    return (
                      <button key={k} onClick={() => setDB((db) => ({ ...db, habits: db.habits.map((y) => y.id === x.id ? { ...y, log: on ? y.log.filter((l) => l !== k) : [...y.log, k] } : y) }))}
                        className={cn("flex h-9 flex-col items-center justify-center rounded-lg text-[10px] font-bold", on ? "bg-allison text-primary-foreground" : x.days.includes(d.getDay()) ? "bg-muted text-muted-foreground" : "bg-muted/40 text-muted-foreground/50")}>
                        {WD[d.getDay()]}<span>{d.getDate()}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
      <BottomSheet open={!!h} onClose={() => setH(null)} title={h?.id ? "Editar hábito" : "Nuevo hábito"}>
        {h && (
          <div className="space-y-4">
            <div className="grid grid-cols-[4rem_1fr] gap-3">
              <Field label="Emoji"><input className={cn(inputCls, "text-center text-xl")} value={h.emoji} onChange={(e) => setH({ ...h, emoji: e.target.value })} /></Field>
              <Field label="Hábito"><input autoFocus className={inputCls} placeholder="Ej. Caminar 20 min" value={h.title} onChange={(e) => setH({ ...h, title: e.target.value })} /></Field>
            </div>
            <Field label="¿De quién es?"><PersonPicker value={h.who} onChange={(w) => setH({ ...h, who: w })} /></Field>
            <Field label="Días"><DayPicker value={h.days} onChange={(d) => setH({ ...h, days: d })} /></Field>
            <PrimaryButton onClick={() => { if (!h.title.trim()) return; setDB((db) => ({ ...db, habits: h.id ? db.habits.map((x) => x.id === h.id ? h : x) : [...db.habits, { ...h, id: uid() }] })); toast.success("Guardado"); setH(null); }}>Guardar hábito</PrimaryButton>
            {h.id && <GhostButton className="w-full text-destructive" onClick={() => { setDB((db) => ({ ...db, habits: db.habits.filter((x) => x.id !== h.id) })); setH(null); }}>Eliminar hábito</GhostButton>}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

function Meals() {
  const db = useDB();
  const [m, setM] = useState<Meal | null>(null);
  const start = db.settings.weekStart;
  const order = Array.from({ length: 7 }, (_, i) => (start + i) % 7);
  const slots = ["desayuno", "almuerzo", "cena"] as const;
  return (
    <>
      <Card title="Menú semanal">
        <div className="space-y-3">
          {order.map((d) => (
            <div key={d} className={cn("rounded-2xl border border-border p-3", d === new Date().getDay() && "border-primary bg-primary/5")}>
              <div className="mb-2 font-display text-base font-semibold">{WDL[d]}</div>
              <div className="space-y-1.5">
                {slots.map((slot) => {
                  const meal = db.meals.find((x) => x.day === d && x.slot === slot);
                  return (
                    <button key={slot} onClick={() => setM(meal ?? { id: "", day: d, slot, title: "" })} className="flex w-full items-center gap-2 text-left text-sm">
                      <span className="w-20 text-[11px] font-bold uppercase text-muted-foreground">{slot}</span>
                      <span className={cn("flex-1", meal ? "font-semibold" : "italic text-muted-foreground/60")}>{meal?.title ?? "Añadir…"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </Card>
      <BottomSheet open={!!m} onClose={() => setM(null)} title={m ? `${WDL[m.day]} · ${m.slot}` : ""}>
        {m && (
          <div className="space-y-4">
            <Field label="¿Qué van a comer?"><input autoFocus className={inputCls} placeholder="Ej. Pasta al pesto" value={m.title} onChange={(e) => setM({ ...m, title: e.target.value })} /></Field>
            <Field label="Notas"><input className={inputCls} value={m.notes ?? ""} onChange={(e) => setM({ ...m, notes: e.target.value })} /></Field>
            <PrimaryButton onClick={() => { if (!m.title.trim()) return; setDB((db) => ({ ...db, meals: m.id ? db.meals.map((x) => x.id === m.id ? m : x) : [...db.meals, { ...m, id: uid() }] })); toast.success(`Añadido al menú: "${m.title}"`); setM(null); }}>Guardar</PrimaryButton>
            {m.id && <GhostButton className="w-full text-destructive" onClick={() => { setDB((db) => ({ ...db, meals: db.meals.filter((x) => x.id !== m.id) })); setM(null); }}>Quitar comida</GhostButton>}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

function Goals() {
  const db = useDB();
  const [g, setG] = useState<Goal | null>(null);
  const doneTasks = db.tasks.filter((t) => t.done).length;
  const habitDays = Math.max(0, ...db.habits.map((h) => h.log.length));
  const dates = db.events.filter((e) => e.category === "Cita y tiempo juntos").length;
  const badges = [
    { t: "Primer paso juntos", d: "Programaron su primer plan.", ok: db.events.length > 0 },
    { t: "Paz mental", d: "Completaron 5 tareas.", ok: doneTasks >= 5 },
    { t: "Ritmo constante", d: "3 días en una rutina.", ok: habitDays >= 3 },
    { t: "Tiempo de calidad", d: "Una noche de cita.", ok: dates > 0 },
  ];
  return (
    <>
      <Card title="Metas compartidas" action={<button onClick={() => setG({ id: "", title: "", target: 10, current: 0, unit: "" })} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-4 w-4" />Nueva</button>}>
        {db.goals.length === 0 ? <Empty>No hay metas activas.</Empty> : (
          <div className="space-y-4">
            {db.goals.map((x) => {
              const pct = (x.current / x.target) * 100;
              return (
                <div key={x.id}>
                  <button onClick={() => setG(x)} className="w-full text-left">
                    <div className="flex justify-between gap-2"><span className="font-semibold">{x.title}</span><span className="text-sm font-bold text-primary">{Math.round(pct)}%</span></div>
                    {x.notes && <div className="text-xs text-muted-foreground">{x.notes}</div>}
                  </button>
                  <Progress value={pct} className="mt-2 bg-gold" />
                  <div className="mt-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>{x.unit}{x.current} / {x.unit}{x.target}</span>
                    <div className="flex gap-1">
                      {[1, 5].map((n) => <button key={n} onClick={() => { setDB((db) => ({ ...db, goals: db.goals.map((y) => y.id === x.id ? { ...y, current: Math.min(y.target, y.current + n * (y.unit === "$" ? 10 : 1)) } : y) })); if (x.current < x.target && x.current + n * (x.unit === "$" ? 10 : 1) >= x.target) toast.success("Hito especial alcanzado ✨"); }} className="rounded-full bg-muted px-2.5 py-1 font-bold">+{n * (x.unit === "$" ? 10 : 1)}</button>)}
                    </div>
                  </div>
                  {x.reward && <div className="mt-1 text-xs italic text-muted-foreground">🎁 {x.reward}</div>}
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <Card title="Logros desbloqueados">
        <div className="grid grid-cols-2 gap-2">
          {badges.map((b) => (
            <div key={b.t} className={cn("rounded-2xl border p-3", b.ok ? "border-gold/50 bg-gold/10" : "border-border opacity-50")}>
              <Trophy className={cn("h-5 w-5", b.ok ? "text-gold" : "text-muted-foreground")} />
              <div className="mt-1 text-sm font-bold">{b.t}</div>
              <div className="text-[11px] text-muted-foreground">{b.d}</div>
            </div>
          ))}
        </div>
      </Card>
      <BottomSheet open={!!g} onClose={() => setG(null)} title={g?.id ? "Editar meta" : "Nueva meta"}>
        {g && (
          <div className="space-y-4">
            <Field label="Meta"><input autoFocus className={inputCls} placeholder="Ej. Ahorrar para viaje" value={g.title} onChange={(e) => setG({ ...g, title: e.target.value })} /></Field>
            <Field label="Detalle"><input className={inputCls} value={g.notes ?? ""} onChange={(e) => setG({ ...g, notes: e.target.value })} /></Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Unidad"><input className={inputCls} placeholder="$" value={g.unit} onChange={(e) => setG({ ...g, unit: e.target.value })} /></Field>
              <Field label="Actual"><input type="number" className={inputCls} value={g.current} onChange={(e) => setG({ ...g, current: Number(e.target.value) })} /></Field>
              <Field label="Objetivo"><input type="number" className={inputCls} value={g.target} onChange={(e) => setG({ ...g, target: Number(e.target.value) || 1 })} /></Field>
            </div>
            <Field label="Recompensa compartida"><input className={inputCls} value={g.reward ?? ""} onChange={(e) => setG({ ...g, reward: e.target.value })} /></Field>
            <PrimaryButton onClick={() => { if (!g.title.trim()) return; setDB((db) => ({ ...db, goals: g.id ? db.goals.map((x) => x.id === g.id ? g : x) : [...db.goals, { ...g, id: uid() }] })); toast.success("Meta guardada"); setG(null); }}>Guardar meta</PrimaryButton>
            {g.id && <GhostButton className="w-full text-destructive" onClick={() => { setDB((db) => ({ ...db, goals: db.goals.filter((x) => x.id !== g.id) })); setG(null); }}>Eliminar meta</GhostButton>}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

function Routines() {
  const db = useDB();
  const [r, setR] = useState<Recurring | null>(null);
  return (
    <>
      <Card title="Tareas automáticas diarias" action={<button onClick={() => setR({ id: "", title: "", days: [1, 2, 3, 4, 5], assignee: "both", category: "Hogar" })} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-4 w-4" />Nueva</button>}>
        {db.recurring.length === 0 ? <Empty>No hay tareas automáticas definidas.</Empty> : (
          <div className="divide-y divide-border">
            {db.recurring.map((x) => (
              <button key={x.id} onClick={() => setR(x)} className="flex w-full items-center gap-3 py-2.5 text-left">
                <RefreshCw className="h-4 w-4 text-primary" />
                <div className="flex-1"><div className="font-semibold">{x.title}</div><div className="text-[11px] text-muted-foreground">{x.days.length === 7 ? "Todos los días" : x.days.sort().map((d) => WD[d]).join(" · ")}</div></div>
                <PersonTag p={x.assignee} />
              </button>
            ))}
          </div>
        )}
        <GhostButton className="mt-3 w-full" onClick={() => { const n = runAutoTasks(true); toast.success(n ? `Se crearon ${n} tareas de hoy` : "Las tareas de hoy ya existen"); }}>Generar tareas de hoy ahora</GhostButton>
      </Card>
      <BottomSheet open={!!r} onClose={() => setR(null)} title={r?.id ? "Editar rutina" : "Nueva rutina"}>
        {r && (
          <div className="space-y-4">
            <Field label="Tarea"><input autoFocus className={inputCls} value={r.title} onChange={(e) => setR({ ...r, title: e.target.value })} /></Field>
            <Field label="Asignar a"><PersonPicker value={r.assignee} onChange={(a) => setR({ ...r, assignee: a })} /></Field>
            <Field label="Días"><DayPicker value={r.days} onChange={(d) => setR({ ...r, days: d })} /></Field>
            <Field label="Categoría"><Chips options={TASK_CATEGORIES} value={r.category} onChange={(c) => setR({ ...r, category: c })} /></Field>
            <PrimaryButton onClick={() => { if (!r.title.trim()) return; setDB((db) => ({ ...db, recurring: r.id ? db.recurring.map((x) => x.id === r.id ? r : x) : [...db.recurring, { ...r, id: uid() }] })); toast.success("Rutina actualizada"); setR(null); }}>Guardar</PrimaryButton>
            {r.id && <GhostButton className="w-full text-destructive" onClick={() => { setDB((db) => ({ ...db, recurring: db.recurring.filter((x) => x.id !== r.id) })); setR(null); }}><Trash2 className="mr-1 inline h-4 w-4" />Eliminar</GhostButton>}
          </div>
        )}
      </BottomSheet>
    </>
  );
}

function SettingsPanel() {
  const db = useDB();
  const [s, setS] = useState(db.settings);
  const [av, setAv] = useState<"mateo" | "allison" | null>(null);
  const [code, setCode] = useState("");
  const file = useRef<HTMLInputElement>(null);
  const [lastSettings, setLast] = useState(db.settings);
  if (db.settings !== lastSettings) { setLast(db.settings); setS(db.settings); }

  const download = () => {
    const blob = new Blob([JSON.stringify(getDB(), null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = `duoplan-${ymd(new Date())}.json`; a.click();
    toast.success("Copia descargada");
  };

  return (
    <>
      {av && <AvatarPicker p={av} open onClose={() => setAv(null)} />}
      <Card title="Perfiles">
        <div className="space-y-3">
          {(["mateo", "allison"] as const).map((p) => (
            <div key={p} className="grid grid-cols-[3.5rem_1fr] items-end gap-2">
              <Field label="Avatar"><button onClick={() => setAv(p)} className="flex min-h-11 w-full items-center justify-center rounded-xl border border-input"><Avatar p={p} size={34} /></button></Field>
              <Field label={p === "mateo" ? "Pareja 1" : "Pareja 2"}>
                <div className="flex items-center gap-2"><PersonDot p={p} /><input className={inputCls} value={s[p].name} onChange={(e) => setS({ ...s, [p]: { ...s[p], name: e.target.value } })} /></div>
              </Field>
            </div>
          ))}
        </div>
      </Card>
      <Card title="Horarios habituales">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Despertar"><input type="time" className={inputCls} value={s.wake} onChange={(e) => setS({ ...s, wake: e.target.value })} /></Field>
          <Field label="Dormir"><input type="time" className={inputCls} value={s.sleep} onChange={(e) => setS({ ...s, sleep: e.target.value })} /></Field>
          <Field label="Inicio de trabajo"><input type="time" className={inputCls} value={s.workStart} onChange={(e) => setS({ ...s, workStart: e.target.value })} /></Field>
          <Field label="Fin de trabajo"><input type="time" className={inputCls} value={s.workEnd} onChange={(e) => setS({ ...s, workEnd: e.target.value })} /></Field>
          <Field label="Moneda"><input className={inputCls} value={s.currency} onChange={(e) => setS({ ...s, currency: e.target.value })} /></Field>
          <Field label="Semana inicia"><Chips options={["Lunes", "Domingo"] as const} value={s.weekStart === 1 ? "Lunes" : "Domingo"} onChange={(v) => setS({ ...s, weekStart: v === "Lunes" ? 1 : 0 })} /></Field>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm font-semibold"><input type="checkbox" checked={s.h24} onChange={(e) => setS({ ...s, h24: e.target.checked })} className="h-4 w-4" />Formato 24 horas</label>
        <PrimaryButton className="mt-4" onClick={() => { setDB((d) => ({ ...d, settings: s })); toast.success("Ajustes guardados"); }}>Guardar ajustes</PrimaryButton>
      </Card>
      <Card title="Sincronizar entre celulares">
        <p className="text-sm text-muted-foreground">Copia tu código y envíalo a tu pareja por WhatsApp. Ella lo pega aquí para actualizar su celular.</p>
        <GhostButton className="mt-3 flex w-full items-center justify-center gap-2" onClick={async () => { await navigator.clipboard.writeText(exportCode(getDB())); toast.success("¡Código copiado! Envíaselo a tu pareja."); }}><Copy className="h-4 w-4" />Copiar código para enviar</GhostButton>
        <textarea rows={3} className={cn(inputCls, "mt-3 font-mono text-xs")} placeholder="Pega el código de tu pareja aquí…" value={code} onChange={(e) => setCode(e.target.value)} />
        <PrimaryButton className="mt-2" onClick={() => { try { replaceDB(importCode(code)); setCode(""); toast.success("¡Datos sincronizados!"); } catch (e) { toast.error((e as Error).message); } }}>Aplicar y sincronizar</PrimaryButton>
      </Card>
      <Card title="Datos y copia de seguridad">
        <div className="grid grid-cols-2 gap-2">
          <GhostButton className="flex items-center justify-center gap-1.5" onClick={download}><Download className="h-4 w-4" />Exportar</GhostButton>
          <GhostButton className="flex items-center justify-center gap-1.5" onClick={() => file.current?.click()}><Upload className="h-4 w-4" />Restaurar</GhostButton>
        </div>
        <input ref={file} type="file" accept="application/json" className="hidden" onChange={async (e) => {
          const f = e.target.files?.[0]; if (!f) return;
          try { const j = JSON.parse(await f.text()); if (!Array.isArray(j.tasks)) throw new Error(); replaceDB(j); toast.success("Datos importados"); } catch { toast.error("No se pudo leer el archivo."); }
          e.target.value = "";
        }} />
        <button className="mt-3 flex w-full items-center justify-center gap-1.5 py-2 text-sm font-semibold text-destructive" onClick={() => { if (confirm("¿Restablecer datos de muestra? Se reemplazarán los cambios actuales.")) { resetDB(); toast("Datos restablecidos"); } }}>
          <Flame className="h-4 w-4" />Restablecer datos de muestra
        </button>
      </Card>
    </>
  );
}
