"use client";
import { useState } from "react";
import type { Dict, Lang } from "@/lib/i18n";
import { UNIT_LABEL, fmt } from "@/lib/i18n";
import type { ReviewResult } from "@/lib/schemas";
import { Arrow } from "./Icons";
import { useApi, Pills, ResultState, PrintHead, PrintBtn, Allergens } from "./shared";

type Up = { mediaType: string; data: string; name: string; url: string | null } | null;

const EXT_TYPES: Record<string, string> = {
  jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp",
  pdf: "application/pdf",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

export default function ToolReview({ t, lang }: { t: Dict; lang: Lang }) {
  const [recipe, setRecipe] = useState("");
  const [mode, setMode] = useState(t.t3PriceModes[0]);
  const [prices, setPrices] = useState("");
  const [img, setImg] = useState<Up>(null);
  const [imgErr, setImgErr] = useState(false);
  const api = useApi<ReviewResult>("/api/review");
  const d = api.data;
  const myPrices = mode === t.t3PriceModes[1];

  function onFile(f: File | undefined) {
    setImgErr(false);
    if (!f) return setImg(null);
    const type = EXT_TYPES[f.name.split(".").pop()?.toLowerCase() ?? ""];
    if (!type || f.size > 3 * 1024 * 1024) { setImgErr(true); return setImg(null); }
    const r = new FileReader();
    r.onload = () => {
      const url = String(r.result);
      setImg({ mediaType: type, data: url.split(",")[1], name: f.name, url: type.startsWith("image/") ? url : null });
    };
    r.readAsDataURL(f);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (recipe.trim().length < 10 && !img) return;
    api.run({ recipe, prices: myPrices ? prices : "", file: img ? { mediaType: img.mediaType, data: img.data, name: img.name } : null, lang });
  }

  return (
    <>
      <form className="card" onSubmit={submit}>
        <div className="step">{t.t3Step}</div>
        <h3>{t.t3Q}</h3>
        <p className="sub">{t.t3Sub}</p>
        <label className="f" htmlFor="rec">{t.t3Recipe}</label>
        <textarea id="rec" className="input" rows={9} maxLength={6000} value={recipe} onChange={(e) => setRecipe(e.target.value)} />
        <label className="filebtn" htmlFor="recimg">{t.t3Image}
          <input id="recimg" type="file" accept=".jpg,.jpeg,.png,.webp,.pdf,.docx,.xlsx" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
        {imgErr && <p className="err" style={{ marginTop: 6 }}>JPG / PNG / PDF / Word (.docx) / Excel (.xlsx) ≤ 3MB</p>}
        {img && (img.url ? <img className="thumb" src={img.url} alt="" /> : <p className="sub" style={{ marginTop: 6 }}>📄 {img.name}</p>)}
        <label className="f">{t.t3Prices}</label>
        <Pills options={t.t3PriceModes} value={mode} onChange={setMode} />
        {myPrices && (
          <textarea className="input" style={{ marginTop: 8 }} rows={3} maxLength={2000} placeholder={t.t3PricesPh}
            aria-label={t.t3Prices} value={prices} onChange={(e) => setPrices(e.target.value)} />
        )}
        <button className="btn primary" type="submit" disabled={api.loading}>{t.t3Go} <Arrow /></button>
        <button className="btn ghost" type="button" style={{ width: "100%", justifyContent: "center", marginTop: 8 }}
          onClick={() => setRecipe(t.t3Example)}>{t.example}</button>
      </form>

      <div className="card" aria-live="polite">
        <ResultState t={t} loading={api.loading} error={api.error} detail={api.detail} empty={t.t3Empty} hasData={!!d}>
          {d && (
            <>
              <PrintHead title={d.recipe_name} />
              <div className="result-top">
                <div><h3>{d.recipe_name} • {fmt(lang, d.servings)} {t.people}</h3><p className="sub">{d.verdict}</p></div>
                <div className="actions"><PrintBtn t={t} /></div>
              </div>
              <div className="stats">
                <div className="stat"><small>{t.totalTime}</small><b>{fmt(lang, d.time.total_min)} {t.min}</b><em>{d.time.note}</em></div>
                <div className="stat"><small>{t.cost}</small><b>{fmt(lang, d.cost.total_sar, 1)} {t.sar}</b><em>{fmt(lang, d.cost.per_portion_sar, 2)} {t.sar} {t.perPortion}</em></div>
                <div className="stat"><small>{t.calories}</small><b>{fmt(lang, d.kcal.per_portion)} kcal</b><em>{t.perPortion} ({fmt(lang, d.portion_g)} {UNIT_LABEL[lang].g})</em></div>
                <div className="stat"><small>{t.portion}</small><b>{fmt(lang, d.portion_g)} {UNIT_LABEL[lang].g}</b><em>{d.category}</em></div>
              </div>
              <p className="sub" style={{ marginTop: -8, marginBottom: 14 }}>{d.cost.basis}</p>
              <h4>{t.corrections}</h4>
              {d.corrections.length === 0 && <p className="sub">{t.noCorrections}</p>}
              {d.corrections.map((c, k) => (
                <div key={k} className={"fix " + (c.severity === "error" ? "bad" : "warn")}>
                  <span className="k">{c.severity === "error" ? t.error : t.warning}</span>
                  <span><s>{c.original}</s> {lang === "ar" ? "←" : "→"} <b>{c.fix}</b>. {c.reason}</span>
                </div>
              ))}
              <h4 style={{ marginTop: 16 }}>{t.allergens}</h4>
              <Allergens lang={lang} t={t} list={d.allergens_present} />
              <h4 style={{ marginTop: 16 }}>{t.correctedRecipe}</h4>
              <div className="two">
                <div className="tbl"><table>
                  <thead><tr><th>{t.ingredients}</th><th style={{ textAlign: "end" }}>{t.qty}</th></tr></thead>
                  <tbody>{d.corrected_ingredients.map((x, k) => (
                    <tr key={k}><td>{x.name}{x.note && <small style={{ color: "var(--muted)" }}> · {x.note}</small>}</td>
                      <td className="num">{fmt(lang, x.qty, 1)} {UNIT_LABEL[lang][x.unit]}</td></tr>
                  ))}</tbody>
                </table></div>
                <ol className="steps">{d.corrected_steps.map((s, k) => <li key={k}>{s}</li>)}</ol>
              </div>
              {d.chef_notes.length > 0 && (
                <div className="chef"><b>{t.chefNotes}:</b> {d.chef_notes.join(" ")}</div>
              )}
              <p className="disclaimer">{t.draft}</p>
            </>
          )}
        </ResultState>
      </div>
    </>
  );
}
