// settings.js — wires up the Settings page: theme, units, notifications,
// data export, and delete account. Depends on theme.js and data.js.

document.addEventListener("DOMContentLoaded", () => {

  // --- Theme ---
  const themeSelect = document.getElementById("themeSelect");
  const savedTheme = localStorage.getItem("cft_theme") || "light";
  themeSelect.value = savedTheme;
  themeSelect.addEventListener("change", () => {
    applyTheme(themeSelect.value); // applyTheme() comes from theme.js
  });

  // --- Units ---
  const unitsSelect = document.getElementById("unitsSelect");
  unitsSelect.value = localStorage.getItem("cft_units") || "kg";
  unitsSelect.addEventListener("change", () => {
    localStorage.setItem("cft_units", unitsSelect.value);
  });

  // --- Notifications / Weekly summary (preference only, no backend) ---
  const notifCheck = document.getElementById("notificationsCheck");
  const weeklyCheck = document.getElementById("weeklySummaryCheck");
  notifCheck.checked = localStorage.getItem("cft_notifications") !== "false";
  weeklyCheck.checked = localStorage.getItem("cft_weekly_summary") !== "false";

  notifCheck.addEventListener("change", () => {
    localStorage.setItem("cft_notifications", notifCheck.checked);
  });
  weeklyCheck.addEventListener("change", () => {
    localStorage.setItem("cft_weekly_summary", weeklyCheck.checked);
  });

  // --- Change Password (no auth system exists yet in this app) ---
  document.getElementById("changePasswordBtn").addEventListener("click", () => {
    alert("This app doesn't have accounts/login yet, so there's no password to change. Once you add authentication, this is where that flow will live.");
  });

  // --- Privacy ---
  document.getElementById("privacyBtn").addEventListener("click", () => {
    alert("All your data is stored locally in your browser (localStorage) — nothing is sent to a server. Use Data Export to download it, or Delete Account to erase it.");
  });

  // --- Data Export: downloads a real JSON file of everything saved ---
  document.getElementById("dataExportBtn").addEventListener("click", () => {
    const entries = typeof getAllEntries === "function" ? getAllEntries() : [];
    const goal = localStorage.getItem("cft_monthly_goal");
    const exportData = {
      exportedAt: new Date().toISOString(),
      entries,
      monthlyGoal: goal ? parseFloat(goal) : null,
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `carbon-tracker-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  // --- Delete Account: clears all locally stored data ---
  document.getElementById("deleteAccountBtn").addEventListener("click", () => {
    const confirmed = confirm(
      "This will permanently delete all your locally stored data (entries, goals, preferences). This cannot be undone. Continue?"
    );
    if (!confirmed) return;

    localStorage.removeItem("carbonTrackerData");
    localStorage.removeItem("cft_monthly_goal");
    localStorage.removeItem("cft_theme");
    localStorage.removeItem("cft_units");
    localStorage.removeItem("cft_notifications");
    localStorage.removeItem("cft_weekly_summary");

    alert("Your data has been deleted.");
    window.location.href = "../dashboard.html";
  });

  // --- About ---
  document.getElementById("aboutBtn").addEventListener("click", () => {
    alert("Carbon Footprint Tracker helps you log daily activities (transport, electricity, fuel, waste) and see your estimated CO₂e impact over time.");
  });

});