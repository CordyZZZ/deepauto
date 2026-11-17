(function () {
  const MAIN = [
    ["agent.html", "智能体", "Agent", "agent"],
    ["core.html", "核心竞争力", "Strength", "core"],
    ["index.html", "我们", "We", "we"],
  ];
  const PARTS = [
    ["#world", "世界模型", "World", "world"],
    ["#bench", "技术测评", "Benchmark", "bench"],
    ["#strategy", "数据飞轮", "Flywheel", "strategy"],
  ];
  const page = document.body.dataset.page;
  const header = document.createElement("header");
  header.className = "top";

  const mark = document.createElement("a");
  mark.className = "mark";
  mark.href = "index.html";
  mark.textContent = "DeepAuto Investments";

  const nav = document.createElement("nav");
  nav.className = "nav";
  nav.setAttribute("aria-label", "分页");

  function link(href, zh, en, id, part) {
    const a = document.createElement("a");
    a.href = page === "core" && part ? href : (part ? "core.html" + href : href);
    a.dataset.zh = zh;
    a.dataset.en = en;
    a.dataset.id = id;
    a.textContent = zh;
    if (part) a.classList.add("part");
    return a;
  }

  const main = document.createElement("div");
  main.className = "nav-main";
  MAIN.forEach((item) => main.append(link(...item, false)));
  const sub = document.createElement("div");
  sub.className = "nav-sub";
  PARTS.forEach((item) => sub.append(link(...item, true)));
  nav.append(main, sub);

  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.className = "ghost lang";
  toggle.id = "theme-toggle";
  function themeLabel() {
    const light = document.documentElement.dataset.theme === "light";
    toggle.textContent = light ? "暗" : "亮";
    toggle.setAttribute("aria-label", light ? "切换到暗色" : "切换到亮色");
  }
  themeLabel();
  toggle.addEventListener("click", () => {
    window.applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light");
  });
  window.addEventListener("dai-theme", themeLabel);

  function markCurrent() {
    const hash = location.hash.replace("#", "");
    nav.querySelectorAll("a").forEach((link) => {
      const id = link.dataset.id;
      const on = id === page || (page === "core" && id === hash);
      if (on) link.setAttribute("aria-current", "page");
      else link.removeAttribute("aria-current");
    });
  }

  markCurrent();
  window.addEventListener("hashchange", markCurrent);
  const side = document.createElement("div");
  side.className = "nav-side";
  side.append(nav, toggle);
  header.append(mark, side);
  document.body.prepend(header);
})();
