// history.js — draws the "Your Emission History" chart using real saved data

const HISTORY_MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("historyChart");
  if (!canvas) return;

  const allEntries = getAllEntries(); // from data.js

  const rangeSelect = document.getElementById("rangeSelect");

  function render() {
    const entries = filterEntriesByRange(allEntries, rangeSelect ? rangeSelect.value : "Last 6 Months");
    const { labels, values } = buildEntrySeries(entries);

    drawLineChart(canvas, labels, values);
    updateStatCards(allEntries);
    updateBreakdown(entries);
  }

  render();

  window.addEventListener("resize", render);
  if (rangeSelect) rangeSelect.addEventListener("change", render);

  highlightJustAddedCard();
});

// Keep only entries within the selected range (based on today's date)
function filterEntriesByRange(entries, rangeLabel) {
  if (!entries.length) return entries;

  const now = new Date();
  let cutoffMonths;
  if (rangeLabel === "Last 3 Months") {
    cutoffMonths = 3;
  } else if (rangeLabel === "This Year") {
    const yearStart = `${now.getFullYear()}-01`;
    return entries.filter(e => e.date.slice(0, 7) >= yearStart);
  } else {
    cutoffMonths = 6; // "Last 6 Months" (default)
  }

  const cutoff = new Date(now.getFullYear(), now.getMonth() - (cutoffMonths - 1), 1);
  const cutoffKey = `${cutoff.getFullYear()}-${String(cutoff.getMonth() + 1).padStart(2, "0")}`;
  return entries.filter(e => e.date.slice(0, 7) >= cutoffKey);
}

// Builds one chart point PER SAVED ENTRY (not aggregated per month), so every
// entry added through Add Data shows up on the graph, in the order it happened.
function buildEntrySeries(entries) {
  const sorted = [...entries].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));

  const labels = sorted.map((entry, i) => formatEntryLabel(entry, sorted, i));
  const values = sorted.map(entry => Math.round(entryTotalCo2(entry)));

  return { labels, values };
}

function entryTotalCo2(entry) {
  return (
    (entry.transportation?.co2 || 0) +
    (entry.electricity?.co2 || 0) +
    (entry.fuel?.co2 || 0) +
    (entry.waste?.co2 || 0) +
    (entry.food?.co2 || 0)
  );
}

// "Aug 15" — if multiple entries share a date, distinguish them ("Aug 15 (2)")
function formatEntryLabel(entry, allSorted, index) {
  const [year, month, day] = entry.date.split("-");
  const base = `${HISTORY_MONTH_NAMES[parseInt(month, 10) - 1]} ${parseInt(day, 10)}`;

  const sameDateBefore = allSorted.slice(0, index).filter(e => e.date === entry.date).length;
  const sameDateTotal = allSorted.filter(e => e.date === entry.date).length;

  return sameDateTotal > 1 ? `${base} (${sameDateBefore + 1})` : base;
}

// Groups entries by month and sums total CO2 per month (used for the stat cards,
// where "this month" / "last month" totals make more sense than single entries)
function groupEntriesByMonth(entries) {
  const monthTotals = {}; // { "2026-08": totalCo2 }

  entries.forEach(entry => {
    const month = entry.date.slice(0, 7); // "YYYY-MM"
    monthTotals[month] = (monthTotals[month] || 0) + entryTotalCo2(entry);
  });

  const sortedMonths = Object.keys(monthTotals).sort();
  const values = sortedMonths.map(m => Math.round(monthTotals[m]));

  return { months: sortedMonths, values };
}

// Updates the 4 stat cards (This Month, Last Month, 3 Month Avg, Total Reduction)
function updateStatCards(entries) {
  const { values } = groupEntriesByMonth(entries);

  const thisMonth = values[values.length - 1] || 0;
  const lastMonth = values[values.length - 2] || 0;
  const baseline = values[0] || 0;

  const last3 = values.slice(-3);
  const avg3 = last3.length ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length) : 0;

  setText("statThisMonthValue", `${thisMonth} kg CO₂e`);
  setText("statLastMonthValue", `${lastMonth} kg CO₂e`);
  setText("statAvg3Value", `${avg3} kg CO₂e`);

  const thisMonthDelta = document.getElementById("statThisMonthDelta");
  if (thisMonthDelta) {
    if (lastMonth > 0) {
      const pctChange = Math.round(((lastMonth - thisMonth) / lastMonth) * 100);
      thisMonthDelta.textContent = pctChange >= 0 ? `↓ ${pctChange}% vs last month` : `↑ ${Math.abs(pctChange)}% vs last month`;
      thisMonthDelta.className = pctChange >= 0 ? "stat-delta positive" : "stat-delta negative";
    } else {
      thisMonthDelta.textContent = "";
    }
  }

  // Total Reduction: how the most recent month compares to the very first
  // month on record (the user's baseline), rather than a hardcoded number.
  const reductionValue = document.getElementById("statReductionValue");
  const reductionDelta = document.getElementById("statReductionDelta");
  if (reductionValue) {
    if (values.length > 1 && baseline > 0) {
      const pct = Math.round(((baseline - thisMonth) / baseline) * 100);
      reductionValue.textContent = pct >= 0 ? `↓ ${pct}%` : `↑ ${Math.abs(pct)}%`;
      if (reductionDelta) reductionDelta.className = pct >= 0 ? "stat-delta positive" : "stat-delta negative";
    } else {
      reductionValue.textContent = "—";
    }
  }
}

