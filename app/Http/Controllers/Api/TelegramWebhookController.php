<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProformaRequest;
use App\Models\ProformaRequestSupplier;
use App\Models\Supplier;
use App\Models\TelegramSession;
use App\Services\AuditService;
use App\Services\ProformaIngestService;
use App\Services\TelegramMessages;
use App\Services\TelegramService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class TelegramWebhookController extends Controller
{
    public function __construct(
        private readonly TelegramService $telegram,
        private readonly ProformaIngestService $ingest,
        private readonly AuditService $audit,
    ) {}

    /**
     * Public inbound endpoint Telegram POSTs updates to. Protected by a
     * secret path segment plus (when Telegram sends it) the
     * X-Telegram-Bot-Api-Secret-Token header — both must match our
     * configured secret, so unauthenticated callers can't forge suppliers'
     * proforma submissions.
     */
    public function receive(Request $request, string $secret): JsonResponse
    {
        $expected = $this->telegram->webhookSecret();

        if (empty($expected) || ! hash_equals($expected, $secret)) {
            abort(404);
        }

        $header = $request->header('X-Telegram-Bot-Api-Secret-Token');
        if ($header !== null && ! hash_equals($expected, $header)) {
            abort(404);
        }

        try {
            $this->handleUpdate($request->input('message', []));
        } catch (\Throwable $e) {
            // Always ack with 200 so Telegram doesn't hammer retries on our
            // bugs — the failure is logged for investigation instead.
            Log::error('Telegram webhook handling failed: '.$e->getMessage(), ['exception' => $e]);
        }

        return response()->json(['ok' => true]);
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate(['url' => ['required', 'url']]);

        $secret = $this->telegram->webhookSecret();
        if (empty($secret)) {
            return response()->json(['error' => 'Set a webhook secret in Settings first.'], 422);
        }

        $webhookUrl = rtrim($request->input('url'), '/').'/api/telegram/webhook/'.$secret;
        $result = $this->telegram->setWebhook($webhookUrl, $secret);

        if (! $result['ok']) {
            return response()->json(['error' => $result['error'] ?? 'Failed to register webhook.'], 422);
        }

        $this->audit->log($request->user()->name, 'telegram', 'webhook', 'registered', 'Registered Telegram webhook at '.$webhookUrl);

        return response()->json(['ok' => true, 'webhookUrl' => $webhookUrl]);
    }

    public function remove(Request $request): JsonResponse
    {
        $result = $this->telegram->deleteWebhook();

        if (! $result['ok']) {
            return response()->json(['error' => $result['error'] ?? 'Failed to remove webhook.'], 422);
        }

        $this->audit->log($request->user()->name, 'telegram', 'webhook', 'removed', 'Removed Telegram webhook.');

        return response()->json(['ok' => true]);
    }

    private function handleUpdate(array $message): void
    {
        $chatId = (string) ($message['chat']['id'] ?? '');
        $fromUsername = $message['from']['username'] ?? null;
        $text = trim((string) ($message['text'] ?? $message['caption'] ?? ''));

        if ($chatId === '') {
            return;
        }

        $supplier = Supplier::where('telegram_chat_id', $chatId)->first();
        $session = TelegramSession::forChat($chatId);

        if ($supplier) {
            $this->handleLinkedMessage($supplier, $session, $message, $text);

            return;
        }

        $this->handleUnlinkedMessage($chatId, $fromUsername, $session, $text);
    }

    private function handleUnlinkedMessage(string $chatId, ?string $username, TelegramSession $session, string $text): void
    {
        if ($text === '' || str_starts_with(strtolower($text), '/start')) {
            $session->update(['language' => null]);
            $this->telegram->sendWithKeyboard(
                $chatId,
                TelegramMessages::bilingualLanguagePrompt(),
                [TelegramMessages::LANGUAGE_BUTTONS],
            );

            return;
        }

        if ($session->language === null) {
            $lang = TelegramMessages::resolveLanguageChoice($text);

            if ($lang === null) {
                $this->telegram->sendWithKeyboard(
                    $chatId,
                    TelegramMessages::bilingualLanguagePrompt(),
                    [TelegramMessages::LANGUAGE_BUTTONS],
                );

                return;
            }

            $session->update(['language' => $lang]);
            $this->telegram->sendRaw($chatId, TelegramMessages::get('ask_tin', $lang));

            return;
        }

        $lang = $session->language;
        $supplier = Supplier::where('tin', $text)->first();

        if (! $supplier) {
            $this->telegram->sendRaw($chatId, TelegramMessages::get('tin_not_found', $lang, ['tin' => $text]));

            return;
        }

        $supplier->update([
            'telegram_chat_id' => $chatId,
            'telegram_username' => $username,
            'language' => $lang,
        ]);

        $this->audit->log(
            'Telegram Bot',
            'supplier',
            (string) $supplier->id,
            'telegram_linked',
            'Supplier "'.$supplier->legal_name.'" linked their Telegram chat (language: '.$lang.').',
        );

        $this->telegram->sendRaw($chatId, TelegramMessages::get('linked', $lang, ['name' => $supplier->legal_name]));
        $session->delete();
    }

    private function handleLinkedMessage(Supplier $supplier, TelegramSession $session, array $message, string $text): void
    {
        $lang = $supplier->language ?: 'en';
        $chatId = $supplier->telegram_chat_id;

        if (strtolower($text) === '/language') {
            $this->telegram->sendWithKeyboard($chatId, TelegramMessages::bilingualLanguagePrompt(), [TelegramMessages::LANGUAGE_BUTTONS]);
            $session->update(['pending_action' => 'relink_language', 'pending_payload' => null]);

            return;
        }

        if ($session->pending_action === 'relink_language') {
            $newLang = TelegramMessages::resolveLanguageChoice($text);

            if ($newLang === null) {
                $this->telegram->sendWithKeyboard($chatId, TelegramMessages::bilingualLanguagePrompt(), [TelegramMessages::LANGUAGE_BUTTONS]);

                return;
            }

            $supplier->update(['language' => $newLang]);
            $session->clearPending();
            $this->telegram->sendRaw($chatId, TelegramMessages::get('language_changed', $newLang));

            return;
        }

        if ($session->pending_action === 'select_request') {
            $this->handleRequestSelection($supplier, $session, $text, $lang);

            return;
        }

        $this->handleProformaSubmission($supplier, $session, $message, $text, $lang);
    }

    private function handleProformaSubmission(Supplier $supplier, TelegramSession $session, array $message, string $text, string $lang): void
    {
        $candidates = ProformaRequestSupplier::with('request')
            ->where('supplier_id', $supplier->id)
            ->where('status', 'notified')
            ->get()
            ->filter(fn ($rs) => $rs->request !== null)
            ->values();

        if ($candidates->isEmpty()) {
            $this->telegram->sendRaw($supplier->telegram_chat_id, TelegramMessages::get('no_open_request', $lang));

            return;
        }

        if ($text === '' && empty($message['document']) && empty($message['photo'])) {
            return;
        }

        if ($candidates->count() === 1) {
            $this->ingestSubmission($supplier, $candidates->first()->request, $message, $text, $lang);

            return;
        }

        // Ambiguous — cache the submission and ask which open request it's for.
        $lines = [TelegramMessages::get('choose_request_header', $lang)];
        $ids = [];
        foreach ($candidates as $i => $rs) {
            $lines[] = ($i + 1).") {$rs->request->reference_no} — {$rs->request->title}";
            $ids[] = $rs->request->id;
        }

        $session->update([
            'pending_action' => 'select_request',
            'pending_payload' => [
                'request_ids' => $ids,
                'text' => $text,
                'document' => $message['document'] ?? null,
                'photo' => $message['photo'] ?? null,
                'message_id' => $message['message_id'] ?? null,
            ],
        ]);

        $this->telegram->sendRaw($supplier->telegram_chat_id, implode("\n", $lines));
    }

    private function handleRequestSelection(Supplier $supplier, TelegramSession $session, string $text, string $lang): void
    {
        if (strtolower(trim($text)) === '/cancel') {
            $session->clearPending();
            $this->telegram->sendRaw($supplier->telegram_chat_id, TelegramMessages::get('selection_cancelled', $lang));

            return;
        }

        $payload = $session->pending_payload ?? [];
        $ids = $payload['request_ids'] ?? [];
        $trimmed = trim($text);
        $index = ((int) $trimmed) - 1;

        if (! ctype_digit($trimmed) || $index < 0 || $index >= count($ids)) {
            $this->telegram->sendRaw($supplier->telegram_chat_id, TelegramMessages::get('invalid_selection', $lang));

            return;
        }

        $pr = ProformaRequest::find($ids[$index]);
        $session->clearPending();

        if (! $pr) {
            $this->telegram->sendRaw($supplier->telegram_chat_id, TelegramMessages::get('no_open_request', $lang));

            return;
        }

        $reconstructed = [
            'message_id' => $payload['message_id'] ?? null,
            'document' => $payload['document'] ?? null,
            'photo' => $payload['photo'] ?? null,
        ];

        $this->ingestSubmission($supplier, $pr, $reconstructed, $payload['text'] ?? '', $lang);
    }

    private function ingestSubmission(Supplier $supplier, ProformaRequest $pr, array $message, string $text, string $lang): void
    {
        $filePath = null;
        $fileName = null;
        $fileType = null;

        $document = $message['document'] ?? null;
        $photos = $message['photo'] ?? null;

        if ($document) {
            $download = $this->telegram->downloadFile(
                $document['file_id'],
                $document['file_name'] ?? null,
                $document['mime_type'] ?? null,
            );
            [$filePath, $fileName, $fileType] = $this->persistDownload($download, 'pdf');
        } elseif (is_array($photos) && count($photos) > 0) {
            $largest = end($photos);
            $download = $this->telegram->downloadFile($largest['file_id'], null, 'image/jpeg');
            [$filePath, $fileName, $fileType] = $this->persistDownload($download, 'jpg');
        }

        $proforma = $this->ingest->receive($pr, $supplier, [
            'reference_no' => 'TG-'.strtoupper(substr(md5(uniqid('', true)), 0, 8)),
            'message' => $text !== '' ? $text : null,
            'file_path' => $filePath,
            'file_name' => $fileName,
            'file_type' => $fileType,
            'telegram_message_id' => (string) ($message['message_id'] ?? ''),
            'received_via' => 'telegram',
        ], $supplier->legal_name.' (via Telegram)');

        $this->telegram->sendRaw(
            $supplier->telegram_chat_id,
            TelegramMessages::get('received_confirmation', $lang, ['ref' => $pr->reference_no, 'title' => $pr->title]),
        );

        Log::info('Telegram proforma received', ['proforma_id' => $proforma->id, 'supplier_id' => $supplier->id]);
    }

    /**
     * @return array{0: ?string, 1: ?string, 2: ?string} [filePath, fileName, fileType]
     */
    private function persistDownload(?array $download, string $fallbackExt): array
    {
        if (! $download) {
            return [null, null, null];
        }

        $original = $download['fileName'] ?: ('file.'.$fallbackExt);
        $stored = Str::random(12).'_'.preg_replace('/[^A-Za-z0-9._-]/', '_', $original);

        $dir = public_path('proformas');
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        file_put_contents($dir.DIRECTORY_SEPARATOR.$stored, $download['contents']);

        return ['proformas/'.$stored, $original, $download['mimeType']];
    }
}
