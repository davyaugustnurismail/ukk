<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * This migration attempts to drop any global UNIQUE indexes on `email` and `no_hp` if they exist,
     * and then creates composite unique indexes scoped by `merchant_id` so the same email/phone
     * can exist across different merchants.
     *
     * Warning: If your DB has existing duplicate rows that violate the new composite unique
     * constraint (same merchant_id + email/no_hp), the migration will fail. Please backup first.
     */
    public function up()
    {
        // Drop global unique indexes if present. Use try/catch to avoid breaking on DBs where
        // the index name differs or doesn't exist.
        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_email_unique');
            });
        } catch (\Throwable $e) {
            // ignore
        }

        try {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('users_no_hp_unique');
            });
        } catch (\Throwable $e) {
            // ignore
        }

        // Create composite unique indexes scoped to merchant_id
        Schema::table('users', function (Blueprint $table) {
            // use explicit index names to avoid collisions
            $table->unique(['merchant_id', 'email'], 'users_merchant_email_unique');
            $table->unique(['merchant_id', 'no_hp'], 'users_merchant_nohp_unique');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            // Drop composite uniques
            try {
                $table->dropUnique('users_merchant_email_unique');
            } catch (\Throwable $e) {
                // ignore
            }

            try {
                $table->dropUnique('users_merchant_nohp_unique');
            } catch (\Throwable $e) {
                // ignore
            }

            // Recreate global uniques (original behavior)
            try {
                $table->unique('email', 'users_email_unique');
            } catch (\Throwable $e) {
                // ignore
            }

            try {
                $table->unique('no_hp', 'users_no_hp_unique');
            } catch (\Throwable $e) {
                // ignore
            }
        });
    }
};
