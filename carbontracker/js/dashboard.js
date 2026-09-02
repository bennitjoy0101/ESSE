// dashboard.js — populates the Dashboard page (footprint total, gauge, breakdown chart)
// Depends on getAllEntries() from js/data.js and requireAuth() from js/auth-guard.js

const DASH_CATEGORY_META = {
  transportation: { label: "Transportation", color: "#1e88e5" },
  electricity:    { label: "Electricity",    color: "#f9a825" },
  fuel:           { label: "Fuel / LPG",     color: "#2e7d32" },
  waste:          { label: "Waste",          color: "#8e24aa" },
  food:           { label: "Food",           color: "#e53935" },
};

document.addEventListener("DOMContentLoaded", () => {
  requireAuth(() => {
    const entries = typeof getAllEntries === "function" ? getAllEntries() : [];

    toggleOnboardingCard(entries.length === 0);

    const byMonth = groupEntriesByMonthTotals(entries);
    const months = Object.keys(byMonth).sort();
    const currentKey = months[months.length - 1];
    const lastKey = months[months.length - 2];

    const currentTotals = currentKey ? byMonth[currentKey] : emptyDashTotals();
    const lastTotals = lastKey ? byMonth[lastKey] : emptyDashTotals();

    const currentTotal = sumDashTotals(currentTotals);
    const lastTotal = sumDashTotals(lastTotals);

    renderFootprintValue(currentTotal);
    renderComparePct(currentTotal, lastTotal);
    drawGauge(currentTotal);
    drawBreakdownChart(currentTotals, currentTotal);
  });
});

function toggleOnboardingCard(isNewUser) {
  const onboardingCard = document.getElementById("onboardingCard");
  const footprintCard = document.getElementById("footprintCard");
  if (onboardingCard) onboardingCard.style.display = isNewUser ? "block" : "none";
  if (footprintCard) footprintCard.style.display = isNewUser ? "none" : "block";
}

function emptyDashTotals() {
  return { transportation: 0, electricity: 0, fuel: 0, waste: 0, food: 0 };
}

function sumDashTotals(totals) {
  return Object.values(totals).reduce((a, b) => a + b, 0);
}

function groupEntriesByMonthTotals(entries) {
  const result = {};
  entries.forEach((entry) => {
    const month = entry.date.slice(0, 7);
    if (!result[month]) result[month] = emptyDashTotals();
    Object.keys(DASH_CATEGORY_META).forEach((cat) => {
      result[month][cat] += entry[cat]?.co2 || 0;
    });
  });
  return result;
}

function renderFootprintValue(currentTotal) {
  document.getElementById("footprintValue").textContent = Math.round(currentTotal);
}

function renderComparePct(currentTotal, lastTotal) {
  const el = document.getElementById("comparePct");
  const msgEl = document.getElementById("comparePctMsg");

  if (lastTotal > 0) {
    const pct = Math.round(((lastTotal - currentTotal) / lastTotal) * 100);
    el.textContent = pct >= 0 ? `↓ ${pct}%` : `↑ ${Math.abs(pct)}%`;
    el.style.color = pct >= 0 ? "var(--color-primary)" : "var(--color-accent-red)";

    if (msgEl) {
      if (pct > 0) msgEl.textContent = "Keep it up!";
      else if (pct === 0) msgEl.textContent = "Same as last month — try to trim it down.";
      else msgEl.textContent = "Trending up — let's turn this around.";
    }
  } else {
    el.textContent = "—";
    if (msgEl) msgEl.textContent = "Add more data to see your trend.";
  }
}

function drawGauge(currentTotal) {
  const canvas = document.getElementById("gaugeCanvas");
  const label = document.getElementById("gaugeLabel");
  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;
  const cx = width / 2;
  const cy = height - 10;
  const radius = Math.min(width / 2, height) - 15;

  ctx.clearRect(0, 0, width, height);

  const LOW_MAX = 150;
  const MED_MAX = 300;
  const SCALE_MAX = 450;

  const zones = [
    { from: 0, to: LOW_MAX / SCALE_MAX, color: "#2e7d32" },
    { from: LOW_MAX / SCALE_MAX, to: MED_MAX / SCALE_MAX, color: "#f9a825" },
    { from: MED_MAX / SCALE_MAX, to: 1, color: "#e53935" },
  ];

  zones.forEach((zone) => {
    ctx.beginPath();
    ctx.arc(cx, cy, radius, Math.PI + zone.from * Math.PI, Math.PI + zone.to * Math.PI);
    ctx.lineWidth = 16;
    ctx.strokeStyle = zone.color;
    ctx.lineCap = "butt";
    ctx.stroke();
  });

  const clamped = Math.min(currentTotal, SCALE_MAX);
  const angle = Math.PI + (clamped / SCALE_MAX) * Math.PI;
  const needleLength = radius - 10;
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + needleLength * Math.cos(angle), cy + needleLength * Math.sin(angle));
  ctx.lineWidth = 3;
  ctx.strokeStyle = "#1f2937";
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 5, 0, Math.PI * 2);
  ctx.fillStyle = "#1f2937";
  ctx.fill();

  let text, color, message;
  if (currentTotal <= LOW_MAX) {
    text = "Low"; color = "#2e7d32";
    message = "Keep going! You're doing great.";
  } else if (currentTotal <= MED_MAX) {
    text = "Medium"; color = "#f9a825";
    message = "Doing okay — there's room to cut back further.";
  } else {
    text = "High"; color = "#e53935";
    message = "Your footprint is high — check Tips & Actions to bring it down.";
  }

  label.textContent = text;
  label.style.color = color;

  const msgEl = document.getElementById("gaugeMsg");
  if (msgEl) msgEl.textContent = message;
}

function drawBreakdownChart(totals, grandTotal) {
  const wrap = document.getElementById("breakdownDonut");
  const ring = document.getElementById("breakdownRing");
  const centerValue = document.getElementById("breakdownCenterValue");
  const legend = document.getElementById("breakdownLegend");

  centerValue.textContent = Math.round(grandTotal);
  legend.innerHTML = "";

  // Fixed category order (matches the legend order, not sorted by size)
  const entries = Object.keys(DASH_CATEGORY_META)
    .map((cat) => [cat, totals[cat] || 0])
    .filter(([, kg]) => kg > 0);

  if (entries.length === 0) {
    ring.style.background = "var(--color-border)";
    const empty = document.createElement("div");
    empty.className = "donut-legend-empty";
    empty.textContent = "No entries logged yet.";
    legend.appendChild(empty);
    return;
  }

  let cursor = 0;
  const stops = [];

  entries.forEach(([cat, kg]) => {
    const meta = DASH_CATEGORY_META[cat];
    const pct = (kg / grandTotal) * 100;
    stops.push(`${meta.color} ${cursor}% ${cursor + pct}%`);
    cursor += pct;

    const item = document.createElement("div");
    item.className = "donut-legend-item";
    item.innerHTML =
      `<span class="donut-legend-dot" style="background:${meta.color}"></span>${meta.label}`;
    legend.appendChild(item);
  });

  ring.style.background = `conic-gradient(${stops.join(", ")})`;
}