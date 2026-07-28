<?php

namespace App\Services;

class TelegramMessages
{
    private const MESSAGES = [
        'ask_tin' => [
            'en' => "Please reply with your company's <b>TIN</b> to link this chat to your supplier profile.",
            'am' => "ይህን ውይይት ከአቅራቢ መገለጫዎ ጋር ለማገናኘት እባክዎ የድርጅትዎን <b>የግብር መለያ ቁጥር (TIN)</b> ይላኩ።",
        ],
        'tin_not_found' => [
            'en' => "We couldn't find a supplier with TIN <b>:tin</b>. Please double-check and try again, or contact the procurement team.",
            'am' => "በ<b>:tin</b> የግብር መለያ ቁጥር አቅራቢ አላገኘንም። እባክዎ ቁጥሩን በድጋሚ ያረጋግጡ ወይም የግዢ ቡድኑን ያግኙ።",
        ],
        'linked' => [
            'en' => "✅ Linked! You're now connected as <b>:name</b>. You'll receive proforma requests here and can reply with a quotation (text, PDF, or photo).\n\nSend /language anytime to change your language.",
            'am' => "✅ ተገናኝቷል! እንደ <b>:name</b> ተገናኝተዋል። የፕሮፎርማ ጥያቄዎችን እዚህ ይቀበላሉ እና በጽሑፍ፣ በPDF ወይም በፎቶ ዋጋ ማቅረቢያ መላክ ይችላሉ።\n\nቋንቋ ለመቀየር በማንኛውም ጊዜ /language ይላኩ።",
        ],
        'no_open_request' => [
            'en' => "Thanks for reaching out — we don't currently have an open proforma request for you. We'll notify you here as soon as one is sent.",
            'am' => "እናመሰግናለን — በአሁኑ ጊዜ ለእርስዎ ክፍት የሆነ የፕሮፎርማ ጥያቄ የለም። ጥያቄ እንደተላከ ወዲያውኑ እዚህ እናሳውቅዎታለን።",
        ],
        'choose_request_header' => [
            'en' => "You have multiple open requests. Reply with the number for the one this is for:",
            'am' => "ከአንድ በላይ ክፍት ጥያቄዎች አሉዎት። ይህ ለየትኛው እንደሆነ ቁጥሩን በመላክ ይምረጡ፦",
        ],
        'invalid_selection' => [
            'en' => "Sorry, that's not a valid option. Please reply with one of the numbers above, or send /cancel to start over.",
            'am' => "ይቅርታ፣ ትክክለኛ ምርጫ አይደለም። እባክዎ ከላይ ካሉት ቁጥሮች አንዱን ይላኩ፣ ወይም እንደገና ለመጀመር /cancel ይላኩ።",
        ],
        'selection_cancelled' => [
            'en' => "Cancelled. Send your quotation again when you're ready.",
            'am' => "ተሰርዟል። ዝግጁ ሲሆኑ ዋጋ ማቅረቢያዎን በድጋሚ ይላኩ።",
        ],
        'received_confirmation' => [
            'en' => "✅ Thank you! Your proforma for <b>:ref</b> (:title) has been received.",
            'am' => "✅ እናመሰግናለን! ለ<b>:ref</b> (:title) ያቀረቡት ፕሮፎርማ ደርሶናል።",
        ],
        'choose_language' => [
            'en' => "🌐 Please select your language.",
            'am' => "🌐 እባክዎ ቋንቋዎን ይምረጡ።",
        ],
        'language_changed' => [
            'en' => "Language set to English.",
            'am' => "ቋንቋ ወደ አማርኛ ተቀይሯል።",
        ],
        'outbound_request' => [
            'en' => "📦 Proforma Request\nRef: :ref\nTitle: :title\n:items\n\nDeadline: :deadline\n\nPlease respond with your quotation. Thank you!",
            'am' => "📦 የፕሮፎርማ ጥያቄ\nመለያ ቁጥር: :ref\nርዕስ: :title\n:items\n\nየመጨረሻ ቀን: :deadline\n\nእባክዎ ዋጋ ማቅረቢያዎን ይላኩልን። እናመሰግናለን!",
        ],
    ];

    public const LANGUAGE_BUTTONS = ['English 🇬🇧', 'አማርኛ 🇪🇹'];

    public static function get(string $key, string $lang, array $replace = []): string
    {
        $lang = $lang === 'am' ? 'am' : 'en';
        $template = self::MESSAGES[$key][$lang] ?? self::MESSAGES[$key]['en'] ?? $key;

        foreach ($replace as $k => $v) {
            $template = str_replace(':'.$k, (string) $v, $template);
        }

        return $template;
    }

    public static function bilingualLanguagePrompt(): string
    {
        return self::get('choose_language', 'en')."\n".self::get('choose_language', 'am');
    }

    /**
     * Resolve a language button's tapped text (or a plain "en"/"am"/"english"/
     * "amharic" reply) to a language code, or null if it isn't one.
     */
    public static function resolveLanguageChoice(string $text): ?string
    {
        $normalized = mb_strtolower(trim($text));

        if (str_starts_with($normalized, 'english') || $normalized === 'en') {
            return 'en';
        }
        if (str_contains($text, 'አማርኛ') || $normalized === 'am' || str_starts_with($normalized, 'amharic')) {
            return 'am';
        }

        return null;
    }
}
