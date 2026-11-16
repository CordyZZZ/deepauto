const NAV = [
  ["index.html", "我们", "We", "we"],
  ["world.html", "世界模型", "World", "world"],
  ["optimize.html", "优化策略", "Strategy", "optimize"],
  ["agent.html", "伙伴", "Partner", "partner"],
];

const current = document.body.dataset.page;
const header = document.createElement("header");
header.className = "top";

const mark = document.createElement("a");
mark.className = "mark";
mark.href = "index.html";
mark.textContent = "DeepAuto";

const nav = document.createElement("nav");
nav.className = "nav";
nav.setAttribute("aria-label", "分页");

for (const [href, label, en, id] of NAV) {
  const link = document.createElement("a");
  link.href = href;
  const zh = document.createElement("b");
  zh.textContent = label;
  const sub = document.createElement("small");
  sub.textContent = en;
  link.append(zh, sub);
  if (id === current) link.setAttribute("aria-current", "page");
  nav.append(link);
}

header.append(mark, nav);
document.body.prepend(header);
