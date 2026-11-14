import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, push, query, limitToLast, onChildAdded, onDisconnect, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";
import { mountLayout } from "/js/layout.js";
import { initAuth } from "/js/auth.js";

await mountLayout();
initAuth();

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "ramus-7f7aa.firebaseapp.com",
  databaseURL: "https://ramus-7f7aa-default-rtdb.firebaseio.com",
  projectId: "ramus-7f7aa",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

const LINK_COUNT = 2;
const LIVE_MS = (4 * 60 + 30) * 60 * 1000;
const BEAT_MS = 20000;
const ACTIVE_MS = 90000;
const PRUNE_MS = 180000;
const NAME_KEY = "npl_chat_name";
const WA_POS_KEY = "npl_wa_pos";
const WA_PAD = 8;
const MAX_NAME = 20;
const MAX_MSG = 200;
const SEND_GAP_MS = 2000;
const KEEP_MSGS = 80;
const STICK_PX = 60;
const SITE_URL = "https://" + location.host;
const SHARE_TEXT = "Watch live matches on NPLcode";
const root = document.getElementById("app");
const backBtn = document.getElementById("backBtn");
const toastEl = document.getElementById("toast");
const waBubble = document.getElementById("waBubble");
const shareSheet = document.getElementById("shareSheet");
const shareGrid = document.getElementById("shareGrid");
const shareLinkEl = document.getElementById("shareLink");
const shareCopyBtn = document.getElementById("shareCopy");
const shareCloseBtn = document.getElementById("shareClose");

const ICON = {
  eye: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/></svg>',
  refresh: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></svg>',
  share: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/></svg>',
  clock: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
  flag: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 21V4"/><path d="M5 4h12l-2 4 2 4H5"/></svg>',
  trophy: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3"/></svg>',
  off: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M5.6 5.6l12.8 12.8"/></svg>',
  send: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  down: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>',
  whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>',
  telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.78 18.65l.28-4.23 7.68-6.92c.34-.31-.07-.46-.52-.19L7.74 13.3 3.64 12c-.88-.25-.89-.86.2-1.3l15.97-6.16c.73-.33 1.43.18 1.15 1.3l-2.72 12.81c-.19.91-.74 1.13-1.5.71L12.6 16.3l-1.99 1.93c-.23.23-.42.42-.83.42z"/></svg>',
  facebook: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
  x: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
  more: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="19" cy="12" r="1.2"/></svg>'
};

function safeDecode(s) {
  try {
    return decodeURIComponent(s);
  } catch (err) {
    return s;
  }
}

function getMatchId() {
  const fromQuery = new URLSearchParams(location.search).get("id");
  if (fromQuery) return fromQuery;
  const parts = location.pathname.split("/").filter(Boolean);
  if (parts[0] === "match" && parts[1] === "player" && parts[2]) {
    return safeDecode(parts[2]).split(/[&?]/)[0];
  }
  return null;
}

function getLinkNo() {
  let n = parseInt(new URLSearchParams(location.search).get("link"), 10);
  if (!n) {
    const m = safeDecode(location.pathname).match(/[&?]link=?(\d+)/i);
    n = m ? parseInt(m[1], 10) : 1;
  }
  return n >= 1 && n <= LINK_COUNT ? n : 1;
}

const matchId = getMatchId();
const linkNo = getLinkNo();

let teamsData = {};
let match = null;
let loaded = false;
let failed = false;
let viewers = 0;
let presenceData = {};
let serverOffset = 0;
let reloadN = 0;
let lastSignature = "";
let lastPlayerKey = null;
let toastTimer = null;
let sheetTimer = null;
let copyTimer = null;

let chatName = loadName();
let editingName = false;
let comments = [];
let lastPost = 0;
let stick = true;
let unread = 0;
const seenComments = new Set();

function matchUrl() {
  return "/match/" + encodeURIComponent(matchId);
}

function isHttpUrl(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u.trim());
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function teamName(id) {
  const t = teamsData[id];
  return t && t.name ? t.name : "TBD";
}

function winnerOf(m) {
  return m.winner && (m.winner === m.team1 || m.winner === m.team2) ? m.winner : null;
}

