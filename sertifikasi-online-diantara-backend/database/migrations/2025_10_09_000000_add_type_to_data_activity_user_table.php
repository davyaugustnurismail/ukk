<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddTypeToDataActivityUserTable extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('data_activity_user', function (Blueprint $table) {
            $table->enum('type', ['peserta', 'narasumber', 'panitia'])->default('peserta')->after('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('data_activity_user', function (Blueprint $table) {
            $table->dropColumn('type');
        });
    }
}