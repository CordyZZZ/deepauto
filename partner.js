(function () {
  const chat = document.getElementById("chat");
  const dots = document.getElementById("dots");
  if (!chat || !dots) return;

  const scenes = [
    { zh: "表达意图", en: "Intent" },
    { zh: "研究和拆解", en: "Research" },
    { zh: "构建和回测", en: "Build" },
    { zh: "人工确认", en: "Confirm" },
    { zh: "执行和复盘", en: "Review" },
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
        ? "<b>Research</b><span class='work'><i></i><i></i><i></i></span><p>Taking the intent apart. Growth, with the constraint written down.</p>"
        : "<b>研究和拆解</b><span class='work'><i></i><i></i><i></i></span><p>正在拆开。方向朝着成长，约束先记下。</p>"));
    }
    if (index >= 2) {
      bits.push(bubble("bot", en
        ? "<b>Build and test</b><div class='rehearse'><i></i><i></i><i></i></div>"
        : "<b>构建和回测</b><div class='rehearse'><i></i><i></i><i></i></div>"));
    }
    if (index >= 3) {
      bits.push(bubble("bot", en
        ? "<b>Your confirmation</b><p>Nothing runs until you agree.</p><button type='button' disabled>Connect an account</button>"
        : "<b>人工确认</b><p>先等你点头。</p><button type='button' disabled>连接到账户</button>"));
    }
    if (index >= 4) {
      bits.push(bubble("bot", en
        ? "<b>Execute and review</b><p>The account is still disconnected. Execution and review come after you confirm.</p>"
        : "<b>执行和复盘</b><p>账户还没连上。确认之后，才执行，再复盘。</p>"));
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
