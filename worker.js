const DB = "https://darbarhigh-4c642-default-rtdb.firebaseio.com";
const SITE = "https://adarshghimire1.com.np";
const APP_URL = SITE + "/";
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

function cloudinary(url, transform) {
  if (!url || url.indexOf("res.cloudinary.com") === -1 || url.indexOf("/image/upload/") === -1) return url;
  return url.replace("/image/upload/", "/image/upload/" + transform + "/");
}

async function loadCard(id) {
  try {
    const res = await fetch(DB + "/shareCards/" + encodeURIComponent(id) + ".json", {
      cf: { cacheTtl: 120, cacheEverything: true }
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data && typeof data === "object" ? data : null;
  } catch (e) {
    return null;
  }
}

function renderPage(id, card) {
  const pageUrl = SITE + "/post/" + id;
  const name = card && card.authorName ? card.authorName : "Durbar User";
  const role = card && card.authorRole ? card.authorRole : "";
  const body = card ? shorten(card.text, 300) : "";
  const photo = card && card.authorPhoto ? cloudinary(card.authorPhoto, "w_600,h_600,c_fill,g_face,q_auto,f_jpg") : "";
  const postImage = card && card.imageUrl ? cloudinary(card.imageUrl, "w_1200,h_630,c_fill,q_auto,f_jpg") : "";
  const ogImage = postImage || photo || DEFAULT_IMAGE;
  const title = card ? name + " on Durbar" : "Post on Durbar";
  const description = body || (card ? "Shared a post on Durbar" : "Open this post in the Durbar app");
  const twitterCard = postImage ? "summary_large_image" : "summary";
  const initial = esc(name.charAt(0).toUpperCase());

  const avatar = photo
    ? '<img class="avatar" src="' + esc(photo) + '" alt="">'
    : '<div class="avatar fallback">' + initial + "</div>";

  const media = postImage ? '<img class="media" src="' + esc(postImage) + '" alt="">' : "";
  const textBlock = body ? '<p class="text">' + esc(body) + "</p>" : "";

  return '<!DOCTYPE html>' +
    '<html lang="en"><head><meta charset="UTF-8">' +
    '<meta name="viewport" content="width=device-width, initial-scale=1.0">' +
    "<title>" + esc(title) + "</title>" +
    '<meta name="description" content="' + esc(description) + '">' +
    '<meta property="og:site_name" content="Durbar">' +
    '<meta property="og:type" content="article">' +
    '<meta property="og:url" content="' + esc(pageUrl) + '">' +
    '<meta property="og:title" content="' + esc(title) + '">' +
    '<meta property="og:description" content="' + esc(description) + '">' +
    '<meta property="og:image" content="' + esc(ogImage) + '">' +
    '<meta property="og:image:alt" content="' + esc(name) + '">' +
    '<meta name="twitter:card" content="' + twitterCard + '">' +
    '<meta name="twitter:title" content="' + esc(title) + '">' +
    '<meta name="twitter:description" content="' + esc(description) + '">' +
    '<meta name="twitter:image" content="' + esc(ogImage) + '">' +
    '<link rel="icon" href="' + esc(DEFAULT_IMAGE) + '">' +
    "<style>" +
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
    ".btn{display:block;text-align:center;background:#111;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px;border-radius:999px}" +
    ".brand{text-align:center;font-size:12px;color:#999;margin-top:12px}" +
    "</style></head><body>" +
    '<div class="card">' +
    '<div class="head">' + avatar +
    '<div><div class="name">' + esc(name) + "</div>" +
    (role ? '<div class="role">' + esc(role) + "</div>" : "") +
    "</div></div>" +
    textBlock + media +
    '<a class="btn" href="' + esc(SITE + "/post/?id=" + id) + '">View post</a>' +
    '<div class="brand">Durbar Learning Platform</div>' +
    "</div></body></html>";
}

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const match = url.pathname.match(/^\/(?:durbar\/)?post\/([^\/?#]+)\/?$/);
    if (!match) return fetch(request);

    const id = decodeURIComponent(match[1]);
    if (!/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
      return new Response(renderPage("invalid", null), {
        status: 200,
        headers: { "content-type": "text/html; charset=utf-8" }
      });
    }

    const card = await loadCard(id);

    return new Response(renderPage(id, card), {
      status: 200,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300"
      }
    });
  }
};