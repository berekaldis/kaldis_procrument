<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $notifications = Notification::where(function ($q) use ($user) {
            $q->whereNull('role')->orWhere('role', $user->role);
        })
            ->orderByDesc('id')
            ->limit(100)
            ->get();

        $unread = Notification::where(function ($q) use ($user) {
            $q->whereNull('role')->orWhere('role', $user->role);
        })->where('read', false)->count();

        return response()->json([
            'notifications' => $notifications->map(fn ($n) => $this->serialize($n)),
            'unreadCount' => $unread,
        ]);
    }

    public function updateAll(Request $request): JsonResponse
    {
        $user = $request->user();
        Notification::where(function ($q) use ($user) {
            $q->whereNull('role')->orWhere('role', $user->role);
        })->where('read', false)->update(['read' => true]);

        return response()->json(['ok' => true]);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $n = Notification::findOrFail($id);
        $n->read = true;
        $n->save();

        return response()->json(['ok' => true, 'notification' => $this->serialize($n)]);
    }

    public function destroy(int $id): JsonResponse
    {
        Notification::findOrFail($id)->delete();

        return response()->json(['ok' => true]);
    }

    private function serialize(Notification $n): array
    {
        return [
            'id' => $n->id,
            'role' => $n->role,
            'title' => $n->title,
            'message' => $n->message,
            'type' => $n->type,
            'read' => (bool) $n->read,
            'link' => $n->link,
            'createdAt' => $n->created_at?->toIso8601String(),
        ];
    }
}
