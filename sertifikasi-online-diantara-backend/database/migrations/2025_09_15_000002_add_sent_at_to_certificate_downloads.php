<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('certificate_downloads', function (Blueprint $table) {
            if (!Schema::hasColumn('certificate_downloads', 'sent_at')) {
                $table->timestamp('sent_at')->nullable()->after('download_count');
            }
        });
    }

    public function down()
    {
        Schema::table('certificate_downloads', function (Blueprint $table) {
            if (Schema::hasColumn('certificate_downloads', 'sent_at')) {
                $table->dropColumn('sent_at');
            }
        });
    }
};
