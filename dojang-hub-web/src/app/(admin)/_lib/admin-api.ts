const DEFAULT_API_URL = "http://localhost:8000/api";

export const ADMIN_API_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") || DEFAULT_API_URL;

export type AdminUser = {
  id: number;
  name: string;
  email: string;
  role:
    | "super_admin"
    | "admin"
    | "ketua_akademi"
    | "admin_akademi"
    | "pelatih";
  avatar_url: string | null;
  is_active: boolean;
  akademi_id: number | null;
  akademi: {
    id: number;
    name: string;
    slug: string;
    sport_type: string;
    logo_url: string | null;
    status: string;
    plan: string;
  } | null;
};

export type LoginResponse = {
  token: string;
  user: AdminUser;
};

export async function loginAdmin(email: string, password: string) {
  const response = await fetch(`${ADMIN_API_URL}/auth/login`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    let errorMessage = "Email atau password tidak valid.";
    try {
      const data = await response.json();
      if (data.message) errorMessage = data.message;
      if (data.errors?.email?.[0]) errorMessage = data.errors.email[0];
    } catch {
      // ignore json parse error
    }
    throw new Error(errorMessage);
  }

  return response.json() as Promise<LoginResponse>;
}

export type AkademiPlan = "starter" | "pro" | "scale";
export type AkademiStatus = "active" | "inactive" | "suspended";
export type SubscriptionDuration =
  | "trial"
  | "monthly"
  | "quarterly"
  | "semester"
  | "yearly"
  | "custom";
export type SubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "expired"
  | "cancelled";
export type SubscriptionPaymentStatus = "unpaid" | "paid" | "waived" | "refunded";

export type AdminAkademi = {
  id: number;
  name: string;
  slug: string;
  sport_type: string;
  rank_system?: string | null;
  logo_url: string | null;
  status: AkademiStatus;
  plan: AkademiPlan;
  plan_expires_at: string | null;
  created_at: string;
  updated_at: string;
  users_count?: number;
  ketua_akademi_count?: number;
  admin_akademi_count?: number;
  pelatih_count?: number;
  users?: Array<{
    id: number;
    akademi_id: number;
    name: string;
    email: string;
    role: AdminUser["role"];
    is_active: boolean;
    created_at: string;
  }>;
  subscriptions?: AdminSubscription[];
};

