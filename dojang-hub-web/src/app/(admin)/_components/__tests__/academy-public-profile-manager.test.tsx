import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import AcademyPublicProfileManager from "../academy-public-profile-manager";
import * as adminApi from "../../_lib/admin-api";
import type {
  AcademyPublicProfile,
  AkademiMeResponse,
  PublicProfileCoach,
} from "../../_lib/admin-api";

vi.mock("../../_lib/admin-api", () => ({
  getAkademiMe: vi.fn(),
  getAkademiPublicProfile: vi.fn(),
  updateAkademiPublicProfile: vi.fn(),
  updateAkademiCoachVisibility: vi.fn(),
  addAkademiPublicOfficial: vi.fn(),
  updateAkademiPublicOfficial: vi.fn(),
  deleteAkademiPublicOfficial: vi.fn(),
  addAkademiHeroImage: vi.fn(),
  updateAkademiHeroImage: vi.fn(),
  deleteAkademiHeroImage: vi.fn(),
  addAkademiGalleryItem: vi.fn(),
  updateAkademiGalleryItem: vi.fn(),
  deleteAkademiGalleryItem: vi.fn(),
  addAkademiPublicAchievement: vi.fn(),
  updateAkademiPublicAchievement: vi.fn(),
  deleteAkademiPublicAchievement: vi.fn(),
  uploadAkademiFile: vi.fn(),
}));

