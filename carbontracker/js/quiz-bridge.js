// quiz-bridge.js — reads the quiz's estimated results, but does NOT feed
// them into the app's real entries store (the one saveEntry()/getAllEntries()
// manage). Dashboard "This Month", History, and My Footprint should only
// ever reflect data logged through Add Data — the quiz is a separate,
// one-off estimate, not tracked activity.

const bridgeRawResults = sessionStorage.getItem("carbonResults");

if (bridgeRawResults) {
  const bridgeResults = JSON.parse(bridgeRawResults);

  const bridgeMonthlyTransport = (bridgeResults.transport + bridgeResults.flights) / 12;
  const bridgeMonthlyFood = bridgeResults.food / 12;
  const bridgeMonthlyElectricity = (bridgeResults.electricity || 0) / 12;
  const bridgeMonthlyFuel = (bridgeResults.cooking || 0) / 12;

  const bridgeEstimate = {
    date: new Date().toISOString().split("T")[0],
    transportation: { distance: null, mode: "quiz", co2: bridgeMonthlyTransport },
    electricity: { usage: 0, co2: bridgeMonthlyElectricity },
    fuel: { usage: 0, co2: bridgeMonthlyFuel },
    waste: { amount: 0, recycled: null, co2: 0 },
    food: { co2: bridgeMonthlyFood }
  };

  // Intentionally NOT calling saveEntry(bridgeEstimate) here — quiz results
  // must not count toward the dashboard meter, history, or footprint totals.
  // Stored separately in case a results/summary view wants to show it later.
  localStorage.setItem("cft_last_quiz_result", JSON.stringify(bridgeEstimate));

  // Clear so it doesn't get re-processed if the page reloads
  sessionStorage.removeItem("carbonResults");
}