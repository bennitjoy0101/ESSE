// my-footprint.js — populates the My Footprint page using saved entries from data.js
// Depends on getAllEntries() being defined in js/data.js (same as history.js relies on it).

const CATEGORY_META = {
  transportation: { label: "Transportation", icon: "🚗", color: "blue" },
  electricity: { label: "Electricity", icon: "⚡", color: "orange" },
  fuel: { label: "Fuel / LPG", icon: "🔥", color: "green" },
  waste: { label: "Waste", icon: "🗑️", color: "purple" },
  food: { label: "Food", icon: "🍽️", color: "blue" },
};

const GOAL_STORAGE_KEY = "cft_monthly_goal";

document.addEventListener("DOMContentLoaded", () => {
  const entries = typeof getAllEntries === "function" ? getAllEntries() : [];

  const byMonth = groupByMonth(entries);
  const months = Object.keys(byMonth).sort();
  const currentMonthKey = months[months.length - 1];
  const lastMonthKey = months[months.length - 2];

  const currentTotals = currentMonthKey ? byMonth[currentMonthKey] : emptyTotals();
  const lastTotals = lastMonthKey ? byMonth[lastMonthKey] : emptyTotals();

  const currentTotal = sumTotals(currentTotals);
  const lastTotal = sumTotals(lastTotals);

  const last3Keys = months.slice(-3);
  const avg3 = last3Keys.length
    ? Math.round(last3Keys.reduce((sum, k) => sum + sumTotals(byMonth[k]), 0) / last3Keys.length)
    : 0;

  renderStatCards(currentTotal, lastTotal, currentTotals, currentMonthKey);
  renderGoal(currentTotal);
  renderBreakdown(currentTotals, currentTotal);
  renderComparison(currentTotal, lastTotal, avg3);

  document.getElementById("saveGoalBtn").addEventListener("click", () => {
    const input = document.getElementById("goalInput");
    const val = parseFloat(input.value);
    if (!isNaN(val) && val > 0) {
      localStorage.setItem(GOAL_STORAGE_KEY, val);
      renderGoal(currentTotal);
    }
  });
});

function emptyTotals() {
  return { transportation: 0, electricity: 0, fuel: 0, waste: 0, food: 0 };
}

function sumTotals(totals) {
  return Object.values(totals).reduce((a, b) => a + b, 0);
}

function groupByMonth(entries) {
  const result = {};
  entries.forEach((entry) => {
    const month = entry.date.slice(0, 7); // "YYYY-MM"
    if (!result[month]) result[month] = emptyTotals();
    Object.keys(CATEGORY_META).forEach((cat) => {
      result[month][cat] += entry[cat]?.co2 || 0;
    });
  });
  return result;
}

function daysElapsedInMonth(monthKey) {
  if (!monthKey) return 1;
  const now = new Date();
  const [year, month] = monthKey.split("-").map(Number);
  const isCurrentMonth = now.getFullYear() === year && now.getMonth() + 1 === month;
  return isCurrentMonth ? now.getDate() : new Date(year, month, 0).getDate();
}

