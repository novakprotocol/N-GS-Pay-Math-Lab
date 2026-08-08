(function () {
  "use strict";

  const math = window.NGSPayMath;
  const sizeReceipt = window.NGSPaySizeReceipt || null;

  const $ = (id) => document.getElementById(id);
  const els = {
    year: $("year"),
    compareYear: $("compareYear"),
    grade: $("grade"),
    step: $("step"),
    localityArea: $("localityArea"),
    locality: $("locality"),
    cap: $("cap"),
    applyCap: $("applyCap"),
    run: $("runMath"),
    reset: $("resetScenario"),
    downloadRecord: $("downloadRecord"),
    themeToggle: $("themeToggle"),
    menuToggle: $("menuToggle"),
    navDrawer: $("navDrawer"),
    drawerClose: $("drawerClose"),
    printPage: $("printPage"),
    baseResult: $("baseResult"),
    annualResult: $("annualResult"),
    hourlyResult: $("hourlyResult"),
    biweeklyResult: $("biweeklyResult"),
    statusBadge: $("statusBadge"),
    resultNote: $("resultNote"),
    payPicture: $("payPicture"),
    highestAreaPay: $("highestAreaPay"),
    highestAreaName: $("highestAreaName"),
    highestPayList: $("highestPayList"),
    noTaxAreaPay: $("noTaxAreaPay"),
    noTaxAreaName: $("noTaxAreaName"),
    noTaxAreaList: $("noTaxAreaList"),
    taxHighlightNote: $("taxHighlightNote"),
    costAreaGap: $("costAreaGap"),
    costAreaName: $("costAreaName"),
    costAreaList: $("costAreaList"),
    costHighlightNote: $("costHighlightNote"),
    traceList: $("traceList"),
    tracePlain: $("tracePlain"),
    scheduleTitle: $("scheduleTitle"),
    scheduleMeta: $("scheduleMeta"),
    scheduleBadge: $("scheduleBadge"),
    scheduleTable: $("scheduleTable"),
    chartTitle: $("chartTitle"),
    chartMetric: $("chartMetric"),
    chartDelta: $("chartDelta"),
    timelineChart: $("timelineChart"),
    inflationSummary: $("inflationSummary"),
    inflationActual: $("inflationActual"),
    inflationTarget: $("inflationTarget"),
    inflationGap: $("inflationGap"),
    inflationPower: $("inflationPower"),
    inflationTitle: $("inflationTitle"),
    inflationVerdict: $("inflationVerdict"),
    inflationNote: $("inflationNote"),
    inflationChart: $("inflationChart"),
    ledgerTitle: $("ledgerTitle"),
    ledgerTable: $("ledgerTable"),
    auditExact: $("auditExact"),
    auditWrong: $("auditWrong"),
    auditLocality: $("auditLocality"),
    auditHourly: $("auditHourly"),
    sizeStamp: $("sizeStamp"),
    sizeTable: $("sizeTable"),
    sizeBars: $("sizeBars"),
    surfaceMode: $("surfaceMode"),
    earnStart: $("earnStart"),
    earnEnd: $("earnEnd"),
    compareMode: $("compareMode"),
    surfaceYearSpan: $("surfaceYearSpan"),
    surfaceTitle: $("surfaceTitle"),
    surfacePeak: $("surfacePeak"),
    surfaceRange: $("surfaceRange"),
    surfaceSelectedLabel: $("surfaceSelectedLabel"),
    surfaceSelected: $("surfaceSelected"),
    surfaceSpreadLabel: $("surfaceSpreadLabel"),
    surfaceSpread: $("surfaceSpread"),
    surfaceRaise: $("surfaceRaise"),
    surfaceCompare: $("surfaceCompare"),
    paySurfaceCanvas: $("paySurfaceCanvas"),
    localityLiftCanvas: $("localityLiftCanvas"),
    capPressureCanvas: $("capPressureCanvas"),
    sourceList: $("sourceList"),
    buildMeta: $("buildMeta")
  };

  let lastRecord = null;
  const surfaceDrag = { active: false, pointerId: null, x: 0, y: 0 };
  const surfaceView = { yaw: 34, tilt: 38 };
  let resizeTimer = null;

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function option(label, value) {
    const node = document.createElement("option");
    node.textContent = label;
    node.value = value;
    return node;
  }

  function localityAreasForYear(year) {
    const rates = math.DATA.localityRates && math.DATA.localityRates.by_year;
    const areas = rates ? rates[String(year)] : null;
    return Array.isArray(areas) ? areas : [];
  }

  function localityAreaByCode(year, code) {
    return localityAreasForYear(year).find((area) => area.code === code) || null;
  }

  function fillLocalityAreas(year, preferredCode) {
    const areas = localityAreasForYear(year);
    els.localityArea.innerHTML = "";
    els.localityArea.appendChild(option("Manual / custom percentage", "custom"));
    areas.forEach((area) => {
      els.localityArea.appendChild(option(`${area.name} (${math.pct(area.percentage)})`, area.code));
    });
    if (!areas.length) {
      els.localityArea.value = "custom";
      return;
    }
    const fallback = localityAreaByCode(year, preferredCode) ? preferredCode : "RUS";
    els.localityArea.value = localityAreaByCode(year, fallback) ? fallback : areas[0].code;
  }

  function selectedLocalityArea() {
    const inputYear = Number(els.year.value || 2026);
    return localityAreaByCode(inputYear, els.localityArea.value);
  }

  function syncLocalityFromArea() {
    const area = selectedLocalityArea();
    if (area) els.locality.value = area.percentage.toFixed(2);
  }

  function syncAreaFromManualPercent() {
    const area = selectedLocalityArea();
    const value = Number(els.locality.value);
    if (area && (!Number.isFinite(value) || Math.abs(value - area.percentage) > 0.005)) {
      els.localityArea.value = "custom";
    }
  }

  function fillControls() {
    math.YEARS.slice().reverse().forEach((year) => {
      els.year.appendChild(option(String(year), String(year)));
      els.compareYear.appendChild(option(String(year), String(year)));
    });
    math.YEARS.forEach((year) => {
      els.earnStart.appendChild(option(String(year), String(year)));
      els.earnEnd.appendChild(option(String(year), String(year)));
    });
    for (let grade = 1; grade <= 15; grade += 1) {
      els.grade.appendChild(option(`GS-${grade}`, String(grade)));
    }
    for (let step = 1; step <= 10; step += 1) {
      els.step.appendChild(option(`Step ${step}`, String(step)));
    }
    els.year.value = "2026";
    els.compareYear.value = "1977";
    els.grade.value = "12";
    els.step.value = "10";
    els.earnStart.value = "2017";
    els.earnEnd.value = "2026";
    fillLocalityAreas(2026, "RUS");
    syncLocalityFromArea();
  }

  function knownCap(year) {
    const cap = math.DATA.adjustments.known_pay_caps[String(year)];
    return Number.isFinite(Number(cap)) ? Number(cap) : NaN;
  }

  function setYearDefaults(year) {
    const previousArea = els.localityArea.value || "RUS";
    fillLocalityAreas(year, previousArea);
    const area = selectedLocalityArea();
    if (area) {
      els.locality.value = area.percentage.toFixed(2);
    } else if (year < 1994) {
      els.locality.value = "0";
    }
    if (Number(els.earnEnd.value) !== year) {
      els.earnEnd.value = String(year);
      els.earnStart.value = String(Math.max(math.YEARS[0], year - 9));
    }
    const cap = knownCap(year);
    els.cap.value = Number.isFinite(cap) ? String(cap) : "";
  }

  function selectedInputs() {
    const year = Number(els.year.value);
    const grade = Number(els.grade.value);
    const step = Number(els.step.value);
    const localityPct = Math.max(0, Number(els.locality.value) || 0);
    const capValue = els.cap.value.trim() === "" ? NaN : Number(els.cap.value);
    return {
      year,
      grade,
      step,
      localityPct,
      localityArea: selectedLocalityArea(),
      capValue,
      applyCap: els.applyCap.checked,
      compareYear: Number(els.compareYear.value),
      earnStart: Number(els.earnStart.value),
      earnEnd: Number(els.earnEnd.value),
      compareMode: els.compareMode.value || "grades"
    };
  }

  function eraDescription(result) {
    const parts = [];
    parts.push(result.year < 1984 ? "2,080-hour divisor" : "2,087-hour divisor");
    parts.push(result.year < 1994 ? "pre-locality era" : "locality-pay era");
    if (result.year === 1979) parts.push("grade-varying adjustment checkpoint");
    parts.push(result.status);
    return parts.join(" | ");
  }

  function renderSummary(result, compare) {
    els.baseResult.textContent = math.money0.format(result.base);
    els.annualResult.textContent = math.money2.format(result.annual);
    els.hourlyResult.textContent = math.money2.format(result.hourly);
    els.biweeklyResult.textContent = math.money2.format(result.biweekly);
    els.statusBadge.textContent = result.status;
    els.statusBadge.dataset.statusClass = result.statusClass;
    const diff = result.base - compare.base;
    const diffPct = compare.base ? (diff / compare.base) * 100 : 0;
    const area = selectedLocalityArea();
    const areaText = area ? `${area.name} locality (${math.pct(area.percentage)})` : `manual locality (${math.pct(result.localityPct)})`;
    els.resultNote.textContent = `${areaText}. ${eraDescription(result)}. ${diff >= 0 ? "+" : "-"}${math.money0.format(Math.abs(diff))} (${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(1)}%) vs. ${compare.year}.`;
  }

  function renderPayPicture(result) {
    if (!els.payPicture) return;
    const area = selectedLocalityArea();
    const areaCode = area ? area.code : "Custom";
    const areaName = area ? area.name : "Manual locality";
    const shortAreaName = areaName.length > 30 ? areaName.slice(0, 27) + "..." : areaName;
    const localityLift = Math.max(0, result.localityRounded - result.base);
    const capLoss = result.capped ? result.localityRounded - result.annual : 0;
    const maxValue = Math.max(result.localityRounded, result.annual, result.capIsValid ? result.cap : 0, 1);
    const scale = (value) => 500 * clamp(value / maxValue, 0, 1);
    const baseW = Math.max(16, scale(result.base));
    const liftW = localityLift > 0 ? Math.max(4, Math.min(500 - baseW, scale(localityLift))) : 0;
    const annualX = 280 + scale(result.annual);
    const capX = result.capIsValid ? 280 + scale(result.cap) : null;
    const capText = result.capIsValid ? (result.capped ? `Cap trims ${math.money0.format(capLoss)}` : "Cap not binding") : "No cap selected";
    const annualLabel = result.capped ? "Capped annual" : "Payable annual";
    const safeArea = math.escapeHtml(shortAreaName);
    const safeCode = math.escapeHtml(areaCode);
    const safePct = math.escapeHtml(math.pct(result.localityPct));
    const capMarker = capX === null ? "" : `<line class="pay-picture-cap" x1="${capX.toFixed(1)}" x2="${capX.toFixed(1)}" y1="64" y2="144"></line><text class="pay-picture-small pay-picture-cap-text" x="${Math.min(840, Math.max(300, capX + 8)).toFixed(1)}" y="58">${math.escapeHtml(capText)}</text>`;
    els.payPicture.innerHTML = `
      <rect class="pay-picture-bg" x="0" y="0" width="980" height="260" rx="8"></rect>
      <path class="pay-picture-grid" d="M278 58H844M278 142H844M278 58V142M844 58V142"></path>
      <text class="pay-picture-kicker" x="32" y="38">Selected Pay Cell</text>
      <text class="pay-picture-title" x="32" y="70">GS-${result.grade} Step ${result.step}</text>
      <text class="pay-picture-sub" x="32" y="96">${result.year} | ${safeCode} | ${safePct}</text>
      <text class="pay-picture-muted" x="32" y="121">${safeArea}</text>
      <g class="pay-picture-bar" transform="translate(280 82)">
        <rect class="pay-picture-base" x="0" y="0" width="${baseW.toFixed(1)}" height="42" rx="5"></rect>
        <polygon class="pay-picture-base-side" points="${baseW.toFixed(1)},0 ${Math.min(500, baseW + 18).toFixed(1)},-14 ${Math.min(500, baseW + 18).toFixed(1)},28 ${baseW.toFixed(1)},42"></polygon>
        <rect class="pay-picture-lift" x="${baseW.toFixed(1)}" y="0" width="${liftW.toFixed(1)}" height="42" rx="${liftW > 0 ? 5 : 0}"></rect>
        <polygon class="pay-picture-lift-side" points="${(baseW + liftW).toFixed(1)},0 ${Math.min(500, baseW + liftW + 18).toFixed(1)},-14 ${Math.min(500, baseW + liftW + 18).toFixed(1)},28 ${(baseW + liftW).toFixed(1)},42"></polygon>
      </g>
      <line class="pay-picture-marker" x1="${annualX.toFixed(1)}" x2="${annualX.toFixed(1)}" y1="72" y2="135"></line>
      <text class="pay-picture-value" x="870" y="85" text-anchor="end">${math.money2.format(result.annual)}</text>
      <text class="pay-picture-muted" x="870" y="109" text-anchor="end">${annualLabel}</text>
      ${capMarker}
      <text class="pay-picture-small" x="280" y="158">Base ${math.money0.format(result.base)}</text>
      <text class="pay-picture-small" x="470" y="158">Locality lift ${math.money0.format(localityLift)}</text>
      <text class="pay-picture-small" x="676" y="158">${math.escapeHtml(capText)}</text>
      <g class="pay-picture-card" transform="translate(32 178)">
        <rect width="210" height="58" rx="6"></rect><text x="14" y="23">Base</text><text x="14" y="45">${math.money0.format(result.base)}</text>
      </g>
      <g class="pay-picture-card" transform="translate(262 178)">
        <rect width="210" height="58" rx="6"></rect><text x="14" y="23">Locality/cap</text><text x="14" y="45">${math.money0.format(result.annual)}</text>
      </g>
      <g class="pay-picture-card" transform="translate(492 178)">
        <rect width="210" height="58" rx="6"></rect><text x="14" y="23">Hourly</text><text x="14" y="45">${math.money2.format(result.hourly)}</text>
      </g>
      <g class="pay-picture-card" transform="translate(722 178)">
        <rect width="210" height="58" rx="6"></rect><text x="14" y="23">Biweekly</text><text x="14" y="45">${math.money2.format(result.biweekly)}</text>
      </g>`;
  }

  function stateTaxInfoFor(area) {
    const notes = math.DATA.stateTaxFlags && math.DATA.stateTaxFlags.locality_area_notes;
    return area && notes ? notes[area.code] || null : null;
  }

  function rppInfoFor(area) {
    const byCode = math.DATA.regionalPriceParities && math.DATA.regionalPriceParities.by_locality_code;
    return area && byCode ? byCode[area.code] || null : null;
  }

  function noIncomeTaxStates(taxInfo) {
    return taxInfo && Array.isArray(taxInfo.no_income_tax_collection_states) ? taxInfo.no_income_tax_collection_states : [];
  }

  function localityCandidateRows(input) {
    return localityAreasForYear(input.year)
      .filter((area) => area.code !== "RUS")
      .map((area) => {
        const result = math.computePay(input.year, input.grade, input.step, area.percentage, input.capValue, input.applyCap);
        return { area, annual: result.annual, taxInfo: stateTaxInfoFor(area), costInfo: rppInfoFor(area) };
      })
      .sort((a, b) => b.annual - a.annual || b.area.percentage - a.area.percentage || a.area.name.localeCompare(b.area.name));
  }

  function signedPercent(value, digits = 1) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "N/A";
    return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(digits)}%`;
  }

  function signedPoints(value, digits = 1) {
    const numeric = Number(value);
    if (!Number.isFinite(numeric)) return "N/A";
    return `${numeric >= 0 ? "+" : ""}${numeric.toFixed(digits)} pts`;
  }

  function pricePremium(costInfo) {
    const rpp = costInfo ? Number(costInfo.rpp_all_items) : NaN;
    return Number.isFinite(rpp) ? rpp - 100 : NaN;
  }

  function localityVsPriceGap(row) {
    const premium = pricePremium(row.costInfo);
    return Number.isFinite(premium) ? row.area.percentage - premium : NaN;
  }

  function rankRow(row, index, selectedCode, showTaxBadge) {
    const isSelected = selectedCode && row.area.code === selectedCode;
    const states = noIncomeTaxStates(row.taxInfo);
    const badge = showTaxBadge && states.length ? `<span class="rank-badge">${math.escapeHtml(states.join(" / "))}</span>` : "";
    const meta = `${math.pct(row.area.percentage)} OPM locality${row.taxInfo && row.taxInfo.note ? ` | ${row.taxInfo.note}` : ""}`;
    return `<div class="rank-row${isSelected ? " is-selected" : ""}"><span class="rank-index">#${index + 1}</span><span class="rank-main"><span class="rank-title">${math.escapeHtml(row.area.code)} | ${math.escapeHtml(row.area.name)}</span><span class="rank-meta">${math.escapeHtml(meta)}</span>${badge}</span><span class="rank-value">${math.money0.format(row.annual)}</span></div>`;
  }

  function costRankRow(row, index, selectedCode) {
    const isSelected = selectedCode && row.area.code === selectedCode;
    const premium = pricePremium(row.costInfo);
    const gap = localityVsPriceGap(row);
    const housing = Number(row.costInfo.rpp_housing);
    const quality = row.costInfo.match_quality ? `${row.costInfo.match_quality} BEA match` : "BEA match";
    const metaParts = [
      `${math.pct(row.area.percentage)} OPM locality`,
      `BEA all-items ${signedPercent(premium)}`,
      Number.isFinite(housing) ? `housing RPP ${housing.toFixed(1)}` : "housing RPP N/A",
      quality
    ];
    return `<div class="rank-row${isSelected ? " is-selected" : ""}"><span class="rank-index">#${index + 1}</span><span class="rank-main"><span class="rank-title">${math.escapeHtml(row.area.code)} | ${math.escapeHtml(row.area.name)}</span><span class="rank-meta">${math.escapeHtml(metaParts.join(" | "))}</span></span><span class="rank-value">${signedPoints(gap)}</span></div>`;
  }

  function renderLocalityHighlights(input) {
    if (!els.highestPayList || !els.noTaxAreaList) return;
    const rows = localityCandidateRows(input);
    const selectedCode = input.localityArea ? input.localityArea.code : null;
    if (!rows.length) {
      setText(els.highestAreaPay, "N/A");
      setText(els.highestAreaName, "2026 locality list only");
      setText(els.noTaxAreaPay, "N/A");
      setText(els.noTaxAreaName, "2026 locality list only");
      setText(els.costAreaGap, "N/A");
      setText(els.costAreaName, "2024 BEA RPP");
      const emptyRow = `<div class="rank-row"><span class="rank-index">--</span><span class="rank-main"><span class="rank-title">No locality table is loaded for ${input.year}</span><span class="rank-meta">Use 2026 to compare OPM locality areas.</span></span></div>`;
      els.highestPayList.innerHTML = emptyRow;
      els.noTaxAreaList.innerHTML = emptyRow;
      if (els.costAreaList) els.costAreaList.innerHTML = emptyRow;
      setText(els.taxHighlightNote, "Census T40 collection flags are informational only and are not payroll or tax determinations.");
      setText(els.costHighlightNote, "BEA Regional Price Parities are loaded for 2024 and are price-level measures, not OPM locality-pay or nonforeign-COLA determinations.");
      return;
    }
    const top = rows.slice(0, 5);
    const noIncomeTaxRows = rows.filter((row) => noIncomeTaxStates(row.taxInfo).length).slice(0, 5);
    const costRows = rows
      .filter((row) => Number.isFinite(localityVsPriceGap(row)))
      .sort((a, b) => localityVsPriceGap(b) - localityVsPriceGap(a) || b.area.percentage - a.area.percentage || a.area.name.localeCompare(b.area.name))
      .slice(0, 5);
    const firstTop = top[0];
    const firstTax = noIncomeTaxRows[0];
    const firstCost = costRows[0];
    setText(els.highestAreaPay, firstTop ? math.money0.format(firstTop.annual) : "N/A");
    setText(els.highestAreaName, firstTop ? `${firstTop.area.code} | ${math.pct(firstTop.area.percentage)}` : "No area loaded");
    setText(els.noTaxAreaPay, firstTax ? math.money0.format(firstTax.annual) : "N/A");
    setText(els.noTaxAreaName, firstTax ? `${firstTax.area.code} | ${noIncomeTaxStates(firstTax.taxInfo).join("/")}` : "No flagged area");
    setText(els.costAreaGap, firstCost ? signedPoints(localityVsPriceGap(firstCost)) : "N/A");
    setText(els.costAreaName, firstCost ? `${firstCost.area.code} | BEA ${signedPercent(pricePremium(firstCost.costInfo))}` : "No BEA match loaded");
    els.highestPayList.innerHTML = top.map((row, index) => rankRow(row, index, selectedCode, false)).join("");
    els.noTaxAreaList.innerHTML = noIncomeTaxRows.length ? noIncomeTaxRows.map((row, index) => rankRow(row, index, selectedCode, true)).join("") : `<div class="rank-row"><span class="rank-index">--</span><span class="rank-main"><span class="rank-title">No Census T40 income-tax collection flag is loaded for ${input.year}</span><span class="rank-meta">The Census flag table is currently mapped to the 2026 OPM locality list.</span></span></div>`;
    if (els.costAreaList) {
      els.costAreaList.innerHTML = costRows.length ? costRows.map((row, index) => costRankRow(row, index, selectedCode)).join("") : `<div class="rank-row"><span class="rank-index">--</span><span class="rank-main"><span class="rank-title">No BEA RPP locality match is loaded for ${input.year}</span><span class="rank-meta">RUS and manual percentages do not have a single BEA price-level match.</span></span></div>`;
    }
    setText(els.taxHighlightNote, "Census FY2025 T40 flags mean the state individual income tax collection item is coded X. This does not model residence, duty station, local taxes, sales taxes, property taxes, deductions, or capital-gains taxes.");
    setText(els.costHighlightNote, "BEA 2024 RPP compares local price levels with the U.S. average. Difference shown is OPM locality percent minus BEA all-items price premium; it is not an OPM COLA calculation.");
  }

  function renderTrace(result) {
    const lines = math.traceFor(result);
    els.traceList.innerHTML = lines.map((line, index) => `<li><span>${String(index + 1).padStart(2, "0")}</span><p>${line}</p></li>`).join("");
    const plain = lines.map((line, index) => `${String(index + 1).padStart(2, "0")} ${line.replace(/<[^>]+>/g, "")}`).join("\n");
    els.tracePlain.textContent = plain;
  }

  function renderSchedule(year, activeGrade, activeStep) {
    const schedule = math.scheduleFor(year);
    const detail = math.deriveFromAnchor(year, activeGrade, activeStep);
    let html = "<thead><tr><th>Grade</th>";
    for (let step = 1; step <= 10; step += 1) html += `<th>Step ${step}</th>`;
    html += "</tr></thead><tbody>";
    schedule.forEach((row, gIndex) => {
      const grade = gIndex + 1;
      html += `<tr class="${grade <= 2 ? "low-grade" : ""}"><th scope="row">GS-${grade}</th>`;
      row.forEach((value, sIndex) => {
        const step = sIndex + 1;
        const selected = grade === activeGrade && step === activeStep;
        html += `<td><button class="cell-button${selected ? " selected" : ""}" data-grade="${grade}" data-step="${step}">${math.money0.format(value)}</button></td>`;
      });
      html += "</tr>";
    });
    html += "</tbody>";
    els.scheduleTable.innerHTML = html;
    els.scheduleTitle.textContent = `${year} generated General Schedule base table`;
    els.scheduleMeta.textContent = `${detail.anchorYear} anchor | ${math.pct(detail.adjustment)} labeled-year base adjustment | 150 grade-and-step cells`;
    els.scheduleBadge.textContent = detail.scheduleBadge || "Formula reconstruction year";
  }

  function renderChart(year, grade, step) {
    const values = math.YEARS.map((y) => math.deriveFromAnchor(y, grade, step).base);
    const width = 980;
    const height = 330;
    const margin = { left: 76, right: 28, top: 22, bottom: 42 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const pad = Math.max(500, (maxValue - minValue) * 0.08);
    const yMin = Math.max(0, minValue - pad);
    const yMax = maxValue + pad;
    const x = (i) => margin.left + (i / (math.YEARS.length - 1)) * innerW;
    const y = (value) => margin.top + (1 - (value - yMin) / (yMax - yMin)) * innerH;
    const points = values.map((value, i) => [x(i), y(value)]);
    const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${p[0].toFixed(2)},${p[1].toFixed(2)}`).join(" ");
    const selectedIndex = math.YEARS.indexOf(year);
    let svg = "";
    for (let i = 0; i <= 4; i += 1) {
      const val = yMin + ((yMax - yMin) * i) / 4;
      const yy = y(val);
      svg += `<line class="chart-grid" x1="${margin.left}" x2="${width - margin.right}" y1="${yy}" y2="${yy}"></line><text class="chart-axis" x="${margin.left - 10}" y="${yy + 4}" text-anchor="end">${math.money0.format(val)}</text>`;
    }
    math.YEARS.forEach((yr, i) => {
      if (yr === 1977 || yr === 2026 || yr % 5 === 0) {
        svg += `<text class="chart-axis" x="${x(i)}" y="${height - 16}" text-anchor="middle">${yr}</text>`;
      }
    });
    DATA_CHECKPOINT_YEARS().forEach((anchorYear) => {
      const i = math.YEARS.indexOf(anchorYear);
      if (i >= 0) svg += `<line class="anchor-line" x1="${x(i)}" x2="${x(i)}" y1="${margin.top}" y2="${margin.top + innerH}"></line>`;
    });
    svg += `<path class="chart-line" d="${path}"></path>`;
    points.forEach((p, i) => {
      const active = i === selectedIndex;
      svg += `<circle class="chart-dot${active ? " active" : ""}" cx="${p[0]}" cy="${p[1]}" r="${active ? 5.8 : 3}"><title>${math.YEARS[i]} ${math.money0.format(values[i])}</title></circle>`;
    });
    els.timelineChart.innerHTML = svg;
    els.chartTitle.textContent = `GS-${grade} Step ${step} | 1977-2026`;
    els.chartMetric.textContent = math.money0.format(values[selectedIndex]);
    const first = values[0];
    const delta = values[selectedIndex] - first;
    const deltaPct = first ? (delta / first) * 100 : 0;
    els.chartDelta.textContent = `${delta >= 0 ? "+" : "-"}${math.money0.format(Math.abs(delta))} | ${deltaPct >= 0 ? "+" : ""}${deltaPct.toFixed(1)}% from 1977`;
  }

  function cpiForYear(year) {
    const values = math.DATA.inflation && math.DATA.inflation.by_year;
    const value = values ? Number(values[String(year)]) : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function latestCpiYear() {
    const metaYear = math.DATA.inflation && Number(math.DATA.inflation.latest_completed_year);
    if (Number.isFinite(metaYear) && cpiForYear(metaYear)) return metaYear;
    const values = math.DATA.inflation && math.DATA.inflation.by_year;
    if (!values) return null;
    return Object.keys(values).map(Number).filter((year) => Number.isFinite(year) && cpiForYear(year)).sort((a, b) => b - a)[0] || null;
  }

  function cpiComparableYear(requestedYear) {
    if (cpiForYear(requestedYear)) return requestedYear;
    const latest = latestCpiYear();
    return latest && requestedYear > latest ? latest : null;
  }

  function pointPath(points) {
    return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`).join(" ");
  }

  function renderInflation(input) {
    if (!els.inflationChart) return;
    const requestedBaseYear = input.compareYear;
    const requestedTargetYear = input.year;
    const baseYear = cpiComparableYear(requestedBaseYear);
    const targetYear = cpiComparableYear(requestedTargetYear);
    const baseCpi = baseYear ? cpiForYear(baseYear) : null;
    const targetCpi = targetYear ? cpiForYear(targetYear) : null;
    const startPay = baseYear ? math.deriveFromAnchor(baseYear, input.grade, input.step).base : NaN;
    const endPay = targetYear ? math.deriveFromAnchor(targetYear, input.grade, input.step).base : NaN;
    if (!baseCpi || !targetCpi || !Number.isFinite(startPay) || !Number.isFinite(endPay)) {
      setText(els.inflationSummary, "BLS CPI comparison is unavailable for the selected years.");
      setText(els.inflationActual, "N/A");
      setText(els.inflationTarget, "N/A");
      setText(els.inflationGap, "N/A");
      setText(els.inflationPower, "N/A");
      setText(els.inflationVerdict, "Unavailable");
      setText(els.inflationNote, "Missing official BLS annual CPI");
      els.inflationChart.innerHTML = "";
      return;
    }
    const neededPay = startPay * (targetCpi / baseCpi);
    const gap = endPay - neededPay;
    const actualPct = startPay ? ((endPay / startPay) - 1) * 100 : 0;
    const cpiPct = baseCpi ? ((targetCpi / baseCpi) - 1) * 100 : 0;
    const buyingPower = neededPay ? (endPay / neededPay) * 100 : 0;
    const latest = latestCpiYear();
    const fallbackNote = requestedBaseYear !== baseYear || requestedTargetYear !== targetYear ? ` BLS annual CPI is loaded through ${latest}; using ${baseYear}-${targetYear}.` : "";
    const summary = `GS-${input.grade} Step ${input.step} base pay: ${baseYear} ${math.money0.format(startPay)} to ${targetYear} ${math.money0.format(endPay)}. CPI target for the same buying power is ${math.money0.format(neededPay)}.${fallbackNote}`;
    setText(els.inflationSummary, summary);
    setText(els.inflationActual, `${actualPct >= 0 ? "+" : ""}${actualPct.toFixed(1)}%`);
    setText(els.inflationTarget, `${cpiPct >= 0 ? "+" : ""}${cpiPct.toFixed(1)}%`);
    setText(els.inflationGap, `${gap >= 0 ? "+" : "-"}${math.money0.format(Math.abs(gap))}`);
    setText(els.inflationPower, `${buyingPower.toFixed(1)}%`);
    setText(els.inflationTitle, `GS-${input.grade} Step ${input.step} base pay vs BLS CPI target`);
    setText(els.inflationVerdict, gap >= 0 ? "Kept up" : "Behind CPI");
    setText(els.inflationNote, requestedBaseYear !== baseYear || requestedTargetYear !== targetYear ? `Official BLS annual CPI through ${latest}` : `${Math.min(baseYear, targetYear)}-${Math.max(baseYear, targetYear)}`);

    const firstYear = Math.min(baseYear, targetYear);
    const lastYear = Math.max(baseYear, targetYear);
    const years = math.YEARS.filter((year) => year >= firstYear && year <= lastYear && cpiForYear(year));
    const actualValues = years.map((year) => math.deriveFromAnchor(year, input.grade, input.step).base);
    const targetValues = years.map((year) => startPay * (cpiForYear(year) / baseCpi));
    const allValues = actualValues.concat(targetValues);
    const width = 980;
    const height = 340;
    const margin = { left: 76, right: 30, top: 24, bottom: 46 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const minValue = Math.min(...allValues);
    const maxValue = Math.max(...allValues);
    const pad = Math.max(500, (maxValue - minValue) * 0.08);
    const yMin = Math.max(0, minValue - pad);
    const yMax = maxValue + pad;
    const denom = Math.max(1, lastYear - firstYear);
    const x = (year) => margin.left + ((year - firstYear) / denom) * innerW;
    const y = (value) => margin.top + (1 - (value - yMin) / Math.max(1, yMax - yMin)) * innerH;
    const actualPoints = years.map((year, index) => ({ x: x(year), y: y(actualValues[index]), year, value: actualValues[index] }));
    const targetPoints = years.map((year, index) => ({ x: x(year), y: y(targetValues[index]), year, value: targetValues[index] }));
    let svg = "";
    for (let i = 0; i <= 4; i += 1) {
      const val = yMin + ((yMax - yMin) * i) / 4;
      const yy = y(val);
      svg += `<line class="chart-grid" x1="${margin.left}" x2="${width - margin.right}" y1="${yy}" y2="${yy}"></line><text class="chart-axis" x="${margin.left - 10}" y="${yy + 4}" text-anchor="end">${math.money0.format(val)}</text>`;
    }
    years.forEach((year) => {
      if (year === firstYear || year === lastYear || year % 5 === 0) {
        svg += `<text class="chart-axis" x="${x(year)}" y="${height - 16}" text-anchor="middle">${year}</text>`;
      }
    });
    if (actualPoints.length > 1) {
      const area = `${pointPath(actualPoints)} ${pointPath(targetPoints.slice().reverse()).replace(/^M/, "L")} Z`;
      svg += `<path class="inflation-area" d="${area}"></path>`;
      svg += `<path class="inflation-line target" d="${pointPath(targetPoints)}"></path>`;
      svg += `<path class="inflation-line actual" d="${pointPath(actualPoints)}"></path>`;
    }
    const selectedActual = actualPoints.find((point) => point.year === targetYear) || actualPoints[actualPoints.length - 1];
    const selectedTarget = targetPoints.find((point) => point.year === targetYear) || targetPoints[targetPoints.length - 1];
    if (selectedActual && selectedTarget) {
      svg += `<circle class="inflation-dot actual" cx="${selectedActual.x}" cy="${selectedActual.y}" r="6"><title>${targetYear} actual ${math.money0.format(endPay)}</title></circle>`;
      svg += `<circle class="inflation-dot target" cx="${selectedTarget.x}" cy="${selectedTarget.y}" r="6"><title>${targetYear} CPI target ${math.money0.format(neededPay)}</title></circle>`;
    }
    svg += `<g class="inflation-legend"><line class="inflation-line actual" x1="${width - 268}" x2="${width - 224}" y1="30" y2="30"></line><text x="${width - 214}" y="34">Actual base pay</text><line class="inflation-line target" x1="${width - 268}" x2="${width - 224}" y1="54" y2="54"></line><text x="${width - 214}" y="58">BLS CPI target</text></g>`;
    els.inflationChart.innerHTML = svg;
  }

  function DATA_CHECKPOINT_YEARS() {
    return math.DATA.checkpoints.anchor_years;
  }

  function renderLedger(grade, step) {
    let html = `<thead><tr><th>Year</th><th>Base adj.</th><th>Status</th><th>Step 1</th><th>GS-${grade}/${step}</th><th>YoY</th></tr></thead><tbody>`;
    let previous = null;
    math.YEARS.forEach((year) => {
      const d = math.deriveFromAnchor(year, grade, step);
      const yoy = previous === null ? null : d.base - previous;
      html += `<tr><td>${year}</td><td>${math.pct(d.adjustment)}</td><td><span class="mini-status" data-status-class="${d.statusClass}">${math.escapeHtml(d.status)}</span></td><td>${d.lowGrade ? "N/A" : math.money0.format(d.step1)}</td><td>${math.money0.format(d.base)}</td><td>${yoy === null ? "N/A" : `${yoy >= 0 ? "+" : "-"}${math.money0.format(Math.abs(yoy))}`}</td></tr>`;
      previous = d.base;
    });
    html += "</tbody>";
    els.ledgerTable.innerHTML = html;
    els.ledgerTitle.textContent = `Fifty-year ledger | GS-${grade} Step ${step}`;
  }

  function renderAudits() {
    const example = math.computePay(2026, 12, 10, 17.06, 197200, true);
    els.auditExact.textContent = `${math.official2026MatchCount()} / 150`;
    els.auditWrong.textContent = `${math.wrongShortcutMismatchCount()} / 150`;
    els.auditLocality.textContent = math.money0.format(example.annual);
    els.auditHourly.textContent = math.money2.format(example.hourly);
  }

  function formatBytes(bytes) {
    if (!Number.isFinite(bytes)) return "unavailable";
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(2)} MiB`;
    return `${(bytes / 1024).toFixed(2)} KiB`;
  }

  function renderSizeLab() {
    if (!sizeReceipt || !Array.isArray(sizeReceipt.measurements)) {
      els.sizeStamp.textContent = "Size measurements will appear after the evidence script runs.";
      return;
    }
    els.sizeStamp.textContent = `Measured ${sizeReceipt.generated_at} | formula artifact ${formatBytes(sizeReceipt.formula_artifact_bytes)}`;
    document.querySelectorAll("[data-size-total='core']").forEach((node) => {
      node.textContent = formatBytes(sizeReceipt.calculation_package_without_brand_imagery);
    });
    document.querySelectorAll("[data-size-total='complete']").forEach((node) => {
      node.textContent = formatBytes(sizeReceipt.complete_deployed_package_with_brand_imagery);
    });
    const rows = sizeReceipt.measurements.filter((item) => item.show_in_ui);
    els.sizeTable.innerHTML = `<thead><tr><th>Artifact</th><th>Raw</th><th>Gzip</th><th>Files</th><th>Cells</th><th>Multiple</th><th>Reduction</th><th>Bytes/cell</th></tr></thead><tbody>${rows.map((item) => `<tr><td>${math.escapeHtml(item.label)}</td><td>${formatBytes(item.raw_bytes)}</td><td>${formatBytes(item.gzip_bytes)}</td><td>${item.file_count}</td><td>${item.represented_pay_cells}</td><td>${Number.isFinite(item.static_to_formula_multiple) ? `${item.static_to_formula_multiple.toFixed(2)}x` : "N/A"}</td><td>${Number.isFinite(item.storage_reduction_percent) ? `${item.storage_reduction_percent.toFixed(1)}%` : "N/A"}</td><td>${Number.isFinite(item.bytes_per_pay_cell) ? item.bytes_per_pay_cell.toFixed(2) : "N/A"}</td></tr>`).join("")}</tbody>`;
    const max = Math.max(...rows.map((item) => item.raw_bytes || 0), 1);
    els.sizeBars.innerHTML = rows.map((item, index) => {
      const width = Math.max(4, (item.raw_bytes / max) * 100);
      return `<div class="bar-row"><span>${math.escapeHtml(item.short_label || item.label)}</span><svg viewBox="0 0 100 12" aria-hidden="true"><rect width="100" height="12" rx="2"></rect><rect class="bar-fill fill-${index % 4}" width="${width.toFixed(2)}" height="12" rx="2"></rect></svg><b>${formatBytes(item.raw_bytes)}</b></div>`;
    }).join("");
  }


  function themeColors() {
    const root = getComputedStyle(document.documentElement);
    const read = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
    return {
      bg: read("--navy", "#071a2d"),
      panel: read("--panel", "#ffffff"),
      ink: read("--ink", "#172033"),
      muted: read("--muted", "#637083"),
      line: read("--line", "#c9d7e4"),
      teal: read("--teal", "#138f88"),
      cyan: read("--cyan", "#0ea5c6"),
      blue: read("--blue", "#1d5fa7"),
      orange: read("--orange", "#c65d21"),
      magenta: read("--magenta", "#a73383"),
      green: read("--green", "#1d7d45")
    };
  }

  function rgbParts(color) {
    const value = String(color).trim();
    const hex = value.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (hex) {
      const raw = hex[1].length === 3 ? hex[1].split("").map((c) => c + c).join("") : hex[1];
      return [0, 2, 4].map((i) => parseInt(raw.slice(i, i + 2), 16));
    }
    const rgb = value.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
    if (rgb) return [Number(rgb[1]), Number(rgb[2]), Number(rgb[3])];
    return [19, 143, 136];
  }

  function rgbaColor(color, alpha) {
    const [r, g, b] = rgbParts(color);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function blendColor(a, b, t) {
    const left = rgbParts(a);
    const right = rgbParts(b);
    const mix = left.map((value, index) => Math.round(value + (right[index] - value) * Math.max(0, Math.min(1, t))));
    return `rgb(${mix[0]}, ${mix[1]}, ${mix[2]})`;
  }

  function canvasMetrics(canvas, minHeight) {
    const rect = canvas.getBoundingClientRect();
    const cssWidth = Math.max(320, rect.width || canvas.clientWidth || canvas.width || 320);
    const cssHeight = Math.max(minHeight, rect.height || canvas.clientHeight || minHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const pixelWidth = Math.round(cssWidth * dpr);
    const pixelHeight = Math.round(cssHeight * dpr);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth;
      canvas.height = pixelHeight;
    }
    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, width: cssWidth, height: cssHeight };
  }

  function clearCanvas(ctx, width, height, colors) {
    const bg = ctx.createLinearGradient(0, 0, width, height);
    bg.addColorStop(0, rgbaColor(colors.bg, 0.96));
    bg.addColorStop(0.55, rgbaColor(colors.blue, 0.32));
    bg.addColorStop(1, rgbaColor(colors.teal, 0.24));
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = rgbaColor(colors.cyan, 0.16);
    ctx.lineWidth = 1;
    for (let x = -height; x < width + height; x += 44) {
      ctx.beginPath();
      ctx.moveTo(x, height);
      ctx.lineTo(x + height, 0);
      ctx.stroke();
    }
  }

  function surfaceYears(selectedYear, span) {
    const selectedIndex = math.YEARS.indexOf(selectedYear);
    const endIndex = selectedIndex >= 0 ? selectedIndex : math.YEARS.length - 1;
    const startIndex = Math.max(0, endIndex - span + 1);
    let years = math.YEARS.slice(startIndex, endIndex + 1);
    if (years.length < 2) years = math.YEARS.slice(0, Math.min(span, math.YEARS.length));
    return years;
  }

  function surfaceMetricValue(year, grade, step, input, mode) {
    if (mode === "base") return math.deriveFromAnchor(year, grade, step).base;
    const result = math.computePay(year, grade, step, input.localityPct, input.capValue, input.applyCap);
    return mode === "hourly" ? result.hourly : result.annual;
  }

  function surfaceMoney(value, mode) {
    return mode === "hourly" ? math.money2.format(value) : math.money0.format(value);
  }

  function surfaceLabel(mode) {
    if (mode === "base") return "Base pay";
    if (mode === "hourly") return "Hourly";
    return "Annual with locality/cap";
  }

  function polygon(ctx, points, fill, stroke, lineWidth = 1) {
    ctx.beginPath();
    points.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function renderPaySurface(input) {
    const canvas = els.paySurfaceCanvas;
    if (!canvas) return;
    const colors = themeColors();
    const { ctx, width, height } = canvasMetrics(canvas, 360);
    clearCanvas(ctx, width, height, colors);
    const mode = els.surfaceMode.value || "annual";
    const years = surfaceYears(input.year, Number(els.surfaceYearSpan.value) || 25);
    const grades = Array.from({ length: 15 }, (_, index) => index + 1);
    const values = years.map((year) => grades.map((grade) => surfaceMetricValue(year, grade, input.step, input, mode)));
    const flat = values.flat();
    const minValue = Math.min(...flat);
    const maxValue = Math.max(...flat);
    const span = Math.max(1, maxValue - minValue);
    const yaw = surfaceView.yaw * Math.PI / 180;
    const tilt = surfaceView.tilt * Math.PI / 180;
    const scale = Math.min(width * 0.34, height * 0.43);
    const centerX = width * 0.5;
    const baseY = height * 0.76;

    function project(ix, iz, value) {
      const xNorm = years.length <= 1 ? 0 : (ix / (years.length - 1) - 0.5) * 2.25;
      const zNorm = (iz / (grades.length - 1) - 0.5) * 1.5;
      const vNorm = (value - minValue) / span;
      const yNorm = 0.08 + vNorm * 1.26;
      const rx = xNorm * Math.cos(yaw) - zNorm * Math.sin(yaw);
      const rz = xNorm * Math.sin(yaw) + zNorm * Math.cos(yaw);
      return {
        x: centerX + rx * scale,
        y: baseY + rz * scale * Math.sin(tilt) - yNorm * height * 0.42,
        depth: rz + yNorm * 0.12,
        vNorm
      };
    }

    const cells = [];
    for (let ix = 0; ix < years.length - 1; ix += 1) {
      for (let iz = 0; iz < grades.length - 1; iz += 1) {
        const corners = [
          project(ix, iz, values[ix][iz]),
          project(ix + 1, iz, values[ix + 1][iz]),
          project(ix + 1, iz + 1, values[ix + 1][iz + 1]),
          project(ix, iz + 1, values[ix][iz + 1])
        ];
        const avg = (values[ix][iz] + values[ix + 1][iz] + values[ix + 1][iz + 1] + values[ix][iz + 1]) / 4;
        cells.push({ corners, value: avg, depth: corners.reduce((sum, point) => sum + point.depth, 0) / 4 });
      }
    }
    cells.sort((a, b) => a.depth - b.depth).forEach((cell) => {
      const t = (cell.value - minValue) / span;
      const fill = rgbaColor(blendColor(colors.blue, colors.orange, t), 0.78);
      polygon(ctx, cell.corners, fill, rgbaColor(colors.cyan, 0.38), 0.9);
    });

    const baseValue = minValue;
    const axisCorners = [project(0, 0, baseValue), project(years.length - 1, 0, baseValue), project(years.length - 1, grades.length - 1, baseValue), project(0, grades.length - 1, baseValue)];
    ctx.strokeStyle = rgbaColor(colors.ink, 0.75);
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    axisCorners.forEach((point, index) => index === 0 ? ctx.moveTo(point.x, point.y) : ctx.lineTo(point.x, point.y));
    ctx.closePath();
    ctx.stroke();

    const selectedYearIndex = Math.max(0, years.indexOf(input.year));
    const selectedGradeIndex = input.grade - 1;
    const selectedValue = surfaceMetricValue(input.year, input.grade, input.step, input, mode);
    const selectedPoint = project(selectedYearIndex >= 0 ? selectedYearIndex : years.length - 1, selectedGradeIndex, selectedValue);
    const floorPoint = project(selectedYearIndex >= 0 ? selectedYearIndex : years.length - 1, selectedGradeIndex, baseValue);
    ctx.strokeStyle = rgbaColor(colors.orange, 0.86);
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(floorPoint.x, floorPoint.y);
    ctx.lineTo(selectedPoint.x, selectedPoint.y);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.beginPath();
    ctx.arc(selectedPoint.x, selectedPoint.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = colors.orange;
    ctx.fill();
    ctx.strokeStyle = rgbaColor(colors.panel, 0.92);
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = "700 12px Segoe UI, system-ui, sans-serif";
    ctx.fillStyle = rgbaColor(colors.ink, 0.92);
    ctx.textAlign = "left";
    ctx.fillText(String(years[0]), Math.max(10, axisCorners[0].x - 18), Math.min(height - 14, axisCorners[0].y + 22));
    ctx.textAlign = "right";
    ctx.fillText(String(years[years.length - 1]), Math.min(width - 10, axisCorners[1].x + 18), Math.min(height - 14, axisCorners[1].y + 22));
    ctx.textAlign = "center";
    ctx.fillText("GS-15", axisCorners[2].x, Math.max(18, axisCorners[2].y - 8));
    ctx.fillText(`GS-${input.grade} / ${input.year}`, selectedPoint.x, Math.max(18, selectedPoint.y - 14));

    const gradeLow = surfaceMetricValue(input.year, 1, input.step, input, mode);
    const gradeHigh = surfaceMetricValue(input.year, 15, input.step, input, mode);
    const previousYearValue = math.YEARS.includes(input.year - 1) ? surfaceMetricValue(input.year - 1, input.grade, input.step, input, mode) : selectedValue;
    const raise = selectedValue - previousYearValue;
    setText(els.surfaceTitle, `${surfaceLabel(mode)} surface | Step ${input.step}`);
    setText(els.surfacePeak, surfaceMoney(maxValue, mode));
    setText(els.surfaceRange, `${years[0]}-${years[years.length - 1]} | GS-1 to GS-15`);
    setText(els.surfaceSelectedLabel, "Selected cell");
    setText(els.surfaceSelected, surfaceMoney(selectedValue, mode));
    setText(els.surfaceSpreadLabel, "Grade spread");
    setText(els.surfaceSpread, surfaceMoney(Math.abs(gradeHigh - gradeLow), mode));
    setText(els.surfaceRaise, `${raise >= 0 ? "+" : "-"}${surfaceMoney(Math.abs(raise), mode)}`);
    setText(els.surfaceCompare, surfaceMoney(maxValue - minValue, mode));
  }


  function careerYears(input) {
    const start = Math.min(input.earnStart, input.earnEnd);
    const end = Math.max(input.earnStart, input.earnEnd);
    return math.YEARS.filter((year) => year >= start && year <= end);
  }

  function scenarioPay(year, scenario) {
    return math.computePay(year, scenario.grade, scenario.step, scenario.localityPct, scenario.capValue, scenario.applyCap).annual;
  }

  function scenarioTotal(years, scenario) {
    return years.reduce((sum, year) => sum + scenarioPay(year, scenario), 0);
  }

  function careerScenarios(input) {
    const colors = themeColors();
    const baseScenario = {
      key: "base",
      label: "Base/COLA only",
      shortLabel: "Base only",
      grade: input.grade,
      step: input.step,
      localityPct: 0,
      capValue: NaN,
      applyCap: false,
      color: colors.green
    };
    const you = {
      key: "you",
      label: `You GS-${input.grade}/${input.step}`,
      shortLabel: "You",
      grade: input.grade,
      step: input.step,
      localityPct: input.localityPct,
      capValue: input.capValue,
      applyCap: input.applyCap,
      color: colors.orange,
      primary: true
    };
    if (input.compareMode === "steps") {
      const below = Math.max(1, input.step - 1);
      const above = Math.min(10, input.step + 1);
      return [
        baseScenario,
        { ...you, key: "belowStep", label: `Step ${below}`, shortLabel: `S${below}`, step: below, primary: false, color: colors.blue },
        { ...you, key: "aboveStep", label: `Step ${above}`, shortLabel: `S${above}`, step: above, primary: false, color: colors.magenta },
        you
      ];
    }
    if (input.compareMode === "locality") {
      const rus = localityAreaByCode(2026, "RUS");
      const areas = localityAreasForYear(2026);
      const maxArea = areas.reduce((best, area) => (!best || area.percentage > best.percentage ? area : best), null);
      const selectedLabel = input.localityArea ? input.localityArea.code : "Manual";
      return [
        baseScenario,
        { ...you, key: "rus", label: `RUS rate`, shortLabel: "RUS", localityPct: rus ? rus.percentage : 17.06, color: colors.blue, primary: false },
        { ...you, key: "maxLocality", label: maxArea ? `${maxArea.code} rate` : "High locality", shortLabel: maxArea ? maxArea.code : "High", localityPct: maxArea ? maxArea.percentage : input.localityPct, color: colors.magenta, primary: false },
        { ...you, label: `${selectedLabel} selected`, shortLabel: selectedLabel }
      ];
    }
    const lowerGrade = Math.max(1, input.grade - 1);
    const higherGrade = Math.min(15, input.grade + 1);
    return [
      baseScenario,
      { ...you, key: "lowerGrade", label: `GS-${lowerGrade}`, shortLabel: `GS-${lowerGrade}`, grade: lowerGrade, primary: false, color: colors.blue },
      { ...you, key: "higherGrade", label: `GS-${higherGrade}`, shortLabel: `GS-${higherGrade}`, grade: higherGrade, primary: false, color: colors.magenta },
      you
    ];
  }

  function drawCareerLabel(ctx, text, x, y, colors, align = "left") {
    const padX = 7;
    const metrics = ctx.measureText(text);
    const width = metrics.width + padX * 2;
    const height = 22;
    const left = align === "right" ? x - width : align === "center" ? x - width / 2 : x;
    ctx.fillStyle = rgbaColor(colors.bg, 0.78);
    ctx.strokeStyle = rgbaColor(colors.cyan, 0.32);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(left, y - height + 5, width, height, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = rgbaColor(colors.ink, 0.96);
    ctx.textAlign = align;
    ctx.fillText(text, x, y);
  }

  function renderCareerEarnings(input) {
    const canvas = els.paySurfaceCanvas;
    if (!canvas) return;
    const colors = themeColors();
    const { ctx, width, height } = canvasMetrics(canvas, 360);
    clearCanvas(ctx, width, height, colors);
    const years = careerYears(input);
    const scenarios = careerScenarios(input);
    const series = scenarios.map((scenario) => ({
      scenario,
      values: years.map((year) => scenarioPay(year, scenario)),
      total: scenarioTotal(years, scenario)
    }));
    const maxAnnual = Math.max(...series.flatMap((item) => item.values), 1);
    const maxTotal = Math.max(...series.map((item) => item.total), 1);
    const primary = series.find((item) => item.scenario.primary) || series[series.length - 1];
    const baseline = series.find((item) => item.scenario.key === "base") || series[0];
    const minTotal = Math.min(...series.map((item) => item.total));
    const yaw = surfaceView.yaw;
    const tilt = surfaceView.tilt;
    const depthMagnitude = (width > 720 ? 16 : 10) + (Math.abs(yaw) / 65) * (width > 720 ? 22 : 14);
    const depthX = (yaw < 0 ? -1 : 1) * depthMagnitude;
    const depthY = (width > 720 ? 7 : 5) + (tilt / 62) * (width > 720 ? 15 : 10);
    const depthFootprint = Math.abs(depthX) * (series.length - 1);
    const rightPad = (width > 760 ? 178 : 112) + Math.max(0, depthX) * 0.35;
    const leftPad = (width > 760 ? 70 : 44) + Math.max(0, -depthX) * (series.length - 1);
    const topPad = 38;
    const bottom = height - 50;
    const xSpan = Math.max(1, years.length - 1);
    const xStep = Math.max(7, (width - leftPad - rightPad - depthFootprint) / xSpan);
    const yScale = (height - topPad - 105) / maxAnnual;

    ctx.strokeStyle = rgbaColor(colors.cyan, 0.22);
    ctx.lineWidth = 1;
    for (let i = 0; i < years.length; i += Math.max(1, Math.ceil(years.length / 8))) {
      const x = leftPad + i * xStep;
      ctx.beginPath();
      ctx.moveTo(x, bottom + 8);
      ctx.lineTo(x + depthX * (series.length - 1), bottom - depthY * (series.length - 1) - 6);
      ctx.stroke();
    }
    for (let level = 0; level <= 4; level += 1) {
      const value = (maxAnnual * level) / 4;
      const y = bottom - value * yScale;
      ctx.beginPath();
      ctx.moveTo(leftPad - 12, y);
      ctx.lineTo(width - rightPad + depthX * (series.length - 1), y - depthY * (series.length - 1));
      ctx.stroke();
      if (level > 0) {
        ctx.fillStyle = rgbaColor(colors.ink, 0.82);
        ctx.font = "700 11px Segoe UI, system-ui, sans-serif";
        ctx.textAlign = "right";
        ctx.fillText(math.money0.format(value), leftPad - 16, y + 4);
      }
    }

    ctx.font = "700 12px Segoe UI, system-ui, sans-serif";
    for (let j = series.length - 1; j >= 0; j -= 1) {
      const item = series[j];
      const depthOffsetX = j * depthX;
      const depthOffsetY = j * depthY;
      const base = item.values.map((_value, index) => ({
        x: leftPad + index * xStep + depthOffsetX,
        y: bottom - depthOffsetY
      }));
      const top = item.values.map((value, index) => ({
        x: leftPad + index * xStep + depthOffsetX,
        y: bottom - depthOffsetY - Math.max(2, value * yScale)
      }));
      for (let i = 0; i < years.length - 1; i += 1) {
        const t = item.values[i] / maxAnnual;
        polygon(ctx, [base[i], base[i + 1], top[i + 1], top[i]], rgbaColor(blendColor(item.scenario.color, colors.panel, 0.18 + t * 0.18), item.scenario.primary ? 0.82 : 0.62), rgbaColor(item.scenario.color, item.scenario.primary ? 0.88 : 0.48), item.scenario.primary ? 1.4 : 0.9);
      }
      ctx.beginPath();
      top.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.strokeStyle = item.scenario.color;
      ctx.lineWidth = item.scenario.primary ? 4 : 2.5;
      ctx.stroke();
      const last = top[top.length - 1] || { x: leftPad + depthOffsetX, y: bottom - depthOffsetY };
      const label = `${item.scenario.shortLabel} ${math.money0.format(item.total)}`;
      drawCareerLabel(ctx, label, Math.min(width - 8, last.x + 12), Math.max(20, last.y - 2), colors);
    }

    const firstYear = years[0] || input.earnStart;
    const lastYear = years[years.length - 1] || input.earnEnd;
    ctx.fillStyle = rgbaColor(colors.ink, 0.9);
    ctx.font = "700 12px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(String(firstYear), leftPad, bottom + 28);
    ctx.textAlign = "right";
    ctx.fillText(String(lastYear), width - rightPad + depthX * (series.length - 1), bottom + 28 - depthY * (series.length - 1));

    const raise = primary.values.length > 1 ? primary.values[primary.values.length - 1] - primary.values[primary.values.length - 2] : 0;
    const previous = primary.values.length > 1 ? primary.values[primary.values.length - 2] : primary.values[0] || 0;
    const raisePct = previous ? (raise / previous) * 100 : 0;
    const lastPointX = leftPad + (years.length - 1) * xStep + (series.length - 1) * depthX;
    const lastPointY = bottom - (series.length - 1) * depthY - Math.max(2, (primary.values[primary.values.length - 1] || 0) * yScale);
    drawCareerLabel(ctx, `${lastYear} raise ${raise >= 0 ? "+" : "-"}${math.money0.format(Math.abs(raise))} (${raisePct >= 0 ? "+" : ""}${raisePct.toFixed(1)}%)`, Math.min(width - 8, lastPointX + 10), Math.max(20, lastPointY - 28), colors);

    setText(els.surfaceTitle, `${firstYear}-${lastYear} earnings | GS-${input.grade} Step ${input.step}`);
    setText(els.surfacePeak, math.money0.format(maxTotal));
    setText(els.surfaceRange, `${years.length} years | ${input.compareMode === "locality" ? "locality/base-only" : input.compareMode === "steps" ? "adjacent steps" : "adjacent grades"}`);
    setText(els.surfaceSelectedLabel, "Career total");
    setText(els.surfaceSelected, math.money0.format(primary.total));
    setText(els.surfaceSpreadLabel, "Vs base-only");
    setText(els.surfaceSpread, `${primary.total >= baseline.total ? "+" : "-"}${math.money0.format(Math.abs(primary.total - baseline.total))}`);
    setText(els.surfaceRaise, `${raise >= 0 ? "+" : "-"}${math.money0.format(Math.abs(raise))}`);
    setText(els.surfaceCompare, math.money0.format(maxTotal - minTotal));
  }

  function drawExtrudedBar(ctx, x, bottom, width, height, depth, color, colors) {
    const top = bottom - height;
    ctx.fillStyle = rgbaColor(color, 0.86);
    ctx.fillRect(x, top, width, height);
    polygon(ctx, [
      { x: x + width, y: top },
      { x: x + width + depth, y: top - depth },
      { x: x + width + depth, y: bottom - depth },
      { x: x + width, y: bottom }
    ], rgbaColor(color, 0.54), rgbaColor(colors.line, 0.55));
    polygon(ctx, [
      { x, y: top },
      { x: x + depth, y: top - depth },
      { x: x + width + depth, y: top - depth },
      { x: x + width, y: top }
    ], rgbaColor(color, 0.72), rgbaColor(colors.line, 0.55));
  }

  function renderLocalityLift(input) {
    const canvas = els.localityLiftCanvas;
    if (!canvas) return;
    const colors = themeColors();
    const { ctx, width, height } = canvasMetrics(canvas, 180);
    clearCanvas(ctx, width, height, colors);
    const base = math.computePay(input.year, input.grade, input.step, 0, NaN, false).annual;
    const selected = math.computePay(input.year, input.grade, input.step, input.localityPct, input.capValue, input.applyCap).annual;
    const areas = localityAreasForYear(input.year);
    const maxArea = areas.reduce((best, area) => (!best || area.percentage > best.percentage ? area : best), null);
    const scenarios = [
      { label: "Base", value: base, color: colors.blue },
      { label: input.localityArea ? input.localityArea.code : "Manual", value: selected, color: colors.orange }
    ];
    if (maxArea) {
      scenarios.push({ label: `Max ${maxArea.code}`, value: math.computePay(input.year, input.grade, input.step, maxArea.percentage, input.capValue, input.applyCap).annual, color: colors.magenta });
    }
    const maxValue = Math.max(...scenarios.map((item) => item.value), 1);
    const bottom = height - 34;
    const topPad = 28;
    const barW = Math.min(64, (width - 72) / scenarios.length - 18);
    const gap = (width - 42 - scenarios.length * barW) / Math.max(1, scenarios.length - 1);
    ctx.font = "700 12px Segoe UI, system-ui, sans-serif";
    scenarios.forEach((item, index) => {
      const x = 20 + index * (barW + gap);
      const h = Math.max(6, (item.value / maxValue) * (bottom - topPad));
      drawExtrudedBar(ctx, x, bottom, barW, h, 10, item.color, colors);
      ctx.fillStyle = rgbaColor(colors.ink, 0.92);
      ctx.textAlign = "center";
      ctx.fillText(item.label, x + barW / 2 + 4, bottom + 18);
      ctx.fillText(math.money0.format(item.value), x + barW / 2 + 4, Math.max(14, bottom - h - 16));
    });
  }

  function renderCapPressure(input) {
    const canvas = els.capPressureCanvas;
    if (!canvas) return;
    const colors = themeColors();
    const { ctx, width, height } = canvasMetrics(canvas, 180);
    clearCanvas(ctx, width, height, colors);
    const grades = Array.from({ length: 15 }, (_, index) => index + 1);
    const rows = grades.map((grade) => {
      const uncapped = math.computePay(input.year, grade, input.step, input.localityPct, input.capValue, false).localityRounded;
      const capped = math.computePay(input.year, grade, input.step, input.localityPct, input.capValue, input.applyCap);
      return { grade, uncapped, annual: capped.annual, capped: capped.capped };
    });
    const capValue = Number.isFinite(input.capValue) && input.capValue > 0 ? input.capValue : null;
    const maxValue = Math.max(...rows.map((row) => row.uncapped), capValue || 0, 1);
    const left = 22;
    const right = 18;
    const bottom = height - 32;
    const top = 24;
    const barW = Math.max(5, (width - left - right) / rows.length - 5);
    rows.forEach((row, index) => {
      const x = left + index * ((width - left - right) / rows.length);
      const h = Math.max(4, (row.annual / maxValue) * (bottom - top));
      drawExtrudedBar(ctx, x, bottom, barW, h, 5, row.capped ? colors.orange : colors.teal, colors);
      if (row.grade === 1 || row.grade === 8 || row.grade === 15) {
        ctx.fillStyle = rgbaColor(colors.ink, 0.88);
        ctx.font = "700 11px Segoe UI, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(`G${row.grade}`, x + barW / 2, bottom + 17);
      }
    });
    if (capValue) {
      const y = bottom - (capValue / maxValue) * (bottom - top);
      ctx.strokeStyle = rgbaColor(colors.orange, 0.92);
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 5]);
      ctx.beginPath();
      ctx.moveTo(left, y);
      ctx.lineTo(width - right, y);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = rgbaColor(colors.ink, 0.94);
      ctx.font = "700 12px Segoe UI, system-ui, sans-serif";
      ctx.textAlign = "left";
      const cappedCount = rows.filter((row) => row.capped).length;
      ctx.fillText(`Cap ${math.money0.format(capValue)} | ${cappedCount} capped`, left, Math.max(14, y - 8));
    } else {
      ctx.fillStyle = rgbaColor(colors.ink, 0.9);
      ctx.font = "700 12px Segoe UI, system-ui, sans-serif";
      ctx.fillText("No annual cap selected", left, top);
    }
  }

  function render3DLab(input) {
    if (els.surfaceMode.value === "career") renderCareerEarnings(input);
    else renderPaySurface(input);
    renderLocalityLift(input);
    renderCapPressure(input);
  }

  function renderSources() {
    els.sourceList.innerHTML = math.DATA.sources.sources.map((source) => {
      const title = math.escapeHtml(source.title);
      const note = math.escapeHtml(source.note);
      const link = source.url ? `<a href="${source.url}" rel="noreferrer">${title}</a>` : `<span>${title}</span>`;
      return `<li>${link}<p>${note}</p></li>`;
    }).join("");
  }

  function downloadJson(name, payload) {
    const blob = new Blob([JSON.stringify(payload, null, 2) + "\n"], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function renderAll() {
    const input = selectedInputs();
    const result = math.computePay(input.year, input.grade, input.step, input.localityPct, input.capValue, input.applyCap);
    const compare = math.computePay(input.compareYear, input.grade, input.step, 0, NaN, false);
    lastRecord = math.calculationRecord(result);
    lastRecord.inputs.locality_area = input.localityArea ? {
      code: input.localityArea.code,
      name: input.localityArea.name,
      percentage: input.localityArea.percentage
    } : null;
    renderSummary(result, compare);
    renderPayPicture(result);
    renderLocalityHighlights(input);
    renderTrace(result);
    renderSchedule(input.year, input.grade, input.step);
    renderChart(input.year, input.grade, input.step);
    renderInflation(input);
    renderLedger(input.grade, input.step);
    render3DLab(input);
  }

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    els.themeToggle.setAttribute("aria-pressed", theme === "dark" ? "true" : "false");
    els.themeToggle.textContent = theme === "dark" ? "Light" : "Dark";
    try {
      localStorage.setItem("ngs-theme", theme);
    } catch {
      /* Preference persistence is optional. */
    }
  }

  function initTheme() {
    let saved = "light";
    try {
      saved = localStorage.getItem("ngs-theme") || "light";
    } catch {
      saved = "light";
    }
    applyTheme(saved === "dark" ? "dark" : "light");
  }

  function bindEvents() {
    els.run.addEventListener("click", renderAll);
    els.reset.addEventListener("click", () => {
      els.year.value = "2026";
      els.compareYear.value = "1977";
      els.grade.value = "12";
      els.step.value = "10";
      fillLocalityAreas(2026, "RUS");
      syncLocalityFromArea();
      els.cap.value = "197200";
      els.applyCap.checked = true;
      els.surfaceMode.value = "career";
      els.earnStart.value = "2017";
      els.earnEnd.value = "2026";
      els.compareMode.value = "grades";
      els.surfaceYearSpan.value = "25";
      surfaceView.yaw = 34;
      surfaceView.tilt = 38;
      renderAll();
    });
    els.year.addEventListener("change", () => {
      setYearDefaults(Number(els.year.value));
      renderAll();
    });
    els.localityArea.addEventListener("change", () => {
      syncLocalityFromArea();
      renderAll();
    });
    els.locality.addEventListener("input", () => {
      syncAreaFromManualPercent();
      renderAll();
    });
    [els.grade, els.step, els.compareYear, els.cap, els.applyCap].forEach((el) => el.addEventListener("change", renderAll));
    [els.surfaceMode, els.earnStart, els.earnEnd, els.compareMode, els.surfaceYearSpan].forEach((el) => el.addEventListener("change", renderAll));
    els.scheduleTable.addEventListener("click", (event) => {
      const button = event.target.closest(".cell-button");
      if (!button) return;
      els.grade.value = button.dataset.grade;
      els.step.value = button.dataset.step;
      renderAll();
      $("calculator").scrollIntoView({ behavior: "smooth", block: "start" });
    });
    els.downloadRecord.addEventListener("click", () => {
      if (lastRecord) downloadJson(`N-GS-Pay-Math-Lab-${lastRecord.inputs.year}-GS${lastRecord.inputs.grade}-S${lastRecord.inputs.step}.json`, lastRecord);
    });
    els.printPage.addEventListener("click", () => window.print());
    els.themeToggle.addEventListener("click", () => {
      applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark");
      renderAll();
    });
    els.paySurfaceCanvas.addEventListener("pointerdown", (event) => {
      surfaceDrag.active = true;
      surfaceDrag.pointerId = event.pointerId;
      surfaceDrag.x = event.clientX;
      surfaceDrag.y = event.clientY;
      els.paySurfaceCanvas.setPointerCapture(event.pointerId);
    });
    els.paySurfaceCanvas.addEventListener("pointermove", (event) => {
      if (!surfaceDrag.active || event.pointerId !== surfaceDrag.pointerId) return;
      const dx = event.clientX - surfaceDrag.x;
      const dy = event.clientY - surfaceDrag.y;
      surfaceDrag.x = event.clientX;
      surfaceDrag.y = event.clientY;
      surfaceView.yaw = Math.round(clamp(surfaceView.yaw + dx * 0.35, -65, 65));
      surfaceView.tilt = Math.round(clamp(surfaceView.tilt - dy * 0.25, 18, 62));
      renderAll();
    });
    ["pointerup", "pointercancel", "pointerleave"].forEach((type) => {
      els.paySurfaceCanvas.addEventListener(type, (event) => {
        if (event.pointerId === surfaceDrag.pointerId && els.paySurfaceCanvas.hasPointerCapture(event.pointerId)) {
          els.paySurfaceCanvas.releasePointerCapture(event.pointerId);
        }
        surfaceDrag.active = false;
        surfaceDrag.pointerId = null;
      });
    });
    els.paySurfaceCanvas.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") surfaceView.yaw = Math.round(clamp(surfaceView.yaw - 3, -65, 65));
      else if (event.key === "ArrowRight") surfaceView.yaw = Math.round(clamp(surfaceView.yaw + 3, -65, 65));
      else if (event.key === "ArrowUp") surfaceView.tilt = Math.round(clamp(surfaceView.tilt + 3, 18, 62));
      else if (event.key === "ArrowDown") surfaceView.tilt = Math.round(clamp(surfaceView.tilt - 3, 18, 62));
      else return;
      event.preventDefault();
      renderAll();
    });
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(renderAll, 90);
    });
    els.menuToggle.addEventListener("click", () => {
      els.navDrawer.hidden = false;
      els.navDrawer.dataset.open = "true";
      els.drawerClose.focus();
    });
    els.drawerClose.addEventListener("click", () => {
      els.navDrawer.dataset.open = "false";
      els.navDrawer.hidden = true;
      els.menuToggle.focus();
    });
    els.navDrawer.addEventListener("click", (event) => {
      if (event.target.matches("a")) {
        els.navDrawer.dataset.open = "false";
        els.navDrawer.hidden = true;
      }
    });
  }

  fillControls();
  setYearDefaults(2026);
  initTheme();
  bindEvents();
  renderAudits();
  renderSizeLab();
  renderSources();
  renderAll();
})();
