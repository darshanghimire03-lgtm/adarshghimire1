import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { mountLayout, loadPartial, fillTemplate } from "/js/layout.js";
import { initAuth } from "/js/auth.js";

const [, cardTpl] = await Promise.all([mountLayout(), loadPartial("battlecard")]);
initAuth();

document.getElementById("headerExtra").innerHTML = '<div class="live-pill" id="livePill"><span class="dot"></span><span id="liveCount">LIVE</span></div>';

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ramus-7f7aa.firebaseapp.com",
  databaseURL: "https://ramus-7f7aa-default-rtdb.firebaseio.com",
  projectId: "ramus-7f7aa",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const LIVE_MS = (4 * 60 + 30) * 60 * 1000;
const homeMain = document.getElementById("homeMain");
const livePill = document.getElementById("livePill");
const liveCount = document.getElementById("liveCount");
const toastEl = document.getElementById("toast");
const filtersEl = document.getElementById("filters");

const ICON = {
  share: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>',
  clock: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  play: '<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>',
  arrow: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>'
};

let teamsData = {};
let matchesData = {};
let matchesLoaded = false;
let failed = false;
let filter = "all";
let lastSignature = "";
let toastTimer = null;

if (location.pathname.endsWith("/index.html") || location.pathname.endsWith("/index")) {
  history.replaceState(null, "", "/" + location.search + location.hash);
}

function showToast(text) {
  toastEl.textContent = text;
  toastEl.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toastEl.classList.remove("show"), 2200);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (err2) {
      ok = false;
    }
    ta.remove();
    return ok;
  }
}

function teamName(id) {
  const t = teamsData[id];
  return t && t.name ? t.name : "TBD";
}

async function shareMatch(id) {
  const m = matchesData[id];
  if (!m) return;
  const url = location.origin + "/match/" + encodeURIComponent(id);
  const title = teamName(m.team1) + " vs " + teamName(m.team2);
  const text = title + " - Watch live on NPLcode";
  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return;
    } catch (err) {
      if (err && err.name === "AbortError") return;
    }
  }
  const ok = await copyText(url);
  showToast(ok ? "Match link copied" : url);
}

homeMain.addEventListener("click", (e) => {
  const btn = e.target.closest("[data-share]");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  shareMatch(btn.getAttribute("data-share"));
});

homeMain.addEventListener("keydown", (e) => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const btn = e.target.closest("[data-share]");
  if (!btn) return;
  e.preventDefault();
  e.stopPropagation();
  shareMatch(btn.getAttribute("data-share"));
});

filtersEl.addEventListener("click", (e) => {
  const chip = e.target.closest("[data-filter]");
  if (!chip) return;
  filter = chip.getAttribute("data-filter");
  filtersEl.querySelectorAll(".chip").forEach((c) => {
    c.classList.toggle("active", c.getAttribute("data-filter") === filter);
  });
  renderHome();
});

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function dayNumber(ms) {
  const d = new Date(ms);
  return Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);
}

