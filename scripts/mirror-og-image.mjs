/**
 * Resolve a mirror article’s best preview image URL for static serving.
 * Prefers absolute https (twitter:image, then og:image), then on-disk relative paths.
 */
import fs from "fs";
import path from "path";

function metaContent(html, attrName, attrValue) {
  const esc = attrValue.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<meta[^>]+${attrName}=["']${esc}["'][^>]*content=["']([^"']+)["']`,
    "i",
  );
  let m = html.match(re);
  if (m) return m[1].trim();
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+${attrName}=["']${esc}["']`,
    "i",
  );
  m = html.match(re2);
  return m ? m[1].trim() : null;
}

/**
 * @param {string} mirrorDir absolute site-mirror path
 * @param {string} articleHref filename e.g. "foo.html"
 * @returns {string | null}
 */
export function readOgImageUrl(mirrorDir, articleHref) {
  const p = path.join(mirrorDir, articleHref);
  if (!articleHref || !articleHref.endsWith(".html") || !fs.existsSync(p)) {
    return null;
  }
  const html = fs.readFileSync(p, "utf8");
  const tw = metaContent(html, "name", "twitter:image");
  const og = metaContent(html, "property", "og:image");

  const isHttp = (u) => u && /^https?:\/\//i.test(String(u).trim());

  if (isHttp(tw)) return String(tw).trim();
  if (isHttp(og)) return String(og).trim();

  for (const raw of [tw, og]) {
    if (!raw) continue;
    const rel = String(raw).trim().replace(/^\.\//, "");
    const local = path.join(mirrorDir, rel);
    if (fs.existsSync(local)) return rel.replace(/\\/g, "/");
  }

  return null;
}
