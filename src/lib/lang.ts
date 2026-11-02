import { useSyncExternalStore } from "react";

export type Lang = "es" | "en";
export type LangPref = "auto" | Lang;
const KEY = "duoplan_lang";
const ls = new Set<() => void>();

export function getPref(): LangPref {
  if (typeof localStorage === "undefined") return "auto";
  const v = localStorage.getItem(KEY);
  return v === "es" || v === "en" ? v : "auto";
}
export function getLang(): Lang {
  const p = getPref();
  if (p !== "auto") return p;
  if (typeof navigator === "undefined") return "es";
  return navigator.language?.toLowerCase().startsWith("en") ? "en" : "es";
}
export function setLangPref(p: LangPref) {
  if (p === "auto") localStorage.removeItem(KEY); else localStorage.setItem(KEY, p);
  document.documentElement.lang = getLang();
  ls.forEach((l) => l());
}
export function useLang(): Lang {
  return useSyncExternalStore((cb) => { ls.add(cb); return () => ls.delete(cb); }, getLang, () => "es" as Lang);
}
