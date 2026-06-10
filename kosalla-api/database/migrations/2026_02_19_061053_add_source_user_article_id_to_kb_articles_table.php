<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('kb_articles', function (Blueprint $table) {
            // nullable biar aman untuk artikel lama yang bukan dari user_articles
            $table->unsignedBigInteger('source_user_article_id')->nullable();

            // custom index name biar aman di postgres (limit nama index)
            $table->unique('source_user_article_id', 'kb_articles_source_user_article_id_uq');

            // FK opsional tapi bagus untuk referensi
            $table->foreign('source_user_article_id', 'kb_articles_source_user_article_id_fk')
                ->references('id')
                ->on('user_articles')
                ->nullOnDelete();
        });
    }

    public function down(): void
    {
        Schema::table('kb_articles', function (Blueprint $table) {
            $table->dropForeign('kb_articles_source_user_article_id_fk');
            $table->dropUnique('kb_articles_source_user_article_id_uq');
            $table->dropColumn('source_user_article_id');
        });
    }
};
