const canvas = document.getElementById("market");
const beatEl = document.getElementById("beat");
const ctx = canvas.getContext("2d");

const BEATS = [
  [0, "一条价格"],
  [1.7, "散开"],
  [3.2, "许多可能的价格"],
  [5.2, "真实，和模拟"],
  [6.6, "差距在缩小"],
];
const END = 8.8;

const history = walk(48, 430, 210);
const realFuture = walk(430, 860, history[history.length - 1][1], 0.55);

function walk(x0, x1, y, calm) {
  const n = 48;
  const pts = [];
  let cur = y;
  for (let i = 0; i < n; i += 1) {
    const wobble = Math.sin(i * 0.73 + x0 * 0.01) * 14 + Math.sin(i * 0.27) * 8;
    cur = cur * 0.82 + (210 + wobble) * 0.18;
    pts.push([x0 + ((x1 - x0) * i) / (n - 1), cur]);
  }
  if (calm) {
    const start = pts[0][1];
    return pts.map(([x, py], i) => {
      const t = i / (n - 1);
      return [x, start + (py - start) * (0.35 + calm * t)];
    });
  }
  return pts;
}

realFuture[0][1] = history[history.length - 1][1];

function ease(t) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function spreadAt(time) {
  if (time < 3.2) return 0;
  if (time < 5.2) return ease((time - 3.2) / 2);
  if (time < 6.6) return 1;
  if (time < END) return 1 - 0.82 * ease((time - 6.6) / 2.2);
  return 0.18;
}

function simPoint(index, t, spread) {
  const base = realFuture[index][1];
  return base + lane * 26 * t * spread;
}

let lane = 0;
function simPath(which, spread) {
  lane = which;
  return realFuture.map(([x], i) => {
    const t = i / (realFuture.length - 1);
    return [x, simPoint(i, t, spread)];
  });
}

const SIMS = 6;

function resize() {
  const width = canvas.clientWidth;
  const height = Math.round(width * 420 / 960);
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.round(width * ratio);
  canvas.height = Math.round(height * ratio);
  canvas.style.height = height + "px";
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
}

let started = 0;
let lastShown = 0;

function frame(now) {
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  const scale = width / 960;
  const time = Math.min(END, (now - started) / 1000);
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const shown = reduce ? END : time;

  ctx.clearRect(0, 0, width, height);
  ctx.save();
  ctx.scale(scale, scale);

  ctx.strokeStyle = "rgba(244, 241, 234, 0.08)";
  ctx.lineWidth = 1;
  for (let y = 70; y <= 360; y += 58) {
    ctx.beginPath();
    ctx.moveTo(48, y);
    ctx.lineTo(900, y);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(226, 177, 90, 0.45)";
  ctx.beginPath();
  ctx.moveTo(430, 36);
  ctx.lineTo(430, 384);
  ctx.stroke();

  const spread = spreadAt(shown);
  const drawFuture = shown > 3.2 ? ease(Math.min(1, (shown - 3.2) / 1.4)) : 0;

  if (shown > 3.2) {
    for (let s = 0; s < SIMS; s += 1) {
      stroke(simPath(s - 2.5, spread), drawFuture, "rgba(125, 206, 196, 0.75)", 1.4);
    }
    stroke(realFuture, drawFuture, "#f4f1ea", shown > 5.2 ? 2.4 : 1.6);
  }

  const histDraw = ease(Math.min(1, shown / 1.5));
  const histFade = shown < 1.7 ? 1 : Math.max(0.25, 1 - (shown - 1.7) / 1.2);
  ctx.globalAlpha = histFade;
  stroke(history, histDraw, "#f4f1ea", 2);
  ctx.globalAlpha = 1;

  if (shown > 1.7 && shown < 4.2) {
    const burst = ease(Math.min(1, (shown - 1.7) / 1.3));
    const fade = shown < 3.2 ? 1 : 1 - (shown - 3.2) / 1;
    ctx.fillStyle = `rgba(244, 241, 234, ${0.85 * fade})`;
    history.forEach(([x, y], i) => {
      if (i % 2) return;
      const ang = i * 0.9;
      const dx = Math.cos(ang) * 28 * burst;
      const dy = Math.sin(ang * 1.3) * 22 * burst;
      ctx.beginPath();
      ctx.arc(x + dx, y + dy, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });
  }

  if (shown > 5.2 && drawFuture > 0.85) {
    const end = realFuture[realFuture.length - 1];
    const sideEnd = simPath(2.5, spread)[realFuture.length - 1];
    const top = Math.min(end[1], sideEnd[1]);
    const bottom = Math.max(end[1], sideEnd[1]);
    ctx.font = "14px PingFang SC, sans-serif";
    ctx.fillStyle = "#f4f1ea";
    ctx.fillText("真实", 620, top - 14);
    ctx.fillStyle = "#7dcec4";
    ctx.fillText("模拟", 620, Math.max(bottom + 18, top + 8));
    ctx.strokeStyle = "#e2b15a";
    ctx.beginPath();
    ctx.moveTo(878, top);
    ctx.lineTo(878, bottom);
    ctx.stroke();
    ctx.fillStyle = "#e2b15a";
    ctx.fillText("差距", 888, (top + bottom) / 2 + 4);
  }

  ctx.restore();

  lastShown = shown;
  const label = [...BEATS].reverse().find(([at]) => shown >= at);
  beatEl.textContent = label[1];

  if (!reduce && time < END) requestAnimationFrame(frame);
}

function stroke(points, portion, color, width) {
  const count = Math.max(2, Math.floor(points.length * portion));
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";
  ctx.beginPath();
  points.slice(0, count).forEach(([x, y], i) => {
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  });
  ctx.stroke();
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
document.getElementById("replay").addEventListener("click", play);
play();
