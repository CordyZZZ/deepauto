(function () {
  const wheel = document.getElementById("wheel");
  if (!wheel) return;

  const names = ["数据", "排练", "决策", "反馈"];
  const ring = document.createElement("div");
  ring.className = "ring";
  const hub = document.createElement("div");
  hub.className = "hub";
  hub.textContent = "RSI";
  wheel.append(ring, hub);

  const nodes = names.map((name) => {
    const el = document.createElement("div");
    el.className = "node";
    el.textContent = name;
    wheel.append(el);
    return el;
  });

  const orb = document.createElement("i");
  orb.className = "orb";
  wheel.append(orb);

  const arrows = names.map(() => {
    const el = document.createElement("i");
    el.className = "arrow";
    el.textContent = "›";
    wheel.append(el);
    return el;
  });

  function layout() {
    const w = wheel.clientWidth;
    const h = wheel.clientHeight;
    const cx = w / 2;
    const cy = h / 2;
    const radius = Math.min(w, h) * 0.34;
    ring.style.width = radius * 2 + "px";
    ring.style.height = radius * 2 + "px";
    ring.style.left = cx - radius + "px";
    ring.style.top = cy - radius + "px";
    nodes.forEach((el, i) => {
      const angle = -Math.PI / 2 + (i / names.length) * Math.PI * 2;
      el.style.left = cx + Math.cos(angle) * radius + "px";
      el.style.top = cy + Math.sin(angle) * radius + "px";
      const mid = angle + Math.PI / names.length;
      const arrow = arrows[i];
      arrow.style.left = cx + Math.cos(mid) * radius + "px";
      arrow.style.top = cy + Math.sin(mid) * radius + "px";
      arrow.style.transform = "translate(-50%, -50%) rotate(" + ((mid + Math.PI / 2) * 180) / Math.PI + "deg)";
    });
    return { cx: cx, cy: cy, radius: radius };
  }

  let start = 0;
  function tick(now) {
    if (!start) start = now;
    const spot = layout();
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const turn = reduce ? 0 : ((now - start) / 14000) % 1;
    const angle = -Math.PI / 2 + turn * Math.PI * 2;
    orb.style.left = spot.cx + Math.cos(angle) * spot.radius + "px";
    orb.style.top = spot.cy + Math.sin(angle) * spot.radius + "px";
    const near = Math.round(turn * names.length) % names.length;
    nodes.forEach((el, i) => el.classList.toggle("on", i === near));
    if (!reduce) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
  window.addEventListener("resize", layout);
})();
