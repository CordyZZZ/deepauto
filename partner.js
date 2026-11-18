(function () {
  const chat = document.getElementById("chat");
  const dots = document.getElementById("dots");
  const replay = document.getElementById("replay");
  if (!chat || !dots || !replay) return;

  const scenes = [
    { zh: "意图确认", en: "Intent" },
    { zh: "数据分析", en: "Data" },
    { zh: "策略构建", en: "Strategy" },
    { zh: "仿真测试", en: "Simulate" },
    { zh: "风险揭示", en: "Risk" },
    { zh: "人工确认", en: "Confirm" },
    { zh: "实际执行", en: "Execute" },
    { zh: "持续复盘", en: "Review" },
  ];

  const tape = [
    ["2026-10-06", 239.24], ["2026-10-07", 237.47], ["2026-10-08", 230.48], ["2026-10-09", 229.28],
    ["2026-10-12", 226.32], ["2026-10-13", 228.52], ["2026-10-14", 221.3], ["2026-10-15", 217.23],
    ["2026-10-16", 214.13], ["2026-10-19", 217.09], ["2026-10-20", 216.47], ["2026-10-21", 221.97],
    ["2026-10-22", 212.21], ["2026-10-23", 210.96], ["2026-10-26", 216], ["2026-10-27", 217.94],
    ["2026-10-28", 215.38], ["2026-10-29", 213.66], ["2026-10-30", 204.64], ["2026-11-02", 202.06],
    ["2026-11-03", 206.69], ["2026-11-04", 200.13], ["2026-11-05", 181.6], ["2026-11-06", 186.64],
    ["2026-11-09", 178.67], ["2026-11-10", 168.89], ["2026-11-11", 173.73], ["2026-11-12", 166.19],
    ["2026-11-13", 162.85], ["2026-11-16", 156.14], ["2026-11-17", 155.46],
  ];
  const newsAt = tape.findIndex((row) => row[0] === "2026-11-05");
  const prices = tape.map((row) => row[1]);
  const lo = Math.min.apply(null, prices) - 8;
  const hi = Math.max.apply(null, prices) + 8;
  const END = 4.4;

  let index = 0;
  let timer = 0;
  let split = newsAt;
  let hover = -1;
  let dragging = false;
  let chartStart = 0;
  let chartShown = 0;
  let chartPlaying = false;
  let chartDone = false;
  let chartGen = 0;
  let simKey = -1;
  let simCache = [];

  scenes.forEach((scene, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.dataset.zh = scene.zh;
    button.dataset.en = scene.en;
    button.textContent = scene.zh;
    button.addEventListener("click", () => show(i, true));
    dots.append(button);
  });

  function lang() {
    return window.daiLang() === "en" ? "en" : "zh";
  }

  function t(zh, en) {
    return lang() === "en" ? en : zh;
  }

  function bubble(kind, html) {
    const el = document.createElement("div");
    el.className = "msg " + kind;
    el.innerHTML = html;
    return el;
  }

  function rand(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let x = Math.imul(a ^ (a >>> 15), 1 | a);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  function xOf(i) {
    return 36 + (568 * i) / (tape.length - 1);
  }

  function yOf(price) {
    return 28 + ((hi - price) / (hi - lo)) * 150;
  }

  function indexAt(x) {
    const ratio = (x - 36) / 568;
    return Math.round(Math.min(tape.length - 1, Math.max(0, ratio * (tape.length - 1))));
  }

  function sims() {
    if (simKey === split) return simCache;
    simKey = split;
    const y0 = yOf(prices[split]);
    const room = Math.max(1, tape.length - 1 - split);
    simCache = [11, 29, 47, 71, 97].map((seed) => {
      const next = rand(split * 97 + seed * 13);
      const drop = 32 + next() * 20;
      let shock = 0;
      const pts = [[xOf(split), y0]];
      for (let i = split + 1; i < tape.length; i += 1) {
        const dist = (i - split) / room;
        shock = shock * 0.84 + (next() - 0.5) * (6 + dist * 16);
        const dev = drop * dist + shock;
        pts.push([xOf(i), y0 + dev]);
      }
      return pts;
    });
    return simCache;
  }

  function tone() {
    const style = getComputedStyle(document.documentElement);
    const pick = (name) => style.getPropertyValue(name).trim();
    return { ink: pick("--ink"), gap: pick("--gap"), sim: pick("--sim-line"), grid: pick("--grid"), dim: pick("--ink-dim") };
  }

  function stroke(ctx, pts, portion, color, width) {
    const count = Math.max(2, Math.floor(pts.length * portion));
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    pts.slice(0, count).forEach((pt, i) => {
      if (i === 0) ctx.moveTo(pt[0], pt[1]);
      else ctx.lineTo(pt[0], pt[1]);
    });
    ctx.stroke();
  }

  function drawTape(canvas, time) {
    const ctx = canvas.getContext("2d");
    const width = canvas.clientWidth || 640;
    const height = Math.round(width * 200 / 640);
    const dpr = window.devicePixelRatio || 1;
    const bw = Math.max(1, Math.round(width * dpr));
    const bh = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.height = height + "px";
    }
    ctx.setTransform((dpr * width) / 640, 0, 0, (dpr * width) / 640, 0, 0);
    ctx.clearRect(0, 0, 640, 200);
    const color = tone();
    ctx.strokeStyle = color.grid;
    ctx.lineWidth = 1;
    [62, 110, 158].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(28, y);
      ctx.lineTo(612, y);
      ctx.stroke();
    });

    const hist = [];
    for (let i = 0; i <= split; i += 1) hist.push([xOf(i), yOf(prices[i])]);
    const future = [];
    for (let i = split; i < tape.length; i += 1) future.push([xOf(i), yOf(prices[i])]);
    const ease = (u) => {
      const x = Math.min(1, Math.max(0, u));
      return x * x * (3 - 2 * x);
    };
    stroke(ctx, hist, ease(Math.min(1, time / 1.1)), color.ink, 1.6);

    const splitX = xOf(split);
    ctx.strokeStyle = color.gap;
    ctx.lineWidth = 1.25;
    ctx.beginPath();
    ctx.moveTo(splitX, 16);
    ctx.lineTo(splitX, 186);
    ctx.stroke();

    const fan = time > 1.15 ? ease(Math.min(1, (time - 1.15) / 1.15)) : 0;
    if (fan > 0) sims().forEach((path) => stroke(ctx, path, fan, color.sim, 1.15));
    const real = time > 2.45 ? ease(Math.min(1, (time - 2.45) / 1.15)) : 0;
    if (real > 0 && future.length > 1) stroke(ctx, future, real, color.ink, 1.7);

    ctx.font = "12px PingFang SC, sans-serif";
    ctx.fillStyle = color.dim;
    ctx.fillText(tape[split][0], Math.min(splitX + 8, 520), 18);
    if (time > 3.5) {
      ctx.fillStyle = color.sim;
      ctx.fillText(t("示意预测", "Sketch"), splitX + 8, 36);
      ctx.fillStyle = color.ink;
      ctx.fillText(t("后来的真实", "What followed"), splitX + 8 + ctx.measureText(t("示意预测", "Sketch")).width + 12, 36);
    }
    if (hover >= 0) {
      const hx = xOf(hover);
      ctx.strokeStyle = color.dim;
      ctx.setLineDash([3, 4]);
      ctx.beginPath();
      ctx.moveTo(hx, 16);
      ctx.lineTo(hx, 186);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.fillStyle = color.ink;
      ctx.beginPath();
      ctx.arc(hx, yOf(prices[hover]), 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function tipText() {
    const i = hover >= 0 ? hover : split;
    const price = prices[i].toLocaleString(lang() === "en" ? "en-US" : "zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const mark = i === newsAt ? t(" · 假设传闻进入", " · hypothetical rumor") : "";
    return tape[i][0] + "  NVDA  " + price + mark;
  }

  function paintHeld() {
    const canvas = document.getElementById("tape");
    if (!canvas) return;
    drawTape(canvas, chartDone || !chartPlaying ? END : chartShown);
    const tip = document.getElementById("tape-tip");
    if (tip) tip.textContent = chartDone ? tipText() : t("播完可拖动竖线，看任意一天的收盘。", "After it plays, drag the line to any day.");
  }

  function frame(now) {
    const gen = chartGen;
    const canvas = document.getElementById("tape");
    if (!canvas || gen !== chartGen) {
      chartPlaying = false;
      return;
    }
    chartShown = Math.min(END, (now - chartStart) / 1000);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) chartShown = END;
    drawTape(canvas, chartShown);
    if (gen !== chartGen) return;
    if (chartShown < END) requestAnimationFrame(frame);
    else {
      chartPlaying = false;
      chartDone = true;
      paintHeld();
      markReplay();
    }
  }

  function armChart() {
    const canvas = document.getElementById("tape");
    if (!canvas) return;
    if (chartDone) paintHeld();
    else if (!chartPlaying) {
      chartGen += 1;
      chartStart = performance.now();
      chartPlaying = true;
      requestAnimationFrame(frame);
    }
  }

  function bindTape() {
    const canvas = document.getElementById("tape");
    if (!canvas) return;
    canvas.addEventListener("pointermove", (event) => {
      if (!chartDone) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 640;
      if (dragging) {
        split = Math.min(tape.length - 8, Math.max(6, indexAt(x)));
        hover = split;
        paintHeld();
        return;
      }
      hover = indexAt(x);
      canvas.style.cursor = Math.abs(x - xOf(split)) < 14 ? "col-resize" : "crosshair";
      paintHeld();
    });
    canvas.addEventListener("pointerdown", (event) => {
      if (!chartDone) return;
      const rect = canvas.getBoundingClientRect();
      const x = ((event.clientX - rect.left) / rect.width) * 640;
      if (Math.abs(x - xOf(split)) > 16) {
        hover = indexAt(x);
        paintHeld();
        return;
      }
      dragging = true;
      canvas.setPointerCapture(event.pointerId);
    });
    canvas.addEventListener("pointerup", () => { dragging = false; });
    canvas.addEventListener("pointerleave", () => {
      if (dragging) return;
      hover = -1;
      paintHeld();
    });
  }

  function render() {
    const bits = [];
    bits.push(bubble("user", t(
      "如果黄仁勋出轨的传闻被爆出，我该怎么调整英伟达，以及其他芯片股？",
      "If a rumor says Jensen Huang had an affair, how should I change Nvidia and the other chip names?"
    )));
    if (index >= 0) {
      bits.push(bubble("bot", t(
        "<b>意图确认</b><ul class='checks'><li><em>出轨</em><span>待核验</span></li><li><em>离职</em><span>待公告</span></li></ul><p>先确认你要问的是仓位，不是把传闻写成事实。直接名字是 NVDA，还要看芯片同业和指数有没有一起动。</p>",
        "<b>Intent</b><ul class='checks'><li><em>Affair</em><span>Unchecked</span></li><li><em>Departure</em><span>No filing</span></li></ul><p>The question is the book, not a verdict on the rumor. NVDA is the direct name. Peers and the index get checked too.</p>"
      )));
    }
    if (index >= 1) {
      bits.push(bubble("bot wide", t(
        "<b>数据分析</b><p>2026-11-05 收盘到 2026-11-17 收盘。来源：Yahoo Finance 日线。</p><ul class='moves'><li><em>NVDA</em><s><b style='--w:58%'></b></s><span>-14.39%</span></li><li class='up'><em>AMD</em><s><b style='--w:98%'></b></s><span>+24.48%</span></li><li class='up'><em>AVGO</em><s><b style='--w:69%'></b></s><span>+17.17%</span></li><li class='up'><em>TSM</em><s><b style='--w:7%'></b></s><span>+1.87%</span></li><li><em>MSFT</em><s><b style='--w:22%'></b></s><span>-5.54%</span></li><li class='up'><em>QQQ</em><s><b style='--w:6%'></b></s><span>+1.53%</span></li><li class='up'><em>SOXX</em><s><b style='--w:29%'></b></s><span>+7.25%</span></li></ul><p>NVDA 在跌。AMD、AVGO、SOXX 这段是涨的。冲击没有均匀打到整个芯片篮子。</p>",
        "<b>Data</b><p>Close on 2026-11-05 to close on 2026-11-17. Source: Yahoo Finance daily.</p><ul class='moves'><li><em>NVDA</em><s><b style='--w:58%'></b></s><span>-14.39%</span></li><li class='up'><em>AMD</em><s><b style='--w:98%'></b></s><span>+24.48%</span></li><li class='up'><em>AVGO</em><s><b style='--w:69%'></b></s><span>+17.17%</span></li><li class='up'><em>TSM</em><s><b style='--w:7%'></b></s><span>+1.87%</span></li><li><em>MSFT</em><s><b style='--w:22%'></b></s><span>-5.54%</span></li><li class='up'><em>QQQ</em><s><b style='--w:6%'></b></s><span>+1.53%</span></li><li class='up'><em>SOXX</em><s><b style='--w:29%'></b></s><span>+7.25%</span></li></ul><p>NVDA fell. AMD, AVGO and SOXX rose over the same days. The shock did not hit the whole chip basket together.</p>"
      )));
    }
    if (index >= 2) {
      bits.push(bubble("bot", t(
        "<b>策略构建</b><div class='shift'><span>NVDA</span><b>30%</b><i></i><b>20%</b></div><div class='shift'><span>现金</span><b>15%</b><i></i><b>25%</b></div><p>演示账户。AMD、MSFT、QQQ 先留。不因为一则未核实传闻清掉整个芯片。</p>",
        "<b>Strategy</b><div class='shift'><span>NVDA</span><b>30%</b><i></i><b>20%</b></div><div class='shift'><span>Cash</span><b>15%</b><i></i><b>25%</b></div><p>A demo book. AMD, MSFT and QQQ stay. One unchecked rumor does not clear the whole chip basket.</p>"
      )));
    }
    if (index >= 3) {
      bits.push(bubble("bot wide", t(
        "<b>仿真测试</b><p>假设传闻在 2026-11-05 进入。蓝线从这一天起往下张开，是示意预测。白线是后来的真实收盘，到 11 月 17 日 155.46。</p><canvas id='tape' width='640' height='200' aria-label='NVDA 收盘、示意预测与后来的真实走势'></canvas><p class='fine' id='tape-tip'></p><div class='cf'><p><span>不减仓</span><i style='--w:100%'></i><b>-14.39%</b></p><p><span>减半</span><i style='--w:51%'></i><b>-7.27%</b></p></div><p>两条都从 11/5 收盘出发。不减仓跟着后来的真实跌幅。减半是反事实：卖出的一半按假设滑点 15bp 成交。</p>",
        "<b>Simulate</b><p>Suppose the rumor arrives on 2026-11-05. Blue opens downward from that day: a sketch forecast. White is the close that followed, 155.46 on Nov 17.</p><canvas id='tape' width='640' height='200' aria-label='NVDA close, sketch forecast, and the later real path'></canvas><p class='fine' id='tape-tip'></p><div class='cf'><p><span>Hold</span><i style='--w:100%'></i><b>-14.39%</b></p><p><span>Halve</span><i style='--w:51%'></i><b>-7.27%</b></p></div><p>Both start from the Nov 5 close. Holding follows the real decline. Halving is the counterfactual: the sold half pays an assumed 15bp of slippage.</p>"
      )));
    }
    if (index >= 4) {
      bits.push(bubble("bot", t(
        "<b>风险揭示</b><div class='risks'><div><b>-14.39%</b><span>回撤 · 11/5 到 11/17 收盘</span></div><div><b>-5.47%</b><span>极端日 · 11/10 NVDA</span></div><div><b>15bp</b><span>滑点 · 假设，不是实测成交</span></div><div><b>带往下张开</b><span>示意置信 · 不是模型打分</span></div></div><p>直接敞口高。同业没有一起跌，所以风险先落在 NVDA，不落在整个芯片篮子。</p>",
        "<b>Risk</b><div class='risks'><div><b>-14.39%</b><span>Drawdown · Nov 5 to Nov 17 close</span></div><div><b>-5.47%</b><span>Worst day · NVDA on Nov 10</span></div><div><b>15bp</b><span>Slippage · assumed, not a fill</span></div><div><b>Band opens down</b><span>Sketch confidence · not a model score</span></div></div><p>The direct exposure is high. Peers did not fall together, so the risk sits on NVDA, not on the whole chip basket.</p>"
      )));
    }
    if (index >= 5) {
      bits.push(bubble("bot", t(
        "<b>人工确认</b><div class='shift'><span>NVDA</span><b>集中</b><i></i><b>降低</b></div><p>其余不动。等你点头。账户还没连上。</p><button type='button' disabled>连接到账户</button>",
        "<b>Your confirmation</b><div class='shift'><span>NVDA</span><b>Concentrated</b><i></i><b>Smaller</b></div><p>The rest stays. Nothing runs until you agree. The account is still disconnected.</p><button type='button' disabled>Connect an account</button>"
      )));
    }
    if (index >= 6) {
      bits.push(bubble("bot", t(
        "<b>实际执行</b><p>确认之后才写模拟卖单：减 NVDA，现金留下。没有券商连接，单不会送出。</p>",
        "<b>Execute</b><p>A paper sell is written only after you confirm: trim NVDA, keep the cash. No broker is connected, so the order is not sent.</p>"
      )));
    }
    if (index >= 7) {
      bits.push(bubble("bot", t(
        "<b>持续复盘</b><p>11/17 收盘 NVDA 155.46。用后来的真实收盘对照蓝线和两条反事实。这一轮记下来，下一圈按目标再学。</p>",
        "<b>Review</b><p>NVDA closed at 155.46 on Nov 17. Set that later close against the blue band and the two counterfactuals. This round is kept, and the next loop learns from the objective.</p>"
      )));
    }
    chat.replaceChildren(...bits);
    chat.scrollTop = chat.scrollHeight;
    [...dots.children].forEach((button, i) => {
      button.classList.toggle("on", i === index);
      button.textContent = lang() === "en" ? scenes[i].en : scenes[i].zh;
    });
    bindTape();
    armChart();
    markReplay();
  }

  function markReplay() {
    const again = chartDone && !timer;
    replay.dataset.zh = again ? "再放一遍" : "播放";
    replay.dataset.en = again ? "Play again" : "Play";
    replay.textContent = t(replay.dataset.zh, replay.dataset.en);
  }

  function show(next, pause) {
    if (pause) {
      window.clearInterval(timer);
      timer = 0;
      if (next >= 3) {
        chartGen += 1;
        chartDone = true;
        chartPlaying = false;
      }
    }
    index = next;
    render();
  }

  function play() {
    window.clearInterval(timer);
    timer = 0;
    chartGen += 1;
    chartDone = false;
    chartPlaying = false;
    split = newsAt;
    hover = -1;
    simKey = -1;
    show(0, false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      chartDone = true;
      show(scenes.length - 1, false);
      return;
    }
    timer = window.setInterval(() => {
      if (index >= scenes.length - 1) {
        window.clearInterval(timer);
        timer = 0;
        markReplay();
        return;
      }
      show(index + 1, false);
    }, 1800);
  }

  replay.addEventListener("click", play);
  window.addEventListener("dai-lang", () => {
    render();
  });
  window.addEventListener("dai-theme", paintHeld);
  play();
})();
