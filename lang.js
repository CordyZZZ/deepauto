(function () {
  const KEY = "dai-theme";

  function current() {
    return localStorage.getItem(KEY) === "light" ? "light" : "dark";
  }

  function apply(theme) {
    const next = theme === "light" ? "light" : "dark";
    localStorage.setItem(KEY, next);
    document.documentElement.dataset.theme = next;
    document.documentElement.dataset.lang = "zh";
    document.documentElement.style.colorScheme = next;
    window.dispatchEvent(new CustomEvent("dai-theme", { detail: next }));
  }

  window.daiLang = function () { return "zh"; };
  window.applyTheme = apply;
  apply(current());
})();