function duration(ms) {
  const mins = Math.max(1, Math.round(ms / 60000));
  if (mins < 60) return mins + " min";
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h >= 24) {
    const d = Math.floor(h / 24);
    const hh = h % 24;
    return hh ? d + "d " + hh + "h" : d + "d";
  }
  return m ? h + "h " + m + "m" : h + "h";
}

function formatDateTime(ms) {
  return new Date(ms).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function getState(m, now) {
  if (now < m.startTime) return "notstarted";
  if (m.ended !== true && now < m.startTime + LIVE_MS) return "live";
  return "ended";
}

function whenText(m, state, now) {
  if (state === "live") return "Started " + duration(now - m.startTime) + " ago";
  if (state === "notstarted") return "Starts in " + duration(m.startTime - now) + " · " + formatDateTime(m.startTime);
  return "Match ended";
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

function shareTargets() {
  const t = encodeURIComponent(SHARE_TEXT);
  const u = encodeURIComponent(SITE_URL);
  return [
    { name: "WhatsApp", cls: "wa", icon: ICON.whatsapp, href: "https://wa.me/?text=" + encodeURIComponent(SHARE_TEXT + " " + SITE_URL) },
    { name: "Telegram", cls: "tg", icon: ICON.telegram, href: "https://t.me/share/url?url=" + u + "&text=" + t },
    { name: "Facebook", cls: "fb", icon: ICON.facebook, href: "https://www.facebook.com/sharer/sharer.php?u=" + u },
    { name: "X", cls: "x", icon: ICON.x, href: "https://twitter.com/intent/tweet?text=" + t + "&url=" + u }
  ];
}

function buildShareSheet() {
  let html = shareTargets().map((s) =>
    `<a class="share-item" href="${esc(s.href)}" target="_blank" rel="noopener"><span class="share-ico ${s.cls}">${s.icon}</span><span>${s.name}</span></a>`
  ).join("");
  if (navigator.share) {
    html += `<button class="share-item" type="button" data-native><span class="share-ico more">${ICON.more}</span><span>More</span></button>`;
  }
  shareGrid.innerHTML = html;
  shareLinkEl.textContent = SITE_URL;
}

function openShare() {
  clearTimeout(sheetTimer);
  shareCopyBtn.textContent = "Copy";
  shareSheet.hidden = false;
  void shareSheet.offsetWidth;
  shareSheet.classList.add("open");
  shareCloseBtn.focus();
}

function closeShare() {
  shareSheet.classList.remove("open");
  clearTimeout(sheetTimer);
  sheetTimer = setTimeout(() => {
    shareSheet.hidden = true;
  }, 260);
}

async function nativeShare() {
  try {
    await navigator.share({ title: "NPLcode", text: SHARE_TEXT, url: SITE_URL });
    closeShare();
  } catch (err) {}
}

async function copySiteLink() {
  const ok = await copyText(SITE_URL);
  showToast(ok ? "Link copied" : SITE_URL);
  if (ok) {
    shareCopyBtn.textContent = "Copied";
    clearTimeout(copyTimer);
    copyTimer = setTimeout(() => {
      shareCopyBtn.textContent = "Copy";
    }, 1800);
  }
}

buildShareSheet();

shareSheet.addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) {
    closeShare();
    return;
  }
  if (e.target.closest("[data-native]")) {
    nativeShare();
    return;
  }
  if (e.target.closest("a.share-item")) {
    setTimeout(closeShare, 150);
  }
});

shareCopyBtn.addEventListener("click", copySiteLink);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && !shareSheet.hidden) closeShare();
});

let waPos = loadWaPos();
let waDrag = null;
let waMoved = false;

function loadWaPos() {
  try {
    const p = JSON.parse(localStorage.getItem(WA_POS_KEY));
    if (p && typeof p.fx === "number" && typeof p.fy === "number") {
      return { fx: Math.min(1, Math.max(0, p.fx)), fy: Math.min(1, Math.max(0, p.fy)) };
    }
  } catch (err) {}
  return { fx: 1, fy: 0.72 };
}

function saveWaPos() {
  try {
    localStorage.setItem(WA_POS_KEY, JSON.stringify(waPos));
  } catch (err) {}
}