// Updates the History Breakdown category totals
function updateBreakdown(entries) {
  const totals = { transportation: 0, electricity: 0, fuel: 0, waste: 0 };

  entries.forEach(entry => {
    totals.transportation += entry.transportation?.co2 || 0;
    totals.electricity += entry.electricity?.co2 || 0;
    totals.fuel += entry.fuel?.co2 || 0;
    totals.waste += entry.waste?.co2 || 0;
  });

  setText("breakdownTransportation", `${Math.round(totals.transportation)} kg CO₂e`);
  setText("breakdownElectricity", `${Math.round(totals.electricity)} kg CO₂e`);
  setText("breakdownFuel", `${Math.round(totals.fuel)} kg CO₂e`);
  setText("breakdownWaste", `${Math.round(totals.waste)} kg CO₂e`);
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// If we just got redirected here from Add Data, blink the "This Month" result
// card twice so the user can see where their new entry landed.
function highlightJustAddedCard() {
  let justAdded = false;
  try {
    justAdded = sessionStorage.getItem("ctJustAdded") === "1";
    sessionStorage.removeItem("ctJustAdded");
  } catch (err) {
    // sessionStorage unavailable — skip the highlight, not critical
  }

  if (!justAdded) return;

  const card = document.getElementById("statCardThisMonth");
  if (!card) return;

  card.classList.remove("ct-highlight");
  // Force reflow so the animation restarts reliably
  void card.offsetWidth;
  card.classList.add("ct-highlight");
  card.scrollIntoView({ behavior: "smooth", block: "center" });

  card.addEventListener("animationend", () => card.classList.remove("ct-highlight"), { once: true });
}

// --- Chart drawing (unchanged from before) ---
function drawLineChart(canvas, labels, values) {
  const ctx = canvas.getContext("2d");

  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * dpr;
  canvas.height = 220 * dpr;
  ctx.scale(dpr, dpr);

  const width = rect.width;
  const height = 220;
  const padding = { top: 20, right: 20, bottom: 30, left: 40 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  ctx.clearRect(0, 0, width, height);

  if (values.length === 0) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "13px Inter, sans-serif";
    ctx.fillText("No data yet — add an entry to see your history.", padding.left, height / 2);
    return;
  }

  const maxVal = Math.max(...values, 1) * 1.2;
  const minVal = 0;

  ctx.strokeStyle = "#e5e7eb";
  ctx.fillStyle = "#6b7280";
  ctx.font = "11px Inter, sans-serif";
  ctx.lineWidth = 1;

  const ySteps = 4;
  for (let i = 0; i <= ySteps; i++) {
    const y = padding.top + (chartHeight / ySteps) * i;
    const value = Math.round(maxVal - (maxVal / ySteps) * i);

    ctx.beginPath();
    ctx.moveTo(padding.left, y);
    ctx.lineTo(width - padding.right, y);
    ctx.stroke();

    ctx.fillText(value, 5, y + 4);
  }

  const points = values.map((val, i) => {
    const x = values.length === 1
      ? padding.left + chartWidth / 2
      : padding.left + (chartWidth / (values.length - 1)) * i;
    const y = padding.top + chartHeight - ((val - minVal) / (maxVal - minVal)) * chartHeight;
    return { x, y };
  });

  ctx.strokeStyle = "#2e7d32";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  points.forEach((p, i) => {
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.stroke();

  ctx.fillStyle = "#2e7d32";
  points.forEach((p) => {
    ctx.beginPath();
    ctx.arc(p.x, p.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  ctx.fillStyle = "#6b7280";
  ctx.font = "11px Inter, sans-serif";
  ctx.textAlign = "center";
  labels.forEach((label, i) => {
    // Avoid overcrowding the x-axis when there are many entries: thin out labels
    const skip = labels.length > 12 ? Math.ceil(labels.length / 12) : 1;
    if (i % skip === 0 || i === labels.length - 1) {
      ctx.fillText(label, points[i].x, height - 8);
    }
  });
  ctx.textAlign = "start";
}
