"use client";

import { useEffect, useState } from "react";

type SlideImage = {
  imageUrl: string;
  caption: string | null;
  focalX?: number;
  focalY?: number;
  panX?: number;
  panY?: number;
  zoom?: number;
};

const SLIDE_DURATION = 4500;

function useAutoSlide(total: number) {
  const [active, setActive] = useState(0);

  useEffect(() => {
    if (total <= 1) return;

    const timer = window.setInterval(() => {
      setActive((current) => (current + 1) % total);
    }, SLIDE_DURATION);

    return () => window.clearInterval(timer);
  }, [total]);

  return { active, setActive };
}

export function HeroImageSlider({
  images,
  primaryColor,
}: {
  images: SlideImage[];
  primaryColor: string;
}) {
  const slides = images.slice(0, 3);
  const { active, setActive } = useAutoSlide(slides.length);

  if (slides.length === 0) return null;

  return (
    <div className="pointer-events-none absolute inset-0 hidden md:block">
      {slides.map((item, index) => (
        <div
          key={`${item.imageUrl}-${index}`}
          className={`absolute inset-0 overflow-hidden transition-opacity duration-700 ${
            index === active ? "opacity-100" : "opacity-0"
          }`}
          style={{
            clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)",
          }}
        >
          <img
            src={item.imageUrl}
            alt={item.caption ?? `Hero ${index + 1}`}
            className="h-full w-full object-cover"
            style={{
              transform: `translate(${item.panX ?? 0}%, ${item.panY ?? 0}%) scale(${(item.zoom ?? 120) / 100})`,
              transformOrigin: "center",
            }}
          />
        </div>
      ))}
      <div
        className="absolute inset-0"
        style={{
          clipPath: "polygon(58% 0%, 100% 0%, 100% 100%, 48% 100%)",
          background: `${primaryColor}88`,
        }}
      />
      {slides.length > 1 ? (
        <div className="pointer-events-auto absolute bottom-9 right-10 z-20 flex items-center gap-2">
          {slides.map((item, index) => (
            <button
              key={`${item.imageUrl}-dot-${index}`}
              type="button"
              aria-label={`Tampilkan gambar hero ${index + 1}`}
              onClick={() => setActive(index)}
              className={`h-2.5 rounded-full bg-white transition-all ${
                index === active ? "w-8 opacity-100" : "w-2.5 opacity-45"
              }`}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function AboutImageSlider({
  images,
  primaryColor,
  buttonColor,
}: {
  images: SlideImage[];
  primaryColor: string;
  buttonColor: string;
}) {
  const slides = images.slice(0, 4);
  const { active, setActive } = useAutoSlide(slides.length);

  if (slides.length === 0) {
    return (
      <div className="flex h-80 items-center justify-center" style={{ backgroundColor: `${primaryColor}12` }}>
        <span className="material-symbols-outlined text-7xl" style={{ color: buttonColor }}>
          sports_martial_arts
        </span>
      </div>
    );
  }

  return (
    <div>
      <div className="relative h-[360px] overflow-hidden bg-slate-100">
        {slides.map((item, index) => (
          <figure
            key={`${item.imageUrl}-${index}`}
            className={`absolute inset-0 transition-all duration-700 ${
              index === active ? "translate-x-0 opacity-100" : "translate-x-6 opacity-0"
            }`}
          >
            <img
              src={item.imageUrl}
              alt={item.caption ?? `Foto akademi ${index + 1}`}
              className="h-full w-full object-cover"
            />
            {item.caption ? (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent px-5 py-4 text-sm font-bold text-white">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {slides.length > 1 ? (
        <div className="mt-4 flex justify-center gap-2">
          {slides.map((item, index) => (
            <button
              key={`${item.imageUrl}-dot-${index}`}
              type="button"
              aria-label={`Tampilkan foto tentang ${index + 1}`}
              onClick={() => setActive(index)}
              className="h-2.5 rounded-full transition-all"
              style={{
                width: index === active ? 32 : 10,
                backgroundColor: index === active ? buttonColor : `${primaryColor}33`,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function GalleryPhotoPager({
  images,
  primaryColor,
  buttonColor,
}: {
  images: SlideImage[];
  primaryColor: string;
  buttonColor: string;
}) {
  const perPage = 9;
  const pages = Array.from({ length: Math.ceil(images.length / perPage) }, (_, index) =>
    images.slice(index * perPage, index * perPage + perPage),
  );
  const [active, setActive] = useState(0);
  const current = pages[active] ?? [];

  return (
    <div>
      <div className="grid auto-rows-[160px] grid-cols-2 gap-4 md:auto-rows-[210px] md:grid-cols-4">
        {current.map((item, index) => (
          <figure
            key={`${item.imageUrl}-${active}-${index}`}
            className={`group relative overflow-hidden bg-slate-100 ${index === 0 ? "col-span-2 row-span-2" : ""}`}
            style={{
              borderRadius: 8,
              boxShadow: `0 0 0 4px ${index === 0 ? buttonColor : `${primaryColor}14`}`,
            }}
          >
            <img
              src={item.imageUrl}
              alt={item.caption ?? `Foto ${active * perPage + index + 1}`}
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
            {item.caption ? (
              <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-4 text-sm font-bold text-white">
                {item.caption}
              </figcaption>
            ) : null}
          </figure>
        ))}
      </div>

      {pages.length > 1 ? (
        <div className="mt-8 flex justify-center gap-2">
          {pages.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Tampilkan halaman galeri ${index + 1}`}
              onClick={() => setActive(index)}
              className="h-2.5 rounded-full transition-all"
              style={{
                width: index === active ? 34 : 10,
                backgroundColor: index === active ? buttonColor : `${primaryColor}30`,
              }}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