function waBounds() {
  const s = waBubble.offsetWidth || 56;
  return {
    s,
    maxX: Math.max(0, window.innerWidth - s - WA_PAD * 2),
    maxY: Math.max(0, window.innerHeight - s - WA_PAD * 2)
  };
}

function placeWa() {
  const b = waBounds();
  waBubble.style.left = WA_PAD + waPos.fx * b.maxX + "px";
  waBubble.style.top = WA_PAD + waPos.fy * b.maxY + "px";
}

waBubble.addEventListener("pointerdown", (e) => {
  if (e.pointerType === "mouse" && e.button !== 0) return;
  const r = waBubble.getBoundingClientRect();
  waDrag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, ox: e.clientX - r.left, oy: e.clientY - r.top };
  waMoved = false;
  try {
    waBubble.setPointerCapture(e.pointerId);
  } catch (err) {}
});

waBubble.addEventListener("pointermove", (e) => {
  if (!waDrag || e.pointerId !== waDrag.id) return;
  if (!waMoved && Math.hypot(e.clientX - waDrag.sx, e.clientY - waDrag.sy) < 6) return;
  waMoved = true;
  waBubble.classList.add("dragging");
  const b = waBounds();
  const x = e.clientX - waDrag.ox - WA_PAD;
  const y = e.clientY - waDrag.oy - WA_PAD;
  waPos = {
    fx: b.maxX ? Math.min(1, Math.max(0, x / b.maxX)) : 0,
    fy: b.maxY ? Math.min(1, Math.max(0, y / b.maxY)) : 0
  };
  placeWa();
});

function endWaDrag(e) {
  if (!waDrag || e.pointerId !== waDrag.id) return;
  waBubble.classList.remove("dragging");
  try {
    waBubble.releasePointerCapture(e.pointerId);
  } catch (err) {}
  if (waMoved) saveWaPos();
  waDrag = null;
}

waBubble.addEventListener("pointerup", endWaDrag);
waBubble.addEventListener("pointercancel", endWaDrag);

waBubble.addEventListener("click", (e) => {
  if (waMoved) {
    e.preventDefault();
    waMoved = false;
  }
});

waBubble.addEventListener("dragstart", (e) => e.preventDefault());
window.addEventListener("resize", placeWa);
window.addEventListener("orientationchange", placeWa);
placeWa();

