<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('document_types', function (Blueprint $t) {
            $t->id();
            $t->string('name')->unique();
            $t->string('slug')->unique();
            $t->text('description')->nullable();
            $t->decimal('fee', 8, 2)->default(0);
            $t->unsignedSmallInteger('processing_days')->default(3);
            $t->json('required_attachments')->nullable();   // e.g. ["Valid ID", "Proof of residency"]
            $t->string('template', 30)->default('generic'); // PDF layout
            $t->boolean('is_active')->default(true);
            $t->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('document_types');
    }
};
