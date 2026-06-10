<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

class AddArticleAccessColumnsToUsersTable extends Migration
{
    public function up()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->boolean('can_create')->default(false);
            $table->boolean('can_review')->default(false);
            $table->boolean('can_publish')->default(false);
        });
    }

    public function down()
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('can_create');
            $table->dropColumn('can_review');
            $table->dropColumn('can_publish');
        });
    }
}
