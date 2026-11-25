"use client";
import { useState } from "react";
import type { Dict, Lang } from "@/lib/i18n";
import { UNIT_LABEL, DIFF_LABEL, fmt, toNumber } from "@/lib/i18n";
import type { DishResult } from "@/lib/schemas";
import { Arrow, Leaf } from "./Icons";
import { useApi, Pills, ResultState, PrintHead, PrintBtn, Allergens } from "./shared";

export default function ToolDish({ t, lang }: { t: Dict; lang: Lang }) {
  const [ing, setIng] = useState("");
  const [pax, setPax] = useState("4");
  const [time, setTime] = useState(t.times[1]);
  const [cuisine, setCuisine] = useState(t.cuisines[3]);
  const api = useApi<DishResult>("/api/dish");
  const d = api.data;

  const body = (choice?: string) => ({
    ingredients: ing, pax: Math.min(50, Math.max(1, toNumber(pax) || 4)), time, cuisine, choice, lang,
  });

  return (
    <>
      <form className="card" onSubmit={(e) => { e.preventDefault(); if (ing.trim().length >= 3) api.run(body()); }}>
        <div className="step">{t.t1Step}</div>
        <h3>{t.t1Q}</h3>
        <p className="sub">{t.t1Sub}</p>
        <label className="f" htmlFor="ing">{t.t1Ing}</label>
        <textarea id="ing" className="input" rows={4} maxLength={2000} value={ing} placeholder={t.t1Placeholder}
          onChange={(e) => setIng(e.target.value)} required />
        <div className="count">{fmt(lang, ing.length)} / {fmt(lang, 2000)}</div>
        <div className="row">
          <div><label className="f" htmlFor="pax1">{t.pax}</label>
            <input id="pax1" className="input" inputMode="numeric" value={pax} onChange={(e) => setPax(e.target.value)} /></div>
          <div><label className="f">{t.time}</label><Pills options={t.times} value={time} onChange={setTime} /></div>
        </div>
        <label className="f">{t.cuisine}</label>
        <Pills options={t.cuisines} value={cuisine} onChange={setCuisine} />
        <button className="btn primary" type="submit" disabled={api.loading}>{t.t1Go} <Arrow /></button>
        <button className="btn ghost" type="button" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          onClick={() => setIng(t.t1Example)}>{t.example}</button>
        <p className="privacy"><Leaf />{t.privacy}</p>
      </form>

      <div className="card" aria-live="polite">
        <ResultState t={t} loading={api.loading} error={api.error} empty={t.t1Empty} hasData={!!d}>
          {d && (
            <>
              <PrintHead title={d.recipe.name} />
              <div className="result-top">
                <div><h3>{d.recipe.name}</h3><p className="sub">{d.recipe.description}</p></div>
                <div className="actions"><PrintBtn t={t} /></div>
              </div>
              <p className="sub" style={{ marginBottom: 8 }}>{t.t1Pick}</p>
              <div className="ideas">
                {d.ideas.map((idea) => (
                  <button key={idea.name} type="button" className={"idea" + (idea.name === d.recipe.name ? " on" : "")}
                    onClick={() => idea.name !== d.recipe.name && api.run(body(idea.name))}>
                    <b>{idea.name}</b>
                    <span>{fmt(lang, idea.total_min)} {t.min} • {DIFF_LABEL[lang][idea.difficulty]}</span>
                    <small>{idea.description}</small>
                  </button>
                ))}
              </div>
              <div className="meta">
                <span>{fmt(lang, d.recipe.servings)} {t.people}</span>
                <span>{t.prep} {fmt(lang, d.recipe.prep_min)} {t.min}</span>
                <span>{t.cook} {fmt(lang, d.recipe.cook_min)} {t.min}</span>
                <span>≈ {fmt(lang, d.recipe.kcal_per_portion)} {t.kcalPortion}</span>
                <span>{DIFF_LABEL[lang][d.recipe.difficulty]}</span>
              </div>
              <div className="two">
                <div>
                  <h4>{t.ingredients}</h4>
                  <div className="tbl"><table>
                    <thead><tr><th>{t.ingredients}</th><th style={{ textAlign: "end" }}>{t.qty}</th></tr></thead>
                    <tbody>{d.recipe.ingredients.map((x, k) => (
                      <tr key={k}><td>{x.name}{x.note && <small style={{ color: "var(--muted)" }}> · {x.note}</small>}</td>
                        <td className="num">{fmt(lang, x.qty, 1)} {UNIT_LABEL[lang][x.unit]}</td></tr>
                    ))}</tbody>
                  </table></div>
                  {d.recipe.extra_items.length > 0 && <p className="sub" style={{ marginTop: 8 }}>{t.extras} {d.recipe.extra_items.join("، ")}</p>}
                </div>
                <div>
                  <h4>{t.method}</h4>
                  <ol className="steps">{d.recipe.steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
                  <div className="chef"><b>{t.chefTip}</b> {d.recipe.chef_tip}</div>
                </div>
              </div>
              <h4 style={{ marginTop: 16 }}>{t.allergens}</h4>
              <Allergens lang={lang} t={t} list={d.recipe.allergens} />
              <p className="disclaimer">{t.footerB}</p>
            </>
          )}
        </ResultState>
      </div>
    </>
  );
}
