"use client";

import { useState } from "react";
import Link from "next/link";
import { PublicBlogPost } from "../../_lib/compro-data";

const ITEMS_PER_PAGE = 5;

function formatDate(value: string | null) {
  if (!value) return "Tanggal menyusul";
  return new Intl.DateTimeFormat("id-ID", { dateStyle: "long" }).format(
    new Date(value)
  );
}

export function BeritaFilterableList({
  initialPosts,
}: {
  initialPosts: PublicBlogPost[];
}) {
  const dynamicCategories = Array.from(
    new Set(initialPosts.map((p) => p.category).filter(Boolean))
  ).sort();

  const categories = ["Semua", ...dynamicCategories];

  const [activeCategory, setActiveCategory] = useState("Semua");
  const [page, setPage] = useState(1);

  const filteredPosts =
    activeCategory === "Semua"
      ? initialPosts
      : initialPosts.filter((p) => p.category === activeCategory);

  const totalPages = Math.ceil(filteredPosts.length / ITEMS_PER_PAGE);
  const paginatedPosts = filteredPosts.slice(
    (page - 1) * ITEMS_PER_PAGE,
    page * ITEMS_PER_PAGE
  );

  function handleCategoryChange(cat: string) {
    setActiveCategory(cat);
    setPage(1);
  }

  return (
    <>
      {/* -- FILTER TABS -- */}
      <div className="mb-10 flex flex-wrap items-center gap-3">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => handleCategoryChange(cat)}
            className={`border-2 px-6 py-3 text-sm font-black uppercase tracking-widest transition ${
              activeCategory === cat
                ? "border-primary bg-secondary text-white shadow-[4px_4px_0px_theme(colors.primary)]"
                : "border-border bg-white text-muted hover:border-primary hover:text-primary hover:shadow-[4px_4px_0px_theme(colors.primary)]"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* -- POST LIST -- */}
      {paginatedPosts.length > 0 ? (
        <div className="space-y-4">
          {paginatedPosts.map((post, idx) => {
            const isFirst = idx === 0 && page === 1 && activeCategory === "Semua";
            return (
              <Link
                href={`/berita/${post.slug}`}
                key={post.slug}
                className={`group flex items-center gap-6 border-2 bg-white p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_theme(colors.primary)] ${
                  isFirst
                    ? "border-primary shadow-[4px_4px_0px_theme(colors.secondary)]"
                    : "border-border hover:border-primary"
                }`}
              >
                {/* Nomor urut */}
                <div
                  className={`hidden flex-shrink-0 items-center justify-center font-heading text-2xl font-black tabular-nums sm:flex ${
                    isFirst ? "text-secondary" : "text-primary/15 group-hover:text-primary/30"
                  }`}
                  style={{ minWidth: "2.5rem" }}
                >
                  {String((page - 1) * ITEMS_PER_PAGE + idx + 1).padStart(2, "0")}
                </div>

                {/* Divider */}
                <div
                  className={`hidden h-16 w-px flex-shrink-0 sm:block ${
                    isFirst ? "bg-secondary/30" : "bg-border group-hover:bg-primary/20"
                  }`}
                />

                {/* Konten */}
                <div className="min-w-0 flex-1">
                  {/* Meta baris atas */}
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    {isFirst && (
                      <span className="bg-secondary px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-white">
                        Artikel Terbaru
                      </span>
                    )}
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest ${
                        isFirst ? "text-secondary" : "text-secondary/80"
                      }`}
                    >
                      {post.category}
                    </span>
                    <span className="text-[10px] text-muted">·</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted">
                      {formatDate(post.publishedAt)}
                    </span>
                  </div>

                  {/* Judul */}
                  <h2
                    className={`font-heading text-lg font-black uppercase leading-snug transition-colors group-hover:text-secondary ${
                      isFirst ? "text-primary md:text-xl" : "text-primary"
                    }`}
                  >
                    {post.title}
                  </h2>

                  {/* Excerpt */}
                  <p className="mt-1.5 line-clamp-2 text-sm leading-6 text-muted">
                    {post.excerpt}
                  </p>
                </div>

                {/* Arrow CTA */}
                <div
                  className={`hidden flex-shrink-0 items-center justify-center border-2 transition-all duration-200 group-hover:bg-primary group-hover:text-white sm:flex ${
                    isFirst
                      ? "border-secondary text-secondary group-hover:border-primary"
                      : "border-border text-muted group-hover:border-primary"
                  }`}
                  style={{ width: 44, height: 44 }}
                >
                  <span className="material-symbols-outlined text-[20px]">
                    arrow_forward
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="border-2 border-border bg-slate-50 p-10 text-center">
          <p className="text-muted">
            Tidak ada artikel untuk kategori <strong>{activeCategory}</strong>.
          </p>
        </div>
      )}

      {/* -- PAGINATION -- */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          {/* Prev */}
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex h-11 items-center gap-2 border-2 border-border px-4 text-sm font-black uppercase tracking-widest text-primary transition hover:border-primary hover:shadow-[4px_4px_0px_theme(colors.primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            <span className="material-symbols-outlined text-[18px]">
              arrow_back
            </span>
            Prev
          </button>

          {/* Page numbers */}
          <div className="flex items-center gap-1">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setPage(num)}
                className={`flex h-11 w-11 items-center justify-center border-2 font-heading text-sm font-black transition ${
                  num === page
                    ? "border-primary bg-primary text-white shadow-[4px_4px_0px_theme(colors.secondary)]"
                    : "border-border text-muted hover:border-primary hover:text-primary"
                }`}
              >
                {num}
              </button>
            ))}
          </div>

          {/* Next */}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="flex h-11 items-center gap-2 border-2 border-border px-4 text-sm font-black uppercase tracking-widest text-primary transition hover:border-primary hover:shadow-[4px_4px_0px_theme(colors.primary)] disabled:cursor-not-allowed disabled:opacity-30"
          >
            Next
            <span className="material-symbols-outlined text-[18px]">
              arrow_forward
            </span>
          </button>
        </div>
      )}

      {/* Info total */}
      {filteredPosts.length > 0 && (
        <p className="mt-4 text-center text-xs text-muted">
          Menampilkan{" "}
          <strong className="text-primary">
            {(page - 1) * ITEMS_PER_PAGE + 1}{" sampai "}
            {Math.min(page * ITEMS_PER_PAGE, filteredPosts.length)}
          </strong>{" "}
          dari <strong className="text-primary">{filteredPosts.length}</strong> artikel
        </p>
      )}
    </>
  );
}
