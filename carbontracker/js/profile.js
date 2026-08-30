// profile.js — profile info (editable, localStorage-backed), impact summary,
// and badge logic based on real logged entries.

const PROFILE_KEYS = {
  name: "cft_profile_name",
  email: "cft_profile_email",
  location: "cft_profile_location",
  memberSince: "cft_member_since",
};

const GLOBAL_AVERAGE = 300; // kg CO2e/month — same benchmark used on My Footprint page

document.addEventListener("DOMContentLoaded", () => {
  const entries = typeof getAllEntries === "function" ? getAllEntries() : [];

  loadProfileInfo();
  setupEditToggle();
  renderImpactSummary(entries);
  renderBadges(entries);
});

// --- Profile info: load, display, edit, save ---

function loadProfileInfo() {
  document.getElementById("nameDisplay").textContent =
    localStorage.getItem(PROFILE_KEYS.name) || "Tap Edit to add your name";
  document.getElementById("emailDisplay").textContent =
    localStorage.getItem(PROFILE_KEYS.email) || "Tap Edit to add your email";
  document.getElementById("locationDisplay").textContent =
    localStorage.getItem(PROFILE_KEYS.location) || "Tap Edit to add your location";

  // Member Since: set once, on first visit, then never overwritten
  let memberSince = localStorage.getItem(PROFILE_KEYS.memberSince);
  if (!memberSince) {
    memberSince = new Date().toISOString().split("T")[0];
    localStorage.setItem(PROFILE_KEYS.memberSince, memberSince);
  }
  const [year, month] = memberSince.split("-");
  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  document.getElementById("memberSinceDisplay").textContent = `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}

function setupEditToggle() {
  const editBtn = document.getElementById("editProfileBtn");
  const saveBtn = document.getElementById("saveProfileBtn");

  const fields = [
    { display: "nameDisplay", input: "nameInput", key: PROFILE_KEYS.name },
    { display: "emailDisplay", input: "emailInput", key: PROFILE_KEYS.email },
    { display: "locationDisplay", input: "locationInput", key: PROFILE_KEYS.location },
  ];

  editBtn.addEventListener("click", () => {
    fields.forEach(({ display, input, key }) => {
      const displayEl = document.getElementById(display);
      const inputEl = document.getElementById(input);
      const current = localStorage.getItem(key) || "";
      inputEl.value = current;
      displayEl.style.display = "none";
      inputEl.style.display = "block";
    });
    editBtn.style.display = "none";
    saveBtn.style.display = "inline-flex";
  });

  saveBtn.addEventListener("click", () => {
    fields.forEach(({ display, input, key }) => {
      const displayEl = document.getElementById(display);
      const inputEl = document.getElementById(input);
      const value = inputEl.value.trim();

      if (value) {
        localStorage.setItem(key, value);
        displayEl.textContent = value;
      } else {
        localStorage.removeItem(key);
        displayEl.textContent = `Tap Edit to add your ${display.replace("Display", "").toLowerCase()}`;
      }

      displayEl.style.display = "block";
      inputEl.style.display = "none";
    });
    saveBtn.style.display = "none";
    editBtn.style.display = "inline-flex";
  });
}

// --- Impact summary: real comparison against global average ---

function renderImpactSummary(entries) {
  const headline = document.getElementById("impactHeadline");
  const currentTotal = currentMonthTotal(entries);

  if (currentTotal === 0) {
    headline.textContent = "Add data to see your impact";
    return;
  }

  const diffPct = Math.round(((currentTotal - GLOBAL_AVERAGE) / GLOBAL_AVERAGE) * 100);
  if (diffPct <= 0) {
    headline.textContent = `Your footprint is ${Math.abs(diffPct)}% below the global average!`;
  } else {
    headline.textContent = `Your footprint is ${diffPct}% above the global average.`;
  }
}

function currentMonthTotal(entries) {
  const now = new Date();
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  return entries
    .filter((e) => e.date.slice(0, 7) === currentMonthKey)
    .reduce((sum, e) => sum + totalCo2(e), 0);
}

// --- Badges ---

function renderBadges(entries) {
  const count = entries.length;

  const badgeStatus = [
    count >= 1,                     // First Step
    count >= 7,                     // Eco Starter
    hasReducedEmissions(entries),   // Green Mover
    count >= 30,                    // Consistent
  ];

  const badgeEls = document.querySelectorAll("#badgesGrid .badge-item");

  badgeEls.forEach((el, i) => {
    const earned = !!badgeStatus[i];
    el.dataset.earned = earned;
    el.style.opacity = earned ? "1" : "0.4";
    el.style.filter = earned ? "none" : "grayscale(100%)";
  });
}

function hasReducedEmissions(entries) {
  if (entries.length < 2) return false;

  const sorted = [...entries].sort((a, b) => new Date(a.date) - new Date(b.date));
  const first = totalCo2(sorted[0]);
  const last = totalCo2(sorted[sorted.length - 1]);

  return first > 0 && last < first * 0.9; // 10%+ reduction
}

function totalCo2(entry) {
  return (
    (entry.transportation?.co2 || 0) +
    (entry.electricity?.co2 || 0) +
    (entry.fuel?.co2 || 0) +
    (entry.waste?.co2 || 0) +
    (entry.food?.co2 || 0)
  );
}