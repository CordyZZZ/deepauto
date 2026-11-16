(function () {
  const canvas = document.getElementById("pulse");
  if (!canvas || typeof CSI === "undefined") return;
  const ctx = canvas.getContext("2d");
  const close = CSI.close;
  let started = 0;
  let lastShown = 0;
  const END = 2.8;

  function resize() {
    const width = canvas.clientWidth;
    const height = Math.round(width * 180 / 960);
    const ratio = window.devicePixelRatio || 1;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    canvas.style.height = height + "px";
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }

  function ease(t) {
    const x = Math.min(1, Math.max(0, t));
    return x * x * (3 - 2 * x);
  }

  function frame(now) {
    const width = canvas.clientWidth;
    const scale = width / 960;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const shown = reduce ? END : Math.min(END, (now - started) / 1000);
    const portion = ease(Math.min(1, shown / 2.2));
    const lo = Math.min.apply(null, close);
    const hi = Math.max.apply(null, close);
    const count = Math.max(2, Math.floor(close.length * portion));

    ctx.clearRect(0, 0, width, canvas.clientHeight);
    ctx.save();
    ctx.scale(scale, scale);
    ctx.strokeStyle = "rgba(244, 241, 234, 0.08)";
    ctx.lineWidth = 1;
    [48, 90, 132].forEach((y) => {
      ctx.beginPath();
      ctx.moveTo(36, y);
      ctx.lineTo(924, y);
      ctx.stroke();
    });
    ctx.beginPath();
    ctx.strokeStyle = "#f4f1ea";
    ctx.lineWidth = 1.6;
    ctx.lineJoin = "round";
    for (let i = 0; i < count; i += 1) {
      const x = 36 + (888 * i) / (close.length - 1);
      const y = 28 + ((hi - close[i]) / (hi - lo)) * 124;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
    lastShown = shown;
    if (!reduce && shown < END) requestAnimationFrame(frame);
  }

  function play() {
    resize();
    started = performance.now();
    requestAnimationFrame(frame);
  }

  window.addEventListener("resize", () => {
    resize();
    if (lastShown >= END) frame(started + END * 1000);
  });
  play();
})();
