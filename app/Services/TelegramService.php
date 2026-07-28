<?php

namespace App\Services;

use App\Models\Setting;
use App\Models\TelegramOutbox;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TelegramService
{
    /**
     * Admin-configured values in the settings table always win over
     * .env — that's what lets Settings > Telegram be fully editable from
     * the UI without touching the server's environment file.
     */
    public function token(): ?string
    {
        return Setting::get('telegram_bot_token') ?: (config('services.telegram_bot_token') ?: env('TELEGRAM_BOT_TOKEN'));
    }

    public function botUsername(): ?string
    {
        return Setting::get('telegram_bot_username') ?: config('services.telegram_bot_username');
    }

    public function webhookSecret(): ?string
    {
        return Setting::get('telegram_webhook_secret') ?: config('services.telegram_webhook_secret');
    }

    private function api(string $method): string
    {
        return "https://api.telegram.org/bot{$this->token()}/{$method}";
    }

    public function isConfigured(): bool
    {
        return ! empty($this->token());
    }

    /**
     * Send a plain conversational reply (bot linking flow, acknowledgements)
     * without recording it in the Telegram Outbox — the outbox is reserved
     * for outbound proforma request notifications.
     */
    public function sendRaw(string $chatId, string $text): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        try {
            $resp = Http::timeout(15)->post($this->api('sendMessage'), [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
            ]);

            return $resp->successful() && $resp->json('ok', false) === true;
        } catch (\Throwable $e) {
            Log::warning('Telegram sendRaw failed: '.$e->getMessage());

            return false;
        }
    }

    /**
     * Send a reply with a one-time reply keyboard (used for the language
     * picker). Buttons collapse back to the normal keyboard after one tap.
     */
    public function sendWithKeyboard(string $chatId, string $text, array $buttonRows): bool
    {
        if (! $this->isConfigured()) {
            return false;
        }

        try {
            $resp = Http::timeout(15)->post($this->api('sendMessage'), [
                'chat_id' => $chatId,
                'text' => $text,
                'parse_mode' => 'HTML',
                'reply_markup' => json_encode([
                    'keyboard' => array_map(fn ($row) => array_map(fn ($label) => ['text' => $label], $row), $buttonRows),
                    'resize_keyboard' => true,
                    'one_time_keyboard' => true,
                ]),
            ]);

            return $resp->successful() && $resp->json('ok', false) === true;
        } catch (\Throwable $e) {
            Log::warning('Telegram sendWithKeyboard failed: '.$e->getMessage());

            return false;
        }
    }

    public function getMe(): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        try {
            $resp = Http::timeout(10)->get($this->api('getMe'));
            if ($resp->successful() && $resp->json('ok', false) === true) {
                return $resp->json('result');
            }
        } catch (\Throwable $e) {
            Log::warning('Telegram getMe failed: '.$e->getMessage());
        }

        return null;
    }

    public function getWebhookInfo(): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        try {
            $resp = Http::timeout(10)->get($this->api('getWebhookInfo'));
            if ($resp->successful() && $resp->json('ok', false) === true) {
                return $resp->json('result');
            }
        } catch (\Throwable $e) {
            Log::warning('Telegram getWebhookInfo failed: '.$e->getMessage());
        }

        return null;
    }

    /**
     * @return array{ok: bool, error?: string}
     */
    public function setWebhook(string $url, ?string $secretToken = null): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'error' => 'Bot token not configured.'];
        }

        try {
            $payload = [
                'url' => $url,
                'allowed_updates' => ['message'],
                'drop_pending_updates' => false,
            ];
            if ($secretToken) {
                $payload['secret_token'] = $secretToken;
            }

            $resp = Http::timeout(15)->post($this->api('setWebhook'), $payload);
            if ($resp->successful() && $resp->json('ok', false) === true) {
                return ['ok' => true];
            }

            return ['ok' => false, 'error' => $resp->json('description', $resp->body())];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * @return array{ok: bool, error?: string}
     */
    public function deleteWebhook(): array
    {
        if (! $this->isConfigured()) {
            return ['ok' => false, 'error' => 'Bot token not configured.'];
        }

        try {
            $resp = Http::timeout(15)->post($this->api('deleteWebhook'), ['drop_pending_updates' => false]);
            if ($resp->successful() && $resp->json('ok', false) === true) {
                return ['ok' => true];
            }

            return ['ok' => false, 'error' => $resp->json('description', $resp->body())];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    /**
     * Download a Telegram-hosted file (document/photo) by file_id.
     *
     * @return array{contents: string, fileName: string, mimeType: ?string}|null
     */
    public function downloadFile(string $fileId, ?string $suggestedName = null, ?string $mimeType = null): ?array
    {
        if (! $this->isConfigured()) {
            return null;
        }

        try {
            $meta = Http::timeout(15)->get($this->api('getFile'), ['file_id' => $fileId]);
            if (! $meta->successful() || $meta->json('ok', false) !== true) {
                return null;
            }

            $filePath = $meta->json('result.file_path');
            if (! $filePath) {
                return null;
            }

            $url = "https://api.telegram.org/file/bot{$this->token()}/{$filePath}";
            $contents = Http::timeout(30)->get($url);
            if (! $contents->successful()) {
                return null;
            }

            return [
                'contents' => $contents->body(),
                'fileName' => $suggestedName ?: basename($filePath),
                'mimeType' => $mimeType,
            ];
        } catch (\Throwable $e) {
            Log::warning('Telegram downloadFile failed: '.$e->getMessage());

            return null;
        }
    }

    public function sendNotification(
        ?string $chatId,
        string $message,
        ?string $supplierName = null,
        ?string $supplierId = null,
    ): TelegramOutbox {
        if (empty($chatId) || ! $this->isConfigured()) {
            // Demo / simulated mode — store the message so the admin can read it
            // in the Telegram Outbox panel.
            return TelegramOutbox::create([
                'supplier_id' => $supplierId,
                'supplier_name' => $supplierName,
                'chat_id' => $chatId,
                'message' => $message,
                'status' => 'simulated',
                'payload' => $message,
                'sent_at' => now(),
            ]);
        }

        try {
            $resp = Http::timeout(15)->post($this->api('sendMessage'), [
                'chat_id' => $chatId,
                'text' => $message,
                'parse_mode' => 'HTML',
            ]);

            if ($resp->successful() && ($resp->json('ok', false) === true)) {
                return TelegramOutbox::create([
                    'supplier_id' => $supplierId,
                    'supplier_name' => $supplierName,
                    'chat_id' => $chatId,
                    'message' => $message,
                    'status' => 'sent',
                    'payload' => $resp->body(),
                    'sent_at' => now(),
                ]);
            }

            return TelegramOutbox::create([
                'supplier_id' => $supplierId,
                'supplier_name' => $supplierName,
                'chat_id' => $chatId,
                'message' => $message,
                'status' => 'failed',
                'error' => $resp->body(),
                'payload' => $resp->body(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('Telegram send failed: '.$e->getMessage());

            return TelegramOutbox::create([
                'supplier_id' => $supplierId,
                'supplier_name' => $supplierName,
                'chat_id' => $chatId,
                'message' => $message,
                'status' => 'failed',
                'error' => $e->getMessage(),
                'payload' => null,
            ]);
        }
    }
}
