<?php

namespace App\Services;

use App\Models\DocumentRequest;
use App\Models\User;
use App\Models\UserNotification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

class Notifier
{
    /** Always creates an in-app notification; email/SMS are optional hooks (see config/barangay.php). */
    public static function toUser(User $user, string $title, string $message, ?DocumentRequest $request = null, bool $external = true): void
    {
        UserNotification::create([
            'user_id'             => $user->id,
            'document_request_id' => $request?->id,
            'title'               => $title,
            'message'             => $message,
        ]);

        if ($external) {
            self::email($user, $title, $message);
            self::sms($user, $message);
        }
    }

    public static function toStaff(string $title, string $message, ?DocumentRequest $request = null): void
    {
        User::staffMembers()->where('account_status', '!=', 'deactivated')->each(
            fn (User $u) => self::toUser($u, $title, $message, $request, external: false)
        );
    }

    private static function email(User $user, string $title, string $message): void
    {
        if (!config('barangay.notify_email') || !$user->email) {
            return;
        }
        try {
            Mail::raw($message . "\n\n- Barangay " . config('barangay.name'), fn ($m) => $m->to($user->email)->subject($title));
        } catch (\Throwable $e) {
            report($e);
        }
    }

    /**
     * Generic HTTP SMS hook. The payload below matches Semaphore (PH); adapt for Twilio, Vonage, etc.
     */
    private static function sms(User $user, string $message): void
    {
        $cfg = config('barangay.sms');
        if (!$cfg['enabled'] || !$cfg['url'] || !$user->contact_number) {
            return;
        }
        try {
            Http::timeout(5)->asForm()->post($cfg['url'], [
                'apikey'     => $cfg['key'],
                'number'     => $user->contact_number,
                'message'    => $message,
                'sendername' => $cfg['sender'],
            ]);
        } catch (\Throwable $e) {
            report($e);
        }
    }
}
