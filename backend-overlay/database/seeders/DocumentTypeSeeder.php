<?php

namespace Database\Seeders;

use App\Models\DocumentType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DocumentTypeSeeder extends Seeder
{
    public function run(): void
    {
        $types = [
            ['Barangay Clearance', 'Proof that you have no pending issues in the barangay. Commonly used for employment, school and government transactions.', 50, 2, ['Valid ID', 'Proof of residency'], 'clearance'],
            ['Certificate of Residency', 'Certifies that you live in Barangay San Sotero.', 30, 1, ['Valid ID', 'Proof of residency'], 'residency'],
            ['Certificate of Indigency', 'For residents who need financial, medical or educational assistance.', 0, 2, ['Valid ID', 'Proof of residency'], 'indigency'],
            ['Certificate of Good Moral Character', 'Certifies good standing in the community.', 50, 3, ['Valid ID', 'Proof of residency'], 'good_moral'],
            ['Business Clearance', 'Barangay clearance for opening or renewing a business in the barangay.', 200, 5, ['Valid ID', 'Business registration (DTI/SEC)', 'Location sketch or photo of the business'], 'business'],
            ['Barangay ID', 'Official barangay identification card.', 100, 7, ['Valid ID', 'Proof of residency', '1x1 ID photo'], 'barangay_id'],
            ['Other Barangay Certification', 'Other certificates issued by the barangay. State what you need in the details field.', 30, 3, ['Valid ID'], 'generic'],
        ];

        foreach ($types as [$name, $description, $fee, $days, $attachments, $template]) {
            DocumentType::updateOrCreate(['slug' => Str::slug($name)], [
                'name' => $name, 'description' => $description, 'fee' => $fee, 'processing_days' => $days,
                'required_attachments' => $attachments, 'template' => $template, 'is_active' => true,
            ]);
        }
    }
}
