<?php

namespace App\Http\Requests;

/** Strips HTML tags from free-text fields before validation (defence in depth against stored XSS). */
trait SanitizesInput
{
    protected function stripTagsFrom(array $keys): void
    {
        $clean = [];
        foreach ($keys as $key) {
            if (is_string($this->input($key))) {
                $clean[$key] = trim(strip_tags($this->input($key)));
            }
        }
        $this->merge($clean);
    }
}
