import { db, authDb, ref, get, push, query, limitToLast, onChildAdded, serverTimestamp } from "/js/firebase-config.js";
import { loadPartial, fillTemplate } from "/js/layout.js";
import { getCurrentUser, signInGoogle } from "/js/auth.js";

const MAX_NAME = 40;
const MAX_MSG = 200;
const SEND_GAP_MS = 2000;
const KEEP_MSGS = 80;
const STICK_PX = 60;

const ICON = {
  send: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>',
  down: '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M19 12l-7 7-7-7"/></svg>',
  google: '<svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>'
};

let matchId = null;
let started = false;
let comments = [];
const seen = new Set();
let els = null;
let footInTpl = "";
let footOutTpl = "";
let emptyTpl = "";
let profile = null;
let stick = true;
let unread = 0;
let lastPost = 0;
let toastTimer = null;

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function isHttpUrl(u) {
  return typeof u === "string" && /^https?:\/\//i.test(u.trim());
}

function cleanName(s) {
  return String(s || "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

function nameHue(name) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) % 360;
  return h;
}

function initialOf(name) {
  return (name || "?").charAt(0).toUpperCase();
}

function avatarInner(name, photo) {
  const initial = esc(initialOf(name));
  if (photo) {
    return `<img src="${esc(photo)}" alt="" referrerpolicy="no-referrer" data-i="${initial}" onerror="this.replaceWith(document.createTextNode(this.dataset.i))">`;
  }
  return initial;
}

function showToast(text) {
  const el = document.getElementById("toast");
  if (!el) return;
  el.textContent = text;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 2200);
}

function fallbackProfile(user) {
  const mail = user.email ? user.email.split("@")[0] : "";
  return {
    uid: user.uid,
    name: cleanName(user.displayName || mail) || "User",
    photo: isHttpUrl(user.photoURL) ? user.photoURL : ""
  };
}

async function loadProfile(user) {
  const base = fallbackProfile(user);
  try {
    const snap = await get(ref(authDb, "users/" + user.uid));
    const v = snap.val();
    if (v) {
      return {
        uid: user.uid,
        name: cleanName(v.fullName) || base.name,
        photo: isHttpUrl(v.profileUrl) ? v.profileUrl : base.photo
      };
    }
  } catch (err) {}
  return base;
}

function syncProfile() {
  const user = getCurrentUser();
  if (!user) {
    profile = null;
    return;
  }
  if (profile && profile.uid === user.uid) return;
  profile = fallbackProfile(user);
  const uid = user.uid;
  loadProfile(user).then((p) => {
    const cur = getCurrentUser();
    if (!cur || cur.uid !== uid) return;
    profile = p;
    renderFoot();
    renderList();
  });
}

function isMine(c) {
  return !!(profile && c.u && c.u === profile.uid);
}

function msgHtml(c) {
  const hue = nameHue(c.n);
  return `<div class="msg ${isMine(c) ? "mine" : ""}"><div class="msg-av" style="background:hsl(${hue},70%,68%)">${avatarInner(c.n, c.p)}</div><div class="msg-body"><span class="msg-name" style="color:hsl(${hue},70%,72%)">${esc(c.n)}</span><span class="msg-text">${esc(c.m)}</span></div></div>`;
}

function scrollToBottom() {
  if (!els) return;
  els.list.scrollTop = els.list.scrollHeight;
  stick = true;
  unread = 0;
  els.jump.hidden = true;
}

function updateJump() {
  if (!els) return;
  if (stick || unread === 0) {
    els.jump.hidden = true;
    return;
  }
  els.jump.hidden = false;
  els.jump.innerHTML = ICON.down + (unread > 1 ? unread + " new comments" : "New comment");
}

function renderList() {
  if (!els) return;
  if (!comments.length) {
    els.list.innerHTML = emptyTpl;
    els.count.textContent = "0";
    return;
  }
  els.list.innerHTML = comments.map(msgHtml).join("");
  els.count.textContent = comments.length;
  if (stick) scrollToBottom();
}

