(function () {
  var POST_LIMIT = 30;
  var LOAD_TIMEOUT_MS = 12000;
  var POST_TEMPLATE_URL = "layout/item_post.html";
  var PROFILE_URL = "profile/index.html";

  var feed = document.getElementById("feed");
  var topBar = document.getElementById("topBar");
  var searchInput = document.getElementById("searchInput");
  var greetingEl = document.getElementById("greeting");
  var meAvatar = document.getElementById("meAvatar");

  var allPosts = [];
  var currentUid = "";
  var postTemplate = null;
  var templatePromise = null;

  function el(tag, className, text) {
    var node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  }

  function formatDate(ms) {
    if (!ms || typeof ms !== "number") return "";
    var d = new Date(ms);
    return d.toLocaleDateString("en-US", { month: "long" }) + " " + String(d.getDate()).padStart(2, "0");
  }

  function likeInfo(post, uid) {
    var l = post.likes;
    if (l && typeof l === "object") {
      var keys = Object.keys(l);
      return {
        count: keys.length,
        liked: !!uid && keys.indexOf(uid) !== -1 && l[uid] !== false
      };
    }
    if (typeof l === "number") return { count: l, liked: false };
    return { count: 0, liked: false };
  }

  function linkify(container, text) {
    var pattern = /(https?:\/\/[^\s]+)/g;
    var last = 0;
    var match;
    while ((match = pattern.exec(text)) !== null) {
      if (match.index > last) {
        container.appendChild(document.createTextNode(text.slice(last, match.index)));
      }
      var a = document.createElement("a");
      a.href = match[1];
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = match[1];
      container.appendChild(a);
      last = match.index + match[1].length;
    }
    if (last < text.length) {
      container.appendChild(document.createTextNode(text.slice(last)));
    }
  }

  function loadTemplate() {
    if (postTemplate) return Promise.resolve(postTemplate);
    if (templatePromise) return templatePromise;
    templatePromise = fetch(POST_TEMPLATE_URL).then(function (res) {
      if (!res.ok) throw new Error("template");
      return res.text();
    }).then(function (html) {
      var holder = document.createElement("template");
      holder.innerHTML = html.trim();
      var node = holder.content.firstElementChild;
      if (!node) throw new Error("template");
      postTemplate = node;
      return postTemplate;
    }).catch(function (err) {
      templatePromise = null;
      throw err;
    });
    return templatePromise;
  }

  function openProfile(uid) {
    if (!uid) return;
    if (uid === currentUid) {
      location.href = PROFILE_URL;
      return;
    }
    location.href = PROFILE_URL + "?uid=" + encodeURIComponent(uid);
  }

  function makeProfileTarget(node, uid) {
    node.classList.add("linked");
    node.setAttribute("role", "link");
    node.setAttribute("tabindex", "0");
    node.addEventListener("click", function () {
      openProfile(uid);
    });
    node.addEventListener("keydown", function (e) {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openProfile(uid);
      }
    });
  }

  function buildPost(post) {
    var role = (post.authorRole || "").toLowerCase();
    var name = post.authorName || "Durbar User";
    var dateLabel = formatDate(post.createdAt);

    var card = postTemplate.cloneNode(true);

    var avatarBox = card.querySelector(".avatar");
    var whoBox = card.querySelector(".who");
    var avatarImg = card.querySelector(".avatar-img");
    var avatarInitial = card.querySelector(".avatar-initial");
    avatarInitial.textContent = name.charAt(0).toUpperCase();
    if (post.authorPhoto) {
      avatarImg.alt = name;
      avatarImg.onerror = function () {
        avatarImg.hidden = true;
        avatarInitial.hidden = false;
      };
      avatarImg.src = post.authorPhoto;
      avatarImg.hidden = false;
    } else {
      avatarInitial.hidden = false;
    }

    if (post.authorUid) {
      makeProfileTarget(avatarBox, post.authorUid);
      makeProfileTarget(whoBox, post.authorUid);
    }

    card.querySelector(".name").textContent = name;
    card.querySelector(".badge").classList.toggle("grey", role === "moderator");

    var roleEl = card.querySelector(".role");
    var dotEl = card.querySelector(".dot");
    var dateEl = card.querySelector(".date");
    if (role) {
      roleEl.textContent = role;
      roleEl.hidden = false;
    }
    if (dateLabel) {
      dateEl.textContent = dateLabel;
      dateEl.hidden = false;
    }
    dotEl.hidden = !(role && dateLabel);

    var body = card.querySelector(".post-text");
    var seeMore = card.querySelector(".see-more");
    if (post.text) {
      linkify(body, post.text);
      body.hidden = false;
      seeMore.addEventListener("click", function () {
        var collapsed = body.classList.toggle("clamped");
        seeMore.textContent = collapsed ? "See more" : "See less";
      });
      card._body = body;
      card._seeMore = seeMore;
    } else {
      seeMore.remove();
    }

    var img = card.querySelector(".post-image");
    if (post.imageUrl) {
      img.onerror = function () {
        img.hidden = true;
      };
      img.src = post.imageUrl;
      img.hidden = false;
    } else {
      img.remove();
    }

    var info = likeInfo(post, currentUid);
    var likeBtn = card.querySelector(".action.like");
    likeBtn.classList.toggle("on", info.liked);
    likeBtn.querySelector(".count").textContent = String(info.count);

    card.querySelector(".action.share").addEventListener("click", function () {
      var url = location.origin + "/post/" + encodeURIComponent(post.id);
      if (navigator.share) {
        navigator.share({ title: name + " on Durbar", url: url }).catch(function () {});
      } else if (navigator.clipboard) {
        navigator.clipboard.writeText(url).catch(function () {});
      }
    });

    card.querySelector(".action.comment").addEventListener("click", function () {
      location.href = "comment.html?postId=" + encodeURIComponent(post.id);
    });

    return card;
  }

  function showState(message, withRetry) {
    feed.textContent = "";
    var box = el("div", "state");
    box.appendChild(el("div", "", message));
    if (withRetry) {
      var btn = el("button", "retry-btn", "Retry");
      btn.type = "button";
      btn.addEventListener("click", function () {
        loadFeed();
      });
      box.appendChild(btn);
    }
    feed.appendChild(box);
  }

  function showSkeletons() {
    feed.textContent = "";
    feed.appendChild(el("div", "skeleton"));
    feed.appendChild(el("div", "skeleton"));
  }

  function renderPosts() {
    var query = searchInput.value.trim().toLowerCase();
    var list = allPosts;
    if (query) {
      list = allPosts.filter(function (p) {
        return (p.text || "").toLowerCase().indexOf(query) !== -1 ||
               (p.authorName || "").toLowerCase().indexOf(query) !== -1 ||
               (p.authorRole || "").toLowerCase().indexOf(query) !== -1;
      });
    }

    if (!list.length) {
      showState(query ? "No matching posts." : "No posts yet.", false);
      return;
    }

    feed.textContent = "";
    var cards = list.map(buildPost);
    cards.forEach(function (card) {
      feed.appendChild(card);
    });
    requestAnimationFrame(function () {
      cards.forEach(function (card) {
        if (card._body && card._body.scrollHeight > card._body.clientHeight + 2) {
          card._seeMore.classList.add("visible");
        }
      });
    });
  }

  function loadUser(uid, cache) {
    if (!uid || cache[uid]) return Promise.resolve();
    cache[uid] = {};
    return db.ref("users").child(uid).once("value").then(function (snap) {
      var u = snap.val() || {};
      cache[uid] = {
        name: typeof u.fullName === "string" ? u.fullName : "",
        photo: typeof u.profileImageUrl === "string" ? u.profileImageUrl : "",
        role: typeof u.role === "string" ? u.role : ""
      };
    }).catch(function () {});
  }

  function fetchPosts() {
    return db.ref("posts").limitToLast(POST_LIMIT).once("value").then(function (snap) {
      var list = [];
      snap.forEach(function (child) {
        var v = child.val();
        if (v && typeof v === "object") {
          var post = {};
          for (var k in v) post[k] = v[k];
          post.id = child.key;
          list.push(post);
        }
      });
      list.sort(function (a, b) {
        return (b.createdAt || 0) - (a.createdAt || 0);
      });

      var cache = {};
      var uids = [];
      list.forEach(function (p) {
        if (p.authorUid && uids.indexOf(p.authorUid) === -1) uids.push(p.authorUid);
      });

      return Promise.all(uids.map(function (uid) {
        return loadUser(uid, cache);
      })).then(function () {
        return list.map(function (p) {
          var u = cache[p.authorUid] || {};
          return {
            id: p.id,
            authorUid: typeof p.authorUid === "string" ? p.authorUid : "",
            authorName: u.name || p.authorName || "",
            authorPhoto: u.photo || p.authorPhoto || "",
            authorRole: p.authorRole || u.role || "",
            createdAt: typeof p.createdAt === "number" ? p.createdAt : 0,
            text: typeof p.text === "string" ? p.text : "",
            imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : "",
            likes: p.likes !== undefined ? p.likes : p.likeCount
          };
        });
      });
    });
  }

  function loadFeed() {
    showSkeletons();
    var done = false;

    var timer = setTimeout(function () {
      if (done) return;
      done = true;
      showState("Couldn't load posts. Check your connection.", true);
    }, LOAD_TIMEOUT_MS);

    Promise.all([loadTemplate(), fetchPosts()]).then(function (results) {
      if (done) return;
      done = true;
      clearTimeout(timer);
      allPosts = results[1];
      renderPosts();
    }).catch(function () {
      if (done) return;
      done = true;
      clearTimeout(timer);
      showState("Couldn't load posts. You may not have permission to view them.", true);
    });
  }

  function loadProfile(user) {
    var fallbackName = user.displayName || (user.email ? user.email.split("@")[0] : "");
    greetingEl.textContent = fallbackName ? "Hi! " + fallbackName.split(" ")[0] : "Hi!";
    if (user.photoURL) meAvatar.src = user.photoURL;

    db.ref("users").child(user.uid).once("value").then(function (snap) {
      var u = snap.val() || {};
      if (typeof u.fullName === "string" && u.fullName.trim()) {
        greetingEl.textContent = "Hi! " + u.fullName.trim().split(" ")[0];
      }
      if (typeof u.profileImageUrl === "string" && u.profileImageUrl) {
        meAvatar.src = u.profileImageUrl;
      }
    }).catch(function () {});
  }

  document.getElementById("searchOpen").addEventListener("click", function () {
    topBar.classList.add("searching");
    searchInput.focus();
  });

  document.getElementById("searchClose").addEventListener("click", function () {
    topBar.classList.remove("searching");
    searchInput.value = "";
    if (allPosts.length) renderPosts();
  });

  searchInput.addEventListener("input", function () {
    if (allPosts.length) renderPosts();
  });

  window.Tabs = window.Tabs || {};
  window.Tabs.home = {
    start: function (user) {
      currentUid = user.uid;
      loadProfile(user);
      loadFeed();
    }
  };
})();