(function () {
const form = document.getElementById("form");
const result = document.getElementById("result");
const echo = document.getElementById("echo");
const pred = document.getElementById("pred");
const opt = document.getElementById("opt");
const flow = document.getElementById("flow");
const out = document.getElementById("out");
const steps = [...document.querySelectorAll("#steps li")];
let timers = [];

function later(fn, ms) {
  timers.push(window.setTimeout(fn, ms));
}

function mark(step) {
  steps.forEach((item) => {
    const on = Number(item.dataset.step) <= step;
    item.classList.toggle("on", on);
  });
}

function generatePosition(event) {
  if (event) event.preventDefault();
  const text = document.getElementById("view").value.trim();
  if (!text) {
    document.getElementById("view").focus();
    return false;
  }
  timers.forEach(window.clearTimeout);
  timers = [];
  echo.textContent = text;
  document.getElementById("out-view").textContent = text;
  pred.classList.remove("on");
  opt.classList.remove("on");
  flow.classList.remove("run");
  out.hidden = true;
  result.hidden = false;
  mark(1);
  echo.focus();

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) {
    pred.classList.add("on");
    opt.classList.add("on");
    out.hidden = false;
    mark(4);
    return false;
  }

  later(() => mark(2), 180);
  later(() => {
    pred.classList.add("on");
    mark(3);
  }, 520);
  later(() => flow.classList.add("run"), 900);
  later(() => {
    opt.classList.add("on");
    out.hidden = false;
    mark(4);
  }, 1400);
  return false;
}

window.generatePosition = generatePosition;
form.addEventListener("submit", generatePosition);
})();