function appendComment(c) {
  if (!els) return;
  const placeholder = els.list.querySelector(".chat-empty");
  if (placeholder) placeholder.remove();
  els.list.insertAdjacentHTML("beforeend", msgHtml(c));
  while (els.list.children.length > KEEP_MSGS) els.list.removeChild(els.list.firstChild);
  els.count.textContent = els.list.children.length;
  if (stick || isMine(c)) {
    scrollToBottom();
  } else {
    unread++;
    updateJump();
  }
}

function renderFoot() {
  if (!els) return;
  if (!profile) {
    els.foot.innerHTML = fillTemplate(footOutTpl, { google: ICON.google });
    return;
  }
  const hue = nameHue(profile.name);
  els.foot.innerHTML = fillTemplate(footInTpl, {
    avatar: avatarInner(profile.name, profile.photo),
    name: esc(profile.name),
    max: MAX_MSG,
    send: ICON.send
  });
  const av = els.foot.querySelector(".chat-me-av");
  if (av) av.style.background = "hsl(" + hue + ",70%,68%)";
}

function submitMessage(form) {
  if (!profile || !matchId) return;
  const input = form.querySelector("input");
  const text = String(input ? input.value : "").replace(/\s+/g, " ").trim().slice(0, MAX_MSG);
  if (!text) return;
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
    n: profile.name,
    m: text,
    u: profile.uid,
    p: profile.photo,
    t: serverTimestamp()
  }).catch(() => {
    showToast("Could not send comment");
  });
}

async function chatLogin(btn) {
  btn.disabled = true;
  try {
    await signInGoogle();
  } finally {
    btn.disabled = false;
  }
}

export function startComments(id) {
  if (!id) return;
  matchId = id;
  if (started) return;
  started = true;
  const q = query(ref(db, "comments/" + id), limitToLast(KEEP_MSGS));
  onChildAdded(q, (snap) => {
    const v = snap.val();
    if (!v || typeof v.m !== "string" || typeof v.n !== "string") return;
    if (seen.has(snap.key)) return;
    seen.add(snap.key);
    const c = {
      n: cleanName(v.n) || "Guest",
      m: v.m.slice(0, MAX_MSG),
      u: typeof v.u === "string" ? v.u : "",
      p: isHttpUrl(v.p) ? v.p : ""
    };
    comments.push(c);
    if (comments.length > KEEP_MSGS) comments.shift();
    appendComment(c);
  }, () => {});
}

export function refreshComments() {
  syncProfile();
  renderFoot();
  renderList();
}

export async function mountComments(slot) {
  if (!slot) return;
  const html = await loadPartial("comments");
  const tpl = document.createElement("template");
  tpl.innerHTML = html;
  const frag = tpl.content;
  footInTpl = frag.getElementById("chatFootIn").innerHTML;
  footOutTpl = frag.getElementById("chatFootOut").innerHTML;
  emptyTpl = frag.getElementById("chatEmpty").innerHTML;
  const section = frag.querySelector(".chat");
  slot.replaceChildren(section);

  els = {
    root: section,
    list: section.querySelector("#chatList"),
    jump: section.querySelector("#chatJump"),
    count: section.querySelector("#chatCount"),
    foot: section.querySelector("#chatFoot")
  };

  els.list.addEventListener("scroll", () => {
    stick = els.list.scrollHeight - els.list.scrollTop - els.list.clientHeight < STICK_PX;
    if (stick) unread = 0;
    updateJump();
  }, { passive: true });

  els.jump.addEventListener("click", scrollToBottom);

  section.addEventListener("click", (e) => {
    const act = e.target.closest("[data-act]");
    if (act && act.getAttribute("data-act") === "chat-login") chatLogin(act);
  });

  section.addEventListener("submit", (e) => {
    if (e.target && e.target.id === "msgForm") {
      e.preventDefault();
      submitMessage(e.target);
    }
  });

  stick = true;
  unread = 0;
  syncProfile();
  renderFoot();
  renderList();
}