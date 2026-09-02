// add-data.js — collects form inputs, calculates CO2, saves via saveEntry()

document.getElementById("calculateBtn").addEventListener("click", () => {

  const distance = parseFloat(document.getElementById("distance").value) || 0;
  const mode = document.getElementById("mode").value;
  const electricityUsage = parseFloat(document.getElementById("electricity").value) || 0;
  const fuelUsage = parseFloat(document.getElementById("fuel").value) || 0;
  const wasteAmount = parseFloat(document.getElementById("waste").value) || 0;
  const recycled = document.getElementById("recycled").value === "yes";

  // Simple emission factors (kg CO2 per unit) — adjust later if needed
  const modeFactors = { car: 0.17, bus: 0.05, bike: 0, walk: 0 };
  const transportCo2 = distance * (modeFactors[mode] ?? 0.17);

  const electricityCo2 = electricityUsage * 0.475; // kg CO2 per kWh (approx grid average)
  const fuelCo2 = fuelUsage * 2.98; // kg CO2 per kg LPG (approx)
  const wasteCo2 = wasteAmount * (recycled ? 0.1 : 0.5); // less impact if recycled

  const entry = {
    date: new Date().toISOString().split("T")[0],
    transportation: { distance, mode, co2: transportCo2 },
    electricity: { usage: electricityUsage, co2: electricityCo2 },
    fuel: { usage: fuelUsage, co2: fuelCo2 },
    waste: { amount: wasteAmount, recycled, co2: wasteCo2 }
  };

  saveEntry(entry);

  // Flag for the History page so it can blink the result card once it loads.
  try {
    sessionStorage.setItem("ctJustAdded", "1");
  } catch (err) {
    // sessionStorage unavailable — redirect still works, just no highlight
  }

  window.location.href = "history.html";
});