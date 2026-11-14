import { db, ref, onValue } from "/js/firebase-config.js";
import { mountLayout } from "/js/layout.js";
import { initAuth } from "/js/auth.js";

await mountLayout();
initAuth();

document.getElementById("headerExtra").innerHTML = '<button class="share-btn" id="shareBtn" type="button" hidden aria-label="Share match"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg><span>Share</span></button>';

const LINK_COUNT = 5;
const LIVE_MS = (4 * 60 + 30) * 60 * 1000;
const detail = document.getElementById("detail");
const shareBtn = document.getElementById("shareBtn");
const toastEl = document.getElementById("toast");

const PLAY_ICON = '<svg class="ic" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5v13a1 1 0 0 0 1.5.86l10.5-6.5a1 1 0 0 0 0-1.72L9.5 4.64A1 1 0 0 0 8 5.5z"/></svg>';

function getMatchId() {
  const fromQuery = new URLSearchParams(location.search).get("id");
  if (fromQuery) return fromQuery;
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "match" && parts[1]) {
    try {
      return decodeURIComponent(parts[1]);
    } catch (err) {
      return parts[1];
    }
  }
  const fromHash = location.hash.replace(/^#/, "");
  return fromHash || null;
}

const matchId = getMatchId();

let teamsData = {};
let match = null;
let loaded = false;
let failed = false;
let lastSignature = "";
let toastTimer = null;

function playerUrl(n) {
  return "/match/player/" + encodeURIComponent(matchId) + "?link=" + n;
}

function linkInfo(raw) {
  const s = String(raw || "").trim();
  const i = s.indexOf("|");
  const url = (i === -1 ? s : s.slice(0, i)).trim();
  const path = url.split(/[?#]/)[0].toLowerCase();
  let kind = "Embed";
  if (path.endsWith(".m3u8")) kind = "HLS";
  else if (path.endsWith(".mpd")) kind = "DASH";
  const drm = i !== -1 && kind !== "Embed" && s.slice(i + 1).trim() !== "";
  return { kind, drm };
}

document.getElementById("backBtn").addEventListener("click", (e) => {
  let sameOrigin = false;
  try {
    sameOrigin = document.referrer && new URL(document.referrer).origin === location.origin;
  } catch (err) {
    sameOrigin = false;
  }
  if (sameOrigin && history.length > 1) {
    e.preventDefault();
    history.back();
  }
});

detail.addEventListener("click", (e) => {
  if (e.target.closest("a")) return;
  const row = e.target.closest("tr[data-href]");
  if (row) location.href = row.getAttribute("data-href");
});

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

async function shareMatch() {
  if (!match || !matchId) return;
  const url = location.origin + "/match/" + encodeURIComponent(matchId);
  const title = teamName(match.team1) + " vs " + teamName(match.team2);
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

shareBtn.addEventListener("click", shareMatch);

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
  return new Date(ms).toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
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
    ? `<img src="${esc(t.logourl)}" alt="" onerror="this.parentNode.textContent='${letter}'">`
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

function notFound(text) {
  shareBtn.hidden = true;
  detail.innerHTML = `<div class="empty">${text}<br><a href="/">&#8592; Back to matches</a></div>`;
}

function linksTableHtml(info) {
  const sub = info.state === "live" ? "Watch now" : "Open player";
  const rows = [];
  for (let i = 1; i <= LINK_COUNT; i++) {
    const u = match.links && match.links["link" + i];
    if (!u) continue;
    const k = linkInfo(u);
    const drmTag = k.drm ? '<span class="type drm">DRM</span>' : "";
    rows.push(`
      <tr class="link-row" data-href="${esc(playerUrl(i))}">
        <td class="c-no">${i}</td>
        <td class="c-name">Stream ${i}<small>${sub}</small></td>
        <td class="c-type"><span class="type">${k.kind}</span>${drmTag}</td>
        <td class="c-go"><a class="watch" href="${esc(playerUrl(i))}">${PLAY_ICON}<span>Watch</span></a></td>
      </tr>
    `);
  }
  if (!rows.length) return '<div class="empty">No links added yet</div>';
  return `
    <div class="table-wrap">
      <table class="links-table">
        <thead>
          <tr><th>#</th><th>Stream</th><th>Type</th><th></th></tr>
        </thead>
        <tbody>${rows.join("")}</tbody>
      </table>
    </div>
  `;
}

function render() {
  if (failed) {
    notFound("Could not load match. Please check your connection and try again.");
    return;
  }
  if (!loaded) return;

  const now = Date.now();
  const info = match && typeof match.startTime === "number" ? getInfo(match, now) : null;
  if (!match || !info || !info.visible) {
    notFound("Match not found");
    return;
  }

  shareBtn.hidden = false;
  const winnerId = info.state === "ended" ? winnerOf(match) : null;

  const t1 = teamsData[match.team1];
  const t2 = teamsData[match.team2];
  document.title = (t1 && t1.name ? t1.name : "TBD") + " vs " + (t2 && t2.name ? t2.name : "TBD") + " - NPLcode";

  const linksHtml = info.state === "ended"
    ? '<div class="empty">This match has ended</div>'
    : linksTableHtml(info);

  detail.innerHTML = `
    <div class="match-card ${info.state === "live" ? "live" : ""}">
      <div class="teams">
        ${teamHtml(match.team1, winnerId === match.team1)}
        <div class="vs">VS</div>
        ${teamHtml(match.team2, winnerId === match.team2)}
      </div>
      <div class="info">
        ${tagHtml(info)}
        <div class="when">${esc(formatTime(match.startTime))} &middot; ${esc(whenText(match, info, now))}</div>
      </div>
    </div>
    <div class="section-head"><div class="section-title">Watch links</div></div>
    ${linksHtml}
  `;
}

function onError() {
  failed = true;
  render();
}

if (!matchId) {
  loaded = true;
  render();
} else {
  onValue(ref(db, "teams"), (snap) => {
    teamsData = snap.val() || {};
    render();
  }, onError);

  onValue(ref(db, "matches/" + matchId), (snap) => {
    match = snap.val();
    loaded = true;
    failed = false;
    render();
  }, onError);

  setInterval(() => {
    if (!match || typeof match.startTime !== "number") return;
    const now = Date.now();
    const i = getInfo(match, now);
    const sig = i.state + i.dayDiff + (i.visible ? "v" : "h") + whenText(match, i, now);
    if (sig !== lastSignature) {
      lastSignature = sig;
      render();
    }
  }, 1000);
}