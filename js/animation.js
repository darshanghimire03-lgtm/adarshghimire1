const CSS_HREF = "/css/animation.css";
const HTML_HREF = "/animation.html";
const START_HOLD_MS = 1100;
const TICK_MS = 60;

let overlayPromise = null;
let running = false;

function ensureCss() {
  if (document.querySelector('link[href="' + CSS_HREF + '"]')) return;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = CSS_HREF;
  document.head.appendChild(link);
}

function loadOverlay() {
  const existing = document.getElementById("cdOverlay");
  if (existing) return Promise.resolve(existing);
  if (!overlayPromise) {
    overlayPromise = fetch(HTML_HREF)
      .then((r) => {
        if (!r.ok) throw new Error("Could not load animation");
        return r.text();
      })
      .then((html) => {
        const doc = new DOMParser().parseFromString(html, "text/html");
        const node = doc.getElementById("cdOverlay");
        if (!node) throw new Error("Animation markup missing");
        const el = document.importNode(node, true);
        document.body.appendChild(el);
        return el;
      })
      .catch((err) => {
        overlayPromise = null;
        throw err;
      });
  }
  return overlayPromise;
}

function pop(numEl, text, isGo) {
  numEl.textContent = text;
  numEl.classList.toggle("go", !!isGo);
  numEl.classList.remove("pop");
  void numEl.offsetWidth;
  numEl.classList.add("pop");
}

export async function playCountdown(options) {
  const opts = options || {};
  if (running) return;
  running = true;
  const endAt = typeof opts.endAt === "number" ? opts.endAt : Date.now() + 3000;
  const clock = typeof opts.now === "function" ? opts.now : Date.now;
  const onDone = typeof opts.onDone === "function" ? opts.onDone : null;
  const label = opts.label || "Match starting";

  let overlay;
  try {
    ensureCss();
    overlay = await loadOverlay();
  } catch (err) {
    running = false;
    if (onDone) onDone();
    return;
  }

  const numEl = overlay.querySelector("#cdNum");
  const labelEl = overlay.querySelector("#cdLabel");
  const barEl = overlay.querySelector("#cdBar");
  const total = Math.max(1000, endAt - clock());
  labelEl.textContent = label;
  overlay.classList.remove("out", "started");
  overlay.hidden = false;
  document.documentElement.classList.add("cd-lock");
  void overlay.offsetWidth;
  overlay.classList.add("on");

  let shown = null;
  let finished = false;

  const timer = setInterval(() => {
    const left = endAt - clock();
    if (left > 0) {
      const n = Math.min(3, Math.ceil(left / 1000));
      if (n !== shown) {
        shown = n;
        pop(numEl, String(n), false);
      }
      barEl.style.width = Math.max(0, Math.min(100, (1 - left / total) * 100)) + "%";
      return;
    }
    if (finished) return;
    finished = true;
    clearInterval(timer);
    barEl.style.width = "100%";
    overlay.classList.add("started");
    labelEl.textContent = "Let's go";
    pop(numEl, "START", true);
    if (onDone) onDone();
    setTimeout(() => {
      overlay.classList.add("out");
      setTimeout(() => {
        overlay.hidden = true;
        overlay.classList.remove("on", "out", "started");
        document.documentElement.classList.remove("cd-lock");
        running = false;
      }, 380);
    }, START_HOLD_MS);
  }, TICK_MS);
}

if (document.body && document.body.hasAttribute("data-demo")) {
  const replay = () => playCountdown({ endAt: Date.now() + 3000 });
  document.body.addEventListener("click", () => {
    if (!running) replay();
  });
  replay();
}