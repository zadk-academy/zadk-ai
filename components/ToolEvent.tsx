"use client";
import { useState } from "react";
import type { Dict, Lang } from "@/lib/i18n";
import { UNIT_LABEL, fmt, toNumber } from "@/lib/i18n";
import type { EventResult } from "@/lib/schemas";
import { Arrow } from "./Icons";
import { useApi, Pills, ResultState, PrintHead, PrintBtn, Allergens } from "./shared";

export default function ToolEvent({ t, lang }: { t: Dict; lang: Lang }) {
  const [guests, setGuests] = useState("40");
  const [cooks, setCooks] = useState("3");
  const [occasion, setOccasion] = useState(t.occasions[0]);
  const [needs, setNeeds] = useState<string[]>([]);
  const [service, setService] = useState(t.serviceExample);
  const [prep, setPrep] = useState(t.prepOptions[0]);
  const [extra, setExtra] = useState("");
  const api = useApi<EventResult>("/api/event");
  const d = api.data;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    api.run({
      guests: Math.min(1000, Math.max(2, toNumber(guests) || 10)),
      cooks: Math.min(50, Math.max(1, toNumber(cooks) || 1)),
      occasion, notes: needs, extra, serviceTime: service, prepAhead: prep, lang,
    });
  }

  return (
    <>
      <form className="card" onSubmit={submit}>
        <div className="step">{t.t2Step}</div>
        <h3>{t.t2Q}</h3>
        <p className="sub">{t.t2Sub}</p>
        <div className="row">
          <div><label className="f" htmlFor="g">{t.guests}</label>
            <input id="g" className="input" inputMode="numeric" value={guests} onChange={(e) => setGuests(e.target.value)} /></div>
          <div><label className="f" htmlFor="cooks">{t.cooks}</label>
            <input id="cooks" className="input" inputMode="numeric" value={cooks} onChange={(e) => setCooks(e.target.value)} /></div>
        </div>
        <label className="f">{t.occasion}</label>
        <Pills options={t.occasions} value={occasion} onChange={setOccasion} />
        <label className="f">{t.needs}</label>
        <Pills options={t.needsList} value={needs} onChange={setNeeds} multi />
        <div className="row">
          <div><label className="f" htmlFor="svc">{t.serviceTime}</label>
            <input id="svc" className="input" value={service} maxLength={60} onChange={(e) => setService(e.target.value)} /></div>
          <div><label className="f">{t.prepAhead}</label><Pills options={t.prepOptions} value={prep} onChange={setPrep} /></div>
        </div>
        <label className="f" htmlFor="extra">{t.extra}</label>
        <textarea id="extra" className="input" rows={2} maxLength={600} value={extra} onChange={(e) => setExtra(e.target.value)} />
        <button className="btn primary" type="submit" disabled={api.loading}>{t.t2Go} <Arrow /></button>
      </form>

      <div className="card" aria-live="polite">
        <ResultState t={t} loading={api.loading} error={api.error} empty={t.t2Empty} hasData={!!d}>
          {d && (
            <>
              <PrintHead title={d.title} />
              <div className="result-top">
                <div><h3>{d.title}</h3><p className="sub">{d.summary}</p></div>
                <div className="actions"><PrintBtn t={t} /></div>
              </div>
              <h4>{t.menu}</h4>
              <div className="menu">
                {d.menu.map((c) => (
                  <div key={c.course} className="course"><small>{c.course}</small><p>{c.dishes.join("، ")}</p></div>
                ))}
              </div>
              <div className="two">
                <div>
                  <h4>{t.quantities}</h4>
                  <div className="tbl"><table>
                    <thead><tr><th>{t.item}</th><th style={{ textAlign: "end" }}>{t.perPerson}</th><th style={{ textAlign: "end" }}>{t.total}</th></tr></thead>
                    <tbody>{d.quantities.map((q, k) => (
                      <tr key={k}>
                        <td>{q.item}{q.note && <small style={{ display: "block", color: "var(--muted)" }}>{q.note}</small>}</td>
                        <td className="num">{fmt(lang, q.per_person, 1)} {UNIT_LABEL[lang][q.per_person_unit]}</td>
                        <td className="num">{fmt(lang, q.total, 1)} {UNIT_LABEL[lang][q.total_unit]}</td>
                      </tr>
                    ))}</tbody>
                  </table></div>
                </div>
                <div>
                  <h4>{t.plan}</h4>
                  <ul className="timeline">
                    {d.plan.map((p, k) => (
                      <li key={k}><span className="t">{p.when}</span><span>{p.task}<span className="who">{p.who}</span></span></li>
                    ))}
                  </ul>
                </div>
              </div>
              <h4 style={{ marginTop: 16 }}>{t.safety}</h4>
              <ul className="steps" style={{ fontSize: 13.5 }}>{d.food_safety.map((s, k) => <li key={k}>{s}</li>)}</ul>
              <h4 style={{ marginTop: 12 }}>{t.allergens}</h4>
              <Allergens lang={lang} t={t} list={d.allergens} />
              <p className="disclaimer">{t.footerB}</p>
            </>
          )}
        </ResultState>
      </div>
    </>
  );
}
