(function () {
  const line = document.getElementById("line");
  const lineEn = document.getElementById("line-en");
  const kicker = document.getElementById("kicker");
  const kickerEn = document.getElementById("kicker-en");
  const extra = document.getElementById("extra");
  const dots = document.getElementById("dots");
  if (!line || !dots) return;

  const scenes = [
    {
      kicker: "观点",
      kickerEn: "Your view",
      line: "如果美联储降息，看向科技龙头。",
      en: "If the Fed cuts, look to the leading names in technology.",
      extra: "",
    },
    {
      kicker: "听见",
      kickerEn: "What we heard",
      line: "方向朝着成长。约束先记下。",
      en: "A tilt toward growth. Constraints noted, before any order.",
      extra: "",
    },
    {
      kicker: "排练",
      kickerEn: "Rehearsal",
      line: "先在模拟里走一遍。",
      en: "It walks through the simulation first.",
      extra: '<div class="rehearse" aria-hidden="true"><i></i><i></i><i></i></div>',
    },
    {
      kicker: "仓位",
      kickerEn: "A position",
      line: "一份预览，放在你面前。",
      en: "A preview, placed in front of you.",
      extra: '<dl class="out"><dt>方向</dt><dd>顺着这句观点<small class="en">With the view</small></dd><dt>仓位</dt><dd>预览，尚无数字<small class="en">Preview, no figures yet</small></dd><dt>确认</dt><dd>还在你手里<small class="en">Still yours</small></dd></dl>',
    },
    {
      kicker: "确认",
      kickerEn: "Your word",
      line: "执行，等你点头。",
      en: "It waits for your agreement.",
      extra: '<button type="button" disabled>连接到账户<small class="en">Connect an account</small></button><p class="note">账户还没有接上。The account is not connected.</p>',
    },
  ];

  let index = 0;
  let timer = 0;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  scenes.forEach((scene, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = scene.kicker;
    button.addEventListener("click", () => show(i, true));
    dots.append(button);
  });

  function show(next, pause) {
    index = next;
    const scene = scenes[index];
    kicker.textContent = scene.kicker;
    kickerEn.textContent = scene.kickerEn;
    line.textContent = scene.line;
    lineEn.textContent = scene.en;
    extra.innerHTML = scene.extra;
    [...dots.children].forEach((button, i) => button.classList.toggle("on", i === index));
    if (pause) window.clearInterval(timer);
  }

  function play() {
    window.clearInterval(timer);
    show(0, false);
    if (reduce) {
      show(scenes.length - 1, false);
      return;
    }
    timer = window.setInterval(() => {
      if (index >= scenes.length - 1) {
        window.clearInterval(timer);
        return;
      }
      show(index + 1, false);
    }, 1600);
  }

  document.getElementById("replay").addEventListener("click", play);
  play();
})();
