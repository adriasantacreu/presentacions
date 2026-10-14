// Motor de diapositives (tema adria): revelat amb fletxeta, navegació i ginys. Sense dependències (a part de KaTeX).
(() => {
const $$ = (s, el = document) => [...el.querySelectorAll(s)];
const COLORS = ["var(--blau)", "var(--verd)", "var(--lila)", "var(--rosa)"];
let MAT, LOGO, slides, cur = 0;  // s'omplen en carregar (l'script va al <head>)

// --- Taules matemàtiques: files amb \\ o salt de línia, cel·les amb &. Prefixos: _ ratlla a sobre, ? es revela, ! requadre
function taules() {
  for (const el of $$(".mt-src")) {
    const t = document.createElement("table");
    t.className = el.className.replace("mt-src", "mt");
    for (const linia of el.textContent.split(/\\\\|\n/).map(s => s.trim()).filter(Boolean)) {
      const tr = t.insertRow();
      for (let c of linia.split("&")) {
        c = c.trim();
        const td = tr.insertCell();
        while (/^[_?!]/.test(c)) {
          td.classList.add({ "_": "u", "?": "r", "!": "bx" }[c[0]]);
          c = c.slice(1).trim();
        }
        if (c) td.innerHTML = `<span>\\(${c}\\)</span>`;
      }
    }
    // a la divisió llarga, les ratlles de les files que es revelen també s'amaguen
    for (const tr of t.rows) if (tr.querySelector(".r")) for (const td of tr.cells) if (td.classList.contains("u")) td.classList.add("r");
    // la ratlla vertical del divisor no s'ha de trencar: s'amaga el contingut, no la cel·la
    if (t.classList.contains("div")) for (const tr of t.rows) {
      const td = tr.cells[tr.cells.length - 1];
      if (td.classList.contains("r") && td.firstChild) { td.classList.remove("r"); td.firstChild.classList.add("r"); }
    }
    el.replaceWith(t);
  }
}

// --- Estructura: color de secció, títol amb matèria, peu amb logo i número
function estructura() {
  let ci = -1, sec = 0;
  slides.forEach((s, i) => {
    if (s.classList.contains("seccio")) {
      ci = (ci + 1) % 4; sec++;
      s.insertAdjacentHTML("afterbegin", `<div class="n">SECCIÓ ${sec}</div>`);
    }
    if (ci >= 0) s.style.setProperty("--cc", COLORS[ci]);
    if (s.dataset.bg) s.style.background = s.dataset.bg;
    const h = s.querySelector(":scope>h2");
    if (h && MAT) h.insertAdjacentHTML("beforeend", `<span class="mat">${MAT}</span>`);
    if (h) {
      s.insertAdjacentHTML("beforeend", `${LOGO ? `<img class="foot-logo" src="${LOGO}" alt="">` : ""}<div class="foot-num">${i + 1}</div>`);
    }
    if (s.dataset.temps) s.insertAdjacentHTML("beforeend", `<div class="temps">Pausa · ${s.dataset.temps}</div>`);
  });
}

// --- Revelat: .res (amb fletxeta pròpia) i .rg (grup: una fletxeta revela tots els .r de dins)
function revela(els, btn) {
  els.forEach(e => e.classList.remove("amagat"));
  if (btn) btn.classList.add("fet");
}
function preparaRevelat() {
  for (const g of $$(".rg")) {
    const rs = $$(".r", g);
    const b = boto(() => revela(rs, b));
    g.prepend(b);
    rs.forEach(r => { r.classList.add("amagat"); r.onclick = () => revela(rs, b); });
  }
  for (const r of $$(".res")) {
    r.classList.add("amagat");
    const b = boto(() => revela([r], b));
    if (getComputedStyle(r).display === "inline") r.before(b); else b.remove();
    r.onclick = () => revela([r], b.isConnected ? b : null);
  }
}
function boto(fn) {
  const b = document.createElement("button");
  b.className = "rev"; b.title = "Mostra el resultat"; b.textContent = "▶";
  b.onclick = e => { e.stopPropagation(); fn(); };
  return b;
}
const pendents = s => $$(".amagat", s);
function revelaTot(s) {
  pendents(s).forEach(e => e.classList.remove("amagat"));
  $$(".rev", s).forEach(b => b.classList.add("fet"));
}
function amagaTot(s) {
  $$(".res,.r", s).forEach(e => e.classList.add("amagat"));
  $$(".rev", s).forEach(b => b.classList.remove("fet"));
}

// --- Navegació
function mostra(i) {
  cur = Math.max(0, Math.min(slides.length - 1, i));
  slides.forEach((s, k) => s.classList.toggle("on", k === cur));
  history.replaceState(null, "", "#" + (cur + 1));
  document.getElementById("barra").style.width = (100 * (cur + 1) / slides.length) + "%";
  document.getElementById("barra").style.background = getComputedStyle(slides[cur]).getPropertyValue("--cc");
}
function seguent() {
  const s = slides[cur];
  if (document.body.classList.contains("lectura")) return;
  if (pendents(s).length) revelaTot(s); else mostra(cur + 1);
}
function escala() {
  const st = document.getElementById("stage");
  if (document.body.classList.contains("lectura")) { st.style.zoom = Math.min(1, (innerWidth - 24) / 1280); return; }
  st.style.zoom = "";
  const k = Math.min(innerWidth / 1280, innerHeight / 720);
  st.style.transform = `translate(-50%,-50%) scale(${k})`;
}
function canviaMode(lectura) {  // lectura: totes seguides amb scroll; si no, diapo a diapo
  document.body.classList.toggle("lectura", lectura);
  document.getElementById("mode").textContent = lectura ? "▶ Mode diapositives (L)" : "☰ Mode lectura (L)";
  escala();
  if (lectura) slides[cur].scrollIntoView(); else mostra(cur);
}
function navegacio() {
  document.body.insertAdjacentHTML("beforeend",
    `<div id="barra"></div><button class="nav" id="prev" title="Anterior (←)">‹</button><button class="nav" id="next" title="Següent (→, espai)">›</button><button id="mode"></button>`);
  document.getElementById("mode").onclick = () => canviaMode(!document.body.classList.contains("lectura"));
  document.getElementById("prev").onclick = () => mostra(cur - 1);
  document.getElementById("next").onclick = seguent;
  addEventListener("keydown", e => {
    if (e.target.matches("input,textarea,select")) return;
    const k = e.key;
    if (["ArrowRight", "PageDown", " ", "Enter"].includes(k)) { e.preventDefault(); seguent(); }
    else if (["ArrowLeft", "PageUp", "Backspace"].includes(k)) { e.preventDefault(); mostra(cur - 1); }
    else if (k === "Home") mostra(0);
    else if (k === "End") mostra(slides.length - 1);
    else if (k === "f" || k === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen();
    else if (k === "r" || k === "R") amagaTot(slides[cur]);
    else if (k === "l" || k === "L") canviaMode(!document.body.classList.contains("lectura"));
  });
  let x0 = null;  // lliscar a la pissarra digital o al mòbil
  addEventListener("touchstart", e => { x0 = e.touches[0].clientX; }, { passive: true });
  addEventListener("touchend", e => {
    if (x0 === null || e.target.closest(".giny")) return;
    const dx = e.changedTouches[0].clientX - x0; x0 = null;
    if (Math.abs(dx) > 80) dx < 0 ? seguent() : mostra(cur - 1);
  });
  addEventListener("resize", escala);
}

// --- Utilitats per als ginys
const num = v => {  // nombre bonic: enters, fraccions de denominador petit, o decimals amb coma
  if (Number.isInteger(v)) return String(v);
  for (const d of [2, 4, 8, 16, 3]) {
    const n = v * d;
    if (Math.abs(n - Math.round(n)) < 1e-9) return `${v < 0 ? "-" : ""}\\tfrac{${Math.abs(Math.round(n))}}{${d}}`;
  }
  return v.toFixed(3).replace(".", "{,}");
};
const par = v => (v < 0 || !Number.isInteger(v) ? `\\left(${num(v)}\\right)` : num(v));
const tex = (el, s) => { katex.render(s, el, { throwOnError: false }); };
const horner = (cs, a) => { const q = [cs[0]]; for (let i = 1; i < cs.length; i++) q.push(cs[i] + a * q[i - 1]); return q; };
const polTex = (cs, x = "x") => {
  const n = cs.length - 1; let s = "";
  cs.forEach((c, i) => {
    if (!c) return;
    const g = n - i, abs = Math.abs(c);
    const coef = (abs === 1 && g > 0) ? "" : num(abs);
    s += (c < 0 ? "-" : (s ? "+" : "")) + coef + (g > 0 ? x : "") + (g > 1 ? `^{${g}}` : "");
  });
  return s || "0";
};

// Gràfica SVG: eixos, graella, corba i punt mòbil
function grafica(el, { xmin, xmax, ymin, ymax, w = 520, h = 340 }) {
  const NS = "http://www.w3.org/2000/svg";
  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("width", w); svg.setAttribute("height", h); svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  const X = x => (x - xmin) / (xmax - xmin) * w, Y = y => h - (y - ymin) / (ymax - ymin) * h;
  const mk = (tag, at) => { const e = document.createElementNS(NS, tag); for (const k in at) e.setAttribute(k, at[k]); svg.append(e); return e; };
  const stepY = Math.ceil((ymax - ymin) / 12);
  for (let x = Math.ceil(xmin); x <= xmax; x++) mk("line", { x1: X(x), x2: X(x), y1: 0, y2: h, stroke: "#eceff4" });
  for (let y = Math.ceil(ymin / stepY) * stepY; y <= ymax; y += stepY) mk("line", { x1: 0, x2: w, y1: Y(y), y2: Y(y), stroke: "#eceff4" });
  mk("line", { x1: 0, x2: w, y1: Y(0), y2: Y(0), stroke: "#555", "stroke-width": 1.5 });
  mk("line", { x1: X(0), x2: X(0), y1: 0, y2: h, stroke: "#555", "stroke-width": 1.5 });
  for (let x = Math.ceil(xmin); x <= xmax; x++) if (x) {
    const t = mk("text", { x: X(x), y: Y(0) + 17, "font-size": 13, "text-anchor": "middle", fill: "#777" }); t.textContent = x;
  }
  for (let y = Math.ceil(ymin / stepY) * stepY; y <= ymax; y += stepY) if (y) {
    const t = mk("text", { x: X(0) - 6, y: Y(y) + 4, "font-size": 13, "text-anchor": "end", fill: "#777" }); t.textContent = y;
  }
  const corba = mk("path", { fill: "none", stroke: "var(--cc)", "stroke-width": 3 });
  const guia = mk("line", { stroke: "#999", "stroke-dasharray": "5 4", "stroke-width": 1.5 });
  const punt = mk("circle", { r: 8, fill: "var(--rosa)", stroke: "#fff", "stroke-width": 2 });
  el.append(svg);
  return {
    f(fn) {
      let d = "";
      for (let i = 0; i <= 400; i++) {
        const x = xmin + (xmax - xmin) * i / 400, y = fn(x);
        d += (d ? "L" : "M") + X(x).toFixed(1) + "," + Y(Math.max(ymin - 50, Math.min(ymax + 50, y))).toFixed(1);
      }
      corba.setAttribute("d", d);
    },
    punt(x, y) {
      const fora = y < ymin || y > ymax;
      punt.setAttribute("cx", X(x)); punt.setAttribute("cy", Y(Math.max(ymin, Math.min(ymax, y))));
      punt.setAttribute("opacity", fora ? .3 : 1);
      Object.entries({ x1: X(x), x2: X(x), y1: Y(0), y2: Y(Math.max(ymin, Math.min(ymax, y))) }).forEach(([k, v]) => guia.setAttribute(k, v));
    },
  };
}

// --- Ginys (data-giny="nom"; paràmetres en data-*)
const GINYS = {
  // Valor numèric: tria el polinomi i mou a; substitució pas a pas + punt a la gràfica
  valor(el) {
    const pols = JSON.parse(el.dataset.pols);  // [{nom, cs, finestra:[xmin,xmax,ymin,ymax]}]
    el.innerHTML = `<div class="cols c"><div><div class="fila tria"></div>
      <div class="fila"><span style="white-space:nowrap" class="lbl"></span><input type="range" step="0.5"></div>
      <div class="exp e1"></div><div class="exp e2"></div></div><div class="gr" style="flex:0 0 520px"></div></div>`;
    const tria = el.querySelector(".tria"), rg = el.querySelector("input"), lbl = el.querySelector(".lbl");
    let p, g;
    const pinta = () => {
      const a = +rg.value, v = p.cs.reduce((s, c) => s * a + c, 0);
      tex(lbl, `a=${num(a)}`);
      const n = p.cs.length - 1;
      const subst = p.cs.map((c, i) => [c, n - i]).filter(([c]) => c).map(([c, gr], k) => {
        const s = c < 0 ? "-" : (k ? "+" : ""), ab = Math.abs(c);
        const coef = ab === 1 && gr ? "" : num(ab) + (gr ? "\\cdot " : "");
        return s + coef + (gr ? par(a) + (gr > 1 ? `^{${gr}}` : "") : "");
      }).join("");
      tex(el.querySelector(".e1"), `${p.nom}(x)=${polTex(p.cs)}`);
      tex(el.querySelector(".e2"), `${p.nom}\\!\\left(${num(a)}\\right)=${subst}=\\mathbf{${num(v)}}`);
      g.punt(a, v);
    };
    const tria_p = (k) => {
      p = pols[k];
      $$("button", tria).forEach((b, j) => b.classList.toggle("sel", j === k));
      const [xmin, xmax, ymin, ymax] = p.finestra;
      el.querySelector(".gr").innerHTML = "";
      g = grafica(el.querySelector(".gr"), { xmin, xmax, ymin, ymax });
      g.f(x => p.cs.reduce((s, c) => s * x + c, 0));
      rg.min = xmin + 0.5; rg.max = xmax - 0.5; rg.value = p.a0 ?? 0;
      pinta();
    };
    pols.forEach((q, k) => {
      const b = document.createElement("button"); b.className = "b"; b.onclick = () => tria_p(k);
      tex(b, `${q.nom}(x)`); tria.append(b);
    });
    rg.oninput = pinta;
    tria_p(0);
  },

  // Màquina de Ruffini: coeficients i a, pas a pas
  ruffini(el) {
    el.innerHTML = `<div class="fila"><span style="white-space:nowrap">Coeficients:</span><input type="text" class="cs" value="${el.dataset.cs}">
      <span style="white-space:nowrap">\\(a=\\)</span><input type="number" class="a" value="${el.dataset.a}" style="width:110px"></div>
      <div class="fila"><button class="b pas">Pas ▶</button><button class="b tot">Tot ⏩</button><button class="b ini">Reinicia ↺</button>
      <span class="exp div" style="margin-left:14px"></span></div>
      <div class="taula"></div><div class="exp expl center"></div><div class="exp res center"></div>`;
    renderMathInElement(el, { delimiters: [{ left: "\\(", right: "\\)", display: false }] });
    let cs, a, q, k;
    const llegeix = () => {
      cs = el.querySelector(".cs").value.replace(/,/g, " ").split(/\s+/).filter(Boolean).map(Number);
      a = +el.querySelector(".a").value;
      q = horner(cs, a); k = 0;
    };
    const pinta = () => {
      const n = cs.length, c = v => `<span>\\(${num(v)}\\)</span>`;
      let h = `<table class="mt ruf"><tr><td></td>${cs.map(v => `<td>${c(v)}</td>`).join("")}</tr><tr><td>${c(a)}</td><td></td>`;
      for (let i = 1; i < n; i++) h += `<td class="${i === k ? "nou" : ""}">${i <= k ? c(a * q[i - 1]) : ""}</td>`;
      h += `</tr><tr><td></td>`;
      for (let i = 0; i < n; i++) {
        const cls = [i === k ? "cur nou" : "", i === n - 1 ? "bx" : ""].join(" ");
        h += `<td class="${cls}">${i <= k - (k === 0 ? 0 : 0) && i <= k ? c(q[i]) : ""}</td>`;
      }
      el.querySelector(".taula").innerHTML = h + `</tr></table>`;
      renderMathInElement(el.querySelector(".taula"), { delimiters: [{ left: "\\(", right: "\\)", display: false }] });
      tex(el.querySelector(".div"), `\\left(${polTex(cs)}\\right):\\left(x${a < 0 ? "+" + num(-a) : a ? "-" + num(a) : ""}\\right)`);
      const expl = el.querySelector(".expl");
      tex(expl, k === 0 ? `\\text{Baixem el primer coeficient: }${num(q[0])}`
        : `${par(q[k - 1])}\\cdot ${par(a)}=${num(a * q[k - 1])};\\quad ${num(cs[k])}+${par(a * q[k - 1])}=\\mathbf{${num(q[k])}}`);
      const resel = el.querySelector(".res");
      if (k === n - 1) {
        const R = q[n - 1];
        tex(resel, `C(x)=${polTex(q.slice(0, -1))},\\quad R=${num(R)}` + (R === 0 ? `\\quad\\Rightarrow\\ \\text{divisió exacta!}` : ""));
        resel.classList.toggle("zero", R === 0);
      } else resel.innerHTML = "";
    };
    el.querySelector(".pas").onclick = () => { if (k < cs.length - 1) k++; pinta(); };
    el.querySelector(".tot").onclick = () => { k = cs.length - 1; pinta(); };
    el.querySelector(".ini").onclick = () => { llegeix(); pinta(); };
    el.querySelectorAll("input").forEach(i => i.onchange = () => { llegeix(); pinta(); });
    llegeix(); pinta();
  },

  // Teorema del residu: mou a, Ruffini en directe i el punt (a, P(a)) a la gràfica
  residu(el) {
    const cs = JSON.parse(el.dataset.cs), [xmin, xmax, ymin, ymax] = JSON.parse(el.dataset.finestra);
    el.innerHTML = `<div class="cols c"><div><div class="fila"><span class="lbl" style="white-space:nowrap"></span>
      <input type="range" min="${Math.ceil(xmin)}" max="${Math.floor(xmax)}" step="1" value="${el.dataset.a0 || 0}"></div>
      <div class="exp e0"></div><div class="taula"></div><div class="exp e1"></div><div class="exp e2"></div></div>
      <div class="gr" style="flex:0 0 500px"></div></div>`;
    const g = grafica(el.querySelector(".gr"), { xmin, xmax, ymin, ymax, w: 500, h: 360 });
    g.f(x => cs.reduce((s, c) => s * x + c, 0));
    const rg = el.querySelector("input");
    tex(el.querySelector(".e0"), `P(x)=${polTex(cs)}`);
    const pinta = () => {
      const a = +rg.value, q = horner(cs, a), R = q[q.length - 1], c = v => `<span>\\(${num(v)}\\)</span>`;
      tex(el.querySelector(".lbl"), `a=${num(a)}`);
      el.querySelector(".taula").innerHTML = `<table class="mt ruf"><tr><td></td>${cs.map(v => `<td>${c(v)}</td>`).join("")}</tr>
        <tr><td>${c(a)}</td><td></td>${q.slice(0, -1).map(v => `<td>${c(a * v)}</td>`).join("")}</tr>
        <tr><td></td>${q.map((v, i) => `<td class="${i === q.length - 1 ? "bx" : ""}">${c(v)}</td>`).join("")}</tr></table>`;
      renderMathInElement(el.querySelector(".taula"), { delimiters: [{ left: "\\(", right: "\\)", display: false }] });
      tex(el.querySelector(".e1"), `\\text{Residu de } P(x):\\left(x${a < 0 ? "+" + (-a) : a ? "-" + a : ""}\\right)=\\mathbf{${R}}=P(${a})`);
      const e2 = el.querySelector(".e2");
      if (R === 0) tex(e2, `\\text{Residu } 0\\ \\Rightarrow\\ \\left(x${a < 0 ? "+" + (-a) : a ? "-" + a : ""}\\right)\\text{ és un factor!}`);
      else e2.innerHTML = "&nbsp;";
      e2.classList.toggle("zero", R === 0);
      g.punt(a, R);
    };
    rg.oninput = pinta; pinta();
  },
  // Practica: genera exercicis aleatoris, comprova la resposta i ensenya la solució (tot al navegador, sense servidor)
  practica(el) {
    const tipus = el.dataset.tipus;  // "ruffini" | "valor"
    const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
    const noZero = (a, b) => { let v; do v = rnd(a, b); while (!v); return v; };
    el.innerHTML = `<div class="fila"><button class="b nou">Exercici nou 🎲</button><span class="exp enun" style="margin-left:14px"></span>
      <span style="margin-left:auto" class="marcador small"></span></div>
      <div class="fila resp"></div>
      <div class="fila"><button class="b comp">Comprova ✔</button><button class="b sol">Solució</button><span class="exp veredicte" style="margin-left:14px"></span></div>
      <div class="exp solucio center"></div>`;
    let ex, encerts = 0, fets = 0;
    const camp = (w = 90) => `<input type="text" inputmode="numeric" style="width:${w}px;text-align:center">`;
    const nou = () => {
      el.querySelector(".solucio").innerHTML = ""; el.querySelector(".veredicte").innerHTML = "";
      const resp = el.querySelector(".resp");
      if (tipus === "ruffini") {
        const g = rnd(3, 4), cs = [noZero(1, 3) * (Math.random() < .3 ? -1 : 1)];
        for (let i = 0; i < g; i++) cs.push(Math.random() < .25 ? 0 : rnd(-6, 6));
        const a = noZero(-3, 3), q = horner(cs, a);
        if (Math.random() < .4) { cs[g] -= q[g]; q[g] = 0; }  // de tant en tant, divisió exacta
        ex = { cs, a, q };
        tex(el.querySelector(".enun"), `\\left(${polTex(cs)}\\right):\\left(x${a < 0 ? "+" + -a : "-" + a}\\right)`);
        resp.innerHTML = `<span>Quocient (coeficients):</span>${q.slice(0, -1).map(() => camp()).join("")}<span style="margin-left:18px">Residu:</span>${camp()}`;
      } else {
        const g = rnd(2, 3), cs = [noZero(-3, 3)];
        for (let i = 0; i < g; i++) cs.push(rnd(-5, 5));
        const a = noZero(-3, 3);
        ex = { cs, a, v: cs.reduce((s, c) => s * a + c, 0) };
        tex(el.querySelector(".enun"), `P(x)=${polTex(cs)}\\qquad P(${a})=\\ ?`);
        resp.innerHTML = `<span>\\(P(${a})=\\)</span>${camp(130)}`;
        renderMathInElement(resp, { delimiters: [{ left: "\\(", right: "\\)", display: false }] });
      }
      resp.querySelector("input").focus();
    };
    const solucio = () => {
      const sol = el.querySelector(".solucio");
      if (tipus === "ruffini") {
        const { cs, a, q } = ex, c = v => `<span>\\(${v}\\)</span>`;
        sol.innerHTML = `<table class="mt ruf"><tr><td></td>${cs.map(v => `<td>${c(v)}</td>`).join("")}</tr>
          <tr><td>${c(a)}</td><td></td>${q.slice(0, -1).map(v => `<td>${c(a * v)}</td>`).join("")}</tr>
          <tr><td></td>${q.map((v, i) => `<td class="${i === q.length - 1 ? "bx" : ""}">${c(v)}</td>`).join("")}</tr></table>
          <div>\\(C(x)=${polTex(q.slice(0, -1))},\\quad R=${q[q.length - 1]}\\)</div>`;
        renderMathInElement(sol, { delimiters: [{ left: "\\(", right: "\\)", display: false }] });
      } else {
        const { cs, a, v } = ex, n = cs.length - 1;
        tex(sol, `P(${a})=` + cs.map((c, i) => [c, n - i]).filter(([c]) => c).map(([c, gr], k) =>
          (c < 0 ? "-" : k ? "+" : "") + (Math.abs(c) === 1 && gr ? "" : Math.abs(c) + (gr ? "\\cdot " : "")) + (gr ? par(a) + (gr > 1 ? `^{${gr}}` : "") : "")).join("") + `=\\mathbf{${v}}`);
      }
    };
    el.querySelector(".nou").onclick = nou;
    el.querySelector(".sol").onclick = solucio;
    el.querySelector(".comp").onclick = () => {
      const vals = $$(".resp input", el).map(i => i.value.trim().replace("−", "-"));
      const bons = tipus === "ruffini" ? ex.q : [ex.v];
      let ok = true;
      $$(".resp input", el).forEach((inp, i) => {
        const b = vals[i] !== "" && Number(vals[i]) === bons[i];
        inp.style.borderColor = b ? "#2a9a2a" : "#c81414"; inp.style.background = b ? "#effaef" : "#fdeeee";
        ok = ok && b;
      });
      fets++; if (ok) encerts++;
      const v = el.querySelector(".veredicte");
      v.innerHTML = ok ? "<span class='zero'>Perfecte! 🎉</span>" : "<span class='ko'>Revisa les caselles vermelles</span>";
      el.querySelector(".marcador").textContent = `Encerts: ${encerts} / ${fets}`;
    };
    el.addEventListener("keydown", e => { if (e.key === "Enter") { e.stopPropagation(); el.querySelector(".comp").click(); } });
    nou();
  },
};

addEventListener("DOMContentLoaded", () => {
  MAT = document.body.dataset.materia || ""; LOGO = document.body.dataset.logo || ""; slides = $$(".slide");
  taules();
  estructura();
  renderMathInElement(document.body, {
    delimiters: [{ left: "$$", right: "$$", display: true }, { left: "\\[", right: "\\]", display: true },
                 { left: "$", right: "$", display: false }, { left: "\\(", right: "\\)", display: false }],
    ignoredClasses: ["giny"], throwOnError: false,
  });
  $$("[data-giny]").forEach(el => GINYS[el.dataset.giny](el));
  preparaRevelat();
  navegacio();
  mostra((parseInt(location.hash.slice(1)) || 1) - 1);
  // per defecte: lectura a la versió per a l'alumnat (data-mode) i a pantalles estretes (mòbil dret)
  canviaMode(document.body.dataset.mode === "lectura" || innerWidth < innerHeight);
});
})();
