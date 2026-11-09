export const config = { runtime: "edge" };

const DB = "https://ramus-7f7aa-default-rtdb.firebaseio.com";

function esc(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  }[c]));
}

function hash(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

async function getJson(path) {
  try {
    const r = await fetch(DB + path + ".json");
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const origin = url.origin;

  let pageRes;
  try {
    pageRes = await fetch(origin + "/detail");
  } catch (e) {
    pageRes = null;
  }
  if (!pageRes || !pageRes.ok) {
    return Response.redirect(origin + "/detail?id=" + encodeURIComponent(id), 302);
  }

  let html = await pageRes.text();
  const headers = {
    "content-type": "text/html; charset=utf-8",
    "cache-control": "public, s-maxage=60, stale-while-revalidate=300"
  };

  if (!id) return new Response(html, { headers });

  const m = await getJson("/matches/" + encodeURIComponent(id));
  if (!m || !m.team1 || !m.team2) return new Response(html, { headers });

  const [t1, t2] = await Promise.all([
    getJson("/teams/" + encodeURIComponent(m.team1)),
    getJson("/teams/" + encodeURIComponent(m.team2))
  ]);

  const n1 = t1 && t1.name ? t1.name : "TBD";
  const n2 = t2 && t2.name ? t2.name : "TBD";
  const title = n1 + " vs " + n2 + " - NPLcode";
  const desc = "Watch " + n1 + " vs " + n2 + " live on NPLcode. Get all the HD stream links.";
  const pageUrl = origin + "/match/" + encodeURIComponent(id);
  const v = hash(n1 + "|" + n2 + "|" + (t1 && t1.logourl ? t1.logourl : "") + "|" + (t2 && t2.logourl ? t2.logourl : ""));
  const image = origin + "/api/og?id=" + encodeURIComponent(id) + "&v=" + v;

  const tags = [
    '<title>' + esc(title) + '</title>',
    '<meta name="description" content="' + esc(desc) + '">',
    '<link rel="canonical" href="' + esc(pageUrl) + '">',
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="NPLcode">',
    '<meta property="og:title" content="' + esc(title) + '">',
    '<meta property="og:description" content="' + esc(desc) + '">',
    '<meta property="og:url" content="' + esc(pageUrl) + '">',
    '<meta property="og:image" content="' + esc(image) + '">',
    '<meta property="og:image:type" content="image/png">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    '<meta property="og:image:alt" content="' + esc(n1 + " vs " + n2) + '">',
    '<meta name="twitter:card" content="summary_large_image">',
    '<meta name="twitter:title" content="' + esc(title) + '">',
    '<meta name="twitter:description" content="' + esc(desc) + '">',
    '<meta name="twitter:image" content="' + esc(image) + '">'
  ].join("\n");

  html = html.replace(/<title>[^<]*<\/title>/, () => tags);

  return new Response(html, { headers });
}