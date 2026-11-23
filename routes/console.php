<?php

use App\Services\TelegramService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('telegram:webhook:set {url? : Public HTTPS base URL, e.g. https://procurement.kaldisbunnaet.com}', function (?string $url = null) {
    /** @var TelegramService $telegram */
    $telegram = app(TelegramService::class);

    if (! $telegram->isConfigured()) {
        $this->error('Telegram bot token is not configured in Settings or .env.');

        return 1;
    }

    $secret = $telegram->webhookSecret();
    if (empty($secret)) {
        $this->error('Telegram webhook secret is not set.');

        return 1;
    }

    if (! $url) {
        $info = $telegram->getWebhookInfo();
        if ($info && ! empty($info['url'])) {
            $parts = explode('/api/telegram/webhook/', $info['url']);
            $url = $parts[0] ?: 'https://procurement.kaldisbunnaet.com';
        } else {
            $url = 'https://procurement.kaldisbunnaet.com';
        }
    }

    $webhookUrl = rtrim($url, '/').'/api/telegram/webhook/'.$secret;
    $result = $telegram->setWebhook($webhookUrl, $secret);

    if (! $result['ok']) {
        $this->error('Failed to register webhook: '.($result['error'] ?? 'unknown error'));

        return 1;
    }

    $this->info('Webhook registered: '.$webhookUrl);

    return 0;
})->purpose('Register the Telegram bot webhook at a public URL with callback_query support');

Artisan::command('telegram:webhook:info', function () {
    /** @var TelegramService $telegram */
    $telegram = app(TelegramService::class);

    if (! $telegram->isConfigured()) {
        $this->error('TELEGRAM_BOT_TOKEN is not set in .env.');

        return 1;
    }

    $info = $telegram->getWebhookInfo();
    if (! $info) {
        $this->error('Could not reach Telegram API.');

        return 1;
    }

    $this->table(['Field', 'Value'], [
        ['URL', $info['url'] ?: '(not set)'],
        ['Pending updates', $info['pending_update_count'] ?? 0],
        ['Last error', $info['last_error_message'] ?? '—'],
    ]);

    return 0;
})->purpose('Show the currently registered Telegram webhook');

Artisan::command('telegram:webhook:remove', function () {
    /** @var TelegramService $telegram */
    $telegram = app(TelegramService::class);

    $result = $telegram->deleteWebhook();
    if (! $result['ok']) {
        $this->error('Failed to remove webhook: '.($result['error'] ?? 'unknown error'));

        return 1;
    }

    $this->info('Webhook removed.');

    return 0;
})->purpose('Remove the Telegram bot webhook (falls back to demo mode)');