function formatTime(ms) {
  return new Date(ms).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(ms) {
  return new Date(ms).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" });
}

function duration(ms) {
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return mins + " min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? h + "h " + m + "m" : h + "h";
}

function getInfo(m, now) {
  const start = m.startTime;
  const dayDiff = dayNumber(start) - dayNumber(now);
  let state;
  if (now < start) state = "notstarted";
  else if (m.ended !== true && now < start + LIVE_MS) state = "live";
  else state = "ended";

  let visible = true;
  let group = "today";
  if (dayDiff > 0) group = "upcoming";
  if (dayDiff < 0) {
    if (state === "live") group = "today";
    else visible = false;
  }
  return { state, dayDiff, visible, group };
}

function winnerOf(m) {
  return m.winner && (m.winner === m.team1 || m.winner === m.team2) ? m.winner : null;
}

function whenText(m, info, now) {
  if (info.state === "live") return "Started " + duration(now - m.startTime) + " ago";
  if (info.state === "ended") {
    const w = winnerOf(m);
    return w ? "Winner: " + teamName(w) : "Match ended";
  }
  if (info.group === "today") return "Starts in " + duration(m.startTime - now);
  return formatDate(m.startTime);
}

function teamHtml(id, isWinner) {
  const t = teamsData[id];
  const name = t && t.name ? esc(t.name) : "TBD";
  const letter = t && t.name ? esc(t.name.charAt(0).toUpperCase()) : "?";
  const logo = t && t.logourl
    ? `<img src="${esc(t.logourl)}" alt="" loading="lazy" onerror="this.parentNode.textContent='${letter}'">`
    : letter;
  const tag = isWinner ? '<div class="win-tag">WINNER</div>' : "";
  return `<div class="team ${isWinner ? "winner" : ""}"><div class="team-logo">${logo}</div><div class="team-name">${name}</div>${tag}</div>`;
}

function tagHtml(info) {
  if (info.group === "today") {
    if (info.state === "live") return '<span class="badge live">LIVE NOW</span>';
    if (info.state === "ended") return '<span class="badge ended">MATCH ENDED</span>';
    return '<span class="badge notstarted">NOT STARTED</span>';
  }
  if (info.dayDiff === 1) return '<span class="badge tomorrow">TOMORROW</span>';
  return `<span class="badge days">${info.dayDiff} DAYS LEFT</span>`;
}

function cardHtml(id, m, info, now) {
  const classes = ["match"];
  if (info.state === "live") classes.push("live");
  if (info.group === "today" && info.state === "ended") classes.push("ended");
  const goText = info.state === "live" ? ICON.play + "Watch now" : "Details" + ICON.arrow;
  const w = info.state === "ended" ? winnerOf(m) : null;
  const timeLabel = info.group === "upcoming" ? formatDate(m.startTime) + " · " + formatTime(m.startTime) : formatTime(m.startTime);
  return fillTemplate(cardTpl, {
    classes: classes.join(" "),
    hrefId: encodeURIComponent(id),
    idAttr: esc(id),
    clock: ICON.clock,
    time: esc(timeLabel),
    tag: tagHtml(info),
    team1: teamHtml(m.team1, w === m.team1),
    team2: teamHtml(m.team2, w === m.team2),
    when: esc(whenText(m, info, now)),
    share: ICON.share,
    go: goText
  });
}

function todayOrder(info) {
  if (info.state === "live") return 0;
  if (info.state === "notstarted") return 1;
  return 2;
}

function sectionHtml(title, items, emptyText, now) {
  const head = `<div class="section-head"><div class="section-title">${title}</div><div class="count">${items.length}</div></div>`;
  const body = items.length
    ? `<div class="list">${items.map((x) => cardHtml(x.id, x.m, x.info, now)).join("")}</div>`
    : `<div class="empty">${emptyText}</div>`;
  return head + body;
}

function setCount(id, n) {
  const el = document.getElementById(id);
  if (el) el.textContent = n;
}

function renderHome() {
  if (failed) {
    homeMain.innerHTML = '<div class="empty">Could not load matches. Please check your connection and try again.</div>';
    return;
  }
  if (!matchesLoaded) return;

  const now = Date.now();
  const items = Object.entries(matchesData)
    .filter(([, m]) => m && typeof m.startTime === "number")
    .map(([id, m]) => ({ id, m, info: getInfo(m, now) }))
    .filter((x) => x.info.visible);

  const today = items
    .filter((x) => x.info.group === "today")
    .sort((a, b) => todayOrder(a.info) - todayOrder(b.info) || a.m.startTime - b.m.startTime);
  const upcoming = items
    .filter((x) => x.info.group === "upcoming")
    .sort((a, b) => a.m.startTime - b.m.startTime);
  const live = items
    .filter((x) => x.info.state === "live")
    .sort((a, b) => a.m.startTime - b.m.startTime);

  livePill.classList.toggle("on", live.length > 0);
  liveCount.textContent = live.length + " LIVE";

  setCount("c-all", items.length);
  setCount("c-live", live.length);
  setCount("c-today", today.length);
  setCount("c-upcoming", upcoming.length);

  if (filter === "live") {
    homeMain.innerHTML = sectionHtml("Live now", live, "No live matches right now", now);
  } else if (filter === "today") {
    homeMain.innerHTML = sectionHtml("Today's matches", today, "No matches today", now);
  } else if (filter === "upcoming") {
    homeMain.innerHTML = sectionHtml("Upcoming matches", upcoming, "No upcoming matches", now);
  } else {
    homeMain.innerHTML =
      sectionHtml("Today's matches", today, "No matches today", now) +
      sectionHtml("Upcoming matches", upcoming, "No upcoming matches", now);
  }
}

function onError() {
  failed = true;
  renderHome();
}

onValue(ref(db, "teams"), (snap) => {
  teamsData = snap.val() || {};
  renderHome();
}, onError);

onValue(ref(db, "matches"), (snap) => {
  matchesData = snap.val() || {};
  matchesLoaded = true;
  failed = false;
  renderHome();
}, onError);

setInterval(() => {
  if (!matchesLoaded) return;
  const now = Date.now();
  const sig = dayNumber(now) + "#" + Object.entries(matchesData)
    .filter(([, m]) => m && typeof m.startTime === "number")
    .map(([id, m]) => {
      const i = getInfo(m, now);
      return id + i.state + i.dayDiff + (i.visible ? "v" : "h") + whenText(m, i, now);
    })
    .join("|");
  if (sig !== lastSignature) {
    lastSignature = sig;
    renderHome();
  }
}, 1000);