describe("AcademyPublicProfileManager", () => {
  const mockMe: AkademiMeResponse = {
    user: {
      id: 1,
      name: "Ketua",
      email: "ketua@test.com",
      role: "ketua_akademi",
      avatar_url: null,
      is_active: true,
      akademi_id: 1,
    },
    akademi: {
      id: 1,
      name: "Test Dojang",
      slug: "test-dojang",
      sport_type: "taekwondo",
      logo_url: null,
      status: "active",
      plan: "pro",
      plan_expires_at: null,
      created_at: "2026-01-01T00:00:00Z",
      updated_at: "2026-01-01T00:00:00Z",
    },
    subscription: null,
    entitlements: {
      student_limit: 100,
      has_public_website: true,
      has_subdomain: true,
      has_rapor: true,
      has_exam_events: true,
      has_parent_portal: false,
    },
  };

  const mockProfile: AcademyPublicProfile = {
    id: 1,
    akademi_id: 1,
    about: "Akademi Taekwondo terbaik.",
    vision: "Mencetak atlet handal.",
    mission: "Latihan rutin dan disiplin.",
    public_schedule: null,
    whatsapp: "81234567890",
    cta_label: "Hubungi WhatsApp",
    is_published: true,
    primary_color: "#031636",
    button_color: "#d32f2f",
    background_color: "#f8fafc",
    text_color: "#0f172a",
    heading_font: "Montserrat",
    body_font: "Inter",
    button_radius: 8,
    hero_images: [
      {
        id: 1,
        akademi_id: 1,
        image_url: "https://example.com/hero1.jpg",
        caption: "Latihan Poomsae",
        focal_x: 50,
        focal_y: 50,
        pan_x: 0,
        pan_y: 0,
        zoom: 100,
        sort_order: 0,
        is_active: true,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
    officials: [
      {
        id: 1,
        akademi_id: 1,
        name: "Sabeum Budi",
        position: "Kepala Pelatih",
        description: "Dan 4 Kukkiwon",
        photo_url: null,
        sort_order: 0,
        is_active: true,
      },
    ],
    gallery_items: [
      {
        id: 1,
        akademi_id: 1,
        image_url: "https://example.com/gallery1.jpg",
        caption: "Ujian Kenaikan Tingkat",
        show_on_about: true,
        sort_order: 0,
        created_at: "2026-01-01T00:00:00Z",
        updated_at: "2026-01-01T00:00:00Z",
      },
    ],
    achievements: [
      {
        id: 1,
        akademi_id: 1,
        title: "Juara Umum Kejurda 2025",
        description: "Meraih 5 emas",
        achieved_on: "2025-08-17",
        sort_order: 0,
      },
    ],
  };

  const mockCoaches: PublicProfileCoach[] = [
    {
      id: 1,
      name: "Sabeum Budi",
      rank_label: "Dan 4",
      photo_url: null,
      show_on_public: true,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem("skaihub_admin_token", "fake-token");
    vi.mocked(adminApi.getAkademiMe).mockResolvedValue(mockMe);
    vi.mocked(adminApi.getAkademiPublicProfile).mockResolvedValue({
      profile: mockProfile,
      coaches: mockCoaches,
    });
  });

  it("merender tab profil publik dan berpindah tab", async () => {
    render(<AcademyPublicProfileManager />);

    expect(screen.getByText("Memuat profil publik...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("Profil Publik")).toBeInTheDocument();
      expect(screen.getByText("Info & Publish")).toBeInTheDocument();
      expect(screen.getByText("Tampilan")).toBeInTheDocument();
      expect(screen.getByText("Pelatih")).toBeInTheDocument();
      expect(screen.getByText("Pengurus")).toBeInTheDocument();
      expect(screen.getByText("Hero & Galeri")).toBeInTheDocument();
      expect(screen.getByText("Prestasi")).toBeInTheDocument();
    });

    // Pindah ke tab Tampilan
    fireEvent.click(screen.getByText("Tampilan"));
    expect(screen.getByText("Palet Warna")).toBeInTheDocument();
    expect(screen.getByText("Live Preview")).toBeInTheDocument();

    // Pindah ke tab Pelatih
    fireEvent.click(screen.getByText("Pelatih"));
    expect(screen.getByText("Visibilitas Pelatih Publik")).toBeInTheDocument();
    expect(screen.getByText("Sabeum Budi")).toBeInTheDocument();

    // Pindah ke tab Pengurus
    fireEvent.click(screen.getByText("Pengurus"));
    expect(screen.getByText("Struktur Pengurus")).toBeInTheDocument();
    expect(screen.getByText("Kepala Pelatih")).toBeInTheDocument();

    // Pindah ke tab Hero & Galeri
    fireEvent.click(screen.getByText("Hero & Galeri"));
    expect(screen.getByText("Hero Slider")).toBeInTheDocument();
    expect(screen.getByText("Galeri Foto")).toBeInTheDocument();
    expect(screen.getByText("Latihan Poomsae")).toBeInTheDocument();

    // Pindah ke tab Prestasi
    fireEvent.click(screen.getByText("Prestasi"));
    expect(screen.getByText("Tambah Prestasi Baru")).toBeInTheDocument();
    expect(screen.getByText("Juara Umum Kejurda 2025")).toBeInTheDocument();
  });

  it("dapat membuka modal atur posisi hero dan modal tambah galeri", async () => {
    render(<AcademyPublicProfileManager />);

    await waitFor(() => {
      expect(screen.getByText("Hero & Galeri")).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText("Hero & Galeri"));

    // Buka modal crop hero
    const cropButton = screen.getByRole("button", { name: /atur posisi/i });
    fireEvent.click(cropButton);

    expect(screen.getByRole("heading", { name: "Atur Posisi Hero" })).toBeInTheDocument();
    expect(screen.getByText(/Pratinjau Crop Hero/i)).toBeInTheDocument();

    // Tutup modal hero
    fireEvent.click(screen.getByRole("button", { name: "Batal" }));

    // Buka modal tambah foto galeri
    const addGalleryButton = screen.getByRole("button", { name: /tambah foto/i });
    fireEvent.click(addGalleryButton);

    expect(screen.getByRole("heading", { name: "Tambah Foto Galeri" })).toBeInTheDocument();
    expect(screen.getByLabelText(/file foto/i)).toBeInTheDocument();
  });
});
