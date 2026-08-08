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
    ledgerTitle: $("ledgerTitle"),
    ledgerTable: $("ledgerTable"),
    auditExact: $("auditExact"),
    auditWrong: $("auditWrong"),
    auditLocality: $("auditLocality"),
    auditHourly: $("auditHourly"),
    sizeStamp: $("sizeStamp"),
    sizeTable: $("sizeTable"),
    sizeBars: $("sizeBars"),
    sourceList: $("sourceList"),
    buildMeta: $("buildMeta")
  };

  let lastRecord = null;

  function setText(el, value) {
    if (el) el.textContent = value;
  }

  function option(label, value) {
    const node = document.createElement("option");
    node.textContent = label;
    node.value = value;
    return node;
  }

  function fillControls() {
    math.YEARS.slice().reverse().forEach((year) => {
      els.year.appendChild(option(String(year), String(year)));
      els.compareYear.appendChild(option(String(year), String(year)));
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
  }

  function knownCap(year) {
    const cap = math.DATA.adjustments.known_pay_caps[String(year)];
    return Number.isFinite(Number(cap)) ? Number(cap) : NaN;
  }

  function setYearDefaults(year) {
    els.locality.value = year === 2026 ? "17.06" : year < 1994 ? "0" : els.locality.value;
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
      capValue,
      applyCap: els.applyCap.checked,
      compareYear: Number(els.compareYear.value)
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
    els.resultNote.textContent = `${eraDescription(result)}. ${diff >= 0 ? "+" : "-"}${math.money0.format(Math.abs(diff))} (${diffPct >= 0 ? "+" : ""}${diffPct.toFixed(1)}%) vs. ${compare.year}.`;
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
    html += "<th>WGI</th></tr></thead><tbody>";
    schedule.forEach((row, gIndex) => {
      const grade = gIndex + 1;
      const d = math.deriveFromAnchor(year, grade, 1);
      html += `<tr class="${grade <= 2 ? "low-grade" : ""}"><th scope="row">GS-${grade}</th>`;
      row.forEach((value, sIndex) => {
        const step = sIndex + 1;
        const selected = grade === activeGrade && step === activeStep;
        html += `<td><button class="cell-button${selected ? " selected" : ""}" data-grade="${grade}" data-step="${step}">${math.money0.format(value)}</button></td>`;
      });
      html += `<td>${d.lowGrade ? "VARIES" : math.money0.format(d.wgi)}</td></tr>`;
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

  function DATA_CHECKPOINT_YEARS() {
    return math.DATA.checkpoints.anchor_years;
  }

  function renderLedger(grade, step) {
    let html = `<thead><tr><th>Year</th><th>Base adj.</th><th>Status</th><th>Step 1</th><th>WGI</th><th>GS-${grade}/${step}</th><th>YoY</th></tr></thead><tbody>`;
    let previous = null;
    math.YEARS.forEach((year) => {
      const d = math.deriveFromAnchor(year, grade, step);
      const yoy = previous === null ? null : d.base - previous;
      html += `<tr><td>${year}</td><td>${math.pct(d.adjustment)}</td><td><span class="mini-status" data-status-class="${d.statusClass}">${math.escapeHtml(d.status)}</span></td><td>${d.lowGrade ? "N/A" : math.money0.format(d.step1)}</td><td>${d.lowGrade ? "VARIES" : math.money0.format(d.wgi)}</td><td>${math.money0.format(d.base)}</td><td>${yoy === null ? "N/A" : `${yoy >= 0 ? "+" : "-"}${math.money0.format(Math.abs(yoy))}`}</td></tr>`;
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
    renderSummary(result, compare);
    renderTrace(result);
    renderSchedule(input.year, input.grade, input.step);
    renderChart(input.year, input.grade, input.step);
    renderLedger(input.grade, input.step);
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
      els.locality.value = "17.06";
      els.cap.value = "197200";
      els.applyCap.checked = true;
      renderAll();
    });
    els.year.addEventListener("change", () => {
      setYearDefaults(Number(els.year.value));
      renderAll();
    });
    [els.grade, els.step, els.compareYear, els.locality, els.cap, els.applyCap].forEach((el) => el.addEventListener("change", renderAll));
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
    els.themeToggle.addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
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


