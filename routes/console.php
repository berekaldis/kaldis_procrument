<?php

use App\Services\TelegramService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('telegram:webhook:set {url : Public HTTPS base URL, e.g. https://your-domain.com}', function (string $url) {
    /** @var TelegramService $telegram */
    $telegram = app(TelegramService::class);

    if (! $telegram->isConfigured()) {
        $this->error('TELEGRAM_BOT_TOKEN is not set in .env.');

        return 1;
    }

    $secret = config('services.telegram_webhook_secret');
    if (empty($secret)) {
        $this->error('TELEGRAM_WEBHOOK_SECRET is not set in .env. Generate one with: php -r "echo bin2hex(random_bytes(20));"');

        return 1;
    }

    $webhookUrl = rtrim($url, '/').'/api/telegram/webhook/'.$secret;
    $result = $telegram->setWebhook($webhookUrl, $secret);

    if (! $result['ok']) {
        $this->error('Failed to register webhook: '.($result['error'] ?? 'unknown error'));

        return 1;
    }

    $this->info('Webhook registered: '.$webhookUrl);

    return 0;
})->purpose('Register the Telegram bot webhook at a public URL');

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
