<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration will drop the global unique constraint on email and replace it
     * with a composite unique index (merchant_id, email) for `admins` and `instrukturs`.
     * It uses database-level IF EXISTS drops so it's safe when constraints are missing.
     */
    public function up(): void
    {
        // Drop global unique constraints if they exist (Postgres syntax supported)
        try {
            DB::statement('ALTER TABLE admins DROP CONSTRAINT IF EXISTS admins_email_unique');
        } catch (\Exception $e) {
            // ignore
        }
        try {
            DB::statement('ALTER TABLE instrukturs DROP CONSTRAINT IF EXISTS instrukturs_email_unique');
        } catch (\Exception $e) {
            // ignore
        }

        // Create composite unique indexes
        Schema::table('admins', function (Blueprint $table) {
            // use an explicit name to make down() easier
            $table->unique(['merchant_id', 'email'], 'admins_merchant_email_unique');
        });

        Schema::table('instrukturs', function (Blueprint $table) {
            $table->unique(['merchant_id', 'email'], 'instrukturs_merchant_email_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('admins', function (Blueprint $table) {
            $table->dropUnique('admins_merchant_email_unique');
        });
        Schema::table('instrukturs', function (Blueprint $table) {
            $table->dropUnique('instrukturs_merchant_email_unique');
        });

        // recreate original global unique constraints (may fail if duplicates exist)
        try {
            DB::statement('ALTER TABLE admins ADD CONSTRAINT admins_email_unique UNIQUE (email)');
        } catch (\Exception $e) {
            // ignore
        }
        try {
            DB::statement('ALTER TABLE instrukturs ADD CONSTRAINT instrukturs_email_unique UNIQUE (email)');
        } catch (\Exception $e) {
            // ignore
        }
    }
};
