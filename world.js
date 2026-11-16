(function () {
  const market = document.getElementById("market");
  const walk = document.getElementById("walk");
  const beatEl = document.getElementById("beat");
  const beatEn = document.getElementById("beat-en");
  if (!market || typeof CSI === "undefined") return;

  const close = CSI.close;
  const SPLIT = 120;
  const BEATS = [
    [0, "沪深300", "CSI 300"],
    [1.7, "开始排练", "Rehearsal begins"],
    [3.6, "后来的真实走势", "What actually followed"],
    [5.4, "差距留在这里", "The gap stays visible"],
  ];
  const END = 7.2;
  const lo = Math.min.apply(null, close) - 30;
  const hi = Math.max.apply(null, close) + 30;

  function ease(t) {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  }

  function xOf(i) {
    return 56 + (844 * i) / (close.length - 1);
  }

  function yOf(price) {
    return 36 + ((hi - price) / (hi - lo)) * 332;
  }

  function simY(i, lane) {
    const t = (i - SPLIT) / (close.length - 1 - SPLIT);
    const wave = Math.sin(t * 2.6 + lane * 1.3) * 8 * t;
    return yOf(close[i]) + lane * 20 * t + wave;
  }

  const mctx = market.getContext("2d");
  const wctx = walk.getContext("2d");
  let started = 0;
  let lastShown = 0;
  let walkStarted = 0;

  function fit(canvas, ctx, ratioH) {
    const width = canvas.clientWidth;
    const height = Math.round(width * ratioH);
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.height = height + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return width / (ratioH === 420 / 960 ? 960 : 960);
  }

  function grid(ctx) {
    ctx.strokeStyle = "rgba(244, 241, 234, 0.08)";
    ctx.lineWidth = 1;
    for (let y = 70; y <= 340; y += 68) {
      ctx.beginPath();
      ctx.moveTo(48, y);
      ctx.lineTo(912, y);
      ctx.stroke();
    }
  }

  function strokePts(ctx, pts, portion, color, width) {
    const count = Math.max(2, Math.floor(pts.length * portion));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.beginPath();
    pts.slice(0, count).forEach(([x, y], i) => {
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  function marketFrame(now) {
    const scale = fit(market, mctx, 420 / 960);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shown = reduce ? END : Math.min(END, (now - started) / 1000);
    const hist = [];
    for (let i = 0; i <= SPLIT; i += 1) hist.push([xOf(i), yOf(close[i])]);
    const future = [];
    for (let i = SPLIT; i < close.length; i += 1) future.push([xOf(i), yOf(close[i])]);

    mctx.clearRect(0, 0, market.clientWidth, market.clientHeight);
    mctx.save();
    mctx.scale(scale, scale);
    grid(mctx);

    const splitX = xOf(SPLIT);
    mctx.strokeStyle = "rgba(226, 177, 90, 0.45)";
    mctx.beginPath();
    mctx.moveTo(splitX, 28);
    mctx.lineTo(splitX, 380);
    mctx.stroke();

    const histDraw = ease(Math.min(1, shown / 1.5));
    strokePts(mctx, hist, histDraw, "#f4f1ea", 2);

    const fan = shown > 1.7 ? ease(Math.min(1, (shown - 1.7) / 1.5)) : 0;
    if (fan > 0) {
      for (let lane = -2; lane <= 2; lane += 1) {
        if (lane === 0) continue;
        const path = [];
        for (let i = SPLIT; i < close.length; i += 1) path.push([xOf(i), simY(i, lane)]);
        strokePts(mctx, path, fan, "rgba(125, 206, 196, 0.8)", 1.35);
      }
    }

    const realDraw = shown > 3.6 ? ease(Math.min(1, (shown - 3.6) / 1.3)) : 0;
    if (realDraw > 0) strokePts(mctx, future, realDraw, "#f4f1ea", 2.2);

    if (shown > 5.4 && realDraw > 0.9) {
      const end = future[future.length - 1];
      const side = simY(close.length - 1, 2);
      const top = Math.min(end[1], side) - 4;
      const bottom = Math.max(end[1], side) + 4;
      const bracketX = Math.min(end[0] + 16, 928);
      mctx.font = "13px PingFang SC, sans-serif";
      mctx.fillStyle = "#f4f1ea";
      mctx.fillText("真实", splitX + 12, 46);
      mctx.fillStyle = "#7dcec4";
      mctx.fillText("模拟", splitX + 58, 46);
      mctx.strokeStyle = "#e2b15a";
      mctx.beginPath();
      mctx.moveTo(bracketX, top);
      mctx.lineTo(bracketX, bottom);
      mctx.stroke();
      mctx.fillStyle = "#e2b15a";
      mctx.fillText("差距", bracketX - 32, top - 8);
      mctx.fillStyle = "rgba(244,241,234,0.55)";
      mctx.fillText(CSI.date[SPLIT], splitX + 8, 24);
    }

    mctx.restore();
    const label = [...BEATS].reverse().find(([at]) => shown >= at);
    beatEl.textContent = label[1];
    beatEn.textContent = label[2];
    lastShown = shown;
    if (!reduce && shown < END) requestAnimationFrame(marketFrame);
  }

  function walkFrame(now) {
    const scale = fit(walk, wctx, 220 / 960);
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const span = reduce ? 1 : ((now - walkStarted) / 1000) % 8 / 8;
    const widthN = 36;
    const start = Math.round(span * (close.length - widthN - 1));
    const train = 26;

    wctx.clearRect(0, 0, walk.clientWidth, walk.clientHeight);
    wctx.save();
    wctx.scale(scale, scale);
    grid(wctx);
    const pts = close.map((price, i) => [xOf(i), 28 + ((hi - price) / (hi - lo)) * 164]);
    strokePts(wctx, pts, 1, "rgba(244,241,234,0.45)", 1.4);

    const x0 = xOf(start);
    const x1 = xOf(start + train);
    const x2 = xOf(start + widthN);
    wctx.fillStyle = "rgba(226, 177, 90, 0.13)";
    wctx.fillRect(x0, 24, x1 - x0, 172);
    wctx.fillStyle = "rgba(125, 206, 196, 0.14)";
    wctx.fillRect(x1, 24, x2 - x1, 172);
    wctx.font = "13px PingFang SC, sans-serif";
    wctx.fillStyle = "#e2b15a";
    wctx.fillText("训练", x0 + 8, 44);
    wctx.fillStyle = "#7dcec4";
    wctx.fillText("检验", x1 + 8, 44);
    wctx.restore();
    if (!reduce) requestAnimationFrame(walkFrame);
  }

  function play() {
    fit(market, mctx, 420 / 960);
    started = performance.now();
    requestAnimationFrame(marketFrame);
  }

  window.addEventListener("resize", () => {
    fit(market, mctx, 420 / 960);
    fit(walk, wctx, 220 / 960);
    if (lastShown >= END) marketFrame(started + END * 1000);
  });
  document.getElementById("replay").addEventListener("click", play);
  play();
  walkStarted = performance.now();
  requestAnimationFrame(walkFrame);
})();
