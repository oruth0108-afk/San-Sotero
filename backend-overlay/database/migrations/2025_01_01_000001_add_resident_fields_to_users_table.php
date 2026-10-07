<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->string('role', 20)->default('resident')->index();            // resident | staff | captain | admin
            $t->string('account_status', 20)->default('pending')->index();   // pending | verified | deactivated
            $t->string('purok', 100)->nullable();
            $t->text('address')->nullable();
            $t->date('birthdate')->nullable();
            $t->string('civil_status', 20)->nullable();
            $t->string('contact_number', 20)->nullable();
            $t->string('valid_id_type', 60)->nullable();
            $t->string('valid_id_path')->nullable();                          // private disk, never public
            $t->timestamp('verified_at')->nullable();
            $t->timestamp('last_login_at')->nullable();
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $t) {
            $t->dropColumn(['role', 'account_status', 'purok', 'address', 'birthdate', 'civil_status',
                'contact_number', 'valid_id_type', 'valid_id_path', 'verified_at', 'last_login_at']);
        });
    }
};
