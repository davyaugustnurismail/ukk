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
        Schema::create('certificate_data_activity', function (Blueprint $table) {
            $table->id();
            $table->string('sent_by_admin_name')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->foreignId('data_activity_id')
                ->constrained('data_activity')
                ->onDelete('cascade');
            $table->foreignId('sertifikat_id')
                ->constrained('sertifikats')
                ->onDelete('cascade');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->boolean('is_active')->default(false);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('certificate_data_activity');
    }
};
