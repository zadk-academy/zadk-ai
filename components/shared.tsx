"use client";
import { useState } from "react";
import type { Dict, Lang } from "@/lib/i18n";
import { ALLERGEN_LABEL } from "@/lib/i18n";
import { ChefHat, Printer } from "./Icons";

export function useApi<T>(url: string) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run(body: unknown) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({ error: "unknown" }));
      if (!res.ok) setError(json.error ?? "unknown");
      else setData(json as T);
    } catch {
      setError("unknown");
    } finally {
      setLoading(false);
    }
  }
  return { data, loading, error, run, setData };
}

export function Pills({ options, value, onChange, multi }: {
  options: string[]; value: string | string[]; onChange: (v: any) => void; multi?: boolean;
}) {
  return (
    <div className="pills" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => {
        const on = multi ? (value as string[]).includes(o) : value === o;
        return (
          <button key={o} type="button" className={"pill" + (on ? " on" : "")} aria-pressed={on}
            onClick={() => multi
              ? onChange(on ? (value as string[]).filter((x) => x !== o) : [...(value as string[]), o])
              : onChange(o)}>
            {o}
          </button>
        );
      })}
    </div>
  );
}

export function ResultState({ t, loading, error, empty, children, hasData }: {
  t: Dict; loading: boolean; error: string | null; empty: string; hasData: boolean; children: React.ReactNode;
}) {
  if (loading)
    return <div className="loading" role="status"><div className="spinner" /><p>{t.loading}</p></div>;
  return (
    <>
      {error && <p className="err" role="alert">{t.errors[error] ?? t.errors.unknown}</p>}
      {hasData ? children : !error && (
        <div className="empty"><div className="ic"><ChefHat /></div><b>{empty}</b></div>
      )}
    </>
  );
}

export function PrintHead({ title }: { title: string }) {
  return (
    <div className="print-head">
      <img src="/zadk-logo.webp" alt="ZADK" />
      <b>{title}</b>
    </div>
  );
}

export function PrintBtn({ t }: { t: Dict }) {
  return <button className="btn primary" type="button" onClick={() => window.print()}><Printer />{t.print}</button>;
}

export function Allergens({ lang, t, list }: { lang: Lang; t: Dict; list: string[] }) {
  return (
    <div className="allergens">
      {list.length === 0
        ? <span className="al ok">{t.noAllergens}</span>
        : list.map((a) => <span key={a} className="al">{ALLERGEN_LABEL[lang][a] ?? a}</span>)}
    </div>
  );
}
