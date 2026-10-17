<?php

namespace App\Http\Controllers\Akademi;

use App\Http\Controllers\Controller;
use App\Models\AcademyGalleryItem;
use App\Models\AcademyPublicAchievement;
use App\Models\AcademyPublicHeroImage;
use App\Models\AcademyPublicOfficial;
use App\Models\AcademyPublicProfile;
use App\Models\CoachProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PublicProfileController extends Controller
{
    public function show(Request $request): JsonResponse
    {
        $akademiId = $request->user()->akademi_id;

        $profile = AcademyPublicProfile::with(['galleryItems', 'heroImages', 'achievements', 'officials'])
            ->where('akademi_id', $akademiId)
            ->first();

        $coaches = CoachProfile::with('user')
            ->where('akademi_id', $akademiId)
            ->get()
            ->map(fn ($coach) => [
                'id' => $coach->id,
                'name' => $coach->user->name,
                'rank_label' => $coach->rank_label,
                'photo_url' => $coach->photo_url,
                'show_on_public' => $coach->show_on_public,
            ]);

        return response()->json([
            'profile' => $profile,
            'coaches' => $coaches,
        ]);
    }

    public function updateProfile(Request $request): JsonResponse
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'about' => ['nullable', 'string', 'max:2000'],
            'vision' => ['nullable', 'string', 'max:2000'],
            'mission' => ['nullable', 'string', 'max:2000'],
            'public_schedule' => ['nullable', 'string', 'max:2000'],
            'whatsapp' => ['nullable', 'string', 'max:30', 'regex:/^[0-9]+$/'],
            'cta_label' => ['nullable', 'string', 'max:80'],
            'is_published' => ['sometimes', 'boolean'],
            'primary_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'button_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'background_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'text_color' => ['nullable', 'string', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'heading_font' => ['nullable', 'string', 'max:80'],
            'body_font' => ['nullable', 'string', 'max:80'],
            'button_radius' => ['nullable', 'integer', 'min:0', 'max:32'],
        ]);

        $profile = AcademyPublicProfile::updateOrCreate(
            ['akademi_id' => $request->user()->akademi_id],
            $data
        );

        return response()->json(['profile' => $profile->load(['galleryItems', 'heroImages', 'achievements', 'officials'])]);
    }

    public function storeGallery(Request $request): JsonResponse
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'image_url' => ['required', 'url', 'max:500'],
            'caption' => ['nullable', 'string', 'max:255'],
            'show_on_about' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $item = AcademyGalleryItem::create([
            'akademi_id' => $request->user()->akademi_id,
            ...$data,
        ]);

        return response()->json(['item' => $item], 201);
    }

    public function updateGallery(Request $request, AcademyGalleryItem $galleryItem): JsonResponse
    {
        $this->ensureCanManage($request);

        abort_unless(
            $galleryItem->akademi_id === $request->user()->akademi_id,
            404,
            'Item tidak ditemukan.'
        );

        $data = $request->validate([
            'caption' => ['nullable', 'string', 'max:255'],
            'show_on_about' => ['sometimes', 'boolean'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $galleryItem->update($data);

        return response()->json(['item' => $galleryItem->fresh()]);
    }

    public function destroyGallery(Request $request, AcademyGalleryItem $galleryItem): JsonResponse
    {
        $this->ensureCanManage($request);

        abort_unless(
            $galleryItem->akademi_id === $request->user()->akademi_id,
            404,
            'Item tidak ditemukan.'
        );

        $galleryItem->delete();

        return response()->json(['message' => 'Foto berhasil dihapus.']);
    }

    public function storeHeroImage(Request $request): JsonResponse
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'image_url' => ['required', 'url', 'max:500'],
            'caption' => ['nullable', 'string', 'max:255'],
            'focal_x' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'focal_y' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'pan_x' => ['sometimes', 'integer', 'min:-100', 'max:100'],
            'pan_y' => ['sometimes', 'integer', 'min:-100', 'max:100'],
            'zoom' => ['sometimes', 'integer', 'min:100', 'max:200'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $item = AcademyPublicHeroImage::create([
            'akademi_id' => $request->user()->akademi_id,
            ...$data,
        ]);

        return response()->json(['item' => $item], 201);
    }

    public function updateHeroImage(Request $request, AcademyPublicHeroImage $heroImage): JsonResponse
    {
        $this->ensureCanManage($request);

        abort_unless(
            $heroImage->akademi_id === $request->user()->akademi_id,
            404,
            'Hero image tidak ditemukan.'
        );

        $data = $request->validate([
            'caption' => ['nullable', 'string', 'max:255'],
            'focal_x' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'focal_y' => ['sometimes', 'integer', 'min:0', 'max:100'],
            'pan_x' => ['sometimes', 'integer', 'min:-100', 'max:100'],
            'pan_y' => ['sometimes', 'integer', 'min:-100', 'max:100'],
            'zoom' => ['sometimes', 'integer', 'min:100', 'max:200'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $heroImage->update($data);

        return response()->json(['item' => $heroImage->fresh()]);
    }

    public function destroyHeroImage(Request $request, AcademyPublicHeroImage $heroImage): JsonResponse
    {
        $this->ensureCanManage($request);

        abort_unless(
            $heroImage->akademi_id === $request->user()->akademi_id,
            404,
            'Hero image tidak ditemukan.'
        );

        $heroImage->delete();

        return response()->json(['message' => 'Hero image berhasil dihapus.']);
    }

    public function storeAchievement(Request $request): JsonResponse
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'achieved_on' => ['nullable', 'date'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $achievement = AcademyPublicAchievement::create([
            'akademi_id' => $request->user()->akademi_id,
            ...$data,
        ]);

        return response()->json(['achievement' => $achievement], 201);
    }

    public function updateAchievement(Request $request, AcademyPublicAchievement $achievement): JsonResponse
    {
        $this->ensureCanManage($request);

        abort_unless(
            $achievement->akademi_id === $request->user()->akademi_id,
            404,
            'Prestasi tidak ditemukan.'
        );

        $data = $request->validate([
            'title' => ['sometimes', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'achieved_on' => ['nullable', 'date'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
        ]);

        $achievement->update($data);

        return response()->json(['achievement' => $achievement->fresh()]);
    }

    public function destroyAchievement(Request $request, AcademyPublicAchievement $achievement): JsonResponse
    {
        $this->ensureCanManage($request);

        abort_unless(
            $achievement->akademi_id === $request->user()->akademi_id,
            404,
            'Prestasi tidak ditemukan.'
        );

        $achievement->delete();

        return response()->json(['message' => 'Prestasi berhasil dihapus.']);
    }

    public function storeOfficial(Request $request): JsonResponse
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'position' => ['required', 'string', 'max:255'],
            'photo_url' => ['nullable', 'url', 'max:500'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $official = AcademyPublicOfficial::create([
            'akademi_id' => $request->user()->akademi_id,
            ...$data,
        ]);

        return response()->json(['official' => $official], 201);
    }

    public function updateOfficial(Request $request, AcademyPublicOfficial $official): JsonResponse
    {
        $this->ensureCanManage($request);

        abort_unless(
            $official->akademi_id === $request->user()->akademi_id,
            404,
            'Pengurus tidak ditemukan.'
        );

        $data = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'position' => ['sometimes', 'string', 'max:255'],
            'photo_url' => ['nullable', 'url', 'max:500'],
            'description' => ['nullable', 'string', 'max:1000'],
            'sort_order' => ['sometimes', 'integer', 'min:0'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $official->update($data);

        return response()->json(['official' => $official->fresh()]);
    }

    public function destroyOfficial(Request $request, AcademyPublicOfficial $official): JsonResponse
    {
        $this->ensureCanManage($request);

        abort_unless(
            $official->akademi_id === $request->user()->akademi_id,
            404,
            'Pengurus tidak ditemukan.'
        );

        $official->delete();

        return response()->json(['message' => 'Pengurus berhasil dihapus.']);
    }

    public function updateCoachVisibility(Request $request): JsonResponse
    {
        $this->ensureCanManage($request);

        $data = $request->validate([
            'coach_profile_id' => ['required', 'integer'],
            'show_on_public' => ['required', 'boolean'],
        ]);

        $updated = CoachProfile::where('id', $data['coach_profile_id'])
            ->where('akademi_id', $request->user()->akademi_id)
            ->update(['show_on_public' => $data['show_on_public']]);

        abort_unless($updated > 0, 404, 'Profil pelatih tidak ditemukan.');

        return response()->json(['message' => 'Visibilitas pelatih diperbarui.']);
    }

    private function ensureCanManage(Request $request): void
    {
        abort_unless(
            in_array($request->user()->role, ['ketua_akademi', 'admin_akademi'], true),
            403,
            'Akses ditolak.'
        );
    }
}
