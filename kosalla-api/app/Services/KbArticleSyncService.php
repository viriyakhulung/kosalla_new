<?php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class KbArticleSyncService
{
    /**
     * Upsert kb_articles dari user_articles yang sudah published.
     * Return kb_article_id.
     */
    public function upsertFromUserArticle(object $ua): int
    {
        // cari existing kb_article by source_user_article_id
        $existing = DB::table('kb_articles')
            ->where('source_user_article_id', (int)$ua->id)
            ->first(['id', 'slug', 'applies_to_version']);

        $now = now();

        if ($existing) {
            $update = [
                'product_id'   => (int) $ua->product_id,
                'title'        => (string) $ua->title,
                'body_html'    => (string) $ua->body_html,
                'status'       => 'published',

                'reviewed_at'  => $ua->reviewed_at ?? null,
                'reviewed_by'  => $ua->reviewed_by ?? null,

                'published_at' => $ua->published_at ?? $now,
                'published_by' => $ua->published_by ?? null,

                'updated_at'   => $now,
            ];

            // kalau slug kosong (harusnya jarang), generate slug unik
            if (empty($existing->slug)) {
                $update['slug'] = $this->generateUniqueSlug((string)$ua->title, (int)$ua->id, (int)$existing->id);
            }

            DB::table('kb_articles')->where('id', (int)$existing->id)->update($update);
            return (int)$existing->id;
        }

        // insert baru
        $slug = $this->generateUniqueSlug((string)$ua->title, (int)$ua->id, null);

        $id = DB::table('kb_articles')->insertGetId([
            'source_user_article_id' => (int) $ua->id,

            'product_id'   => (int) $ua->product_id,
            'title'        => (string) $ua->title,
            'slug'         => $slug,
            'body_html'    => (string) $ua->body_html,

            // tidak ada di user_articles, biarkan null (atau nanti kamu tambah field di user_articles kalau perlu)
            'applies_to_version' => null,

            'status'       => 'published',

            'reviewed_at'  => $ua->reviewed_at ?? null,
            'reviewed_by'  => $ua->reviewed_by ?? null,

            'published_at' => $ua->published_at ?? $now,
            'published_by' => $ua->published_by ?? null,

            // audit: created_by di kb_articles kita set ke author (created_by user_articles)
            'created_by'   => $ua->created_by ?? null,

            'created_at'   => $now,
            'updated_at'   => $now,
        ]);

        return (int)$id;
    }

    private function generateUniqueSlug(string $title, int $fallbackId, ?int $excludeKbId): string
    {
        $base = Str::slug($title);
        if ($base === '') $base = 'article';

        // coba slug base dulu
        if (!$this->slugExists($base, $excludeKbId)) {
            return $base;
        }

        // fallback: base-{user_article_id}
        $withId = $base . '-' . $fallbackId;
        if (!$this->slugExists($withId, $excludeKbId)) {
            return $withId;
        }

        // last resort: base-{id}-{n}
        $n = 2;
        while (true) {
            $candidate = $withId . '-' . $n;
            if (!$this->slugExists($candidate, $excludeKbId)) {
                return $candidate;
            }
            $n++;
        }
    }

    private function slugExists(string $slug, ?int $excludeKbId): bool
    {
        $q = DB::table('kb_articles')->where('slug', $slug);
        if ($excludeKbId) $q->where('id', '<>', $excludeKbId);
        return $q->exists();
    }
}
