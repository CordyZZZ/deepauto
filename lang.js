(function () {
  const THEME = "dai-theme";
  const LANG = "dai-lang";

  function themeNow() {
    return localStorage.getItem(THEME) === "light" ? "light" : "dark";
  }

  function langNow() {
    return localStorage.getItem(LANG) === "en" ? "en" : "zh";
  }

  function applyTheme(theme) {
    const next = theme === "light" ? "light" : "dark";
    localStorage.setItem(THEME, next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
    window.dispatchEvent(new CustomEvent("dai-theme", { detail: next }));
  }

  function applyLang(lang) {
    const next = lang === "en" ? "en" : "zh";
    localStorage.setItem(LANG, next);
    document.documentElement.lang = next === "en" ? "en" : "zh-Hans";
    document.documentElement.dataset.lang = next;
    document.querySelectorAll("[data-zh]").forEach((el) => {
      const value = next === "en" ? el.dataset.en : el.dataset.zh;
      if (value != null) el.textContent = value;
    });
    window.dispatchEvent(new CustomEvent("dai-lang", { detail: next }));
  }

  window.daiLang = langNow;
  window.applyTheme = applyTheme;
  window.applyLang = applyLang;
  applyTheme(themeNow());
  applyLang(langNow());
})();
