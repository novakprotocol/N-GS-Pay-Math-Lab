(function () {
  "use strict";

  const DATA = window.NGSPayData;
  const FORMULA_VERSION = "n-gs-pay-math-lab-v0.01";
  const YEARS = Array.from({ length: 50 }, (_, index) => 1977 + index);
  const money0 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
  const money2 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const money4 = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", minimumFractionDigits: 4, maximumFractionDigits: 4 });
  const num0 = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 });
  const num2 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const num6 = new Intl.NumberFormat("en-US", { minimumFractionDigits: 6, maximumFractionDigits: 6 });

  function roundHalfUp(value, decimals = 0) {
    const factor = 10 ** decimals;
    const rounded = Math.floor((Number(value) + Number.EPSILON) * factor + 0.5) / factor;
    return decimals === 0 ? Math.trunc(rounded) : rounded;
  }

  function pct(value, digits = 2) {
    return `${Number(value).toFixed(digits)}%`;
  }

  function factorText(rate) {
    const numeric = Number(rate);
    return (1 + numeric / 100).toFixed(Number.isInteger(numeric) ? 3 : 4);
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function baseRaise(year) {
    return Number(DATA.adjustments.base_raise_percent[String(year)]);
  }

  function anchorFor(year) {
    return DATA.checkpoints.anchors[String(year)];
  }

  function segmentForYear(year) {
    if (year <= 1979) return { anchor: year, direction: "exact" };
    if (year <= 1990) return { anchor: 1979, direction: "forward" };
    if (year <= 1996) return { anchor: 1991, direction: year === 1991 ? "exact" : "forward" };
    if (year <= 2013) return { anchor: 1997, direction: year === 1997 ? "exact" : "forward" };
    if (year <= 2022) return { anchor: 2014, direction: year === 2014 ? "exact" : "forward" };
    return { anchor: year, direction: "exact" };
  }

  function applyAnnual(value, year) {
    return roundHalfUp(value * (1 + baseRaise(year) / 100));
  }

  function reverseAnnual(value, year) {
    return roundHalfUp(value / (1 + baseRaise(year) / 100));
  }

  function deriveFromAnchor(year, grade, step) {
    const segment = segmentForYear(year);
    const anchor = anchorFor(segment.anchor);
    const lowGrade = grade <= 2;
    const chain = [];
    let step1 = null;
    let cell = null;

    if (lowGrade) {
      cell = anchor.low[String(grade)][step - 1];
      chain.push({ year: segment.anchor, before: null, rate: null, after: cell, exact: true, kind: "cell" });
    } else {
      step1 = anchor.step1[grade];
      chain.push({ year: segment.anchor, before: null, rate: null, after: step1, exact: true, kind: "step1" });
    }

    if (segment.direction === "forward") {
      for (let y = segment.anchor + 1; y <= year; y += 1) {
        if (lowGrade) {
          const before = cell;
          cell = applyAnnual(cell, y);
          chain.push({ year: y, before, rate: baseRaise(y), after: cell, kind: "cell" });
        } else {
          const before = step1;
          step1 = applyAnnual(step1, y);
          chain.push({ year: y, before, rate: baseRaise(y), after: step1, kind: "step1" });
        }
      }
    } else if (segment.direction === "backward") {
      for (let y = segment.anchor; y > year; y -= 1) {
        if (lowGrade) {
          const before = cell;
          cell = reverseAnnual(cell, y);
          chain.push({ year: y - 1, before, rate: baseRaise(y), after: cell, reverse: true, kind: "cell" });
        } else {
          const before = step1;
          step1 = reverseAnnual(step1, y);
          chain.push({ year: y - 1, before, rate: baseRaise(y), after: step1, reverse: true, kind: "step1" });
        }
      }
    }

    let wgi = null;
    let base;
    if (lowGrade) {
      base = cell;
    } else {
      wgi = roundHalfUp(step1 / 30);
      base = step1 + (step - 1) * wgi;
    }

    const exactAnchor = segment.direction === "exact";
    const lowModeled = lowGrade && Boolean(anchor.low_modeled);
    let status = "Formula reconstruction";
    let statusClass = "recon";
    if (exactAnchor && !lowModeled) {
      status = anchor.status || "Official checkpoint";
      statusClass = "exact";
    } else if (lowModeled) {
      status = anchor.low_status || "Formula reconstruction";
      statusClass = "model";
    }

    return {
      year,
      grade,
      step,
      base,
      step1,
      wgi,
      chain,
      anchorYear: segment.anchor,
      anchorLabel: anchor.label,
      scheduleBadge: anchor.schedule_badge || "Formula reconstruction year",
      direction: segment.direction,
      lowGrade,
      lowModeled,
      status,
      statusClass,
      adjustment: baseRaise(year)
    };
  }

  const scheduleCache = new Map();
  function scheduleFor(year) {
    if (!scheduleCache.has(year)) {
      const rows = [];
      for (let grade = 1; grade <= 15; grade += 1) {
        const row = [];
        for (let step = 1; step <= 10; step += 1) {
          row.push(deriveFromAnchor(year, grade, step).base);
        }
        rows.push(row);
      }
      scheduleCache.set(year, rows);
    }
    return scheduleCache.get(year);
  }

  function computePay(year, grade, step, localityPct, cap, applyCap) {
    const baseDetail = deriveFromAnchor(year, grade, step);
    const localityRaw = baseDetail.base * (1 + localityPct / 100);
    const localityRounded = roundHalfUp(localityRaw);
    const capIsValid = applyCap && Number.isFinite(cap) && cap > 0;
    const annual = capIsValid ? Math.min(localityRounded, cap) : localityRounded;
    const capped = capIsValid && localityRounded > cap;
    const divisor = year < 1984 ? 2080 : 2087;
    const hourly = roundHalfUp(annual / divisor, 2);
    const biweekly = roundHalfUp(hourly * 80, 2);
    return { ...baseDetail, localityPct, localityRaw, localityRounded, cap, capIsValid, capped, annual, divisor, hourly, biweekly, formulaVersion: FORMULA_VERSION };
  }

  function traceFor(result) {
    const lines = [];
    const g = `GS-${result.grade}`;
    lines.push(`<span class="trace-key">Input</span> ${result.year} ${g} Step ${result.step}; locality ${pct(result.localityPct)}; ${result.capIsValid ? `cap ${money2.format(result.cap)}` : "no cap"}.`);
    lines.push(`<span class="trace-key">Provenance</span> ${escapeHtml(result.status)}; anchor ${result.anchorYear}: ${escapeHtml(result.anchorLabel)}.`);
    if (result.lowGrade) {
      lines.push(`<span class="trace-warn">Low-grade rule</span> GS-1 and GS-2 use direct cell treatment when WGI varies.`);
    }
    for (const link of result.chain) {
      if (link.exact) {
        const label = link.kind === "step1" ? "Step 1" : `GS-${result.grade}/Step ${result.step}`;
        lines.push(`${link.year} anchor ${label} = <strong>${money0.format(link.after)}</strong>.`);
      } else if (link.reverse) {
        lines.push(`${link.year} reverse = RHU(${money0.format(link.before)} / ${factorText(link.rate)}) = <strong>${money0.format(link.after)}</strong>.`);
      } else {
        lines.push(`${link.year} annual Step 1 update = RHU(${money0.format(link.before)} x ${factorText(link.rate)}) = <strong>${money0.format(link.after)}</strong>.`);
      }
    }
    if (!result.lowGrade) {
      lines.push(`Within-grade increment = RHU(${money0.format(result.step1)} / 30) = RHU(${num6.format(result.step1 / 30)}) = <strong>${money0.format(result.wgi)}</strong>.`);
      lines.push(`${g} Step ${result.step} = ${money0.format(result.step1)} + (${result.step} - 1) x ${money0.format(result.wgi)} = <strong>${money0.format(result.base)}</strong>.`);
    } else {
      lines.push(`${g} Step ${result.step} base cell = <strong>${money0.format(result.base)}</strong>.`);
    }
    lines.push(`Locality raw = ${money0.format(result.base)} x (1 + ${num2.format(result.localityPct)} / 100) = ${money4.format(result.localityRaw)}.`);
    lines.push(`Locality multiplication rounded = RHU(${money4.format(result.localityRaw)}) = <strong>${money0.format(result.localityRounded)}</strong>.`);
    if (result.capIsValid) {
      lines.push(`Pay-cap application = min(${money0.format(result.localityRounded)}, ${money2.format(result.cap)}) = <strong>${money2.format(result.annual)}</strong>${result.capped ? "; cap applied." : "; cap not binding."}`);
    } else {
      lines.push(`Pay-cap application skipped; payable annual = <strong>${money0.format(result.annual)}</strong>.`);
    }
    lines.push(`Hourly divisor = <strong>${num0.format(result.divisor)}</strong> ${result.year < 1984 ? "before 1984" : "from 1984 forward"}.`);
    lines.push(`Cent rounding = RHU2(${money2.format(result.annual)} / ${num0.format(result.divisor)}) = RHU2(${num6.format(result.annual / result.divisor)}) = <strong>${money2.format(result.hourly)}</strong>.`);
    lines.push(`Biweekly calculation = ${money2.format(result.hourly)} x 80 = <strong>${money2.format(result.biweekly)}</strong>.`);
    return lines;
  }

  function calculationRecord(result) {
    let validationStatus = "not-an-official-fixture";
    if (result.year === 2026 && result.base === DATA.validation.official_2026[result.grade - 1][result.step - 1]) {
      validationStatus = "matches-2026-official-fixture";
    }
    return {
      inputs: {
        year: result.year,
        grade: result.grade,
        step: result.step,
        locality_percent: result.localityPct,
        cap: result.capIsValid ? result.cap : null,
        apply_cap: result.capIsValid
      },
      formula_version: FORMULA_VERSION,
      rounding_mode: "half-up",
      classification: result.status,
      validation_status: validationStatus,
      intermediate_values: {
        anchor_year: result.anchorYear,
        anchor_label: result.anchorLabel,
        chain: result.chain,
        step1: result.step1,
        wgi: result.wgi,
        base: result.base,
        locality_raw: result.localityRaw,
        locality_rounded: result.localityRounded,
        annual: result.annual,
        divisor: result.divisor,
        hourly: result.hourly,
        biweekly: result.biweekly
      },
      result: {
        annual_base_pay: result.base,
        annual_with_locality_and_cap: result.annual,
        hourly: result.hourly,
        biweekly: result.biweekly
      }
    };
  }

  function official2026MatchCount() {
    const generated = scheduleFor(2026);
    let exact = 0;
    for (let g = 0; g < 15; g += 1) {
      for (let s = 0; s < 10; s += 1) {
        if (generated[g][s] === DATA.validation.official_2026[g][s]) exact += 1;
      }
    }
    return exact;
  }

  function wrongShortcutMismatchCount() {
    let wrong = 0;
    for (let g = 0; g < 15; g += 1) {
      for (let s = 0; s < 10; s += 1) {
        const shortcut = roundHalfUp(DATA.validation.official_2025[g][s] * 1.01);
        if (shortcut !== DATA.validation.official_2026[g][s]) wrong += 1;
      }
    }
    return wrong;
  }

  window.NGSPayMath = {
    DATA,
    FORMULA_VERSION,
    YEARS,
    money0,
    money2,
    num0,
    pct,
    escapeHtml,
    roundHalfUp,
    deriveFromAnchor,
    scheduleFor,
    computePay,
    traceFor,
    calculationRecord,
    official2026MatchCount,
    wrongShortcutMismatchCount
  };
})();