function cleanName(s) {
  return String(s || "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

function loadName() {
  try {
    return cleanName(localStorage.getItem(NAME_KEY));
  } catch (err) {
    return "";
  }
}

function saveName(n) {
  try {
    localStorage.setItem(NAME_KEY, n);
  } catch (err) {}
}

function nameHue(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function msgHtml(c, sid) {
  const hue = nameHue(c.n);
  const initial = esc(c.n.charAt(0).toUpperCase());
  return `<div class="msg ${c.s && c.s === sid ? "mine" : ""}"><div class="msg-av" style="background:hsl(${hue},70%,68%)">${initial}</div><div class="msg-body"><span class="msg-name" style="color:hsl(${hue},70%,72%)">${esc(c.n)}</span><span class="msg-text">${esc(c.m)}</span></div></div>`;
}

function chatEls() {
  return {
    list: document.getElementById("chatList"),
    jump: document.getElementById("chatJump"),
    count: document.getElementById("chatCount")
  };
}

function scrollChatToBottom() {
  const { list, jump } = chatEls();
  if (!list) return;
  list.scrollTop = list.scrollHeight;
  stick = true;
  unread = 0;
  if (jump) jump.hidden = true;
}

function updateJump() {
  const { jump } = chatEls();
  if (!jump) return;
  if (stick || unread === 0) {
    jump.hidden = true;
    return;
  }
  jump.hidden = false;
  jump.innerHTML = ICON.down + (unread > 1 ? unread + " new comments" : "New comment");
}

function appendComment(c) {
  const { list, count } = chatEls();
  if (!list) return;
  const sid = makeSessionId();
  const placeholder = list.querySelector(".chat-empty");
  if (placeholder) placeholder.remove();
  list.insertAdjacentHTML("beforeend", msgHtml(c, sid));
  while (list.children.length > KEEP_MSGS) list.removeChild(list.firstChild);
  if (count) count.textContent = list.children.length;
  const mine = c.s && c.s === sid;
  if (stick || mine) {
    scrollChatToBottom();
  } else {
    unread++;
    updateJump();
  }
}

function renderChatFoot() {
  const foot = document.getElementById("chatFoot");
  if (!foot) return;
  if (!chatName || editingName) {
    foot.innerHTML = `
      <div class="name-box">
        <p>${editingName && chatName ? "Change your display name" : "Enter a name to join the live chat"}</p>
        <form class="chat-form" id="nameForm" autocomplete="off">
          <input class="chat-input" id="nameInput" type="text" maxlength="${MAX_NAME}" placeholder="Your name" value="${esc(chatName)}" aria-label="Your name">
          <button class="chat-send" type="submit">Join</button>
        </form>
      </div>
    `;
    const input = document.getElementById("nameInput");
    if (input && editingName) input.focus();
    return;
  }
  foot.innerHTML = `
    <div class="chat-as"><span>Chatting as <b>${esc(chatName)}</b></span><button class="chat-link" type="button" data-act="rename">Change name</button></div>
    <form class="chat-form" id="msgForm" autocomplete="off">
      <input class="chat-input" id="msgInput" type="text" maxlength="${MAX_MSG}" placeholder="Write a comment..." aria-label="Write a comment" enterkeyhint="send">
      <button class="chat-send" type="submit" aria-label="Send">${ICON.send}Send</button>
    </form>
  `;
}

function initChat() {
  const slot = document.getElementById("chatSlot");
  if (!slot) return;
  slot.innerHTML = `
    <section class="chat">
      <div class="chat-head">
        <div class="chat-title"><span class="chat-dot"></span>Live chat</div>
        <div class="chat-count" id="chatCount">0</div>
      </div>
      <div class="chat-body">
        <div class="chat-list" id="chatList"></div>
        <button class="chat-jump" id="chatJump" type="button" hidden></button>
      </div>
      <div class="chat-foot" id="chatFoot"></div>
    </section>
  `;
  const list = document.getElementById("chatList");
  const jump = document.getElementById("chatJump");
  list.addEventListener("scroll", () => {
    stick = list.scrollHeight - list.scrollTop - list.clientHeight < STICK_PX;
    if (stick) unread = 0;
    updateJump();
  }, { passive: true });
  jump.addEventListener("click", scrollChatToBottom);
  renderChatFoot();
  if (comments.length) {
    const sid = makeSessionId();
    list.innerHTML = comments.map((c) => msgHtml(c, sid)).join("");
    document.getElementById("chatCount").textContent = comments.length;
    scrollChatToBottom();
  } else {
    list.innerHTML = '<div class="chat-empty">No comments yet.<br>Be the first to say something!</div>';
  }
}

function submitName(form) {
  const input = form.querySelector("input");
  const n = cleanName(input ? input.value : "");
  if (!n) {
    showToast("Please enter a name");
    return;
  }
  chatName = n;
  editingName = false;
  saveName(n);
  renderChatFoot();
  const mi = document.getElementById("msgInput");
  if (mi) mi.focus();
}

function submitMessage(form) {
  const input = form.querySelector("input");
  const text = String(input ? input.value : "").replace(/\s+/g, " ").trim().slice(0, MAX_MSG);
  if (!text || !chatName || !matchId) return;
  const now = Date.now();
  if (now - lastPost < SEND_GAP_MS) {
    showToast("Slow down a little");
    return;
  }
  lastPost = now;
  input.value = "";
  input.focus();
  stick = true;
  push(ref(db, "comments/" + matchId), {
    n: chatName,
    m: text,
    s: makeSessionId(),
    t: serverTimestamp()
  }).catch(() => {
    showToast("Could not send comment");
  });
}

function startChat() {
  const q = query(ref(db, "comments/" + matchId), limitToLast(KEEP_MSGS));
  onChildAdded(q, (snap) => {
    const v = snap.val();
    if (!v || typeof v.m !== "string" || typeof v.n !== "string") return;
    if (seenComments.has(snap.key)) return;
    seenComments.add(snap.key);
    const c = {
      n: cleanName(v.n) || "Guest",
      m: v.m.slice(0, MAX_MSG),
      s: typeof v.s === "string" ? v.s : ""
    };
    comments.push(c);
    if (comments.length > KEEP_MSGS) comments.shift();
    appendComment(c);
  }, () => {});
}

if (matchId) backBtn.setAttribute("href", matchUrl());

backBtn.addEventListener("click", (e) => {
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

root.addEventListener("click", (e) => {
  const act = e.target.closest("[data-act]");
  if (!act) return;
  const a = act.getAttribute("data-act");
  if (a === "reload") {
    reloadN++;
    render();
    showToast("Stream reloaded");
  }
  if (a === "share") openShare();
  if (a === "rename") {
    editingName = true;
    renderChatFoot();
  }
});

root.addEventListener("submit", (e) => {
  const form = e.target;
  if (!form || !form.id) return;
  if (form.id === "nameForm") {
    e.preventDefault();
    submitName(form);
  }
  if (form.id === "msgForm") {
    e.preventDefault();
    submitMessage(form);
  }
});

function badgeHtml(state) {
  if (state === "live") return '<span class="badge live">LIVE NOW</span>';
  if (state === "ended") return '<span class="badge ended">MATCH ENDED</span>';
  return '<span class="badge notstarted">NOT STARTED</span>';
}

function thumbBrand() {
  return '<div class="thumb-brand"><div class="thumb-logo">N</div><div class="thumb-word">NPL<span>code</span></div></div>';
}

function thumbNotStarted(m, now) {
  return `
    <div class="thumb">
      ${thumbBrand()}
      <div class="thumb-title">Match not started yet</div>
      <div class="thumb-chip">${ICON.clock}Starts in ${esc(duration(m.startTime - now))}</div>
      <div class="thumb-sub">${esc(formatDateTime(m.startTime))}</div>
    </div>
  `;
}

function thumbEnded(m) {
  const w = winnerOf(m);
  const chip = w
    ? `<div class="thumb-chip">${ICON.trophy}Winner: ${esc(teamName(w))}</div>`
    : `<div class="thumb-chip">${ICON.flag}Full time</div>`;
  return `
    <div class="thumb ended">
      ${thumbBrand()}
      <div class="thumb-title">Match Ended</div>
      ${chip}
      <div class="thumb-sub">Thanks for watching on NPLcode</div>
    </div>
  `;
}

function thumbNoLinks() {
  return `
    <div class="thumb">
      ${thumbBrand()}
      <div class="thumb-title">Stream coming soon</div>
      <div class="thumb-chip">${ICON.off}No links added yet</div>
    </div>
  `;
}

function notFound(text) {
  lastPlayerKey = null;
  root.innerHTML = `<div class="empty">${text}<br><a href="${matchId ? esc(matchUrl()) : "/"}">&#8592; Back</a></div>`;
}

function render() {
  if (failed) {
    notFound("Could not load match. Please check your connection and try again.");
    return;
  }
  if (!loaded) return;
  if (!match || typeof match.startTime !== "number") {
    notFound("Match not found");
    return;
  }

  const now = Date.now();
  const state = getState(match, now);
  document.title = teamName(match.team1) + " vs " + teamName(match.team2) + " - NPLcode";

  if (!document.getElementById("playerSlot")) {
    root.innerHTML = '<div class="layout"><div class="col-main"><div id="playerSlot"></div><div id="barSlot"></div></div><div class="col-chat" id="chatSlot"></div></div>';
    lastPlayerKey = null;
    initChat();
  }

  let activeNo = 0;
  if (state === "live") {
    const available = [];
    for (let i = 1; i <= LINK_COUNT; i++) {
      const u = match.links && match.links["link" + i];
      if (isHttpUrl(u)) available.push(i);
    }
    if (available.length) activeNo = available.indexOf(linkNo) !== -1 ? linkNo : available[0];
  }

  let playerHtml;
  let playerKey;
  if (state === "live" && activeNo) {
    const src = match.links["link" + activeNo].trim();
    playerKey = "p|" + activeNo + "|" + src + "|" + reloadN;
    playerHtml = `<div class="stage"><div class="player-wrap"><iframe src="${esc(src)}" width="100%" height="100%" style="aspect-ratio:16/9;border:0;" allow="autoplay; fullscreen; encrypted-media; picture-in-picture" allowfullscreen loading="lazy"></iframe></div></div>`;
  } else if (state === "live") {
    playerKey = "nolinks";
    playerHtml = thumbNoLinks();
  } else if (state === "ended") {
    playerKey = "ended|" + (match.winner || "");
    playerHtml = thumbEnded(match);
  } else {
    playerKey = "soon|" + duration(match.startTime - now);
    playerHtml = thumbNotStarted(match, now);
  }

  if (playerKey !== lastPlayerKey) {
    document.getElementById("playerSlot").innerHTML = playerHtml;
    lastPlayerKey = playerKey;
  }

  const count = Math.max(1, viewers);
  document.getElementById("barSlot").innerHTML = `
    <div class="controls">
      <div class="pills">
        ${badgeHtml(state)}
        <span class="pill" title="Currently watching">${ICON.eye}<b>${count}</b> watching</span>
      </div>
      <div class="actions">
        ${state === "live" ? `<button class="icon-btn" type="button" data-act="reload" aria-label="Reload stream" title="Reload stream">${ICON.refresh}</button>` : ""}
        <button class="icon-btn" type="button" data-act="share" aria-label="Share" title="Share">${ICON.share}</button>
      </div>
    </div>
  `;
}

function onError() {
  failed = true;
  render();
}

function makeSessionId() {
  const rand = () => Math.random().toString(36).slice(2, 10);
  const fresh = Date.now().toString(36) + rand() + rand();
  try {
    const key = "npl_sid";
    let id = sessionStorage.getItem(key);
    if (!id) {
      id = fresh;
      sessionStorage.setItem(key, id);
    }
    return id;
  } catch (err) {
    return fresh;
  }
}

function entryTime(v) {
  if (v && typeof v === "object") return typeof v.t === "number" ? v.t : 0;
  return typeof v === "number" ? v : 0;
}

function recountViewers() {
  const now = Date.now() + serverOffset;
  let n = 0;
  for (const key of Object.keys(presenceData)) {
    const t = entryTime(presenceData[key]);
    if (t && now - t < ACTIVE_MS) n++;
  }
  if (n !== viewers) {
    viewers = n;
    render();
  }
}

function pruneStale(roomPath) {
  const now = Date.now() + serverOffset;
  for (const key of Object.keys(presenceData)) {
    const t = entryTime(presenceData[key]);
    if (t && now - t > PRUNE_MS) {
      remove(ref(db, roomPath + "/" + key)).catch(() => {});
    }
  }
}

function startPresence() {
  const roomPath = "presence/" + matchId;
  const me = ref(db, roomPath + "/" + makeSessionId());
  let connected = false;
  let warned = false;

  function warn(err) {
    if (warned) return;
    warned = true;
    console.warn("[NPLcode] Viewer count needs Firebase rules for 'presence/{matchId}' (read + write). Error:", err && err.message ? err.message : err);
  }

  function beat() {
    if (!connected) return;
    set(me, { t: serverTimestamp() }).catch(warn);
  }

  onValue(ref(db, ".info/serverTimeOffset"), (snap) => {
    serverOffset = typeof snap.val() === "number" ? snap.val() : 0;
    recountViewers();
  });

  onValue(ref(db, ".info/connected"), (snap) => {
    connected = snap.val() === true;
    if (!connected) return;
    onDisconnect(me).remove().then(beat).catch((err) => {
      warn(err);
      beat();
    });
  });

  onValue(ref(db, roomPath), (snap) => {
    presenceData = snap.val() || {};
    recountViewers();
  }, warn);

  setInterval(beat, BEAT_MS);
  setInterval(() => {
    recountViewers();
    pruneStale(roomPath);
  }, 15000);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") beat();
  });
  window.addEventListener("online", beat);
  window.addEventListener("pagehide", () => {
    remove(me).catch(() => {});
  });
  window.addEventListener("pageshow", beat);
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

  startPresence();
  startChat();

  setInterval(() => {
    if (!match || typeof match.startTime !== "number") return;
    const now = Date.now();
    const st = getState(match, now);
    const sig = st + whenText(match, st, now);
    if (sig !== lastSignature) {
      lastSignature = sig;
      render();
    }
  }, 1000);
}