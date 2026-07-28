<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TelegramOutbox;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TelegramOutboxController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $q = TelegramOutbox::with('supplier:id,legal_name');

        if ($status = $request->input('status')) {
            $q->where('status', $status);
        }
        if ($term = $request->string('q')->toString()) {
            $t = "%{$term}%";
            $q->where(function ($qq) use ($t) {
                $qq->where('message', 'like', $t)
                    ->orWhere('supplier_name', 'like', $t)
                    ->orWhere('chat_id', 'like', $t)
                    ->orWhere('error', 'like', $t);
            });
        }

        $page = $q->orderByDesc('id')->limit(200)->get();

        return response()->json($page->map(fn ($o) => [
            'id' => $o->id,
            'supplierId' => $o->supplier_id,
            'supplierName' => $o->supplier_name ?? $o->supplier?->legal_name,
            'chatId' => $o->chat_id,
            'message' => $o->message,
            'status' => $o->status,
            'error' => $o->error,
            'payload' => $o->payload,
            'sentAt' => $o->sent_at?->toIso8601String(),
            'createdAt' => $o->created_at?->toIso8601String(),
        ]));
    }
}
