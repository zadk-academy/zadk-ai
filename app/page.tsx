"use client";
import { useEffect, useState } from "react";
import { T, type Lang } from "@/lib/i18n";
import { Arrow, Book, ChefHat, Clock, Grad, Leaf, Shield, Sparkles, Utensils } from "@/components/Icons";
import ToolDish from "@/components/ToolDish";
import ToolEvent from "@/components/ToolEvent";
import ToolReview from "@/components/ToolReview";

const BENEFIT_ICONS = [Grad, Book, Clock, Shield];

export default function Home() {
  const [lang, setLang] = useState<Lang>("ar");
  const [tab, setTab] = useState(0);
  const t = T[lang];

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = t.dir;
  }, [lang, t.dir]);

  function onTabKey(e: React.KeyboardEvent, i: number) {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
    const forward = (e.key === "ArrowLeft") === (lang === "ar");
    const n = (i + (forward ? 1 : -1) + 3) % 3;
    setTab(n);
    document.getElementById(`t${n + 1}`)?.focus();
  }

  return (
    <>
      <header>
        <div className="wrap">
          <img className="logo" src="/zadk-logo.webp" alt="ZADK" />
          <div className="brandname"><b>{t.brand}</b><span>{t.brandSub}</span></div>
          <nav>
            <a href="#how">{t.navHow}</a>
            <a href="#tools">{t.navTools}</a>
            <a href="#principle">{t.navPrinciple}</a>
            <button className="lang" type="button" onClick={() => setLang(lang === "ar" ? "en" : "ar")}>{t.langSwitch}</button>
          </nav>
        </div>
      </header>

      <div className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">{t.eyebrow}</div>
            <h1>{t.h1a} <i>{t.h1b}</i></h1>
            <p className="lead">{t.lead}</p>
            <div className="chips">
              <span><Leaf />{t.tabs[0][0]}</span><span><Sparkles />{t.tabs[1][0]}</span><span><ChefHat />{t.tabs[2][0]}</span>
            </div>
            <div className="cta">
              <a className="btn primary" href="#tools">{t.tryTools} <Arrow /></a>
              <a className="btn ghost" href="#how">{t.howCta}</a>
            </div>
          </div>
          <div className="orb" aria-hidden="true">
            <div className="ring" /><div className="ring r2" />
            <div className="core"><div><Utensils /><small dir="ltr">YOUR INGREDIENTS.<br />YOUR NEXT IDEA.</small></div></div>
            <span className="dot" style={{ top: "6%", left: "58%" }} />
            <span className="dot" style={{ bottom: "12%", left: "22%", width: 6, height: 6 }} />
            <span className="tag">AI + YOU <Sparkles /></span>
            <span className="tag2">{t.orbTag}</span>
          </div>
        </div>
      </div>

      <section id="how">
        <div className="wrap">
          <div className="sec-head"><h2>{t.howTitle}</h2><p>{t.howSub}</p></div>
          <div className="benefits">
            {t.benefits.map(([title, text], k) => {
              const Ic = BENEFIT_ICONS[k];
              return <div key={title} className="benefit"><div className="ic"><Ic /></div><h3>{title}</h3><p>{text}</p></div>;
            })}
          </div>
        </div>
      </section>

      <section id="tools">
        <div className="wrap">
          <div className="sec-head"><h2>{t.toolsTitle}</h2><p>{t.toolsSub}</p></div>
          <div className="tabs" role="tablist" aria-label={t.toolsTitle}>
            {t.tabs.map(([title, sub], k) => (
              <button key={k} id={`t${k + 1}`} className="tab" role="tab" aria-selected={tab === k} aria-controls={`p${k + 1}`}
                tabIndex={tab === k ? 0 : -1} onClick={() => setTab(k)} onKeyDown={(e) => onTabKey(e, k)}>
                <span className="n">{new Intl.NumberFormat(lang === "ar" ? "ar-SA-u-nu-arab" : "en").format(k + 1)}</span>
                <span><b>{title}</b><small>{sub}</small></span>
              </button>
            ))}
          </div>
          {/* All three stay mounted so results survive switching tabs */}
          <div className="panel" role="tabpanel" id="p1" aria-labelledby="t1" hidden={tab !== 0}><ToolDish key={`d${lang}`} t={t} lang={lang} /></div>
          <div className="panel" role="tabpanel" id="p2" aria-labelledby="t2" hidden={tab !== 1}><ToolEvent key={`e${lang}`} t={t} lang={lang} /></div>
          <div className="panel" role="tabpanel" id="p3" aria-labelledby="t3" hidden={tab !== 2}><ToolReview key={`r${lang}`} t={t} lang={lang} /></div>
        </div>
      </section>

      <section id="principle">
        <div className="wrap">
          <div className="principle">
            <div><h2><ChefHat />{t.principleTitle}</h2><p>{t.principleText}</p></div>
            <div className="flow">
              {t.flow.map((f, k) => (
                <span key={f} style={{ display: "contents" }}>{k > 0 && <i>{lang === "ar" ? "←" : "→"}</i>}<span>{f}</span></span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <span><b className="en" style={{ color: "var(--deep)" }}>ZADK</b> • {t.footerA}</span>
          <span>{t.footerB}</span>
        </div>
      </footer>
    </>
  );
}
