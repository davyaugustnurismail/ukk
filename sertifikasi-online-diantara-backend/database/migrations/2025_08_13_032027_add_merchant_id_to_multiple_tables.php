<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->onDelete('set null');
        });

        Schema::table('data_activity', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->after('id');
        });

        Schema::table('data_activity_types', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->after('id');
        });

        Schema::table('instrukturs', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->onDelete('set null');
        });

        Schema::table('admins', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->onDelete('set null');
        });

        Schema::table('sertifikats', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->onDelete('set null');
        });

        Schema::table('certificate_downloads', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->onDelete('set null');
        });

        Schema::table('user_certificates', function (Blueprint $table) {
            $table->foreignId('merchant_id')->nullable()->constrained('merchants')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
        });

        Schema::table('data_activity', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
        });

         Schema::table('data_activity_types', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
        });

        Schema::table('instrukturs', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
        });

        Schema::table('admins', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
        });

        Schema::table('sertifikats', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
        });

        Schema::table('certificate_downloads', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
        });

        Schema::table('user_certificates', function (Blueprint $table) {
            $table->dropForeign(['merchant_id']);
            $table->dropColumn('merchant_id');
        });
    }
};