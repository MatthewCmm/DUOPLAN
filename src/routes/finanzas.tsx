import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, ArrowDownLeft, ArrowUpRight, Pencil, Plus } from "lucide-react";
import canyon from "@/assets/paint-canyon.jpg";
import { BottomSheet, Card, Chips, Empty, Field, PaintHeader, PersonDot, PersonPicker, PrimaryButton, Progress, inputCls } from "@/components/duo/ui";
import { MONEY_CATEGORIES, type Movement, money, parseYmd, personName, setDB, uid, useDB, ymd } from "@/lib/store";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/finanzas")({
  head: () => ({
    meta: [
      { title: "Finanzas · DuoPlan" },
      { name: "description", content: "Presupuesto mensual, gastos compartidos y quién pagó qué." },
      { property: "og:title", content: "Finanzas · DuoPlan" },
      { property: "og:description", content: "Presupuesto mensual, gastos compartidos y quién pagó qué." },
    ],
  }),
  component: Finance,
});

function Finance() {
  const db = useDB();
  const c = db.settings.currency;
  const [mv, setMv] = useState<Movement | null>(null);
  const [budgetOpen, setBudgetOpen] = useState(false);
  const [budget, setBudget] = useState("");
  const m = ymd(new Date()).slice(0, 7);
  const month = db.movements.filter((x) => x.date.startsWith(m)).sort((a, b) => b.date.localeCompare(a.date));
  const spent = month.filter((x) => x.type === "gasto").reduce((s, x) => s + x.amount, 0);
  const income = month.filter((x) => x.type === "ingreso").reduce((s, x) => s + x.amount, 0);
  const pct = db.settings.budget ? (spent / db.settings.budget) * 100 : 0;
  const byCat = MONEY_CATEGORIES.map((cat) => ({ cat, v: month.filter((x) => x.type === "gasto" && x.category === cat).reduce((s, x) => s + x.amount, 0) })).filter((x) => x.v > 0).sort((a, b) => b.v - a.v);
  const paid = (p: "mateo" | "allison") => month.filter((x) => x.type === "gasto").reduce((s, x) => s + (x.paidBy === p ? x.amount : x.paidBy === "both" ? x.amount / 2 : 0), 0);
  const pm = paid("mateo"), pa = paid("allison");
  const diff = (pm - pa) / 2;

  return (
    <>
      <PaintHeader image={canyon} title="Finanzas compartidas" subtitle="Gastos claros, decisiones tranquilas." />
      <div className="space-y-4">
        <Card title="Presupuesto del mes" action={<button onClick={() => { setBudget(String(db.settings.budget)); setBudgetOpen(true); }} aria-label="Editar presupuesto" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><Pencil className="h-4 w-4" /></button>}>
          <div className="flex items-baseline justify-between">
            <span className="font-display text-4xl font-semibold">{money(spent, c)}</span>
            <span className="text-sm text-muted-foreground">de {money(db.settings.budget, c)}</span>
          </div>
          <Progress value={pct} className={cn("mt-3", pct > 90 && "bg-destructive")} />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>{Math.round(pct)}% usado</span><span>Quedan {money(Math.max(0, db.settings.budget - spent), c)}</span></div>
          {pct > 90 && <div className="mt-3 flex items-center gap-2 rounded-xl bg-destructive/10 p-2.5 text-xs font-semibold text-destructive"><AlertTriangle className="h-4 w-4" />Atención: han usado más del 90% del presupuesto.</div>}
          {income > 0 && <div className="mt-2 text-xs text-muted-foreground">Ingresos del mes: {money(income, c)}</div>}
        </Card>

        <Card title="Equilibrio de pareja">
          <div className="flex h-3 overflow-hidden rounded-full bg-muted">
            <div className="bg-mateo" style={{ width: `${pm + pa ? (pm / (pm + pa)) * 100 : 50}%` }} />
            <div className="flex-1 bg-allison" />
          </div>
          <div className="mt-2 flex justify-between text-sm font-semibold">
            <span className="flex items-center gap-1.5"><PersonDot p="mateo" />{db.settings.mateo.name} {money(pm, c)}</span>
            <span className="flex items-center gap-1.5">{db.settings.allison.name} {money(pa, c)}<PersonDot p="allison" /></span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {Math.abs(diff) < 1 ? "Están perfectamente a mano ✨" : `${diff > 0 ? db.settings.allison.name : db.settings.mateo.name} le debe ${money(Math.abs(diff), c)} a ${diff > 0 ? db.settings.mateo.name : db.settings.allison.name}.`}
          </p>
        </Card>

        <Card title="Distribución por categoría">
          {byCat.length === 0 ? <Empty>Aún no hay gastos este mes.</Empty> : (
            <div className="space-y-2.5">
              {byCat.map(({ cat, v }, i) => (
                <div key={cat}>
                  <div className="flex justify-between text-sm"><span className="font-semibold">{cat}</span><span className="text-muted-foreground">{money(v, c)}</span></div>
                  <Progress value={(v / spent) * 100} className={["bg-chart-1", "bg-chart-2", "bg-chart-3", "bg-chart-4", "bg-chart-5"][i % 5]} />
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Movimientos del mes" action={<button onClick={() => setMv({ id: "", title: "", amount: 0, type: "gasto", category: MONEY_CATEGORIES[1], paidBy: "both", date: ymd(new Date()) })} className="flex items-center gap-1 text-xs font-bold text-primary"><Plus className="h-4 w-4" />Registrar</button>}>
          {month.length === 0 ? <Empty>Aún no hay movimientos este mes.</Empty> : (
            <div className="divide-y divide-border">
              {month.map((x) => (
                <button key={x.id} onClick={() => setMv(x)} className="flex w-full items-center gap-3 py-2.5 text-left">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-full", x.type === "gasto" ? "bg-primary/15 text-primary" : "bg-allison/15 text-allison")}>
                    {x.type === "gasto" ? <ArrowUpRight className="h-4 w-4" /> : <ArrowDownLeft className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{x.title}</div>
                    <div className="text-[11px] text-muted-foreground">{x.category} · {personName(db, x.paidBy)} · {parseYmd(x.date).toLocaleDateString("es", { day: "numeric", month: "short" })}</div>
                  </div>
                  <span className={cn("font-bold", x.type === "ingreso" && "text-allison")}>{x.type === "gasto" ? "-" : "+"}{money(x.amount, c)}</span>
                </button>
              ))}
            </div>
          )}
        </Card>
      </div>

      <BottomSheet open={budgetOpen} onClose={() => setBudgetOpen(false)} title="Presupuesto mensual">
        <div className="space-y-4">
          <Field label={`Monto (${c})`}><input type="number" inputMode="decimal" className={inputCls} value={budget} onChange={(e) => setBudget(e.target.value)} /></Field>
          <PrimaryButton onClick={() => { setDB((d) => ({ ...d, settings: { ...d.settings, budget: Number(budget) || 0 } })); toast.success("Presupuesto actualizado"); setBudgetOpen(false); }}>Guardar</PrimaryButton>
        </div>
      </BottomSheet>
      <MovementSheet mv={mv} onClose={() => setMv(null)} />
    </>
  );
}

function MovementSheet({ mv, onClose }: { mv: Movement | null; onClose: () => void }) {
  const [x, setX] = useState(mv);
  const [last, setLast] = useState(mv);
  if (mv !== last) { setLast(mv); setX(mv); }
  if (!x) return null;
  const isNew = !x.id;
  const save = () => {
    if (!x.title.trim() || !x.amount) return;
    setDB((db) => ({ ...db, movements: isNew ? [{ ...x, id: uid() }, ...db.movements] : db.movements.map((m) => m.id === x.id ? x : m) }));
    toast.success("Movimiento registrado");
    onClose();
  };
  return (
    <BottomSheet open={!!mv} onClose={onClose} title={isNew ? "Registrar movimiento" : "Editar movimiento"}>
      <div className="space-y-4">
        <Chips options={["gasto", "ingreso"] as const} value={x.type} onChange={(t) => setX({ ...x, type: t })} />
        <Field label="Concepto o detalle"><input autoFocus className={inputCls} value={x.title} onChange={(e) => setX({ ...x, title: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Monto"><input type="number" inputMode="decimal" className={inputCls} value={x.amount || ""} onChange={(e) => setX({ ...x, amount: Number(e.target.value) })} /></Field>
          <Field label="Fecha"><input type="date" className={inputCls} value={x.date} onChange={(e) => setX({ ...x, date: e.target.value })} /></Field>
        </div>
        <Field label="Categoría"><Chips options={MONEY_CATEGORIES} value={x.category} onChange={(c) => setX({ ...x, category: c })} /></Field>
        <Field label="Pagado por"><PersonPicker value={x.paidBy} onChange={(p) => setX({ ...x, paidBy: p })} /></Field>
        <PrimaryButton onClick={save}>Guardar</PrimaryButton>
        {!isNew && <button className="w-full py-2 text-sm font-semibold text-destructive" onClick={() => { setDB((db) => ({ ...db, movements: db.movements.filter((m) => m.id !== x.id) })); toast("Elemento eliminado"); onClose(); }}>Eliminar</button>}
      </div>
    </BottomSheet>
  );
}
