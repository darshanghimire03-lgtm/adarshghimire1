import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const DB = "https://ramus-7f7aa-default-rtdb.firebaseio.com";
const LIME = "#A3E635";

async function getJson(path) {
  try {
    const r = await fetch(DB + path + ".json");
    if (!r.ok) return null;
    return await r.json();
  } catch (e) {
    return null;
  }
}

function sniff(b) {
  if (b.length > 4 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return "image/png";
  if (b.length > 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "image/jpeg";
  if (b.length > 3 && b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return "image/gif";
  return null;
}

function toBase64(bytes) {
  let bin = "";
  const size = 0x8000;
  for (let i = 0; i < bytes.length; i += size) {
    bin += String.fromCharCode.apply(null, bytes.subarray(i, i + size));
  }
  return btoa(bin);
}

async function logoData(src, origin) {
  if (!src) return null;
  try {
    const abs = new URL(src, origin + "/").toString();
    const r = await fetch(abs);
    if (!r.ok) return null;
    const bytes = new Uint8Array(await r.arrayBuffer());
    if (bytes.length > 4 * 1024 * 1024) return null;
    const type = sniff(bytes);
    if (!type) return null;
    return "data:" + type + ";base64," + toBase64(bytes);
  } catch (e) {
    return null;
  }
}

function el(type, style, children, extra) {
  return { type, props: Object.assign({ style, children }, extra || {}) };
}

function teamBlock(name, logo) {
  const letter = name ? name.charAt(0).toUpperCase() : "?";
  const box = logo
    ? el(
        { display: "flex", width: 300, height: 300, borderRadius: 64, overflow: "hidden", background: "#0C0F0D", border: "2px solid rgba(255,255,255,0.12)" },
        null,
        null
      )
    : null;

  const logoNode = logo
    ? {
        type: "div",
        props: {
          style: { display: "flex", width: 300, height: 300, borderRadius: 64, overflow: "hidden", background: "#0C0F0D", border: "2px solid rgba(255,255,255,0.12)" },
          children: {
            type: "img",
            props: { src: logo, width: 300, height: 300, style: { width: 300, height: 300, objectFit: "cover" } }
          }
        }
      }
    : el(
        { display: "flex", alignItems: "center", justifyContent: "center", width: 300, height: 300, borderRadius: 64, background: "#151A17", border: "2px solid rgba(163,230,53,0.4)", color: LIME, fontSize: 130, fontWeight: 800 },
        letter
      );

  void box;

  return el(
    { display: "flex", flexDirection: "column", alignItems: "center", width: 400 },
    [
      logoNode,
      el(
        { display: "flex", justifyContent: "center", textAlign: "center", marginTop: 30, color: "#F4F6F4", fontSize: 44, fontWeight: 800, maxWidth: 400, lineHeight: 1.15 },
        name.length > 26 ? name.slice(0, 25) + "…" : name
      )
    ]
  );
}

export default async function handler(req) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const origin = url.origin;

  let n1 = "";
  let n2 = "";
  let l1 = null;
  let l2 = null;
  let found = false;

  if (id) {
    const m = await getJson("/matches/" + encodeURIComponent(id));
    if (m && m.team1 && m.team2) {
      const [t1, t2] = await Promise.all([
        getJson("/teams/" + encodeURIComponent(m.team1)),
        getJson("/teams/" + encodeURIComponent(m.team2))
      ]);
      n1 = t1 && t1.name ? t1.name : "TBD";
      n2 = t2 && t2.name ? t2.name : "TBD";
      [l1, l2] = await Promise.all([
        logoData(t1 && t1.logourl, origin),
        logoData(t2 && t2.logourl, origin)
      ]);
      found = true;
    }
  }

  const brand = el(
    { display: "flex", alignItems: "center", fontSize: 40, fontWeight: 800, color: "#F4F6F4" },
    [
      el({ display: "flex" }, "NPL"),
      el({ display: "flex", color: LIME }, "code")
    ]
  );

  let body;
  if (found) {
    body = el(
      { display: "flex", alignItems: "center", justifyContent: "center", flex: 1, width: "100%" },
      [
        teamBlock(n1, l1),
        el(
          { display: "flex", alignItems: "center", justifyContent: "center", width: 120, height: 120, borderRadius: 60, margin: "0 40px 70px", border: "2px solid rgba(255,255,255,0.18)", color: "#8C9790", fontSize: 42, fontWeight: 800 },
          "VS"
        ),
        teamBlock(n2, l2)
      ]
    );
  } else {
    body = el(
      { display: "flex", alignItems: "center", justifyContent: "center", flex: 1, color: "#F4F6F4", fontSize: 72, fontWeight: 800 },
      "Live matches & watch links"
    );
  }

  const footer = el(
    { display: "flex", alignItems: "center", justifyContent: "center", color: "#000", background: LIME, fontSize: 28, fontWeight: 800, padding: "12px 34px", borderRadius: 999 },
    found ? "WATCH LIVE ON " + new URL(origin).host.toUpperCase() : new URL(origin).host.toUpperCase()
  );

  const tree = el(
    {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "space-between",
      width: "100%",
      height: "100%",
      padding: "44px 60px",
      background: "linear-gradient(160deg, #1C231F 0%, #0C0F0D 60%)"
    },
    [brand, body, footer]
  );

  return new ImageResponse(tree, {
    width: 1200,
    height: 630,
    headers: {
      "cache-control": found
        ? "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800"
        : "public, max-age=300, s-maxage=300"
    }
  });
}