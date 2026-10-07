<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $password = config('barangay.seed_password');

        $accounts = [
            ['Barangay Secretary (Admin)', 'admin@sansotero.test',   'admin'],
            ['Barangay Staff',             'staff@sansotero.test',   'staff'],
            ['Punong Barangay (Captain)',  'captain@sansotero.test', 'captain'],
        ];

        foreach ($accounts as [$name, $email, $role]) {
            User::unguarded(fn () => User::updateOrCreate(['email' => $email], [
                'name' => $name, 'password' => $password, 'role' => $role,
                'account_status' => 'verified', 'verified_at' => now(),
            ]));
        }

        // A sample resident so the resident side can be tried right away.
        User::unguarded(fn () => User::updateOrCreate(['email' => 'resident@sansotero.test'], [
            'name' => 'Juan Dela Cruz', 'password' => $password, 'role' => 'resident',
            'account_status' => 'verified', 'verified_at' => now(),
            'purok' => 'Purok 1', 'address' => '123 Rizal Street, Barangay San Sotero',
            'birthdate' => '1995-06-15', 'civil_status' => 'Single', 'contact_number' => '09171234567',
            'valid_id_type' => 'National ID',
        ]));
    }
}
