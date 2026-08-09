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
    contextStart: $("contextStart"),
    contextEnd: $("contextEnd"),
    contextView: $("contextView"),
    contextSummary: $("contextSummary"),
    contextAvgRaise: $("contextAvgRaise"),
    contextRealAvg: $("contextRealAvg"),
    contextBestYear: $("contextBestYear"),
    contextToughYear: $("contextToughYear"),
    contextChartTitle: $("contextChartTitle"),
    contextCorrelation: $("contextCorrelation"),
    contextCorrelationNote: $("contextCorrelationNote"),
    contextChart: $("contextChart"),
    adminAverages: $("adminAverages"),
    partyAverages: $("partyAverages"),
    conflictAverages: $("conflictAverages"),
    contextTopYears: $("contextTopYears"),
    marketProxyNote: $("marketProxyNote"),
    contextWarning: $("contextWarning"),
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
    ratingProfile: $("ratingProfile"),
    surfaceYearSpan: $("surfaceYearSpan"),
    surfaceTitle: $("surfaceTitle"),
    surfacePeak: $("surfacePeak"),
    surfaceRange: $("surfaceRange"),
    surfaceSelectedLabel: $("surfaceSelectedLabel"),
    surfaceSelected: $("surfaceSelected"),
    surfaceSpreadLabel: $("surfaceSpreadLabel"),
    surfaceSpread: $("surfaceSpread"),
    surfaceRaise: $("surfaceRaise"),
    surfaceCompareLabel: $("surfaceCompareLabel"),
    surfaceCompare: $("surfaceCompare"),
    paySurfaceCanvas: $("paySurfaceCanvas"),
    localityLiftCanvas: $("localityLiftCanvas"),
    capPressureCanvas: $("capPressureCanvas"),
    raiseForecastCard: $("raiseForecastCard"),
    bestPresidentRaises: $("bestPresidentRaises"),
    worstPresidentRaises: $("worstPresidentRaises"),
    partyConflictMatrix: $("partyConflictMatrix"),
    raiseAnalogYears: $("raiseAnalogYears"),
    ratingOverlayNote: $("ratingOverlayNote"),
    localityMapState: $("localityMapState"),
    localityMapCounty: $("localityMapCounty"),
    localityMapFocus: $("localityMapFocus"),
    localityMapCanvas: $("localityMapCanvas"),
    localityMapTitle: $("localityMapTitle"),
    localityMapMetric: $("localityMapMetric"),
    localityMapMeta: $("localityMapMeta"),
    localityCountyDetail: $("localityCountyDetail"),
    localityMapSummary: $("localityMapSummary"),
    localityAreaChips: $("localityAreaChips"),
    sourceList: $("sourceList"),
    buildMeta: $("buildMeta")
  };

  let lastRecord = null;
  const surfaceDrag = { active: false, pointerId: null, x: 0, y: 0 };
  const surfaceView = { yaw: 34, tilt: 38 };
  let resizeTimer = null;
  let localityShapeCache = null;
  let localityMapTargets = [];

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

  function localityDefinitions() {
    const defs = math.DATA.localityDefinitions || {};
    return {
      areas: Array.isArray(defs.areas) ? defs.areas : [],
      counties: Array.isArray(defs.counties) ? defs.counties : [],
      year: defs.year || 2026
    };
  }

  function localityBoundaries() {
    const boundaries = math.DATA.localityBoundaries || {};
    return {
      counties: Array.isArray(boundaries.counties) ? boundaries.counties : [],
      boundaryYear: boundaries.boundary_year || 2025
    };
  }

  function localityShapes() {
    if (localityShapeCache) return localityShapeCache;
    const infoByFips = new Map(localityDefinitions().counties.map((county) => [county.fips, county]));
    localityShapeCache = localityBoundaries().counties.map((shape) => {
      const info = infoByFips.get(shape.fips) || {};
      return { ...shape, name: info.name || shape.fips, state_abbr: info.state_abbr || shape.state_abbr };
    }).filter((shape) => Array.isArray(shape.rings) && shape.rings.length);
    return localityShapeCache;
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

  function fillLocalityMapStates() {
    if (!els.localityMapState) return;
    const current = els.localityMapState.value;
    const states = Array.from(new Set(localityDefinitions().counties.map((county) => county.state_abbr).filter(Boolean))).sort();
    els.localityMapState.innerHTML = "";
    els.localityMapState.appendChild(option("All states", ""));
    states.forEach((state) => els.localityMapState.appendChild(option(state, state)));
    els.localityMapState.value = states.includes(current) ? current : "";
  }

  function fillLocalityCountyOptions(preferredFips) {
    if (!els.localityMapCounty) return;
    const state = els.localityMapState ? els.localityMapState.value : "";
    const current = preferredFips || els.localityMapCounty.value;
    const counties = localityDefinitions().counties
      .filter((county) => !state || county.state_abbr === state)
      .slice()
      .sort((a, b) => a.state_abbr.localeCompare(b.state_abbr) || a.name.localeCompare(b.name));
    els.localityMapCounty.innerHTML = "";
    els.localityMapCounty.appendChild(option(state ? `All ${state} counties` : "All counties", ""));
    counties.forEach((county) => {
      els.localityMapCounty.appendChild(option(`${county.name}, ${county.state_abbr} | ${county.locality_code}`, county.fips));
    });
    els.localityMapCounty.value = counties.some((county) => county.fips === current) ? current : "";
  }

  function selectedLocalityCounty() {
    if (!els.localityMapCounty || !els.localityMapCounty.value) return null;
    return localityDefinitions().counties.find((county) => county.fips === els.localityMapCounty.value) || null;
  }

  function fillControls() {
    math.YEARS.slice().reverse().forEach((year) => {
      els.year.appendChild(option(String(year), String(year)));
      els.compareYear.appendChild(option(String(year), String(year)));
    });
    math.YEARS.forEach((year) => {
      els.earnStart.appendChild(option(String(year), String(year)));
      els.earnEnd.appendChild(option(String(year), String(year)));
      if (els.contextStart) els.contextStart.appendChild(option(String(year), String(year)));
      if (els.contextEnd) els.contextEnd.appendChild(option(String(year), String(year)));
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
    if (els.contextStart) els.contextStart.value = "1977";
    if (els.contextEnd) els.contextEnd.value = "2026";
    fillLocalityAreas(2026, "RUS");
    syncLocalityFromArea();
    fillLocalityMapStates();
    fillLocalityCountyOptions();
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
      compareMode: els.compareMode.value || "grades",
      ratingProfile: els.ratingProfile ? els.ratingProfile.value : "successful"
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

  function federalContext() {
    return math.DATA.federalContext || {};
  }

  function contextYears() {
    const start = Math.min(Number(els.contextStart && els.contextStart.value) || 1977, Number(els.contextEnd && els.contextEnd.value) || 2026);
    const end = Math.max(Number(els.contextStart && els.contextStart.value) || 1977, Number(els.contextEnd && els.contextEnd.value) || 2026);
    return math.YEARS.filter((year) => year >= start && year <= end);
  }

  function administrationForYear(year) {
    const records = federalContext().administrations || [];
    return records.find((record) => year >= Number(record.start_year) && year <= Number(record.end_year || 9999)) || null;
  }

  function conflictsForYear(year) {
    const records = federalContext().conflict_eras || [];
    return records.filter((record) => year >= Number(record.start_year) && year <= Number(record.end_year));
  }

  function baseRaiseForYear(year) {
    const values = math.DATA.adjustments && math.DATA.adjustments.base_raise_percent;
    const value = values ? Number(values[String(year)]) : NaN;
    return Number.isFinite(value) ? value : null;
  }

  function cpiChangeForYear(year) {
    const current = cpiForYear(year);
    const previous = cpiForYear(year - 1);
    return current && previous ? ((current / previous) - 1) * 100 : null;
  }

  function marketProxyForYear(year) {
    const values = federalContext().market_proxy_by_year;
    const value = values ? Number(values[String(year)]) : NaN;
    return Number.isFinite(value) && value > 0 ? value : null;
  }

  function marketChangeForYear(year) {
    const current = marketProxyForYear(year);
    const previous = marketProxyForYear(year - 1);
    return current && previous ? ((current / previous) - 1) * 100 : null;
  }

  function contextPayForYear(year, input) {
    const view = els.contextView ? els.contextView.value : "selected";
    if (view === "gs1") return math.deriveFromAnchor(year, 1, 1).base;
    if (view === "gs15") return math.deriveFromAnchor(year, 15, 10).base;
    return math.deriveFromAnchor(year, input.grade, input.step).base;
  }

  function contextPayLabel(input) {
    const view = els.contextView ? els.contextView.value : "selected";
    if (view === "gs1") return "GS-1 Step 1";
    if (view === "gs15") return "GS-15 Step 10";
    return `GS-${input.grade} Step ${input.step}`;
  }

  function average(values) {
    const usable = values.filter((value) => Number.isFinite(value));
    return usable.length ? usable.reduce((sum, value) => sum + value, 0) / usable.length : null;
  }

  function pearson(pairs) {
    const usable = pairs.filter((pair) => Number.isFinite(pair.x) && Number.isFinite(pair.y));
    if (usable.length < 3) return null;
    const avgX = average(usable.map((pair) => pair.x));
    const avgY = average(usable.map((pair) => pair.y));
    const numerator = usable.reduce((sum, pair) => sum + (pair.x - avgX) * (pair.y - avgY), 0);
    const denomX = Math.sqrt(usable.reduce((sum, pair) => sum + (pair.x - avgX) ** 2, 0));
    const denomY = Math.sqrt(usable.reduce((sum, pair) => sum + (pair.y - avgY) ** 2, 0));
    return denomX && denomY ? numerator / (denomX * denomY) : null;
  }

  function contextRows(years, input) {
    return years.map((year) => {
      const raise = baseRaiseForYear(year);
      const cpi = cpiChangeForYear(year);
      const market = marketChangeForYear(year);
      const admin = administrationForYear(year);
      const conflicts = conflictsForYear(year);
      return {
        year,
        pay: contextPayForYear(year, input),
        raise,
        cpi,
        realRaise: Number.isFinite(raise) && Number.isFinite(cpi) ? raise - cpi : null,
        market,
        marketLevel: marketProxyForYear(year),
        admin,
        party: admin ? admin.party : "Unknown",
        president: admin ? admin.president : "Unknown",
        conflicts,
        conflictLabel: conflicts.length ? conflicts.map((item) => item.label).join(" + ") : "No listed conflict era"
      };
    });
  }

  function groupAverageRows(rows, keyFn) {
    const groups = new Map();
    rows.forEach((row) => {
      const key = keyFn(row);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(row);
    });
    return Array.from(groups.entries()).map(([key, items]) => ({
      key,
      count: items.length,
      raise: average(items.map((item) => item.raise)),
      cpi: average(items.map((item) => item.cpi)),
      realRaise: average(items.map((item) => item.realRaise)),
      market: average(items.map((item) => item.market))
    }));
  }

  function miniTable(rows, firstLabel) {
    if (!rows.length) return `<p class="fine-print">No rows for this span.</p>`;
    return `<table><thead><tr><th>${math.escapeHtml(firstLabel)}</th><th>Years</th><th>Raise</th><th>Real</th><th>Fed equity</th></tr></thead><tbody>${rows.map((row) => `<tr><td>${math.escapeHtml(row.key)}</td><td>${row.count}</td><td>${row.raise === null ? "N/A" : signedPercent(row.raise)}</td><td>${row.realRaise === null ? "N/A" : signedPoints(row.realRaise)}</td><td>${row.market === null ? "N/A" : signedPercent(row.market)}</td></tr>`).join("")}</tbody></table>`;
  }

  function indexedSeries(rows, valueFn) {
    const first = rows.map(valueFn).find((value) => Number.isFinite(value) && value > 0);
    return rows.map((row) => {
      const value = valueFn(row);
      return Number.isFinite(value) && first ? (value / first) * 100 : null;
    });
  }

  function renderContextChart(rows, input) {
    if (!els.contextChart) return;
    const years = rows.map((row) => row.year);
    if (years.length < 2) {
      els.contextChart.innerHTML = "";
      return;
    }
    const width = 1080;
    const height = 420;
    const margin = { left: 70, right: 30, top: 26, bottom: 58 };
    const innerW = width - margin.left - margin.right;
    const innerH = height - margin.top - margin.bottom;
    const pay = indexedSeries(rows, (row) => row.pay);
    const cpi = indexedSeries(rows, (row) => cpiForYear(row.year));
    const market = indexedSeries(rows, (row) => row.marketLevel);
    const allValues = pay.concat(cpi, market).filter((value) => Number.isFinite(value));
    const minValue = Math.min(...allValues, 80);
    const maxValue = Math.max(...allValues, 120);
    const pad = Math.max(8, (maxValue - minValue) * 0.08);
    const yMin = Math.max(0, minValue - pad);
    const yMax = maxValue + pad;
    const firstYear = years[0];
    const lastYear = years[years.length - 1];
    const x = (year) => margin.left + ((year - firstYear) / Math.max(1, lastYear - firstYear)) * innerW;
    const y = (value) => margin.top + (1 - (value - yMin) / Math.max(1, yMax - yMin)) * innerH;
    const pathFor = (series) => {
      let path = "";
      series.forEach((value, index) => {
        if (!Number.isFinite(value)) return;
        path += `${path ? "L" : "M"}${x(years[index]).toFixed(2)},${y(value).toFixed(2)}`;
      });
      return path;
    };
    let svg = "";
    const admins = [];
    rows.forEach((row) => {
      const previous = admins[admins.length - 1];
      const key = row.president + row.party;
      if (previous && previous.key === key) previous.end = row.year;
      else admins.push({ key, start: row.year, end: row.year, party: row.party, president: row.president });
    });
    admins.forEach((admin) => {
      const x1 = x(admin.start);
      const x2 = x(Math.min(lastYear, admin.end + 1));
      const klass = admin.party === "Democratic" ? "context-admin-dem" : "context-admin-rep";
      svg += `<rect class="${klass}" x="${x1.toFixed(2)}" y="${margin.top}" width="${Math.max(4, x2 - x1).toFixed(2)}" height="${innerH}"><title>${math.escapeHtml(admin.president)} | ${math.escapeHtml(admin.party)}</title></rect>`;
    });
    rows.filter((row) => row.conflicts.length).forEach((row) => {
      svg += `<rect class="context-conflict-band" x="${(x(row.year) - innerW / Math.max(1, years.length - 1) / 2).toFixed(2)}" y="${height - margin.bottom + 10}" width="${Math.max(4, innerW / Math.max(1, years.length - 1)).toFixed(2)}" height="12"><title>${row.year}: ${math.escapeHtml(row.conflictLabel)}</title></rect>`;
    });
    for (let i = 0; i <= 4; i += 1) {
      const value = yMin + ((yMax - yMin) * i) / 4;
      const yy = y(value);
      svg += `<line class="chart-grid" x1="${margin.left}" x2="${width - margin.right}" y1="${yy}" y2="${yy}"></line><text class="chart-axis" x="${margin.left - 10}" y="${yy + 4}" text-anchor="end">${value.toFixed(0)}</text>`;
    }
    years.forEach((year) => {
      if (year === firstYear || year === lastYear || year % 5 === 0) {
        svg += `<text class="chart-axis" x="${x(year)}" y="${height - 18}" text-anchor="middle">${year}</text>`;
      }
    });
    svg += `<path class="context-line pay" d="${pathFor(pay)}"></path>`;
    svg += `<path class="context-line cpi" d="${pathFor(cpi)}"></path>`;
    svg += `<path class="context-line market" d="${pathFor(market)}"></path>`;
    const active = rows.find((row) => row.year === input.year);
    if (active && active.year >= firstYear && active.year <= lastYear) {
      svg += `<line class="context-active-year" x1="${x(active.year)}" x2="${x(active.year)}" y1="${margin.top}" y2="${height - margin.bottom}"><title>Selected year ${active.year}</title></line>`;
    }
    svg += `<g class="context-legend"><line class="context-line pay" x1="${width - 360}" x2="${width - 318}" y1="30" y2="30"></line><text x="${width - 308}" y="34">${math.escapeHtml(contextPayLabel(input))}</text><line class="context-line cpi" x1="${width - 360}" x2="${width - 318}" y1="54" y2="54"></line><text x="${width - 308}" y="58">BLS CPI</text><line class="context-line market" x1="${width - 360}" x2="${width - 318}" y1="78" y2="78"></line><text x="${width - 308}" y="82">Fed Z.1 equities</text></g>`;
    els.contextChart.innerHTML = svg;
  }

  function renderHistoricalContext(input) {
    if (!els.contextChart) return;
    const years = contextYears();
    const rows = contextRows(years, input);
    const avgRaise = average(rows.map((row) => row.raise));
    const avgReal = average(rows.map((row) => row.realRaise));
    const best = rows.filter((row) => Number.isFinite(row.raise)).sort((a, b) => b.raise - a.raise)[0];
    const toughest = rows.filter((row) => Number.isFinite(row.realRaise)).sort((a, b) => a.realRaise - b.realRaise)[0];
    const selected = rows.find((row) => row.year === input.year) || contextRows([input.year], input)[0];
    const cpiCorrelation = pearson(rows.map((row) => ({ x: row.raise, y: row.cpi })));
    const marketCorrelation = pearson(rows.map((row) => ({ x: row.raise, y: row.market })));
    setText(els.contextSummary, `${contextPayLabel(input)} across ${years[0]}-${years[years.length - 1]}: base raises, BLS CPI, administration, VA conflict eras, and Federal Reserve Z.1 household corporate equities are shown together. Selected year context: ${selected.year} | ${selected.president} | ${selected.party}${selected.conflicts.length ? ` | ${selected.conflictLabel}` : ""}.`);
    setText(els.contextAvgRaise, avgRaise === null ? "N/A" : signedPercent(avgRaise));
    setText(els.contextRealAvg, avgReal === null ? "N/A" : signedPoints(avgReal));
    setText(els.contextBestYear, best ? `${best.year} | ${signedPercent(best.raise)}` : "N/A");
    setText(els.contextToughYear, toughest ? `${toughest.year} | ${signedPoints(toughest.realRaise)}` : "N/A");
    setText(els.contextChartTitle, `${contextPayLabel(input)} indexed against BLS CPI and Fed Z.1 equities`);
    setText(els.contextCorrelation, cpiCorrelation === null ? "N/A" : `CPI r ${cpiCorrelation.toFixed(2)}`);
    setText(els.contextCorrelationNote, marketCorrelation === null ? "Fed equity r N/A" : `Fed equity r ${marketCorrelation.toFixed(2)}`);
    renderContextChart(rows, input);
    const adminRows = groupAverageRows(rows, (row) => `${row.president} ${row.admin ? `${row.admin.start_year}-${row.admin.end_year}` : ""} (${row.party.slice(0, 3)})`);
    const partyRows = groupAverageRows(rows, (row) => row.party).sort((a, b) => a.key.localeCompare(b.key));
    const conflictRows = groupAverageRows(rows, (row) => row.conflicts.length ? "Listed conflict era" : "No listed conflict era");
    els.adminAverages.innerHTML = miniTable(adminRows, "Administration");
    els.partyAverages.innerHTML = miniTable(partyRows, "Party");
    els.conflictAverages.innerHTML = miniTable(conflictRows, "Era");
    const topRaise = rows.filter((row) => Number.isFinite(row.raise)).sort((a, b) => b.raise - a.raise).slice(0, 4);
    const weakReal = rows.filter((row) => Number.isFinite(row.realRaise)).sort((a, b) => a.realRaise - b.realRaise).slice(0, 4);
    els.contextTopYears.innerHTML = topRaise.map((row, index) => `<div class="rank-row"><span class="rank-index">#${index + 1}</span><span class="rank-main"><span class="rank-title">${row.year} base raise ${signedPercent(row.raise)}</span><span class="rank-meta">${math.escapeHtml(row.president)} | CPI ${row.cpi === null ? "N/A" : signedPercent(row.cpi)} | real ${row.realRaise === null ? "N/A" : signedPoints(row.realRaise)}</span></span><span class="rank-value">Top</span></div>`).join("") + weakReal.map((row) => `<div class="rank-row pressure-row"><span class="rank-index">--</span><span class="rank-main"><span class="rank-title">${row.year} pressure year</span><span class="rank-meta">Raise ${signedPercent(row.raise)} | CPI ${signedPercent(row.cpi)} | ${math.escapeHtml(row.president)}</span></span><span class="rank-value">${signedPoints(row.realRaise)}</span></div>`).join("");
    const marketLatest = federalContext().market_proxy_latest_complete_year || "latest complete year";
    setText(els.marketProxyNote, `Market proxy: Federal Reserve Z.1 series ${federalContext().market_proxy_series || "LM153064105.Q"}, household/nonprofit corporate equities. Q4 values are complete through ${marketLatest}; 2026 is partial if shown. Dow Jones index history is excluded under the federal-.gov-only source rule.`);
    setText(els.contextWarning, federalContext().notes ? `${federalContext().notes.pay_year_mapping} ${federalContext().notes.correlation_warning}` : "Correlations are descriptive, not causal.");
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


  function themeColors(source = document.documentElement) {
    const root = getComputedStyle(source || document.documentElement);
    const read = (name, fallback) => root.getPropertyValue(name).trim() || fallback;
    return {
      bg: read("--panel-soft", "#f4f7fa"),
      panel: read("--panel", "#ffffff"),
      ink: read("--ink", "#172033"),
      muted: read("--muted", "#637083"),
      line: read("--line", "#c9d7e4"),
      teal: read("--teal", "#138f88"),
      cyan: read("--cyan", "#0ea5c6"),
      blue: read("--blue", "#1d5fa7"),
      orange: read("--orange", "#c65d21"),
      magenta: read("--magenta", "#a73383"),
      green: read("--green", "#1d7d45"),
      red: read("--red", "#b91c1c")
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
    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, colors.panel);
    bg.addColorStop(1, colors.bg);
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const wash = ctx.createLinearGradient(0, 0, width, 0);
    wash.addColorStop(0, rgbaColor(colors.blue, 0.04));
    wash.addColorStop(0.5, rgbaColor(colors.cyan, 0.025));
    wash.addColorStop(1, rgbaColor(colors.teal, 0.04));
    ctx.fillStyle = wash;
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = rgbaColor(colors.line, 0.42);
    ctx.lineWidth = 1;
    for (let y = 48; y < height; y += 56) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
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
    const colors = themeColors(canvas);
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
    setText(els.surfaceCompareLabel, "Range spread");
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

  function careerScenarios(input, colors = themeColors()) {
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

  function finiteRaiseRows(input) {
    return contextRows(math.YEARS, input).filter((row) => row.year > math.YEARS[0] && Number.isFinite(row.raise));
  }

  function rowHasConflict(row) {
    return Array.isArray(row.conflicts) && row.conflicts.length > 0;
  }

  function similarityScore(value, target, scale) {
    if (!Number.isFinite(value) || !Number.isFinite(target)) return 0;
    return 1 / (1 + Math.abs(value - target) / Math.max(0.1, scale));
  }

  function weightedAverageItems(items) {
    const usable = items.filter((item) => Number.isFinite(item.value) && Number.isFinite(item.weight) && item.weight > 0);
    const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0);
    return totalWeight ? usable.reduce((sum, item) => sum + item.value * item.weight, 0) / totalWeight : null;
  }

  function weightedShare(items, predicate) {
    const usable = items.filter((item) => Number.isFinite(item.weight) && item.weight > 0);
    const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0);
    return totalWeight ? usable.filter(predicate).reduce((sum, item) => sum + item.weight, 0) / totalWeight : null;
  }

  function weightedQuantileItems(items, quantile) {
    const usable = items
      .filter((item) => Number.isFinite(item.value) && Number.isFinite(item.weight) && item.weight > 0)
      .sort((a, b) => a.value - b.value);
    const totalWeight = usable.reduce((sum, item) => sum + item.weight, 0);
    if (!totalWeight) return null;
    let running = 0;
    for (const item of usable) {
      running += item.weight;
      if (running / totalWeight >= quantile) return item.value;
    }
    return usable[usable.length - 1].value;
  }

  function raiseForecast(input) {
    const rows = finiteRaiseRows(input);
    const latestYear = math.YEARS[math.YEARS.length - 1];
    const targetYear = latestYear + 1;
    const currentAdmin = administrationForYear(latestYear);
    const currentParty = currentAdmin ? currentAdmin.party : "Unknown";
    const currentConflict = conflictsForYear(latestYear).length > 0;
    const latestCompletedCpiYear = latestCpiYear();
    const targetCpi = latestCompletedCpiYear ? cpiChangeForYear(latestCompletedCpiYear) : null;
    const priorRaise = baseRaiseForYear(latestYear);
    const latestMarketYear = Number(federalContext().market_proxy_latest_complete_year) || latestYear;
    const targetMarket = marketChangeForYear(latestMarketYear);
    const analogs = rows.map((row) => {
      const rowPriorRaise = baseRaiseForYear(row.year - 1);
      const rowPriorCpi = cpiChangeForYear(row.year - 1);
      const rowPriorMarket = marketChangeForYear(row.year - 1);
      let weight = 1;
      if (row.party === currentParty) weight += 1.15;
      if (rowHasConflict(row) === currentConflict) weight += 0.85;
      weight += similarityScore(rowPriorRaise, priorRaise, 1.25);
      weight += similarityScore(rowPriorCpi, targetCpi, 1.75);
      weight += similarityScore(rowPriorMarket, targetMarket, 12);
      return { ...row, value: row.raise, weight, rowPriorRaise, rowPriorCpi, rowPriorMarket };
    }).sort((a, b) => b.weight - a.weight || Math.abs((a.raise || 0) - (priorRaise || 0)) - Math.abs((b.raise || 0) - (priorRaise || 0)));
    const weightedItems = analogs.map((row) => ({ value: row.raise, weight: row.weight, row }));
    const mean = weightedAverageItems(weightedItems);
    const median = weightedQuantileItems(weightedItems, 0.5);
    const low = weightedQuantileItems(weightedItems, 0.2);
    const high = weightedQuantileItems(weightedItems, 0.8);
    return {
      targetYear,
      currentParty,
      currentConflict,
      targetCpi,
      priorRaise,
      targetMarket,
      mean,
      median,
      low,
      high,
      freeze: weightedShare(weightedItems, (item) => item.value <= 0.5),
      lowRaise: weightedShare(weightedItems, (item) => item.value > 0.5 && item.value <= 2),
      steady: weightedShare(weightedItems, (item) => item.value > 2 && item.value <= 4),
      highRaise: weightedShare(weightedItems, (item) => item.value > 4),
      analogs: analogs.slice(0, 6)
    };
  }

  function ratingOverlay(input) {
    const current = math.computePay(input.year, input.grade, input.step, input.localityPct, input.capValue, input.applyCap).annual;
    const nextStep = input.step < 10 ? math.computePay(input.year, input.grade, input.step + 1, input.localityPct, input.capValue, input.applyCap).annual : current;
    const stepDelta = Math.max(0, nextStep - current);
    if (input.ratingProfile === "outstanding") {
      return {
        amount: stepDelta,
        label: "Outstanding",
        note: stepDelta > 0 ? `Rating does not change the government-wide GS raise. This overlays a possible quality-step scenario worth ${math.money0.format(stepDelta)} annually for the selected pay cell.` : "Rating does not change the government-wide GS raise. Step 10 has no next-step amount to overlay."
      };
    }
    if (input.ratingProfile === "excellent") {
      return {
        amount: stepDelta ? stepDelta * 0.5 : 0,
        label: "Excellent",
        note: stepDelta > 0 ? `Rating does not change the government-wide GS raise. This shows half of the next-step amount (${math.money0.format(stepDelta)}) as a planning sensitivity only.` : "Rating does not change the government-wide GS raise. Step 10 has no next-step amount to overlay."
      };
    }
    return {
      amount: 0,
      label: "Successful",
      note: "Rating does not change the government-wide GS base raise. No personal step or quality-step overlay is added for this profile."
    };
  }

  function administrationRaiseTable(rows, sortFn) {
    const grouped = groupAverageRows(rows, (row) => `${row.president} ${row.admin ? `${row.admin.start_year}-${row.admin.end_year}` : ""} (${row.party.slice(0, 3)})`)
      .filter((row) => row.raise !== null)
      .sort(sortFn)
      .slice(0, 6);
    return miniTable(grouped, "Administration");
  }

  function renderRaisePanels(input) {
    if (!els.raiseForecastCard) return;
    const rows = finiteRaiseRows(input);
    const forecast = raiseForecast(input);
    const pctText = (value) => value === null ? "N/A" : `${(value * 100).toFixed(0)}%`;
    els.raiseForecastCard.innerHTML = `<h3>${forecast.targetYear} raise analog estimate</h3><div class="forecast-grid"><div><span>Weighted median</span><strong>${forecast.median === null ? "N/A" : signedPercent(forecast.median)}</strong></div><div><span>Weighted mean</span><strong>${forecast.mean === null ? "N/A" : signedPercent(forecast.mean)}</strong></div><div><span>Middle band</span><strong>${forecast.low === null || forecast.high === null ? "N/A" : `${signedPercent(forecast.low)} to ${signedPercent(forecast.high)}`}</strong></div><div><span>Input profile</span><strong>${math.escapeHtml(forecast.currentParty)}${forecast.currentConflict ? " + conflict" : ""}</strong></div></div><div class="probability-row"><span>Freeze ${pctText(forecast.freeze)}</span><span>0.5-2% ${pctText(forecast.lowRaise)}</span><span>2-4% ${pctText(forecast.steady)}</span><span>4%+ ${pctText(forecast.highRaise)}</span></div><p class="fine-print">Descriptive historical analog only: party, listed VA conflict era, prior base raise, BLS CPI pressure, and Federal Reserve Z.1 market proxy. This is not an OPM forecast.</p>`;
    if (els.bestPresidentRaises) els.bestPresidentRaises.innerHTML = administrationRaiseTable(rows, (a, b) => b.raise - a.raise);
    if (els.worstPresidentRaises) els.worstPresidentRaises.innerHTML = administrationRaiseTable(rows, (a, b) => (a.realRaise ?? 999) - (b.realRaise ?? 999));
    if (els.partyConflictMatrix) {
      const matrix = groupAverageRows(rows, (row) => `${row.party} | ${rowHasConflict(row) ? "listed conflict" : "no listed conflict"}`)
        .sort((a, b) => a.key.localeCompare(b.key));
      els.partyConflictMatrix.innerHTML = miniTable(matrix, "Profile");
    }
    if (els.raiseAnalogYears) {
      els.raiseAnalogYears.innerHTML = forecast.analogs.map((row, index) => `<div class="rank-row"><span class="rank-index">#${index + 1}</span><span class="rank-main"><span class="rank-title">${row.year} | ${signedPercent(row.raise)} raise</span><span class="rank-meta">${math.escapeHtml(row.president)} | ${math.escapeHtml(row.party)} | CPI ${row.cpi === null ? "N/A" : signedPercent(row.cpi)} | prior ${row.rowPriorRaise === null ? "N/A" : signedPercent(row.rowPriorRaise)} | ${rowHasConflict(row) ? math.escapeHtml(row.conflictLabel) : "no listed conflict"}</span></span><span class="rank-value">${row.weight.toFixed(1)}x</span></div>`).join("");
    }
    const rating = ratingOverlay(input);
    setText(els.ratingOverlayNote, rating.note);
  }

  function drawCanvasLine(ctx, points, color, lineWidth) {
    const usable = points.filter((point) => Number.isFinite(point.y));
    if (usable.length < 2) return;
    ctx.beginPath();
    usable.forEach((point, index) => {
      if (index === 0) ctx.moveTo(point.x, point.y);
      else ctx.lineTo(point.x, point.y);
    });
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.stroke();
  }

  function pressureColor(realRaise, colors) {
    if (!Number.isFinite(realRaise)) return rgbaColor(colors.muted, 0.65);
    if (realRaise >= 1) return rgbaColor(colors.green, 0.88);
    if (realRaise >= -1) return rgbaColor(colors.teal, 0.86);
    if (realRaise >= -3) return rgbaColor(colors.orange, 0.88);
    return rgbaColor(colors.red, 0.88);
  }

  function renderCareerEarnings(input) {
    const canvas = els.paySurfaceCanvas;
    if (!canvas) return;
    const colors = themeColors(canvas);
    const { ctx, width, height } = canvasMetrics(canvas, 390);
    clearCanvas(ctx, width, height, colors);
    const years = careerYears(input);
    const scenarios = careerScenarios(input, colors);
    const series = scenarios.map((scenario) => ({
      scenario,
      values: years.map((year) => scenarioPay(year, scenario)),
      total: scenarioTotal(years, scenario)
    }));
    const primary = series.find((item) => item.scenario.primary) || series[series.length - 1];
    const baseline = series.find((item) => item.scenario.key === "base") || series[0];
    const startYear = years[0] || input.earnStart;
    const endYear = years[years.length - 1] || input.earnEnd;
    const cpiBaseYear = cpiComparableYear(startYear);
    const cpiBase = cpiBaseYear ? cpiForYear(cpiBaseYear) : null;
    const startPay = primary.values[0] || 0;
    const cpiTargets = years.map((year) => cpiBase && cpiForYear(year) ? startPay * (cpiForYear(year) / cpiBase) : null);
    const allValues = primary.values.concat(cpiTargets).filter((value) => Number.isFinite(value));
    const minValue = Math.min(...allValues, startPay, 0);
    const maxValue = Math.max(...allValues, 1);
    const pad = Math.max(800, (maxValue - minValue) * 0.08);
    const yMin = Math.max(0, minValue - pad);
    const yMax = maxValue + pad;
    const margin = { left: width > 720 ? 82 : 54, right: 32, top: 42, bottom: 108 };
    const innerW = Math.max(1, width - margin.left - margin.right);
    const innerH = Math.max(1, height - margin.top - margin.bottom);
    const xFor = (year) => margin.left + ((year - startYear) / Math.max(1, endYear - startYear)) * innerW;
    const yFor = (value) => margin.top + (1 - (value - yMin) / Math.max(1, yMax - yMin)) * innerH;

    ctx.fillStyle = rgbaColor(colors.panel, 0.9);
    ctx.strokeStyle = rgbaColor(colors.line, 0.75);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(margin.left - 12, margin.top - 18, innerW + 24, innerH + 34, 8);
    ctx.fill();
    ctx.stroke();

    const adminBands = [];
    years.forEach((year) => {
      const admin = administrationForYear(year);
      const key = admin ? `${admin.president}-${admin.party}` : "Unknown";
      const previous = adminBands[adminBands.length - 1];
      if (previous && previous.key === key) previous.end = year;
      else adminBands.push({ key, start: year, end: year, party: admin ? admin.party : "Unknown", president: admin ? admin.president : "Unknown" });
    });
    adminBands.forEach((band) => {
      const x1 = xFor(band.start);
      const x2 = xFor(Math.min(endYear, band.end + 1));
      ctx.fillStyle = band.party === "Democratic" ? rgbaColor(colors.blue, 0.13) : rgbaColor(colors.orange, 0.13);
      ctx.fillRect(x1, margin.top - 18, Math.max(4, x2 - x1), innerH + 34);
      ctx.fillStyle = rgbaColor(colors.ink, 0.66);
      ctx.font = "700 11px Segoe UI, system-ui, sans-serif";
      ctx.textAlign = "left";
      if (x2 - x1 > 74) ctx.fillText(band.president.split(" ").slice(-1)[0], x1 + 6, margin.top + 2);
    });

    ctx.strokeStyle = rgbaColor(colors.line, 0.8);
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i += 1) {
      const value = yMin + ((yMax - yMin) * i) / 4;
      const y = yFor(value);
      ctx.beginPath();
      ctx.moveTo(margin.left, y);
      ctx.lineTo(width - margin.right, y);
      ctx.stroke();
      ctx.fillStyle = rgbaColor(colors.ink, 0.82);
      ctx.font = "700 11px Segoe UI, system-ui, sans-serif";
      ctx.textAlign = "right";
      ctx.fillText(math.money0.format(value), margin.left - 18, y + 4);
    }

    const payPoints = years.map((year, index) => ({ x: xFor(year), y: yFor(primary.values[index]), value: primary.values[index], year }));
    const cpiPoints = years.map((year, index) => ({ x: xFor(year), y: cpiTargets[index] === null ? NaN : yFor(cpiTargets[index]), value: cpiTargets[index], year }));
    if (payPoints.length > 1) {
      ctx.beginPath();
      payPoints.forEach((point, index) => {
        if (index === 0) ctx.moveTo(point.x, point.y);
        else ctx.lineTo(point.x, point.y);
      });
      ctx.lineTo(payPoints[payPoints.length - 1].x, margin.top + innerH);
      ctx.lineTo(payPoints[0].x, margin.top + innerH);
      ctx.closePath();
      ctx.fillStyle = rgbaColor(colors.teal, 0.16);
      ctx.fill();
    }
    drawCanvasLine(ctx, cpiPoints, rgbaColor(colors.red, 0.9), 3);
    drawCanvasLine(ctx, payPoints, rgbaColor(colors.blue, 0.96), 4);

    const raiseRows = contextRows(years, input);
    const barMid = height - 66;
    const barScale = 5;
    raiseRows.forEach((row) => {
      const x = xFor(row.year);
      const real = row.realRaise;
      const h = Number.isFinite(real) ? clamp(Math.abs(real) * barScale, 3, 42) : 3;
      const y = Number.isFinite(real) && real >= 0 ? barMid - h : barMid;
      ctx.fillStyle = pressureColor(real, colors);
      ctx.fillRect(x - 4, y, 8, h);
      if (rowHasConflict(row)) {
        ctx.fillStyle = rgbaColor(colors.red, 0.9);
        ctx.fillRect(x - 3, height - 32, 6, 12);
      }
    });
    ctx.strokeStyle = rgbaColor(colors.ink, 0.5);
    ctx.beginPath();
    ctx.moveTo(margin.left, barMid);
    ctx.lineTo(width - margin.right, barMid);
    ctx.stroke();

    years.forEach((year) => {
      if (year === startYear || year === endYear || year % 5 === 0) {
        ctx.fillStyle = rgbaColor(colors.ink, 0.84);
        ctx.font = "700 11px Segoe UI, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.fillText(String(year), xFor(year), height - 14);
      }
    });
    const lastPoint = payPoints[payPoints.length - 1];
    if (lastPoint) {
      ctx.fillStyle = colors.blue;
      ctx.beginPath();
      ctx.arc(lastPoint.x, lastPoint.y, 6, 0, Math.PI * 2);
      ctx.fill();
      drawCareerLabel(ctx, `${endYear} ${math.money0.format(lastPoint.value)}`, Math.min(width - 8, lastPoint.x + 12), Math.max(24, lastPoint.y - 10), colors);
    }
    ctx.fillStyle = rgbaColor(colors.ink, 0.9);
    ctx.font = "800 12px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("Selected annual pay", margin.left, 24);
    ctx.fillStyle = rgbaColor(colors.red, 0.92);
    ctx.fillText("BLS CPI target", margin.left + 156, 24);
    ctx.fillStyle = rgbaColor(colors.ink, 0.78);
    ctx.fillText("Real raise bars below: green ahead of CPI, red behind; bottom ticks mark VA-listed conflict eras", margin.left, height - 84);

    const forecast = raiseForecast(input);
    const rating = ratingOverlay(input);
    const lastRaise = baseRaiseForYear(input.year);
    setText(els.surfaceTitle, `${startYear}-${endYear} raise intelligence | GS-${input.grade} Step ${input.step}`);
    setText(els.surfacePeak, forecast.median === null ? "N/A" : signedPercent(forecast.median));
    setText(els.surfaceRange, `${forecast.targetYear} analog | ${forecast.low === null || forecast.high === null ? "band N/A" : `${signedPercent(forecast.low)} to ${signedPercent(forecast.high)}`}`);
    setText(els.surfaceSelectedLabel, "Career total");
    setText(els.surfaceSelected, math.money0.format(primary.total));
    setText(els.surfaceSpreadLabel, "Vs base-only");
    setText(els.surfaceSpread, `${primary.total >= baseline.total ? "+" : "-"}${math.money0.format(Math.abs(primary.total - baseline.total))}`);
    setText(els.surfaceRaise, lastRaise === null ? "N/A" : signedPercent(lastRaise));
    setText(els.surfaceCompareLabel, "Rating overlay");
    setText(els.surfaceCompare, math.money0.format(rating.amount));
    renderRaisePanels(input);
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
    const colors = themeColors(canvas);
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
    const colors = themeColors(canvas);
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

  function localityPointColor(percent, colors) {
    const t = clamp((Number(percent) - 17.06) / Math.max(1, 46.34 - 17.06), 0, 1);
    if (t < 0.5) return blendColor(colors.blue, colors.teal, t * 2);
    return blendColor(colors.teal, colors.orange, (t - 0.5) * 2);
  }

  function boundaryRegionKey(shape) {
    if (shape.state_abbr === "AK") return "AK";
    if (shape.state_abbr === "HI") return "HI";
    if (shape.state_abbr === "PR") return "PR";
    return "CONUS";
  }

  function boundaryBounds(shapes) {
    const box = { minLon: Infinity, minLat: Infinity, maxLon: -Infinity, maxLat: -Infinity };
    shapes.forEach((shape) => {
      const bbox = shape.bbox || [];
      box.minLon = Math.min(box.minLon, Number(bbox[0]));
      box.minLat = Math.min(box.minLat, Number(bbox[1]));
      box.maxLon = Math.max(box.maxLon, Number(bbox[2]));
      box.maxLat = Math.max(box.maxLat, Number(bbox[3]));
    });
    return box;
  }

  function mapProjection(bounds, box) {
    const lonSpan = Math.max(0.01, bounds.maxLon - bounds.minLon);
    const latSpan = Math.max(0.01, bounds.maxLat - bounds.minLat);
    const scale = Math.min(box.w / lonSpan, box.h / latSpan);
    const drawW = lonSpan * scale;
    const drawH = latSpan * scale;
    const offsetX = box.x + (box.w - drawW) / 2;
    const offsetY = box.y + (box.h - drawH) / 2;
    return (lon, lat) => ({
      x: offsetX + (lon - bounds.minLon) * scale,
      y: offsetY + (bounds.maxLat - lat) * scale
    });
  }

  function countyFill(shape, selectedCode, highCodes, focus, colors) {
    const isRus = shape.locality_code === "RUS";
    const selectedLocality = selectedCode && shape.locality_code === selectedCode;
    let strong = selectedLocality && selectedCode !== "RUS";
    if (focus === "all") strong = true;
    if (focus === "highest") strong = highCodes.has(shape.locality_code);
    if (focus === "not-rus") strong = !isRus;
    if (focus === "selected" && selectedCode === "RUS") strong = !isRus;
    const color = isRus ? blendColor(colors.line, colors.blue, 0.18) : localityPointColor(shape.locality_percent, colors);
    return rgbaColor(color, strong ? 0.88 : isRus ? 0.24 : 0.48);
  }

  function drawCountyShape(ctx, shape, project, fill, stroke, lineWidth) {
    ctx.beginPath();
    shape.rings.forEach((ring) => {
      ring.forEach((point, index) => {
        const projected = project(Number(point[0]), Number(point[1]));
        if (index === 0) ctx.moveTo(projected.x, projected.y);
        else ctx.lineTo(projected.x, projected.y);
      });
      ctx.closePath();
    });
    ctx.fillStyle = fill;
    ctx.fill("evenodd");
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
  }

  function regionBoxes(width, height) {
    return {
      CONUS: { x: 18, y: 22, w: width * 0.72, h: height - 54, label: "Lower 48 + DC" },
      AK: { x: width * 0.73, y: height * 0.54, w: width * 0.24, h: height * 0.34, label: "Alaska" },
      HI: { x: width * 0.73, y: height * 0.27, w: width * 0.11, h: height * 0.18, label: "Hawaii" },
      PR: { x: width * 0.86, y: height * 0.27, w: width * 0.11, h: height * 0.18, label: "Puerto Rico" }
    };
  }

  function renderRegionFrame(ctx, box, colors) {
    ctx.strokeStyle = rgbaColor(colors.line, 0.82);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(box.x, box.y, box.w, box.h, 7);
    ctx.stroke();
    ctx.fillStyle = rgbaColor(colors.ink, 0.78);
    ctx.font = "800 11px Segoe UI, system-ui, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(box.label, box.x + 8, box.y + 16);
  }

  function renderLocalityMap(input) {
    const canvas = els.localityMapCanvas;
    if (!canvas) return;
    const defs = localityDefinitions();
    const shapes = localityShapes();
    const colors = themeColors(canvas);
    const { ctx, width, height } = canvasMetrics(canvas, 330);
    clearCanvas(ctx, width, height, colors);
    localityMapTargets = [];
    if (!shapes.length) {
      setText(els.localityMapMetric, "No polygons");
      setText(els.localityMapMeta, "Census boundaries missing");
      setText(els.localityMapSummary, "No Census county boundary polygons are loaded.");
      setText(els.localityCountyDetail, "No county geometry loaded.");
      if (els.localityAreaChips) els.localityAreaChips.innerHTML = "";
      return;
    }

    const state = els.localityMapState ? els.localityMapState.value : "";
    const selectedCounty = selectedLocalityCounty();
    const focus = els.localityMapFocus ? els.localityMapFocus.value : "selected";
    const areaByCode = new Map(defs.areas.map((area) => [area.code, area]));
    const countyByFips = new Map(defs.counties.map((county) => [county.fips, county]));
    const highCodes = new Set(defs.areas.slice().sort((a, b) => Number(b.percentage) - Number(a.percentage)).slice(0, 8).map((area) => area.code));
    const selectedCode = selectedCounty ? selectedCounty.locality_code : (input.localityArea ? input.localityArea.code : null);
    const visible = shapes.filter((shape) => !state || shape.state_abbr === state);
    const boxes = regionBoxes(width, height);
    const groups = new Map();
    visible.forEach((shape) => {
      const key = state ? "SELECTED" : boundaryRegionKey(shape);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(shape);
    });
    if (state) boxes.SELECTED = { x: 18, y: 20, w: width - 36, h: height - 44, label: state };

    ctx.fillStyle = rgbaColor(colors.panel, 0.93);
    ctx.strokeStyle = rgbaColor(colors.line, 0.72);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(8, 8, width - 16, height - 16, 8);
    ctx.fill();
    ctx.stroke();

    groups.forEach((items, key) => {
      const box = boxes[key];
      if (!box || !items.length) return;
      renderRegionFrame(ctx, box, colors);
      const project = mapProjection(boundaryBounds(items), { x: box.x + 10, y: box.y + 20, w: box.w - 20, h: box.h - 30 });
      items.slice().sort((a, b) => Number(a.fips === (selectedCounty && selectedCounty.fips)) - Number(b.fips === (selectedCounty && selectedCounty.fips))).forEach((shape) => {
        const isSelected = selectedCounty && shape.fips === selectedCounty.fips;
        const stroke = isSelected ? rgbaColor(colors.red, 0.98) : rgbaColor(colors.ink, state ? 0.24 : 0.16);
        const lineWidth = isSelected ? 2.6 : state ? 0.7 : 0.45;
        drawCountyShape(ctx, shape, project, countyFill(shape, selectedCode, highCodes, focus, colors), stroke, lineWidth);
        const info = countyByFips.get(shape.fips);
        if (info && Number.isFinite(Number(info.lon)) && Number.isFinite(Number(info.lat))) {
          const lon = shape.state_abbr === "AK" && Number(info.lon) > 0 ? Number(info.lon) - 360 : Number(info.lon);
          const target = project(lon, Number(info.lat));
          localityMapTargets.push({ x: target.x, y: target.y, fips: shape.fips, state: shape.state_abbr });
        }
      });
    });

    if (selectedCounty) {
      const target = localityMapTargets.find((item) => item.fips === selectedCounty.fips);
      if (target) {
        ctx.fillStyle = colors.red;
        ctx.beginPath();
        ctx.arc(target.x, target.y, 4.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const explicit = defs.counties.filter((county) => county.locality_code !== "RUS").length;
    const selectedArea = selectedCounty ? areaByCode.get(selectedCounty.locality_code) : (selectedCode ? areaByCode.get(selectedCode) : null);
    setText(els.localityMapTitle, state ? `${state} OPM locality county boundaries` : "OPM locality county boundary map");
    setText(els.localityMapMetric, `${visible.length.toLocaleString()} counties`);
    setText(els.localityMapMeta, selectedArea ? `${selectedArea.code} | ${math.pct(selectedArea.percentage)}` : (state || "all states"));
    if (selectedCounty) {
      setText(els.localityCountyDetail, `${selectedCounty.name}, ${selectedCounty.state_abbr}: ${selectedCounty.locality_code} locality at ${math.pct(selectedCounty.locality_percent)}. FIPS ${selectedCounty.fips}.`);
    } else if (selectedArea) {
      setText(els.localityCountyDetail, `${selectedArea.code} | ${selectedArea.name} is emphasized at ${math.pct(selectedArea.percentage)}. Click a county or use the selector for FIPS detail.`);
    } else {
      setText(els.localityCountyDetail, "Click a county or choose one from the selector for exact OPM locality and FIPS detail.");
    }
    setText(els.localityMapSummary, `${defs.counties.length.toLocaleString()} county records loaded. ${explicit.toLocaleString()} are explicitly assigned to an OPM locality area; the rest use Rest of U.S. unless OPM defines otherwise. Geometry is generalized Census cartographic boundary data.`);
    if (els.localityAreaChips) {
      const counts = new Map();
      visible.forEach((shape) => counts.set(shape.locality_code, (counts.get(shape.locality_code) || 0) + 1));
      els.localityAreaChips.innerHTML = Array.from(counts.entries())
        .map(([code, count]) => ({ code, count, area: areaByCode.get(code) }))
        .sort((a, b) => b.count - a.count || Number(b.area ? b.area.percentage : 0) - Number(a.area ? a.area.percentage : 0))
        .slice(0, 12)
        .map((item) => `<span class="locality-chip${item.code === selectedCode ? " is-selected" : ""}"><b>${math.escapeHtml(item.code)}</b> ${item.count} | ${item.area ? math.pct(item.area.percentage) : "N/A"}</span>`)
        .join("");
    }
  }

  function render3DLab(input) {
    if (els.surfaceMode.value === "career") renderCareerEarnings(input);
    else {
      renderPaySurface(input);
      renderRaisePanels(input);
    }
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
    renderLocalityMap(input);
    renderTrace(result);
    renderSchedule(input.year, input.grade, input.step);
    renderChart(input.year, input.grade, input.step);
    renderInflation(input);
    renderHistoricalContext(input);
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
      if (els.ratingProfile) els.ratingProfile.value = "successful";
      els.surfaceYearSpan.value = "25";
      if (els.localityMapState) els.localityMapState.value = "";
      fillLocalityCountyOptions();
      if (els.localityMapFocus) els.localityMapFocus.value = "selected";
      if (els.contextStart) els.contextStart.value = "1977";
      if (els.contextEnd) els.contextEnd.value = "2026";
      if (els.contextView) els.contextView.value = "selected";
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
    [els.surfaceMode, els.earnStart, els.earnEnd, els.compareMode, els.ratingProfile, els.surfaceYearSpan].filter(Boolean).forEach((el) => el.addEventListener("change", renderAll));
    [els.contextStart, els.contextEnd, els.contextView].filter(Boolean).forEach((el) => el.addEventListener("change", renderAll));
    if (els.localityMapState) {
      els.localityMapState.addEventListener("change", () => {
        fillLocalityCountyOptions();
        renderAll();
      });
    }
    [els.localityMapCounty, els.localityMapFocus].filter(Boolean).forEach((el) => el.addEventListener("change", renderAll));
    if (els.localityMapCanvas) {
      els.localityMapCanvas.addEventListener("click", (event) => {
        if (!localityMapTargets.length) return;
        const rect = els.localityMapCanvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        const nearest = localityMapTargets.reduce((best, target) => {
          const distance = (target.x - x) ** 2 + (target.y - y) ** 2;
          return !best || distance < best.distance ? { ...target, distance } : best;
        }, null);
        if (!nearest) return;
        if (els.localityMapState) els.localityMapState.value = nearest.state;
        fillLocalityCountyOptions(nearest.fips);
        renderAll();
      });
    }
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
