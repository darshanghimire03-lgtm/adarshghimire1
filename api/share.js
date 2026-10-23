const DB = "https://darbarhigh-4c642-default-rtdb.firebaseio.com";
const SITE = "https://adarshghimire1.com.np";
const DEFAULT_IMAGE = SITE + "/favicon.png";
const TICK_PATH = "M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z";

function esc(value) {
  return String(value == null ? "" : value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shorten(text, max) {
  const clean = String(text || "").replace(/\s+/g, " ").trim();
  return clean.length > max ? clean.slice(0, max - 1).trimEnd() + "…" : clean;
}

function cloudinaryImage(url, transform) {
  if (!url || url.indexOf("res.cloudinary.com") === -1 || url.indexOf("/image/upload/") === -1) return url;
  return url.replace("/image/upload/", "/image/upload/" + transform + "/");
}

function videoThumbnail(videoUrl) {
  if (!videoUrl || videoUrl.indexOf("res.cloudinary.com") === -1 || videoUrl.indexOf("/video/upload/") === -1) return "";
  return videoUrl
    .replace("/video/upload/", "/video/upload/so_0,w_1200,h_630,c_fill,q_auto,f_jpg/")
    .replace(/\.[a-zA-Z0-9]{2,4}(\?.*)?$/, ".jpg");
}

async function loadValue(path) {
  try {
    const res = await fetch(DB + "/" + path + ".json");
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function loadNode(path) {
  const data = await loadValue(path);
  return data && typeof data === "object" ? data : null;
}

function str(value) {
  return typeof value === "string" ? value : "";
}

async function loadPost(id) {
  const key = encodeURIComponent(id);
  const results = await Promise.all([
    loadValue("posts/" + key + "/authorUid"),
    loadValue("posts/" + key + "/text"),
    loadValue("posts/" + key + "/imageUrl"),
    loadValue("posts/" + key + "/authorRole"),
    loadValue("posts/" + key + "/createdAt")
  ]);

  const authorUid = str(results[0]);
  const text = str(results[1]);
  const imageUrl = str(results[2]);
  const authorRole = str(results[3]);
  const createdAt = typeof results[4] === "number" ? results[4] : 0;

  if (!authorUid && !text && !imageUrl) return null;

  let authorName = "";
  let authorPhoto = "";
  let role = authorRole;

  if (authorUid && /^[A-Za-z0-9_-]{1,128}$/.test(authorUid)) {
    const uKey = encodeURIComponent(authorUid);
    const user = await Promise.all([
      loadValue("users/" + uKey + "/fullName"),
      loadValue("users/" + uKey + "/profileImageUrl"),
      loadValue("users/" + uKey + "/role")
    ]);
    authorName = str(user[0]);
    authorPhoto = str(user[1]);
    if (!role) role = str(user[2]);
  }

  return {
    authorName: authorName,
    authorPhoto: authorPhoto,
    authorRole: role,
    text: text,
    imageUrl: imageUrl,
    createdAt: createdAt
  };
}

function capitalize(text) {
  const clean = String(text || "").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : "";
}

async function loadUser(uid) {
  const key = encodeURIComponent(uid);
  const results = await Promise.all([
    loadValue("users/" + key + "/fullName"),
    loadValue("users/" + key + "/profileImageUrl"),
    loadValue("users/" + key + "/role")
  ]);

  const name = str(results[0]).trim();
  const photo = str(results[1]);
  const role = str(results[2]).trim();

  if (!name && !photo && !role) return null;

  return { name: name, photo: photo, role: role };
}

const baseStyle =
  "*{box-sizing:border-box;margin:0;padding:0}" +
  "body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;background:#eef1f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:#1a1a1a}" +
  ".card{width:100%;max-width:480px;background:#fff;border-radius:20px;padding:18px;box-shadow:0 12px 40px rgba(0,0,0,.1)}" +
  ".head{display:flex;align-items:center;gap:12px;margin-bottom:14px}" +
  ".avatar{width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0}" +
  ".avatar.fallback{display:flex;align-items:center;justify-content:center;background:#1e4b7a;color:#fff;font-weight:800;font-size:20px}" +
  ".name{font-weight:800;font-size:16px}" +
  ".role{font-size:12px;color:#777;text-transform:capitalize;margin-top:2px}" +
  ".text{font-size:15px;line-height:1.55;color:#222;margin-bottom:14px;white-space:pre-wrap;word-break:break-word}" +
  ".media{width:100%;border-radius:14px;display:block;margin-bottom:14px;max-height:360px;object-fit:cover}" +
  ".tag{display:inline-block;background:#e8f0fe;color:#1e4b7a;font-size:12px;font-weight:700;padding:4px 12px;border-radius:999px;margin-bottom:14px}" +
  ".btn{display:block;text-align:center;background:#111;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px;border-radius:999px}" +
  ".brand{text-align:center;font-size:12px;color:#999;margin-top:12px}" +
  ".profile{text-align:center;padding:14px 0 22px}" +
  ".profile .avatar{width:112px;height:112px;margin:0 auto 16px;display:block;border:4px solid #eaf1fd}" +
  ".profile .avatar.fallback{display:flex;font-size:44px}" +
  ".profile .name-row{display:flex;align-items:center;justify-content:center;gap:8px}" +
  ".profile .name{font-size:24px;word-break:break-word}" +
  ".profile .role{font-size:15px;margin-top:6px}" +
  ".badge{width:24px;height:24px;flex-shrink:0}";

function metaTags(opts) {
  return '<meta name="description" content="' + esc(opts.description) + '">' +
    '<meta property="og:site_name" content="Durbar">' +
    '<meta property="og:type" content="' + opts.type + '">' +
    '<meta property="og:url" content="' + esc(opts.pageUrl) + '">' +
    '<meta property="og:title" content="' + esc(opts.title) + '">' +
    '<meta property="og:description" content="' + esc(opts.description) + '">' +
    '<meta property="og:image" content="' + esc(opts.image) + '">' +
    '<meta property="og:image:width" content="' + opts.imageWidth + '">' +
    '<meta property="og:image:height" content="' + opts.imageHeight + '">' +
    '<meta property="og:image:alt" content="' + esc(opts.title) + '">' +
    '<meta name="twitter:card" content="' + opts.twitterCard + '">' +
    '<meta name="twitter:title" content="' + esc(opts.title) + '">' +
    '<meta name="twitter:description" content="' + esc(opts.description) + '">' +
    '<meta name="twitter:image" content="' + esc(opts.image) + '">';
}

function wrapPage(title, meta, bodyHtml, redirectTo) {
  const script = redirectTo
    ? "<script>try{window.location.replace(" + JSON.stringify(redirectTo) + ")}catch(e){window.location.href=" + JSON.stringify(redirectTo) + "}</script>"
    : "";
  return '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>" + esc(title) + "</title>" + meta +
    '<link rel="icon" href="' + esc(DEFAULT_IMAGE) + '">' +
    "<style>" + baseStyle + "</style></head><body>" + bodyHtml + script + "</body></html>";
}

function renderPost(id, post) {
  const pageUrl = SITE + "/post/" + id;
  const name = post && post.authorName ? post.authorName : "Durbar User";
  const role = post && post.authorRole ? post.authorRole : "";
  const body = post ? shorten(post.text, 300) : "";
  const photo = post && post.authorPhoto ? cloudinaryImage(post.authorPhoto, "w_600,h_600,c_fill,g_face,q_auto,f_jpg") : "";
  const postImage = post && post.imageUrl ? cloudinaryImage(post.imageUrl, "w_1200,h_630,c_fill,q_auto,f_jpg") : "";
  const image = postImage || photo || DEFAULT_IMAGE;
  const title = post ? name + " on Durbar" : "Post on Durbar";
  const description = body || (post ? "Shared a post on Durbar" : "Open this post in the Durbar app");
  const isWide = !!postImage;

  const avatar = photo
    ? '<img class="avatar" src="' + esc(photo) + '" alt="">'
    : '<div class="avatar fallback">' + esc(name.charAt(0).toUpperCase()) + "</div>";

  const html =
    '<div class="card"><div class="head">' + avatar +
    '<div><div class="name">' + esc(name) + "</div>" +
    (role ? '<div class="role">' + esc(role) + "</div>" : "") +
    "</div></div>" +
    (body ? '<p class="text">' + esc(body) + "</p>" : "") +
    (postImage ? '<img class="media" src="' + esc(postImage) + '" alt="">' : "") +
    '<a class="btn" href="' + esc(SITE + "/post/?id=" + id) + '">View post</a>' +
    '<div class="brand">Durbar Learning Platform</div></div>';

  return wrapPage(title, metaTags({
    title: title,
    description: description,
    image: image,
    imageWidth: isWide ? 1200 : 600,
    imageHeight: isWide ? 630 : 600,
    pageUrl: pageUrl,
    type: "article",
    twitterCard: isWide ? "summary_large_image" : "summary"
  }), html, SITE + "/post/?id=" + encodeURIComponent(id));
}

function renderShort(id, short) {
  const pageUrl = SITE + "/shorts/" + id;
  const target = SITE + "/shorts/?id=" + encodeURIComponent(id);
  const shortTitle = short && short.title ? shorten(short.title, 90) : "";
  const subject = short && short.relatedSubject ? short.relatedSubject : "";
  const thumb = short ? videoThumbnail(short.videoUrl) : "";
  const title = shortTitle || "Short on Durbar";
  const description = shortTitle && subject
    ? subject + " • Watch this short on Durbar"
    : "Watch this short on Durbar";
  const image = thumb || DEFAULT_IMAGE;

  const html =
    '<div class="card">' +
    (thumb ? '<img class="media" src="' + esc(thumb) + '" alt="">' : "") +
    (subject ? '<div class="tag">' + esc(subject) + "</div>" : "") +
    '<p class="text">' + esc(title) + "</p>" +
    '<a class="btn" href="' + esc(target) + '">Watch short</a>' +
    '<div class="brand">Durbar Learning Platform</div></div>';

  return wrapPage(title, metaTags({
    title: title,
    description: description,
    image: image,
    imageWidth: 1200,
    imageHeight: 630,
    pageUrl: pageUrl,
    type: "website",
    twitterCard: thumb ? "summary_large_image" : "summary"
  }), html, target);
}

function circleImage(url) {
  if (!url) return "";
  if (url.indexOf("res.cloudinary.com") === -1 || url.indexOf("/image/upload/") === -1) return url;
  return url.replace("/image/upload/", "/image/upload/w_400,h_400,c_fill,g_face/r_max/f_png/");
}

function renderUser(id, user) {
  const pageUrl = SITE + "/durbar/user/" + id;
  const target = id === "invalid" ? SITE + "/" : SITE + "/profile/?uid=" + encodeURIComponent(id);
  const name = user && user.name ? user.name : "Durbar User";
  const role = user ? capitalize(user.role) : "";
  const isModerator = role.toLowerCase() === "moderator";
  const photo = user && user.photo ? user.photo : "";
  const circle = circleImage(photo);
  const pagePhoto = photo ? cloudinaryImage(photo, "w_400,h_400,c_fill,g_face,q_auto,f_jpg") : "";
  const title = user ? name + " on Durbar" : "Profile on Durbar";
  const description = role ? role + " • View profile on Durbar" : "View profile on Durbar";
  const image = circle || DEFAULT_IMAGE;

  const avatar = pagePhoto
    ? '<img class="avatar" src="' + esc(pagePhoto) + '" alt="">'
    : '<div class="avatar fallback">' + esc(name.charAt(0).toUpperCase()) + "</div>";

  const tick = role
    ? '<svg class="badge" viewBox="0 0 24 24" fill="' + (isModerator ? "#7b8190" : "#1d9bf0") + '"><path d="' + TICK_PATH + '"/></svg>'
    : "";

  const html =
    '<div class="card"><div class="profile">' + avatar +
    '<div class="name-row"><div class="name">' + esc(name) + "</div>" + tick + "</div>" +
    (role ? '<div class="role">' + esc(role) + "</div>" : "") +
    "</div>" +
    '<a class="btn" href="' + esc(target) + '">View profile</a>' +
    '<div class="brand">Durbar Learning Platform</div></div>';

  return wrapPage(title, metaTags({
    title: title,
    description: description,
    image: image,
    imageWidth: 400,
    imageHeight: 400,
    pageUrl: pageUrl,
    type: "profile",
    twitterCard: "summary"
  }), html, target);
}

module.exports = async function handler(req, res) {
  const type = String((req.query && req.query.type) || "");
  const id = String((req.query && req.query.id) || "");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  const validId = /^[A-Za-z0-9_-]{1,64}$/.test(id);

  if (type === "post") {
    const post = validId ? await loadPost(id) : null;
    res.status(200).send(renderPost(validId ? id : "invalid", post));
    return;
  }

  if (type === "shorts") {
    const short = validId ? await loadNode("shorts/" + encodeURIComponent(id)) : null;
    res.status(200).send(renderShort(validId ? id : "invalid", short));
    return;
  }

  if (type === "user") {
    const validUid = /^[A-Za-z0-9_-]{1,128}$/.test(id);
    const user = validUid ? await loadUser(id) : null;
    res.status(200).send(renderUser(validUid ? id : "invalid", user));
    return;
  }

  res.status(404).send(wrapPage("Durbar", "", '<div class="card"><p class="text">Page not found</p><a class="btn" href="/">Go to Durbar</a></div>', null));
};