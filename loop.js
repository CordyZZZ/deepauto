(function () {
  const forward = document.getElementById("forward");
  const cycle = document.getElementById("cycle");
  if (!forward || !cycle) return;

  const forwardNames = [
    ["数据", "Data"],
    ["预测模型", "Prediction"],
    ["决策模型", "Decision"],
    ["结果", "Result"],
  ];
  const cycleNames = [
    ["数据", "Data"],
    ["预测模型", "Prediction"],
    ["决策模型", "Decision"],
    ["评测结果", "Score"],
  ];

  function node(zh, en) {
    const el = document.createElement("div");
    el.className = "node";
    const label = document.createElement("b");
    label.dataset.zh = zh;
    label.dataset.en = en;
    label.textContent = window.daiLang() === "en" ? en : zh;
    el.append(label);
    return el;
  }

  function build(root, names, withFlow) {
    root.replaceChildren();
    names.forEach((pair, i) => {
      if (withFlow && i) {
        const flow = document.createElement("div");
        flow.className = "flow";
        flow.append(document.createElement("i"));
        root.append(flow);
      }
      root.append(node(pair[0], pair[1]));
    });
  }

  build(forward, forwardNames, true);
  build(cycle, cycleNames, false);
  const orb = document.createElement("i");
  orb.className = "orb";
  cycle.append(orb);

  const forwardNodes = [...forward.querySelectorAll(".node")];
  const forwardFlows = [...forward.querySelectorAll(".flow")];
  let step = 0;
  let timer = 0;

  function renderForward(next) {
    step = next;
    forwardNodes.forEach((el, i) => el.classList.toggle("on", i <= step));
    forwardFlows.forEach((el, i) => el.classList.toggle("run", i < step));
  }

  function playForward() {
    window.clearInterval(timer);
    renderForward(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      renderForward(forwardNodes.length - 1);
      return;
    }
    timer = window.setInterval(() => {
      if (step >= forwardNodes.length - 1) {
        window.clearInterval(timer);
        return;
      }
      renderForward(step + 1);
    }, 700);
  }

  const boxes = [...cycle.querySelectorAll(".node")];
  const loop = [3, 2, 1, 2];
  let intro = true;
  let hop = 0;
  let hopStart = 0;

  function center(el) {
    const box = cycle.getBoundingClientRect();
    const rect = el.getBoundingClientRect();
    return {
      x: rect.left - box.left + rect.width / 2,
      y: rect.top - box.top + rect.height / 2,
    };
  }

  function ends() {
    if (intro) return [hop, hop + 1];
    return [loop[hop], loop[(hop + 1) % loop.length]];
  }

  function tick(now) {
    if (!hopStart) hopStart = now;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) {
      const parked = center(boxes[2]);
      orb.style.left = parked.x + "px";
      orb.style.top = parked.y + "px";
      boxes.forEach((el, i) => el.classList.toggle("on", i > 0));
      requestAnimationFrame(tick);
      return;
    }
    const pair = ends();
    const from = center(boxes[pair[0]]);
    const to = center(boxes[pair[1]]);
    const t = Math.min(1, (now - hopStart) / 900);
    const e = t * t * (3 - 2 * t);
    orb.style.left = from.x + (to.x - from.x) * e + "px";
    orb.style.top = from.y + (to.y - from.y) * e + "px";
    boxes.forEach((el, i) => el.classList.toggle("on", i === pair[0] || i === pair[1]));
    if (t >= 1) {
      if (intro) {
        hop += 1;
        if (hop >= 3) {
          intro = false;
          hop = 0;
        }
      } else {
        hop = (hop + 1) % loop.length;
      }
      hopStart = now;
    }
    requestAnimationFrame(tick);
  }

  document.getElementById("replay-flow").addEventListener("click", playForward);
  window.addEventListener("resize", () => {
    hopStart = 0;
  });
  playForward();
  requestAnimationFrame(tick);
})();
