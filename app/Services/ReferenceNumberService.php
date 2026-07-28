<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;

class ReferenceNumberService
{
    /**
     * Generate the next reference number for a proforma request:
     * PRF-YYYY-#### (zero-padded, sequence resets per year).
     */
    public static function nextProformaRequestReference(int $year): string
    {
        $prefix = 'PRF-'.$year.'-';
        $prefixLen = strlen($prefix);

        // Pull all reference_no values that match the prefix and find the max
        // sequence number — works for SQLite and MySQL alike.
        $rows = DB::table('proforma_requests')
            ->where('reference_no', 'like', $prefix.'%')
            ->pluck('reference_no');

        $max = 0;
        foreach ($rows as $ref) {
            $seq = (int) substr((string) $ref, $prefixLen);
            if ($seq > $max) {
                $max = $seq;
            }
        }

        return $prefix.str_pad((string) ($max + 1), 4, '0', STR_PAD_LEFT);
    }

    public static function forProformaRequest(): string
    {
        return self::nextProformaRequestReference((int) now()->format('Y'));
    }
}
