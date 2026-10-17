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
  "h1",
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

const ALLOWED_ATTR = ["href", "target", "rel", "src", "alt", "class"];

// Quill formats alignment/indent as classes (ql-align-center, ql-indent-1).
const QUILL_CLASS_TOKEN = /^ql-[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Returns the normalized class value when EVERY token is a Quill `ql-*` class,
 * otherwise null so the whole attribute is dropped (no partial keep).
 */
function sanitizeClassValue(value: string): string | null {
  const tokens = value.split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return null;
  return tokens.every((token) => QUILL_CLASS_TOKEN.test(token)) ? tokens.join(" ") : null;
}

function isAllowedAttribute(tagName: string, attrName: string): boolean {
  if (tagName === "a") return ["href", "target", "rel"].includes(attrName);
  if (tagName === "img") return ["src", "alt"].includes(attrName);
  return false;
}

let hookRegistered = false;

function ensureHookRegistered() {
  if (hookRegistered) return;

  DOMPurify.addHook("afterSanitizeAttributes", (node) => {
    if (node.nodeType !== 1) return;

    const tagName = node.tagName.toLowerCase();

    // Enforce tag-specific attribute allowlist:
    // Only <a> can have href, target, rel; only <img> can have src, alt.
    // Any allowed tag may keep `class` if every token is a Quill ql-* class.
    for (const attr of Array.from(node.attributes)) {
      const attrName = attr.name.toLowerCase();
      if (attrName === "class") {
        const classValue = sanitizeClassValue(attr.value);
        if (classValue === null) {
          node.removeAttribute(attr.name);
        } else {
          node.setAttribute("class", classValue);
        }
      } else if (!isAllowedAttribute(tagName, attrName)) {
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
 * Allowlist: p, br, strong, em, u, s, a[href,target,rel], ul, ol, li, h1–h4,
 * blockquote, img[src,alt], figure, figcaption, span, code, pre.
 * `class` survives only when every token matches `ql-*` (Quill align/indent);
 * a mixed value such as "ql-align-center evil" is dropped entirely.
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