export type AdminSubscription = {
  id: number;
  akademi_id: number;
  plan: AkademiPlan;
  duration_type: SubscriptionDuration;
  duration_months: number | null;
  included_student_limit: number;
  extra_student_blocks: number;
  starts_at: string;
  ends_at: string;
  subtotal_amount: string;
  discount_amount: string;
  amount: string;
  payment_status: SubscriptionPaymentStatus;
  payment_method: string | null;
  payment_proof_url: string | null;
  status: SubscriptionStatus;
  activated_at: string | null;
  cancelled_at: string | null;
  created_by: number | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type AkademiEntitlements = {
  student_limit: number;
  has_public_website: boolean;
  has_subdomain: boolean;
  has_rapor: boolean;
  has_exam_events: boolean;
  has_parent_portal: boolean;
};

export type AkademiMeResponse = {
  user: Omit<AdminUser, "akademi">;
  akademi: AdminAkademi;
  subscription: AdminSubscription | null;
  entitlements: AkademiEntitlements;
};

export type AkademiDashboardSummary = {
  profile: AkademiMeResponse;
  period: {
    year: number;
    month: number;
    month_label: string;
  };
  students: {
    active_count: number;
    inactive_count: number;
    alumni_count: number;
    latest: Student[];
  } | null;
  setup: {
    places_count: number;
    classes_count: number;
    active_schedules_count: number;
  } | null;
  spp: {
    bill_count: number;
    total_amount: number;
    paid_amount: number;
    unpaid_count: number;
  } | null;
  sessions: {
    month_count: number;
    completed_count: number;
    attendance_total: number;
    attendance_present: number;
    attendance_rate: number;
    latest: TrainingSession[];
  };
  evaluation: {
    active_period: EvaluationPeriod | null;
    active_scores_count: number;
  };
  rank_promotion: {
    latest_event: RankPromotionEvent | null;
  };
};

export type TrainingPlace = {
  id: number;
  akademi_id: number;
  name: string;
  address: string | null;
  notes: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

export type TrainingClass = {
  id: number;
  akademi_id: number;
  training_place_id: number | null;
  name: string;
  spp_amount_override: string | null;
  target_sessions_per_month: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  training_place?: TrainingPlace | null;
};

export type SportRankLevelType = "geup" | "kyu" | "poom" | "dan";

export type SportRank = {
  id: number;
  akademi_id?: number | null;
  sport_type: string;
  rank_system?: string | null;
  code: string;
  label: string;
  sequence: number;
  level_type?: SportRankLevelType | null;
  level_number?: number | null;
  belt_color?: string | null;
  stripe_color?: string | null;
};

export type SportRankPayload = Pick<SportRank, "code" | "label" | "sequence"> &
  Partial<Pick<SportRank, "belt_color" | "stripe_color">>;

export type Student = {
  id: number;
  akademi_id: number;
  current_rank_id: number | null;
  primary_class_id: number | null;
  member_number: string;
  name: string;
  gender: "male" | "female";
  birth_date: string;
  joined_date: string;
  status: "active" | "inactive" | "alumni";
  height_cm: number | null;
  weight_kg: string | null;
  student_phone: string | null;
  guardian_name: string | null;
  guardian_phone: string | null;
  photo_url: string | null;
  address: string | null;
  shirt_size: string | null;
  school_name: string | null;
  school_grade: string | null;
  health_notes: string | null;
  current_rank?: SportRank | null;
  primary_class?: TrainingClass | null;
};

export type Coach = AdminUser & {
  coach_profile?: {
    id: number;
    user_id: number;
    akademi_id: number;
    phone: string | null;
    license_number: string | null;
    rank_label: string | null;
    photo_url: string | null;
    joined_date: string | null;
    address: string | null;
    status: "active" | "inactive";
  } | null;
};

export type AcademyManagedUser = AdminUser & {
  coach_profile?: Coach["coach_profile"];
};

export type TrainingSchedule = {
  id: number;
  akademi_id: number;
  class_id: number;
  training_place_id: number | null;
  coach_id: number | null;
  day_of_week: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  class?: TrainingClass | null;
  training_place?: TrainingPlace | null;
  coach?: Coach | null;
  coaches?: Coach[];
};

export type TrainingAttendance = {
  id: number;
  training_session_id: number;
  student_id: number | null;
  participant_name: string | null;
  is_extra_participant: boolean;
  status: "present" | "absent" | "excused";
  notes: string | null;
  student?: Student | null;
};

export type TrainingSession = {
  id: number;
  akademi_id: number;
  training_schedule_id: number | null;
  class_id: number;
  training_place_id: number | null;
  coach_id: number | null;
  session_date: string;
  source_schedule_date: string | null;
  starts_at: string;
  ends_at: string;
  material: string | null;
  notes: string | null;
  photo_urls: string[] | null;
  session_type: "regular" | "replacement" | "extra";
  status: "draft" | "completed" | "cancelled" | "rescheduled";
  reschedule_reason?: string | null;
  cancel_reason?: string | null;
  rescheduled_to_id?: number | null;
  rescheduled_from_id?: number | null;
  attendances_count?: number;
  present_count?: number;
  schedule?: TrainingSchedule | null;
  class?: TrainingClass | null;
  training_place?: TrainingPlace | null;
  coach?: Coach | null;
  coaches?: Coach[];
  attendances?: TrainingAttendance[];
};

export type SppPayment = {
  id: number;
  spp_bill_id: number;
  amount: string;
  paid_at: string;
  method: string | null;
  proof_url: string | null;
  notes: string | null;
  created_by: number | null;
  creator?: AdminUser | null;
};

export type SppBill = {
  id: number;
  akademi_id: number;
  student_id: number;
  class_id: number | null;
  billing_year: number;
  billing_month: number;
  amount: string;
  paid_amount: string;
  due_date: string | null;
  status: "unpaid" | "partial" | "paid" | "waived";
  notes: string | null;
  student?: Student | null;
  class?: TrainingClass | null;
  payments?: SppPayment[];
};

export type EvaluationPeriod = {
  id: number;
  akademi_id: number;
  name: string;
  starts_at: string;
  ends_at: string;
  status: "draft" | "active" | "closed";
  notes: string | null;
  scores_count?: number;
  aspects_count?: number;
};

export type EvaluationAspect = {
  id: number;
  akademi_id: number;
  evaluation_period_id: number;
  name: string;
  category: string | null;
  sort_order: number;
  is_active: boolean;
  description: string | null;
};

export type StudentEvaluationScore = {
  id: number;
  akademi_id: number;
  evaluation_period_id: number;
  evaluation_aspect_id: number;
  student_id: number;
  class_id: number | null;
  assessed_by: number | null;
  score: number;
  indicator: "kurang" | "cukup" | "baik" | "sangat_baik";
  notes: string | null;
  student?: Student | null;
  period?: EvaluationPeriod | null;
  aspect?: EvaluationAspect | null;
  assessor?: AdminUser | null;
};

export type RankPromotionParticipant = {
  id: number;
  rank_promotion_event_id: number;
  akademi_id: number;
  student_id: number;
  from_rank_id: number | null;
  to_rank_id: number;
  result: "registered" | "passed" | "failed" | "absent";
  score: number | null;
  notes: string | null;
  assessed_by: number | null;
  student?: Student | null;
  from_rank?: SportRank | null;
  to_rank?: SportRank | null;
  assessor?: AdminUser | null;
  event?: RankPromotionEvent | null;
};

export type RankPromotionEvent = {
  id: number;
  akademi_id: number;
  name: string;
  event_date: string;
  status: "draft" | "completed" | "cancelled";
  notes: string | null;
  created_by: number | null;
  participants_count?: number;
  passed_count?: number;
  participants?: RankPromotionParticipant[];
};

export type StudentDetailSummary = {
  attendance_total: number;
  attendance_present: number;
  spp_unpaid_count: number;
  evaluation_average: number;
};

export type StudentDetailResponse = {
  student: Student;
  summary: StudentDetailSummary;
  attendances: Array<TrainingAttendance & { session?: TrainingSession | null }>;
  spp_bills: SppBill[];
  evaluation_scores: StudentEvaluationScore[];
  rank_promotions: RankPromotionParticipant[];
};

export type AdminAkademiDetailResponse = {
  akademi: AdminAkademi;
  subscription: AdminSubscription | null;
  entitlements: AkademiEntitlements;
};

export type SubscriptionPayload = {
  plan: AkademiPlan;
  duration_type: SubscriptionDuration;
  starts_at?: string | null;
  ends_at?: string | null;
  extra_student_blocks?: number;
  amount?: number;
  payment_status?: SubscriptionPaymentStatus;
  payment_method?: string | null;
  payment_proof_url?: string | null;
  notes?: string | null;
};

export type SubscriptionPaymentPayload = {
  amount?: number;
  subtotal_amount?: number;
  payment_status?: SubscriptionPaymentStatus;
  payment_method?: string | null;
  payment_proof_url?: string | null;
  notes?: string | null;
};

export type AkademiPayload = {
  name: string;
  slug?: string;
  sport_type?: string;
  rank_system?: string | null;
  logo_url?: string | null;
  plan?: AkademiPlan;
  plan_expires_at?: string | null;
  duration_type?: SubscriptionDuration;
  extra_student_blocks?: number;
  payment_status?: SubscriptionPaymentStatus;
  ketua_name: string;
  ketua_email: string;
  ketua_password: string;
  admin_name: string;
  admin_email: string;
  admin_password: string;
};

export type AkademiUpdatePayload = Partial<
  Pick<
    AdminAkademi,
    "name" | "slug" | "sport_type" | "rank_system" | "logo_url" | "status" | "plan" | "plan_expires_at"
  >
>;

type PaginatedResponse<T> = {
  data: T[];
  current_page: number;
  last_page: number;
  total: number;
};

export type AdminEvent = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  description: string | null;
  cover_image_url: string | null;
  location: string | null;
  organizer_name: string | null;
  registration_url: string | null;
  status: "draft" | "published" | "cancelled";
  category: string;
  is_featured: boolean;
  starts_at: string;
  ends_at: string | null;
  published_at: string | null;
  views_count: number;
};

export type EventPayload = {
  title: string;
  slug?: string;
  excerpt?: string;
  description?: string;
  cover_image_url?: string;
  location?: string;
  organizer_name?: string;
  registration_url?: string;
  status: AdminEvent["status"];
  category: string;
  is_featured: boolean;
  starts_at: string;
  ends_at?: string;
  published_at?: string;
};

async function adminFetch<T>(
  path: string,
  token: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${ADMIN_API_URL}${path}`, {
    ...init,
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });

  if (!response.ok) {
    if (response.status === 401) {
      throw new Error("Sesi admin tidak valid. Silakan login ulang.");
    }

    if (response.status === 403) {
      throw new Error("Akses ditolak. Akun ini bukan super admin.");
    }

    let errorMessage = "Request admin gagal.";
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      // ignore json parse error
    }

    throw new Error(errorMessage);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

async function downloadAdminFile(path: string, token: string, filename: string) {
  const response = await fetch(`${ADMIN_API_URL}${path}`, {
    headers: {
      Accept: "text/csv",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    let errorMessage = "Gagal mengunduh laporan.";
    try {
      const errorData = await response.json();
      if (errorData.message) errorMessage = errorData.message;
    } catch {
      // ignore parse error
    }
    throw new Error(errorMessage);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export function getAdminMe(token: string) {
  return adminFetch<{ user: AdminUser }>("/auth/me", token);
}

export function logoutAdmin(token: string) {
  return adminFetch<{ message: string }>("/auth/logout", token, {
    method: "POST",
  });
}

export function getAkademiMe(token: string) {
  return adminFetch<AkademiMeResponse>("/akademi/me", token);
}

export function getAkademiDashboardSummary(token: string) {
  return adminFetch<AkademiDashboardSummary>("/akademi/dashboard/summary", token);
}

export function getAkademiTrainingPlaces(token: string) {
  return adminFetch<{ data: TrainingPlace[] }>("/akademi/training-places", token);
}

export function createAkademiTrainingPlace(
  token: string,
  payload: Pick<TrainingPlace, "name"> & Partial<Pick<TrainingPlace, "address" | "notes" | "is_active">>,
) {
  return adminFetch<{ training_place: TrainingPlace }>("/akademi/training-places", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiTrainingPlace(
  token: string,
  id: number,
  payload: Partial<Pick<TrainingPlace, "name" | "address" | "notes" | "is_active">>,
) {
  return adminFetch<{ training_place: TrainingPlace }>(`/akademi/training-places/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiTrainingPlace(token: string, id: number) {
  return adminFetch<{ message: string }>(`/akademi/training-places/${id}`, token, {
    method: "DELETE",
  });
}

export function getAkademiClasses(token: string) {
  return adminFetch<{ data: TrainingClass[] }>("/akademi/classes", token);
}

export function createAkademiClass(
  token: string,
  payload: {
    name: string;
    training_place_id?: number | null;
    spp_amount_override?: number | null;
    target_sessions_per_month?: number;
    is_active?: boolean;
  },
) {
  return adminFetch<{ training_class: TrainingClass }>("/akademi/classes", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiClass(
  token: string,
  id: number,
  payload: {
    name?: string;
    training_place_id?: number | null;
    spp_amount_override?: number | null;
    target_sessions_per_month?: number;
    is_active?: boolean;
  },
) {
  return adminFetch<{ training_class: TrainingClass }>(`/akademi/classes/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiClass(token: string, id: number) {
  return adminFetch<{ message: string }>(`/akademi/classes/${id}`, token, {
    method: "DELETE",
  });
}

export function getAkademiSportRanks(token: string) {
  return adminFetch<{ data: SportRank[] }>("/akademi/sport-ranks", token);
}

export function createAkademiSportRank(
  token: string,
  payload: SportRankPayload,
) {
  return adminFetch<{ sport_rank: SportRank }>("/akademi/sport-ranks", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiSportRank(
  token: string,
  id: number,
  payload: Partial<SportRankPayload>,
) {
  return adminFetch<{ sport_rank: SportRank }>(`/akademi/sport-ranks/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiSportRank(token: string, id: number) {
  return adminFetch<{ message: string }>(`/akademi/sport-ranks/${id}`, token, {
    method: "DELETE",
  });
}

export function getAkademiStudents(
  token: string,
  filters: {
    search?: string;
    status?: string;
    class_id?: string | number;
    page?: number;
    per_page?: number;
  } = {},
) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.class_id && filters.class_id !== "all") params.set("class_id", String(filters.class_id));
  if (filters.page) params.set("page", String(filters.page));
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return adminFetch<{ data: PaginatedResponse<Student> }>(`/akademi/students${suffix}`, token);
}

export function getAkademiStudentDetail(token: string, id: number) {
  return adminFetch<StudentDetailResponse>(`/akademi/students/${id}`, token);
}

export function createAkademiStudent(
  token: string,
  payload: {
    name: string;
    gender: Student["gender"];
    birth_date: string;
    joined_date: string;
    height_cm: number | null;
    weight_kg: number | null;
    primary_class_id?: number | null;
    current_rank_id?: number | null;
    student_phone?: string | null;
    guardian_name?: string | null;
    guardian_phone?: string | null;
    photo_url?: string | null;
    address?: string | null;
    shirt_size?: string | null;
    school_name?: string | null;
    school_grade?: string | null;
    health_notes?: string | null;
    status?: Student["status"];
  },
) {
  return adminFetch<{ student: Student }>("/akademi/students", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiStudent(
  token: string,
  id: number,
  payload: Partial<{
    name: string;
    gender: Student["gender"];
    birth_date: string;
    joined_date: string;
    height_cm: number | null;
    weight_kg: number | null;
    primary_class_id: number | null;
    current_rank_id: number | null;
    student_phone: string | null;
    guardian_name: string | null;
    guardian_phone: string | null;
    photo_url: string | null;
    address: string | null;
    shirt_size: string | null;
    school_name: string | null;
    school_grade: string | null;
    health_notes: string | null;
    status: Student["status"];
  }>,
) {
  return adminFetch<{ student: Student }>(`/akademi/students/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiStudent(token: string, id: number) {
  return adminFetch<{ message: string }>(`/akademi/students/${id}`, token, {
    method: "DELETE",
  });
}

export function downloadAkademiStudentsExport(
  token: string,
  filters: { search?: string; status?: string; class_id?: string | number } = {},
) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.class_id && filters.class_id !== "all") params.set("class_id", String(filters.class_id));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return downloadAdminFile(`/akademi/exports/students${suffix}`, token, "daftar-siswa.csv");
}

export function getAkademiCoaches(token: string) {
  return adminFetch<{ data: Coach[] }>("/akademi/coaches", token);
}

export function getAkademiUsers(token: string) {
  return adminFetch<{ data: AcademyManagedUser[] }>("/akademi/users", token);
}

export function createAkademiUser(
  token: string,
  payload: {
    name: string;
    email: string;
    password: string;
    role: "ketua_akademi" | "admin_akademi" | "pelatih";
    phone?: string | null;
    rank_label?: string | null;
    license_number?: string | null;
    photo_url?: string | null;
    joined_date?: string | null;
    address?: string | null;
    is_active?: boolean;
    is_coach?: boolean;
  },
) {
  return adminFetch<{ academy_user: AcademyManagedUser }>("/akademi/users", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiUser(
  token: string,
  id: number,
  payload: Partial<{
    name: string;
    email: string;
    password: string;
    role: "ketua_akademi" | "admin_akademi" | "pelatih";
    phone: string | null;
    rank_label: string | null;
    license_number: string | null;
    photo_url: string | null;
    joined_date: string | null;
    address: string | null;
    is_active: boolean;
    is_coach: boolean;
  }>,
) {
  return adminFetch<{ academy_user: AcademyManagedUser }>(`/akademi/users/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiUser(token: string, id: number) {
  return adminFetch<{ message: string }>(`/akademi/users/${id}`, token, {
    method: "DELETE",
  });
}

export function createAkademiCoach(
  token: string,
  payload: {
    name: string;
    email: string;
    password: string;
    phone?: string | null;
    rank_label?: string | null;
    license_number?: string | null;
    joined_date?: string | null;
    address?: string | null;
  },
) {
  return adminFetch<{ coach: Coach }>("/akademi/coaches", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiCoach(
  token: string,
  id: number,
  payload: Partial<{
    name: string;
    email: string;
    password: string;
    phone: string | null;
    rank_label: string | null;
    license_number: string | null;
    joined_date: string | null;
    address: string | null;
    is_active: boolean;
  }>,
) {
  return adminFetch<{ coach: Coach }>(`/akademi/coaches/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiCoach(token: string, id: number) {
  return adminFetch<{ message: string }>(`/akademi/coaches/${id}`, token, {
    method: "DELETE",
  });
}

export function getAkademiTrainingSchedules(token: string) {
  return adminFetch<{ data: TrainingSchedule[] }>("/akademi/training-schedules", token);
}

export function createAkademiTrainingSchedule(
  token: string,
  payload: {
    class_id: number;
    training_place_id?: number | null;
    coach_id?: number | null;
    coach_ids?: number[];
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    is_active?: boolean;
    notes?: string | null;
  },
) {
  return adminFetch<{ training_schedule: TrainingSchedule }>("/akademi/training-schedules", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiTrainingSchedule(
  token: string,
  id: number,
  payload: Partial<{
    class_id: number;
    training_place_id: number | null;
    coach_id: number | null;
    coach_ids: number[];
    day_of_week: number;
    starts_at: string;
    ends_at: string;
    is_active: boolean;
    notes: string | null;
  }>,
) {
  return adminFetch<{ training_schedule: TrainingSchedule }>(`/akademi/training-schedules/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiTrainingSchedule(token: string, id: number) {
  return adminFetch<{ message: string }>(`/akademi/training-schedules/${id}`, token, {
    method: "DELETE",
  });
}

export function getAkademiTrainingSessions(
  token: string,
  filters: { year?: number; month?: number | "all"; class_id?: number | "all"; status?: string; per_page?: number } = {},
) {
  const params = new URLSearchParams();
  if (filters.year) params.set("year", String(filters.year));
  if (filters.month && filters.month !== "all") params.set("month", String(filters.month));
  if (filters.class_id && filters.class_id !== "all") params.set("class_id", String(filters.class_id));
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.per_page) params.set("per_page", String(filters.per_page));
  const suffix = params.toString() ? `?${params.toString()}` : "";

  return adminFetch<{ data: PaginatedResponse<TrainingSession> }>(`/akademi/training-sessions${suffix}`, token);
}

export function getAkademiTrainingSession(token: string, id: number) {
  return adminFetch<{ training_session: TrainingSession }>(`/akademi/training-sessions/${id}`, token);
}

export function createAkademiTrainingSession(
  token: string,
  payload: {
    training_schedule_id?: number | null;
    class_id?: number;
    training_place_id?: number | null;
    coach_id?: number | null;
    coach_ids?: number[];
    session_date: string;
    source_schedule_date?: string | null;
    starts_at?: string;
    ends_at?: string;
    material?: string | null;
    notes?: string | null;
    photo_urls?: string[];
    session_type?: TrainingSession["session_type"];
    status?: TrainingSession["status"];
  },
) {
  return adminFetch<{ training_session: TrainingSession }>("/akademi/training-sessions", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiTrainingSessionAttendance(
  token: string,
  id: number,
  payload: {
    material?: string | null;
    notes?: string | null;
    photo_urls?: string[];
    coach_ids?: number[];
    status?: TrainingSession["status"];
    attendances?: Array<{
      id: number;
      status: TrainingAttendance["status"] | AttendanceStatus;
      notes?: string | null;
    }>;
    extra_participants?: Array<{
      participant_name: string;
      status: TrainingAttendance["status"] | AttendanceStatus;
      notes?: string | null;
    }>;
  },
) {
  return adminFetch<{ training_session: TrainingSession }>(`/akademi/training-sessions/${id}/attendance`, token, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export function getAkademiSppBills(
  token: string,
  filters: { year?: number; month?: number | "all"; status?: string; class_id?: number | "all" } = {},
) {
  const params = new URLSearchParams();
  if (filters.year) params.set("year", String(filters.year));
  if (filters.month && filters.month !== "all") params.set("month", String(filters.month));
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.class_id && filters.class_id !== "all") params.set("class_id", String(filters.class_id));

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return adminFetch<{ data: PaginatedResponse<SppBill> }>(`/akademi/spp-bills${suffix}`, token);
}

export function generateAkademiSppBills(
  token: string,
  payload: {
    billing_year: number;
    billing_month: number;
    default_amount?: number | null;
    due_date?: string | null;
    class_id?: number | null;
  },
) {
  return adminFetch<{ message: string; created: number; skipped: number; missing_amount?: number }>("/akademi/spp-bills/generate", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function payAkademiSppBill(
  token: string,
  billId: number,
  payload: {
    amount: number;
    paid_at: string;
    method?: string | null;
    proof_url?: string | null;
    notes?: string | null;
  },
) {
  return adminFetch<{ spp_bill: SppBill }>(`/akademi/spp-bills/${billId}/payments`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function waiveAkademiSppBill(token: string, billId: number, notes?: string | null) {
  return adminFetch<{ spp_bill: SppBill }>(`/akademi/spp-bills/${billId}/waive`, token, {
    method: "PATCH",
    body: JSON.stringify({ notes }),
  });
}

export function downloadAkademiSppExport(
  token: string,
  filters: { year?: number; month?: number | "all"; status?: string; class_id?: number | "all" } = {},
) {
  const params = new URLSearchParams();
  if (filters.year) params.set("year", String(filters.year));
  if (filters.month && filters.month !== "all") params.set("month", String(filters.month));
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.class_id && filters.class_id !== "all") params.set("class_id", String(filters.class_id));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return downloadAdminFile(`/akademi/exports/spp${suffix}`, token, "rekap-spp.csv");
}

export function getAkademiEvaluationPeriods(token: string) {
  return adminFetch<{ data: EvaluationPeriod[] }>("/akademi/evaluations/periods", token);
}

export function createAkademiEvaluationPeriod(
  token: string,
  payload: {
    name: string;
    starts_at: string;
    ends_at: string;
    status?: EvaluationPeriod["status"];
    notes?: string | null;
  },
) {
  return adminFetch<{ evaluation_period: EvaluationPeriod }>("/akademi/evaluations/periods", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiEvaluationPeriod(
  token: string,
  periodId: number,
  payload: Partial<Pick<EvaluationPeriod, "name" | "starts_at" | "ends_at" | "status" | "notes">>,
) {
  return adminFetch<{ evaluation_period: EvaluationPeriod }>(`/akademi/evaluations/periods/${periodId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function getAkademiEvaluationAspects(token: string, periodId?: number | string) {
  const suffix = periodId ? `?period_id=${periodId}` : "";
  return adminFetch<{ data: EvaluationAspect[] }>(`/akademi/evaluations/aspects${suffix}`, token);
}

export function getAkademiEvaluationPeriodAspects(token: string, periodId: number | string) {
  return adminFetch<{ data: EvaluationAspect[] }>(`/akademi/evaluations/periods/${periodId}/aspects`, token);
}

export function createAkademiEvaluationAspect(
  token: string,
  payload: {
    evaluation_period_id: number;
    name: string;
    category?: string | null;
    sort_order?: number;
    is_active?: boolean;
    description?: string | null;
  },
) {
  return adminFetch<{ evaluation_aspect: EvaluationAspect }>("/akademi/evaluations/aspects", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function createAkademiEvaluationPeriodAspect(
  token: string,
  periodId: number | string,
  payload: {
    name: string;
    category?: string | null;
    sort_order?: number;
    is_active?: boolean;
    description?: string | null;
  },
) {
  return adminFetch<{ evaluation_aspect: EvaluationAspect }>(`/akademi/evaluations/periods/${periodId}/aspects`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiEvaluationAspect(
  token: string,
  aspectId: number,
  payload: Partial<Pick<EvaluationAspect, "name" | "category" | "sort_order" | "is_active" | "description">>,
) {
  return adminFetch<{ evaluation_aspect: EvaluationAspect }>(`/akademi/evaluations/aspects/${aspectId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiEvaluationAspect(token: string, aspectId: number) {
  return adminFetch<{ message: string }>(`/akademi/evaluations/aspects/${aspectId}`, token, {
    method: "DELETE",
  });
}

export function getAkademiEvaluationScores(
  token: string,
  periodId: number,
  filters: { class_id?: number | "all"; student_id?: number } = {},
) {
  const params = new URLSearchParams();
  if (filters.class_id && filters.class_id !== "all") params.set("class_id", String(filters.class_id));
  if (filters.student_id) params.set("student_id", String(filters.student_id));

  const suffix = params.toString() ? `?${params.toString()}` : "";
  return adminFetch<{ data: StudentEvaluationScore[] }>(
    `/akademi/evaluations/periods/${periodId}/scores${suffix}`,
    token,
  );
}

export function upsertAkademiEvaluationScores(
  token: string,
  periodId: number,
  payload: {
    scores: Array<{
      student_id: number;
      evaluation_aspect_id: number;
      class_id?: number | null;
      score: number;
      notes?: string | null;
    }>;
  },
) {
  return adminFetch<{ data: StudentEvaluationScore[] }>(`/akademi/evaluations/periods/${periodId}/scores`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function downloadAkademiEvaluationExport(
  token: string,
  periodId: number,
  filters: { class_id?: number | "all" } = {},
) {
  const params = new URLSearchParams();
  if (filters.class_id && filters.class_id !== "all") params.set("class_id", String(filters.class_id));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return downloadAdminFile(`/akademi/exports/evaluations/${periodId}${suffix}`, token, "rekap-evaluasi.csv");
}

export function getAkademiRankPromotionEvents(token: string) {
  return adminFetch<{ data: RankPromotionEvent[] }>("/akademi/rank-promotions", token);
}

export function createAkademiRankPromotionEvent(
  token: string,
  payload: {
    name: string;
    event_date: string;
    status?: RankPromotionEvent["status"];
    notes?: string | null;
  },
) {
  return adminFetch<{ rank_promotion_event: RankPromotionEvent }>("/akademi/rank-promotions", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAkademiRankPromotionEvent(token: string, eventId: number) {
  return adminFetch<{ rank_promotion_event: RankPromotionEvent }>(`/akademi/rank-promotions/${eventId}`, token);
}

export function updateAkademiRankPromotionEvent(
  token: string,
  eventId: number,
  payload: Partial<Pick<RankPromotionEvent, "name" | "event_date" | "status" | "notes">>,
) {
  return adminFetch<{ rank_promotion_event: RankPromotionEvent }>(`/akademi/rank-promotions/${eventId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function addAkademiRankPromotionParticipant(
  token: string,
  eventId: number,
  payload: {
    student_id: number;
    to_rank_id: number;
    result?: RankPromotionParticipant["result"];
    score?: number | null;
    notes?: string | null;
  },
) {
  return adminFetch<{ rank_promotion_participant: RankPromotionParticipant; warnings?: string[] }>(
    `/akademi/rank-promotions/${eventId}/participants`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateAkademiRankPromotionParticipant(
  token: string,
  eventId: number,
  participantId: number,
  payload: Partial<Pick<RankPromotionParticipant, "to_rank_id" | "result" | "score" | "notes">>,
) {
  return adminFetch<{ rank_promotion_participant: RankPromotionParticipant; warnings?: string[] }>(
    `/akademi/rank-promotions/${eventId}/participants/${participantId}`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export async function getAdminAkademi(
  token: string,
  filters: { search?: string; status?: string; plan?: string } = {},
) {
  const params = new URLSearchParams();
  if (filters.search) params.set("search", filters.search);
  if (filters.status && filters.status !== "all") params.set("status", filters.status);
  if (filters.plan && filters.plan !== "all") params.set("plan", filters.plan);

  const suffix = params.toString() ? `?${params.toString()}` : "";
  const response = await adminFetch<PaginatedResponse<AdminAkademi>>(
    `/super-admin/akademi${suffix}`,
    token,
  );

  return response.data;
}

export function createAdminAkademi(token: string, payload: AkademiPayload) {
  return adminFetch<{ akademi: AdminAkademi }>("/super-admin/akademi", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getAdminAkademiDetail(token: string, akademiId: number) {
  return adminFetch<AdminAkademiDetailResponse>(`/super-admin/akademi/${akademiId}`, token);
}

export function updateAdminAkademi(
  token: string,
  akademiId: number,
  payload: AkademiUpdatePayload,
) {
  return adminFetch<{ akademi: AdminAkademi }>(
    `/super-admin/akademi/${akademiId}`,
    token,
    {
      method: "PUT",
      body: JSON.stringify(payload),
    },
  );
}

export function deleteAdminAkademi(token: string, akademiId: number) {
  return adminFetch<void>(`/super-admin/akademi/${akademiId}`, token, {
    method: "DELETE",
  });
}

export async function getAdminSubscriptions(token: string, akademiId: number) {
  const response = await adminFetch<{ data: AdminSubscription[] }>(
    `/super-admin/akademi/${akademiId}/subscriptions`,
    token,
  );

  return response.data;
}

export function createAdminSubscription(
  token: string,
  akademiId: number,
  payload: SubscriptionPayload,
) {
  return adminFetch<{ subscription: AdminSubscription }>(
    `/super-admin/akademi/${akademiId}/subscriptions`,
    token,
    {
      method: "POST",
      body: JSON.stringify(payload),
    },
  );
}

export function updateAdminSubscriptionPayment(
  token: string,
  akademiId: number,
  subscriptionId: number,
  payload: SubscriptionPaymentPayload,
) {
  return adminFetch<{ subscription: AdminSubscription }>(
    `/super-admin/akademi/${akademiId}/subscriptions/${subscriptionId}/payment`,
    token,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );
}

export function getAdminEvents(token: string) {
  return adminFetch<AdminEvent[]>("/admin/events", token);
}

export function createAdminEvent(token: string, payload: EventPayload) {
  return adminFetch<AdminEvent>("/admin/events", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminEvent(token: string, eventId: number, payload: EventPayload) {
  return adminFetch<AdminEvent>(`/admin/events/${eventId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminEvent(token: string, eventId: number) {
  return adminFetch<void>(`/admin/events/${eventId}`, token, {
    method: "DELETE",
  });
}

export async function uploadAdminImage(token: string, file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${ADMIN_API_URL}/admin/upload/image`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    let msg = "Gagal mengunggah gambar.";
    try {
      const data = await response.json();
      if (data.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }

  return response.json() as Promise<{ url: string }>;
}

export async function uploadAkademiFile(
  token: string,
  file: File,
  purpose: "student_photo" | "coach_photo" | "spp_proof" | "session_photo",
) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("purpose", purpose);

  const response = await fetch(`${ADMIN_API_URL}/akademi/upload/file`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/json",
    },
    body: formData,
  });

  if (!response.ok) {
    let msg = "Gagal mengunggah file.";
    try {
      const data = await response.json();
      if (data.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }

  return response.json() as Promise<{ url: string; path: string }>;
}

export type AdminBlog = {
  id: number;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  thumbnail_url: string | null;
  category: string;
  author_name: string;
  status: "draft" | "published" | "archived";
  meta_title: string | null;
  meta_description: string | null;
  og_image_url: string | null;
  published_at: string | null;
  created_at: string;
  views_count: number;
};

export type BlogPayload = {
  title: string;
  slug?: string;
  excerpt?: string | null;
  content?: string | null;
  thumbnail_url?: string | null;
  category: string;
  author_name: string;
  status: AdminBlog["status"];
  published_at?: string | null;
};

export function getAdminBlogs(token: string) {
  return adminFetch<AdminBlog[]>("/admin/blogs", token);
}

export function createAdminBlog(token: string, payload: BlogPayload) {
  return adminFetch<AdminBlog>("/admin/blogs", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminBlog(token: string, blogId: number, payload: BlogPayload) {
  return adminFetch<AdminBlog>(`/admin/blogs/${blogId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminBlog(token: string, blogId: number) {
  return adminFetch<void>(`/admin/blogs/${blogId}`, token, {
    method: "DELETE",
  });
}

export type AdminTestimonial = {
  id: number;
  akademi_name: string;
  person_name: string;
  city: string | null;
  quote: string;
  avatar_url: string | null;
  sort_order: number | null;
  is_active: boolean;
};

export type TestimonialPayload = Omit<AdminTestimonial, "id">;

export function getAdminTestimonials(token: string) {
  return adminFetch<AdminTestimonial[]>("/admin/testimonials", token);
}

export function createAdminTestimonial(token: string, payload: TestimonialPayload) {
  return adminFetch<AdminTestimonial>("/admin/testimonials", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminTestimonial(
  token: string,
  id: number,
  payload: TestimonialPayload
) {
  return adminFetch<AdminTestimonial>(`/admin/testimonials/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminTestimonial(token: string, id: number) {
  return adminFetch<void>(`/admin/testimonials/${id}`, token, {
    method: "DELETE",
  });
}

export type AdminFaq = {
  id: number;
  question: string;
  answer: string;
  sort_order: number | null;
  is_active: boolean;
};

export type FaqPayload = Omit<AdminFaq, "id">;

export function getAdminFaqs(token: string) {
  return adminFetch<AdminFaq[]>("/admin/faqs", token);
}

export function createAdminFaq(token: string, payload: FaqPayload) {
  return adminFetch<AdminFaq>("/admin/faqs", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAdminFaq(token: string, id: number, payload: FaqPayload) {
  return adminFetch<AdminFaq>(`/admin/faqs/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminFaq(token: string, id: number) {
  return adminFetch<void>(`/admin/faqs/${id}`, token, {
    method: "DELETE",
  });
}

export type AdminInquiry = {
  id: number;
  akademi_name: string | null;
  person_name: string;
  phone: string;
  city: string | null;
  plan_interest: "starter" | "pro" | "scale" | "konsultasi" | null;
  message: string | null;
  source_page: string | null;
  is_followed_up: boolean;
  created_at: string;
  updated_at: string;
};

export type InquiryPayload = Pick<AdminInquiry, "is_followed_up">;

export function getAdminInquiries(token: string) {
  return adminFetch<AdminInquiry[]>("/admin/inquiries", token);
}

export function updateAdminInquiry(
  token: string,
  id: number,
  payload: InquiryPayload,
) {
  return adminFetch<AdminInquiry>(`/admin/inquiries/${id}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAdminInquiry(token: string, id: number) {
  return adminFetch<void>(`/admin/inquiries/${id}`, token, {
    method: "DELETE",
  });
}

export type SiteSettings = Record<string, string>;

export function getAdminSettings(token: string) {
  return adminFetch<SiteSettings>("/admin/settings", token);
}

export function upsertAdminSetting(token: string, key: string, value: string) {
  return adminFetch<{ key: string; value: string }>("/admin/settings", token, {
    method: "POST",
    body: JSON.stringify({ key, value }),
  });
}

export function deleteAdminSetting(token: string, key: string) {
  return adminFetch<void>(`/admin/settings/${encodeURIComponent(key)}`, token, {
    method: "DELETE",
  });
}

export type SubscriptionAlert = {
  subscription_id: number;
  akademi_id: number;
  akademi_name: string | null;
  akademi_slug: string | null;
  plan: AkademiPlan;
  ends_at: string;
  days_left?: number;
  status: SubscriptionStatus;
  amount?: string;
  payment_method?: string | null;
};

export type SubscriptionAlertsResponse = {
  expiring_soon: SubscriptionAlert[];
  unpaid: SubscriptionAlert[];
  summary: {
    expiring_soon_count: number;
    unpaid_count: number;
  };
};

export function getAdminSubscriptionAlerts(token: string) {
  return adminFetch<SubscriptionAlertsResponse>(
    "/super-admin/subscriptions/alerts",
    token,
  );
}

// ─── Public Profile ───────────────────────────────────────────────────────────

export type PublicProfileCoach = {
  id: number;
  name: string;
  rank_label: string | null;
  photo_url: string | null;
  show_on_public: boolean;
};

export type GalleryItem = {
  id: number;
  akademi_id: number;
  image_url: string;
  caption: string | null;
  show_on_about: boolean;
  sort_order: number;
};

export type HeroImage = {
  id: number;
  akademi_id: number;
  image_url: string;
  caption: string | null;
  focal_x: number;
  focal_y: number;
  pan_x: number;
  pan_y: number;
  zoom: number;
  sort_order: number;
  is_active: boolean;
};

export type PublicAchievement = {
  id: number;
  akademi_id: number;
  title: string;
  description: string | null;
  achieved_on: string | null;
  sort_order: number;
};

export type PublicOfficial = {
  id: number;
  akademi_id: number;
  name: string;
  position: string;
  photo_url: string | null;
  description: string | null;
  sort_order: number;
  is_active: boolean;
};

export type AcademyPublicProfile = {
  id: number | null;
  akademi_id: number;
  about: string | null;
  vision: string | null;
  mission: string | null;
  public_schedule: string | null;
  whatsapp: string | null;
  cta_label: string | null;
  is_published: boolean;
  primary_color: string | null;
  button_color: string | null;
  background_color: string | null;
  text_color: string | null;
  heading_font: string | null;
  body_font: string | null;
  button_radius: number | null;
  hero_images: HeroImage[];
  gallery_items: GalleryItem[];
  achievements: PublicAchievement[];
  officials: PublicOfficial[];
};

export type PublicProfileResponse = {
  profile: AcademyPublicProfile | null;
  coaches: PublicProfileCoach[];
};

export function getAkademiPublicProfile(token: string) {
  return adminFetch<PublicProfileResponse>("/akademi/public-profile", token);
}

export function updateAkademiPublicProfile(
  token: string,
  payload: Partial<Pick<
    AcademyPublicProfile,
    | "about"
    | "vision"
    | "mission"
    | "public_schedule"
    | "whatsapp"
    | "cta_label"
    | "is_published"
    | "primary_color"
    | "button_color"
    | "background_color"
    | "text_color"
    | "heading_font"
    | "body_font"
    | "button_radius"
  >>,
) {
  return adminFetch<{ profile: AcademyPublicProfile }>("/akademi/public-profile", token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function addAkademiGalleryItem(
  token: string,
  payload: { image_url: string; caption?: string | null; show_on_about?: boolean; sort_order?: number },
) {
  return adminFetch<{ item: GalleryItem }>("/akademi/public-profile/gallery", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiGalleryItem(
  token: string,
  itemId: number,
  payload: Partial<{ caption: string | null; show_on_about: boolean; sort_order: number }>,
) {
  return adminFetch<{ item: GalleryItem }>(`/akademi/public-profile/gallery/${itemId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiGalleryItem(token: string, itemId: number) {
  return adminFetch<{ message: string }>(`/akademi/public-profile/gallery/${itemId}`, token, {
    method: "DELETE",
  });
}

export function addAkademiHeroImage(
  token: string,
  payload: {
    image_url: string;
    caption?: string | null;
    focal_x?: number;
    focal_y?: number;
    pan_x?: number;
    pan_y?: number;
    zoom?: number;
    sort_order?: number;
    is_active?: boolean;
  },
) {
  return adminFetch<{ item: HeroImage }>("/akademi/public-profile/hero-images", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiHeroImage(
  token: string,
  itemId: number,
  payload: Partial<{
    caption: string | null;
    focal_x: number;
    focal_y: number;
    pan_x: number;
    pan_y: number;
    zoom: number;
    sort_order: number;
    is_active: boolean;
  }>,
) {
  return adminFetch<{ item: HeroImage }>(`/akademi/public-profile/hero-images/${itemId}`, token, {
    method: "PUT",
    body: JSON.stringify(payload),
  });
}

export function deleteAkademiHeroImage(token: string, itemId: number) {
  return adminFetch<{ message: string }>(`/akademi/public-profile/hero-images/${itemId}`, token, {
    method: "DELETE",
  });
}

export function addAkademiPublicAchievement(
  token: string,
  payload: { title: string; description?: string | null; achieved_on?: string | null; sort_order?: number },
) {
  return adminFetch<{ achievement: PublicAchievement }>("/akademi/public-profile/achievements", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiPublicAchievement(
  token: string,
  achievementId: number,
  payload: Partial<{ title: string; description: string | null; achieved_on: string | null; sort_order: number }>,
) {
  return adminFetch<{ achievement: PublicAchievement }>(
    `/akademi/public-profile/achievements/${achievementId}`,
    token,
    { method: "PUT", body: JSON.stringify(payload) },
  );
}

export function deleteAkademiPublicAchievement(token: string, achievementId: number) {
  return adminFetch<{ message: string }>(
    `/akademi/public-profile/achievements/${achievementId}`,
    token,
    { method: "DELETE" },
  );
}

export function addAkademiPublicOfficial(
  token: string,
  payload: {
    name: string;
    position: string;
    photo_url?: string | null;
    description?: string | null;
    sort_order?: number;
    is_active?: boolean;
  },
) {
  return adminFetch<{ official: PublicOfficial }>("/akademi/public-profile/officials", token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiPublicOfficial(
  token: string,
  officialId: number,
  payload: Partial<{
    name: string;
    position: string;
    photo_url: string | null;
    description: string | null;
    sort_order: number;
    is_active: boolean;
  }>,
) {
  return adminFetch<{ official: PublicOfficial }>(
    `/akademi/public-profile/officials/${officialId}`,
    token,
    { method: "PUT", body: JSON.stringify(payload) },
  );
}

export function deleteAkademiPublicOfficial(token: string, officialId: number) {
  return adminFetch<{ message: string }>(
    `/akademi/public-profile/officials/${officialId}`,
    token,
    { method: "DELETE" },
  );
}

export function updateAkademiCoachVisibility(
  token: string,
  coachProfileId: number,
  showOnPublic: boolean,
) {
  return adminFetch<{ message: string }>("/akademi/public-profile/coaches/visibility", token, {
    method: "PATCH",
    body: JSON.stringify({ coach_profile_id: coachProfileId, show_on_public: showOnPublic }),
  });
}

// L3-B
export type AttendanceStatus = "present" | "excused" | "sick" | "absent";

// L3-C
export type StudentRankHistory = {
  id: number;
  akademi_id: number;
  student_id: number;
  sport_rank_id: number;
  achieved_on: string;
  source_type: "manual" | "promotion_event";
  rank_promotion_participant_id: number | null;
  notes: string | null;
  // Relasi changedBy di-serialize Laravel ke key yang sama dengan kolom FK-nya.
  changed_by: Pick<AdminUser, "id" | "name"> | null;
  sport_rank?: SportRank | null;
  promotion_participant?: (RankPromotionParticipant & { event?: RankPromotionEvent | null }) | null;
  created_at: string;
  updated_at: string;
};

export type StudentAchievement = {
  id: number;
  akademi_id: number;
  student_id: number;
  title: string;
  event_name: string | null;
  achieved_on: string | null;
  result_label: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

export type StudentAchievementPayload = {
  title: string;
  event_name: string | null;
  achieved_on: string | null;
  result_label: string | null;
  notes: string | null;
};

export function getAkademiStudentRankHistories(token: string, studentId: number) {
  return adminFetch<{ data: StudentRankHistory[] }>(`/akademi/students/${studentId}/rank-histories`, token);
}

export function getAkademiStudentAchievements(token: string, studentId: number) {
  return adminFetch<{ data: StudentAchievement[] }>(`/akademi/students/${studentId}/achievements`, token);
}

export function createAkademiStudentAchievement(
  token: string,
  studentId: number,
  payload: StudentAchievementPayload,
) {
  return adminFetch<{ student_achievement: StudentAchievement }>(`/akademi/students/${studentId}/achievements`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function updateAkademiStudentAchievement(
  token: string,
  studentId: number,
  achievementId: number,
  payload: Partial<StudentAchievementPayload>,
) {
  return adminFetch<{ student_achievement: StudentAchievement }>(
    `/akademi/students/${studentId}/achievements/${achievementId}`,
    token,
    { method: "PUT", body: JSON.stringify(payload) },
  );
}

export function deleteAkademiStudentAchievement(token: string, studentId: number, achievementId: number) {
  return adminFetch<{ message: string }>(`/akademi/students/${studentId}/achievements/${achievementId}`, token, {
    method: "DELETE",
  });
}

// L4-D
export type SubscriptionLifecycleState = "active" | "expiring" | "grace" | "read_only";

export type AkademiSubscriptionStatusResponse = AkademiMeResponse & {
  subscription_state: SubscriptionLifecycleState;
  days_left: number;
  subscription_ends_at: string | null;
  effective_student_limit: number;
  active_students: number;
};

export function getAkademiSubscriptionStatus(token: string) {
  return adminFetch<AkademiSubscriptionStatusResponse>("/akademi/me", token);
}

export type OperatorDashboardAttention = {
  akademi_id: number;
  akademi_name: string;
  akademi_slug: string;
  plan: AkademiPlan;
  state: SubscriptionLifecycleState;
  days_left: number;
  ends_at: string | null;
  active_students: number;
  student_limit: number;
};

export type OperatorDashboardQuota = {
  akademi_id: number;
  akademi_name: string;
  akademi_slug: string;
  plan: AkademiPlan;
  active_students: number;
  student_limit: number;
  usage_percent: number;
};

export type OperatorDashboard = {
  mrr: number;
  state_counts: Record<SubscriptionLifecycleState, number>;
  attention: OperatorDashboardAttention[];
  near_quota: OperatorDashboardQuota[];
};

export function getOperatorDashboard(token: string) {
  return adminFetch<OperatorDashboard>("/super-admin/dashboard", token);
}

// L4-E
export function copyAkademiEvaluationAspects(token: string, periodId: number, sourcePeriodId: number) {
  return adminFetch<{ data: EvaluationAspect[]; copied_count: number }>(
    `/akademi/evaluations/periods/${periodId}/aspects/copy-from/${sourcePeriodId}`,
    token,
    { method: "POST" },
  );
}

// L4-A
export type TodaySlotStatus = "not_opened" | TrainingSession["status"];

export type LinkedTrainingSession = {
  id: number;
  session_date: string;
  starts_at: string;
};

export type TodaySlot = {
  key: string;
  date: string;
  training_schedule_id: number | null;
  session_id: number | null;
  class_id: number;
  class_name: string | null;
  place_name: string | null;
  starts_at: string;
  ends_at: string;
  coach_ids: number[];
  coach_names: string[];
  status: TodaySlotStatus;
  session_type: TrainingSession["session_type"];
  attendances_count: number;
  present_count: number;
  reschedule_reason: string | null;
  cancel_reason: string | null;
  rescheduled_to: LinkedTrainingSession | null;
  rescheduled_from: LinkedTrainingSession | null;
};

export type TodaySlotsResponse = {
  date: string;
  coach_backfill_days: number;
  data: TodaySlot[];
};

export function getAkademiTodaySessions(token: string, date?: string) {
  const suffix = date ? `?date=${encodeURIComponent(date)}` : "";
  return adminFetch<TodaySlotsResponse>(`/akademi/sessions/today${suffix}`, token);
}

export function openAkademiSessionFromSchedule(token: string, trainingScheduleId: number, date: string) {
  return adminFetch<{ training_session: TrainingSession }>("/akademi/training-sessions/from-schedule", token, {
    method: "POST",
    body: JSON.stringify({ training_schedule_id: trainingScheduleId, date }),
  });
}

export function rescheduleAkademiTrainingSession(
  token: string,
  id: number,
  payload: { date: string; starts_at: string; ends_at: string; reason: string },
) {
  return adminFetch<{ training_session: TrainingSession }>(`/akademi/training-sessions/${id}/reschedule`, token, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function cancelAkademiTrainingSession(token: string, id: number, reason: string) {
  return adminFetch<{ training_session: TrainingSession }>(`/akademi/training-sessions/${id}/cancel`, token, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function updateAkademiTrainingSessionCoaches(token: string, id: number, coachIds: number[]) {
  return adminFetch<{ training_session: TrainingSession }>(`/akademi/training-sessions/${id}`, token, {
    method: "PUT",
    body: JSON.stringify({ coach_ids: coachIds }),
  });
}
// end L4-A
