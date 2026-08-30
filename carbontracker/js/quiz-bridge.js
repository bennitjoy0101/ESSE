// quiz-bridge.js — converts quiz results into a dashboard entry

const bridgeRawResults = sessionStorage.getItem("carbonResults");

if (bridgeRawResults) {
  const bridgeResults = JSON.parse(bridgeRawResults);

  const bridgeMonthlyTransport = (bridgeResults.transport + bridgeResults.flights) / 12;
  const bridgeMonthlyFood = bridgeResults.food / 12;
  const bridgeMonthlyElectricity = (bridgeResults.electricity || 0) / 12;
  const bridgeMonthlyFuel = (bridgeResults.cooking || 0) / 12;

  const bridgeEntry = {
    date: new Date().toISOString().split("T")[0],
    transportation: { distance: null, mode: "quiz", co2: bridgeMonthlyTransport },
    electricity: { usage: 0, co2: bridgeMonthlyElectricity },
    fuel: { usage: 0, co2: bridgeMonthlyFuel },
    waste: { amount: 0, recycled: null, co2: 0 },
    food: { co2: bridgeMonthlyFood }
  };

  // Note: the quiz's "shopping" answer has no home in this dashboard
  // schema (transportation/electricity/fuel/waste/food only), so it
  // is included in the meter's total/gauge but not carried into the
  // dashboard entry. Add a "shopping" or "consumption" bucket across
  // add-data.js / dashboard.js / history.js if you want it tracked there too.

  saveEntry(bridgeEntry);

  // Clear so it doesn't get saved twice if the page reloads
  sessionStorage.removeItem("carbonResults");
}