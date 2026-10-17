<?php

use App\Http\Controllers\Admin\BlogController as AdminBlogController;
use App\Http\Controllers\Admin\EventController as AdminEventController;
use App\Http\Controllers\Admin\FaqController as AdminFaqController;
use App\Http\Controllers\Admin\InquiryController as AdminInquiryController;
use App\Http\Controllers\Admin\SiteSettingController as AdminSiteSettingController;
use App\Http\Controllers\Admin\TestimonialController as AdminTestimonialController;
use App\Http\Controllers\Admin\UploadController;
use App\Http\Controllers\Akademi\CoachController as AkademiCoachController;
use App\Http\Controllers\Akademi\DashboardController as AkademiDashboardController;
use App\Http\Controllers\Akademi\EvaluationController as AkademiEvaluationController;
use App\Http\Controllers\Akademi\ExportController as AkademiExportController;
use App\Http\Controllers\Akademi\ProfileController as AkademiProfileController;
use App\Http\Controllers\Akademi\PublicProfileController as AkademiPublicProfileController;
use App\Http\Controllers\Akademi\RankPromotionController as AkademiRankPromotionController;
use App\Http\Controllers\Akademi\SportRankController as AkademiSportRankController;
use App\Http\Controllers\Akademi\SppBillController as AkademiSppBillController;
use App\Http\Controllers\Akademi\StudentController as AkademiStudentController;
use App\Http\Controllers\Akademi\TrainingClassController as AkademiTrainingClassController;
use App\Http\Controllers\Akademi\TrainingPlaceController as AkademiTrainingPlaceController;
use App\Http\Controllers\Akademi\TrainingScheduleController as AkademiTrainingScheduleController;
use App\Http\Controllers\Akademi\TrainingSessionController as AkademiTrainingSessionController;
use App\Http\Controllers\Akademi\UploadController as AkademiUploadController;
use App\Http\Controllers\Akademi\UserController as AkademiUserController;
use App\Http\Controllers\Auth\AuthController;
use App\Http\Controllers\Compro\BlogController;
use App\Http\Controllers\Compro\EventController;
use App\Http\Controllers\Compro\FaqController;
use App\Http\Controllers\Compro\InquiryController;
use App\Http\Controllers\Compro\SiteSettingController;
use App\Http\Controllers\Compro\TestimonialController;
use App\Http\Controllers\Public\AcademyProfileController as PublicAcademyProfileController;
use App\Http\Controllers\SuperAdmin\AkademiController as SuperAdminAkademiController;
use App\Http\Controllers\SuperAdmin\SubscriptionAlertController as SuperAdminSubscriptionAlertController;
use App\Http\Controllers\SuperAdmin\SubscriptionController as SuperAdminSubscriptionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| is assigned the "api" middleware group. Enjoy building your API!
|
*/

Route::prefix('auth')->group(function () {
    Route::post('login', [AuthController::class, 'login'])->middleware('throttle:login');
    Route::middleware('auth:sanctum')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
});

Route::prefix('super-admin')
    ->middleware(['auth:sanctum', 'super.admin'])
    ->group(function () {
        Route::apiResource('akademi', SuperAdminAkademiController::class);
        Route::get('akademi/{akademi}/subscriptions', [SuperAdminSubscriptionController::class, 'index']);
        Route::post('akademi/{akademi}/subscriptions', [SuperAdminSubscriptionController::class, 'store']);
        Route::patch('akademi/{akademi}/subscriptions/{subscription}/payment', [SuperAdminSubscriptionController::class, 'updatePayment']);
        Route::get('subscriptions/alerts', [SuperAdminSubscriptionAlertController::class, 'alerts']);
    });

Route::prefix('public')->group(function () {
    Route::get('akademi/{slug}', [PublicAcademyProfileController::class, 'show']);
});

Route::prefix('compro')->group(function () {
    Route::get('testimonials', [TestimonialController::class, 'index']);
    Route::get('faqs', [FaqController::class, 'index']);
    Route::get('blog', [BlogController::class, 'index']);
    Route::get('blog/{slug}', [BlogController::class, 'show']);
    Route::post('blog/{slug}/view', [BlogController::class, 'incrementView'])->middleware('throttle:public-views');
    Route::get('events', [EventController::class, 'index']);
    Route::get('events/{slug}', [EventController::class, 'show']);
    Route::post('events/{slug}/view', [EventController::class, 'incrementView'])->middleware('throttle:public-views');
    Route::post('inquiries', [InquiryController::class, 'store'])->middleware('throttle:inquiries');
    Route::get('settings', [SiteSettingController::class, 'index']);
});

Route::prefix('admin')
    ->middleware(['auth:sanctum', 'platform.admin'])
    ->group(function () {
        Route::apiResource('events', AdminEventController::class);
        Route::apiResource('blogs', AdminBlogController::class);
        Route::apiResource('testimonials', AdminTestimonialController::class);
        Route::apiResource('faqs', AdminFaqController::class);
        Route::apiResource('inquiries', AdminInquiryController::class)
            ->only(['index', 'show', 'update', 'destroy']);
        Route::post('upload/image', [UploadController::class, 'image']);
        Route::get('settings', [AdminSiteSettingController::class, 'index']);
        Route::post('settings', [AdminSiteSettingController::class, 'upsert']);
        Route::delete('settings/{key}', [AdminSiteSettingController::class, 'destroy']);
    });

