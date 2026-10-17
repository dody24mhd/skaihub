"use client";

import { useState } from "react";

type Props = {
  src: string;
  alt: string;
};

export function BeritaImageViewer({ src, alt }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Container Gambar Normal (Terpotong Banner) */}
      <div
        className="group relative mb-8 aspect-video w-full cursor-pointer overflow-hidden border-2 border-primary shadow-[8px_8px_0px_theme(colors.secondary)]"
        onClick={() => setIsOpen(true)}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
        />
        
        {/* Overlay Icon Expand */}
        <div className="absolute inset-0 flex items-center justify-center bg-primary/0 transition-all duration-300 group-hover:bg-primary/20">
          <div className="flex size-12 translate-y-4 items-center justify-center bg-secondary text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
            <span className="material-symbols-outlined">zoom_out_map</span>
          </div>
        </div>
      </div>

      {/* Modal Gambar Penuh (Utuh) */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-primary/90 p-4 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        >
          {/* Tombol Close */}
          <button
            className="absolute right-6 top-6 flex size-12 items-center justify-center bg-secondary text-white transition hover:bg-secondary-dark"
            onClick={() => setIsOpen(false)}
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Gambar Ukuran Penuh */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-h-full max-w-full border-4 border-white object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()} // Supaya klik gambar tidak menutup modal
          />
        </div>
      )}
    </>
  );
}
