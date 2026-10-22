const DB = "https://darbarhigh-4c642-default-rtdb.firebaseio.com";
const SITE = "https://adarshghimire1.com.np";
const DEFAULT_IMAGE = SITE + "/favicon.png";

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

async function loadNode(path) {
  try {
    const res = await fetch(DB + "/" + path + ".json");
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === "object" ? data : null;
  } catch (e) {
    return null;
  }
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
  ".brand{text-align:center;font-size:12px;color:#999;margin-top:12px}";

function metaTags(opts) {
  return '<meta name="description" content="' + esc(opts.description) + '">' +
    '<meta property="og:site_name" content="Durbar">' +
    '<meta property="og:type" content="' + opts.type + '">' +
    '<meta property="og:url" content="' + esc(opts.pageUrl) + '">' +
    '<meta property="og:title" content="' + esc(opts.title) + '">' +
    '<meta property="og:description" content="' + esc(opts.description) + '">' +
    '<meta property="og:image" content="' + esc(opts.image) + '">' +
    '<meta property="og:image:width" content="1200">' +
    '<meta property="og:image:height" content="630">' +
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

function renderPost(id, card) {
  const pageUrl = SITE + "/post/" + id;
  const name = card && card.authorName ? card.authorName : "Durbar User";
  const role = card && card.authorRole ? card.authorRole : "";
  const body = card ? shorten(card.text, 300) : "";
  const photo = card && card.authorPhoto ? cloudinaryImage(card.authorPhoto, "w_600,h_600,c_fill,g_face,q_auto,f_jpg") : "";
  const postImage = card && card.imageUrl ? cloudinaryImage(card.imageUrl, "w_1200,h_630,c_fill,q_auto,f_jpg") : "";
  const image = postImage || photo || DEFAULT_IMAGE;
  const title = card ? name + " on Durbar" : "Post on Durbar";
  const description = body || (card ? "Shared a post on Durbar" : "Open this post in the Durbar app");

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
    pageUrl: pageUrl,
    type: "article",
    twitterCard: postImage ? "summary_large_image" : "summary"
  }), html, null);
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
    pageUrl: pageUrl,
    type: "website",
    twitterCard: thumb ? "summary_large_image" : "summary"
  }), html, target);
}

module.exports = async function handler(req, res) {
  const type = String((req.query && req.query.type) || "");
  const id = String((req.query && req.query.id) || "");

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, s-maxage=300, stale-while-revalidate=600");

  const validId = /^[A-Za-z0-9_-]{1,64}$/.test(id);

  if (type === "post") {
    const card = validId ? await loadNode("shareCards/" + encodeURIComponent(id)) : null;
    res.status(200).send(renderPost(validId ? id : "invalid", card));
    return;
  }

  if (type === "shorts") {
    const short = validId ? await loadNode("shorts/" + encodeURIComponent(id)) : null;
    res.status(200).send(renderShort(validId ? id : "invalid", short));
    return;
  }

  res.status(404).send(wrapPage("Durbar", "", '<div class="card"><p class="text">Page not found</p><a class="btn" href="/">Go to Durbar</a></div>', null));
};