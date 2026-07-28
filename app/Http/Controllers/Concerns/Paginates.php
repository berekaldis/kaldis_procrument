<?php

namespace App\Http\Controllers\Concerns;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

trait Paginates
{
    /**
     * Apply optional page/perPage query params to a query. When no `page`
     * param is given, falls back to a flat limit — preserving the original
     * unpaginated array response for dropdown/picker consumers that just
     * want "the list" and don't know about paging.
     *
     * @return array{0: Collection, 1: array|null}
     */
    protected function paginateOrLimit(Builder $query, Request $request, int $fallbackLimit = 500, int $defaultPerPage = 20): array
    {
        if (! $request->has('page')) {
            return [$query->limit($fallbackLimit)->get(), null];
        }

        $perPage = max(1, min(100, (int) ($request->input('perPage') ?: $defaultPerPage)));
        $paginator = $query->paginate($perPage);

        return [$paginator->getCollection(), [
            'currentPage' => $paginator->currentPage(),
            'lastPage' => $paginator->lastPage(),
            'total' => $paginator->total(),
            'perPage' => $paginator->perPage(),
        ]];
    }

    protected function withPaginationHeaders(\Illuminate\Http\JsonResponse $response, ?array $meta): \Illuminate\Http\JsonResponse
    {
        if (! $meta) {
            return $response;
        }

        return $response
            ->header('X-Total-Count', (string) $meta['total'])
            ->header('X-Page', (string) $meta['currentPage'])
            ->header('X-Last-Page', (string) $meta['lastPage'])
            ->header('X-Per-Page', (string) $meta['perPage']);
    }
}
