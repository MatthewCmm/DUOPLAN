import { type ReactNode, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { type Person, useDB, personName } from "@/lib/store";

export function PaintHeader({ image, night, title, subtitle, children }: { image: string; night?: string; title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="relative -mx-4 -mt-[calc(env(safe-area-inset-top)+4.5rem)] mb-4 h-[19rem] overflow-hidden">
      <img src={image} alt="" width={1024} height={1280} className={cn("drift absolute inset-0 h-full w-full object-cover", night && "dark:hidden")} />
      {night && <img src={night} alt="" width={1024} height={1280} className="drift absolute inset-0 hidden h-full w-full object-cover dark:block" />}
      <div className="paint-fade absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 px-5 pb-6">
        <h1 className="rise text-4xl font-semibold text-on-paint drop-shadow-[0_2px_12px_rgb(0_0_0/0.45)]">{title}</h1>
        {subtitle && <p className="rise mt-1 text-sm font-medium text-on-paint/90 drop-shadow-[0_1px_8px_rgb(0_0_0/0.5)]">{subtitle}</p>}
        {children}
      </div>
    </header>
  );
}

export function Card({ className, children, title, action }: { className?: string; children: ReactNode; title?: ReactNode; action?: ReactNode }) {
  return (
    <section className={cn("paint-card rise p-4", className)}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-2">
          {title && <h2 className="text-lg font-semibold">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

const dot: Record<Person, string> = { mateo: "bg-mateo", allison: "bg-allison", both: "bg-both" };
export function PersonDot({ p, className }: { p: Person; className?: string }) {
  return <span className={cn("inline-block h-2.5 w-2.5 shrink-0 rounded-full", dot[p], className)} />;
}
export function PersonTag({ p }: { p: Person }) {
  const db = useDB();
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
      <PersonDot p={p} className="h-2 w-2" /> {personName(db, p)}
    </span>
  );
}

export function PersonPicker({ value, onChange }: { value: Person; onChange: (p: Person) => void }) {
  const db = useDB();
  const opts: Person[] = ["mateo", "allison", "both"];
  return (
    <div className="grid grid-cols-3 gap-2">
      {opts.map((p) => (
        <button key={p} type="button" onClick={() => onChange(p)}
          className={cn("flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2 text-sm font-semibold transition",
            value === p ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground")}>
          <PersonDot p={p} /> {personName(db, p)}
        </button>
      ))}
    </div>
  );
}

export function Chips<T extends string>({ options, value, onChange }: { options: readonly T[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 py-1">
      {options.map((o) => (
        <button key={o} type="button" onClick={() => onChange(o)}
          className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
            value === o ? "border-primary bg-primary text-primary-foreground" : "border-border bg-card text-muted-foreground")}>
          {o}
        </button>
      ))}
    </div>
  );
}

export function BottomSheet({ open, onClose, title, children }: { open: boolean; onClose: () => void; title: string; children: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" role="dialog" aria-label={title}>
      <button aria-label="Cerrar" className="absolute inset-0 bg-foreground/40 backdrop-blur-sm animate-in fade-in" onClick={onClose} />
      <div className="safe-bottom relative max-h-[88dvh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-border bg-popover p-5 animate-in slide-in-from-bottom duration-300">
        <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-border" />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">{title}</h2>
          <button onClick={onClose} aria-label="Cerrar" className="rounded-full p-1.5 text-muted-foreground hover:bg-muted"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  );
}
export const inputCls = "w-full rounded-xl border border-input bg-background/60 px-3 py-2.5 text-[15px] outline-none focus:border-primary focus:ring-2 focus:ring-ring/30";

export function PrimaryButton({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={cn("w-full rounded-xl bg-primary px-4 py-3 text-[15px] font-bold text-primary-foreground shadow-float transition active:scale-[0.98] disabled:opacity-50", className)} />;
}
export function GhostButton({ className, ...p }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return <button {...p} className={cn("rounded-xl border border-border px-3 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-muted active:scale-[0.98]", className)} />;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="py-6 text-center text-sm italic text-muted-foreground">{children}</p>;
}

export function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full bg-primary transition-all duration-700", className)} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
