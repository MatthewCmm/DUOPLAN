import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode, useEffect, useState } from "react";
import { CalendarDays, CheckSquare, Home, LayoutGrid, Menu, Moon, Sun, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { setMe, useDB, useMe, ymd } from "@/lib/store";
import { getPref, setLangPref, useLang, type LangPref } from "@/lib/lang";
import { useT } from "@/lib/i18n";
import { budgetColor, dayScore, monthBudget } from "@/lib/metrics";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Avatar, AvatarPicker } from "./avatar";

const NAV = [
  { to: "/", label: "Hoy", icon: Home },
  { to: "/tareas", label: "Tareas", icon: CheckSquare },
  { to: "/calendario", label: "Agenda", icon: CalendarDays },
  { to: "/finanzas", label: "Finanzas", icon: Wallet },
  { to: "/mas", label: "Más", icon: LayoutGrid },
] as const;

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => setDark(document.documentElement.classList.contains("dark")), []);
  const set = (next: boolean) => {
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("duoplan_theme", next ? "dark" : "light");
  };
  return { dark, toggle: () => set(!dark), set };
}

function MiniRing({ value }: { value: number }) {
  const r = 14, c = 2 * Math.PI * r;
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" className="-rotate-90">
      <circle cx="18" cy="18" r={r} fill="none" strokeWidth="4" className="stroke-on-paint/25" />
      <circle cx="18" cy="18" r={r} fill="none" strokeWidth="4" strokeLinecap="round" stroke="#E8C766"
        strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)} style={{ transition: "stroke-dashoffset .7s" }} />
    </svg>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const { dark, toggle, set: setTheme } = useTheme();
  const db = useDB();
  const me = useMe();
  const t = useT();
  const lang = useLang();
  const nav = useNavigate();
  const [mounted, setMounted] = useState(false);
  const [menu, setMenu] = useState(false);
  const [picker, setPicker] = useState(false);
  useEffect(() => setMounted(true), []);
  useEffect(() => setMenu(false), [path]);
  useEffect(() => { document.documentElement.lang = lang; }, [lang]);

  const today = ymd(new Date());
  const { score } = dayScore(db, today);
  const b = monthBudget(db, today);
  const chip = "flex min-h-11 items-center gap-1.5 rounded-full border border-on-paint/30 bg-foreground/25 px-2.5 text-sm font-bold text-on-paint backdrop-blur-md";

  return (
    <div className="mx-auto min-h-dvh max-w-lg">
      <div className="fixed inset-x-0 top-0 z-40 mx-auto max-w-lg px-3 pt-[calc(env(safe-area-inset-top)+0.5rem)] pb-2">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button onClick={() => setMenu(true)} aria-label={t("Menú")} className={cn(chip, "w-11 justify-center px-0")}><Menu className="h-5 w-5" /></button>
            {mounted && me && (
              <button onClick={() => setPicker(true)} aria-label={t("Cambiar icono")} className={chip}>
                <Avatar p={me} size={26} /><span className="max-w-[5.5rem] truncate">{db.settings[me].name}</span>
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setLangPref(lang === "es" ? "en" : "es")} aria-label={t("Idioma")} className={cn(chip, "justify-center px-3 text-xs")}>{lang === "es" ? "ES" : "EN"}</button>
            <Link to="/" aria-label={t("Puntaje diario")} className={cn(chip, "gap-1 pl-1 pr-2.5")}>
              <MiniRing value={mounted ? score : 0} /><span className="text-xs">{mounted ? score : 0}%</span>
            </Link>
            <button onClick={toggle} aria-label={t("Modo noche")} className={cn(chip, "w-11 justify-center px-0")}>{dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}</button>
          </div>
        </div>
        <Link to="/finanzas" aria-label={t("Presupuesto del mes")} className="mt-1.5 block py-1.5">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-on-paint/25">
            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${mounted ? Math.min(100, b.pct) : 0}%`, background: budgetColor(b.pct) }} />
          </div>
        </Link>
      </div>

      <main className="px-4 pt-[calc(env(safe-area-inset-top)+5.5rem)] pb-32">{children}</main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 mx-auto max-w-lg px-3">
        <div className="paint-card flex items-center justify-around px-1 py-1.5">
          {NAV.map(({ to, label, icon: Icon }) => {
            const active = to === "/" ? path === "/" : path.startsWith(to);
            return (
              <Link key={to} to={to} className={cn("flex min-h-11 flex-1 flex-col items-center gap-0.5 rounded-xl py-1.5 text-[11px] font-semibold transition", active ? "text-primary" : "text-muted-foreground")}>
                <span className={cn("rounded-full px-3 py-1 transition", active && "bg-primary/15")}><Icon className="h-5 w-5" /></span>
                {t(label)}
              </Link>
            );
          })}
        </div>
      </nav>

      <Sheet open={menu} onOpenChange={setMenu}>
        <SheetContent side="left" className="w-[85%] max-w-xs overflow-y-auto">
          <SheetHeader><SheetTitle className="font-display italic">DuoPlan</SheetTitle></SheetHeader>
          <div className="mt-4 space-y-5">
            <div className="grid grid-cols-2 gap-2">
              {(["mateo", "allison"] as const).map((p) => (
                <button key={p} onClick={() => setMe(p)} className={cn("flex min-h-14 items-center gap-2 rounded-2xl border p-2 text-left text-sm font-bold", me === p ? "border-primary bg-primary/10" : "border-border")}>
                  <Avatar p={p} size={34} /><span className="truncate">{db.settings[p].name}</span>
                </button>
              ))}
            </div>
            {me && <button onClick={() => { setMenu(false); setPicker(true); }} className="min-h-11 w-full rounded-xl border border-border text-sm font-semibold">{t("Cambiar icono")}</button>}
            <div className="space-y-1">
              {NAV.map(({ to, label, icon: Icon }) => (
                <button key={to} onClick={() => nav({ to })} className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-left font-semibold hover:bg-muted"><Icon className="h-5 w-5 text-primary" />{t(label)}</button>
              ))}
            </div>
            <Group label={t("Idioma")}>
              {([["auto", "Automático"], ["es", "Español"], ["en", "English"]] as [LangPref, string][]).map(([v, l]) => (
                <Opt key={v} on={getPref() === v} onClick={() => setLangPref(v)}>{l}</Opt>
              ))}
            </Group>
            <Group label={t("Tema")}>
              <Opt on={!dark} onClick={() => setTheme(false)}>{t("Claro")}</Opt>
              <Opt on={dark} onClick={() => setTheme(true)}>{t("Oscuro")}</Opt>
            </Group>
            <p className="text-xs text-muted-foreground">{t("Para instalar: en iPhone usa Compartir > Añadir a pantalla de inicio; en Android, menú del navegador > Instalar app.")}</p>
          </div>
        </SheetContent>
      </Sheet>

      {mounted && me && <AvatarPicker p={me} open={picker} onClose={() => setPicker(false)} />}
      {mounted && !me && <WhoAreYou />}
    </div>
  );
}

function Group({ label, children }: { label: string; children: ReactNode }) {
  return <div><div className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</div><div className="flex gap-2">{children}</div></div>;
}
function Opt({ on, onClick, children }: { on: boolean; onClick: () => void; children: ReactNode }) {
  return <button onClick={onClick} className={cn("min-h-11 flex-1 rounded-xl border px-2 text-sm font-bold", on ? "border-primary bg-primary/10" : "border-border text-muted-foreground")}>{children}</button>;
}

function WhoAreYou() {
  const db = useDB();
  const t = useT();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-6 backdrop-blur-md">
      <div className="paint-card w-full max-w-sm bg-popover p-6 text-center">
        <div className="mb-2 flex justify-end">
          <button onClick={() => setLangPref(getPref() === "en" ? "es" : "en")} className="min-h-11 rounded-full border border-border px-3 text-xs font-bold">ES | EN</button>
        </div>
        <h2 className="text-3xl font-semibold">{t("¿Quién eres?")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("Puedes cambiar tocando tu nombre arriba.")}</p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          {(["mateo", "allison"] as const).map((p) => (
            <button key={p} onClick={() => setMe(p)} className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-background/60 p-4 transition active:scale-95">
              <Avatar p={p} size={56} /><span className="font-bold">{db.settings[p].name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
