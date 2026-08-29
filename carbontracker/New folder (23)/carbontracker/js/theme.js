// theme.js — applies the saved theme (light/dark) on every page load.
// Include this in the <head> of every page, before the closing </head> tag,
// so it runs before the page paints (avoids a flash of the wrong theme).

function applyTheme(theme) {
  if (theme === "dark") {
    document.body.classList.add("dark-mode");
  } else {
    document.body.classList.remove("dark-mode");
  }
  localStorage.setItem("cft_theme", theme);
}

document.addEventListener("DOMContentLoaded", () => {
  const saved = localStorage.getItem("cft_theme") || "light";
  applyTheme(saved);
});