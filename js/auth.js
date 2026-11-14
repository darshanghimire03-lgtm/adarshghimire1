import { auth, authDb, googleProvider as provider, ref, get, set, update, serverTimestamp, signInWithPopup, signInWithRedirect, onAuthStateChanged, signOut } from "/js/firebase-config.js";

const PROMPT_DELAY_MS = 1200;
const PROMPT_KEY = "npl_auth_prompted";
const USER_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

let user = null;
let ready = false;
let busy = false;
let closeTimer = null;
let els = null;

export function getCurrentUser() {
  return user;
}

export function isAuthReady() {
  return ready;
}

export function openAuthSheet() {
  if (!els) return;
  clearTimeout(closeTimer);
  els.msg.textContent = "";
  els.sheet.hidden = false;
  void els.sheet.offsetWidth;
  els.sheet.classList.add("open");
  els.close.focus();
}

export function closeAuthSheet() {
  if (!els) return;
  els.sheet.classList.remove("open");
  clearTimeout(closeTimer);
  closeTimer = setTimeout(() => {
    els.sheet.hidden = true;
  }, 260);
}

function initialOf(u) {
  const base = (u && (u.displayName || u.email)) || "?";
  return base.charAt(0).toUpperCase();
}

function paintAvatar(el, u) {
  el.textContent = "";
  if (!u) {
    el.innerHTML = USER_ICON;
    return;
  }
  if (u.photoURL) {
    const img = document.createElement("img");
    img.alt = "";
    img.referrerPolicy = "no-referrer";
    img.src = u.photoURL;
    img.addEventListener("error", () => {
      el.textContent = initialOf(u);
    }, { once: true });
    el.appendChild(img);
  } else {
    el.textContent = initialOf(u);
  }
}

function paintUser() {
  paintAvatar(els.btn, user);
  els.btn.classList.toggle("in", !!user);
  els.btn.setAttribute("aria-label", user ? "Account: " + (user.displayName || user.email || "signed in") : "Sign in");
  els.out.hidden = !!user;
  els.in.hidden = !user;
  els.title.textContent = user ? "Your account" : "Sign in to NPLcode";
  if (user) {
    paintAvatar(els.photo, user);
    els.name.textContent = user.displayName || "";
    els.email.textContent = user.email || "";
  }
}

async function saveUser(u) {
  const userRef = ref(authDb, "users/" + u.uid);
  const snap = await get(userRef);
  const profile = {
    fullName: u.displayName || "",
    email: u.email || "",
    profileUrl: u.photoURL || ""
  };
  if (!snap.exists()) {
    await set(userRef, { ...profile, createdAt: serverTimestamp() });
  } else {
    await update(userRef, profile);
  }
}

function showError(err) {
  const code = err && err.code ? err.code : "";
  if (els.sheet.hidden) openAuthSheet();
  if (code === "auth/unauthorized-domain") {
    els.msg.textContent = "Add " + location.hostname + " to Firebase Authentication > Settings > Authorized domains.";
  } else if (code === "auth/network-request-failed") {
    els.msg.textContent = "Network error. Check your connection and try again.";
  } else {
    els.msg.textContent = (err && err.message) || "Could not sign in. Please try again.";
  }
}

function setBusy(on) {
  busy = on;
  els.google.disabled = on;
  els.googleText.textContent = on ? "Signing in..." : "Continue with Google";
}

export async function signInGoogle() {
  if (busy || !els) return;
  setBusy(true);
  els.msg.textContent = "";
  try {
    await signInWithPopup(auth, provider);
    closeAuthSheet();
  } catch (err) {
    const code = err && err.code ? err.code : "";
    if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
      return;
    }
    if (code === "auth/popup-blocked" || code === "auth/operation-not-supported-in-this-environment") {
      try {
        await signInWithRedirect(auth, provider);
        return;
      } catch (err2) {
        showError(err2);
        return;
      }
    }
    showError(err);
  } finally {
    setBusy(false);
  }
}

async function signOutNow() {
  els.signOut.disabled = true;
  try {
    await signOut(auth);
    closeAuthSheet();
  } catch (err) {
    console.warn("[NPLcode] Sign out failed", err);
  } finally {
    els.signOut.disabled = false;
  }
}

function maybePrompt() {
  if (PROMPT_DELAY_MS <= 0 || user) return;
  try {
    if (sessionStorage.getItem(PROMPT_KEY)) return;
    sessionStorage.setItem(PROMPT_KEY, "1");
  } catch (err) {}
  setTimeout(() => {
    if (user || document.querySelector(".sheet.open")) return;
    openAuthSheet();
  }, PROMPT_DELAY_MS);
}

export function initAuth() {
  const btn = document.getElementById("authBtn");
  const sheet = document.getElementById("authSheet");
  if (!btn || !sheet) return;

  els = {
    btn,
    sheet,
    close: sheet.querySelector(".sheet-x"),
    title: document.getElementById("authTitle"),
    out: document.getElementById("authOut"),
    in: document.getElementById("authIn"),
    google: document.getElementById("googleBtn"),
    googleText: document.getElementById("googleBtnText"),
    msg: document.getElementById("authMsg"),
    photo: document.getElementById("authPhoto"),
    name: document.getElementById("authName"),
    email: document.getElementById("authEmail"),
    signOut: document.getElementById("signOutBtn")
  };

  btn.addEventListener("click", openAuthSheet);
  els.google.addEventListener("click", signInGoogle);
  els.signOut.addEventListener("click", signOutNow);
  sheet.addEventListener("click", (e) => {
    if (e.target.closest("[data-close]")) closeAuthSheet();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !sheet.hidden) closeAuthSheet();
  });

  paintUser();

  onAuthStateChanged(auth, async (u) => {
    user = u;
    paintUser();
    if (u) {
      try {
        await saveUser(u);
      } catch (err) {
        console.warn("[NPLcode] Could not save user to database", err);
      }
    }
    if (!ready) {
      ready = true;
      maybePrompt();
    }
    document.dispatchEvent(new CustomEvent("auth:change", { detail: { user: u } }));
  });
}