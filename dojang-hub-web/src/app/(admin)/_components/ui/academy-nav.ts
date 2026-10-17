import { AdminUser, AkademiPlan } from "../../_lib/admin-api";

export type NavItem = {
  title: string;
  href: string;
  icon: string;
  roles: AdminUser["role"][];
};

export type NavSection = {
  title: string;
  items: NavItem[];
};

export type BottomNavItem = {
  title: string;
  href: string;
  icon: string;
  isMore?: boolean;
};

export function buildNavSections(plan: AkademiPlan | null): NavSection[] {
  const hasPublicWebsite = plan === "pro" || plan === "scale";

  return [
    {
      title: "Ringkasan",
      items: [
        {
          title: "Dashboard",
          href: "/academy",
          icon: "dashboard",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
      ],
    },
    {
      title: "Setup Akademi",
      items: [
        {
          title: "Akun Akademi",
          href: "/academy/users",
          icon: "manage_accounts",
          roles: ["ketua_akademi", "admin_akademi"],
        },
        {
          title: "Pelatih",
          href: "/academy/coaches",
          icon: "sports_martial_arts",
          roles: ["ketua_akademi", "admin_akademi"],
        },
        {
          title: "Tempat Latihan",
          href: "/academy/places",
          icon: "location_on",
          roles: ["ketua_akademi", "admin_akademi"],
        },
        {
          title: "Kelas",
          href: "/academy/classes",
          icon: "groups",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
        {
          title: "Sabuk / Tingkatan",
          href: "/academy/ranks",
          icon: "military_tech",
          roles: ["ketua_akademi", "admin_akademi"],
        },
        {
          title: "Format Penilaian",
          href: "/academy/evaluation-settings",
          icon: "rule_settings",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
        ...(hasPublicWebsite
          ? [
              {
                title: "Halaman Publik",
                href: "/academy/public-profile",
                icon: "language",
                roles: ["ketua_akademi", "admin_akademi"] as AdminUser["role"][],
              },
            ]
          : []),
      ],
    },
    {
      title: "Operasional",
      items: [
        {
          title: "Siswa",
          href: "/academy/students",
          icon: "badge",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
        {
          title: "Jadwal",
          href: "/academy/schedules",
          icon: "calendar_month",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
        {
          title: "Absensi",
          href: "/academy/attendance",
          icon: "fact_check",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
        {
          title: "Penilaian",
          href: "/academy/evaluations",
          icon: "grading",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
        {
          title: "Kenaikan Tingkat",
          href: "/academy/rank-promotions",
          icon: "workspace_premium",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
        {
          title: "SPP",
          href: "/academy/spp",
          icon: "payments",
          roles: ["ketua_akademi", "admin_akademi"],
        },
        {
          title: "Keuangan",
          href: "/academy/finance",
          icon: "account_balance_wallet",
          roles: ["ketua_akademi"],
        },
      ],
    },
    {
      title: "Akun",
      items: [
        {
          title: "Ganti Password",
          href: "/academy/account",
          icon: "lock_reset",
          roles: ["ketua_akademi", "admin_akademi", "pelatih"],
        },
      ],
    },
  ];
}

export function filterNavSectionsByRole(
  sections: NavSection[],
  role: AdminUser["role"] | string | null
): NavSection[] {
  if (!role) return sections;

  return sections
    .map((section) => ({
      ...section,
      items: section.items.filter((item) =>
        item.roles.includes(role as AdminUser["role"])
      ),
    }))
    .filter((section) => section.items.length > 0);
}

export function bottomNavItems(
  role: AdminUser["role"] | string | null
): BottomNavItem[] {
  if (role === "pelatih") {
    return [
      { title: "Beranda", href: "/academy", icon: "dashboard" },
      { title: "Siswa", href: "/academy/students", icon: "badge" },
      { title: "Absensi", href: "/academy/attendance", icon: "fact_check" },
      { title: "Penilaian", href: "/academy/evaluations", icon: "grading" },
      { title: "Lainnya", href: "#more", icon: "more_horiz", isMore: true },
    ];
  }

  // Default untuk ketua_akademi, admin_akademi, dan fallback umum
  return [
    { title: "Beranda", href: "/academy", icon: "dashboard" },
    { title: "Siswa", href: "/academy/students", icon: "badge" },
    { title: "Absensi", href: "/academy/attendance", icon: "fact_check" },
    { title: "SPP", href: "/academy/spp", icon: "payments" },
    { title: "Lainnya", href: "#more", icon: "more_horiz", isMore: true },
  ];
}
