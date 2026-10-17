<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('academy_public_profiles', function (Blueprint $table) {
            $table->text('vision')->nullable()->after('about');
            $table->text('mission')->nullable()->after('vision');
            $table->text('public_schedule')->nullable()->after('mission');
            $table->string('cta_label', 80)->nullable()->after('whatsapp');
            $table->string('primary_color', 20)->default('#031636')->after('is_published');
            $table->string('button_color', 20)->default('#d32f2f')->after('primary_color');
            $table->string('background_color', 20)->default('#f8fafc')->after('button_color');
            $table->string('text_color', 20)->default('#0f172a')->after('background_color');
            $table->string('heading_font', 80)->default('Montserrat')->after('text_color');
            $table->string('body_font', 80)->default('Inter')->after('heading_font');
            $table->unsignedTinyInteger('button_radius')->default(8)->after('body_font');
        });
    }

    public function down(): void
    {
        Schema::table('academy_public_profiles', function (Blueprint $table) {
            $table->dropColumn([
                'vision',
                'mission',
                'public_schedule',
                'cta_label',
                'primary_color',
                'button_color',
                'background_color',
                'text_color',
                'heading_font',
                'body_font',
                'button_radius',
            ]);
        });
    }
};
