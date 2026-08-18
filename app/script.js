/* ============================================================
   DOROI APPS — script.js
   Handles: navigation (Home/Search/Profile), search/filter,
   rendering app cards from data, and the detail modal.
   ============================================================ */

(function () {
  "use strict";

  /* ---------------------------------------------------------
     1. SAMPLE APP DATA
     Mirrors the AppItem model fields used in the Android app:
     appName, category, shortDescription, appSize, iconUrl, etc.
     Replace with real data from your backend / GitHub / API.
  --------------------------------------------------------- */
  const APPS = [
    { id:"1", appName:"Pixel Forge", category:"Tools", shortDescription:"A lightweight image editor with layers, filters and batch export built for speed.", appSize:"18 MB", developer:"Doroi Labs", icon:"🛠️", color:"#152B6F" },
    { id:"2", appName:"Nova Racer", category:"Games", shortDescription:"Arcade-style racing with 40 tracks, drift physics and online leaderboards.", appSize:"142 MB", developer:"Nova Studio", icon:"🎮", color:"#FFD602" },
    { id:"3", appName:"InkCanvas", category:"Creative", shortDescription:"Digital painting app with pressure-sensitive brushes and layer blending.", appSize:"64 MB", developer:"InkWorks", icon:"🎨", color:"#152B6F" },
    { id:"4", appName:"TaskFlow", category:"Productivity", shortDescription:"Minimal task manager with recurring reminders and offline sync.", appSize:"12 MB", developer:"FlowLab", icon:"✅", color:"#FFD602" },
    { id:"5", appName:"Beat Drop", category:"Music", shortDescription:"Loop-based music maker with drum kits, synths and one-tap export.", appSize:"88 MB", developer:"Drop Audio", icon:"🎵", color:"#152B6F" },
    { id:"6", appName:"Rogue Depths", category:"Games", shortDescription:"Turn-based dungeon crawler with permadeath and procedural levels.", appSize:"210 MB", developer:"Rogue Team", icon:"⚔️", color:"#FFD602" },
    { id:"7", appName:"CodeSnap", category:"Tools", shortDescription:"Turn code snippets into beautiful shareable images in seconds.", appSize:"9 MB", developer:"Doroi Labs", icon:"💻", color:"#152B6F" },
    { id:"8", appName:"Lumen Notes", category:"Productivity", shortDescription:"Markdown notes with instant search and encrypted local storage.", appSize:"15 MB", developer:"Lumen Inc", icon:"📝", color:"#FFD602" },
    { id:"9", appName:"Skyline Builder", category:"Games", shortDescription:"Relaxed city-building sim with no timers and no ads.", appSize:"175 MB", developer:"Skyline Co", icon:"🏙️", color:"#152B6F" },
    { id:"10", appName:"Frame & Filter", category:"Creative", shortDescription:"Photo editing with 60+ film-inspired presets and RAW support.", appSize:"41 MB", developer:"InkWorks", icon:"📸", color:"#FFD602" },
  ];

  const CATEGORIES = ["All", "Games", "Tools", "Creative", "Productivity", "Music"];
  const CATEGORY_EMOJI = { All:"✨", Games:"🎮", Tools:"🛠️", Creative:"🎨", Productivity:"✅", Music:"🎵" };

  const MY_UPLOADS = APPS.filter(a => a.developer === "Doroi Labs");

  let activeCategory = "All";
  let searchQuery = "";

  /* ---------------------------------------------------------
     2. HELPERS — element builders
  --------------------------------------------------------- */
  function el(tag, className, html) {
    const e = document.createElement(tag);
    if (className) e.className = className;
    if (html !== undefined) e.innerHTML = html;
    return e;
  }

  function iconPlaceholder(app, size) {
    // Since we don't have real icon URLs, render a colored tile with emoji.
    const div = document.createElement("div");
    div.style.width = size ? size + "px" : "100%";
    div.style.height = size ? size + "px" : undefined;
    div.style.aspectRatio = size ? "" : "1";
    div.style.borderRadius = size ? "16px" : "12px";
    div.style.background = app.color === "#FFD602"
      ? "linear-gradient(135deg,#FFD602,#E8C200)"
      : "linear-gradient(135deg,#152B6F,#2C4189)";
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.justifyContent = "center";
    div.style.fontSize = size ? Math.round(size * 0.45) + "px" : "1.8rem";
    div.style.flexShrink = "0";
    div.textContent = app.icon;
    div.className = size ? "app-row-icon" : "app-card-icon";
    div.style.marginBottom = size ? "" : "10px";
    return div;
  }

  /* ---------------------------------------------------------
     3. RENDER: Categories (Home)
  --------------------------------------------------------- */
  function renderCategories() {
    const wrap = document.getElementById("categoryScroller");
    wrap.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const chip = el("button", "cat-chip" + (cat === activeCategory ? " active" : ""),
        `<span class="emoji">${CATEGORY_EMOJI[cat]}</span><span>${cat}</span>`);
      chip.addEventListener("click", () => {
        activeCategory = cat;
        renderCategories();
        renderFeatured();
      });
      wrap.appendChild(chip);
    });
  }

  /* ---------------------------------------------------------
     4. RENDER: Featured grid + Recent list (Home)
  --------------------------------------------------------- */
  function renderFeatured() {
    const grid = document.getElementById("featuredGrid");
    grid.innerHTML = "";
    const list = activeCategory === "All" ? APPS : APPS.filter(a => a.category === activeCategory);
    list.slice(0, 8).forEach(app => grid.appendChild(buildAppCard(app)));
  }

  function renderRecent() {
    const wrap = document.getElementById("recentList");
    wrap.innerHTML = "";
    APPS.slice().reverse().slice(0, 4).forEach(app => wrap.appendChild(buildAppRow(app)));
  }

  function buildAppCard(app) {
    const card = el("div", "app-card");
    card.appendChild(iconPlaceholder(app));
    card.appendChild(el("div", "app-card-name", app.appName));
    card.appendChild(el("div", "app-card-cat", app.category));
    const foot = el("div", "app-card-foot");
    foot.appendChild(el("span", "app-card-size", app.appSize));
    foot.appendChild(el("span", "chip-btn", "Get"));
    card.appendChild(foot);
    card.addEventListener("click", () => openModal(app));
    return card;
  }

  function buildAppRow(app) {
    const row = el("div", "app-row");
    row.appendChild(iconPlaceholder(app, 52));
    const info = el("div", "app-row-info");
    info.appendChild(el("div", "app-row-name", app.appName));
    info.appendChild(el("div", "app-row-meta", `${app.category} <span class="dot-sep"></span>${app.appSize}`));
    row.appendChild(info);
    const btn = el("button", "app-row-install", "Install");
    btn.addEventListener("click", (e) => { e.stopPropagation(); btn.textContent = "Installed ✓"; btn.style.background = "var(--navy)"; btn.style.color = "#fff"; });
    row.appendChild(btn);
    row.addEventListener("click", () => openModal(app));
    return row;
  }

  /* ---------------------------------------------------------
     5. SEARCH PAGE
  --------------------------------------------------------- */
  function renderFilterPills() {
    const wrap = document.getElementById("filterPills");
    wrap.innerHTML = "";
    CATEGORIES.forEach(cat => {
      const pill = el("button", "pill" + (cat === activeCategory ? " active" : ""), cat);
      pill.addEventListener("click", () => {
        activeCategory = cat;
        renderFilterPills();
        runSearch();
      });
      wrap.appendChild(pill);
    });
  }

  function runSearch() {
    const q = searchQuery.trim().toLowerCase();
    let results = APPS.filter(app => {
      const matchesCat = activeCategory === "All" || app.category === activeCategory;
      const matchesQuery = !q ||
        app.appName.toLowerCase().includes(q) ||
        app.category.toLowerCase().includes(q) ||
        app.shortDescription.toLowerCase().includes(q);
      return matchesCat && matchesQuery;
    });

    const resultsWrap = document.getElementById("searchResults");
    const emptyState = document.getElementById("searchEmptyState");
    const countEl = document.getElementById("resultsCount");

    resultsWrap.innerHTML = "";

    if (results.length === 0) {
      emptyState.style.display = "block";
      countEl.textContent = "";
    } else {
      emptyState.style.display = "none";
      countEl.textContent = `${results.length} app${results.length !== 1 ? "s" : ""} found`;
      results.forEach(app => resultsWrap.appendChild(buildAppRow(app)));
    }
  }

  /* ---------------------------------------------------------
     6. PROFILE PAGE
  --------------------------------------------------------- */
  function renderProfile() {
    document.getElementById("statApps").textContent = MY_UPLOADS.length;
    document.getElementById("statDownloads").textContent = "12.4K";
    document.getElementById("statInstalled").textContent = "6";

    const wrap = document.getElementById("myUploadsList");
    wrap.innerHTML = "";
    MY_UPLOADS.forEach(app => wrap.appendChild(buildAppRow(app)));
  }

  /* ---------------------------------------------------------
     7. APP DETAIL MODAL
  --------------------------------------------------------- */
  const modalOverlay = document.getElementById("detailModal");

  function openModal(app) {
    document.getElementById("modalTitle").textContent = app.appName;
    document.getElementById("modalDev").textContent = app.developer;
    document.getElementById("modalCategory").textContent = app.category;
    document.getElementById("modalSize").textContent = app.appSize;
    document.getElementById("modalDesc").textContent = app.shortDescription;

    const iconSlot = document.getElementById("modalIcon");
    const replacement = iconPlaceholder(app, 66);
    replacement.id = "modalIcon";
    iconSlot.replaceWith(replacement);

    const installBtn = document.getElementById("modalInstallBtn");
    installBtn.textContent = "Install";
    installBtn.onclick = () => { installBtn.textContent = "Installed ✓"; };

    modalOverlay.classList.add("show");
  }

  function closeModal() {
    modalOverlay.classList.remove("show");
  }

  document.getElementById("modalCloseBtn").addEventListener("click", closeModal);
  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) closeModal();
  });

  /* ---------------------------------------------------------
     8. NAVIGATION — Home / Search / Profile
  --------------------------------------------------------- */
  const pages = { home: "page-home", search: "page-search", profile: "page-profile" };
  const navBtns = document.querySelectorAll(".nav-btn");
  const navBubble = document.getElementById("navBubble");

  function goto(pageKey) {
    Object.values(pages).forEach(id => document.getElementById(id).classList.remove("active"));
    document.getElementById(pages[pageKey]).classList.add("active");

    navBtns.forEach(btn => btn.classList.toggle("active", btn.dataset.page === pageKey));

    const activeBtn = document.querySelector(`.nav-btn[data-page="${pageKey}"]`);
    if (activeBtn) {
      const idx = Array.from(navBtns).indexOf(activeBtn);
      navBubble.style.left = `calc(${(idx + 0.5) * (100 / navBtns.length)}% - 26px)`;
    }

    if (pageKey === "search") {
      document.getElementById("searchPageInput").focus({ preventScroll: true });
    }

    window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });
  }

  navBtns.forEach(btn => {
    btn.addEventListener("click", () => goto(btn.dataset.page));
  });

  document.querySelectorAll("[data-goto]").forEach(el => {
    el.addEventListener("click", () => goto(el.dataset.goto));
  });

  document.getElementById("topProfileBtn").addEventListener("click", () => goto("profile"));

  /* ---------------------------------------------------------
     9. SEARCH INPUT WIRING (hero, topbar, search page — all synced)
  --------------------------------------------------------- */
  const heroInput = document.getElementById("heroSearchInput");
  const topInput = document.getElementById("topSearchInput");
  const searchPageInput = document.getElementById("searchPageInput");
  const clearBtn = document.getElementById("clearSearchBtn");

  function syncSearchInputs(value, sourceEl) {
    searchQuery = value;
    [heroInput, topInput, searchPageInput].forEach(input => {
      if (input !== sourceEl) input.value = value;
    });
    clearBtn.classList.toggle("show", value.length > 0);
    runSearch();
  }

  function triggerSearchFromHero(value) {
    syncSearchInputs(value, heroInput);
    goto("search");
  }

  heroInput.addEventListener("input", (e) => syncSearchInputs(e.target.value, heroInput));
  heroInput.addEventListener("focus", () => goto("search"));

  topInput.addEventListener("input", (e) => syncSearchInputs(e.target.value, topInput));
  topInput.addEventListener("focus", () => goto("search"));

  searchPageInput.addEventListener("input", (e) => syncSearchInputs(e.target.value, searchPageInput));

  clearBtn.addEventListener("click", () => {
    syncSearchInputs("", null);
    searchPageInput.focus();
  });

  /* ---------------------------------------------------------
     10. LOGOUT (demo)
  --------------------------------------------------------- */
  document.getElementById("logoutBtn").addEventListener("click", () => {
    alert("You have been logged out.");
  });

  /* ---------------------------------------------------------
     11. INIT
  --------------------------------------------------------- */
  function init() {
    renderCategories();
    renderFeatured();
    renderRecent();
    renderFilterPills();
    runSearch();
    renderProfile();
    goto("home");
  }

  document.addEventListener("DOMContentLoaded", init);
})();
