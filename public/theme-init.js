// Runs before first paint. Mirrors src/lib/prefs-store.ts (key "gz.dash.prefs").
;(function () {
  var theme = "system"
  var lang = null
  try {
    var raw = localStorage.getItem("gz.dash.prefs")
    var state = raw ? JSON.parse(raw).state : null
    if (state && state.theme) theme = state.theme
    if (state && state.language) lang = state.language
  } catch (e) {}
  var dark =
    theme === "dark" ||
    (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches)
  document.documentElement.classList.toggle("dark", dark)
  if (lang) document.documentElement.lang = lang
})()
