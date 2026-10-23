(function () {
  var SHORT_TEMPLATE_URL = "layout/item_short.html";

  var SUBJECT_COLORS = {
    "Economics": "#2e7d32",
    "Account": "#1565c0",
    "Computer Science": "#6a1b9a",
    "English": "#c62828",
    "Nepali": "#e65100"
  };

  var viewEl = document.getElementById("view-shorts");
  var shortsFeed = document.getElementById("shortsFeed");
  var bottomNav = document.querySelector(".bottom-nav");
  var sheetOverlay = document.getElementById("sheetOverlay");
  var sheetSubtitle = document.getElementById("sheetSubtitle");
  var toastEl = document.getElementById("toast");
  var deepShortId = new URLSearchParams(location.search).get("short");

  var shortTemplate = null;
  var shortTemplatePromise = null;
  var ready = false;
  var shortsStarted = false;
  var shortsObserver = null;
  var currentShort = null;
  var needsUnmute = false;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function measureNav() {
    document.documentElement.style.setProperty("--nav-h", bottomNav.offsetHeight + "px");
  }

  function showToast(message) {
    toastEl.textContent = message;
    toastEl.classList.add("show");
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(function () {
      toastEl.classList.remove("show");
    }, 3000);
  }

  function formatViews(n) {
    n = typeof n === "number" ? n : 0;
    if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
    if (n >= 1000) return (n / 1000).toFixed(1) + "K";
    return String(n);
  }

  function timeAgo(ts) {
    if (!ts || typeof ts !== "number") return "";
    var diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return "Just now";
    if (diff < 3600) return Math.floor(diff / 60) + "m ago";
    if (diff < 86400) return Math.floor(diff / 3600) + "h ago";
    if (diff < 604800) return Math.floor(diff / 86400) + "d ago";
    if (diff < 2592000) return Math.floor(diff / 604800) + "w ago";
    return new Date(ts).toLocaleDateString();
  }

  function loadShortTemplate() {
    if (shortTemplate) return Promise.resolve(shortTemplate);
    if (shortTemplatePromise) return shortTemplatePromise;
    shortTemplatePromise = fetch(SHORT_TEMPLATE_URL).then(function (res) {
      if (!res.ok) throw new Error("template");
      return res.text();
    }).then(function (html) {
      var holder = document.createElement("template");
      holder.innerHTML = html.trim();
      var node = holder.content.firstElementChild;
      if (!node) throw new Error("template");
      shortTemplate = node;
      return shortTemplate;
    }).catch(function (err) {
      shortTemplatePromise = null;
      throw err;
    });
    return shortTemplatePromise;
  }

  function playVideo(video) {
    video.muted = false;
    var p = video.play();
    if (p && p.catch) {
      p.catch(function () {
        video.muted = true;
        needsUnmute = true;
        video.play().catch(function () {});
      });
    }
  }

  function buildShort(short, index, total) {
    var item = shortTemplate.cloneNode(true);
    item.dataset.shortId = short.shortId;

    item.querySelector(".progress-fill").style.width = ((index + 1) / total) * 100 + "%";
    item.querySelector(".short-index").textContent = (index + 1) + "/" + total;

    var video = item.querySelector(".short-video");
    var placeholder = item.querySelector(".short-placeholder");

    if (short.videoUrl) {
      placeholder.remove();
      video.src = short.videoUrl;
      video.hidden = false;

      video.addEventListener("click", function () {
        if (video.paused) playVideo(video);
        else video.pause();
      });
    } else {
      video.remove();
      placeholder.hidden = false;
    }

    item.querySelector(".short-title").textContent = short.title || "Untitled";

    var tag = item.querySelector(".subject-tag");
    tag.textContent = short.relatedSubject || "General";
    tag.style.borderColor = SUBJECT_COLORS[short.relatedSubject] || "#4a8ab5";

    item.querySelector(".views-count").textContent = formatViews(short.views);

    var ago = timeAgo(short.uploadedDate);
    if (ago) {
      var agoEl = item.querySelector(".short-ago");
      agoEl.textContent = ago;
      agoEl.hidden = false;
      item.querySelector(".short-dot").hidden = false;
    }

    item.querySelector(".share-btn").addEventListener("click", function (e) {
      e.stopPropagation();
      openSheet(short);
    });

    return item;
  }

  function showShortsState(message, withRetry) {
    shortsFeed.textContent = "";
    var box = el("div", "shorts-state");
    box.appendChild(el("div", "", message));
    if (withRetry) {
      var btn = el("button", "retry-btn", "Retry");
      btn.type = "button";
      btn.addEventListener("click", function () {
        loadShorts();
      });
      box.appendChild(btn);
    }
    shortsFeed.appendChild(box);
  }

  function showShortsLoading() {
    shortsFeed.textContent = "";
    var box = el("div", "shorts-state");
    box.appendChild(el("div", "shorts-spinner"));
    box.appendChild(el("span", "", "Loading shorts…"));
    shortsFeed.appendChild(box);
  }

  function setupAutoplay() {
    if (shortsObserver) shortsObserver.disconnect();
    shortsObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var video = entry.target;
        if (entry.isIntersecting) {
          shortsFeed.querySelectorAll("video").forEach(function (v) {
            if (v !== video) v.pause();
          });
          playVideo(video);
        } else {
          video.pause();
        }
      });
    }, { root: shortsFeed, threshold: 0.6 });

    shortsFeed.querySelectorAll("video").forEach(function (video) {
      shortsObserver.observe(video);
    });
  }

  function renderShorts(list) {
    if (!list.length) {
      showShortsState("No shorts available", false);
      return;
    }
    shortsFeed.textContent = "";
    list.forEach(function (short, index) {
      shortsFeed.appendChild(buildShort(short, index, list.length));
    });
    shortsFeed.scrollTop = 0;
    setupAutoplay();
  }

  function fetchShorts() {
    return db.ref("shorts").once("value").then(function (snap) {
      var list = [];
      snap.forEach(function (child) {
        var v = child.val();
        if (v && typeof v === "object") {
          var s = {};
          for (var k in v) s[k] = v[k];
          s.shortId = child.key;
          list.push(s);
        }
      });
      list.sort(function (a, b) {
        return (b.uploadedDate || 0) - (a.uploadedDate || 0);
      });
      if (deepShortId) {
        var target = list.filter(function (s) {
          return s.shortId === deepShortId;
        })[0];
        if (target) {
          list = [target].concat(list.filter(function (s) {
            return s.shortId !== deepShortId;
          }));
        }
      }
      return list;
    });
  }

  function loadShorts() {
    showShortsLoading();
    Promise.all([loadShortTemplate(), fetchShorts()]).then(function (results) {
      renderShorts(results[1]);
    }).catch(function () {
      showShortsState("Could not load shorts. Please try again.", true);
    });
  }

  function startShorts() {
    if (!ready || shortsStarted) return;
    shortsStarted = true;
    loadShorts();
  }

  function shortUrl(id) {
    return location.origin + "/shorts/" + encodeURIComponent(id);
  }

  function copyText(text) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      var ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {}
      document.body.removeChild(ta);
      if (ok) resolve();
      else reject(new Error("copy"));
    });
  }

  function openSheet(short) {
    currentShort = short;
    sheetSubtitle.textContent = "Share: " + (short.title || "Untitled");
    sheetOverlay.classList.add("active");
  }

  function closeSheet() {
    sheetOverlay.classList.remove("active");
  }

  function copyShortLink() {
    copyText(shortUrl(currentShort.shortId)).then(function () {
      showToast("Link copied to clipboard");
      closeSheet();
    }).catch(function () {
      showToast("Failed to copy link");
    });
  }

  function handleShare(action) {
    if (!currentShort) return;
    var title = currentShort.title || "Untitled";
    var url = shortUrl(currentShort.shortId);
    var text = "Check out this short: " + title + "\n\n" + url;

    if (action === "copy") {
      copyShortLink();
    } else if (action === "download") {
      if (!currentShort.videoUrl) {
        showToast("No video available to download");
        return;
      }
      var a = document.createElement("a");
      a.href = currentShort.videoUrl;
      a.download = "short_" + currentShort.shortId + ".mp4";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      showToast("Downloading video...");
      closeSheet();
    } else if (action === "whatsapp") {
      window.open("https://api.whatsapp.com/send?text=" + encodeURIComponent(text), "_blank");
      closeSheet();
    } else if (action === "native") {
      if (navigator.share) {
        navigator.share({ title: title, text: text, url: url }).catch(function () {});
        closeSheet();
      } else {
        copyShortLink();
      }
    }
  }

  document.getElementById("shareOptions").addEventListener("click", function (e) {
    var btn = e.target.closest(".share-option");
    if (btn) handleShare(btn.getAttribute("data-share"));
  });

  document.getElementById("sheetClose").addEventListener("click", closeSheet);

  sheetOverlay.addEventListener("click", function (e) {
    if (e.target === sheetOverlay) closeSheet();
  });

  shortsFeed.addEventListener("pointerdown", function () {
    if (!needsUnmute) return;
    needsUnmute = false;
    shortsFeed.querySelectorAll("video").forEach(function (v) {
      if (!v.paused) v.muted = false;
    });
  });

  document.addEventListener("keydown", function (e) {
    if (sheetOverlay.classList.contains("active")) {
      if (e.key === "Escape") closeSheet();
      return;
    }
    if (!viewEl.classList.contains("active")) return;
    var items = shortsFeed.querySelectorAll(".short-item");
    var current = -1;
    items.forEach(function (item, i) {
      var rect = item.getBoundingClientRect();
      if (rect.top >= -50 && rect.top < window.innerHeight / 2) current = i;
    });
    if (e.key === "ArrowDown" || e.key === "ArrowRight") {
      e.preventDefault();
      if (current < items.length - 1) items[current + 1].scrollIntoView({ behavior: "smooth" });
    } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (current > 0) items[current - 1].scrollIntoView({ behavior: "smooth" });
    }
  });

  function unlockAudio() {
    try {
      var Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      var ctx = new Ctx();
      if (ctx.state === "suspended") ctx.resume().catch(function () {});
      var buffer = ctx.createBuffer(1, 1, 22050);
      var source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
      source.stop(0.001);
    } catch (e) {}
  }

  document.addEventListener("click", unlockAudio, { once: true });
  document.addEventListener("touchstart", unlockAudio, { once: true });

  window.addEventListener("resize", measureNav);
  window.addEventListener("load", measureNav);

  window.Tabs = window.Tabs || {};
  window.Tabs.shorts = {
    start: function () {
      ready = true;
      if (viewEl.classList.contains("active")) {
        measureNav();
        startShorts();
      }
    },
    show: function () {
      measureNav();
      startShorts();
    }
  };
})();