Route::prefix('akademi')
    ->middleware(['auth:sanctum', 'akademi.user'])
    ->group(function () {
        Route::get('me', [AkademiProfileController::class, 'me']);
        Route::get('dashboard/summary', [AkademiDashboardController::class, 'summary']);
        Route::post('upload/file', [AkademiUploadController::class, 'file']);
        Route::get('exports/students', [AkademiExportController::class, 'students']);
        Route::get('exports/spp', [AkademiExportController::class, 'spp']);
        Route::get('exports/evaluations/{period}', [AkademiExportController::class, 'evaluation']);
        Route::apiResource('users', AkademiUserController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('sport-ranks', AkademiSportRankController::class)->only(['index', 'store', 'update', 'destroy']);
        Route::apiResource('training-places', AkademiTrainingPlaceController::class);
        Route::apiResource('classes', AkademiTrainingClassController::class)->parameters([
            'classes' => 'class',
        ]);
        Route::apiResource('students', AkademiStudentController::class);
        Route::apiResource('coaches', AkademiCoachController::class)->parameters([
            'coaches' => 'coach',
        ]);
        Route::apiResource('training-schedules', AkademiTrainingScheduleController::class)->parameters([
            'training-schedules' => 'trainingSchedule',
        ]);
        Route::patch('training-sessions/{trainingSession}/attendance', [AkademiTrainingSessionController::class, 'updateAttendance']);
        Route::apiResource('training-sessions', AkademiTrainingSessionController::class)->parameters([
            'training-sessions' => 'trainingSession',
        ]);
        Route::get('spp-bills', [AkademiSppBillController::class, 'index']);
        Route::post('spp-bills/generate', [AkademiSppBillController::class, 'generate']);
        Route::post('spp-bills/{sppBill}/payments', [AkademiSppBillController::class, 'pay']);
        Route::patch('spp-bills/{sppBill}/waive', [AkademiSppBillController::class, 'waive']);
        Route::get('evaluations/periods', [AkademiEvaluationController::class, 'periods']);
        Route::post('evaluations/periods', [AkademiEvaluationController::class, 'storePeriod']);
        Route::put('evaluations/periods/{period}', [AkademiEvaluationController::class, 'updatePeriod']);
        Route::get('evaluations/periods/{period}/aspects', [AkademiEvaluationController::class, 'aspects']);
        Route::post('evaluations/periods/{period}/aspects', [AkademiEvaluationController::class, 'storeAspect']);
        Route::get('evaluations/aspects', [AkademiEvaluationController::class, 'aspects']);
        Route::post('evaluations/aspects', [AkademiEvaluationController::class, 'storeAspect']);
        Route::put('evaluations/aspects/{aspect}', [AkademiEvaluationController::class, 'updateAspect']);
        Route::delete('evaluations/aspects/{aspect}', [AkademiEvaluationController::class, 'destroyAspect']);
        Route::get('evaluations/periods/{period}/scores', [AkademiEvaluationController::class, 'scores']);
        Route::post('evaluations/periods/{period}/scores', [AkademiEvaluationController::class, 'upsertScores']);
        Route::get('rank-promotions', [AkademiRankPromotionController::class, 'index']);
        Route::post('rank-promotions', [AkademiRankPromotionController::class, 'store']);
        Route::get('rank-promotions/{rankPromotionEvent}', [AkademiRankPromotionController::class, 'show']);
        Route::put('rank-promotions/{rankPromotionEvent}', [AkademiRankPromotionController::class, 'update']);
        Route::post('rank-promotions/{rankPromotionEvent}/participants', [AkademiRankPromotionController::class, 'storeParticipant']);
        Route::patch('rank-promotions/{rankPromotionEvent}/participants/{participant}', [AkademiRankPromotionController::class, 'updateParticipant']);

        Route::middleware('feature:public_website')->group(function () {
            Route::get('public-profile', [AkademiPublicProfileController::class, 'show']);
            Route::put('public-profile', [AkademiPublicProfileController::class, 'updateProfile']);
            Route::post('public-profile/hero-images', [AkademiPublicProfileController::class, 'storeHeroImage']);
            Route::put('public-profile/hero-images/{heroImage}', [AkademiPublicProfileController::class, 'updateHeroImage']);
            Route::delete('public-profile/hero-images/{heroImage}', [AkademiPublicProfileController::class, 'destroyHeroImage']);
            Route::post('public-profile/gallery', [AkademiPublicProfileController::class, 'storeGallery']);
            Route::put('public-profile/gallery/{galleryItem}', [AkademiPublicProfileController::class, 'updateGallery']);
            Route::delete('public-profile/gallery/{galleryItem}', [AkademiPublicProfileController::class, 'destroyGallery']);
            Route::post('public-profile/achievements', [AkademiPublicProfileController::class, 'storeAchievement']);
            Route::put('public-profile/achievements/{achievement}', [AkademiPublicProfileController::class, 'updateAchievement']);
            Route::delete('public-profile/achievements/{achievement}', [AkademiPublicProfileController::class, 'destroyAchievement']);
            Route::post('public-profile/officials', [AkademiPublicProfileController::class, 'storeOfficial']);
            Route::put('public-profile/officials/{official}', [AkademiPublicProfileController::class, 'updateOfficial']);
            Route::delete('public-profile/officials/{official}', [AkademiPublicProfileController::class, 'destroyOfficial']);
            Route::patch('public-profile/coaches/visibility', [AkademiPublicProfileController::class, 'updateCoachVisibility']);
        });
    });
