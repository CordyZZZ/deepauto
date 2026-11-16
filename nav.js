const NAV = [
  ["index.html", "公司", "company"],
  ["world.html", "世界模型", "world"],
  ["agent.html", "智能体", "agent"],
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

for (const [href, label, id] of NAV) {
  const link = document.createElement("a");
  link.href = href;
  link.textContent = label;
  if (id === current) link.setAttribute("aria-current", "page");
  nav.append(link);
}

header.append(mark, nav);
document.body.prepend(header);
