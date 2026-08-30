// history.js — draws the "Your Emission History" chart using real saved data

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("historyChart");
  if (!canvas) return;

  const entries = getAllEntries(); // from data.js

  const { labels, values } = groupEntriesByMonth(entries);

  drawLineChart(canvas, labels, values);

  window.addEventListener("resize", () => drawLineChart(canvas, labels, values));

  updateStatCards(entries);
  updateBreakdown(entries);
});

// Groups entries by month and sums total CO2 per month
function groupEntriesByMonth(entries) {
  const monthTotals = {}; // { "2026-08": totalCo2 }

  entries.forEach(entry => {
    const month = entry.date.slice(0, 7); // "YYYY-MM"
    const total =
      (entry.transportation?.co2 || 0) +
      (entry.electricity?.co2 || 0) +
      (entry.fuel?.co2 || 0) +
      (entry.waste?.co2 || 0) +
      (entry.food?.co2 || 0);

    monthTotals[month] = (monthTotals[month] || 0) + total;
  });

  const sortedMonths = Object.keys(monthTotals).sort();

  const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const labels = sortedMonths.map(m => {
    const [year, month] = m.split("-");
    return monthNames[parseInt(month, 10) - 1];
  });

  const values = sortedMonths.map(m => Math.round(monthTotals[m]));

  return { labels, values };
}

// Updates the 4 stat cards (This Month, Last Month, 3 Month Avg, Total Reduction)
function updateStatCards(entries) {
  const { labels, values } = groupEntriesByMonth(entries);

  const thisMonth = values[values.length - 1] || 0;
  const lastMonth = values[values.length - 2] || 0;
  const last3 = values.slice(-3);
  const avg3 = last3.length ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length) : 0;

  const statCards = document.querySelectorAll(".stat-card");
  if (statCards[0]) statCards[0].querySelector(".stat-value").textContent = `${thisMonth} kg CO₂e`;
  if (statCards[1]) statCards[1].querySelector(".stat-value").textContent = `${lastMonth} kg CO₂e`;
  if (statCards[2]) statCards[2].querySelector(".stat-value").textContent = `${avg3} kg CO₂e`;

  if (lastMonth > 0 && statCards[0]) {
    const pctChange = Math.round(((lastMonth - thisMonth) / lastMonth) * 100);
    const deltaEl = statCards[0].querySelector(".stat-delta");
    if (deltaEl) {
      deltaEl.textContent = pctChange >= 0 ? `↓ ${pctChange}% vs last month` : `↑ ${Math.abs(pctChange)}% vs last month`;
      deltaEl.className = pctChange >= 0 ? "stat-delta positive" : "stat-delta negative";
    }
  }
}

// Updates the History Breakdown category totals
function updateBreakdown(entries) {
  const totals = { transportation: 0, electricity: 0, fuel: 0, waste: 0, food: 0 };

  entries.forEach(entry => {
    totals.transportation += entry.transportation?.co2 || 0;
    totals.electricity += entry.electricity?.co2 || 0;
    totals.fuel += entry.fuel?.co2 || 0;
    totals.waste += entry.waste?.co2 || 0;
    totals.food += entry.food?.co2 || 0;
  });

  const breakdownItems = document.querySelectorAll(".card-grid > div > div:last-child div:last-child");
  // Fallback: match by known order (Transportation, Electricity, Fuel, Waste)
  const values = [totals.transportation, totals.electricity, totals.fuel, totals.waste];
  const valueEls = document.querySelectorAll(".icon-circle + div div:last-child");

  valueEls.forEach((el, i) => {
    if (values[i] !== undefined) {
      el.textContent = `${Math.round(values[i])} kg CO₂e`;
    }
  });
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
    ctx.fillText(label, points[i].x, height - 8);
  });
  ctx.textAlign = "start";
}