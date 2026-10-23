import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const DB = "https://darbarhigh-4c642-default-rtdb.firebaseio.com";
const TICK_PATH = "M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.5l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72l-3.8-3.81 1.48-1.48 2.32 2.33 5.85-5.87 1.48 1.48-7.33 7.35z";
const FONT_URLS = [
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-700-normal.woff",
  "https://cdn.jsdelivr.net/npm/@fontsource/inter@5.0.8/files/inter-latin-500-normal.woff",
  "https://cdn.jsdelivr.net/npm/@fontsource/noto-sans-devanagari@5.0.8/files/noto-sans-devanagari-devanagari-700-normal.woff"
];

function str(value) {
  return typeof value === "string" ? value : "";
}

function capitalize(text) {
  const clean = String(text || "").trim();
  return clean ? clean.charAt(0).toUpperCase() + clean.slice(1).toLowerCase() : "";
}

function cloudinaryImage(url, transform) {
  if (!url || url.indexOf("res.cloudinary.com") === -1 || url.indexOf("/image/upload/") === -1) return url;
  return url.replace("/image/upload/", "/image/upload/" + transform + "/");
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

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i += 8192) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
  }
  return btoa(binary);
}

async function photoDataUri(url) {
  if (!url) return "";
  try {
    const res = await fetch(cloudinaryImage(url, "w_480,h_480,c_fill,g_face,q_auto,f_jpg"));
    if (!res.ok) return "";
    const type = (res.headers.get("content-type") || "").split(";")[0].trim().toLowerCase();
    if (type !== "image/jpeg" && type !== "image/png") return "";
    return "data:" + type + ";base64," + toBase64(await res.arrayBuffer());
  } catch (e) {
    return "";
  }
}

async function loadFonts() {
  try {
    const buffers = await Promise.all(FONT_URLS.map(function (url) {
      return fetch(url).then(function (res) {
        if (!res.ok) throw new Error("font");
        return res.arrayBuffer();
      });
    }));
    return [
      { name: "Inter", data: buffers[0], weight: 700, style: "normal" },
      { name: "Inter", data: buffers[1], weight: 500, style: "normal" },
      { name: "Inter", data: buffers[2], weight: 700, style: "normal" }
    ];
  } catch (e) {
    return undefined;
  }
}

function node(type, style, children, extra) {
  return { type: type, props: Object.assign({ style: style, children: children }, extra || {}) };
}

function avatarNode(photo, name) {
  const base = {
    width: 300,
    height: 300,
    borderRadius: 150,
    border: "10px solid #ffffff",
    boxShadow: "0 12px 40px rgba(12, 31, 74, 0.25)",
    overflow: "hidden",
    display: "flex"
  };
  if (photo) {
    return node("div", base, node("img", { width: 280, height: 280, objectFit: "cover" }, undefined, { src: photo, width: 280, height: 280 }));
  }
  return node("div", Object.assign({}, base, {
    alignItems: "center",
    justifyContent: "center",
    background: "#1e4b7a",
    color: "#ffffff",
    fontSize: 120,
    fontWeight: 700
  }), (name.charAt(0) || "D").toUpperCase());
}

function tickNode(color) {
  return node("svg", { display: "flex", marginLeft: 16 }, node("path", {}, undefined, { d: TICK_PATH, fill: color }), {
    width: 56,
    height: 56,
    viewBox: "0 0 24 24"
  });
}

export default async function handler(request) {
  const id = new URL(request.url).searchParams.get("id") || "";
  const valid = /^[A-Za-z0-9_-]{1,128}$/.test(id);

  let name = "Durbar User";
  let role = "";
  let photoUrl = "";

  if (valid) {
    const key = encodeURIComponent(id);
    const results = await Promise.all([
      loadValue("users/" + key + "/fullName"),
      loadValue("users/" + key + "/profileImageUrl"),
      loadValue("users/" + key + "/role")
    ]);
    name = str(results[0]).trim() || name;
    photoUrl = str(results[1]);
    role = capitalize(str(results[2]));
  }

  const results = await Promise.all([photoDataUri(photoUrl), loadFonts()]);
  const photo = results[0];
  const fonts = results[1];
  const tickColor = role.toLowerCase() === "moderator" ? "#7b8190" : "#1d9bf0";
  const nameSize = name.length > 26 ? 52 : name.length > 16 ? 64 : 76;

  const nameRow = node("div", { display: "flex", alignItems: "center", justifyContent: "center", marginTop: 36, maxWidth: 1040 }, [
    node("div", { display: "flex", fontSize: nameSize, fontWeight: 700, color: "#0c1f4a", letterSpacing: -1, textAlign: "center" }, name)
  ].concat(role ? [tickNode(tickColor)] : []));

  const children = [
    avatarNode(photo, name),
    nameRow
  ];

  if (role) {
    children.push(node("div", { display: "flex", marginTop: 14, fontSize: 38, fontWeight: 500, color: "#1f4aa8" }, role));
  }

  children.push(node("div", { display: "flex", position: "absolute", bottom: 34, fontSize: 28, fontWeight: 700, color: "#6b7a99", letterSpacing: 4 }, "DURBAR"));

  const tree = node("div", {
    width: 1200,
    height: 630,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    background: "linear-gradient(135deg, #eaf1fd 0%, #ffffff 55%, #dfe9fb 100%)",
    fontFamily: "Inter, sans-serif",
    position: "relative"
  }, children);

  const options = { width: 1200, height: 630, headers: { "Cache-Control": "public, s-maxage=600, stale-while-revalidate=3600" } };
  if (fonts) options.fonts = fonts;

  return new ImageResponse(tree, options);
}