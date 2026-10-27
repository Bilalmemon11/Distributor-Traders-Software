<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('backups', function (Blueprint $table) {

            $table->id();

            // Backup file
            $table->string('filename');
            $table->string('file_path');

            // Size in bytes
            $table->unsignedBigInteger('file_size')->default(0);

            // manual / auto
            $table->enum('backup_type', [
                'manual',
                'auto'
            ])->default('manual');

            // success / failed
            $table->enum('status', [
                'success',
                'failed'
            ])->default('success');

            // Admin/User ID (future authentication)
            $table->unsignedBigInteger('created_by')->nullable();

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index('backup_type');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('backups');
    }
};