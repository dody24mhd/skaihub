<?php

namespace App\Services\Demo;

use App\Models\User;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Storage;

/**
 * Menghapus permanen SATU akademi demo beserta seluruh datanya (anak lebih dulu).
 * Dipakai oleh demo:clone-karate --fresh untuk akademi tujuan saja.
 */
class AcademyPurger
{
    public function purge(int $akademiId): void
    {
        $userIds = DB::table('users')->where('akademi_id', $akademiId)->pluck('id');
        $sessionIds = DB::table('training_sessions')->where('akademi_id', $akademiId)->pluck('id');
        $scheduleIds = DB::table('training_schedules')->where('akademi_id', $akademiId)->pluck('id');

        DB::table('student_rank_histories')->where('akademi_id', $akademiId)->delete();
        DB::table('rank_promotion_participants')->where('akademi_id', $akademiId)->delete();
        DB::table('rank_promotion_events')->where('akademi_id', $akademiId)->delete();
        DB::table('student_evaluation_scores')->where('akademi_id', $akademiId)->delete();
        DB::table('evaluation_aspects')->where('akademi_id', $akademiId)->delete();
        DB::table('evaluation_periods')->where('akademi_id', $akademiId)->delete();
        DB::table('spp_bill_events')->where('akademi_id', $akademiId)->delete();
        DB::table('spp_payments')->where('akademi_id', $akademiId)->delete();
        DB::table('spp_bills')->where('akademi_id', $akademiId)->delete();
        DB::table('academy_spp_settings')->where('akademi_id', $akademiId)->delete();
        DB::table('training_attendances')->whereIn('training_session_id', $sessionIds)->delete();
        DB::table('training_session_coaches')->whereIn('training_session_id', $sessionIds)->delete();
        DB::table('training_sessions')->where('akademi_id', $akademiId)
            ->update(['rescheduled_to_id' => null, 'rescheduled_from_id' => null]);
        DB::table('training_sessions')->where('akademi_id', $akademiId)->delete();
        DB::table('training_schedule_coaches')->whereIn('training_schedule_id', $scheduleIds)->delete();
        DB::table('training_schedules')->where('akademi_id', $akademiId)->delete();
        DB::table('student_achievements')->where('akademi_id', $akademiId)->delete();
        DB::table('students')->where('akademi_id', $akademiId)->delete();
        DB::table('classes')->where('akademi_id', $akademiId)->delete();
        DB::table('training_places')->where('akademi_id', $akademiId)->delete();
        DB::table('coach_profiles')->where('akademi_id', $akademiId)->delete();
        DB::table('sport_ranks')->where('akademi_id', $akademiId)->delete();
        DB::table('subscriptions')->where('akademi_id', $akademiId)->delete();
        DB::table('academy_public_hero_images')->where('akademi_id', $akademiId)->delete();
        DB::table('academy_gallery_items')->where('akademi_id', $akademiId)->delete();
        DB::table('academy_public_achievements')->where('akademi_id', $akademiId)->delete();
        DB::table('academy_public_officials')->where('akademi_id', $akademiId)->delete();
        DB::table('academy_public_profiles')->where('akademi_id', $akademiId)->delete();
        DB::table('personal_access_tokens')->where('tokenable_type', User::class)
            ->whereIn('tokenable_id', $userIds)->delete();
        DB::table('users')->whereIn('id', $userIds)->delete();
        DB::table('akademi')->where('id', $akademiId)->delete();
    }

    public function purgeFiles(int $akademiId, string $disk = 'public'): void
    {
        $storage = Storage::disk($disk);
        $storage->deleteDirectory(AcademyCloner::publicProfileDirectory($akademiId));

        // Folder induk akademi ikut dihapus hanya jika sudah kosong.
        $root = "akademi/{$akademiId}";
        if ($storage->allFiles($root) === [] && $storage->allDirectories($root) === []) {
            $storage->deleteDirectory($root);
        }
    }
}
