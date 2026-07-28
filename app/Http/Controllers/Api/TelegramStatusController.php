<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Supplier;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramStatusController extends Controller
{
    public function __construct(private readonly TelegramService $telegram) {}

    public function index(Request $request): JsonResponse
    {
        $configured = $this->telegram->isConfigured();
        $secret = $this->telegram->webhookSecret();

        $botInfo = null;
        $webhook = null;

        if ($configured) {
            $me = $this->telegram->getMe();
            if ($me) {
                $botInfo = [
                    'id' => $me['id'] ?? null,
                    'username' => $me['username'] ?? null,
                    'firstName' => $me['first_name'] ?? null,
                ];
            }

            $info = $this->telegram->getWebhookInfo();
            if ($info) {
                $webhook = [
                    'url' => $info['url'] ?: null,
                    'pendingUpdateCount' => $info['pending_update_count'] ?? 0,
                    'lastErrorMessage' => $info['last_error_message'] ?? null,
                    'lastErrorDate' => isset($info['last_error_date']) ? date('c', $info['last_error_date']) : null,
                ];
            }
        }

        return response()->json([
            'configured' => $configured,
            'demoMode' => ! $configured,
            'botInfo' => $botInfo,
            'linkedSuppliers' => Supplier::whereNotNull('telegram_chat_id')->count(),
            'webhook' => $webhook,
            'webhookSecretConfigured' => ! empty($secret),
            'suggestedWebhookBaseUrl' => $request->getSchemeAndHttpHost(),
        ]);
    }
}
