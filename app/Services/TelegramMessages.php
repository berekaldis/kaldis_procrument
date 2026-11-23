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
            'en' => "✅ <b>Connected!</b> You are linked as <b>:name</b>.\nYou will receive proforma requests here and can reply directly with your quotations.",
            'am' => "✅ <b>ተገናኝቷል!</b> እንደ <b>:name</b> ተገናኝተዋል።\nየፕሮፎርማ ጥያቄዎችን እዚህ ይቀበላሉ፤ በቀጥታም ዋጋዎን መላክ ይችላሉ።",
        ],
        'no_open_request' => [
            'en' => "Thanks for reaching out! There are currently no open proforma requests for you. We'll notify you as soon as a new RFQ is issued.",
            'am' => "እናመሰግናለን! በአሁኑ ጊዜ ለእርስዎ ክፍት የሆነ የፕሮፎርማ ጥያቄ የለም። አዲስ ጥያቄ ሲኖር ወዲያውኑ እናሳውቅዎታለን።",
        ],
        'choose_request_header' => [
            'en' => "You have multiple open requests. Reply with the number for the one this quotation is for:",
            'am' => "ከአንድ በላይ ክፍት ጥያቄዎች አሉዎት። ይህ ዋጋ ለየትኛው እንደሆነ ቁጥሩን በመላክ ይምረጡ፦",
        ],
        'invalid_selection' => [
            'en' => "Invalid choice. Please reply with one of the numbers listed above, or send /cancel to start over.",
            'am' => "ትክክለኛ ምርጫ አይደለም። እባክዎ ከላይ ካሉት ቁጥሮች አንዱን ይላኩ፣ ወይም እንደገና ለመጀመር /cancel ይላኩ።",
        ],
        'selection_cancelled' => [
            'en' => "Cancelled. Send your quotation again whenever you're ready.",
            'am' => "ተሰርዟል። ዝግጁ ሲሆኑ ዋጋ ማቅረቢያዎን በድጋሚ ይላኩ።",
        ],
        'received_confirmation' => [
            'en' => "✅ <b>Quotation Received!</b>\nYour proforma for <b>:ref</b> (:title) has been successfully recorded. Thank you!",
            'am' => "✅ <b>ዋጋ ማቅረቢያዎ ደርሶናል!</b>\nለ<b>:ref</b> (:title) ያቀረቡት ፕሮፎርማ በትክክል ተመዝግቧል። እናመሰግናለን!",
        ],
        'start_prompt' => [
            'en' => "👋 <b>Welcome to Kaldi's Coffee Procurement Bot!</b>\n\n🌐 Please select your preferred language / እባክዎ ቋንቋዎን ይምረጡ፦",
            'am' => "👋 <b>እንኳን ወደ ካልዲስ ቡና ግዥ ቦት በደህና መጡ!</b>\n\n🌐 እባክዎ ቋንቋዎን ይምረጡ / Please select your preferred language:",
        ],
        'welcome_unlinked' => [
            'en' => "✅ <b>Language set to English 🇬🇧</b>\n\n👋 Welcome to Kaldi's Procurement Bot!\n\nYour Telegram Chat ID is: <code>:chat_id</code>\n\n📌 Please share this Chat ID with the Kaldi procurement team to register your company and start receiving RFQs directly here.",
            'am' => "✅ <b>ቋንቋ ወደ አማርኛ 🇪🇹 ተቀይሯል።</b>\n\n👋 እንኳን ወደ ካልዲስ ቡና ግዥ ቦት በደህና መጡ!\n\nየእርስዎ ቴሌግራም ቻት መለያ (Chat ID)፦ <code>:chat_id</code>\n\n📌 ድርጅትዎን በስርዓቱ ለማስመዝገብ እና የፕሮፎርማ ጥያቄዎችን ለመቀበል እባክዎ ይህን መለያ ቁጥር ለግዥ ቡድኑ ያጋሩ።",
        ],
        'welcome_linked' => [
            'en' => "✅ <b>Language set to English 🇬🇧</b>\n\n👋 Welcome, <b>:name</b>!\nYou are connected to Kaldi Procurement. You will receive proforma requests here and can reply directly with your quotations.",
            'am' => "✅ <b>ቋንቋ ወደ አማርኛ 🇪🇹 ተቀይሯል።</b>\n\n👋 እንኳን በደህና መጡ <b>:name</b>!\nከካልዲስ ቡና ግዥ ስርዓት ጋር ተገናኝተዋል። የፕሮፎርማ ጥያቄዎች እዚህ ይደርሱዎታል፤ በቀጥታም ዋጋዎን መላክ ይችላሉ።",
        ],
        'language_changed' => [
            'en' => "Language set to English 🇬🇧",
            'am' => "ቋንቋ ወደ አማርኛ 🇪🇹 ተቀይሯል።",
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

    /**
     * Clean, simple, and mobile-friendly outbound proforma request message.
     */
    public static function outboundRequest(string $lang, array $replace = []): string
    {
        $ref = $replace['ref'] ?? '';
        $title = $replace['title'] ?? '';
        $items = $replace['items'] ?? '';
        $deadline = $replace['deadline'] ?? '';
        $paymentTerms = $replace['paymentTerms'] ?? ($lang === 'am' ? 'ካሽ' : 'Cash');

        if ($lang === 'am') {
            $msg = "📦 <b>አዲስ የፕሮፎርማ ጥያቄ</b>\n";
            $msg .= "━━━━━━━━━━━━━━━━━━━━\n";
            $msg .= "<b>መለያ፦</b> {$ref}\n";
            $msg .= "<b>ርዕስ፦</b> {$title}\n";
            $msg .= "<b>የክፍያ ሁኔታ፦</b> {$paymentTerms}\n";
            $msg .= "<b>የመጨረሻ ቀን፦</b> {$deadline}\n\n";
            $msg .= "📋 <b>የተጠየቁ ዕቃዎች፦</b>\n{$items}\n\n";
            $msg .= "💡 <b>ዋጋ ለመላክ፦</b>\n";
            $msg .= "የእያንዳንዱን እቃ ዋጋ በዚህ መልክ ይመልሱ፦\n";
            $msg .= "ምሳሌ፦ <code>1: 450, 2: 120</code>\n";
            $msg .= "(ወይም የዋጋ ማቅረቢያ ሰነድ / ፎቶ ይላኩ)\n";
            $msg .= "እናመሰግናለን!";

            return $msg;
        }

        $msg = "📦 <b>NEW PROFORMA REQUEST</b>\n";
        $msg .= "━━━━━━━━━━━━━━━━━━━━\n";
        $msg .= "<b>Ref:</b> {$ref}\n";
        $msg .= "<b>Title:</b> {$title}\n";
        $msg .= "<b>Terms:</b> {$paymentTerms}\n";
        $msg .= "<b>Deadline:</b> {$deadline}\n\n";
        $msg .= "📋 <b>Requested Items:</b>\n{$items}\n\n";
        $msg .= "💡 <b>How to Submit Price:</b>\n";
        $msg .= "Reply directly with your unit prices:\n";
        $msg .= "Example: <code>1: 450, 2: 120</code>\n";
        $msg .= "(or attach a PDF quotation / photo)\n";
        $msg .= "Thank you!";

        return $msg;
    }

    public static function bilingualOutboundRequest(array $replace = []): string
    {
        return self::outboundRequest('en', $replace);
    }

    public static function bilingualLanguagePrompt(): string
    {
        return "🌐 <b>Please select your language / እባክዎ ቋንቋዎን ይምረጡ፦</b>";
    }

    public static function startPrompt(): string
    {
        return "👋 <b>Welcome to Kaldi's Coffee Procurement Bot!</b>\n\n🌐 <b>Please select your language / እባክዎ ቋንቋዎን ይምረጡ፦</b>";
    }

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
