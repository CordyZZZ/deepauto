(function () {
  const market = document.getElementById("market");
  const walk = document.getElementById("walk");
  const beatEl = document.getElementById("beat");
  const beatEn = document.getElementById("beat-en");
  const tip = document.getElementById("tip");
  if (!market || !walk || typeof CSI === "undefined") return;

  const close = CSI.close;
  const dates = CSI.date;
  const n = close.length;
  const lo = Math.min.apply(null, close) - 40;
  const hi = Math.max.apply(null, close) + 40;
  const BEATS = [
    [0, "沪深300", "CSI 300"],
    [1.6, "开始模拟", "Simulation begins"],
    [3.5, "后来的真实走势", "What actually followed"],
  ];
  const END = 6.8;
  let split = Math.round(n * 0.78);
  let hover = -1;
  let dragging = false;
  let playing = true;
  let started = 0;
  let shown = 0;
  let simKey = -1;
  let simCache = [];
  let walkStart = 0;
  const mctx = market.getContext("2d");
  const wctx = walk.getContext("2d");

  function lang() {
    return document.documentElement.dataset.lang === "en" ? "en" : "zh";
  }

  function ease(t) {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  }

  function rand(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function xOf(i) {
    return 56 + (860 * i) / (n - 1);
  }

  function yOf(price) {
    return 36 + ((hi - price) / (hi - lo)) * 340;
  }

  function indexAt(x) {
    const t = (x - 56) / 860;
    return Math.round(Math.min(n - 1, Math.max(0, t * (n - 1))));
  }

  function sims() {
    if (simKey === split) return simCache;
    simKey = split;
    simCache = [-1.6, -0.7, 0.8, 1.7].map((lane) => {
      const next = rand((split + 1) * 97 + Math.round(lane * 40) * 13);
      const pts = [[xOf(split), yOf(close[split])]];
      let y = yOf(close[split]);
      for (let i = split + 1; i < n; i += 1) {
        const pull = yOf(close[i]);
        y = y * 0.62 + pull * 0.38 + (next() - 0.5) * 16 * Math.abs(lane);
        pts.push([xOf(i), y]);
      }
      return pts;
    });
    return simCache;
  }

  function begin(ctx, canvas, logicalH) {
    const width = canvas.clientWidth || 960;
    const height = Math.round(width * logicalH / 960);
    const dpr = window.devicePixelRatio || 1;
    const bw = Math.max(1, Math.round(width * dpr));
    const bh = Math.max(1, Math.round(height * dpr));
    if (canvas.width !== bw || canvas.height !== bh) {
      canvas.width = bw;
      canvas.height = bh;
      canvas.style.height = height + "px";
    }
    ctx.setTransform((dpr * width) / 960, 0, 0, (dpr * width) / 960, 0, 0);
    ctx.clearRect(0, 0, 960, logicalH);
  }

  function stroke(ctx, pts, portion, color, width) {
    const count = Math.max(2, Math.floor(pts.length * portion));
    ctx.beginPath();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    for (let i = 0; i < count; i += 1) {
      const [x, y] = pts[i];
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }

  function tone() {
    const style = getComputedStyle(document.documentElement);
    const pick = (name) => style.getPropertyValue(name).trim();
    return {
      ink: pick("--ink"),
      gap: pick("--gap"),
      sim: pick("--sim-line"),
      forecast: pick("--forecast"),
      grid: pick("--grid"),
      wash: pick("--wash"),
      hair: pick("--hair"),
      dim: pick("--ink-dim"),
    };
  }

  function grid(ctx, bottom) {
    ctx.strokeStyle = tone().grid;
    ctx.lineWidth = 1;
    for (let y = 78; y < bottom; y += 70) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(930, y);
      ctx.stroke();
    }
  }

  function drawMarket(time) {
    begin(mctx, market, 420);
    const color = tone();
    grid(mctx, 390);
    const hist = [];
    for (let i = 0; i <= split; i += 1) hist.push([xOf(i), yOf(close[i])]);
    const future = [];
    for (let i = split; i < n; i += 1) future.push([xOf(i), yOf(close[i])]);
    const histDraw = ease(Math.min(1, time / 1.45));
    stroke(mctx, hist, histDraw, color.ink, 1.7);

    const splitX = xOf(split);
    mctx.strokeStyle = color.gap;
    mctx.lineWidth = 1.25;
    mctx.beginPath();
    mctx.moveTo(splitX, 24);
    mctx.lineTo(splitX, 396);
    mctx.stroke();

    const fan = time > 1.6 ? ease(Math.min(1, (time - 1.6) / 1.45)) : 0;
    if (fan > 0) {
      sims().forEach((path) => stroke(mctx, path, fan, color.sim, 1.25));
    }
    const realDraw = time > 3.5 ? ease(Math.min(1, (time - 3.5) / 1.2)) : 0;
    if (realDraw > 0) stroke(mctx, future, realDraw, color.ink, 1.8);

    mctx.font = "13px PingFang SC, sans-serif";
    mctx.fillStyle = color.dim;
    mctx.fillText(dates[split], splitX + 8, 22);
    if (time > 5.2 && realDraw > 0.85) {
      mctx.fillStyle = color.ink;
      mctx.fillText("真实", splitX + 8, 48);
      mctx.fillStyle = color.sim;
      mctx.fillText("模拟", splitX + 56, 48);
      const end = future[future.length - 1];
      const farthest = sims().reduce((acc, path) => {
        const y = path[path.length - 1][1];
        return Math.abs(y - end[1]) > Math.abs(acc - end[1]) ? y : acc;
      }, end[1]);
      const top = Math.min(end[1], farthest);
      const bottom = Math.max(end[1], farthest);
      const bracket = Math.min(end[0] + 8, 912);
      mctx.strokeStyle = color.gap;
      mctx.beginPath();
      mctx.moveTo(bracket, top);
      mctx.lineTo(bracket, bottom);
      mctx.stroke();
      mctx.fillStyle = color.gap;
      mctx.fillText("差距", Math.max(splitX + 8, bracket - 40), Math.max(70, top - 10));
    }

    if (hover >= 0) {
      const hx = xOf(hover);
      mctx.strokeStyle = color.hair;
      mctx.setLineDash([3, 4]);
      mctx.beginPath();
      mctx.moveTo(hx, 24);
      mctx.lineTo(hx, 396);
      mctx.stroke();
      mctx.setLineDash([]);
      mctx.fillStyle = color.ink;
      mctx.beginPath();
      mctx.arc(hx, yOf(close[hover]), 3.2, 0, Math.PI * 2);
      mctx.fill();
    }

    const label = [...BEATS].reverse().find(([at]) => time >= at);
    beatEl.textContent = lang() === "en" ? label[2] : label[1];
    beatEn.textContent = "";
  }

  function logicalX(event, canvas) {
    const rect = canvas.getBoundingClientRect();
    return ((event.clientX - rect.left) / rect.width) * 960;
  }

  function showTip(index) {
    if (index < 0) {
      tip.hidden = true;
      return;
    }
    const price = close[index].toLocaleString(lang() === "en" ? "en-US" : "zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    tip.hidden = false;
    tip.textContent = dates[index] + "  " + price;
  }

  function frame(now) {
    shown = playing ? Math.min(END, (now - started) / 1000) : END;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) shown = END;
    drawMarket(shown);
    if (playing && shown < END) requestAnimationFrame(frame);
    else playing = false;
  }

  function play() {
    playing = true;
    hover = -1;
    showTip(-1);
    started = performance.now();
    requestAnimationFrame(frame);
  }

  market.addEventListener("pointermove", (event) => {
    const x = logicalX(event, market);
    if (dragging) {
      split = Math.min(n - 30, Math.max(40, indexAt(x)));
      playing = false;
      shown = END;
      drawMarket(END);
      showTip(split);
      return;
    }
    hover = indexAt(x);
    market.style.cursor = Math.abs(x - xOf(split)) < 18 ? "col-resize" : "crosshair";
    if (!playing) drawMarket(END);
    showTip(hover);
  });

  market.addEventListener("pointerdown", (event) => {
    const x = logicalX(event, market);
    if (Math.abs(x - xOf(split)) > 22) return;
    dragging = true;
    market.setPointerCapture(event.pointerId);
    playing = false;
  });

  market.addEventListener("pointerup", () => {
    dragging = false;
  });

  market.addEventListener("pointerleave", () => {
    if (dragging) return;
    hover = -1;
    showTip(-1);
    if (!playing) drawMarket(END);
  });

  function xHist(i) {
    return 48 + (760 * i) / (n - 1);
  }

  function yWalk(price) {
    return 28 + ((hi - price) / (hi - lo)) * 180;
  }

  let walkSpan = 0;

  function drawWalk(now) {
    begin(wctx, walk, 240);
    grid(wctx, 214);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const span = reduce ? 1 : Math.min(1, (now - walkStart) / 1000 / 36);
    walkSpan = span;
    const frontier = Math.max(1, Math.round(span * (n - 1)));
    const pts = close.map((price, i) => [xHist(i), yWalk(price)]);
    const color = tone();
    stroke(wctx, pts.slice(0, frontier + 1), 1, color.ink, 1.5);
    const x0 = xHist(0);
    const x1 = xHist(frontier);
    wctx.fillStyle = color.wash;
    wctx.fillRect(x0, 20, Math.max(1, x1 - x0), 196);
    wctx.strokeStyle = color.gap;
    wctx.lineWidth = 1.25;
    wctx.beginPath();
    wctx.moveTo(x1, 20);
    wctx.lineTo(x1, 216);
    wctx.stroke();

    const horizon = 70;
    const stepX = 150 / horizon;
    [-1, 0.2, 1].forEach((lane, k) => {
      const next = rand(9000 + frontier * 3 + k * 17);
      let y = yWalk(close[frontier]);
      wctx.beginPath();
      wctx.moveTo(x1, y);
      for (let s = 1; s <= horizon; s += 1) {
        y += (next() - 0.48) * 7 + lane * 0.35;
        wctx.lineTo(x1 + stepX * s, y);
      }
      wctx.strokeStyle = color.sim;
      wctx.lineWidth = 1.8;
      wctx.stroke();
    });

    wctx.font = "13px PingFang SC, sans-serif";
    wctx.fillStyle = color.sim;
    wctx.fillText("预测", Math.min(x1 + 12, 900), 36);
    const price = close[frontier].toLocaleString(lang() === "en" ? "en-US" : "zh-CN", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    const label = dates[frontier] + "  " + price;
    wctx.fillStyle = color.ink;
    wctx.fillText(label, Math.max(56, Math.min(x1 + 8, 760)), 58);
    if (span < 1) requestAnimationFrame(drawWalk);
  }

  document.getElementById("replay").addEventListener("click", play);
  window.addEventListener("dai-theme", () => {
    drawMarket(playing ? shown : END);
    if (walkSpan >= 1) drawWalk(walkStart + 36000);
  });
  window.addEventListener("resize", () => {
    drawMarket(playing ? shown : END);
  });
  play();
  walkStart = performance.now();
  requestAnimationFrame(drawWalk);
})();
