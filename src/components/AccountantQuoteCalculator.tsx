"use client";

import { useState, useEffect } from "react";

const BRAND = {
  purple: "#401D6C", pink: "#EC385D", peach: "#FF8073",
  white: "#FFFFFF", offWhite: "#F8F4FF", grey100: "#F3F0F7",
  grey200: "#E5E0EC", grey300: "#B8B0C4", grey600: "#6B5F7B",
  grey800: "#3A3145", green: "#10B981", greenLight: "#D1FAE5",
  amber: "#F59E0B", amberLight: "#FEF3C7",
};

const PACKAGES = {
  essential: {
    name: "Essential", subtitle: "Directors Only",
    frequencies: ["monthly", "annually"] as const,
    pricing: { monthly: { base: 12.5, perSlip: 2 }, annually: { base: 90, perSlip: 6 } },
    discountPercent: 5, color: BRAND.grey600,
  },
  allinone: {
    name: "All in One", subtitle: "Standard \u2014 Most Popular",
    frequencies: ["weekly", "twoweekly", "monthly", "fourweekly"] as const,
    pricing: {
      weekly: { base: 12.5, perSlip: 2 }, twoweekly: { base: 25, perSlip: 2.5 },
      monthly: { base: 40, perSlip: 3 }, fourweekly: { base: 40, perSlip: 3 },
    },
    discountTiers: [
      { min: 1, max: 9, percent: 6 }, { min: 10, max: 29, percent: 8 },
      { min: 30, max: 49, percent: 10 }, { min: 50, max: 99, percent: 12 },
      { min: 100, max: 99999, percent: 15 },
    ],
    color: BRAND.pink,
  },
  premium: {
    name: "Premium", subtitle: "Priority Support & Advanced Features",
    frequencies: ["weekly", "twoweekly", "monthly", "fourweekly"] as const,
    pricing: {
      weekly: { base: 25, perSlip: 3 }, twoweekly: { base: 40, perSlip: 3.5 },
      monthly: { base: 75, perSlip: 5 }, fourweekly: { base: 75, perSlip: 5 },
    },
    discountTiers: [
      { min: 1, max: 9, percent: 8 }, { min: 10, max: 29, percent: 10 },
      { min: 30, max: 49, percent: 12 }, { min: 50, max: 99, percent: 15 },
      { min: 100, max: 99999, percent: 20 },
    ],
    color: BRAND.purple,
  },
};

const FL: Record<string, string> = { weekly: "Weekly", twoweekly: "Two Weekly", monthly: "Monthly", fourweekly: "Four Weekly", annually: "Annually" };
const FR: Record<string, number> = { weekly: 52, twoweekly: 26, monthly: 12, fourweekly: 13, annually: 1 };

const STANDARD_PROVIDERS = ["Penfold", "NEST", "The People's Pension", "SMART", "Other Pension Scheme"];
const SS_PROVIDERS = ["Penfold (Salary Sacrifice)", "NEST (Salary Sacrifice)", "The People's Pension (Salary Sacrifice)", "SMART (Salary Sacrifice)", "Other Salary Sacrifice Scheme"];
const NO_SETUP_PROVIDERS = ["Penfold", "NEST", "The People's Pension", "SMART", "Other Pension Scheme", "Not currently required"];

const isOther = (p: string) => p === "Other Pension Scheme" || p === "Other Salary Sacrifice Scheme";

const OTHER_SURCHARGE: Record<string, number> = { weekly: 5, twoweekly: 7.5, monthly: 10, fourweekly: 10 };
const SS_SURCHARGE: Record<string, number> = { weekly: 5, twoweekly: 7.5, monthly: 15, fourweekly: 15 };
const PAY_SURCHARGE: Record<string, number> = { weekly: 1.0, twoweekly: 1.25, monthly: 1.5, fourweekly: 1.5 };
const BIK_RATES: Record<string, number> = { weekly: 1.5, twoweekly: 2.75, monthly: 6, fourweekly: 6 };
const CIS_PRICING: Record<string, { base: number; perSub: number }> = { weekly: { base: 12, perSub: 3 }, monthly: { base: 40, perSub: 4 } };

