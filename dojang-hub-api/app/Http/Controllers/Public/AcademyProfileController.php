<?php

namespace App\Http\Controllers\Public;

use App\Http\Controllers\Controller;
use App\Models\Akademi;
use App\Models\CoachProfile;
use Illuminate\Http\JsonResponse;

class AcademyProfileController extends Controller
{
    public function show(string $slug): JsonResponse
    {
        $akademi = Akademi::where('slug', $slug)
            ->where('status', 'active')
            ->first();

        if (! $akademi) {
            return response()->json(['message' => 'Akademi tidak ditemukan.'], 404);
        }

        if (! $akademi->hasPublicWebsite()) {
            return response()->json(['message' => 'Halaman publik tidak tersedia untuk paket ini.'], 404);
        }

        $profile = $akademi->publicProfile;

        if (! $profile || ! $profile->is_published) {
            return response()->json(['message' => 'Halaman publik belum dipublikasikan.'], 404);
        }

        $coaches = CoachProfile::with('user')
            ->where('akademi_id', $akademi->id)
            ->where('show_on_public', true)
            ->where('status', 'active')
            ->get()
            ->map(fn ($coach) => [
                'name' => $coach->user->name,
                'rank_label' => $coach->rank_label,
                'photo_url' => $coach->photo_url,
            ]);

        $places = $akademi->trainingPlaces()
            ->where('is_active', true)
            ->get(['name', 'address']);

        $gallery = $akademi->galleryItems()
            ->get(['image_url', 'caption', 'show_on_about', 'sort_order']);

        $heroImages = $akademi->publicHeroImages()
            ->where('is_active', true)
            ->get(['image_url', 'caption', 'focal_x', 'focal_y', 'pan_x', 'pan_y', 'zoom', 'sort_order']);

        $achievements = $akademi->publicAchievements()
            ->get(['title', 'description', 'achieved_on', 'sort_order']);

        $officials = $akademi->publicOfficials()
            ->where('is_active', true)
            ->get(['name', 'position', 'photo_url', 'description', 'sort_order']);

        return response()->json([
            'akademi' => [
                'name' => $akademi->name,
                'slug' => $akademi->slug,
                'sport_type' => $akademi->sport_type,
                'logo_url' => $akademi->logo_url,
            ],
            'profile' => [
                'about' => $profile->about,
                'vision' => $profile->vision,
                'mission' => $profile->mission,
                'public_schedule' => $profile->public_schedule,
                'whatsapp' => $profile->whatsapp,
                'cta_label' => $profile->cta_label,
                'primary_color' => $profile->primary_color,
                'button_color' => $profile->button_color,
                'background_color' => $profile->background_color,
                'text_color' => $profile->text_color,
                'heading_font' => $profile->heading_font,
                'body_font' => $profile->body_font,
                'button_radius' => $profile->button_radius,
            ],
            'coaches' => $coaches,
            'places' => $places,
            'hero_images' => $heroImages,
            'gallery' => $gallery,
            'achievements' => $achievements,
            'officials' => $officials,
        ]);
    }
}
