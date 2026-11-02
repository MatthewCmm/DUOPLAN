import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus } from "lucide-react";
import lake from "@/assets/paint-lake.jpg";
import { Card, Chips, Empty, PaintHeader } from "@/components/duo/ui";
import { TaskRow, TaskSheet } from "@/components/duo/tasks";
import { type Task, useDB, ymd } from "@/lib/store";

export const Route = createFileRoute("/tareas")({
  head: () => ({
    meta: [
      { title: "Tareas · DuoPlan" },
      { name: "description", content: "Tareas y pendientes compartidos, con subtareas y responsables." },
      { property: "og:title", content: "Tareas · DuoPlan" },
      { property: "og:description", content: "Tareas y pendientes compartidos, con subtareas y responsables." },
    ],
  }),
  component: Tasks,
});

const FILTERS = ["Pendientes", "Hoy", "Mateo", "Allison", "Juntos", "Hechas"] as const;

function Tasks() {
  const db = useDB();
  const [f, setF] = useState<(typeof FILTERS)[number]>("Pendientes");
  const [open, setOpen] = useState<Task | null>(null);
  const [sheet, setSheet] = useState(false);
  const today = ymd(new Date());
  const list = db.tasks.filter((t) => {
    if (f === "Hechas") return t.done;
    if (t.done) return false;
    if (f === "Hoy") return !!t.due && t.due <= today;
    if (f === "Mateo") return t.assignee === "mateo";
    if (f === "Allison") return t.assignee === "allison";
    if (f === "Juntos") return t.assignee === "both";
    return true;
  }).sort((a, b) => (a.due ?? "9").localeCompare(b.due ?? "9"));

  const groups = list.reduce<Record<string, Task[]>>((g, t) => { (g[t.category] ??= []).push(t); return g; }, {});

  return (
    <>
      <PaintHeader image={lake} title="Tareas y pendientes" subtitle="Un espacio para organizar el hogar con ligereza." />
      <div className="space-y-4">
        <Chips options={FILTERS} value={f} onChange={setF} />
        {list.length === 0 ? <Card><Empty>No hay tareas en esta sección.</Empty></Card> :
          Object.entries(groups).map(([cat, ts]) => (
            <Card key={cat} title={cat}>
              <div className="divide-y divide-border">{ts.map((t) => <TaskRow key={t.id} t={t} onOpen={(x) => { setOpen(x); setSheet(true); }} />)}</div>
            </Card>
          ))}
      </div>
      <button onClick={() => { setOpen(null); setSheet(true); }} aria-label="Nueva tarea"
        className="shadow-float fixed bottom-28 right-[max(1.25rem,calc(50vw-15rem))] z-30 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground transition active:scale-90">
        <Plus className="h-7 w-7" />
      </button>
      <TaskSheet task={open} open={sheet} onClose={() => setSheet(false)} />
    </>
  );
}
