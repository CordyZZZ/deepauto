(function () {
  const chat = document.getElementById("chat");
  const dots = document.getElementById("dots");
  if (!chat || !dots) return;

  const scenes = [
    { zh: "观点", en: "View" },
    { zh: "分析", en: "Analysis" },
    { zh: "推演", en: "Walk-through" },
    { zh: "仓位", en: "Position" },
    { zh: "确认", en: "Confirm" },
  ];

  let index = 0;
  let timer = 0;

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

  function t(zh, en) {
    return window.daiLang() === "en" ? en : zh;
  }

  function bubble(kind, html) {
    const el = document.createElement("div");
    el.className = "msg " + kind;
    el.innerHTML = html;
    return el;
  }

  function render() {
    const en = window.daiLang() === "en";
    const bits = [];
    bits.push(bubble("user", en
      ? "If the Fed cuts, look to the leading names in technology."
      : "如果美联储降息，看向科技龙头。"));
    if (index >= 1) {
      bits.push(bubble("bot", en
        ? "<b>Analysis</b><span class='work'><i></i><i></i><i></i></span><p>Reading the view. Growth, with the constraint written down.</p>"
        : "<b>分析</b><span class='work'><i></i><i></i><i></i></span><p>正在处理。方向朝着成长，约束先记下。</p>"));
    }
    if (index >= 2) {
      bits.push(bubble("bot", en
        ? "<b>Walk-through</b><div class='rehearse'><i></i><i></i><i></i></div>"
        : "<b>推演</b><div class='rehearse'><i></i><i></i><i></i></div>"));
    }
    if (index >= 3) {
      bits.push(bubble("bot", en
        ? "<b>Position</b><p>A preview, in front of you. No figures yet.</p>"
        : "<b>仓位</b><p>一份预览，放在你面前。尚无数字。</p>"));
    }
    if (index >= 4) {
      bits.push(bubble("bot", en
        ? "<b>Confirm</b><p>It waits for your agreement.</p><button type='button' disabled>Connect an account</button>"
        : "<b>确认</b><p>执行，等你点头。</p><button type='button' disabled>连接到账户</button>"));
    }
    chat.replaceChildren(...bits);
    chat.scrollTop = chat.scrollHeight;
    [...dots.children].forEach((button, i) => {
      button.classList.toggle("on", i === index);
      button.textContent = en ? scenes[i].en : scenes[i].zh;
    });
  }

  function show(next, pause) {
    index = next;
    render();
    if (pause) window.clearInterval(timer);
  }

  function play() {
    window.clearInterval(timer);
    show(0, false);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      show(scenes.length - 1, false);
      return;
    }
    timer = window.setInterval(() => {
      if (index >= scenes.length - 1) {
        window.clearInterval(timer);
        return;
      }
      show(index + 1, false);
    }, 1500);
  }

  document.getElementById("replay").addEventListener("click", play);
  window.addEventListener("dai-lang", render);
  play();
})();