function renderStatCards(currentTotal, lastTotal, currentTotals, currentMonthKey) {
  document.getElementById("statTotal").textContent = `${Math.round(currentTotal)} kg CO₂e`;

  const deltaEl = document.getElementById("statTotalDelta");
  if (lastTotal > 0) {
    const pct = Math.round(((lastTotal - currentTotal) / lastTotal) * 100);
    deltaEl.textContent = pct >= 0 ? `↓ ${pct}% vs last month` : `↑ ${Math.abs(pct)}% vs last month`;
    deltaEl.className = pct >= 0 ? "stat-delta positive" : "stat-delta negative";
  } else {
    deltaEl.textContent = "No prior data yet";
  }

  const days = daysElapsedInMonth(currentMonthKey);
  document.getElementById("statDaily").textContent = `${(currentTotal / days).toFixed(1)} kg CO₂e`;

  const topCategory = Object.entries(currentTotals).sort((a, b) => b[1] - a[1])[0];
  if (topCategory && topCategory[1] > 0) {
    document.getElementById("statTopCategory").textContent = CATEGORY_META[topCategory[0]].label;
  } else {
    document.getElementById("statTopCategory").textContent = "No data yet";
  }

  const GLOBAL_AVERAGE = 300;
  const diffPct = Math.round(((currentTotal - GLOBAL_AVERAGE) / GLOBAL_AVERAGE) * 100);
  const vsAvgEl = document.getElementById("statVsAverage");
  if (currentTotal > 0) {
    vsAvgEl.textContent = diffPct <= 0 ? `${Math.abs(diffPct)}% below avg` : `${diffPct}% above avg`;
  } else {
    vsAvgEl.textContent = "No data yet";
  }
}

function renderGoal(currentTotal) {
  const savedGoal = parseFloat(localStorage.getItem(GOAL_STORAGE_KEY));
  const goalInput = document.getElementById("goalInput");
  const goalBar = document.getElementById("goalBar");
  const goalText = document.getElementById("goalProgressText");
  const goalTag = document.getElementById("goalTag");

  if (!savedGoal) {
    goalText.textContent = `${Math.round(currentTotal)} kg CO₂e used — set a target above`;
    goalBar.style.width = "0%";
    goalTag.textContent = "No goal set";
    goalTag.className = "tag tag-medium";
    return;
  }

  goalInput.value = savedGoal;
  const pct = Math.min(100, Math.round((currentTotal / savedGoal) * 100));
  goalBar.style.width = `${pct}%`;
  goalText.textContent = `${Math.round(currentTotal)} of ${savedGoal} kg CO₂e`;

  if (pct < 70) {
    goalTag.textContent = "On track";
    goalTag.className = "tag tag-high";
  } else if (pct < 100) {
    goalTag.textContent = "Close to limit";
    goalTag.className = "tag tag-medium";
  } else {
    goalTag.textContent = "Over goal";
    goalTag.className = "tag tag-low";
  }
}

function renderBreakdown(totals, grandTotal) {
  const container = document.getElementById("breakdownList");
  const rows = Object.entries(totals)
    .filter(([, kg]) => kg > 0)
    .sort((a, b) => b[1] - a[1]);

  if (rows.length === 0) {
    container.innerHTML = `<p style="font-size:13px; color:var(--color-text-muted);">No entries logged yet this month — add data to see your breakdown.</p>`;
    return;
  }

  container.innerHTML = rows.map(([cat, kg]) => {
    const meta = CATEGORY_META[cat];
    const pct = grandTotal > 0 ? Math.round((kg / grandTotal) * 100) : 0;
    return `
      <div style="display:flex; align-items:center; gap:12px;">
        <div class="icon-circle ${meta.color}">${meta.icon}</div>
        <div style="flex:1;">
          <div style="display:flex; justify-content:space-between; font-size:13px; margin-bottom:6px;">
            <span style="font-weight:600;">${meta.label}</span>
            <span style="color:var(--color-text-muted);">${Math.round(kg)} kg CO₂e · ${pct}%</span>
          </div>
          <div style="background:var(--color-bg); border-radius:999px; height:8px; overflow:hidden;">
            <div style="background:var(--color-primary); height:100%; width:${pct}%; border-radius:999px;"></div>
          </div>
        </div>
      </div>`;
  }).join("");
}

function renderComparison(currentTotal, lastTotal, avg3) {
  document.getElementById("cmpThisMonth").textContent = `${Math.round(currentTotal)} kg CO₂e`;
  document.getElementById("cmpLastMonth").textContent = `${Math.round(lastTotal)} kg CO₂e`;
  document.getElementById("cmpAvg").textContent = `${Math.round(avg3)} kg CO₂e`;
}