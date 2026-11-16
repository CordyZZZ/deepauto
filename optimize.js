(function () {
  const chain = document.getElementById("chain");
  if (!chain) return;
  const nodes = [...chain.querySelectorAll(".node")];
  const flows = [...chain.querySelectorAll(".flow")];
  let step = -1;
  let timer = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  function render(next) {
    step = next;
    nodes.forEach((node, i) => node.classList.toggle("on", i <= step));
    flows.forEach((flow, i) => flow.classList.toggle("run", i < step));
  }

  function play() {
    window.clearInterval(timer);
    render(0);
    if (reduce) {
      render(nodes.length - 1);
      return;
    }
    timer = window.setInterval(() => {
      if (step >= nodes.length - 1) {
        window.clearInterval(timer);
        return;
      }
      render(step + 1);
    }, 700);
  }

  document.getElementById("replay").addEventListener("click", play);
  play();
})();
