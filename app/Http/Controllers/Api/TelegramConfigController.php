<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use App\Services\AuditService;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramConfigController extends Controller
{
    public function __construct(
        private readonly TelegramService $telegram,
        private readonly AuditService $audit,
    ) {}

    public function index(): JsonResponse
    {
        return response()->json([
            'botTokenSet' => ! empty($this->telegram->token()),
            'botUsername' => $this->telegram->botUsername(),
            'webhookSecret' => $this->telegram->webhookSecret(),
        ]);
    }

    public function update(Request $request): JsonResponse
    {
        $data = $request->validate([
            'botToken' => ['sometimes', 'nullable', 'string', 'max:255'],
            'botUsername' => ['sometimes', 'nullable', 'string', 'max:255'],
            'webhookSecret' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);

        foreach (['botToken' => 'telegram_bot_token', 'botUsername' => 'telegram_bot_username', 'webhookSecret' => 'telegram_webhook_secret'] as $field => $key) {
            if (array_key_exists($field, $data)) {
                Setting::set($key, $data[$field] !== '' ? $data[$field] : null);
            }
        }

        $this->audit->log($request->user()->name, 'telegram', 'config', 'updated', 'Updated Telegram configuration.');

        return response()->json([
            'botTokenSet' => ! empty($this->telegram->token()),
            'botUsername' => $this->telegram->botUsername(),
            'webhookSecret' => $this->telegram->webhookSecret(),
        ]);
    }

    public function generateSecret(): JsonResponse
    {
        return response()->json(['secret' => bin2hex(random_bytes(20))]);
    }
}
