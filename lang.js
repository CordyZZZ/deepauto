(function () {
  const KEY = "dai-lang";

  function current() {
    return localStorage.getItem(KEY) === "en" ? "en" : "zh";
  }

  function apply(lang) {
    const next = lang === "en" ? "en" : "zh";
    localStorage.setItem(KEY, next);
    document.documentElement.lang = next === "en" ? "en" : "zh-Hans";
    document.documentElement.dataset.lang = next;
    document.querySelectorAll("[data-zh]").forEach((el) => {
      const value = next === "en" ? el.dataset.en : el.dataset.zh;
      if (value != null) el.textContent = value;
    });
    const toggle = document.getElementById("lang-toggle");
    if (toggle) toggle.textContent = next === "en" ? "中文" : "EN";
    window.dispatchEvent(new CustomEvent("dai-lang", { detail: next }));
  }

  window.daiLang = current;
  window.applyLang = apply;
  apply(current());
})();
