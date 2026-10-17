import DOMPurify from "isomorphic-dompurify";

const ALLOWED_TAGS = [
  "p",
  "br",
  "strong",
  "em",
  "u",
  "s",
  "a",
  "ul",
  "ol",
  "li",
  "h2",
  "h3",
  "h4",
  "blockquote",
  "img",
  "figure",
  "figcaption",
  "span",
  "code",
  "pre",
];

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt"];

let hookRegistered = false;

function ensureHookRegistered() {
  if (hookRegistered) return;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeType !== 1) return;

    const tagName = node.tagName.toLowerCase();

    // Enforce tag-specific attribute allowlist:
    // Only <a> can have href, target, rel
    // Only <img> can have src, alt
    // All other tags cannot have attributes
    for (const attr of Array.from(node.attributes)) {
      const attrName = attr.name.toLowerCase();
      if (tagName === "a") {
        if (!["href", "target", "rel"].includes(attrName)) {
          node.removeAttribute(attr.name);
        }
      } else if (tagName === "img") {
        if (!["src", "alt"].includes(attrName)) {
          node.removeAttribute(attr.name);
        }
      } else {
        node.removeAttribute(attr.name);
      }
    }

    // Reject javascript:, data:, vbscript: URLs in href and src
    for (const attr of ["href", "src"]) {
      if (node.hasAttribute(attr)) {
        const val = node.getAttribute(attr) || "";
        const normalized = val.replace(/[\x00-\x20\s]/g, "").toLowerCase();
        if (
          normalized.startsWith("javascript:") ||
          normalized.startsWith("data:") ||
          normalized.startsWith("vbscript:")
        ) {
          node.removeAttribute(attr);
        }
      }
    }

    // Force rel="noopener noreferrer" on target="_blank"
    if (tagName === "a" && node.getAttribute("target") === "_blank") {
      node.setAttribute("rel", "noopener noreferrer");
    }
  });

  hookRegistered = true;
}

/**
 * Sanitizes rich-text HTML string before rendering to prevent stored XSS (F9 / D13).
 * Allowlist: p, br, strong, em, u, s, a[href,target,rel], ul, ol, li, h2–h4,
 * blockquote, img[src,alt], figure, figcaption, span, code, pre.
 * Forces rel="noopener noreferrer" on target="_blank".
 * Rejects javascript: and all data: URLs.
 */
export function sanitizeHtml(html: string): string {
  if (!html || typeof html !== "string") {
    return "";
  }

  ensureHookRegistered();

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
  });
}
