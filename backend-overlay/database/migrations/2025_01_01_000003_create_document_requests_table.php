<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('document_requests', function (Blueprint $t) {
            $t->id();
            $t->string('reference_no', 30)->nullable()->unique();
            $t->foreignId('user_id')->constrained()->cascadeOnDelete();
            $t->foreignId('document_type_id')->constrained()->restrictOnDelete();
            $t->string('purpose', 80);
            $t->text('purpose_details')->nullable();
            $t->string('status', 20)->default('pending')->index();
            $t->text('remarks')->nullable();            // visible to the resident
            $t->text('rejection_reason')->nullable();
            $t->date('pickup_date')->nullable();
            $t->decimal('fee_amount', 8, 2)->default(0);
            $t->boolean('is_paid')->default(false);
            $t->string('or_number', 40)->nullable();
            $t->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $t->foreignId('released_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('approved_at')->nullable();
            $t->timestamp('released_at')->nullable();
            $t->timestamps();

            $t->index(['user_id', 'status']);
            $t->index('created_at');
        });

        Schema::create('request_attachments', function (Blueprint $t) {
            $t->id();
            $t->foreignId('document_request_id')->constrained()->cascadeOnDelete();
            $t->string('label', 100);
            $t->string('original_name');
            $t->string('path');
            $t->string('mime', 100);
            $t->unsignedInteger('size');
            $t->timestamps();
        });

        Schema::create('request_status_histories', function (Blueprint $t) {
            $t->id();
            $t->foreignId('document_request_id')->constrained()->cascadeOnDelete();
            $t->string('from_status', 20)->nullable();
            $t->string('to_status', 20);
            $t->text('remarks')->nullable();
            $t->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $t->timestamp('created_at')->useCurrent();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('request_status_histories');
        Schema::dropIfExists('request_attachments');
        Schema::dropIfExists('document_requests');
    }
};
