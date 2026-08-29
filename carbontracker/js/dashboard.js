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
  if (lastTotal > 0) {
    const pct = Math.round(((lastTotal - currentTotal) / lastTotal) * 100);
    el.textContent = pct >= 0 ? `↓ ${pct}%` : `↑ ${Math.abs(pct)}%`;
    el.style.color = pct >= 0 ? "var(--color-primary)" : "var(--color-accent-red)";
  } else {
    el.textContent = "—";
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

  let text, color;
  if (currentTotal <= LOW_MAX) { text = "Low"; color = "#2e7d32"; }
  else if (currentTotal <= MED_MAX) { text = "Medium"; color = "#f9a825"; }
  else { text = "High"; color = "#e53935"; }

  label.textContent = text;
  label.style.color = color;
}

function drawBreakdownChart(totals, grandTotal) {
  const canvas = document.getElementById("breakdownChart");
  const totalEl = document.getElementById("breakdownTotal");
  const ctx = canvas.getContext("2d");

  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  totalEl.textContent = `Total: ${Math.round(grandTotal)} kg CO₂e`;

  const cx = width / 2;
  const cy = height / 2;
  const outerR = Math.min(width, height) / 2 - 10;
  const innerR = outerR * 0.6;

  const entries = Object.entries(totals).filter(([, kg]) => kg > 0);

  if (entries.length === 0) {
    ctx.fillStyle = "#6b7280";
    ctx.font = "13px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("No entries logged yet.", cx, cy);
    ctx.textAlign = "start";
    return;
  }

  let startAngle = -Math.PI / 2;
  entries.forEach(([cat, kg]) => {
    const sliceAngle = (kg / grandTotal) * Math.PI * 2;
    const meta = DASH_CATEGORY_META[cat];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, outerR, startAngle, startAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = meta.color;
    ctx.fill();

    startAngle += sliceAngle;
  });

  ctx.beginPath();
  ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
  ctx.fillStyle = "#ffffff";
  ctx.fill();

  const legendY = height - 4;
  ctx.font = "11px Inter, sans-serif";
  let legendX = 10;
  entries.forEach(([cat]) => {
    const meta = DASH_CATEGORY_META[cat];
    ctx.fillStyle = meta.color;
    ctx.fillRect(legendX, legendY - 20, 8, 8);
    ctx.fillStyle = "#6b7280";
    ctx.fillText(meta.label, legendX + 12, legendY - 12);
    legendX += ctx.measureText(meta.label).width + 30;
  });
}