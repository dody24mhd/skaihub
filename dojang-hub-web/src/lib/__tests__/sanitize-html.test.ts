import { describe, it, expect } from "vitest";
import { sanitizeHtml } from "../sanitize-html";

describe("sanitizeHtml", () => {
  it("removes <script> tags and executes no javascript", () => {
    const dirty = '<p>Halo</p><script>alert("xss")</script><p>Dunia</p>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("<script");
    expect(clean).not.toContain("alert");
    expect(clean).toBe("<p>Halo</p><p>Dunia</p>");
  });

  it("removes inline event handlers like onerror and onclick", () => {
    const dirty = '<img src="https://example.com/img.jpg" onerror="alert(1)" alt="Foto" onclick="alert(2)">';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("onerror");
    expect(clean).not.toContain("onclick");
    expect(clean).toBe('<img src="https://example.com/img.jpg" alt="Foto">');
  });

  it("removes javascript: URLs in links", () => {
    const dirty = '<a href="javascript:alert(\'xss\')">Klik di sini</a>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("javascript:");
    expect(clean).toBe("<a>Klik di sini</a>");
  });

  it("removes data: URLs in img and a tags", () => {
    const dirtyImg = '<img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==" alt="Palsu">';
    const cleanImg = sanitizeHtml(dirtyImg);
    expect(cleanImg).not.toContain("data:");
    expect(cleanImg).toBe('<img alt="Palsu">');

    const dirtyLink = '<a href="data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==">Buka</a>';
    const cleanLink = sanitizeHtml(dirtyLink);
    expect(cleanLink).not.toContain("data:");
    expect(cleanLink).toBe("<a>Buka</a>");
  });

  it('forces rel="noopener noreferrer" when target="_blank"', () => {
    const linkWithoutRel = '<a href="https://example.com" target="_blank">Eksternal</a>';
    const clean1 = sanitizeHtml(linkWithoutRel);
    expect(clean1).toContain('target="_blank"');
    expect(clean1).toContain('rel="noopener noreferrer"');

    const linkWithOtherRel = '<a href="https://example.com" target="_blank" rel="follow">Eksternal</a>';
    const clean2 = sanitizeHtml(linkWithOtherRel);
    expect(clean2).toBe('<a href="https://example.com" target="_blank" rel="noopener noreferrer">Eksternal</a>');
  });

  it("preserves standard rich-text editor content", () => {
    const richText = [
      "<h2>Judul Berita H2</h2>",
      "<h3>Sub Judul H3</h3>",
      "<h4>Sub Sub Judul H4</h4>",
      "<p>Paragraf dengan <strong>tebal</strong>, <em>miring</em>, <u>garis bawah</u>, <s>coret</s>, dan <code>kode</code>.</p>",
      "<blockquote>Kutipan penting dari pelatih.</blockquote>",
      "<ul><li>Daftar 1</li><li>Daftar 2</li></ul>",
      "<ol><li>Langkah 1</li><li>Langkah 2</li></ol>",
      '<p>Ada link ke <a href="https://skaihub.com">SKAIHUB</a> dan <br>baris baru.</p>',
      '<figure><img src="https://example.com/foto.jpg" alt="Foto Latihan"><figcaption>Keterangan foto</figcaption></figure>',
      "<span>Teks span</span>",
      "<pre><code>console.log('kode');</code></pre>",
    ].join("");

    const clean = sanitizeHtml(richText);
    expect(clean).toBe(richText);
  });

  it("strips disallowed tags like iframe, style, form, input, button, object", () => {
    const dirty = '<iframe src="https://evil.com"></iframe><style>body{color:red;}</style><p>Konten</p><button>Klik</button>';
    const clean = sanitizeHtml(dirty);
    expect(clean).not.toContain("<iframe");
    expect(clean).not.toContain("<style");
    expect(clean).not.toContain("<button");
    expect(clean).toBe("<p>Konten</p>Klik");
  });

  it("keeps h1 headings", () => {
    expect(sanitizeHtml("<h1>Judul Utama</h1>")).toBe("<h1>Judul Utama</h1>");
  });

  it("keeps Quill alignment and indent classes", () => {
    const html = [
      '<p class="ql-align-center">Tengah</p>',
      '<h2 class="ql-align-right">Kanan</h2>',
      '<p class="ql-align-justify">Rata</p>',
      '<ol><li class="ql-indent-1">Menjorok</li></ol>',
      '<p class="ql-align-center ql-indent-2">Dua kelas</p>',
    ].join("");
    expect(sanitizeHtml(html)).toBe(html);
  });

  it("drops a class attribute that has any non-ql- token", () => {
    expect(sanitizeHtml('<p class="text-red-500">Teks</p>')).toBe("<p>Teks</p>");
    expect(sanitizeHtml('<p class="ql-align-center evil">Teks</p>')).toBe("<p>Teks</p>");
    expect(sanitizeHtml('<p class="evil ql-align-center">Teks</p>')).toBe("<p>Teks</p>");
    expect(sanitizeHtml('<p class="fixed inset-0 z-50">Overlay</p>')).toBe("<p>Overlay</p>");
  });

  it("drops class values that only look like ql- tokens", () => {
    expect(sanitizeHtml('<p class="ql-">Teks</p>')).toBe("<p>Teks</p>");
    expect(sanitizeHtml('<p class="ql-align-center&quot;onclick=&quot;x">Teks</p>')).toBe("<p>Teks</p>");
    expect(sanitizeHtml('<p class="ql-align_center">Teks</p>')).toBe("<p>Teks</p>");
    expect(sanitizeHtml('<p class="QL-ALIGN-CENTER">Teks</p>')).toBe("<p>Teks</p>");
    expect(sanitizeHtml('<p class="">Teks</p>')).toBe("<p>Teks</p>");
  });

  it("normalizes whitespace between valid ql- tokens", () => {
    expect(sanitizeHtml('<p class="  ql-align-center\t ql-indent-1 ">Teks</p>')).toBe(
      '<p class="ql-align-center ql-indent-1">Teks</p>',
    );
  });

  it("still strips other attributes next to a valid class", () => {
    const dirty = '<p class="ql-align-center" style="position:fixed" id="x" onclick="alert(1)">Teks</p>';
    expect(sanitizeHtml(dirty)).toBe('<p class="ql-align-center">Teks</p>');
  });

  it("keeps a valid ql- class on links and images without loosening URL checks", () => {
    expect(sanitizeHtml('<a class="ql-align-center" href="javascript:alert(1)">x</a>')).toBe(
      '<a class="ql-align-center">x</a>',
    );
  });

  it("handles empty or non-string inputs safely", () => {
    expect(sanitizeHtml("")).toBe("");
    // @ts-expect-error test invalid input types
    expect(sanitizeHtml(null)).toBe("");
    // @ts-expect-error test invalid input types
    expect(sanitizeHtml(undefined)).toBe("");
  });
});
