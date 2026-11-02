import { Anchor, Bird, Cloud, Coffee, Compass, Fish, Flame, Flower2, Heart, Leaf, Moon, Mountain, MountainSnow, Plane, Rocket, Sailboat, Snowflake, Sparkles, Star, Sun, Trees, Umbrella, Waves } from "lucide-react";
import type { ComponentType } from "react";
import { toast } from "sonner";
import { type Profile, setDB, useDB } from "@/lib/store";
import { useT } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { BottomSheet } from "./ui";
import { useState } from "react";

type Ico = ComponentType<{ className?: string }>;
export const AVATAR_ICONS: Record<string, Ico> = { Mountain, MountainSnow, Waves, Flower2, Sun, Moon, Trees, Cloud, Flame, Heart, Star, Leaf, Bird, Snowflake, Sailboat, Anchor, Compass, Sparkles, Fish, Umbrella, Coffee, Rocket, Plane };
export const AVATAR_COLORS = ["#C87D65", "#7A9A8B", "#6B8EA8", "#9A8FB5", "#D9A441", "#E08FA8", "#5E7F6B", "#8B6F5A"];
const EMOJIS = ["🌱", "🌸", "🌊", "🏔️", "🌅", "🌙", "☀️", "🔥", "🦋", "🐚", "🍃", "⭐", "🌈", "🪴", "🦜", "🐬"];

export function Avatar({ p, size = 32, className }: { p: "mateo" | "allison"; size?: number; className?: string }) {
  const prof = useDB().settings[p];
  const a = prof.avatar ?? { kind: "emoji" as const, value: prof.emoji };
  const Icon = a.kind === "icon" ? AVATAR_ICONS[a.value] : undefined;
  return (
    <span className={cn("inline-flex shrink-0 items-center justify-center rounded-full text-white", className)}
      style={{ width: size, height: size, background: a.color ?? (p === "mateo" ? "#6B8EA8" : "#C87D65"), fontSize: size * 0.55 }}>
      {Icon ? <Icon className="h-[58%] w-[58%]" /> : <span className="leading-none">{a.value}</span>}
    </span>
  );
}

export function AvatarPicker({ p, open, onClose }: { p: "mateo" | "allison"; open: boolean; onClose: () => void }) {
  const t = useT();
  const prof = useDB().settings[p];
  const cur = prof.avatar ?? { kind: "emoji" as const, value: prof.emoji };
  const [tab, setTab] = useState<"icon" | "emoji">("icon");
  const save = (patch: Partial<NonNullable<Profile["avatar"]>>) =>
    setDB((d) => ({ ...d, settings: { ...d.settings, [p]: { ...d.settings[p], avatar: { ...cur, ...patch } } } }));
  return (
    <BottomSheet open={open} onClose={onClose} title={t("Elige tu icono")}>
      <div className="space-y-4">
        <div className="flex justify-center"><Avatar p={p} size={72} /></div>
        <div className="flex gap-2">
          {(["icon", "emoji"] as const).map((k) => (
            <button key={k} onClick={() => setTab(k)} className={cn("min-h-11 flex-1 rounded-xl border text-sm font-bold", tab === k ? "border-primary bg-primary/10" : "border-border text-muted-foreground")}>
              {k === "icon" ? t("Iconos") : "Emoji"}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-2">
          {tab === "icon" ? Object.entries(AVATAR_ICONS).map(([name, I]) => (
            <button key={name} aria-label={name} onClick={() => save({ kind: "icon", value: name })}
              className={cn("flex min-h-12 items-center justify-center rounded-xl border", cur.kind === "icon" && cur.value === name ? "border-primary bg-primary/10" : "border-border")}><I className="h-6 w-6" /></button>
          )) : EMOJIS.map((e) => (
            <button key={e} onClick={() => save({ kind: "emoji", value: e })}
              className={cn("min-h-12 rounded-xl border text-2xl", cur.kind === "emoji" && cur.value === e ? "border-primary bg-primary/10" : "border-border")}>{e}</button>
          ))}
        </div>
        <div className="flex flex-wrap justify-center gap-2.5">
          {AVATAR_COLORS.map((c) => (
            <button key={c} aria-label={c} onClick={() => save({ color: c })} style={{ background: c }}
              className={cn("h-10 w-10 rounded-full border-2", cur.color === c ? "border-foreground" : "border-transparent")} />
          ))}
        </div>
        <button onClick={() => { onClose(); toast.success(t("Icono actualizado")); }} className="min-h-11 w-full rounded-xl bg-primary px-4 py-3 font-bold text-primary-foreground">{t("Listo")}</button>
      </div>
    </BottomSheet>
  );
}
