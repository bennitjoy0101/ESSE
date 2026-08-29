function getAllEntries() {
  const raw = localStorage.getItem("carbonTrackerData");
  return raw ? JSON.parse(raw).entries : [];
}

function saveEntry(entry) {
  const data = { entries: getAllEntries() };
  data.entries.push(entry);
  localStorage.setItem("carbonTrackerData", JSON.stringify(data));
}