const fmt = (n: number) => (n === 0 ? "\u00A30.00" : "\u00A3" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
const fmtInt = (n: number) => (n === 0 ? "\u00A30" : "\u00A3" + Math.round(n).toLocaleString());

/* ---- Primitives ---- */

function RC({ selected, onClick, label, subtitle, tag, color }: { selected: boolean; onClick: () => void; label: string; subtitle?: string; tag?: string; color?: string }) {
  return (
    <button onClick={onClick} style={{
      display: "flex", flexDirection: "column", alignItems: "flex-start",
      padding: "16px 20px", border: `2px solid ${selected ? color || BRAND.purple : BRAND.grey200}`,
      borderRadius: 12, background: selected ? `${color || BRAND.purple}08` : BRAND.white,
      cursor: "pointer", transition: "all 0.2s", width: "100%", textAlign: "left",
      position: "relative", overflow: "hidden",
    }}>
      {tag && <span style={{ position: "absolute", top: 0, right: 0, background: BRAND.pink, color: BRAND.white, fontSize: 10, fontWeight: 700, padding: "3px 10px", borderRadius: "0 10px 0 8px", letterSpacing: "0.5px", textTransform: "uppercase" }}>{tag}</span>}
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 20, height: 20, borderRadius: "50%", border: `2px solid ${selected ? color || BRAND.purple : BRAND.grey300}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          {selected && <div style={{ width: 10, height: 10, borderRadius: "50%", background: color || BRAND.purple }} />}
        </div>
        <span style={{ fontWeight: 600, fontSize: 15, color: BRAND.grey800 }}>{label}</span>
      </div>
      {subtitle && <span style={{ fontSize: 13, color: BRAND.grey600, marginTop: 4, marginLeft: 30 }}>{subtitle}</span>}
    </button>
  );
}

function NI({ value, onChange, label, min = 0, max = 9999, suffix }: { value: number; onChange: (v: number) => void; label?: string; min?: number; max?: number; suffix?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 14, fontWeight: 500, color: BRAND.grey800 }}>{label}</label>}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="number" min={min} max={max} value={value}
          onChange={(e) => { const v = parseInt(e.target.value) || 0; onChange(Math.max(min, Math.min(max, v))); }}
          style={{ width: 100, padding: "10px 14px", border: `2px solid ${BRAND.grey200}`, borderRadius: 10, fontSize: 16, fontWeight: 600, color: BRAND.grey800, fontFamily: "'DM Sans', sans-serif", outline: "none" }}
          onFocus={(e) => (e.target.style.borderColor = BRAND.purple)}
          onBlur={(e) => (e.target.style.borderColor = BRAND.grey200)}
        />
        {suffix && <span style={{ fontSize: 14, color: BRAND.grey600 }}>{suffix}</span>}
      </div>
    </div>
  );
}

function Tog({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button onClick={() => onChange(!checked)} style={{ display: "flex", alignItems: "center", gap: 12, background: "none", border: "none", cursor: "pointer", padding: "8px 0", width: "100%", textAlign: "left" }}>
      <div style={{ width: 44, height: 24, borderRadius: 12, background: checked ? BRAND.purple : BRAND.grey200, position: "relative", transition: "all 0.2s", flexShrink: 0 }}>
        <div style={{ width: 18, height: 18, borderRadius: "50%", background: BRAND.white, position: "absolute", top: 3, left: checked ? 23 : 3, transition: "all 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.15)" }} />
      </div>
      <div style={{ fontSize: 14, fontWeight: 500, color: BRAND.grey800 }}>{label}</div>
    </button>
  );
}

function Sel({ value, onChange, options, label, placeholder }: { value: string; onChange: (v: string) => void; options: string[]; label?: string; placeholder?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {label && <label style={{ fontSize: 14, fontWeight: 500, color: BRAND.grey800 }}>{label}</label>}
      <select value={value} onChange={(e) => onChange(e.target.value)} style={{
        padding: "10px 14px", border: `2px solid ${BRAND.grey200}`, borderRadius: 10, fontSize: 14,
        color: value ? BRAND.grey800 : BRAND.grey300, fontFamily: "'DM Sans', sans-serif", outline: "none",
        background: BRAND.white, cursor: "pointer", appearance: "none",
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='12' height='8' viewBox='0 0 12 8' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1.5L6 6.5L11 1.5' stroke='%236B5F7B' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
        backgroundRepeat: "no-repeat", backgroundPosition: "right 14px center", paddingRight: 36,
      }}>
        {placeholder && <option value="" disabled>{placeholder}</option>}
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function Sec({ title, children, number }: { title: string; children: React.ReactNode; number?: number }) {
  return (
    <div style={{ background: BRAND.white, borderRadius: 16, padding: "24px 28px", boxShadow: "0 1px 4px rgba(64,29,108,0.06)", border: `1px solid ${BRAND.grey200}` }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 20 }}>
        {number && <div style={{ width: 28, height: 28, borderRadius: "50%", background: BRAND.purple, color: BRAND.white, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, flexShrink: 0 }}>{number}</div>}
        <h3 style={{ fontSize: 17, fontWeight: 700, color: BRAND.purple, margin: 0 }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function IB({ children, type = "neutral" }: { children: React.ReactNode; type?: "neutral" | "success" | "warn" | "peach" }) {
  const s = { neutral: { bg: BRAND.grey100, color: BRAND.grey600 }, success: { bg: BRAND.greenLight, color: BRAND.green }, warn: { bg: BRAND.amberLight, color: BRAND.amber }, peach: { bg: `${BRAND.peach}15`, color: BRAND.grey800 } }[type] || { bg: BRAND.grey100, color: BRAND.grey600 };
  return <div style={{ marginTop: 10, padding: "10px 14px", background: s.bg, borderRadius: 8, fontSize: 13, color: s.color, lineHeight: 1.6 }}>{children}</div>;
}

function Div() { return <div style={{ height: 1, background: BRAND.grey200, margin: "12px 0" }} />; }
function Q({ children }: { children: React.ReactNode }) { return <div style={{ fontSize: 14, fontWeight: 600, color: BRAND.grey800, marginBottom: 8 }}>{children}</div>; }

function QL({ label, amount, sub, bold, color, indent }: { label: string; amount: string; sub?: string; bold?: boolean; color?: string; indent?: boolean }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", padding: "6px 0", paddingLeft: indent ? 16 : 0 }}>
      <div>
        <span style={{ fontSize: bold ? 15 : 14, fontWeight: bold ? 700 : 400, color: color || BRAND.grey800 }}>{label}</span>
        {sub && <span style={{ fontSize: 12, color: BRAND.grey600, marginLeft: 6 }}>{sub}</span>}
      </div>
      <span style={{ fontSize: bold ? 16 : 14, fontWeight: bold ? 700 : 500, color: color || BRAND.grey800, whiteSpace: "nowrap" }}>{amount}</span>
    </div>
  );
}

/* ---- Main ---- */

export default function AccountantQuoteCalculator() {
  const [isNewPAYE, setIsNewPAYE] = useState<boolean | null>(null);
  const [pkg, setPkg] = useState("");
  const [frequency, setFrequency] = useState("");
  const [employees, setEmployees] = useState(1);

  const [needsPensionSetup, setNeedsPensionSetup] = useState<boolean | null>(null);
  const [isSS, setIsSS] = useState<boolean | null>(null);
  const [pensionProvider, setPensionProvider] = useState("");
  const [hasExistingSS, setHasExistingSS] = useState<boolean | null>(null);

  const [needsCIS, setNeedsCIS] = useState(false);
  const [cisFreq, setCisFreq] = useState("");
  const [numSubs, setNumSubs] = useState(1);
  const [cisSuffOnly, setCisSuffOnly] = useState(false);

  const [needsBIK, setNeedsBIK] = useState(false);
  const [bikEmp, setBikEmp] = useState(1);
  const [needsPay, setNeedsPay] = useState<boolean | null>(null);

  const isEss = pkg === "essential";
  const isAnn = frequency === "annually";
  const showPen = pkg && !isEss;
  const showBIK = pkg && !(isEss && isAnn);
  const showCIS = pkg && !isEss;
  const showPay = pkg && !isEss;

  useEffect(() => {
    setFrequency(""); setNeedsPensionSetup(null); setIsSS(null);
    setPensionProvider(""); setHasExistingSS(null);
    setNeedsCIS(false); setNeedsBIK(false); setNeedsPay(null);
  }, [pkg]);

  useEffect(() => { setPensionProvider(""); setHasExistingSS(null); }, [needsPensionSetup, isSS]);
  useEffect(() => { if (!needsCIS) { setCisFreq(""); setNumSubs(1); setCisSuffOnly(false); } }, [needsCIS]);
  useEffect(() => { if (!needsBIK) setBikEmp(1); }, [needsBIK]);

  const pd = pkg ? PACKAGES[pkg as keyof typeof PACKAGES] : null;
  const fl = frequency ? FL[frequency] : "";
  const fr = frequency ? FR[frequency] : 0;

  const disc = (() => {
    if (!pd) return 0;
    if (pkg === "essential") return (pd as typeof PACKAGES.essential).discountPercent;
    const tiers = (pd as typeof PACKAGES.allinone).discountTiers;
    const t = tiers?.find((t) => employees >= t.min && employees <= t.max);
    return t ? t.percent : 0;
  })();

  const core = (() => {
    if (!pd || !frequency) return null;
    const p = (pd.pricing as Record<string, { base: number; perSlip: number }>)[frequency];
    if (!p) return null;
    const std = p.base + p.perSlip * employees;
    return { std, disc: std * (1 - disc / 100) };
  })();

  const otherSur = (showPen && pensionProvider && isOther(pensionProvider)) ? (OTHER_SURCHARGE[frequency] || 0) : 0;
  const ssSur = (showPen && hasExistingSS === true) ? (SS_SURCHARGE[frequency] || 0) : 0;
  const bikSur = (showBIK && needsBIK && bikEmp > 0) ? (BIK_RATES[frequency] || 0) * bikEmp : 0;
  const paySur = (showPay && needsPay === true && pkg === "allinone") ? (PAY_SURCHARGE[frequency] || 0) * employees : 0;

  const cis = (() => {
    if (!needsCIS || !showCIS) return null;
    if (cisSuffOnly) return { our: 10, client: 15, isM: true } as const;
    if (!cisFreq) return null;
    const p = CIS_PRICING[cisFreq];
    const pr = p.base + p.perSub * numSubs;
    return { pr, ann: pr * FR[cisFreq], fl: FL[cisFreq] } as const;
  })();

  const oneOff: { label: string; our: number; client: number }[] = [];
  if (isNewPAYE === true) oneOff.push({ label: "PAYE Scheme Setup", our: 49, client: 75 });
  if (showPen && needsPensionSetup === true && pensionProvider) {
    if (isSS === true) {
      oneOff.push({ label: "Salary Sacrifice Pension Setup", our: 199, client: 299 });
    } else if (isSS === false) {
      oneOff.push({ label: "Pension Scheme Setup", our: 99, client: 199 });
    }
  }
  if (showPay && needsPay === true) oneOff.push({ label: "Payments Setup", our: 249, client: 349 });

  const totals = (() => {
    if (!core) return null;
    let cPR = core.std + otherSur + ssSur + bikSur + paySur;
    let oPR = core.disc + otherSur + ssSur + bikSur + paySur;
    let cA = cPR * fr, oA = oPR * fr;
    if (cis) {
      if ("isM" in cis) { cA += cis.client * 12; oA += cis.our * 12; }
      else if ("ann" in cis) { cA += cis.ann; oA += cis.ann; }
    }
    let ooP = 0;
    oneOff.forEach((f) => { ooP += f.client - f.our; });
    return { cPR, oPR, cA, oA, annP: cA - oA, ooP };
  })();

  const showSum = pkg && frequency && employees > 0 && core;
  let sc = 0;
  const step = () => ++sc;

  return (
    <div style={{ minHeight: "100vh", background: `linear-gradient(170deg, ${BRAND.offWhite} 0%, #EDE8F4 50%, ${BRAND.offWhite} 100%)`, fontFamily: "'DM Sans', sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <div style={{ background: BRAND.purple, padding: "32px 24px 28px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -40, right: -40, width: 200, height: 200, borderRadius: "50%", background: `radial-gradient(circle, ${BRAND.pink}20, transparent)` }} />
        <div style={{ position: "absolute", bottom: -30, left: -20, width: 150, height: 150, borderRadius: "50%", background: `radial-gradient(circle, ${BRAND.peach}15, transparent)` }} />
        <div style={{ maxWidth: 640, margin: "0 auto", position: "relative" }}>
          <div style={{ fontSize: 13, fontWeight: 600, color: BRAND.peach, letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: 8 }}>Partner Tools</div>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: BRAND.white, margin: 0, lineHeight: 1.2 }}>Instant Client Quote</h1>
          <p style={{ fontSize: 14, color: `${BRAND.white}BB`, margin: "8px 0 0", lineHeight: 1.5 }}>Get a breakdown of client pricing, your partner rate, and annual profit.</p>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: "0 auto", padding: "24px 16px 80px", display: "flex", flexDirection: "column", gap: 16 }}>

        {/* 1 - PAYE */}
        <Sec title="PAYE Scheme" number={step()}>
          <Q>Is this a new PAYE scheme?</Q>
          <div style={{ display: "flex", gap: 8 }}>
            <RC selected={isNewPAYE === true} onClick={() => setIsNewPAYE(true)} label="Yes \u2014 New scheme" color={BRAND.purple} />
            <RC selected={isNewPAYE === false} onClick={() => setIsNewPAYE(false)} label="No \u2014 Existing / Transfer" color={BRAND.purple} />
          </div>
          {isNewPAYE === true && <IB><strong>Setup fee:</strong> {"\u00A3"}49 + VAT (recommend charging client {"\u00A3"}75 + VAT)</IB>}
          {isNewPAYE === false && <IB type="success"><strong>Free</strong> for our accountant partners {"\u2014"} existing transfers at no cost.</IB>}
        </Sec>

        {/* 2 - Package */}
        {isNewPAYE !== null && (
          <Sec title="Select Package" number={step()}>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <RC selected={pkg === "essential"} onClick={() => setPkg("essential")} label="Essential" subtitle="Directors only \u2014 Monthly or Annual" color={PACKAGES.essential.color} />
              <RC selected={pkg === "allinone"} onClick={() => setPkg("allinone")} label="All in One" subtitle="Standard payroll \u2014 Most popular" color={PACKAGES.allinone.color} tag="Most Popular" />
              <RC selected={pkg === "premium"} onClick={() => setPkg("premium")} label="Premium" subtitle="Priority support & advanced features" color={PACKAGES.premium.color} />
            </div>
            {isEss && <IB type="warn"><strong>Please note:</strong> Pension administration is not included in the Essential package. If the director requires a pension scheme, please select the All in One package.</IB>}
          </Sec>
        )}

        {/* 3 - Frequency */}
        {isNewPAYE !== null && pkg && (
          <Sec title="Pay Frequency" number={step()}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
              {pd!.frequencies.map((f) => <RC key={f} selected={frequency === f} onClick={() => setFrequency(f)} label={FL[f]} color={BRAND.purple} />)}
            </div>
          </Sec>
        )}

        {/* 4 - Employees */}
        {isNewPAYE !== null && pkg && frequency && (
          <Sec title={isEss ? "Number of Directors" : "Number of Employees"} number={step()}>
            <NI value={employees} onChange={setEmployees} min={1} suffix={isEss ? "directors" : "employees"} />
            {!isEss && disc > 0 && (
              <div style={{ marginTop: 12, padding: "8px 12px", background: `${BRAND.green}10`, borderRadius: 8, display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 14 }}>{"\u2713"}</span>
                <span style={{ fontSize: 13, color: BRAND.green, fontWeight: 600 }}>{disc}% partner discount applied</span>
              </div>
            )}
          </Sec>
        )}

        {/* 5 - Pension (NOT Essential) */}
        {showPen && isNewPAYE !== null && frequency && employees > 0 && (
          <Sec title="Pension" number={step()}>

            <Q>Will they require a pension scheme setup?</Q>
            <div style={{ display: "flex", gap: 8 }}>
              <RC selected={needsPensionSetup === true} onClick={() => { setNeedsPensionSetup(true); setIsSS(null); setPensionProvider(""); setHasExistingSS(null); }} label="Yes" color={BRAND.purple} />
              <RC selected={needsPensionSetup === false} onClick={() => { setNeedsPensionSetup(false); setIsSS(null); setPensionProvider(""); setHasExistingSS(null); }} label="No" color={BRAND.purple} />
            </div>

            {/* YES setup -> Ask if salary sacrifice */}
            {needsPensionSetup === true && (
              <div style={{ marginTop: 16 }}>
                <Q>Will it be a salary sacrifice pension scheme?</Q>
                <div style={{ display: "flex", gap: 8 }}>
                  <RC selected={isSS === true} onClick={() => setIsSS(true)} label="Yes \u2014 Salary Sacrifice" color={BRAND.purple} />
                  <RC selected={isSS === false} onClick={() => setIsSS(false)} label="No \u2014 Standard Pension" color={BRAND.purple} />
                </div>

                {isSS !== null && (
                  <div style={{ marginTop: 12 }}>
                    <Sel value={pensionProvider} onChange={setPensionProvider}
                      options={isSS ? SS_PROVIDERS : STANDARD_PROVIDERS}
                      label="Select pension provider" placeholder="Choose a provider..." />

                    {pensionProvider && !isOther(pensionProvider) && (
                      <IB>
                        <strong>Setup fee:</strong> {isSS ? "\u00A3199" : "\u00A399"} + VAT (recommend charging client {isSS ? "\u00A3299" : "\u00A3199"} + VAT)
                        {isSS && <><br /><span style={{ color: BRAND.grey600, fontSize: 12 }}>We recommend Penfold or NEST for salary sacrifice, but we can work with any provider.</span></>}
                      </IB>
                    )}

                    {pensionProvider && isOther(pensionProvider) && (
                      <IB type="peach">
                        <strong>Setup fee:</strong> {isSS ? "\u00A3199" : "\u00A399"} + VAT (recommend charging client {isSS ? "\u00A3299" : "\u00A3199"} + VAT)
                        <br /><strong>Additional charge:</strong> {fmt(OTHER_SURCHARGE[frequency])} per {fl.toLowerCase()} pay run for non-standard pension provider.
                        <br /><span style={{ color: BRAND.grey600, fontSize: 12 }}>Penfold, NEST, The People's Pension, and SMART are included at no extra cost.</span>
                      </IB>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* NO setup -> Show provider dropdown with "Not currently required" */}
            {needsPensionSetup === false && (
              <div style={{ marginTop: 12 }}>
                <Sel value={pensionProvider} onChange={setPensionProvider}
                  options={NO_SETUP_PROVIDERS}
                  label="Select pension provider" placeholder="Choose a provider..." />

                {pensionProvider === "Not currently required" && (
                  <IB type="success">When required, we will automatically set up a pension scheme to keep them compliant.</IB>
                )}

                {pensionProvider && isOther(pensionProvider) && (
                  <IB type="peach">
                    <strong>Additional charge:</strong> {fmt(OTHER_SURCHARGE[frequency])} per {fl.toLowerCase()} pay run for non-standard pension provider.
                    <br /><span style={{ color: BRAND.grey600, fontSize: 12 }}>Penfold, NEST, The People's Pension, and SMART are included at no extra cost.</span>
                  </IB>
                )}
              </div>
            )}

            {/* Existing salary sacrifice? (only if provider selected and not "not required") */}
            {needsPensionSetup !== null && pensionProvider && pensionProvider !== "Not currently required" && (
              <>
                <Div />
                <Q>Does the client have existing salary sacrifice pensions?</Q>
                <div style={{ display: "flex", gap: 8 }}>
                  <RC selected={hasExistingSS === true} onClick={() => setHasExistingSS(true)} label="Yes \u2014 Already in place" color={BRAND.purple} />
                  <RC selected={hasExistingSS === false} onClick={() => setHasExistingSS(false)} label="No" color={BRAND.purple} />
                </div>
                {hasExistingSS === true && (
                  <IB>Additional {fmt(SS_SURCHARGE[frequency])} per {fl.toLowerCase()} pay run for salary sacrifice administration.</IB>
                )}
              </>
            )}
          </Sec>
        )}

        {/* 6 - Additional Services */}
        {isNewPAYE !== null && pkg && frequency && employees > 0 && (
          <Sec title="Additional Services" number={step()}>

            {showCIS && (
              <>
                <Tog checked={needsCIS} onChange={setNeedsCIS} label="CIS (Construction Industry Scheme)" />
                {needsCIS && (
                  <div style={{ marginTop: 8, marginLeft: 4, display: "flex", flexDirection: "column", gap: 10 }}>
                    <div style={{ display: "flex", gap: 8, marginBottom: 4 }}>
                      <RC selected={!cisSuffOnly && cisFreq !== ""} onClick={() => { setCisSuffOnly(false); setCisFreq("monthly"); }} label="Full CIS Processing" color={BRAND.purple} />
                      <RC selected={cisSuffOnly} onClick={() => { setCisSuffOnly(true); setCisFreq(""); }} label="CIS Suffered Only" color={BRAND.purple} />
                    </div>
                    {cisSuffOnly && <IB>{"\u00A3"}10/month (recommend charging client {"\u00A3"}15/month)</IB>}
                    {!cisSuffOnly && (
                      <>
                        <div style={{ display: "flex", gap: 8 }}>
                          <RC selected={cisFreq === "weekly"} onClick={() => setCisFreq("weekly")} label="Weekly" color={BRAND.purple} />
                          <RC selected={cisFreq === "monthly"} onClick={() => setCisFreq("monthly")} label="Monthly" color={BRAND.purple} />
                        </div>
                        <NI value={numSubs} onChange={setNumSubs} label="Number of subcontractors" min={1} suffix="subcontractors" />
                        {cisFreq && (
                          <IB>
                            {FL[cisFreq]}: {fmt(CIS_PRICING[cisFreq].base)} base + {fmt(CIS_PRICING[cisFreq].perSub)} x {numSubs} subcontractor{numSubs > 1 ? "s" : ""} = <strong>{fmt(CIS_PRICING[cisFreq].base + CIS_PRICING[cisFreq].perSub * numSubs)} per {cisFreq === "weekly" ? "week" : "month"}</strong>
                          </IB>
                        )}
                      </>
                    )}
                  </div>
                )}
                <Div />
              </>
            )}

            {showBIK && (
              <>
                <Tog checked={needsBIK} onChange={setNeedsBIK} label="Payrolling Benefits in Kind" />
                {needsBIK && (
                  <div style={{ marginTop: 8, marginLeft: 4 }}>
                    <NI value={bikEmp} onChange={setBikEmp} label="How many employees have payrolling benefits?" min={1} max={employees} suffix="employees" />
                    {bikEmp > 0 && (
                      <IB>
                        {fmt(BIK_RATES[frequency] || 0)} x {bikEmp} employee{bikEmp > 1 ? "s" : ""} = <strong>{fmt((BIK_RATES[frequency] || 0) * bikEmp)} per {fl.toLowerCase()} pay run</strong>
                      </IB>
                    )}
                  </div>
                )}
                <Div />
              </>
            )}

            {showPay && (
              <>
                <Q>Will the client require us to make payments?</Q>
                <div style={{ display: "flex", gap: 8 }}>
                  <RC selected={needsPay === true} onClick={() => setNeedsPay(true)} label="Yes" color={BRAND.purple} />
                  <RC selected={needsPay === false} onClick={() => setNeedsPay(false)} label="No" color={BRAND.purple} />
                </div>
                {needsPay === true && (
                  <IB>
                    <strong>One-off setup:</strong> {"\u00A3"}249 + VAT (recommend charging client {"\u00A3"}349 + VAT)
                    {pkg === "allinone" && (<span><br /><strong>Ongoing:</strong> {fmt(PAY_SURCHARGE[frequency])} per employee per {fl.toLowerCase()} pay run ({fmt(PAY_SURCHARGE[frequency])} x {employees} = {fmt(PAY_SURCHARGE[frequency] * employees)})</span>)}
                    {pkg === "premium" && (<span><br /><span style={{ color: BRAND.green, fontWeight: 500 }}>No ongoing charge {"\u2014"} included with Premium</span></span>)}
                    <br /><span style={{ fontSize: 12, color: BRAND.grey600, fontStyle: "italic" }}>The HMRC payment is included in this fee.</span>
                  </IB>
                )}
              </>
            )}

            {isEss && isAnn && (
              <div style={{ fontSize: 14, color: BRAND.grey600, fontStyle: "italic" }}>No additional services available for Essential Annual.</div>
            )}
          </Sec>
        )}

        {/* ---- Summary ---- */}
        {showSum && totals && (
          <div style={{ background: BRAND.purple, borderRadius: 16, padding: 28, color: BRAND.white, position: "relative", overflow: "hidden" }}>
            <div style={{ position: "absolute", top: -20, right: -20, width: 120, height: 120, borderRadius: "50%", background: `radial-gradient(circle, ${BRAND.pink}30, transparent)` }} />
            <div style={{ position: "absolute", bottom: -15, left: -15, width: 80, height: 80, borderRadius: "50%", background: `radial-gradient(circle, ${BRAND.peach}20, transparent)` }} />

            <h3 style={{ fontSize: 18, fontWeight: 800, margin: "0 0 4px", position: "relative" }}>Quote Summary</h3>
            <p style={{ fontSize: 13, color: `${BRAND.white}99`, margin: "0 0 20px" }}>
              {pd!.name} Package {"\u2022"} {fl} {"\u2022"} {employees} {isEss ? "director" : "employee"}{employees > 1 ? "s" : ""}
              {disc > 0 ? ` \u2022 ${disc}% partner discount` : ""}
            </p>

            <div style={{ background: `${BRAND.white}12`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.peach, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>
                Per {frequency === "annually" ? "Year" : fl + " Pay Run"} + VAT
              </div>
              <QL label="Client price" sub={`(${fmt((pd!.pricing as Record<string, { base: number; perSlip: number }>)[frequency].base)} base + ${fmt((pd!.pricing as Record<string, { base: number; perSlip: number }>)[frequency].perSlip)} x ${employees})`} amount={fmt(core!.std)} color={BRAND.white} />
              <QL label="Your partner rate" sub={`(${disc}% discount)`} amount={fmt(core!.disc)} color={BRAND.peach} />
              {otherSur > 0 && <QL label="Pension provider surcharge" amount={fmt(otherSur)} color={`${BRAND.white}BB`} indent />}
              {ssSur > 0 && <QL label="Salary sacrifice admin" amount={fmt(ssSur)} color={`${BRAND.white}BB`} indent />}
              {bikSur > 0 && <QL label={`Payrolling BIK (${bikEmp} emp${bikEmp > 1 ? "s" : ""})`} amount={fmt(bikSur)} color={`${BRAND.white}BB`} indent />}
              {paySur > 0 && <QL label={`Payments (${employees} emp${employees > 1 ? "s" : ""})`} amount={fmt(paySur)} color={`${BRAND.white}BB`} indent />}
            </div>

            {cis && (
              <div style={{ background: `${BRAND.white}12`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.peach, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>CIS + VAT</div>
                {"isM" in cis ? (
                  <>
                    <QL label="CIS Suffered (charge client)" amount={`${fmt(cis.client)}/month`} color={BRAND.white} />
                    <QL label="Your cost" amount={`${fmt(cis.our)}/month`} color={BRAND.peach} />
                  </>
                ) : (
                  <QL label={`${cis.fl} CIS (${numSubs} sub${numSubs > 1 ? "s" : ""})`} amount={fmt(cis.pr)} color={BRAND.white} />
                )}
              </div>
            )}

            {oneOff.length > 0 && (
              <div style={{ background: `${BRAND.white}12`, borderRadius: 12, padding: "16px 18px", marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: BRAND.peach, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 10 }}>One-Off Fees + VAT</div>
                {oneOff.map((f, i) => (
                  <div key={i}>
                    <QL label={`${f.label} (charge client)`} amount={fmt(f.client)} color={BRAND.white} />
                    <QL label="Your cost" amount={fmt(f.our)} color={BRAND.peach} indent />
                  </div>
                ))}
                {totals.ooP > 0 && (
                  <>
                    <div style={{ height: 1, background: `${BRAND.white}20`, margin: "8px 0" }} />
                    <QL label="One-off setup profit" amount={fmt(totals.ooP)} bold color={BRAND.green} />
                  </>
                )}
              </div>
            )}

            {showPen && pensionProvider && pensionProvider !== "Not currently required" && (
              <div style={{ background: `${BRAND.white}08`, borderRadius: 10, padding: "12px 16px", marginBottom: 16, fontSize: 13, color: `${BRAND.white}AA`, lineHeight: 1.5 }}>
                <strong style={{ color: BRAND.white }}>Re-enrolment (every 3 years):</strong> We take care of everything. {"\u00A3"}99 + VAT (recommend charging client {"\u00A3"}199 + VAT).
              </div>
            )}

            <div style={{ background: `linear-gradient(135deg, ${BRAND.green}, #059669)`, borderRadius: 14, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: `${BRAND.white}CC`, textTransform: "uppercase", letterSpacing: "1.5px", marginBottom: 8 }}>Your Annual Recurring Profit</div>
              <div style={{ fontSize: 40, fontWeight: 800, color: BRAND.white, lineHeight: 1, marginBottom: 6 }}>{fmtInt(totals.annP)}</div>
              <div style={{ fontSize: 13, color: `${BRAND.white}CC` }}>
                from this client per year
                {totals.ooP > 0 && <span> + {fmt(totals.ooP)} one-off setup profit</span>}
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 24, fontSize: 13 }}>
                <div>
                  <div style={{ color: `${BRAND.white}99`, marginBottom: 2 }}>Annual client revenue</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{fmtInt(totals.cA)}</div>
                </div>
                <div style={{ width: 1, background: `${BRAND.white}30` }} />
                <div>
                  <div style={{ color: `${BRAND.white}99`, marginBottom: 2 }}>Your annual cost</div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{fmtInt(totals.oA)}</div>
                </div>
              </div>
            </div>
          </div>
        )}

        <div style={{ textAlign: "center", padding: "12px 0", fontSize: 12, color: BRAND.grey300 }}>
          All prices exclude VAT. Intelligent Payroll Partner Tool {"\u2022"} {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
}
